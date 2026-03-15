/**
 * SpinZone Comments Service
 * Full comment CRUD, threaded replies, real-time updates, and comment likes.
 *
 * Tables used: comments, likes, profiles
 * ContentType: 'win' | 'post' | 'pick'
 * Column map:  { win: 'win_id', post: 'post_id', pick: 'pick_id' }
 *
 * DB columns expected (graceful degradation if missing):
 *   comments: id, win_id|post_id|pick_id, user_id, content, created_at,
 *             parent_id (optional – enables threaded replies)
 *   likes:    comment_id (optional – enables comment likes)
 */

const _CS_URL  = 'https://rcsntlpytbwosykkhzzg.supabase.co';
const _CS_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjc250bHB5dGJ3b3N5a2toenpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMDg2NDEsImV4cCI6MjA4NzU4NDY0MX0.JZ8iZ6dFSQv_G5wgIJ7RGosA4WR5ZIwdvKbbKLjwXfI';
const _CONTENT_COL = { win: 'win_id', post: 'post_id', pick: 'pick_id' };

function _csClient() {
    if (window._szSb) return window._szSb;
    if (typeof window.supabase === 'undefined') throw new Error('Supabase JS not loaded');
    window._szSb = window.supabase.createClient(_CS_URL, _CS_KEY);
    return window._szSb;
}
async function _csSession() {
    const { data: { session } } = await _csClient().auth.getSession();
    return session;
}
async function _csRequireSession() {
    const s = await _csSession();
    if (!s) throw new Error('You must be signed in.');
    return s;
}

// ── CORE SERVICE ───────────────────────────────────────────────────────────────

/**
 * Fetch all comments for a piece of content.
 * Joins profiles for author info. Ordered oldest-first.
 * parent_id grouping is client-side – gracefully absent if column missing.
 */
async function getComments(contentType, contentId) {
    const sb = _csClient();
    const col = _CONTENT_COL[contentType];
    if (!col) return { data: [], error: { message: 'Invalid contentType' } };

    const { data, error } = await sb.from('comments')
        .select('*, profiles!left(username, display_name, profile_picture_url, is_verified)')
        .eq(col, contentId)
        .order('created_at', { ascending: true })
        .limit(200);

    if (error) return { data: [], error };

    const normalised = (data || []).map(c => ({
        ...c,
        display_name: c.profiles?.display_name || c.profiles?.username || 'Player',
        is_verified:  c.profiles?.is_verified  || false,
        profile_picture_url: c.profiles?.profile_picture_url || null,
        like_count: 0,   // populated later by getUserCommentLikes merge
    }));

    return { data: normalised, error: null };
}

/**
 * Create a comment (or reply when parentId provided).
 * @param {{ contentType, contentId, content, parentId? }} opts
 */
async function createComment({ contentType, contentId, content, parentId = null }) {
    const session = await _csRequireSession();
    const sb = _csClient();
    const col = _CONTENT_COL[contentType];
    if (!col) throw new Error('Invalid contentType');

    const row = {
        [col]: contentId,
        user_id: session.user.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
    };
    if (parentId) row.parent_id = parentId;  // ignored by DB if column absent

    const { data, error } = await sb.from('comments').insert(row).select().single();
    return { data, error };
}

/**
 * Delete a comment (owner only). Also removes any comment likes.
 */
async function deleteComment(id) {
    const session = await _csRequireSession();
    const sb = _csClient();
    // Clean up likes for this comment (best-effort – column may not exist)
    await sb.from('likes').delete().eq('comment_id', id).catch(() => {});
    const { error } = await sb.from('comments')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);
    return { error };
}

/**
 * Like a comment (idempotent upsert on likes.comment_id).
 * Fails gracefully if comment_id column doesn't exist in likes table.
 */
async function likeComment(commentId) {
    const session = await _csRequireSession();
    const { error } = await _csClient().from('likes').upsert(
        { comment_id: commentId, user_id: session.user.id },
        { onConflict: 'comment_id,user_id', ignoreDuplicates: true }
    );
    return { error };
}

/** Unlike a comment. */
async function unlikeComment(commentId) {
    const session = await _csRequireSession();
    const { error } = await _csClient().from('likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', session.user.id);
    return { error };
}

/**
 * Get all comment IDs liked by the current user.
 * Returns [] if not signed in or if comment_id column missing.
 */
async function getUserCommentLikes() {
    const session = await _csSession();
    if (!session) return { data: [], error: null };
    const { data, error } = await _csClient().from('likes')
        .select('comment_id')
        .eq('user_id', session.user.id)
        .not('comment_id', 'is', null);
    if (error) return { data: [], error: null };  // column may not exist – degrade
    return { data: (data || []).map(r => String(r.comment_id)), error: null };
}

/**
 * Get comment count for a content item.
 */
async function getCommentCount(contentType, contentId) {
    const col = _CONTENT_COL[contentType];
    if (!col) return 0;
    const { count } = await _csClient().from('comments')
        .select('id', { count: 'exact', head: true })
        .eq(col, contentId);
    return count || 0;
}

/**
 * Subscribe to real-time comment changes for a content item.
 * @returns {{ unsubscribe: function }}
 */
function subscribeToComments(contentType, contentId, callback) {
    const col = _CONTENT_COL[contentType];
    if (!col) return { unsubscribe: () => {} };
    try {
        const channel = _csClient()
            .channel(`csec:${contentType}:${contentId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'comments',
                filter: `${col}=eq.${contentId}`,
            }, callback)
            .subscribe();
        return { unsubscribe: () => channel.unsubscribe().catch(() => {}) };
    } catch (e) {
        return { unsubscribe: () => {} };
    }
}

// ── CSS (injected once) ────────────────────────────────────────────────────────

function _injectCSS() {
    if (document.getElementById('csec-css')) return;
    const s = document.createElement('style');
    s.id = 'csec-css';
    s.textContent = `
    /* SpinZone Comment Section */
    .csec{padding-top:.85rem}
    .csec-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:.85rem;border-top:1px solid rgba(255,255,255,.07);padding-top:.85rem}
    .csec-hdr-title{font-size:.78rem;font-weight:700;color:var(--text-dim,#475569);text-transform:uppercase;letter-spacing:.06em;display:flex;align-items:center;gap:.4rem}
    .csec-hdr-count{font-size:.75rem;color:var(--text-dim,#475569);background:rgba(255,255,255,.06);padding:.1rem .55rem;border-radius:50px}

    /* List */
    .csec-list{display:flex;flex-direction:column;gap:.5rem;margin-bottom:.75rem;max-height:380px;overflow-y:auto;padding-right:2px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent}
    .csec-list::-webkit-scrollbar{width:3px}
    .csec-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}

    /* Comment item */
    .csec-item{display:flex;gap:.6rem;animation:csec-fadein .2s ease}
    .csec-item.reply{margin-left:2.75rem}
    @keyframes csec-fadein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
    .csec-av{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:#fff;overflow:hidden;text-decoration:none;transition:opacity .15s}
    .csec-av:hover{opacity:.85}
    .csec-av img,.csec-av-sm img{width:100%;height:100%;object-fit:cover}
    .csec-av-sm{width:24px;height:24px;font-size:.62rem}
    .csec-bubble{flex:1;background:rgba(255,255,255,.04);border-radius:10px;padding:.55rem .8rem;border:1px solid rgba(255,255,255,.06);min-width:0}
    .csec-bubble.own{border-color:rgba(139,92,246,.25);background:rgba(139,92,246,.06)}
    .csec-brow{display:flex;align-items:center;gap:.4rem;margin-bottom:.2rem;flex-wrap:wrap}
    .csec-author{font-size:.8rem;font-weight:700;color:var(--text-main,#f1f5f9);text-decoration:none;white-space:nowrap}
    .csec-author:hover{color:var(--primary,#8b5cf6)}
    .csec-verified{color:var(--primary,#8b5cf6);font-size:.7rem}
    .csec-time{font-size:.7rem;color:var(--text-dim,#475569);margin-left:auto;white-space:nowrap}
    .csec-text{font-size:.86rem;color:var(--text-muted,#64748b);line-height:1.55;white-space:pre-wrap;word-break:break-word}
    .csec-actions{display:flex;align-items:center;gap:.75rem;margin-top:.4rem}
    .csec-btn{background:none;border:none;font-size:.74rem;color:var(--text-dim,#475569);cursor:pointer;display:inline-flex;align-items:center;gap:.2rem;padding:0;font-family:inherit;transition:color .15s;white-space:nowrap}
    .csec-btn:hover{color:var(--text-main,#f1f5f9)}
    .csec-btn.liked{color:#ef4444}
    .csec-btn.liked:hover{color:#f87171}
    .csec-btn.del:hover{color:#ef4444}

    /* Inline reply form */
    .csec-reply-wrap{margin-top:.55rem;display:flex;gap:.45rem;align-items:center}
    .csec-reply-inp{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:.4rem .65rem;font-size:.81rem;color:var(--text-main,#f1f5f9);font-family:inherit;min-width:0}
    .csec-reply-inp:focus{outline:none;border-color:var(--primary,#8b5cf6)}
    .csec-reply-post{padding:.38rem .7rem;background:var(--primary,#8b5cf6);color:#fff;border:none;border-radius:6px;font-size:.76rem;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap}
    .csec-reply-post:hover{background:var(--primary-dark,#6d28d9)}
    .csec-reply-cancel{background:none;border:none;font-size:.72rem;color:var(--text-dim,#475569);cursor:pointer;font-family:inherit;padding:0}
    .csec-reply-cancel:hover{color:var(--text-muted,#64748b)}

    /* Nested replies container */
    .csec-replies{display:flex;flex-direction:column;gap:.45rem;margin-top:.5rem}

    /* Main post form */
    .csec-form{display:flex;gap:.6rem;margin-top:.5rem}
    .csec-form-av{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:#fff;overflow:hidden}
    .csec-form-av img{width:100%;height:100%;object-fit:cover}
    .csec-form-body{flex:1;display:flex;flex-direction:column;gap:.4rem;min-width:0}
    .csec-inp{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:.55rem .8rem;font-size:.875rem;color:var(--text-main,#f1f5f9);font-family:inherit;resize:none;min-height:38px;transition:border-color .15s,min-height .2s;line-height:1.5}
    .csec-inp:focus{outline:none;border-color:var(--primary,#8b5cf6);min-height:68px}
    .csec-form-foot{display:flex;justify-content:flex-end}
    .csec-post-btn{padding:.42rem .95rem;background:var(--primary,#8b5cf6);color:#fff;border:none;border-radius:7px;font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s}
    .csec-post-btn:hover{background:var(--primary-dark,#6d28d9)}
    .csec-post-btn:disabled{opacity:.55;cursor:not-allowed}
    .csec-signin{font-size:.82rem;color:var(--text-dim,#475569);padding:.6rem 0}
    .csec-signin a{color:var(--primary,#8b5cf6)}

    /* States */
    .csec-empty{text-align:center;padding:1.25rem 0;color:var(--text-dim,#475569);font-size:.875rem}
    .csec-sk{display:flex;flex-direction:column;gap:.5rem;padding:.5rem 0}
    .csec-sk-row{display:flex;gap:.5rem;align-items:flex-start}
    .csec-sk-av{width:30px;height:30px;border-radius:50%;flex-shrink:0;background:linear-gradient(90deg,rgba(255,255,255,.05) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.05) 75%);background-size:400px 100%;animation:csec-sk 1.3s infinite}
    .csec-sk-lines{flex:1;display:flex;flex-direction:column;gap:.35rem}
    .csec-sk-line{height:11px;border-radius:4px;background:linear-gradient(90deg,rgba(255,255,255,.05) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.05) 75%);background-size:400px 100%;animation:csec-sk 1.3s infinite}
    @keyframes csec-sk{from{background-position:-400px 0}to{background-position:400px 0}}
    `;
    document.head.appendChild(s);
}

// ── MOUNT COMPONENT ────────────────────────────────────────────────────────────

/**
 * Mount a full interactive comment section into a container element.
 *
 * @param {HTMLElement} container  – target DOM element (will be overwritten)
 * @param {object}      opts
 * @param {'win'|'post'|'pick'} opts.contentType
 * @param {string|number}       opts.contentId
 * @param {object|null}         [opts.currentUser]     – Supabase auth user
 * @param {object|null}         [opts.currentProfile]  – profile row for avatar
 * @param {function(number):void} [opts.onCountChange] – called when count changes
 * @returns {{ destroy: function, getCount: function }}
 */
function mountCommentSection(container, opts = {}) {
    _injectCSS();

    const { contentType, contentId, currentUser = null, currentProfile = null, onCountChange } = opts;

    let comments     = [];
    let userLikes    = new Set();   // set of String(comment.id)
    let openReplyId  = null;        // comment id with open reply form
    let subscription = null;
    let destroyed    = false;
    let likesEnabled = true;        // flipped false on first like error

    // ── skeleton immediately
    container.innerHTML = `<div class="csec">
        <div class="csec-hdr"><span class="csec-hdr-title">💬 Comments</span></div>
        <div class="csec-sk">
            <div class="csec-sk-row"><div class="csec-sk-av"></div><div class="csec-sk-lines"><div class="csec-sk-line" style="width:60%"></div><div class="csec-sk-line" style="width:80%"></div></div></div>
            <div class="csec-sk-row"><div class="csec-sk-av"></div><div class="csec-sk-lines"><div class="csec-sk-line" style="width:40%"></div><div class="csec-sk-line" style="width:70%"></div></div></div>
        </div>
    </div>`;

    // ── helpers ─────────────────────────────────────────────────────────────

    function _esc(v) {
        const d = document.createElement('div');
        d.textContent = String(v ?? '');
        return d.innerHTML;
    }

    function _grad(name) {
        const n = (name || 'A').length;
        if (n % 3 === 0) return 'linear-gradient(135deg,#6366f1,#4f46e5)';
        if (n % 2 === 0) return 'linear-gradient(135deg,#f59e0b,#d97706)';
        return 'linear-gradient(135deg,#3b82f6,#2563eb)';
    }

    function _ago(ts) {
        const s = Math.floor((Date.now() - new Date(ts)) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return Math.floor(s / 60) + 'm ago';
        if (s < 86400) return Math.floor(s / 3600) + 'h ago';
        if (s < 604800) return Math.floor(s / 86400) + 'd ago';
        return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function _avEl(c, sm = false) {
        const name = c.display_name || 'User';
        const init = name.substring(0, 2).toUpperCase();
        const img  = c.profile_picture_url
            ? `<img src="${_esc(c.profile_picture_url)}" alt="">`
            : _esc(init);
        return `<a href="/profile.html?id=${_esc(c.user_id)}" class="csec-av${sm ? ' csec-av-sm' : ''}" style="background:${_grad(name)}">${img}</a>`;
    }

    function _toast(msg, err = false) {
        if (typeof showToast === 'function') { showToast(msg, err); return; }
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.className   = 'show' + (err ? ' error' : '');
        setTimeout(() => { t.className = ''; }, 3200);
    }

    // ── render ───────────────────────────────────────────────────────────────

    function render() {
        if (destroyed) return;

        // Build parent → children map (parent_id may not exist – all become roots)
        const roots = comments.filter(c => !c.parent_id);
        const byParent = {};
        comments.filter(c => c.parent_id).forEach(c => {
            (byParent[c.parent_id] = byParent[c.parent_id] || []).push(c);
        });

        function commentHTML(c, isReply = false) {
            const isOwn   = currentUser && c.user_id === currentUser.id;
            const liked   = userLikes.has(String(c.id));
            const lc      = c.like_count || 0;
            const replies = byParent[c.id] || [];
            const name    = c.display_name || 'Player';

            return `<div class="csec-item${isReply ? ' reply' : ''}" data-cid="${_esc(c.id)}">
                ${_avEl(c, isReply)}
                <div class="csec-bubble${isOwn ? ' own' : ''}">
                    <div class="csec-brow">
                        <a href="/profile.html?id=${_esc(c.user_id)}" class="csec-author">${_esc(name)}</a>
                        ${c.is_verified ? '<span class="csec-verified">✓</span>' : ''}
                        <span class="csec-time">${_ago(c.created_at)}</span>
                    </div>
                    <div class="csec-text">${_esc(c.content)}</div>
                    <div class="csec-actions">
                        ${likesEnabled ? `<button class="csec-btn${liked ? ' liked' : ''}" data-act="like" data-id="${_esc(c.id)}">
                            <span>${liked ? '❤️' : '🤍'}</span><span class="csec-lc-${_esc(c.id)}">${lc > 0 ? lc : ''}</span>
                        </button>` : ''}
                        ${!isReply && currentUser ? `<button class="csec-btn" data-act="reply" data-id="${_esc(c.id)}">↩ Reply</button>` : ''}
                        ${isOwn ? `<button class="csec-btn del" data-act="del" data-id="${_esc(c.id)}">🗑️</button>` : ''}
                    </div>
                    ${openReplyId === String(c.id) ? `
                    <div class="csec-reply-wrap">
                        <input class="csec-reply-inp" id="csec-ri-${_esc(c.id)}" placeholder="Write a reply…" maxlength="600" autocomplete="off">
                        <button class="csec-reply-post" data-act="submit-reply" data-id="${_esc(c.id)}">Reply</button>
                        <button class="csec-reply-cancel" data-act="cancel-reply">✕</button>
                    </div>` : ''}
                    ${replies.length ? `<div class="csec-replies">${replies.map(r => commentHTML(r, true)).join('')}</div>` : ''}
                </div>
            </div>`;
        }

        const listHTML = roots.length
            ? roots.map(c => commentHTML(c)).join('')
            : '<div class="csec-empty">No comments yet. Be the first!</div>';

        // My avatar for post form
        const myName = currentProfile?.display_name || currentProfile?.username
            || currentUser?.email?.split('@')[0] || 'You';
        const myGrad = _grad(myName);
        const myImg  = currentProfile?.profile_picture_url
            ? `<img src="${_esc(currentProfile.profile_picture_url)}" alt="">`
            : _esc(myName.substring(0, 2).toUpperCase());
        const total = comments.length;

        const formHTML = currentUser
            ? `<div class="csec-form">
                <div class="csec-form-av" style="background:${myGrad}">${myImg}</div>
                <div class="csec-form-body">
                    <textarea class="csec-inp" id="csec-main-inp" placeholder="Add a comment… (Ctrl+Enter to post)" maxlength="1000" rows="1"></textarea>
                    <div class="csec-form-foot">
                        <button class="csec-post-btn" id="csec-post-btn">Post</button>
                    </div>
                </div>
            </div>`
            : `<div class="csec-signin"><a href="/index.html">Sign in</a> to join the conversation.</div>`;

        container.innerHTML = `<div class="csec">
            <div class="csec-hdr">
                <span class="csec-hdr-title">💬 Comments</span>
                ${total > 0 ? `<span class="csec-hdr-count">${total}</span>` : ''}
            </div>
            <div class="csec-list" id="csec-list">${listHTML}</div>
            ${formHTML}
        </div>`;

        if (onCountChange) onCountChange(total);
        _wire();

        // Focus reply input if open
        if (openReplyId) {
            setTimeout(() => {
                const inp = document.getElementById(`csec-ri-${openReplyId}`);
                if (inp) inp.focus();
            }, 30);
        }
    }

    // ── event wiring ─────────────────────────────────────────────────────────

    function _wire() {
        const root = container.querySelector('.csec');
        if (!root) return;

        // Delegated click
        root.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-act]');
            if (!btn) return;
            const act = btn.dataset.act;
            const id  = btn.dataset.id;
            if      (act === 'like')         _handleLike(id, btn);
            else if (act === 'reply')        _openReply(id);
            else if (act === 'cancel-reply') { openReplyId = null; render(); }
            else if (act === 'submit-reply') _submitReply(id);
            else if (act === 'del')          _delete(id);
        });

        // Enter in reply input
        root.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('csec-reply-inp') && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const id = e.target.id.replace('csec-ri-', '');
                _submitReply(id);
            }
        });

        // Main post form
        const postBtn = root.querySelector('#csec-post-btn');
        const mainInp = root.querySelector('#csec-main-inp');
        if (postBtn) postBtn.addEventListener('click', _submitMain);
        if (mainInp) {
            mainInp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    _submitMain();
                }
            });
        }
    }

    // ── handlers ─────────────────────────────────────────────────────────────

    async function _handleLike(commentId, btn) {
        if (!currentUser) { _toast('Sign in to like comments.', true); return; }
        const liked   = userLikes.has(String(commentId));
        const comment = comments.find(c => String(c.id) === String(commentId));

        // Optimistic
        if (liked) {
            userLikes.delete(String(commentId));
            if (comment) comment.like_count = Math.max(0, (comment.like_count || 0) - 1);
        } else {
            userLikes.add(String(commentId));
            if (comment) comment.like_count = (comment.like_count || 0) + 1;
        }
        _updateLikeDOM(commentId, !liked, comment?.like_count ?? 0);

        try {
            const { error } = liked
                ? await unlikeComment(commentId)
                : await likeComment(commentId);
            if (error) throw error;
        } catch (err) {
            // Revert
            if (liked) { userLikes.add(String(commentId)); if (comment) comment.like_count = (comment.like_count || 0) + 1; }
            else        { userLikes.delete(String(commentId)); if (comment) comment.like_count = Math.max(0, (comment.like_count || 0) - 1); }
            _updateLikeDOM(commentId, liked, comment?.like_count ?? 0);

            // If comment_id column missing, disable likes silently
            if (err?.message?.includes('column') || err?.code === '42703') {
                likesEnabled = false;
                render();
            }
        }
    }

    function _updateLikeDOM(commentId, isLiked, count) {
        const btn = container.querySelector(`[data-act="like"][data-id="${commentId}"]`);
        if (!btn) return;
        btn.classList.toggle('liked', isLiked);
        const icon = btn.querySelector('span:first-child');
        const lc   = btn.querySelector(`.csec-lc-${commentId}`);
        if (icon) icon.textContent = isLiked ? '❤️' : '🤍';
        if (lc)   lc.textContent   = count > 0 ? count : '';
    }

    function _openReply(commentId) {
        if (!currentUser) { _toast('Sign in to reply.', true); return; }
        openReplyId = openReplyId === String(commentId) ? null : String(commentId);
        render();
    }

    async function _submitReply(parentId) {
        const inp = document.getElementById(`csec-ri-${parentId}`);
        const text = inp?.value.trim();
        if (!text) return;

        const postBtn = container.querySelector(`[data-act="submit-reply"][data-id="${parentId}"]`);
        if (postBtn) { postBtn.textContent = 'Posting…'; postBtn.disabled = true; }

        try {
            const { data, error } = await createComment({ contentType, contentId, content: text, parentId });
            if (error) throw error;
            const newC = _hydrateOptimistic(data, parentId);
            comments.push(newC);
            openReplyId = null;
            render();
        } catch (err) {
            _toast('Failed to post reply.', true);
            if (postBtn) { postBtn.textContent = 'Reply'; postBtn.disabled = false; }
        }
    }

    async function _submitMain() {
        const inp    = container.querySelector('#csec-main-inp');
        const btn    = container.querySelector('#csec-post-btn');
        const text   = inp?.value.trim();
        if (!text) return;
        if (btn) { btn.textContent = 'Posting…'; btn.disabled = true; }

        try {
            const { data, error } = await createComment({ contentType, contentId, content: text });
            if (error) throw error;
            const newC = _hydrateOptimistic(data, null);
            comments.push(newC);
            if (inp) inp.value = '';
            render();
        } catch (err) {
            _toast('Failed to post comment.', true);
            if (btn) { btn.textContent = 'Post'; btn.disabled = false; }
        }
    }

    async function _delete(commentId) {
        if (!confirm('Delete this comment?')) return;
        try {
            const { error } = await deleteComment(commentId);
            if (error) throw error;
            // Remove comment and its replies
            comments = comments.filter(c =>
                String(c.id) !== String(commentId) &&
                String(c.parent_id) !== String(commentId)
            );
            render();
        } catch (err) {
            _toast('Failed to delete comment.', true);
        }
    }

    function _hydrateOptimistic(data, parentId) {
        return {
            ...data,
            display_name:        currentProfile?.display_name || currentProfile?.username || 'You',
            is_verified:         currentProfile?.is_verified || false,
            profile_picture_url: currentProfile?.profile_picture_url || null,
            like_count:          0,
            parent_id:           parentId || null,
        };
    }

    // ── init ─────────────────────────────────────────────────────────────────

    async function init() {
        try {
            const [commRes, likesRes] = await Promise.all([
                getComments(contentType, contentId),
                getUserCommentLikes(),
            ]);
            comments  = commRes.data || [];
            userLikes = new Set(likesRes.data || []);
        } catch (e) {
            comments  = [];
            userLikes = new Set();
        }

        if (destroyed) return;
        render();

        // Real-time subscription
        subscription = subscribeToComments(contentType, contentId, async (payload) => {
            if (destroyed) return;
            if (payload.eventType === 'INSERT') {
                // Avoid duplicates (may have been added optimistically)
                if (comments.find(c => c.id === payload.new.id)) return;
                // Fetch with profile join
                const col = _CONTENT_COL[contentType];
                const { data: row } = await _csClient().from('comments')
                    .select('*, profiles!left(username, display_name, profile_picture_url, is_verified)')
                    .eq('id', payload.new.id)
                    .single();
                if (row) {
                    comments.push({
                        ...row,
                        display_name:        row.profiles?.display_name || row.profiles?.username || 'Player',
                        is_verified:         row.profiles?.is_verified || false,
                        profile_picture_url: row.profiles?.profile_picture_url || null,
                        like_count:          0,
                    });
                    render();
                }
            } else if (payload.eventType === 'DELETE') {
                comments = comments.filter(c => c.id !== payload.old.id &&
                    String(c.parent_id) !== String(payload.old.id));
                render();
            }
        });
    }

    init();

    return {
        destroy() {
            destroyed = true;
            if (subscription) subscription.unsubscribe();
            container.innerHTML = '';
        },
        getCount() { return comments.length; },
    };
}

// ── EXPOSE ─────────────────────────────────────────────────────────────────────

window.CommentsService = {
    getComments,
    createComment,
    deleteComment,
    likeComment,
    unlikeComment,
    getUserCommentLikes,
    getCommentCount,
    subscribeToComments,
    mountCommentSection,
};
