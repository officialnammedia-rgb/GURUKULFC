import { createClient } from '@supabase/supabase-js';

// Configuration keys (from env or stored settings)
const SUPABASE_CONFIG_KEY = 'gurukul_supabase_config_v1';

export function getSupabaseConfig() {
  const envUrl = import.meta.env?.VITE_SUPABASE_URL;
  const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, source: 'env' };
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url && parsed.anonKey) {
          return { ...parsed, source: 'storage' };
        }
      }
    } catch (e) {
      console.warn('Could not read stored Supabase config', e);
    }
  }

  return { url: '', anonKey: '', source: 'none' };
}

export function saveSupabaseConfig(url, anonKey) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, anonKey }));
  }
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SUPABASE_CONFIG_KEY);
  }
}

let supabaseInstance = null;

export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  const config = getSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
    }
  }
  return null;
}

export function isCloudDatabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

/* --------------------------------------------------------------------------
   Brute-Force & Rate-Limiting Security
   -------------------------------------------------------------------------- */
const ATTEMPTS_KEY = 'gurukul_auth_attempts_v1';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

export function checkBruteForceLockout() {
  if (typeof window === 'undefined') return { isLocked: false, remainingMs: 0 };
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return { isLocked: false, remainingMs: 0 };
    const data = JSON.parse(raw);
    const now = Date.now();

    if (data.lockoutUntil && now < data.lockoutUntil) {
      return { isLocked: true, remainingMs: data.lockoutUntil - now };
    }

    // Lockout expired, clear
    if (data.lockoutUntil && now >= data.lockoutUntil) {
      localStorage.removeItem(ATTEMPTS_KEY);
      return { isLocked: false, remainingMs: 0 };
    }

    return { isLocked: false, count: data.count || 0 };
  } catch (e) {
    return { isLocked: false, remainingMs: 0 };
  }
}

export function recordFailedAuthAttempt() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    const data = raw ? JSON.parse(raw) : { count: 0 };
    data.count = (data.count || 0) + 1;
    data.lastAttempt = Date.now();

    if (data.count >= MAX_ATTEMPTS) {
      data.lockoutUntil = Date.now() + LOCKOUT_MS;
    }

    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(data));
  } catch (e) {}
}

export function resetFailedAuthAttempts() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ATTEMPTS_KEY);
  } catch (e) {}
}

/* --------------------------------------------------------------------------
   Production Authentication Methods
   -------------------------------------------------------------------------- */
export async function loginWithEmail(email, password) {
  // Check lockout
  const lockout = checkBruteForceLockout();
  if (lockout.isLocked) {
    const minutes = Math.ceil(lockout.remainingMs / 60000);
    throw new Error(`Security Lockout: Too many failed login attempts. Please try again in ${minutes} minutes.`);
  }

  const supabase = getSupabaseClient();

  if (supabase) {
    // Authenticate with real Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      recordFailedAuthAttempt();
      throw error;
    }

    resetFailedAuthAttempts();
    return { user: data.user, session: data.session, mode: 'cloud' };
  }

  // Fallback Local Master Security Mode (when cloud DB is not yet plugged in)
  // Admin credentials: admin@gurukulfc.com / gurukul2026
  if (
    (email.toLowerCase() === 'admin@gurukulfc.com' || email.toLowerCase() === 'writer@gurukulfc.com') &&
    password === 'gurukul2026'
  ) {
    resetFailedAuthAttempts();
    const mockUser = {
      id: 'local-admin-1',
      email,
      role: 'authenticated',
      user_metadata: { name: 'Gurukul FC Editorial Lead' },
    };
    sessionStorage.setItem('gurukul_local_auth_user', JSON.stringify(mockUser));
    return { user: mockUser, mode: 'local' };
  } else {
    recordFailedAuthAttempt();
    throw new Error('Invalid email or password. (Default credentials: admin@gurukulfc.com / gurukul2026)');
  }
}

export async function logoutUser() {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('gurukul_local_auth_user');
    sessionStorage.removeItem('gurukul_admin_auth_v1');
  }
}

export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { user, mode: 'cloud' };
  }

  if (typeof window !== 'undefined') {
    const local = sessionStorage.getItem('gurukul_local_auth_user');
    if (local) {
      try {
        return { user: JSON.parse(local), mode: 'local' };
      } catch (e) {}
    }
  }

  return null;
}
