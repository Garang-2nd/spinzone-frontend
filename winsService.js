/**
 * SpinZone Wins Service
 * Handles all win CRUD, screenshot uploads, and likes against Supabase.
 *
 * Tables used:  wins, likes
 * Storage bucket: win-screenshots
 */

const SUPABASE_URL = 'https://rcsntlpytbwosykkhzzg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjc250bHB5dGJ3b3N5a2toenpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMDg2NDEsImV4cCI6MjA4NzU4NDY0MX0.JZ8iZ6dFSQv_G5wgIJ7RGosA4WR5ZIwdvKbbKLjwXfI';

function _client() {
    if (window._szSb) return window._szSb;
    if (typeof window.supabase === 'undefined') throw new Error('Supabase JS not loaded');
    window._szSb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return window._szSb;
}

async function _requireSession() {
    const sb = _client();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error('You must be signed in.');
    return session;
}

// ─── Screenshot Upload ────────────────────────────────────────────────────────

/**
 * Upload a win screenshot to the 'win-screenshots' storage bucket.
 * @param {File} file
 * @param {function(number):void} [onProgress] – called with 0-100 progress estimate
 * @returns {Promise<{url: string|null, path: string|null, error: object|null}>}
 */
async function uploadWinScreenshot(file, onProgress) {
    const session = await _requireSession().catch(e => { throw e; });
    const sb = _client();
    const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${session.user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    if (onProgress) onProgress(20);

    const { error: uploadError } = await sb.storage
        .from('win-screenshots')
        .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) return { url: null, path: null, error: uploadError };
    if (onProgress) onProgress(90);

    const { data: { publicUrl } } = sb.storage.from('win-screenshots').getPublicUrl(path);
    if (onProgress) onProgress(100);
    return { url: publicUrl, path, error: null };
}

// ─── Win CRUD ─────────────────────────────────────────────────────────────────

/**
 * Create a new win record.
 * @param {object} data
 * @param {string|number} data.win_amount   – required
 * @param {string}        data.casino_name  – required
 * @param {string}        [data.slot_name]
 * @param {string}        [data.win_multiplier]
 * @param {string}        [data.description]
 * @param {string}        [data.screenshot_url]
 * @param {string}        [data.screenshot_path] – storage path for deletion
 * @param {string}        [data.username]         – denormalised for quick reads
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
async function createWin(data) {
    const session = await _requireSession();
    const sb = _client();

    const row = {
        user_id: session.user.id,
        username: data.username || session.user.email?.split('@')[0] || 'Player',
        casino_name: (data.casino_name || '').trim(),
        slot_name: (data.slot_name || '').trim() || null,
        win_amount: parseFloat(data.win_amount) || 0,
        win_multiplier: (data.win_multiplier || '').trim() || null,
        description: (data.description || '').trim() || null,
        screenshot_url: data.screenshot_url || null,
        screenshot_path: data.screenshot_path || null,
        created_at: new Date().toISOString(),
    };

    const { data: result, error } = await sb.from('wins').insert(row).select().single();
    return { data: result, error };
}

/**
 * Fetch wins with optional filters.
 * @param {object} [filters]
 * @param {'new'|'biggest'|'liked'} [filters.sort='new']
 * @param {string}  [filters.casino]   – filter by casino_name
 * @param {string}  [filters.userId]   – filter by user_id
 * @param {number}  [filters.limit=30]
 * @param {number}  [filters.offset=0]
 * @returns {Promise<{data: object[]|null, error: object|null}>}
 */
async function getWins(filters = {}) {
    const sb = _client();
    const { sort = 'new', casino, userId, limit = 30, offset = 0 } = filters;

    // Attempt to join profiles and likes; gracefully degrade if relations not present
    let query = sb.from('wins')
        .select('*, profiles!left(username, display_name, is_verified, profile_picture_url), likes!left(id)')
        .range(offset, offset + limit - 1);

    if (casino) query = query.eq('casino_name', casino);
    if (userId) query = query.eq('user_id', userId);

    if (sort === 'biggest') {
        query = query.order('win_amount', { ascending: false });
    } else if (sort === 'liked') {
        // fall back to ordering by created_at since like count isn't a column
        query = query.order('created_at', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        // Retry without joins if relation error (schema may differ)
        if (error.message?.includes('relationship')) {
            const { data: bare, error: e2 } = await sb.from('wins')
                .select('*')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            return { data: bare, error: e2 };
        }
        return { data: null, error };
    }

    // Normalise: merge joined profile, count likes array
    const normalised = (data || []).map(w => ({
        ...w,
        display_name: w.profiles?.display_name || w.profiles?.username || w.username || 'Player',
        is_verified: w.profiles?.is_verified || false,
        profile_picture_url: w.profiles?.profile_picture_url || null,
        like_count: Array.isArray(w.likes) ? w.likes.length : 0,
    }));

    if (sort === 'biggest') {
        normalised.sort((a, b) => (parseFloat(b.win_amount) || 0) - (parseFloat(a.win_amount) || 0));
    } else if (sort === 'liked') {
        normalised.sort((a, b) => b.like_count - a.like_count);
    }

    return { data: normalised, error: null };
}

/**
 * Fetch all wins for a specific user.
 * @param {string} userId
 * @returns {Promise<{data: object[]|null, error: object|null}>}
 */
async function getUserWins(userId) {
    return getWins({ userId, limit: 100 });
}

/**
 * Update a win (owner only).
 * @param {string|number} id
 * @param {object} updates
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
async function updateWin(id, updates) {
    const session = await _requireSession();
    const sb = _client();

    const { data, error } = await sb.from('wins')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', session.user.id)   // row-level safety
        .select()
        .single();

    return { data, error };
}

/**
 * Delete a win and its screenshot from storage (owner only).
 * @param {string|number} id
 * @returns {Promise<{error: object|null}>}
 */
async function deleteWin(id) {
    const session = await _requireSession();
    const sb = _client();

    // Fetch to get screenshot_path before deleting row
    const { data: win } = await sb.from('wins').select('screenshot_path, user_id').eq('id', id).single();

    if (win?.user_id !== session.user.id) {
        return { error: { message: 'You can only delete your own wins.' } };
    }

    // Remove likes for this win first
    await sb.from('likes').delete().eq('win_id', id);

    // Delete the row
    const { error } = await sb.from('wins').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) return { error };

    // Best-effort: remove screenshot from storage
    if (win?.screenshot_path) {
        await sb.storage.from('win-screenshots').remove([win.screenshot_path]).catch(() => {});
    }

    return { error: null };
}

// ─── Likes ────────────────────────────────────────────────────────────────────

/**
 * Like a win (idempotent).
 * Saves to the 'likes' table with a win_id column.
 * @param {string|number} winId
 * @returns {Promise<{error: object|null}>}
 */
async function likeWin(winId) {
    const session = await _requireSession();
    const sb = _client();
    const { error } = await sb.from('likes').upsert(
        { win_id: winId, user_id: session.user.id },
        { onConflict: 'win_id,user_id', ignoreDuplicates: true }
    );
    return { error };
}

/**
 * Unlike a win.
 * @param {string|number} winId
 * @returns {Promise<{error: object|null}>}
 */
async function unlikeWin(winId) {
    const session = await _requireSession();
    const sb = _client();
    const { error } = await sb.from('likes').delete()
        .eq('win_id', winId)
        .eq('user_id', session.user.id);
    return { error };
}

/**
 * Get all win IDs liked by a user.
 * @param {string} userId
 * @returns {Promise<{data: (string|number)[], error: object|null}>}
 */
async function getUserWinLikes(userId) {
    const sb = _client();
    const { data, error } = await sb.from('likes')
        .select('win_id')
        .eq('user_id', userId)
        .not('win_id', 'is', null);
    return { data: (data || []).map(r => r.win_id), error };
}

// ─── Comments (count only) ───────────────────────────────────────────────────

/**
 * Get comment count for a win.
 * @param {string|number} winId
 * @returns {Promise<number>}
 */
async function getCommentCount(winId) {
    const sb = _client();
    const { count } = await sb.from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('win_id', winId);
    return count || 0;
}

/**
 * Get comments for a win.
 * @param {string|number} winId
 * @returns {Promise<{data: object[]|null, error: object|null}>}
 */
async function getComments(winId) {
    const sb = _client();
    const { data, error } = await sb.from('comments')
        .select('*, profiles!left(username, display_name, profile_picture_url, is_verified)')
        .eq('win_id', winId)
        .order('created_at', { ascending: true })
        .limit(50);
    return { data, error };
}

/**
 * Post a comment on a win.
 * @param {string|number} winId
 * @param {string} content
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
async function createComment(winId, content) {
    const session = await _requireSession();
    const sb = _client();
    const { data, error } = await sb.from('comments').insert({
        win_id: winId,
        user_id: session.user.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
    }).select().single();
    return { data, error };
}

// ─── Expose globally ──────────────────────────────────────────────────────────

window.WinsService = {
    // Core CRUD
    createWin,
    getWins,
    getUserWins,
    updateWin,
    deleteWin,
    // Upload
    uploadWinScreenshot,
    // Likes
    likeWin,
    unlikeWin,
    getUserWinLikes,
    // Comments
    getCommentCount,
    getComments,
    createComment,
};
