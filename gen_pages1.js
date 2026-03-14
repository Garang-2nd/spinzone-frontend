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
        .match-card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:12px;padding:1.25rem;transition:all .25s}.match-card:hover{border-color:var(--primary);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.3)}
        .match-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem}
        .match-league{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:3px 8px;border-radius:4px}
        .match-status{font-size:.7rem;font-weight:700;padding:3px 8px;border-radius:4px}
        .status-live{background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.2);animation:pulse-live 2s infinite}
        @keyframes pulse-live{0%,100%{opacity:1}50%{opacity:.7}}
        .status-upcoming{background:rgba(59,130,246,.15);color:#3b82f6;border:1px solid rgba(59,130,246,.2)}
        .status-final{background:rgba(100,116,139,.15);color:#94a3b8;border:1px solid rgba(100,116,139,.2)}
        .match-teams{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:.5rem}
        .match-team{text-align:center;flex:1}.match-team .name{font-weight:700;font-size:.95rem;margin-bottom:.25rem}.match-team .score{font-size:1.8rem;font-weight:800;color:var(--accent)}
        .match-vs{font-size:.8rem;color:var(--text-dim);font-weight:700}
        .match-info{font-size:.8rem;color:var(--text-dim);text-align:center;margin-top:.5rem}
        .match-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem;margin-bottom:2rem}
        .section-divider{font-size:1rem;font-weight:700;color:var(--text-main);margin:2rem 0 1rem;display:flex;align-items:center;gap:.5rem}
        .section-divider::after{content:'';flex:1;height:1px;background:var(--card-border)}
        /* Payment Wall */
        .paywall{background:var(--card-bg);border:1px solid var(--card-border);border-radius:16px;padding:2rem;text-align:center;max-width:500px;margin:2rem auto}
        .paywall h3{font-size:1.3rem;font-weight:800;margin-bottom:.5rem}
        .paywall p{color:var(--text-muted);font-size:.9rem;margin-bottom:1.5rem}
        .plan-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin:2rem 0}
        .plan-card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:16px;padding:2rem;text-align:center;position:relative;transition:all .25s}
        .plan-card:hover{border-color:var(--primary);transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.3)}
        .plan-card.featured{border-color:var(--primary);box-shadow:0 0 30px rgba(139,92,246,.15)}
        .plan-card.featured::before{content:'MOST POPULAR';position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--primary);color:#fff;font-size:.65rem;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:.5px}
        .plan-badge{font-size:2rem;margin-bottom:.75rem;display:block}
        .plan-name{font-size:1.2rem;font-weight:800;margin-bottom:.25rem}
        .plan-price{font-size:2rem;font-weight:800;margin-bottom:.25rem}.plan-price span{font-size:.9rem;font-weight:400;color:var(--text-muted)}
        .plan-desc{font-size:.85rem;color:var(--text-muted);margin-bottom:1.25rem}
        .plan-features{list-style:none;text-align:left;margin-bottom:1.5rem}.plan-features li{padding:.4rem 0;font-size:.85rem;color:var(--text-muted);display:flex;align-items:center;gap:.5rem}.plan-features li::before{content:'✓';color:var(--accent);font-weight:700}
        .plan-btn{width:100%;padding:.75rem;border:none;border-radius:10px;font-weight:700;font-size:.95rem;cursor:pointer;transition:all .2s}
        .plan-btn-free{background:transparent;color:var(--text-muted);border:1px solid var(--card-border)}.plan-btn-free:hover{border-color:var(--text-main);color:var(--text-main)}
        .plan-btn-pro{background:var(--primary);color:#fff}.plan-btn-pro:hover{background:var(--primary-hover);transform:translateY(-1px)}
        .plan-btn-vip{background:linear-gradient(135deg,var(--gold),#d97706);color:#000}.plan-btn-vip:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(245,158,11,.3)}
        .feature-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem;margin:2rem 0}
        .feature-card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:12px;padding:1.25rem;text-align:center;transition:all .25s}.feature-card:hover{border-color:var(--primary);transform:translateY(-2px)}
        .feature-icon{font-size:2rem;margin-bottom:.75rem;display:block}
        .feature-title{font-weight:700;font-size:.95rem;margin-bottom:.35rem}
        .feature-desc{font-size:.82rem;color:var(--text-muted);line-height:1.4}
        @media(max-width:768px){.match-grid{grid-template-columns:1fr}.plan-cards{grid-template-columns:1fr}.page-title{font-size:1.4rem}}
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

// ===== SPORTSBOOK =====
fs.writeFileSync('sportsbook.html', head('Sports','SpinZone Sports - Live scores, upcoming matches, and betting insights','sports')+`
    <div class="page-wrap">
        <h1 class="page-title">⚽ Sports Hub</h1>
        <p class="page-subtitle">Live scores, upcoming matches, and recent results across all major sports.</p>

        <div class="sport-tabs">
            <div class="sport-tab active">🏈 All Sports</div>
            <div class="sport-tab">⚽ Football</div>
            <div class="sport-tab">🏀 Basketball</div>
            <div class="sport-tab">🥊 MMA/UFC</div>
            <div class="sport-tab">🎾 Tennis</div>
            <div class="sport-tab">⚾ Baseball</div>
            <div class="sport-tab">🏒 Hockey</div>
        </div>

        <div class="section-divider">🔴 Live Now</div>
        <div class="match-grid">
            <div class="match-card">
                <div class="match-header"><span class="match-league" style="background:rgba(245,158,11,.15);color:#f59e0b;border:1px solid rgba(245,158,11,.2)">🏀 NBA</span><span class="match-status status-live">● LIVE</span></div>
                <div class="match-teams"><div class="match-team"><div class="name">Lakers</div><div class="score">98</div></div><div class="match-vs">VS</div><div class="match-team"><div class="name">Celtics</div><div class="score">102</div></div></div>
                <div class="match-info">Q4 · 3:42 remaining · TNT</div>
            </div>
            <div class="match-card">
                <div class="match-header"><span class="match-league" style="background:rgba(16,185,129,.15);color:#10b981;border:1px solid rgba(16,185,129,.2)">⚽ Premier League</span><span class="match-status status-live">● LIVE</span></div>
                <div class="match-teams"><div class="match-team"><div class="name">Arsenal</div><div class="score">2</div></div><div class="match-vs">VS</div><div class="match-team"><div class="name">Man City</div><div class="score">1</div></div></div>
                <div class="match-info">65' · Emirates Stadium</div>
            </div>
            <div class="match-card">
                <div class="match-header"><span class="match-league" style="background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.2)">🥊 UFC 315</span><span class="match-status status-live">● LIVE</span></div>
                <div class="match-teams"><div class="match-team"><div class="name">Jones</div><div class="score">—</div></div><div class="match-vs">VS</div><div class="match-team"><div class="name">Aspinall</div><div class="score">—</div></div></div>
                <div class="match-info">Round 3 · Main Event · PPV</div>
            </div>
        </div>

        <div class="section-divider">📅 Upcoming Today</div>
        <div class="match-grid">
            <div class="match-card">
                <div class="match-header"><span class="match-league" style="background:rgba(245,158,11,.15);color:#f59e0b;border:1px solid rgba(245,158,11,.2)">🏀 NBA</span><span class="match-status status-upcoming">7:30 PM ET</span></div>
                <div class="match-teams"><div class="match-team"><div class="name">Warriors</div><div class="score">—</div></div><div class="match-vs">VS</div><div class="match-team"><div class="name">Bucks</div><div class="score">—</div></div></div>
                <div class="match-info">Chase Center · ESPN</div>
            </div>
            <div class="match-card">
                <div class="match-header"><span class="match-league" style="background:rgba(16,185,129,.15);color:#10b981;border:1px solid rgba(16,185,129,.2)">⚽ Champions League</span><span class="match-status status-upcoming">8:00 PM CET</span></div>
                <div class="match-teams"><div class="match-team"><div class="name">Real Madrid</div><div class="score">—</div></div><div class="match-vs">VS</div><div class="match-team"><div class="name">PSG</div><div class="score">—</div></div></div>
                <div class="match-info">Santiago Bernabéu · Paramount+</div>
            </div>
            <div class="match-card">
                <div class="match-header"><span class="match-league" style="background:rgba(59,130,246,.15);color:#3b82f6;border:1px solid rgba(59,130,246,.2)">🎾 ATP Masters</span><span class="match-status status-upcoming">4:00 PM ET</span></div>
                <div class="match-teams"><div class="match-team"><div class="name">Sinner</div><div class="score">—</div></div><div class="match-vs">VS</div><div class="match-team"><div class="name">Alcaraz</div><div class="score">—</div></div></div>
                <div class="match-info">Indian Wells · Semifinal</div>
            </div>
            <div class="match-card">
                <div class="match-header"><span class="match-league" style="background:rgba(139,92,246,.15);color:#8b5cf6;border:1px solid rgba(139,92,246,.2)">🏈 NFL</span><span class="match-status status-upcoming">8:20 PM ET</span></div>
                <div class="match-teams"><div class="match-team"><div class="name">Chiefs</div><div class="score">—</div></div><div class="match-vs">VS</div><div class="match-team"><div class="name">Bills</div><div class="score">—</div></div></div>
                <div class="match-info">Arrowhead Stadium · NBC</div>
            </div>
        </div>

        <div class="section-divider">✅ Recent Results</div>
        <div class="match-grid">
            <div class="match-card" style="opacity:.8">
                <div class="match-header"><span class="match-league" style="background:rgba(245,158,11,.15);color:#f59e0b;border:1px solid rgba(245,158,11,.2)">🏀 NBA</span><span class="match-status status-final">FINAL</span></div>
                <div class="match-teams"><div class="match-team"><div class="name">Nuggets</div><div class="score">118</div></div><div class="match-vs">VS</div><div class="match-team"><div class="name">76ers</div><div class="score">105</div></div></div>
                <div class="match-info">Yesterday · Jokić: 34 pts, 12 reb, 9 ast</div>
            </div>
            <div class="match-card" style="opacity:.8">
                <div class="match-header"><span class="match-league" style="background:rgba(16,185,129,.15);color:#10b981;border:1px solid rgba(16,185,129,.2)">⚽ La Liga</span><span class="match-status status-final">FINAL</span></div>
                <div class="match-teams"><div class="match-team"><div class="name">Barcelona</div><div class="score">3</div></div><div class="match-vs">VS</div><div class="match-team"><div class="name">Atletico</div><div class="score">1</div></div></div>
                <div class="match-info">Yesterday · Lamine Yamal ⚽⚽</div>
            </div>
            <div class="match-card" style="opacity:.8">
                <div class="match-header"><span class="match-league" style="background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.2)">🥊 UFC Fight Night</span><span class="match-status status-final">FINAL</span></div>
                <div class="match-teams"><div class="match-team"><div class="name">Pereira</div><div class="score">W</div></div><div class="match-vs">VS</div><div class="match-team"><div class="name">Hill</div><div class="score">L</div></div></div>
                <div class="match-info">Saturday · KO Round 1 · 2:34</div>
            </div>
        </div>
    </div>
`+footer);
console.log('✅ sportsbook.html');

// ===== CASINOS =====
fs.writeFileSync('casinos.html', head('Casinos','SpinZone Casinos - Top rated online casinos with exclusive bonuses','casinos')+`
    <div class="page-wrap">
        <h1 class="page-title">🎰 Casino Directory</h1>
        <p class="page-subtitle">Curated reviews of the best online casinos with exclusive SpinZone bonus codes.</p>

        <div class="fpill-row"><div class="fpill active">All</div><div class="fpill">🔥 Featured</div><div class="fpill">🎰 Slots</div><div class="fpill">🃏 Poker</div><div class="fpill">🔴 Live</div><div class="fpill">₿ Crypto</div><div class="fpill">🆕 New</div></div>

        <div class="grid-3">
            <div class="ns-card casino-card">
                <div class="casino-top"><div class="c-logo" style="background:linear-gradient(135deg,#1a1a2e,#16213e)">🎲</div><div class="c-info"><div class="c-name">Stake Casino <span class="feat">⭐ FEATURED</span></div><div class="c-rating">★★★★★ 4.9 <span style="color:var(--text-dim);margin-left:.25rem">(2,341 reviews)</span></div></div></div>
                <div class="c-bonus"><div class="amt">200% up to $1,000</div><div class="cde">Code: SPINZONE200</div></div>
                <div class="c-tags"><span class="c-tag">₿ Crypto</span><span class="c-tag">⚡ Instant Payout</span><span class="c-tag">🎰 4000+ Games</span><span class="c-tag">📱 Mobile</span></div>
                <div class="c-bottom"><span class="c-meta">Curacao License · Est. 2017</span><a class="c-visit" href="/go.html?slug=stake-casino&src=casinos">Visit Casino →</a></div>
            </div>
            <div class="ns-card casino-card">
                <div class="casino-top"><div class="c-logo" style="background:linear-gradient(135deg,#0d1117,#1a2332)">🎮</div><div class="c-info"><div class="c-name">BC.Game</div><div class="c-rating">★★★★☆ 4.7 <span style="color:var(--text-dim);margin-left:.25rem">(1,892 reviews)</span></div></div></div>
                <div class="c-bonus"><div class="amt">300% First Deposit</div><div class="cde">Code: BCZONE300</div></div>
                <div class="c-tags"><span class="c-tag">₿ Crypto</span><span class="c-tag">🎁 Daily Rewards</span><span class="c-tag">🎰 5000+ Games</span></div>
                <div class="c-bottom"><span class="c-meta">Curacao License · Est. 2019</span><a class="c-visit" href="/go.html?slug=bc-game&src=casinos">Visit Casino →</a></div>
            </div>
            <div class="ns-card casino-card">
                <div class="casino-top"><div class="c-logo" style="background:linear-gradient(135deg,#1a0a0a,#2d1a1a)">♠️</div><div class="c-info"><div class="c-name">Betway</div><div class="c-rating">★★★★☆ 4.5 <span style="color:var(--text-dim);margin-left:.25rem">(3,204 reviews)</span></div></div></div>
                <div class="c-bonus"><div class="amt">$1,000 Welcome Package</div><div class="cde">3-Part Deposit Match</div></div>
                <div class="c-tags"><span class="c-tag">💳 Visa/MC</span><span class="c-tag">🏆 20+ Years</span><span class="c-tag">📺 Live Dealer</span></div>
                <div class="c-bottom"><span class="c-meta">MGA License · Est. 2006</span><a class="c-visit" href="/go.html?slug=betway&src=casinos">Visit Casino →</a></div>
            </div>
            <div class="ns-card casino-card">
                <div class="casino-top"><div class="c-logo" style="background:linear-gradient(135deg,#0a1628,#1a2a4a)">🎯</div><div class="c-info"><div class="c-name">Duelbits</div><div class="c-rating">★★★★☆ 4.6 <span style="color:var(--text-dim);margin-left:.25rem">(1,120 reviews)</span></div></div></div>
                <div class="c-bonus"><div class="amt">150% Welcome Bonus</div><div class="cde">Code: SPINDB150</div></div>
                <div class="c-tags"><span class="c-tag">₿ Crypto</span><span class="c-tag">🎰 3000+ Games</span><span class="c-tag">🏅 VIP Program</span></div>
                <div class="c-bottom"><span class="c-meta">Curacao License · Est. 2020</span><a class="c-visit" href="/go.html?slug=duelbits&src=casinos">Visit Casino →</a></div>
            </div>
            <div class="ns-card casino-card">
                <div class="casino-top"><div class="c-logo" style="background:linear-gradient(135deg,#1a0a2e,#2d1a4a)">🌟</div><div class="c-info"><div class="c-name">Roobet <span class="feat">🆕 NEW</span></div><div class="c-rating">★★★★☆ 4.4 <span style="color:var(--text-dim);margin-left:.25rem">(890 reviews)</span></div></div></div>
                <div class="c-bonus"><div class="amt">$100 Free Play</div><div class="cde">No Code Needed</div></div>
                <div class="c-tags"><span class="c-tag">₿ Crypto Only</span><span class="c-tag">🎰 Originals</span><span class="c-tag">📺 Live</span></div>
                <div class="c-bottom"><span class="c-meta">Curacao License · Est. 2019</span><a class="c-visit" href="/go.html?slug=roobet&src=casinos">Visit Casino →</a></div>
            </div>
            <div class="ns-card casino-card">
                <div class="casino-top"><div class="c-logo" style="background:linear-gradient(135deg,#0a2818,#1a3a28)">🃏</div><div class="c-info"><div class="c-name">888 Casino</div><div class="c-rating">★★★★☆ 4.3 <span style="color:var(--text-dim);margin-left:.25rem">(4,560 reviews)</span></div></div></div>
                <div class="c-bonus"><div class="amt">$200 Welcome + 25 Spins</div><div class="cde">Code: SPIN888</div></div>
                <div class="c-tags"><span class="c-tag">💳 All Cards</span><span class="c-tag">🏆 25+ Years</span><span class="c-tag">🎰 2000+ Games</span></div>
                <div class="c-bottom"><span class="c-meta">Gibraltar License · Est. 1997</span><a class="c-visit" href="/go.html?slug=888-casino&src=casinos">Visit Casino →</a></div>
            </div>
        </div>
    </div>
`+footer);
console.log('✅ casinos.html');

// ===== PICKS =====
fs.writeFileSync('picks.html', head('Daily Picks','SpinZone Picks - Expert daily betting picks with proven track record','picks')+`
    <div class="page-wrap">
        <h1 class="page-title">🎯 Daily Picks — March 14</h1>
        <p class="page-subtitle">Expert betting picks with a 60.9% win rate this season. Free and premium picks daily.</p>

        <div class="record-bar">
            <div class="rec-item"><div class="rv green">67-43</div><div class="rl">Season Record</div></div>
            <div class="rec-item"><div class="rv gold">60.9%</div><div class="rl">Win Rate</div></div>
            <div class="rec-item"><div class="rv green">+$12,340</div><div class="rl">Total Profit</div></div>
            <div class="rec-item"><div class="rv">🔥 5W Streak</div><div class="rl">Current</div></div>
        </div>

        <div class="sport-tabs">
            <div class="sport-tab active">All Picks</div>
            <div class="sport-tab">🏀 NBA</div>
            <div class="sport-tab">⚽ Football</div>
            <div class="sport-tab">🥊 MMA</div>
            <div class="sport-tab">🎾 Tennis</div>
            <div class="sport-tab">🏈 NFL</div>
        </div>

        <div class="section-divider">🔓 Today's Free Picks</div>
        <div class="grid-3">
            <div class="ns-card pick-card">
                <div class="pick-header"><span class="pick-sport sport-bk">🏀 NBA</span><div class="pick-conf"><div class="cdot on"></div><div class="cdot on"></div><div class="cdot on"></div><div class="cdot on"></div><div class="cdot"></div></div></div>
                <div class="pick-match">Lakers vs Celtics</div><div class="pick-sel">Lakers -3.5</div>
                <div class="pick-odds">Odds: -110 | 7:30 PM ET</div>
                <div class="pick-note">Lakers are 8-2 in their last 10 home games. Celtics on back-to-back.</div>
            </div>
            <div class="ns-card pick-card">
                <div class="pick-header"><span class="pick-sport sport-fb">⚽ Premier League</span><div class="pick-conf"><div class="cdot on"></div><div class="cdot on"></div><div class="cdot on"></div><div class="cdot on"></div><div class="cdot on"></div></div></div>
                <div class="pick-res">✅ WON</div>
                <div class="pick-match">Arsenal vs Chelsea</div><div class="pick-sel">Over 2.5 Goals</div>
                <div class="pick-odds">Odds: -125 | Final: 3-1</div>
                <div class="pick-note">Both teams averaging 3.2 goals per match in H2H this season.</div>
            </div>
            <div class="ns-card pick-card">
                <div class="pick-header"><span class="pick-sport sport-bk">🏀 NBA</span><div class="pick-conf"><div class="cdot on"></div><div class="cdot on"></div><div class="cdot on"></div><div class="cdot"></div><div class="cdot"></div></div></div>
                <div class="pick-match">Warriors vs Bucks</div><div class="pick-sel">Under 224.5</div>
                <div class="pick-odds">Odds: -105 | 7:30 PM ET</div>
                <div class="pick-note">Both teams trending under in last 5. Warriors missing Klay.</div>
            </div>
        </div>

        <div class="section-divider">🔒 Premium Picks (Pro Members)</div>
        <div class="grid-3">
            <div class="ns-card pick-card pick-locked">
                <div class="pick-header"><span class="pick-sport sport-mma">🥊 UFC 315</span><div class="pick-conf"><div class="cdot on"></div><div class="cdot on"></div><div class="cdot on"></div><div class="cdot on"></div><div class="cdot on"></div></div></div>
                <div class="pick-match">Jones vs Aspinall</div><div class="pick-sel">VIP: Method + Round</div>
                <div class="pick-odds">Odds: +450</div>
                <div class="pick-note">Highest confidence play this month. Full breakdown for VIP.</div>
            </div>
            <div class="ns-card pick-card pick-locked">
                <div class="pick-header"><span class="pick-sport sport-fb">⚽ Champions League</span><div class="pick-conf"><div class="cdot on"></div><div class="cdot on"></div><div class="cdot on"></div><div class="cdot on"></div><div class="cdot"></div></div></div>
                <div class="pick-match">Real Madrid vs PSG</div><div class="pick-sel">PRO: BTTS + Over 2.5</div>
                <div class="pick-odds">Odds: +180</div>
                <div class="pick-note">Detailed analysis with expected goals model data.</div>
            </div>
            <div class="ns-card pick-card pick-locked">
                <div class="pick-header"><span class="pick-sport sport-bk">🏀 NBA</span><div class="pick-conf"><div class="cdot on"></div><div class="cdot on"></div><div class="cdot on"></div><div class="cdot on"></div><div class="cdot on"></div></div></div>
                <div class="pick-match">3-Leg Parlay</div><div class="pick-sel">VIP: Player Props</div>
                <div class="pick-odds">Odds: +650</div>
                <div class="pick-note">Data-driven player prop parlay. Full stats in Pro section.</div>
            </div>
        </div>

        <div style="text-align:center;margin:2rem 0">
            <a href="/premium.html" class="btn-gold" style="padding:.75rem 2rem;font-size:1rem;text-decoration:none;display:inline-block;border-radius:10px">🔓 Unlock All Picks — Go Pro</a>
        </div>
    </div>
`+footer);
console.log('✅ picks.html');

// ===== WINS =====
fs.writeFileSync('wins.html', head('Player Wins','SpinZone Wins - Real player wins from real casinos','wins')+`
    <div class="page-wrap">
        <h1 class="page-title">🏆 Player Win Feed</h1>
        <p class="page-subtitle">Real wins from real players. Share your own wins and celebrate with the community.</p>

        <div class="record-bar">
            <div class="rec-item"><div class="rv green">847</div><div class="rl">Total Wins Posted</div></div>
            <div class="rec-item"><div class="rv gold">$1.2M</div><div class="rl">Total Won</div></div>
            <div class="rec-item"><div class="rv green">23</div><div class="rl">Wins Today</div></div>
        </div>

        <div class="sport-tabs">
            <div class="sport-tab active">All Wins</div>
            <div class="sport-tab">🎰 Slots</div>
            <div class="sport-tab">🃏 Poker</div>
            <div class="sport-tab">🏀 Sports</div>
            <div class="sport-tab">🔴 Live Casino</div>
        </div>

        <div class="grid-2">
            <div class="ns-card hw-card"><div class="hw-av" style="background:linear-gradient(135deg,var(--primary),var(--accent))">AK</div><div class="hw-body"><div class="hw-user">AceKing42 <span class="vf">✓</span></div><div class="hw-det">Sweet Bonanza · Stake Casino</div><div class="hw-amt">$5,420 <span class="mx">542x multiplier</span></div><div class="hw-time">12 minutes ago</div></div></div>
            <div class="ns-card hw-card"><div class="hw-av" style="background:linear-gradient(135deg,#f59e0b,#ef4444)">JP</div><div class="hw-body"><div class="hw-user">JackpotJane</div><div class="hw-det">Lightning Roulette · BC.Game</div><div class="hw-amt">$2,150 <span class="mx">430x</span></div><div class="hw-time">34 minutes ago</div></div></div>
            <div class="ns-card hw-card"><div class="hw-av" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6)">MR</div><div class="hw-body"><div class="hw-user">MrRoyal <span class="vf">✓</span></div><div class="hw-det">NFL Parlay · Stake Sportsbook</div><div class="hw-amt">$8,900 <span class="mx">+890% ROI</span></div><div class="hw-time">1 hour ago</div></div></div>
            <div class="ns-card hw-card"><div class="hw-av" style="background:linear-gradient(135deg,#10b981,#059669)">SL</div><div class="hw-body"><div class="hw-user">SlotLover99</div><div class="hw-det">Gates of Olympus · Betway</div><div class="hw-amt">$1,280 <span class="mx">256x</span></div><div class="hw-time">2 hours ago</div></div></div>
            <div class="ns-card hw-card"><div class="hw-av" style="background:linear-gradient(135deg,#ec4899,#8b5cf6)">QC</div><div class="hw-body"><div class="hw-user">QueenOfCards <span class="vf">✓</span></div><div class="hw-det">Blackjack · 888 Casino</div><div class="hw-amt">$3,750 <span class="mx">15x from $250</span></div><div class="hw-time">3 hours ago</div></div></div>
            <div class="ns-card hw-card"><div class="hw-av" style="background:linear-gradient(135deg,#f59e0b,#10b981)">BH</div><div class="hw-body"><div class="hw-user">BigHitter88</div><div class="hw-det">Mega Moolah · Betway</div><div class="hw-amt">$12,450 <span class="mx">Jackpot!</span></div><div class="hw-time">5 hours ago</div></div></div>
        </div>
    </div>
`+footer);
console.log('✅ wins.html');

console.log('Batch 1 done!');
