/**
 * SpinZone Profile Service
 * Supabase-powered service functions for user profile management.
 */

const SUPABASE_URL = 'https://rcsntlpytbwosykkhzzg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjc250bHB5dGJ3b3N5a2toenpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMDg2NDEsImV4cCI6MjA4NzU4NDY0MX0.JZ8iZ6dFSQv_G5wgIJ7RGosA4WR5ZIwdvKbbKLjwXfI';

function _client() {
    if (window._szSb) return window._szSb;
    if (typeof window.supabase === 'undefined') throw new Error('Supabase JS not loaded');
    window._szSb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return window._szSb;
}

/**
 * Fetch a user's profile by ID.
 * @param {string} userId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
async function getProfile(userId) {
    const sb = _client();
    const { data, error } = await sb
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return { data, error };
}

/**
 * Update a user's profile fields.
 * @param {string} userId
 * @param {object} updates – any subset of profile columns
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
async function updateProfile(userId, updates) {
    const sb = _client();
    const { data: session } = await sb.auth.getSession();
    if (!session?.session || session.session.user.id !== userId) {
        return { data: null, error: { message: 'Unauthorized' } };
    }
    const { data, error } = await sb
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
    return { data, error };
}

/**
 * Upload a profile picture to Supabase Storage and update the profile row.
 * @param {File} file
 * @returns {Promise<{url: string|null, error: object|null}>}
 */
async function uploadProfilePicture(file) {
    const sb = _client();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return { url: null, error: { message: 'Not authenticated' } };

    const userId = session.user.id;
    const ext = file.name.split('.').pop();
    const filePath = `avatars/${userId}.${ext}`;

    const { error: uploadError } = await sb.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) return { url: null, error: uploadError };

    const { data: { publicUrl } } = sb.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

    const { error: updateError } = await sb
        .from('user_profiles')
        .update({ profile_picture_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);

    if (updateError) return { url: null, error: updateError };
    return { url: publicUrl, error: null };
}

/**
 * Follow another user.
 * @param {string} targetUserId
 * @returns {Promise<{error: object|null}>}
 */
async function followUser(targetUserId) {
    const sb = _client();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return { error: { message: 'Not authenticated' } };
    const followerId = session.user.id;
    if (followerId === targetUserId) return { error: { message: 'Cannot follow yourself' } };

    const { error } = await sb.from('follows').insert({
        follower_id: followerId,
        following_id: targetUserId,
    });
    // Notify the followed user
    if(!error&&window.NotificationsService){
        const{data:p}=await sb.from('profiles').select('display_name,username').eq('id',followerId).single().catch(()=>({data:null}));
        const name=p?.display_name||p?.username||session.user.email?.split('@')[0]||'Someone';
        NotificationsService.createNotification({userId:targetUserId,type:'follow',message:name+' started following you!',actorId:followerId,referenceId:followerId,referenceType:'profile'}).catch(()=>{});
    }
    return { error };
}

/**
 * Unfollow another user.
 * @param {string} targetUserId
 * @returns {Promise<{error: object|null}>}
 */
async function unfollowUser(targetUserId) {
    const sb = _client();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return { error: { message: 'Not authenticated' } };
    const followerId = session.user.id;

    const { error } = await sb.from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', targetUserId);
    return { error };
}

/**
 * Check whether the current user follows a target user.
 * @param {string} targetUserId
 * @returns {Promise<boolean>}
 */
async function isFollowing(targetUserId) {
    const sb = _client();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return false;
    const { data } = await sb.from('follows')
        .select('id')
        .eq('follower_id', session.user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();
    return !!data;
}

/**
 * Get a user's follow counts (followers + following).
 * @param {string} userId
 * @returns {Promise<{followers: number, following: number}>}
 */
async function getFollowCounts(userId) {
    const sb = _client();
    const [{ count: followers }, { count: following }] = await Promise.all([
        sb.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
        sb.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);
    return { followers: followers || 0, following: following || 0 };
}

// Expose globally so inline scripts can use them
window.ProfileService = {
    getProfile,
    updateProfile,
    uploadProfilePicture,
    followUser,
    unfollowUser,
    isFollowing,
    getFollowCounts,
};
