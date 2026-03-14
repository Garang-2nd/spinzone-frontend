const fs=require('fs');

// Shared head/CSS - read from index.html and extract style block
const idx=fs.readFileSync('index.html','utf8');
const styleMatch=idx.match(/<style>([\s\S]*?)<\/style>/);
const sharedCSS=styleMatch?styleMatch[1]:'';

function head(title,desc,active){
return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="description" content="${desc}">
    <title>${title} | SpinZone</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>${sharedCSS}
        .page-wrap{max-width:1200px;margin:0 auto;padding:1.5rem}
        .page-title{font-size:1.8rem;font-weight:800;margin-bottom:.5rem;letter-spacing:-.5px}
        .page-subtitle{color:var(--text-muted);font-size:.95rem;margin-bottom:1.5rem}
        .sport-tabs{display:flex;gap:.5rem;margin-bottom:1.5rem;overflow-x:auto;scrollbar-width:none;padding-bottom:.25rem}.sport-tabs::-webkit-scrollbar{display:none}
        .sport-tab{padding:.5rem 1.25rem;border-radius:20px;font-size:.85rem;font-weight:600;cursor:pointer;border:1px solid var(--card-border);color:var(--text-muted);white-space:nowrap;transition:all .2s;background:transparent}.sport-tab:hover{color:var(--text-main);border-color:var(--text-main)}.sport-tab.active{background:var(--primary);color:#fff;border-color:var(--primary)}
        
        /* Payment Wall specific */
        .paywall{background:var(--card-bg);border:1px solid var(--card-border);border-radius:16px;padding:3rem 2rem;text-align:center;max-width:600px;margin:3rem auto;position:relative;overflow:hidden}
        .paywall::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--primary),var(--gold),var(--primary));background-size:200% 100%;animation:grad 3s linear infinite}
        @keyframes grad{0%{background-position:100% 0}100%{background-position:-100% 0}}
        .paywall-icon{font-size:3.5rem;margin-bottom:1rem;display:inline-block;animation:float 3s ease-in-out infinite}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .paywall h3{font-size:1.8rem;font-weight:800;margin-bottom:.75rem}
        .paywall p{color:var(--text-muted);font-size:1.05rem;margin-bottom:2rem;line-height:1.5}
        
        .plan-cards{display:flex;flex-wrap:wrap;gap:1.5rem;margin:2rem 0;justify-content:center}
        .plan-card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:16px;padding:2.5rem 2rem;text-align:center;position:relative;transition:all .25s;flex:1;min-width:280px;max-width:350px}
        .plan-card:hover{border-color:var(--primary);transform:translateY(-5px);box-shadow:0 12px 30px rgba(0,0,0,.4)}
        .plan-card.featured{border-color:var(--gold);box-shadow:0 0 30px rgba(245,158,11,.15);transform:scale(1.02)}
        .plan-card.featured:hover{transform:scale(1.02) translateY(-5px);box-shadow:0 12px 40px rgba(245,158,11,.25)}
        .plan-card.featured::before{content:'MOST POPULAR';position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--gold),#d97706);color:#000;font-size:.7rem;font-weight:800;padding:4px 16px;border-radius:20px;letter-spacing:1px}
        .plan-badge{font-size:2.5rem;margin-bottom:1rem;display:block}
        .plan-name{font-size:1.4rem;font-weight:800;margin-bottom:.5rem}
        .plan-price{font-size:2.5rem;font-weight:800;margin-bottom:.25rem}.plan-price span{font-size:1rem;font-weight:500;color:var(--text-muted)}
        .plan-desc{font-size:.9rem;color:var(--text-muted);margin-bottom:1.5rem;min-height:40px}
        .plan-features{list-style:none;text-align:left;margin-bottom:2rem;padding:0}.plan-features li{padding:.5rem 0;font-size:.9rem;color:var(--text-main);display:flex;align-items:flex-start;gap:.75rem;border-bottom:1px solid rgba(255,255,255,.05)}.plan-features li:last-child{border-bottom:none}.plan-features li::before{content:'✓';color:var(--accent);font-weight:800;font-size:1.1rem}
        .plan-features li.cross{color:var(--text-dim)}.plan-features li.cross::before{content:'✕';color:var(--text-dim)}
        .plan-btn{width:100%;padding:1rem;border:none;border-radius:10px;font-weight:800;font-size:1rem;cursor:pointer;transition:all .2s;text-transform:uppercase;letter-spacing:.5px}
        .plan-btn-free{background:transparent;color:var(--text-muted);border:2px solid var(--card-border)}.plan-btn-free:hover{border-color:var(--text-main);color:var(--text-main);background:rgba(255,255,255,.05)}
        .plan-btn-pro{background:var(--primary);color:#fff;box-shadow:0 4px 15px rgba(139,92,246,.3)}.plan-btn-pro:hover{background:var(--primary-hover);transform:translateY(-2px);box-shadow:0 6px 20px rgba(139,92,246,.4)}
        .plan-btn-vip{background:linear-gradient(135deg,var(--gold),#d97706);color:#000;box-shadow:0 4px 15px rgba(245,158,11,.3)}.plan-btn-vip:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(245,158,11,.4)}
        
        .feature-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;margin:3rem 0}
        .feature-card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:12px;padding:1.5rem;text-align:center;transition:all .25s}.feature-card:hover{border-color:var(--primary);transform:translateY(-3px)}
        .feature-icon{font-size:2.5rem;margin-bottom:1rem;display:block}
        .feature-title{font-weight:800;font-size:1.1rem;margin-bottom:.5rem;color:var(--text-main)}
        .feature-desc{font-size:.9rem;color:var(--text-muted);line-height:1.5}
        
        .testimonial{background:var(--surface);border:1px solid var(--card-border);border-radius:12px;padding:1.5rem;margin-top:2rem;font-style:italic;color:var(--text-muted);position:relative}
        .testimonial::before{content:'"';position:absolute;top:10px;left:15px;font-size:4rem;color:rgba(139,92,246,.1);font-family:serif;line-height:1}
        .testimonial-author{display:flex;align-items:center;gap:.75rem;margin-top:1rem;font-style:normal}
        .testimonial-author .av{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff}
        .testimonial-author .nm{font-weight:700;color:var(--text-main);font-size:.9rem}.testimonial-author .rnk{color:var(--gold);font-size:.75rem}
    </style>
</head>
<body>
    <header>
        <a href="/" class="logo"><div class="logo-icon">🎲</div><div><b>Spin</b><span>Zone</span></div></a>
        <div style="display:flex;align-items:center;gap:.75rem">
            <a href="/premium.html" class="btn-gold" style="text-decoration:none">👑 Go Pro</a>
        </div>
    </header>
    <nav class="sz-nav"><div class="sz-nav-inner">
        <a class="sz-nav-link${active==='home'?' active':''}" href="/">🏠 Home</a>
        <a class="sz-nav-link${active==='sports'?' active':''}" href="/sportsbook.html">⚽ Sports <span class="badge-nav red">NEW</span></a>
        <a class="sz-nav-link${active==='casinos'?' active':''}" href="/casinos.html">🎰 Casinos</a>
        <a class="sz-nav-link${active==='picks'?' active':''}" href="/picks.html">🎯 Picks <span class="badge-nav red">HOT</span></a>
        <a class="sz-nav-link${active==='wins'?' active':''}" href="/wins.html">🏆 Wins</a>
        <a class="sz-nav-link${active==='insights'?' active':''}" href="/insights.html">📊 Insights <span class="badge-nav gold">PRO</span></a>
        <a class="sz-nav-link${active==='community'?' active':''}" href="/discuss.html">💬 Community</a>
        <a class="sz-nav-link${active==='premium'?' active':''}" href="/premium.html">👑 Premium</a>
    </div></nav>
`;
}

const footer=`
    <footer><h3>SpinZone</h3><p>Your daily dose of casino culture.</p><div class="disclaimer"><p><strong>18+ Only. Please Gamble Responsibly.</strong></p><p>SpinZone does not offer real money gambling. All content is for informational purposes only.</p></div></footer>
</body>
</html>`;

// ===== INSIGHTS =====
fs.writeFileSync('insights.html', head('Betting Insights','SpinZone Insights - Professional betting analysis and market trends','insights')+`
    <div class="page-wrap">
        <h1 class="page-title">📊 Betting Insights</h1>
        <p class="page-subtitle">Deep dives, market analysis, and advanced betting strategies from professional bettors.</p>

        <div class="sport-tabs">
            <div class="sport-tab active">All Insights</div>
            <div class="sport-tab">📈 Market Analysis</div>
            <div class="sport-tab">🎯 Strategy</div>
            <div class="sport-tab">📊 Statistics</div>
            <div class="sport-tab">💡 Betting Guides</div>
        </div>

        <div class="grid-3">
            <div class="ns-card ins-card">
                <div class="ins-cat">📈 Market Analysis</div>
                <div class="ins-title">NBA Playoffs: Why Underdogs Are Covering at a Historic Rate</div>
                <div class="ins-preview">Through 42 playoff games, underdogs are covering the spread at 58.3%, the highest rate since 2018. We break down the key data driving this trend and how to exploit it in the upcoming conference semi-finals. Specifically, home underdogs in Game 3s are showing a massive ROI.</div>
                <div class="ins-footer"><span>5 min read</span><span>🔓 Free</span></div>
            </div>
            <div class="ns-card ins-card ins-locked">
                <div class="ins-cat">🎯 Advanced Strategy</div>
                <div class="ins-title">The Kelly Criterion: How to Size Your Bets Like a Pro</div>
                <div class="ins-preview">Professional bettors don't use flat betting. They use mathematical formulas like the Kelly Criterion to determine exactly how much to wager on each bet based on their perceived edge. This guide walks you through the formula and provides a downloadable calculator spreadsheet.</div>
                <div class="ins-footer"><span>8 min read</span><span>👑 Pro Only</span></div>
            </div>
            <div class="ns-card ins-card">
                <div class="ins-cat">📊 Statistics</div>
                <div class="ins-title">Premier League BTTS Trends: Which Teams to Target</div>
                <div class="ins-preview">Both Teams to Score (BTTS) is one of the most popular football markets. We analyzed 380 matches from the current season to find the most profitable teams to target. Surprising data shows that mid-table teams playing away at top-6 clubs offer the highest value.</div>
                <div class="ins-footer"><span>6 min read</span><span>🔓 Free</span></div>
            </div>
            <div class="ns-card ins-card ins-locked">
                <div class="ins-cat">💡 Betting Guides</div>
                <div class="ins-title">Live Betting: How to Hedge In-Game Like a Pro</div>
                <div class="ins-preview">Live betting offers the biggest edge currently available in sports betting, if you know what you are doing. This deep dive explains how to read momentum shifts, when to hedge a pre-game position to guarantee profit, and the common traps recreational bettors fall into.</div>
                <div class="ins-footer"><span>12 min read</span><span>👑 Pro Only</span></div>
            </div>
            <div class="ns-card ins-card ins-locked">
                <div class="ins-cat">📈 Market Analysis</div>
                <div class="ins-title">NFL Draft Prop Bets: Historical Data Analysis</div>
                <div class="ins-preview">The NFL draft is essentially an information market. By analyzing historical line movement compared to credible insider reports in the 48 hours before the draft, we've identified three specific prop markets (first WR selected, total QBs in Round 1) with massive EV.</div>
                <div class="ins-footer"><span>7 min read</span><span>👑 Pro Only</span></div>
            </div>
            <div class="ns-card ins-card">
                <div class="ins-cat">🎯 Advanced Strategy</div>
                <div class="ins-title">Bankroll Management 101: Preventing the Bust</div>
                <div class="ins-preview">The single biggest reason casual sports bettors lose their bankroll isn't bad picks—it's disastrous bankroll management. We cover the unit system, chasing losses, and why setting a fixed percentage per bet is the only sustainable way to survive long-term variance.</div>
                <div class="ins-footer"><span>4 min read</span><span>🔓 Free</span></div>
            </div>
        </div>
        
        <div class="paywall">
            <span class="paywall-icon">👑</span>
            <h3>Unlock Professional Betting Insights</h3>
            <p>Get serious about your betting. Pro members get weekly market reports, advanced modeling data, and deep-dive strategy guides.</p>
            <a href="/premium.html" class="plan-btn plan-btn-pro" style="display:inline-block;max-width:250px;text-decoration:none">View Premium Plans</a>
        </div>
    </div>
`+footer);
console.log('✅ insights.html');

// ===== COMMUNITY =====
fs.writeFileSync('discuss.html', head('Community Discussions','SpinZone Forums - Join the discussion on strategy, brag about wins, or get help','community')+`
    <div class="page-wrap">
        <h1 class="page-title">💬 Community Discussions</h1>
        <p class="page-subtitle">Join thousands of players discussing strategy, sharing wins, and helping each other beat the house.</p>

        <div class="sport-tabs">
            <div class="sport-tab active">All Categories</div>
            <div class="sport-tab">💎 General Discussion</div>
            <div class="sport-tab">🎯 Strategy & Tips</div>
            <div class="sport-tab">🎉 Brags & Wins</div>
            <div class="sport-tab">❓ Help & Questions</div>
        </div>
        
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <div class="fpill-row" style="margin:0"><div class="fpill active">🔥 Hot</div><div class="fpill">✨ New</div><div class="fpill">📈 Top</div></div>
            <button class="plan-btn plan-btn-pro" style="width:auto;padding:.5rem 1rem;border-radius:6px;font-size:.85rem">+ New Topic</button>
        </div>

        <div style="display:flex;flex-direction:column;gap:1rem">
            <div class="ns-card dsc-card" style="border-left:3px solid var(--accent)">
                <div class="dsc-header">
                    <div class="dsc-av" style="background:linear-gradient(135deg,var(--primary),#6366f1)">RK</div>
                    <div class="dsc-body">
                        <div class="dsc-title" style="font-size:1.1rem">📌 [MEGA THREAD] What's your go-to bankroll management strategy?</div>
                        <div class="dsc-meta"><span>by <b>RoyalKing</b> <span class="badge-nav gold">MOD</span></span><span class="dsc-cat dsc-cat-strat">Strategy & Tips</span><span>2 hours ago</span></div>
                    </div>
                </div>
                <div class="dsc-stats"><span>💬 124 replies</span><span>❤️ 89 likes</span><span>👁 1.2K views</span></div>
            </div>
            
            <div class="ns-card dsc-card">
                <div class="dsc-header">
                    <div class="dsc-av" style="background:linear-gradient(135deg,var(--gold),#d97706)">SQ</div>
                    <div class="dsc-body">
                        <div class="dsc-title" style="font-size:1.1rem">Just hit $10K on a 3-leg parlay! I'm buying the bar shots tonight! 🎉</div>
                        <div class="dsc-meta"><span>by <b>SlotQueen</b></span><span class="dsc-cat dsc-cat-brags">Brags & Wins</span><span>45 minutes ago</span></div>
                        <p style="color:var(--text-muted);font-size:.85rem;margin-top:.5rem;line-height:1.4">Hit the Lakers spread, Arsenal moneyline, and Jones by sub. Sweated the last 5 minutes of that Arsenal game so hard...</p>
                    </div>
                </div>
                <div class="dsc-stats"><span>💬 67 replies</span><span>❤️ 234 likes</span><span>👁 4.5K views</span></div>
            </div>
            
            <div class="ns-card dsc-card">
                <div class="dsc-header">
                    <div class="dsc-av" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8)">NB</div>
                    <div class="dsc-body">
                        <div class="dsc-title" style="font-size:1.1rem">Best crypto casino for fast withdrawals in 2025? (No KYC if possible)</div>
                        <div class="dsc-meta"><span>by <b>NewbieBettor</b></span><span class="dsc-cat dsc-cat-help">Help & Questions</span><span>3 hours ago</span></div>
                    </div>
                </div>
                <div class="dsc-stats"><span>💬 21 replies</span><span>❤️ 4 likes</span><span>👁 289 views</span></div>
            </div>
            
            <div class="ns-card dsc-card">
                <div class="dsc-header">
                    <div class="dsc-av" style="background:linear-gradient(135deg,#ec4899,#be185d)">JS</div>
                    <div class="dsc-body">
                        <div class="dsc-title" style="font-size:1.1rem">Is 'Double Down' always the right move on an 11 vs dealer 10?</div>
                        <div class="dsc-meta"><span>by <b>Jack_Split</b></span><span class="dsc-cat dsc-cat-strat">Strategy & Tips</span><span>5 hours ago</span></div>
                    </div>
                </div>
                <div class="dsc-stats"><span>💬 45 replies</span><span>❤️ 12 likes</span><span>👁 530 views</span></div>
            </div>
            
            <div class="ns-card dsc-card">
                <div class="dsc-header">
                    <div class="dsc-av" style="background:linear-gradient(135deg,#10b981,#047857)">GV</div>
                    <div class="dsc-body">
                        <div class="dsc-title" style="font-size:1.1rem">Stake vs BC.Game - which VIP program is actually better long term?</div>
                        <div class="dsc-meta"><span>by <b>GambleVet</b> <span class="badge-nav gold">VIP</span></span><span class="dsc-cat dsc-cat-gen">General Discussion</span><span>Yesterday</span></div>
                    </div>
                </div>
                <div class="dsc-stats"><span>💬 89 replies</span><span>❤️ 34 likes</span><span>👁 2.1K views</span></div>
            </div>
        </div>
        
        <div style="text-align:center;margin-top:2rem">
            <button class="plan-btn plan-btn-free" style="max-width:200px">Load More Topics</button>
        </div>
    </div>
`+footer);
console.log('✅ discuss.html');

// ===== PREMIUM =====
fs.writeFileSync('premium.html', head('SpinZone Premium','Upgrade to SpinZone Pro or VIP for exclusive picks, insights, and bonuses','premium')+`
    <div class="page-wrap" style="max-width:1000px">
        <div style="text-align:center;margin-bottom:3rem">
            <h1 class="page-title" style="font-size:2.5rem;margin-bottom:1rem">Take Your Betting to the <span style="background:linear-gradient(135deg,var(--gold),#d97706);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Next Level</span></h1>
            <p class="page-subtitle" style="font-size:1.1rem;max-width:600px;margin:0 auto">Join thousands of professional bettors using SpinZone's advanced insights, data models, and exclusive VIP picks to beat the house.</p>
        </div>

        <div class="plan-cards">
            <!-- Free / Basic -->
            <div class="plan-card">
                <span class="plan-badge">🐣</span>
                <h3 class="plan-name">Rookie</h3>
                <div class="plan-price">$0<span>/forever</span></div>
                <p class="plan-desc">For casual players exploring the casino space.</p>
                <ul class="plan-features">
                    <li>Basic Community Access</li>
                    <li>View Player Wins Feed</li>
                    <li>3 Free Daily Sports Picks</li>
                    <li>Casino Directory Access</li>
                    <li class="cross">Premium Betting Insights</li>
                    <li class="cross">Unlimited Daily Picks</li>
                    <li class="cross">Exclusive Casino Deals</li>
                </ul>
                <button class="plan-btn plan-btn-free">Current Plan</button>
            </div>
            
            <!-- Pro / Featured -->
            <div class="plan-card featured">
                <span class="plan-badge">🔥</span>
                <h3 class="plan-name">SpinZone Pro</h3>
                <div class="plan-price">$9.99<span>/mo</span></div>
                <p class="plan-desc">Everything you need to turn professional and build your bankroll.</p>
                <ul class="plan-features">
                    <li>Full Community Access</li>
                    <li>View Player Wins Feed</li>
                    <li><b>Unlimited</b> Daily Sports Picks</li>
                    <li>Casino Directory Access</li>
                    <li><b>All Premium Insights & Models</b></li>
                    <li><b>Pro Profile Badge</b></li>
                    <li class="cross">VIP WhatsApp Group</li>
                </ul>
                <button class="plan-btn plan-btn-pro">Upgrade to Pro</button>
            </div>
            
            <!-- VIP -->
            <div class="plan-card">
                <span class="plan-badge">👑</span>
                <h3 class="plan-name">High Roller VIP</h3>
                <div class="plan-price">$24.99<span>/mo</span></div>
                <p class="plan-desc">The ultimate edge. Direct line to our analysts and max value deals.</p>
                <ul class="plan-features">
                    <li>Everything in Pro</li>
                    <li><b>VIP-Only High Confidence Picks</b></li>
                    <li><b>Direct Analyst Chat</b></li>
                    <li><b>Exclusive Custom Casino Deals</b></li>
                    <li><b>Monthly Strategy Webinars</b></li>
                    <li><b>VIP Profile Badge</b></li>
                    <li><b>Priority Support</b></li>
                </ul>
                <button class="plan-btn plan-btn-vip">Become a VIP</button>
            </div>
        </div>

        <div class="section-divider">What's Included in Premium?</div>
        
        <div class="feature-grid">
            <div class="feature-card">
                <span class="feature-icon">🧠</span>
                <h4 class="feature-title">Data-Driven Models</h4>
                <p class="feature-desc">Stop guessing. Our proprietary models analyze thousands of data points to find EV+ bets across major sports.</p>
            </div>
            <div class="feature-card">
                <span class="feature-icon">💰</span>
                <h4 class="feature-title">Exclusive Bonuses</h4>
                <p class="feature-desc">We negotiate directly with top casinos to get our VIP members deposit bonuses and free spins not available publicly.</p>
            </div>
            <div class="feature-card">
                <span class="feature-icon">📊</span>
                <h4 class="feature-title">Advanced Strategies</h4>
                <p class="feature-desc">Access to in-depth strategy guides covering bankroll management, live hedging, and exploiting weak market lines.</p>
            </div>
            <div class="feature-card">
                <span class="feature-icon">📱</span>
                <h4 class="feature-title">Real-Time Alerts</h4>
                <p class="feature-desc">Get instant notifications when high-value lines open or when important injury news breaks before the market reacts.</p>
            </div>
        </div>

        <div class="paywall" style="margin-top:4rem;border-color:var(--gold)">
            <span class="paywall-icon">🔒</span>
            <h3>Secure Checkout</h3>
            <p style="margin-bottom:1rem">Payments are processed securely via Stripe. Cancel anytime, no questions asked.</p>
            <div style="display:flex;justify-content:center;gap:1.5rem;font-size:2rem;margin-bottom:2rem">
                <span>💳</span><span>📱</span><span>🍎</span><span>₿</span>
            </div>
            <p style="font-size:.8rem;color:var(--text-dim)">By upgrading, you agree to our Terms of Service and recurring billing.</p>
        </div>
    </div>
`+footer);
console.log('✅ premium.html');

console.log('Batch 2 done!');
