/**
 * Gurukul Football Academy - Blog Service & Realtime Cloud Database Store
 * Supports Supabase PostgreSQL cloud database + offline caching + instant WebSocket sync.
 */

import { getSupabaseClient } from './db.js';

const STORAGE_KEY = 'gurukul_blog_posts_v1';
const SYNC_CHANNEL_NAME = 'gurukul_blog_sync_channel';

// Default Seed Articles for Gurukul FC
const DEFAULT_POSTS = [
  {
    id: 'post-1',
    slug: 'grassroots-to-glory-division-a-pathway',
    title: 'Grassroots to Glory: How Gurukul FC Develops Elite Division A Athletes',
    category: 'Academy News',
    tag: 'Elite Pathway',
    readTime: '4 min read',
    date: 'Aug 14, 2026',
    author: {
      name: 'Coach Aryan Sharma',
      role: 'Head of Youth Development (UEFA B)',
      avatar: '/assets/gurukul-logo.png'
    },
    image: '/assets/adivision1.png',
    featured: true,
    status: 'published',
    excerpt: 'Discover the disciplined methodology, European tactical conditioning, and competitive pathway that propels young grassroots talents straight into Delhi Division A leagues.',
    content: `## The Philosophy of Modern Youth Development

At **Gurukul Football Academy**, our mission goes far beyond recreational training. We build technically proficient, tactically intelligent, and mentally resilient footballers prepared for the demanding standards of top-tier competitive leagues.

### 1. Structural Progression from Grassroots to Division A
Our academy follows a phased developmental curve tailored for modern football:
- **Foundation Phase (U-6 to U-9)**: Ball mastery, 1v1 confidence, coordination, and love for the game.
- **Youth Development Phase (U-10 to U-14)**: Positional awareness, spatial orientation, scanning habits, and transition play.
- **Professional Prep & Division A (U-15+)**: High-tempo match simulation, UEFA-structured pressing systems, biometric load management, and league competition.

> *"Great footballers aren't born in the stadium lights; they are forged in the unseen thousands of technical repetitions on the training turf."* — Coach Aryan

### 2. High Performance Facilities & Biometric Tracking
Every player at Gurukul FC undergoes regular performance assessments. We measure:
1. **Sprint acceleration and deceleration mechanics**
2. **First-touch efficiency under pressurized tight spaces**
3. **Cardiovascular recovery indices using GPS tracking**

Join our upcoming academy trials and take your first step toward professional football.`
  },
  {
    id: 'post-2',
    slug: 'mastering-modern-high-press-tactics',
    title: 'Mastering the High-Press: Tactical Insights from UEFA Licensed Coaches',
    category: 'Tactics & Drills',
    tag: 'Tactical Analysis',
    readTime: '6 min read',
    date: 'Aug 10, 2026',
    author: {
      name: 'Coach David Miller',
      role: 'Senior Tactical Coach (AFC Pro)',
      avatar: '/assets/gurukul-logo.png'
    },
    image: '/assets/pitch-corner.png',
    featured: false,
    status: 'published',
    excerpt: 'A deep tactical breakdown of modern pressing triggers, compact defensive blocks, and high-tempo counter-attacks executed by our senior squads.',
    content: `## The Modern Pressing Dynamic in Competitive Football

In the modern era of fast-paced football, defensive organization begins in the opponent's defensive third. A well-orchestrated high press is not chaotic running—it is calculated collective trapping.

### The 3 Core Triggers of Gurukul FC's Pressing System:
1. **The Backward Pass Trigger**: When an opposing midfielder passes back to a center-back whose body orientation is closed, our frontline initiates an immediate synchronized squeeze.
2. **The Aerial / Loose Touch Trigger**: A heavy touch in midfield is the signal for our #8 and #10 to close passing lanes and double-team the ball carrier.
3. **The Sideline Trap**: We steer the ball carrier toward the touchline, effectively cutting off half the pitch and isolating the fullback.

### Key Coaching Points
- Keep 8-10 meters maximum distance between tactical lines.
- Always protect the central vertical corridor.
- Anticipate the second ball before the challenge is made.`
  },
  {
    id: 'post-3',
    slug: 'nutrition-recovery-elite-footballer-routine',
    title: "Nutrition & Recovery: The Elite Footballer's Daily Routine",
    category: 'Fitness & Health',
    tag: 'Nutrition',
    readTime: '5 min read',
    date: 'Aug 06, 2026',
    author: {
      name: 'Dr. Rohit Verma',
      role: 'Head of Sports Physiotherapy & Nutrition',
      avatar: '/assets/gurukul-logo.png'
    },
    image: '/assets/elite-player.png',
    featured: false,
    status: 'published',
    excerpt: 'How top youth athletes fuel their bodies, prevent soft-tissue injuries, and maintain peak cardiovascular output through scientifically backed nutrition protocols.',
    content: `## Peak Output Starts Off the Pitch

Training hard is only 50% of the equation. Without proper nutrient timing and muscle recovery protocols, talent plateaus and injury risks spike.

### The 4 Pillars of Football Conditioning:
- **Pre-Training Fueling (2 Hours Before)**: Complex carbohydrates (oats, brown rice, bananas) combined with light protein and 500ml hydration.
- **The 30-Minute Anabolic Recovery Window**: Whey/plant protein with simple carbohydrates to instantly restock depleted glycogen stores.
- **Sleep Architecture**: 8 to 9 hours of uninterrupted sleep for human growth hormone (HGH) release and neural recovery.
- **Active Hydrotherapy**: Cold-water immersion and mobility foam rolling after intense 90-minute league fixtures.`
  },
  {
    id: 'post-4',
    slug: 'delhi-youth-championship-triumph-highlights',
    title: 'Delhi Youth Championship Triumph: Highlights, Tactics & MVP Ratings',
    category: 'Match Reports',
    tag: 'Championship',
    readTime: '4 min read',
    date: 'Jul 28, 2026',
    author: {
      name: 'Gurukul FC Editorial',
      role: 'Media & Academy Correspondent',
      avatar: '/assets/gurukul-logo.png'
    },
    image: '/assets/squad-celebration.png',
    featured: false,
    status: 'published',
    excerpt: 'Relive the electric 3-1 championship final victory of our U-17 squad as they lifted the prestigious Delhi State Youth Cup in front of a roaring crowd.',
    content: `## An Unforgettable Night for Gurukul Football Academy

Under the stadium floodlights, the **Gurukul FC U-17 squad** produced a masterclass in tactical discipline and clinical finishing to secure a 3-1 victory in the Grand Final.

### Match Highlights & Key Moments:
- **14th Minute (1-0)**: An exquisite curling free-kick into the top right corner broke the deadlock.
- **43rd Minute (2-0)**: A rapid 4-pass transition from our defensive corner straight to a clinical finish.
- **78th Minute (3-1)**: A thunderous strike sealed the silverware and sent the bench into jubilation.

### MVP Performance:
Our captain commanded the midfield with an 89% pass completion rate, 7 ground duels won, and 1 assist, earning the Player of the Tournament trophy.`
  },
  {
    id: 'post-5',
    slug: 'biometrics-and-data-in-youth-football',
    title: 'Biomechanical Lab Insights: How Data is Maximizing Player Speed & Agility',
    category: 'Academy News',
    tag: 'Sports Science',
    readTime: '5 min read',
    date: 'Jul 20, 2026',
    author: {
      name: 'Karan Malhotra',
      role: 'Lead Performance Data Analyst',
      avatar: '/assets/gurukul-logo.png'
    },
    image: '/assets/arena-dome.png',
    featured: false,
    status: 'published',
    excerpt: 'An inside look at our state-of-the-art sports science lab, high-speed camera gait analysis, and how tailored agility training prevents ACL tears.',
    content: `## Data-Driven Player Development

Modern football has evolved into a game of split seconds and explosive physical margins. At Gurukul FC, subjective coaching intuition is backed by objective sports science.

### What We Measure in our High-Tech Labs:
1. **Force Plate Asymmetry**: Identifying strength discrepancies between left and right legs to prevent hamstring and ACL strains.
2. **Gait Mechanics & Running Economy**: Optimizing stride frequency and foot plant angle for explosive bursts.
3. **Reaction Time & Peripheral Vision**: Neuro-athletic drills that sharpen in-game decision making under high pressure.`
  },
  {
    id: 'post-6',
    slug: 'mindset-of-a-champion-mental-resilience',
    title: 'The Mindset of a Champion: Building Mental Resilience in Young Athletes',
    category: 'Youth Development',
    tag: 'Psychology',
    readTime: '4 min read',
    date: 'Jul 12, 2026',
    author: {
      name: 'Coach Aryan Sharma',
      role: 'Head of Youth Development (UEFA B)',
      avatar: '/assets/gurukul-logo.png'
    },
    image: '/assets/trophy-victory.png',
    featured: false,
    status: 'published',
    excerpt: 'Why mental toughness, emotional composure, and handling adversity on the pitch are the true differentiators between good players and world-class professionals.',
    content: `## Beyond Physical Skill: The Mental Edge

The difference between two players with equal technical ability always comes down to what happens between their ears when the pressure mounts.

### Three Mindset Habits We Instill at Gurukul:
- **Embracing Mistakes as Data**: A misplaced pass is not a failure; it is immediate real-time feedback for the next possession.
- **The "Next 5 Seconds" Rule**: When a goal is conceded or a foul is called, players reset mentally within 5 seconds and focus on the immediate next action.
- **Leadership at Every Age**: Every player is taught vocal communication, positive reinforcement, and holding teammates accountable.`
  }
];

// Realtime Channel
let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported, falling back to storage events', e);
  }
}

// Setup Supabase Realtime WebSocket listener
let isCloudRealtimeAttached = false;
function initCloudRealtime() {
  if (isCloudRealtimeAttached || typeof window === 'undefined') return;
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, async () => {
        await syncFromCloud();
      })
      .subscribe();
    isCloudRealtimeAttached = true;
  } catch (e) {
    console.warn('Could not attach Supabase realtime listener:', e);
  }
}

/**
 * Syncs latest data from Supabase Cloud PostgreSQL into local cache
 */
export async function syncFromCloud() {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      const mapped = data.map(row => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        category: row.category,
        tag: row.tag,
        readTime: row.read_time,
        date: row.date,
        author: {
          name: row.author_name,
          role: row.author_role,
          avatar: row.author_avatar || '/assets/gurukul-logo.png'
        },
        image: row.image,
        featured: row.featured,
        status: row.status,
        excerpt: row.excerpt,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
      notifyBlogUpdated('cloud_sync', null);
    }
  } catch (e) {
    console.warn('Cloud sync attempt finished with local fallback', e);
  }
}

// Trigger initial cloud sync & realtime listener
if (typeof window !== 'undefined') {
  initCloudRealtime();
  syncFromCloud();
}

/**
 * Initializes and retrieves all posts from localStorage (seeding default if empty)
 */
export function getPosts() {
  if (typeof window === 'undefined') return DEFAULT_POSTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_POSTS));
      return DEFAULT_POSTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_POSTS));
      return DEFAULT_POSTS;
    }
    return parsed;
  } catch (e) {
    console.error('Error loading posts from storage:', e);
    return DEFAULT_POSTS;
  }
}

/**
 * Returns only published posts sorted by newest date
 */
export function getPublishedPosts() {
  const posts = getPosts();
  return posts.filter(p => p.status === 'published');
}

/**
 * Gets a post by its unique ID
 */
export function getPostById(id) {
  const posts = getPosts();
  return posts.find(p => p.id === id) || null;
}

/**
 * Gets a post by its URL slug
 */
export function getPostBySlug(slug) {
  const posts = getPosts();
  return posts.find(p => p.slug === slug) || null;
}

/**
 * Saves a new post or updates an existing post, syncing to both Supabase Cloud DB and local storage!
 */
export async function savePost(postData) {
  const posts = getPosts();
  let updatedPosts;

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  let savedPostObj;

  if (postData.id) {
    // Update existing
    const index = posts.findIndex(p => p.id === postData.id);
    if (index !== -1) {
      const existing = posts[index];
      savedPostObj = {
        ...existing,
        ...postData,
        updatedAt: new Date().toISOString()
      };
      posts[index] = savedPostObj;
      updatedPosts = [...posts];
    } else {
      savedPostObj = postData;
      updatedPosts = [postData, ...posts];
    }
  } else {
    // Create new
    const newId = 'post-' + Date.now();
    const slug = (postData.title || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    savedPostObj = {
      id: newId,
      slug: slug || ('post-' + Date.now()),
      title: postData.title || 'Untitled Post',
      category: postData.category || 'Academy News',
      tag: postData.tag || 'General',
      readTime: postData.readTime || calculateReadTime(postData.content || ''),
      date: postData.date || formattedDate,
      author: postData.author || {
        name: 'Gurukul FC Writer',
        role: 'Academy Staff',
        avatar: '/assets/gurukul-logo.png'
      },
      image: postData.image || '/assets/squad-celebration.png',
      featured: Boolean(postData.featured),
      status: postData.status || 'published',
      excerpt: postData.excerpt || '',
      content: postData.content || '',
      createdAt: new Date().toISOString()
    };

    updatedPosts = [savedPostObj, ...posts];
  }

  // If set to featured, unset others
  if (postData.featured) {
    const targetId = savedPostObj.id;
    updatedPosts = updatedPosts.map(p => ({
      ...p,
      featured: p.id === targetId
    }));
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
  notifyBlogUpdated('save', savedPostObj.id);

  // Cloud Database write (if Supabase is connected)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('posts').upsert({
        id: savedPostObj.id,
        slug: savedPostObj.slug,
        title: savedPostObj.title,
        category: savedPostObj.category,
        tag: savedPostObj.tag,
        read_time: savedPostObj.readTime,
        date: savedPostObj.date,
        author_name: savedPostObj.author?.name || 'Coach Aryan Sharma',
        author_role: savedPostObj.author?.role || 'Academy Coach',
        author_avatar: savedPostObj.author?.avatar || '/assets/gurukul-logo.png',
        image: savedPostObj.image,
        featured: savedPostObj.featured,
        status: savedPostObj.status,
        excerpt: savedPostObj.excerpt,
        content: savedPostObj.content,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Cloud DB upsert queued or failed, saved to local cache', e);
    }
  }

  return updatedPosts;
}

/**
 * Deletes a post by ID and syncs across Cloud DB & local storage
 */
export async function deletePost(id) {
  const posts = getPosts();
  const filtered = posts.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  notifyBlogUpdated('delete', id);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('posts').delete().eq('id', id);
    } catch (e) {
      console.warn('Cloud DB delete error', e);
    }
  }

  return filtered;
}

/**
 * Toggles a post between 'published' and 'draft'
 */
export async function togglePublishStatus(id) {
  const posts = getPosts();
  const target = posts.find(p => p.id === id);
  if (!target) return posts;

  target.status = target.status === 'published' ? 'draft' : 'published';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  notifyBlogUpdated('status_change', id);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('posts').update({ status: target.status }).eq('id', id);
    } catch (e) {}
  }

  return posts;
}

/**
 * Resets storage back to default initial articles
 */
export function resetToDefaults() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_POSTS));
  notifyBlogUpdated('reset', null);
  return DEFAULT_POSTS;
}

/**
 * Calculates estimated reading time from word count
 */
export function calculateReadTime(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} min read`;
}

/**
 * Broadcasts an update event so that any open Home or Blog pages update instantly
 */
function notifyBlogUpdated(action, postId) {
  const payload = { action, postId, timestamp: Date.now() };

  // 1. Broadcast channel (across browser tabs)
  if (broadcastChannel) {
    broadcastChannel.postMessage(payload);
  }

  // 2. Custom event (for components on the exact same page)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gurukul_blog_sync', { detail: payload }));
  }
}

/**
 * Subscribes to real-time blog updates across tabs & locally
 */
export function onBlogUpdate(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e) => {
    callback(e.detail || { action: 'update', timestamp: Date.now() });
  };

  const handleStorageEvent = (e) => {
    if (e.key === STORAGE_KEY) {
      callback({ action: 'storage_change', timestamp: Date.now() });
    }
  };

  const handleBroadcastMessage = (e) => {
    callback(e.data || { action: 'broadcast', timestamp: Date.now() });
  };

  window.addEventListener('gurukul_blog_sync', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  return () => {
    window.removeEventListener('gurukul_blog_sync', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}

/**
 * Simple, secure markdown-to-HTML converter with sports callout formatting
 */
export function renderMarkdown(md) {
  if (!md) return '';
  let html = md;

  // Escape basic raw HTML brackets if needed
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="blog-h3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="blog-h2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="blog-h1">$1</h1>');

  // Blockquotes
  html = html.replace(/^\&gt; (.*$)/gim, '<blockquote class="blog-quote"><div class="quote-bar"></div><p>$1</p></blockquote>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Lists
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="blog-li">$1</li>');
  html = html.replace(/(<li class="blog-li">.*<\/li>)/gms, '<ul class="blog-ul">$1</ul>');

  // Ordered list items
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="blog-oli">$1</li>');

  // Paragraphs
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<h') || p.startsWith('<block') || p.startsWith('<ul') || p.startsWith('<li')) {
      return p;
    }
    return `<p class="blog-p">${p.replace(/\n/g, '<br/>')}</p>`;
  }).join('');

  return html;
}
