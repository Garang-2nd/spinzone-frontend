/**
 * SpinZone Picks Service
 * Handles pick CRUD, result tracking, and likes against Supabase.
 *
 * Tables used:  picks, likes, profiles
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
    const { data: { session } } = await _client().auth.getSession();
    if (!session) throw new Error('You must be signed in.');
    return session;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Create a new pick.
 * @param {object} data
 * @param {string}        data.title        – e.g. "Lakers -5.5"  (required)
 * @param {string}        data.sport        – e.g. "NBA"
 * @param {string}        [data.league]
 * @param {string}        [data.selection]  – team / market
 * @param {string}        [data.pick_type]  – moneyline|spread|total|prop
 * @param {string|number} [data.odds]       – e.g. "-110" or "1.91"
 * @param {string|number} [data.stake]      – e.g. "1u" or "100"
 * @param {string}        [data.reasoning]
 * @param {string}        [data.event_date] – ISO date string
 * @returns {Promise<{data:object|null, error:object|null}>}
 */
async function createPick(data) {
    const session = await _requireSession();
    const sb = _client();

    const row = {
        user_id: session.user.id,
        title: (data.title || '').trim(),
        sport: (data.sport || '').trim() || null,
        league: (data.league || '').trim() || null,
        selection: (data.selection || '').trim() || null,
        pick_type: data.pick_type || 'moneyline',
        odds: data.odds != null ? String(data.odds).trim() || null : null,
        stake: data.stake != null ? String(data.stake).trim() || null : null,
        reasoning: (data.reasoning || '').trim() || null,
        event_date: data.event_date || null,
        result: null,   // pending
        created_at: new Date().toISOString(),
    };

    const { data: result, error } = await sb.from('picks').insert(row).select().single();
    return { data: result, error };
}

/**
 * Fetch picks with optional filters.
 * @param {object} [filters]
 * @param {'new'|'popular'|'record'} [filters.sort='new']
 * @param {string}  [filters.sport]
 * @param {string}  [filters.result]    – 'win'|'loss'|'pending'
 * @param {string}  [filters.userId]
 * @param {number}  [filters.limit=30]
 * @param {number}  [filters.offset=0]
 * @returns {Promise<{data:object[]|null, error:object|null}>}
 */
async function getPicks(filters = {}) {
    const sb = _client();
    const { sort = 'new', sport, result, userId, limit = 30, offset = 0 } = filters;

    let query = sb.from('picks')
        .select('*, profiles!left(username, display_name, is_verified, profile_picture_url), likes!left(id)')
        .range(offset, offset + limit - 1);

    if (sport && sport !== 'all') query = query.eq('sport', sport);
    if (result === 'pending') query = query.is('result', null);
    else if (result === 'win') query = query.eq('result', 'win');
    else if (result === 'loss') query = query.eq('result', 'loss');
    if (userId) query = query.eq('user_id', userId);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
        // Degrade gracefully if join fails
        if (error.message?.includes('relationship')) {
            const { data: bare, error: e2 } = await sb.from('picks')
                .select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
            return { data: bare, error: e2 };
        }
        return { data: null, error };
    }

    const normalised = (data || []).map(p => ({
        ...p,
        display_name: p.profiles?.display_name || p.profiles?.username || 'Capper',
        is_verified: p.profiles?.is_verified || false,
        profile_picture_url: p.profiles?.profile_picture_url || null,
        like_count: Array.isArray(p.likes) ? p.likes.length : 0,
        result_label: p.result === 'win' ? 'win' : p.result === 'loss' ? 'loss' : 'pending',
    }));

    if (sort === 'popular') normalised.sort((a, b) => b.like_count - a.like_count);

    return { data: normalised, error: null };
}

/**
 * Get all picks for a specific user.
 * @param {string} userId
 * @returns {Promise<{data:object[]|null, error:object|null}>}
 */
async function getUserPicks(userId) {
    return getPicks({ userId, limit: 100 });
}

/**
 * Update a pick (owner only).
 * @param {string|number} id
 * @param {object} updates
 * @returns {Promise<{data:object|null, error:object|null}>}
 */
async function updatePick(id, updates) {
    const session = await _requireSession();
    const sb = _client();
    const { data, error } = await sb.from('picks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select().single();
    return { data, error };
}

/**
 * Delete a pick (owner only).
 * @param {string|number} id
 * @returns {Promise<{error:object|null}>}
 */
async function deletePick(id) {
    const session = await _requireSession();
    const sb = _client();
    await sb.from('likes').delete().eq('pick_id', id).catch(() => {});
    const { error } = await sb.from('picks').delete().eq('id', id).eq('user_id', session.user.id);
    return { error };
}

/**
 * Mark a pick's result (owner only).
 * @param {string|number} id
 * @param {'win'|'loss'|null} result  – null resets to pending
 * @returns {Promise<{error:object|null}>}
 */
async function markResult(id, result) {
    const { error } = await updatePick(id, { result });
    return { error };
}

// ─── Likes ────────────────────────────────────────────────────────────────────

/**
 * Like a pick (idempotent, uses 'likes' table with pick_id).
 * @param {string|number} pickId
 * @returns {Promise<{error:object|null}>}
 */
async function likePick(pickId) {
    const session = await _requireSession();
    const sb = _client();
    const { error } = await sb.from('likes').upsert(
        { pick_id: pickId, user_id: session.user.id },
        { onConflict: 'pick_id,user_id', ignoreDuplicates: true }
    );
    return { error };
}

/**
 * Unlike a pick.
 * @param {string|number} pickId
 * @returns {Promise<{error:object|null}>}
 */
async function unlikePick(pickId) {
    const session = await _requireSession();
    const sb = _client();
    const { error } = await sb.from('likes').delete()
        .eq('pick_id', pickId).eq('user_id', session.user.id);
    return { error };
}

/**
 * Get all pick IDs liked by the current user.
 * @returns {Promise<{data:(string|number)[], error:object|null}>}
 */
async function getUserPickLikes() {
    const { data: { session } } = await _client().auth.getSession();
    if (!session) return { data: [], error: null };
    const { data, error } = await _client().from('likes')
        .select('pick_id').eq('user_id', session.user.id).not('pick_id', 'is', null);
    return { data: (data || []).map(r => r.pick_id), error };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

/**
 * Compute W/L/pending record for a user.
 * @param {string} userId
 * @returns {Promise<{wins:number, losses:number, pending:number, winRate:number}>}
 */
async function getUserRecord(userId) {
    const sb = _client();
    const { data } = await sb.from('picks').select('result').eq('user_id', userId);
    const rows = data || [];
    const wins = rows.filter(r => r.result === 'win').length;
    const losses = rows.filter(r => r.result === 'loss').length;
    const pending = rows.filter(r => !r.result).length;
    const settled = wins + losses;
    return { wins, losses, pending, winRate: settled ? Math.round((wins / settled) * 100) : 0 };
}

// ─── Expose ───────────────────────────────────────────────────────────────────

window.PicksService = {
    createPick,
    getPicks,
    getUserPicks,
    updatePick,
    deletePick,
    markResult,
    likePick,
    unlikePick,
    getUserPickLikes,
    getUserRecord,
};
