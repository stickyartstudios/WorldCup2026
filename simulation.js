// --- MINI GAME PHYSICS ENGINE ---
let gameActive = false;
let mgTime = 600; 
let matchHalf = 1;
let mgTimerInterval;
let canvas, ctx;
let userPlayer, ball;
let players = [];
let userStats = { passes: 0, intercepts: 0, goals: 0, lost: 0, saves: 0, goalsConceded: 0 };
let mgScore = { user: 0, opp: 0 };

// New Drag & Flick Mechanics State
let isDragging = false;
let targetPos = null;
let touchHistory = [];

function initMiniGameControls() {
    canvas.addEventListener('touchstart', handleTouchStart, {passive: false});
    canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Fallbacks for desktop testing
    canvas.addEventListener('mousedown', handleTouchStart);
    canvas.addEventListener('mousemove', handleTouchMove);
    canvas.addEventListener('mouseup', handleTouchEnd);
    canvas.addEventListener('mouseleave', () => { isDragging = false; targetPos = null; });
}

function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function handleTouchStart(e) {
    if (!gameActive) return;
    e.preventDefault();
    isDragging = true;
    targetPos = getEventPos(e);
    touchHistory = [{ x: targetPos.x, y: targetPos.y, time: Date.now() }];
}

function handleTouchMove(e) {
    if (!gameActive || !isDragging) return;
    e.preventDefault();
    targetPos = getEventPos(e);
    touchHistory.push({ x: targetPos.x, y: targetPos.y, time: Date.now() });
    if (touchHistory.length > 5) touchHistory.shift(); // Keep only recent points for flick detection
}

function handleTouchEnd(e) {
    if (!gameActive || !isDragging) return;
    isDragging = false;
    
    // Flick Detection (Pass/Shoot)
    if (touchHistory.length > 1 && ball.owner === userPlayer) {
        let start = touchHistory[0];
        let end = targetPos || touchHistory[touchHistory.length - 1];
        let dt = Date.now() - start.time;
        
        // If the swipe was recent and fast
        if (dt > 0 && dt < 200) {
            let dx = end.x - start.x;
            let dy = end.y - start.y;
            let dist = Math.hypot(dx, dy);
            
            if (dist > 10) { // Minimum flick distance
                ball.owner = null;
                // Apply momentum and clamp it so it doesn't break physics
                ball.vx = Math.max(-18, Math.min(18, (dx / dt) * 10)); 
                ball.vy = Math.max(-18, Math.min(18, (dy / dt) * 10));
                userStats.passes++;
            }
        }
    }
    targetPos = null;
}

function startMiniGame() {
    if(!currentUserCode) return alert("Register/Login via Portal first!");
    const uData = CodePlayers.find(p => p.code === currentUserCode);
    if(!uData) return;

    document.getElementById('minigame-container').style.display = 'flex';
    canvas = document.getElementById('mg-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    
    // Set Time: 10 minutes (600 seconds), Two halves
    mgTime = 600; 
    matchHalf = 1;
    mgScore = { user: 0, opp: 0 }; 
    userStats = { passes: 0, intercepts: 0, goals: 0, lost: 0, saves: 0, goalsConceded: 0 };
    isDragging = false;
    targetPos = null;
    
    players = [];
    userPlayer = { x: canvas.width/2, y: canvas.height-50, isUser: true, team: 0, rating: uData.rating, type: uData.type };
    players.push(userPlayer);

    // AI Base Positioning Arrays (X percentage, Y percentage)
    const team0Formation = [{x:50,y:80}, {x:20,y:60}, {x:80,y:60}, {x:35,y:40}, {x:65,y:40}, {x:50,y:20}, {x:20,y:30}, {x:80,y:30}, {x:35,y:15}, {x:65,y:15}];
    const team1Formation = [{x:50,y:20}, {x:20,y:40}, {x:80,y:40}, {x:35,y:60}, {x:65,y:60}, {x:50,y:80}, {x:20,y:70}, {x:80,y:70}, {x:35,y:85}, {x:65,y:85}, {x:50,y:90}];

    // 10 Teammates (Blue)
    for(let i=0; i<10; i++) {
        let pos = team0Formation[i];
        players.push({ baseX: (pos.x/100)*canvas.width, baseY: (pos.y/100)*canvas.height, x: (pos.x/100)*canvas.width, y: (pos.y/100)*canvas.height, isUser: false, team: 0, rating: 50 });
    }
    // 11 World Opponents (Red)
    for(let i=0; i<11; i++) {
        let oppData = WorldXI[i] || { rating: 85 };
        let pos = team1Formation[i];
        players.push({ baseX: (pos.x/100)*canvas.width, baseY: (pos.y/100)*canvas.height, x: (pos.x/100)*canvas.width, y: (pos.y/100)*canvas.height, isUser: false, team: 1, rating: oppData.rating });
    }

    ball = { x: canvas.width/2, y: canvas.height/2, vx: 0, vy: 0, owner: null };
    
    initMiniGameControls();
    gameActive = true;

    // Timer Loop
    mgTimerInterval = setInterval(() => {
        mgTime--; 
        let mins = Math.floor(mgTime / 60);
        let secs = mgTime % 60;
        document.getElementById('mg-time').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        // Halftime Trigger
        if(mgTime === 300 && matchHalf === 1) {
            matchHalf = 2;
            gameActive = false;
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = "white"; ctx.font = "20px Arial"; ctx.textAlign="center";
            ctx.fillText("HALF TIME", canvas.width/2, canvas.height/2);
            setTimeout(() => { resetPositions(); gameActive = true; }, 2500);
        }
        
        if(mgTime <= 0) endMiniGame();
    }, 1000); 
    
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if(!gameActive) return;
    
    // Sort players by distance to ball to assign "pressers" vs "holders"
    let bx = ball.owner ? ball.owner.x : ball.x;
    let by = ball.owner ? ball.owner.y : ball.y;
    
    players.forEach(p => { if(!p.isUser) p.distToBall = Math.hypot(bx - p.x, by - p.y); });
    
    let team0AI = players.filter(p => p.team === 0 && !p.isUser).sort((a,b) => a.distToBall - b.distToBall);
    let team1AI = players.filter(p => p.team === 1).sort((a,b) => a.distToBall - b.distToBall);

    // Dynamic User Movement (Follows Finger)
    if (isDragging && targetPos) {
        let dx = targetPos.x - userPlayer.x;
        let dy = targetPos.y - userPlayer.y;
        let dist = Math.hypot(dx, dy);
        let speed = 4.5; // Max drag follow speed
        
        if (dist > speed) {
            userPlayer.x += (dx / dist) * speed;
            userPlayer.y += (dy / dist) * speed;
        } else {
            userPlayer.x = targetPos.x;
            userPlayer.y = targetPos.y;
        }
    }

    // Physics & AI Logic
    players.forEach(p => {
        if(!p.isUser) {
            // Is this AI one of the closest 2 to the ball?
            let isPressing = (p === team0AI[0] || p === team0AI[1] || p === team1AI[0] || p === team1AI[1]);

            if (ball.owner === p) {
                // Attacking: Run towards opponent goal
                let targetY = p.team === 0 ? 0 : canvas.height;
                let angle = Math.atan2(targetY - p.y, (canvas.width/2) - p.x);
                p.x += Math.cos(angle) * 1.5; p.y += Math.sin(angle) * 1.5;
                
                // Shoot if close to goal
                if(Math.abs(p.y - targetY) < 150 && Math.random() < 0.03) { 
                    ball.owner = null; ball.vy = (p.team === 0 ? -12 : 12); ball.vx = ((canvas.width/2) - p.x)*0.05;
                }
            } else if (isPressing) {
                // Pressing: Chase ball aggressively
                let angle = Math.atan2(by - p.y, bx - p.x);
                p.x += Math.cos(angle) * 1.6; p.y += Math.sin(angle) * 1.6;
            } else {
                // Defending: Return to base position structure
                let angle = Math.atan2(p.baseY - p.y, p.baseX - p.x);
                if (p.distToBall > 40) {
                    p.x += Math.cos(angle) * 1.0; p.y += Math.sin(angle) * 1.0;
                }
            }
        }
        
        // Bounds Clamp
        p.x = Math.max(10, Math.min(canvas.width-10, p.x));
        p.y = Math.max(10, Math.min(canvas.height-10, p.y));

        // Ball Collision & Tackle Mechanics
        let dist = Math.hypot(p.x - (ball.owner ? ball.owner.x : ball.x), p.y - (ball.owner ? ball.owner.y : ball.y));
        if (dist < 15) {
            if (!ball.owner) {
                ball.owner = p; 
            } else if (ball.owner.team !== p.team) {
                let defenseForce = p.rating;
                let offenseForce = ball.owner.rating;
                if (Math.random() * defenseForce > Math.random() * offenseForce) {
                    if (p.isUser) userStats.intercepts++;
                    if (ball.owner.isUser) userStats.lost++;
                    ball.owner = p;
                }
            }
        }
    });

    if (ball.owner) {
        ball.x = ball.owner.x; ball.y = ball.owner.y; ball.vx = 0; ball.vy = 0;
    } else {
        ball.x += ball.vx; ball.y += ball.vy;
        ball.vx *= 0.95; ball.vy *= 0.95;
    }

    // Goal Detection
    if (ball.y < 5) { mgScore.user++; resetPositions(); if(userPlayer.type!=="Goalkeeper") userStats.goals++; }
    if (ball.y > canvas.height - 5) { mgScore.opp++; resetPositions(); if(userPlayer.type==="Goalkeeper") userStats.goalsConceded++; }
    
    // Draw Environment
    ctx.clearRect(0,0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(canvas.width/2, canvas.height/2, 40, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, canvas.height/2); ctx.lineTo(canvas.width, canvas.height/2); ctx.stroke();
    
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; // Goals
    ctx.fillRect(canvas.width/2 - 40, 0, 80, 10);
    ctx.fillRect(canvas.width/2 - 40, canvas.height-10, 80, 10);

    // Draw Indicator Arrow (Points EXACTLY at your target position)
    if (isDragging && targetPos) {
        ctx.fillStyle = '#FFB81C'; // Yellow indicator arrow
        ctx.beginPath();
        ctx.moveTo(targetPos.x, targetPos.y - 12);
        ctx.lineTo(targetPos.x - 8, targetPos.y - 24);
        ctx.lineTo(targetPos.x + 8, targetPos.y - 24);
        ctx.fill();
    }

    // Draw Entities
    players.forEach(p => {
        ctx.fillStyle = p.isUser ? '#FFB81C' : (p.team === 0 ? '#0A3161' : '#CE1126');
        ctx.beginPath(); ctx.arc(p.x, p.y, p.isUser ? 8 : 6, 0, Math.PI*2); ctx.fill();
    });

    // Draw Ball as Emoji
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚽', ball.x, ball.y);

    requestAnimationFrame(gameLoop);
}

function resetPositions() {
    document.getElementById('mg-score').innerText = `${mgScore.user} - ${mgScore.opp}`;
    ball = { x: canvas.width/2, y: canvas.height/2, vx: 0, vy: 0, owner: null };
    players.forEach(p => {
        p.x = p.isUser ? canvas.width/2 : p.baseX;
        p.y = p.isUser ? canvas.height-50 : p.baseY;
    });
}

function endMiniGame(forfeit = false) {
    gameActive = false;
    clearInterval(mgTimerInterval);
    document.getElementById('minigame-container').style.display = 'none';

    if (forfeit) return;

    let modifier = 0;
    if (userPlayer.type === "Goalkeeper") {
        modifier = (userStats.saves * 0.5) - (userStats.goalsConceded * 0.5);
    } else {
        modifier = (userStats.goals * 1.0) + (userStats.intercepts * 0.3) + (userStats.passes * 0.1) - (userStats.lost * 0.4);
    }
    
    modifier = Math.max(-2, Math.min(3, modifier)); 
    
    const portalUser = CodePlayers.find(p => p.code === currentUserCode);
    portalUser.rating = Math.max(10, Math.min(99, +(portalUser.rating + modifier).toFixed(1)));
    portalUser.appearances += 1;
    portalUser.totalSum += portalUser.rating;
    
    const adminMySquadClone = MySquad.find(p => p.code === currentUserCode);
    if(adminMySquadClone) adminMySquadClone.rating = portalUser.rating;

    // Save newly adjusted stats to localstorage
    localStorage.setItem('WC_CodePlayers', JSON.stringify(CodePlayers));
    updatePortalDashboard();

    // Trigger Custom Visual Modal instead of Alert
    document.getElementById('mf-score').innerText = `${mgScore.user} - ${mgScore.opp}`;
    document.getElementById('mf-stats').innerText = `Your Passes: ${userStats.passes} | Intercepts: ${userStats.intercepts} | Goals: ${userStats.goals}`;
    
    const adjElement = document.getElementById('mf-adjustment');
    adjElement.innerText = modifier >= 0 ? `+${modifier.toFixed(1)}` : modifier.toFixed(1);
    adjElement.style.color = modifier >= 0 ? "var(--fifa-green)" : "var(--fifa-red)";
    document.getElementById('mf-newrank').innerText = portalUser.rating.toFixed(1);
    
    document.getElementById('match-finish-modal').style.display = 'flex';
}

// --- ADMIN SIMULATION LOGIC ---
function adminTriggerSimulation() {
    const activeUnits = MySquad.filter(p => p.status === "playing");
    const log = document.getElementById('sim-log');
    const displayContainer = document.getElementById('sim-results');
    if (activeUnits.length !== 11) return alert(`SELECTION ERROR: Requires exactly 11 active players.`);

    displayContainer.style.display = "block";
    log.innerHTML = "⚽ Kickoff: Admin Squad matches up against World XI parameters... <br><br>";

    activeUnits.forEach(player => {
        let scoreMod = Math.random() > 0.5 ? Math.random()*1.5 : -Math.random()*1.0;
        player.rating = Math.max(10, Math.min(99, +(player.rating + scoreMod).toFixed(1)));
        
        log.innerHTML += `🏃‍♂️ <strong>${player.name}</strong> Pitch action resolved. | New Rating: <strong>${Math.floor(player.rating)}</strong><br>`;
        if (!historicalRatingsRecord[player.name]) historicalRatingsRecord[player.name] = { totalSum: 0, appearances: 0 };
        historicalRatingsRecord[player.name].totalSum += player.rating;
        historicalRatingsRecord[player.name].appearances += 1;

        if (player.code) {
            const portalUser = CodePlayers.find(p => p.code === player.code);
            if (portalUser) {
                portalUser.rating = player.rating; portalUser.appearances += 1; portalUser.totalSum += player.rating;
            }
        }
    });

    historicalGamesPlayed += 1;
    log.innerHTML += "<br>🏁 Match concluded. Admin internal ratings modified successfully.";
    renderMySquadScreen();
}
