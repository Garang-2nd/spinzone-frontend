/**
 * SpinZone Notifications Service
 * Bell component, dropdown, CRUD, real-time subscriptions.
 *
 * Table: notifications
 *   id, user_id, type (like|comment|follow|pick_result),
 *   message, actor_id, reference_id, reference_type,
 *   is_read, created_at
 */

const _NS_URL = 'https://rcsntlpytbwosykkhzzg.supabase.co';
const _NS_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjc250bHB5dGJ3b3N5a2toenpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMDg2NDEsImV4cCI6MjA4NzU4NDY0MX0.JZ8iZ6dFSQv_G5wgIJ7RGosA4WR5ZIwdvKbbKLjwXfI';

function _nsClient(){
    if(window._szSb) return window._szSb;
    if(typeof window.supabase==='undefined') throw new Error('Supabase JS not loaded');
    window._szSb=window.supabase.createClient(_NS_URL,_NS_KEY);
    return window._szSb;
}
async function _nsSession(){
    const{data:{session}}=await _nsClient().auth.getSession();
    return session;
}

/* ─── CRUD ─── */

async function getNotifications(userId,{limit=50,type=null}={}){
    const sb=_nsClient();
    let q=sb.from('notifications').select('*,profiles!notifications_actor_id_fkey(display_name,username,profile_picture_url)')
        .eq('user_id',userId).order('created_at',{ascending:false}).limit(limit);
    if(type) q=q.eq('type',type);
    const{data,error}=await q;
    if(error){
        // fallback without join
        const{data:d2}=await sb.from('notifications').select('*')
            .eq('user_id',userId).order('created_at',{ascending:false}).limit(limit);
        return(d2||[]).map(n=>({...n,actor:null}));
    }
    return(data||[]).map(n=>{
        const p=n.profiles||null;
        return{...n,actor:p?{display_name:p.display_name,username:p.username,profile_picture_url:p.profile_picture_url}:null,profiles:undefined};
    });
}

async function getUnreadCount(userId){
    const sb=_nsClient();
    const{count,error}=await sb.from('notifications').select('id',{count:'exact',head:true})
        .eq('user_id',userId).eq('is_read',false);
    if(error) return 0;
    return count||0;
}

async function markAsRead(id){
    const sb=_nsClient();
    await sb.from('notifications').update({is_read:true}).eq('id',id);
}

async function markAllAsRead(userId){
    const sb=_nsClient();
    await sb.from('notifications').update({is_read:true}).eq('user_id',userId).eq('is_read',false);
}

async function createNotification({userId,type,message,actorId=null,referenceId=null,referenceType=null}){
    if(!userId||!type||!message) return null;
    // Don't notify yourself
    const sess=await _nsSession();
    if(sess&&sess.user.id===userId) return null;
    const sb=_nsClient();
    const row={user_id:userId,type,message,is_read:false,created_at:new Date().toISOString()};
    if(actorId) row.actor_id=actorId;
    if(referenceId) row.reference_id=referenceId;
    if(referenceType) row.reference_type=referenceType;
    const{data,error}=await sb.from('notifications').insert(row).select().single();
    if(error) return null;
    return data;
}

function subscribeToNotifications(userId,callback){
    try{
        const sb=_nsClient();
        const chan=sb.channel('notif-'+userId+'-'+Date.now())
            .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'user_id=eq.'+userId},payload=>{
                if(callback) callback(payload.new);
            })
            .subscribe();
        return{unsubscribe:()=>{try{sb.removeChannel(chan)}catch(e){}}};
    }catch(e){
        return{unsubscribe:()=>{}};
    }
}

/* ─── BELL COMPONENT ─── */

let _bellCSSInjected=false;
function _injectBellCSS(){
    if(_bellCSSInjected) return;
    _bellCSSInjected=true;
    const s=document.createElement('style');
    s.id='nbell-css';
    s.textContent=`
.nbell{position:relative;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;width:36px;height:36px;border-radius:50%;background:transparent;border:none;color:var(--text-muted);transition:all .2s;font-size:1.1rem}
.nbell:hover{background:var(--surface);color:var(--text-main)}
.nbell-badge{position:absolute;top:2px;right:1px;background:var(--danger,#ef4444);color:#fff;font-size:.6rem;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;pointer-events:none;line-height:1}
.nbell-drop{position:absolute;top:calc(100% + 8px);right:0;width:340px;max-height:420px;background:var(--card-bg,#141b2d);border:1px solid var(--card-border,#1e293b);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.5);overflow:hidden;z-index:9999;opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .2s,transform .2s}
.nbell-drop.open{opacity:1;transform:translateY(0);pointer-events:auto}
.nbell-hdr{display:flex;justify-content:space-between;align-items:center;padding:.75rem 1rem;border-bottom:1px solid var(--card-border,#1e293b)}
.nbell-hdr h4{font-size:.85rem;font-weight:700;color:var(--text-main,#f1f5f9);margin:0}
.nbell-mark{background:none;border:none;color:var(--primary,#8b5cf6);font-size:.72rem;cursor:pointer;font-weight:600;padding:0}.nbell-mark:hover{text-decoration:underline}
.nbell-list{overflow-y:auto;max-height:340px;padding:.25rem 0}
.nbell-item{display:flex;gap:.65rem;padding:.6rem 1rem;cursor:pointer;transition:background .15s;align-items:flex-start;border-bottom:1px solid rgba(255,255,255,.03)}
.nbell-item:hover{background:var(--surface,#0f172a)}
.nbell-item.unread{background:rgba(139,92,246,.06)}
.nbell-item.unread::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--primary,#8b5cf6);flex-shrink:0;margin-top:.55rem}
.nbell-ico{width:32px;height:32px;border-radius:50%;background:var(--surface,#0f172a);display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0}
.nbell-body{flex:1;min-width:0}
.nbell-msg{font-size:.8rem;color:var(--text-muted,#64748b);line-height:1.4;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.nbell-item.unread .nbell-msg{color:var(--text-main,#f1f5f9)}
.nbell-time{font-size:.68rem;color:var(--text-dim,#475569);margin-top:2px}
.nbell-empty{text-align:center;padding:2rem 1rem;color:var(--text-dim,#475569);font-size:.82rem}
.nbell-footer{border-top:1px solid var(--card-border,#1e293b);text-align:center;padding:.6rem}
.nbell-footer a{color:var(--primary,#8b5cf6);font-size:.78rem;font-weight:600;text-decoration:none}.nbell-footer a:hover{text-decoration:underline}
`;
    document.head.appendChild(s);
}

const _NBELL_ICONS={like:'❤️',comment:'💬',follow:'👤',pick_result:'🎯',system:'📢'};

function _timeAgo(dateStr){
    const s=Math.floor((Date.now()-new Date(dateStr).getTime())/1000);
    if(s<60) return 'just now';
    const m=Math.floor(s/60);if(m<60) return m+'m ago';
    const h=Math.floor(m/60);if(h<24) return h+'h ago';
    const d=Math.floor(h/24);if(d<30) return d+'d ago';
    return new Date(dateStr).toLocaleDateString();
}

function _escN(s){
    if(!s) return '';
    const d=document.createElement('div');d.textContent=s;return d.innerHTML;
}

/**
 * Mount notification bell into a container element.
 * @param {HTMLElement} container
 * @param {{ userId: string }} opts
 * @returns {{ destroy: Function, refresh: Function }}
 */
function mountNotificationBell(container,opts={}){
    if(!container||!opts.userId) return{destroy(){},refresh(){}};
    _injectBellCSS();

    let notifications=[];
    let unreadCount=0;
    let isOpen=false;
    let sub=null;
    const userId=opts.userId;

    // Build DOM
    const wrap=document.createElement('div');
    wrap.style.cssText='position:relative;display:inline-flex';
    wrap.innerHTML=`
        <button class="nbell" aria-label="Notifications" id="nbellBtn">
            🔔<span class="nbell-badge" style="display:none" id="nbellBadge"></span>
        </button>
        <div class="nbell-drop" id="nbellDrop">
            <div class="nbell-hdr"><h4>Notifications</h4><button class="nbell-mark" id="nbellMarkAll">Mark all read</button></div>
            <div class="nbell-list" id="nbellList"></div>
            <div class="nbell-footer"><a href="/notifications.html">View all notifications</a></div>
        </div>`;
    container.appendChild(wrap);

    const btn=wrap.querySelector('#nbellBtn');
    const badge=wrap.querySelector('#nbellBadge');
    const drop=wrap.querySelector('#nbellDrop');
    const list=wrap.querySelector('#nbellList');
    const markAllBtn=wrap.querySelector('#nbellMarkAll');

    function updateBadge(){
        if(unreadCount>0){
            badge.textContent=unreadCount>99?'99+':unreadCount;
            badge.style.display='flex';
        }else{
            badge.style.display='none';
        }
    }

    function renderList(){
        if(!notifications.length){
            list.innerHTML='<div class="nbell-empty">No notifications yet</div>';
            return;
        }
        list.innerHTML=notifications.slice(0,15).map(n=>`
            <div class="nbell-item ${n.is_read?'':'unread'}" data-nid="${_escN(n.id)}">
                <div class="nbell-ico">${_NBELL_ICONS[n.type]||'🔔'}</div>
                <div class="nbell-body">
                    <div class="nbell-msg">${_escN(n.message||n.content||'New notification')}</div>
                    <div class="nbell-time">${_timeAgo(n.created_at)}</div>
                </div>
            </div>
        `).join('');
    }

    function toggle(){
        isOpen=!isOpen;
        drop.classList.toggle('open',isOpen);
    }

    btn.addEventListener('click',e=>{
        e.stopPropagation();
        toggle();
        if(isOpen) refresh();
    });

    // Close on outside click
    function onDocClick(e){
        if(isOpen&&!wrap.contains(e.target)){
            isOpen=false;
            drop.classList.remove('open');
        }
    }
    document.addEventListener('click',onDocClick);

    // Click on notification item
    list.addEventListener('click',async e=>{
        const item=e.target.closest('.nbell-item');
        if(!item) return;
        const nid=item.dataset.nid;
        if(!nid) return;
        const n=notifications.find(x=>x.id===nid);
        if(n&&!n.is_read){
            n.is_read=true;
            unreadCount=Math.max(0,unreadCount-1);
            item.classList.remove('unread');
            updateBadge();
            try{await markAsRead(nid)}catch(e){}
        }
        // Navigate to reference if available
        if(n&&n.reference_type&&n.reference_id){
            const routes={win:'/wins.html',post:'/discuss.html',pick:'/picks.html',profile:'/profile.html'};
            const base=routes[n.reference_type];
            if(base){
                isOpen=false;drop.classList.remove('open');
                window.location.href=base+'?id='+n.reference_id;
            }
        }
    });

    markAllBtn.addEventListener('click',async e=>{
        e.stopPropagation();
        notifications.forEach(n=>n.is_read=true);
        unreadCount=0;
        updateBadge();
        renderList();
        try{await markAllAsRead(userId)}catch(e){}
    });

    async function refresh(){
        try{
            const[notifs,count]=await Promise.all([
                getNotifications(userId,{limit:15}),
                getUnreadCount(userId)
            ]);
            notifications=notifs;
            unreadCount=count;
        }catch(e){
            notifications=[];
            unreadCount=0;
        }
        updateBadge();
        renderList();
    }

    // Real-time
    try{
        sub=subscribeToNotifications(userId,newNotif=>{
            if(newNotif&&!notifications.find(n=>n.id===newNotif.id)){
                notifications.unshift({...newNotif,actor:null});
                if(!newNotif.is_read) unreadCount++;
                updateBadge();
                if(isOpen) renderList();
            }
        });
    }catch(e){}

    // Initial load
    refresh();

    function destroy(){
        if(sub) sub.unsubscribe();
        document.removeEventListener('click',onDocClick);
        wrap.remove();
    }

    return{destroy,refresh};
}

/* ─── EXPORT ─── */
window.NotificationsService={
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    subscribeToNotifications,
    mountNotificationBell
};
