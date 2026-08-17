import {
  getPosts,
  getPostById,
  savePost,
  deletePost,
  togglePublishStatus,
  onBlogUpdate,
  renderMarkdown,
  calculateReadTime
} from './blogService.js';

import {
  loginWithEmail,
  logoutUser,
  getCurrentUser,
  checkBruteForceLockout
} from './db.js';

let currentTabFilter = 'all';
let currentAdminSearch = '';
let editingPostId = null;
let postPendingDeleteId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  initDashboard();
  initEditor();
  initDeleteModal();

  // Listen to cross-tab & cloud updates to keep dashboard in sync
  onBlogUpdate(() => {
    renderPostsList();
    updateStats();
  });
});

/* --------------------------------------------------------------------------
   1. Authentication & Lock Screen
   -------------------------------------------------------------------------- */
async function initAuth() {
  const lockScreen = document.getElementById('adminLockScreen');
  const dashboard = document.getElementById('adminDashboard');
  const lockForm = document.getElementById('lockScreenForm');
  const emailInput = document.getElementById('authEmailInput');
  const passInput = document.getElementById('authPasswordInput');
  const errorMsg = document.getElementById('lockErrorMsg');
  const lockBtn = document.getElementById('lockPortalBtn');

  // Check if locked out
  const lockout = checkBruteForceLockout();
  if (lockout.isLocked && errorMsg) {
    const mins = Math.ceil(lockout.remainingMs / 60000);
    errorMsg.textContent = `⚠️ Security Lockout: Too many failed login attempts. Retry in ${mins} minutes.`;
  }

  const currentUser = await getCurrentUser();

  if (currentUser) {
    if (lockScreen) lockScreen.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';
  } else {
    if (lockScreen) lockScreen.style.display = 'flex';
    if (dashboard) dashboard.style.display = 'none';
  }

  if (lockForm) {
    lockForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (emailInput?.value || '').trim();
      const password = (passInput?.value || '').trim();

      const btnSubmit = document.getElementById('btnLoginSubmit');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span>Verifying...</span>';
      }

      try {
        const authResult = await loginWithEmail(email, password);
        if (lockScreen) lockScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        if (errorMsg) errorMsg.textContent = '';
        renderPostsList();
        updateStats();
        showToast('Welcome back, Content Creator!', `Authenticated via ${authResult.mode === 'cloud' ? 'Supabase Cloud' : 'Master Editorial session'}.`);
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = `❌ ${err.message || 'Authentication failed.'}`;
        }
        if (passInput) {
          passInput.classList.add('input-shake');
          setTimeout(() => passInput.classList.remove('input-shake'), 600);
        }
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `
            <span>AUTHENTICATE &amp; SIGN IN</span>
            <svg class="tilted-arrow-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          `;
        }
      }
    });
  }

  if (lockBtn) {
    lockBtn.addEventListener('click', async () => {
      await logoutUser();
      if (dashboard) dashboard.style.display = 'none';
      if (lockScreen) lockScreen.style.display = 'flex';
      if (passInput) passInput.value = '';
    });
  }
}

/* --------------------------------------------------------------------------
   2. Dashboard, Stats, and Post Management
   -------------------------------------------------------------------------- */
function initDashboard() {
  const searchInput = document.getElementById('adminSearchInput');
  const tabs = document.querySelectorAll('.admin-tab');
  const openNewBtn = document.getElementById('openNewPostBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentAdminSearch = e.target.value.trim().toLowerCase();
      renderPostsList();
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTabFilter = tab.dataset.filter || 'all';
      renderPostsList();
    });
  });

  if (openNewBtn) {
    openNewBtn.addEventListener('click', () => openEditorModal(null));
  }

  renderPostsList();
  updateStats();
}

function updateStats() {
  const posts = getPosts();
  const published = posts.filter(p => p.status === 'published').length;
  const drafts = posts.filter(p => p.status === 'draft').length;

  const statTotal = document.getElementById('statTotalPosts');
  const statPub = document.getElementById('statPublishedPosts');
  const statDraft = document.getElementById('statDraftPosts');

  const tabAll = document.getElementById('countTabAll');
  const tabPub = document.getElementById('countTabPublished');
  const tabDraft = document.getElementById('countTabDraft');

  if (statTotal) statTotal.textContent = posts.length;
  if (statPub) statPub.textContent = published;
  if (statDraft) statDraft.textContent = drafts;

  if (tabAll) tabAll.textContent = posts.length;
  if (tabPub) tabPub.textContent = published;
  if (tabDraft) tabDraft.textContent = drafts;
}

function renderPostsList() {
  const posts = getPosts();
  const container = document.getElementById('adminPostsList');
  if (!container) return;

  const filtered = posts.filter(post => {
    const matchesFilter =
      currentTabFilter === 'all' ||
      (currentTabFilter === 'published' && post.status === 'published') ||
      (currentTabFilter === 'draft' && post.status === 'draft');

    const matchesSearch =
      !currentAdminSearch ||
      post.title.toLowerCase().includes(currentAdminSearch) ||
      post.category.toLowerCase().includes(currentAdminSearch) ||
      (post.author?.name && post.author.name.toLowerCase().includes(currentAdminSearch));

    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="admin-empty-table">
        <div class="empty-icon">📁</div>
        <h3>No articles found</h3>
        <p>There are no articles matching your filter. Click "+ NEW ARTICLE" above to compose one.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(post => `
    <div class="admin-post-row" data-id="${post.id}">
      <div class="post-row-left">
        <img src="${post.image}" alt="${escapeHTML(post.title)}" class="post-row-thumb" />
        <div class="post-row-details">
          <div class="post-row-tags">
            <span class="row-category-pill">${escapeHTML(post.category)}</span>
            ${post.featured ? '<span class="row-featured-pill">⭐ Spotlight</span>' : ''}
            <span class="row-status-pill ${post.status}">
              ${post.status === 'published' ? '🟢 Published Live' : '🟡 Draft'}
            </span>
          </div>
          <h4 class="post-row-title">${escapeHTML(post.title)}</h4>
          <div class="post-row-meta">
            <span>By <strong>${escapeHTML(post.author?.name || 'Coach')}</strong></span>
            <span>•</span>
            <span>${escapeHTML(post.date)}</span>
            <span>•</span>
            <span>${escapeHTML(post.readTime)}</span>
          </div>
        </div>
      </div>

      <div class="post-row-actions">
        <button class="action-btn toggle-status-btn" data-action="toggle" title="Toggle Published / Draft Status">
          ${post.status === 'published' ? 'Unpublish' : 'Publish'}
        </button>
        <button class="action-btn edit-btn" data-action="edit" title="Edit Article">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <span>Edit</span>
        </button>
        <button class="action-btn delete-btn" data-action="delete" title="Delete Article">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  `).join('');

  // Attach action button events
  container.querySelectorAll('.admin-post-row').forEach(row => {
    const postId = row.dataset.id;
    const toggleBtn = row.querySelector('[data-action="toggle"]');
    const editBtn = row.querySelector('[data-action="edit"]');
    const deleteBtn = row.querySelector('[data-action="delete"]');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await togglePublishStatus(postId);
        renderPostsList();
        updateStats();
        showToast('Status Updated', 'Post publishing status changed and synced live!');
      });
    }

    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditorModal(postId);
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteConfirmModal(postId);
      });
    }
  });
}

/* --------------------------------------------------------------------------
   3. In-App Delete Confirmation Modal (Reliable & Permanent)
   -------------------------------------------------------------------------- */
function initDeleteModal() {
  const modal = document.getElementById('deleteConfirmModal');
  const backdrop = document.getElementById('deleteModalBackdrop');
  const cancelBtn = document.getElementById('cancelDeleteBtn');
  const confirmBtn = document.getElementById('confirmDeleteBtn');

  function closeDeleteModal() {
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    postPendingDeleteId = null;
  }

  if (backdrop) backdrop.addEventListener('click', closeDeleteModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeDeleteModal);

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (!postPendingDeleteId) return;
      const targetId = postPendingDeleteId;
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Deleting...';

      try {
        await deletePost(targetId);
        closeDeleteModal();
        renderPostsList();
        updateStats();
        showToast('Article Deleted', 'Article was removed from your database and live website.');
      } catch (err) {
        alert('Error deleting post: ' + err.message);
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Yes, Delete Article';
      }
    });
  }
}

function openDeleteConfirmModal(postId) {
  postPendingDeleteId = postId;
  const modal = document.getElementById('deleteConfirmModal');
  const titleText = document.getElementById('deleteArticleTitleText');
  const post = getPostById(postId);

  if (titleText) {
    if (post) {
      titleText.innerHTML = `Are you sure you want to permanently delete <strong>"${escapeHTML(post.title)}"</strong>? This will remove it from your live website and database.`;
    } else {
      titleText.textContent = 'Are you sure you want to permanently delete this article?';
    }
  }

  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

/* --------------------------------------------------------------------------
   4. Post Composer & Editor with HD Drag-and-Drop Image Uploader
   -------------------------------------------------------------------------- */
function initEditor() {
  const form = document.getElementById('postForm');
  const modal = document.getElementById('postEditorModal');
  const backdrop = document.getElementById('editorBackdrop');
  const closeBtn = document.getElementById('closeEditorBtn');
  const cancelBtn = document.getElementById('cancelEditorBtn');

  const btnEditTab = document.getElementById('btnEditTab');
  const btnPreviewTab = document.getElementById('btnPreviewTab');
  const tabEditor = document.getElementById('tabEditorContent');
  const tabPreview = document.getElementById('tabPreviewContent');

  const contentTextarea = document.getElementById('postContent');
  const imgUrlInput = document.getElementById('postImageUrl');
  const presets = document.querySelectorAll('.preset-option');

  // Drag & Drop / File Input Elements
  const dropzone = document.getElementById('coverDropzone');
  const fileInput = document.getElementById('coverFileInput');
  const dropzoneEmpty = document.getElementById('dropzoneEmpty');
  const dropzonePreview = document.getElementById('dropzonePreview');
  const coverPreviewImg = document.getElementById('coverPreviewImg');
  const btnChangeCover = document.getElementById('btnChangeCover');

  // Open file picker
  if (dropzone) {
    dropzone.addEventListener('click', (e) => {
      if (e.target.closest('#btnChangeCover') || dropzoneEmpty.style.display !== 'none') {
        fileInput?.click();
      }
    });

    // Drag & drop listeners
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-active');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt?.files;
      if (files && files.length > 0) {
        handleCoverFile(files[0]);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleCoverFile(files[0]);
      }
    });
  }

  if (btnChangeCover) {
    btnChangeCover.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput?.click();
    });
  }

  // Handle image upload & high-quality compression
  function handleCoverFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target.result;
      
      // Optimize & resize image with canvas for HD quality and fast loading
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max HD dimension: 1600px width
        const MAX_WIDTH = 1600;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

        // Update state
        setCoverImageState(optimizedDataUrl);
        presets.forEach(p => p.classList.remove('active'));
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  }

  // Preset selector
  presets.forEach(p => {
    p.addEventListener('click', () => {
      presets.forEach(opt => opt.classList.remove('active'));
      p.classList.add('active');
      setCoverImageState(p.dataset.img);
    });
  });

  function setCoverImageState(imgSrc) {
    if (imgUrlInput) imgUrlInput.value = imgSrc;
    if (coverPreviewImg) coverPreviewImg.src = imgSrc;
    if (dropzoneEmpty) dropzoneEmpty.style.display = 'none';
    if (dropzonePreview) dropzonePreview.style.display = 'block';
  }

  // Markdown tool buttons
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      if (contentTextarea) {
        insertMarkdownTool(contentTextarea, tool);
      }
    });
  });

  // Tab switching
  if (btnEditTab && btnPreviewTab) {
    btnEditTab.addEventListener('click', (e) => {
      e.preventDefault();
      btnEditTab.classList.add('active');
      btnPreviewTab.classList.remove('active');
      if (tabEditor) tabEditor.style.display = 'block';
      if (tabPreview) tabPreview.style.display = 'none';
    });

    btnPreviewTab.addEventListener('click', (e) => {
      e.preventDefault();
      btnPreviewTab.classList.add('active');
      btnEditTab.classList.remove('active');
      if (tabEditor) tabEditor.style.display = 'none';
      if (tabPreview) tabPreview.style.display = 'block';
      renderLivePreview();
    });
  }

  if (backdrop) backdrop.addEventListener('click', closeEditorModal);
  if (closeBtn) closeBtn.addEventListener('click', closeEditorModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeEditorModal);

  // Form submit (Create or Save)
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.getElementById('postTitle')?.value?.trim();
      const category = document.getElementById('postCategory')?.value;
      const tag = document.getElementById('postTag')?.value?.trim();
      const authorName = document.getElementById('postAuthorName')?.value?.trim();
      const authorRole = document.getElementById('postAuthorRole')?.value?.trim();
      const image = document.getElementById('postImageUrl')?.value?.trim() || '/assets/squad-celebration.png';
      const excerpt = document.getElementById('postExcerpt')?.value?.trim();
      const content = document.getElementById('postContent')?.value?.trim();
      const featured = document.getElementById('postFeatured')?.checked;
      const status = document.querySelector('input[name="postStatus"]:checked')?.value || 'published';

      if (!title || !content || !authorName) {
        alert('Please fill in Headline, Author, and Content.');
        return;
      }

      const postData = {
        title,
        category,
        tag: tag || category,
        author: {
          name: authorName,
          role: authorRole || 'Gurukul Academy Coach',
          avatar: '/assets/gurukul-logo.png'
        },
        image,
        excerpt,
        content,
        featured: Boolean(featured),
        status,
        readTime: calculateReadTime(content)
      };

      if (editingPostId) {
        postData.id = editingPostId;
      }

      const saveBtn = document.getElementById('savePostBtn');
      if (saveBtn) {
        saveBtn.disabled = true;
      }

      try {
        await savePost(postData);
        closeEditorModal();
        renderPostsList();
        updateStats();

        showToast(
          editingPostId ? 'Article Updated!' : 'Article Published!',
          'Your article has been synced instantly across the live website & database!'
        );
      } catch (err) {
        alert('Error saving post: ' + err.message);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
        }
      }
    });
  }
}

function openEditorModal(postId) {
  editingPostId = postId;
  const modal = document.getElementById('postEditorModal');
  const heading = document.getElementById('editorModalHeading');
  const modeBadge = document.getElementById('editorModeBadge');
  const saveBtnText = document.getElementById('saveBtnText');

  const btnEditTab = document.getElementById('btnEditTab');
  const btnPreviewTab = document.getElementById('btnPreviewTab');
  const tabEditor = document.getElementById('tabEditorContent');
  const tabPreview = document.getElementById('tabPreviewContent');

  const dropzoneEmpty = document.getElementById('dropzoneEmpty');
  const dropzonePreview = document.getElementById('dropzonePreview');
  const coverPreviewImg = document.getElementById('coverPreviewImg');
  const imgUrlInput = document.getElementById('postImageUrl');
  const presets = document.querySelectorAll('.preset-option');

  // Reset tab to editor
  if (btnEditTab && btnPreviewTab) {
    btnEditTab.classList.add('active');
    btnPreviewTab.classList.remove('active');
    if (tabEditor) tabEditor.style.display = 'block';
    if (tabPreview) tabPreview.style.display = 'none';
  }

  if (postId) {
    const post = getPostById(postId);
    if (!post) return;

    if (heading) heading.textContent = 'Edit Academy Article';
    if (modeBadge) modeBadge.textContent = 'EDIT MODE';
    if (saveBtnText) saveBtnText.textContent = 'SAVE & SYNC LIVE';

    document.getElementById('postId').value = post.id;
    document.getElementById('postTitle').value = post.title || '';
    document.getElementById('postCategory').value = post.category || 'Academy News';
    document.getElementById('postTag').value = post.tag || '';
    document.getElementById('postAuthorName').value = post.author?.name || '';
    document.getElementById('postAuthorRole').value = post.author?.role || '';
    document.getElementById('postExcerpt').value = post.excerpt || '';
    document.getElementById('postContent').value = post.content || '';
    document.getElementById('postFeatured').checked = Boolean(post.featured);

    const postImg = post.image || '/assets/adivision1.png';
    if (imgUrlInput) imgUrlInput.value = postImg;
    if (coverPreviewImg) coverPreviewImg.src = postImg;
    if (dropzoneEmpty) dropzoneEmpty.style.display = 'none';
    if (dropzonePreview) dropzonePreview.style.display = 'block';

    const statusRadio = document.querySelector(`input[name="postStatus"][value="${post.status}"]`);
    if (statusRadio) statusRadio.checked = true;

    presets.forEach(p => {
      p.classList.toggle('active', p.dataset.img === post.image);
    });

  } else {
    // New Post
    if (heading) heading.textContent = 'Compose Academy Story';
    if (modeBadge) modeBadge.textContent = 'NEW ARTICLE';
    if (saveBtnText) saveBtnText.textContent = 'PUBLISH INSTANTLY';

    document.getElementById('postId').value = '';
    document.getElementById('postTitle').value = '';
    document.getElementById('postCategory').value = 'Academy News';
    document.getElementById('postTag').value = '';
    document.getElementById('postAuthorName').value = 'Coach Aryan Sharma';
    document.getElementById('postAuthorRole').value = 'UEFA B Head Coach';
    document.getElementById('postExcerpt').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postFeatured').checked = false;

    const defaultImg = '/assets/adivision1.png';
    if (imgUrlInput) imgUrlInput.value = defaultImg;
    if (coverPreviewImg) coverPreviewImg.src = defaultImg;
    if (dropzoneEmpty) dropzoneEmpty.style.display = 'none';
    if (dropzonePreview) dropzonePreview.style.display = 'block';

    const statusRadio = document.querySelector('input[name="postStatus"][value="published"]');
    if (statusRadio) statusRadio.checked = true;

    presets.forEach(p => {
      p.classList.toggle('active', p.dataset.img === defaultImg);
    });
  }

  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeEditorModal() {
  const modal = document.getElementById('postEditorModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  editingPostId = null;
}

function renderLivePreview() {
  const container = document.getElementById('livePreviewContainer');
  if (!container) return;

  const title = document.getElementById('postTitle')?.value || 'Untitled Article';
  const category = document.getElementById('postCategory')?.value || 'Academy News';
  const tag = document.getElementById('postTag')?.value || '';
  const authorName = document.getElementById('postAuthorName')?.value || 'Gurukul Staff';
  const authorRole = document.getElementById('postAuthorRole')?.value || 'Academy Coach';
  const image = document.getElementById('postImageUrl')?.value || '/assets/squad-celebration.png';
  const content = document.getElementById('postContent')?.value || '';
  const readTime = calculateReadTime(content);

  container.innerHTML = `
    <article class="reader-article preview-mode">
      <div class="reader-hero-header">
        <div class="reader-badge-row">
          <span class="reader-category-pill">${escapeHTML(category)}</span>
          ${tag ? `<span class="reader-tag-pill">${escapeHTML(tag)}</span>` : ''}
          <span class="reader-read-time-pill">⏱️ ${escapeHTML(readTime)}</span>
        </div>
        <h1 class="reader-title">${escapeHTML(title)}</h1>
        <div class="reader-meta-author-row">
          <div class="reader-author-box">
            <img src="/assets/gurukul-logo.png" alt="Author" class="reader-author-avatar" />
            <div>
              <div class="reader-author-name">${escapeHTML(authorName)}</div>
              <div class="reader-author-role">${escapeHTML(authorRole)}</div>
            </div>
          </div>
          <div class="reader-publish-date">Live Preview</div>
        </div>
      </div>

      <div class="reader-featured-media">
        <img src="${image}" alt="Cover" class="reader-main-img" onerror="this.src='/assets/squad-celebration.png'" />
      </div>

      <div class="reader-body-content">
        ${renderMarkdown(content || '*No content written yet...*')}
      </div>
    </article>
  `;
}

function insertMarkdownTool(textarea, tool) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.substring(start, end);

  let replacement = '';
  let cursorOffset = 0;

  switch (tool) {
    case 'h2':
      replacement = `\n## ${selected || 'Heading'}\n`;
      cursorOffset = replacement.length;
      break;
    case 'h3':
      replacement = `\n### ${selected || 'Sub-heading'}\n`;
      cursorOffset = replacement.length;
      break;
    case 'bold':
      replacement = `**${selected || 'Bold Text'}**`;
      cursorOffset = replacement.length - 2;
      break;
    case 'italic':
      replacement = `*${selected || 'Italic Text'}*`;
      cursorOffset = replacement.length - 1;
      break;
    case 'quote':
      replacement = `\n> "${selected || 'Quote text'}"\n`;
      cursorOffset = replacement.length;
      break;
    case 'list':
      replacement = `\n- ${selected || 'Bullet item 1'}\n- Bullet item 2\n`;
      cursorOffset = replacement.length;
      break;
    case 'numlist':
      replacement = `\n1. ${selected || 'First item'}\n2. Second item\n`;
      cursorOffset = replacement.length;
      break;
  }

  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  textarea.focus();
  textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
}

function showToast(title, msg) {
  const toast = document.getElementById('adminToast');
  const tTitle = document.getElementById('toastTitle');
  const tMsg = document.getElementById('toastMsg');
  if (!toast) return;

  if (tTitle) tTitle.textContent = title;
  if (tMsg) tMsg.textContent = msg;

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
