// --- ADMIN UNLOCK LOGIC ---
let adminTapCount = 0;
let adminTapTimer = null;
const SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz9EzDAvIXHcQjjLnSV1jagJVp3GKjG8vmrxnuFvmonKQ7-6SKX9wj0RJQ63s4sS5Hkxw/exec";

window.onload = () => {
    // 1. Load Data
    const savedData = localStorage.getItem('WC_CodePlayers');
    if(savedData) CodePlayers = JSON.parse(savedData);
    
    const savedLineup = localStorage.getItem('WC_SavedLineup');
    if(savedLineup) MySquad = JSON.parse(savedLineup);

    const savedUser = localStorage.getItem('WC_CurrentUser');
    if(savedUser) {
        currentUserCode = savedUser;
        updatePortalDashboard();
    }
    
    randomizeWorldXI();
    // Ensure initial screen is rendered
    renderMySquadScreen();
};

// --- NEW FEATURES ---
function saveLineup() {
    localStorage.setItem('WC_SavedLineup', JSON.stringify(MySquad));
    alert("Lineup positions saved successfully!");
}

function addToSquad(code) {
    const player = CodePlayers.find(p => p.code === code);
    if (!player) return;
    if(MySquad.find(p => p.code === code)) return alert("Player already in your squad.");
    
    MySquad.push({
        id: Date.now() + Math.random(),
        name: player.name,
        jersey: "99",
        type: player.type,
        rating: player.rating,
        status: "benched",
        code: player.code
    });
    
    localStorage.setItem('WC_CodePlayers', JSON.stringify(CodePlayers));
    alert(`${player.name} added to your squad!`);
    renderMySquadScreen();
}

function userSimulateMatch() {
    const activeUnits = MySquad.filter(p => p.status === "playing");
    if (activeUnits.length !== 11) return alert("Select 11 players in your squad to simulate a match.");

    const squadRating = activeUnits.reduce((sum, p) => sum + p.rating, 0) / 11;
    const worldRating = WorldXI.reduce((sum, p) => sum + p.rating, 0) / 11;
    
    const winChance = (squadRating / (squadRating + worldRating)) * 100;
    const isWin = Math.random() * 100 < winChance;
    
    activeUnits.forEach(p => {
        let mod = isWin ? (Math.random() * 0.5) : -(Math.random() * 0.3);
        p.rating = Math.max(10, Math.min(99, +(p.rating + mod).toFixed(1)));
        
        // Update user record if applicable
        const portalUser = CodePlayers.find(user => user.code === p.code);
        if(portalUser) {
            portalUser.rating = p.rating;
            portalUser.appearances += 1;
            portalUser.totalSum += p.rating;
        }
    });

    localStorage.setItem('WC_CodePlayers', JSON.stringify(CodePlayers));
    alert(`Match Simulation: ${isWin ? "WIN! Your squad performance improved." : "Loss. Keep training!"}`);
    renderMySquadScreen();
    renderMetricsScreen();
}

// --- ADMIN & PORTAL LOGIC ---
function toggleAdmin() {
    isAdmin = !isAdmin;
    document.body.classList.toggle('is-admin', isAdmin);
    renderMySquadScreen(); 
    renderMetricsScreen(); 
    alert(isAdmin ? "Admin Root Privileges Unlocked" : "Admin Dashboard Locked");
}

function handleAdminTap() {
    adminTapCount++;
    clearTimeout(adminTapTimer);
    adminTapTimer = setTimeout(() => { adminTapCount = 0; }, 400);
    if (adminTapCount === 2) { adminTapCount = 0; toggleAdmin(); }
}

function openDictModal() { document.getElementById('dict-modal').style.display = 'flex'; }
function closeDictModal() { document.getElementById('dict-modal').style.display = 'none'; }

window.addEventListener('click', (e) => {
    const dictModal = document.getElementById('dict-modal');
    const portalModal = document.getElementById('portal-modal');
    if (e.target === dictModal) closeDictModal();
    if (e.target === portalModal) closePortalModal();
});

function navigate(screenId, btnElement) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    btnElement.classList.add('active');
    clearSelection();

    if(screenId === 'screen-world-xi') renderWorldXIScreen();
    if(screenId === 'screen-my-squad') renderMySquadScreen();
    if(screenId === 'screen-metrics') renderMetricsScreen(); 
}

function openPortalModal() { document.getElementById('portal-modal').style.display = 'flex'; }
function closePortalModal() { document.getElementById('portal-modal').style.display = 'none'; }

function registerUser() {
    const existingCode = localStorage.getItem('WC_DeviceLocked');
    if (existingCode) {
        const user = CodePlayers.find(p => p.code === existingCode);
        if (user) {
            const resDiv = document.getElementById('reg-result');
            resDiv.innerHTML = `
                <div style="color:var(--text-main); margin-bottom:12px; font-size:0.85rem; font-weight:normal;">
                    Device already registered. Your codeusername is: <strong style="color:var(--fifa-blue); font-size:1rem;">${existingCode}</strong>
                </div>
                <button class="action-btn-primary" style="background:var(--fifa-red); padding:10px; font-size:0.85rem;" onclick="deleteExistingAccount('${existingCode}')">
                    Delete Existing ID
                </button>
            `;
            return;
        } else {
            localStorage.removeItem('WC_DeviceLocked');
        }
    }

    let name = document.getElementById('reg-name').value;
    const type = document.getElementById('reg-type').value;
    const jersey = document.getElementById('reg-jersey').value;
    
    let cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanName.length < 3 || !jersey) return alert("Enter a valid name (min 3 alphanumeric chars) and jersey.");
    
    const letters = cleanName.substring(0,3).toUpperCase();
    const numbers = String(Math.floor(Math.random() * 900) + 100); 
    const code = letters + numbers;
    
    const newPlayer = { code, name, type, jersey, rating: 50, appearances: 0, totalSum: 50 };
    CodePlayers.push(newPlayer);
    
    MySquad.push({
        id: Date.now() + Math.random(), name: name, jersey: jersey, type: type,
        rating: 50, status: "benched", code: code 
    });

    localStorage.setItem('WC_CodePlayers', JSON.stringify(CodePlayers));
    localStorage.setItem('WC_DeviceLocked', code);

    fetch(SHEET_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({ code: code, name: name, type: type, rating: 50 })
    }).catch(e => console.log("Sheet Sync Error:", e));

    document.getElementById('reg-result').innerHTML = `<span style="color:var(--fifa-green);">Success! Your codeusername is: ${code}</span>`;
}

function deleteExistingAccount(code) {
    const user = CodePlayers.find(p => p.code === code);
    if (!user) return;
    
    const confirmMsg = `If you delete this ID you'll lose '${user.name}' with '${user.type}' and '${user.rating.toFixed(1)}' Current Rating.\n\nAre you sure you want to proceed?`;
    
    if (confirm(confirmMsg)) {
        CodePlayers = CodePlayers.filter(p => p.code !== code);
        MySquad = MySquad.filter(p => p.code !== code);
        
        localStorage.setItem('WC_CodePlayers', JSON.stringify(CodePlayers));
        localStorage.removeItem('WC_DeviceLocked');
        
        if (currentUserCode === code) logoutUser();
        
        document.getElementById('reg-result').innerHTML = `<span style="color:var(--text-muted); font-weight:normal; font-size:0.85rem;">Account deleted.</span>`;
        renderMySquadScreen();
    }
}

function loginUser() {
    const code = document.getElementById('login-code').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const user = CodePlayers.find(p => p.code === code);
    if(!user) return alert("System could not verify this codeusername.");
    
    currentUserCode = code;
    localStorage.setItem('WC_CurrentUser', code);
    updatePortalDashboard();
    renderMySquadScreen();
}

function logoutUser() {
    currentUserCode = null;
    localStorage.removeItem('WC_CurrentUser');
    updatePortalDashboard();
    renderMySquadScreen();
}

function updatePortalDashboard() {
    const simBtn = document.getElementById('btn-user-sim');
    if(currentUserCode) {
        document.getElementById('portal-login').style.display = 'none';
        document.getElementById('portal-register').style.display = 'none';
        document.getElementById('portal-dashboard').style.display = 'block';
        if(simBtn) simBtn.style.display = 'block';

        const user = CodePlayers.find(p => p.code === currentUserCode);
        document.getElementById('dash-name').innerText = user.name;
        document.getElementById('dash-rating').innerText = user.rating.toFixed(1);
        document.getElementById('dash-matches').innerText = user.appearances;
    } else {
        document.getElementById('portal-login').style.display = 'block';
        document.getElementById('portal-register').style.display = 'block';
        document.getElementById('portal-dashboard').style.display = 'none';
        if(simBtn) simBtn.style.display = 'none';
    }
}

// --- RENDERING ---
function randomizeWorldXI() {
    const formationKeys = Object.keys(Formations);
    const chosenFormation = formationKeys[Math.floor(Math.random() * formationKeys.length)];
    let pool = [...MasterElitePool].sort(() => 0.5 - Math.random());
    let keepers = pool.filter(p => p.type === "Goalkeeper");
    let outfield = pool.filter(p => p.type !== "Goalkeeper");
    WorldXI = [keepers[0], ...outfield.slice(0, 10)];
    renderWorldXIScreen(chosenFormation);
}

function renderWorldXIScreen(formation = "4-3-3") {
    if (WorldXI.length === 0) return randomizeWorldXI();
    const pitch = document.getElementById('world-pitch');
    const list = document.getElementById('world-list');
    const coords = Formations[formation] || Formations["4-3-3"];
    
    pitch.innerHTML = `<div style="position:absolute; top:12px; left:12px; font-size:0.75rem; color: #ffffff; background: rgba(10,49,97,0.8); padding: 4px 8px; border-radius: 4px; font-weight:bold;">FORMATION: ${formation}</div>`;
    list.innerHTML = "";

    WorldXI.forEach((player, i) => {
        const pos = coords[i];
        pitch.innerHTML += `
            <div class="player-container" style="left: ${pos.x}%; top: ${pos.y}%;">
                <div class="player-circle"><div class="node-rating">${Math.floor(player.rating)}</div></div>
                <div class="node-name-outside">${player.name}</div>
            </div>`;
        list.innerHTML += `
            <div class="player-list-card">
                <div><strong>${player.name}</strong><div style="font-size:0.75rem; color:var(--text-muted);">${player.type}</div></div>
                <div style="color:var(--fifa-blue); font-weight:bold; font-size:1.05rem;">${Math.floor(player.rating)}</div>
            </div>`;
    });
}

function renderMetricsScreen() {
    const historyList = document.getElementById('historical-ratings-list');
    historyList.innerHTML = "";

    const eligibleUsers = CodePlayers.filter(p => p.appearances >= 10);
    eligibleUsers.sort((a,b) => b.rating - a.rating); 
    const top25 = eligibleUsers.slice(0, 25);
    
    if(top25.length === 0) {
        historyList.innerHTML = "<div style='color:var(--text-muted); font-size:0.85rem; padding: 10px; text-align:center;'>No players have achieved 10+ appearances yet.</div>";
    } else {
        top25.forEach((user, index) => {
            const canAdd = !MySquad.find(p => p.code === user.code);
            historyList.innerHTML += `
                <div class="player-list-card">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <span style="font-weight:900; color:var(--fifa-yellow); font-size: 1.2rem;">#${index+1}</span>
                        <div><strong>${user.name}</strong><div style="font-size:0.75rem; color:var(--text-muted);">Matches: ${user.appearances}</div></div>
                    </div>
                    <div style="display:flex; align-items:center; gap: 10px;">
                        ${canAdd ? `<button onclick="addToSquad('${user.code}')" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">🤝</button>` : ''}
                        <div style="color:var(--fifa-blue); font-weight:bold; font-size:1.1rem;">${user.rating.toFixed(1)}</div>
                    </div>
                </div>`;
        });
    }

    if (isAdmin) {
        document.querySelector('.metrics-grid').style.display = 'grid';
        const activeUnits = MySquad.filter(p => p.status === "playing");
        document.getElementById('metric-avg-rating').innerText = activeUnits.length > 0 ? (activeUnits.reduce((sum, p) => sum + p.rating, 0) / activeUnits.length).toFixed(1) : "0.0";
        document.getElementById('metric-games-played').innerText = historicalGamesPlayed;
        
        historyList.innerHTML += `<div class="section-title text-red" style="margin-top:25px;">Admin Private Ledger</div>`;
        Object.keys(historicalRatingsRecord).forEach(name => {
            const record = historicalRatingsRecord[name];
            if (record.appearances > 0) {
                historyList.innerHTML += `
                    <div class="player-list-card" style="border-left-color: var(--fifa-red);">
                        <div><strong>${name}</strong><div style="font-size:0.75rem; color:var(--text-muted);">Matches: ${record.appearances}</div></div>
                        <div style="color:var(--fifa-red); font-weight:bold; font-size:1.1rem;">${(record.totalSum / record.appearances).toFixed(1)}</div>
                    </div>`;
            }
        });
    } else {
        document.querySelector('.metrics-grid').style.display = 'none';
    }
}

// --- DRAG AND DROP (SQUAD) ---
let activeDragId = null;

function initDrag(e, id) {
    const player = MySquad.find(p => p.id === id);
    if (!player) return;
    const canDrag = isAdmin || (currentUserCode && player.code === currentUserCode);
    if (!canDrag) return;

    activeDragId = id;
    document.addEventListener('touchmove', onDrag, {passive: false});
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchend', endDrag);
    document.addEventListener('mouseup', endDrag);
}

function onDrag(e) {
    if (!activeDragId) return;
    e.preventDefault(); 
    const pitch = document.getElementById('my-pitch');
    const rect = pitch.getBoundingClientRect();
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));

    const player = MySquad.find(p => p.id === activeDragId);
    player.manualX = x; player.manualY = y;
    
    const node = document.getElementById(`player-node-${activeDragId}`);
    if (node) { node.style.left = `${x}%`; node.style.top = `${y}%`; }
}

function endDrag() {
    activeDragId = null;
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('touchend', endDrag);
    document.removeEventListener('mouseup', endDrag);
}

function getPlayerCategory(type) {
    if(type === "Goalkeeper") return "GK";
    if(["Front-footer", "Ball-hawk diffuser", "Dvavser Regista", "Retalia"].includes(type)) return "DEF";
    return "OFF";
}

function renderMySquadScreen() {
    const pitch = document.getElementById('my-pitch');
    const activeList = document.getElementById('my-playing-list');
    const benchedList = document.getElementById('my-benched-list');
    
    pitch.innerHTML = `<div style="position:absolute; top:12px; left:12px; font-size:0.75rem; color: #ffffff; background: rgba(0,177,64,0.8); padding: 4px 8px; border-radius: 4px; font-weight:bold;">DYNAMIC XI FORMATION</div>`;
    activeList.innerHTML = ""; benchedList.innerHTML = "";

    const activeUnits = MySquad.filter(p => p.status === "playing");
    let gks = activeUnits.filter(p => getPlayerCategory(p.type) === "GK");
    let defs = activeUnits.filter(p => getPlayerCategory(p.type) === "DEF");
    let offs = activeUnits.filter(p => getPlayerCategory(p.type) === "OFF");

    let coords = [];
    if(gks.length > 0) coords.push({x: 50, y: 92, p: gks[0]}); 
    defs.forEach((p, i) => {
        let x = 50;
        if(defs.length === 2) x = i === 0 ? 35 : 65;
        if(defs.length === 3) x = i === 0 ? 20 : (i === 1 ? 50 : 80);
        if(defs.length === 4) x = i === 0 ? 15 : (i === 1 ? 38 : (i === 2 ? 62 : 85));
        coords.push({x, y: 75, p: p});
    });
    let midCount = Math.ceil(offs.length / 2);
    let fwdCount = offs.length - midCount;
    offs.slice(0, midCount).forEach((p, i) => { let x = (100 / (midCount + 1)) * (i + 1); coords.push({x, y: 50, p: p}); });
    offs.slice(midCount).forEach((p, i) => { let x = (100 / (fwdCount + 1)) * (i + 1); coords.push({x, y: 20, p: p}); });

    coords.forEach(slot => {
        const player = slot.p;
        const isHighlighted = selectedPlayerId === player.id ? "highlighted-node" : "";
        const canDrag = isAdmin || (currentUserCode && player.code === currentUserCode);
        let finalX = player.manualX !== undefined ? player.manualX : slot.x;
        let finalY = player.manualY !== undefined ? player.manualY : slot.y;
        pitch.innerHTML += `
            <div id="player-node-${player.id}" class="player-container user-node ${isHighlighted}" 
                 style="left: ${finalX}%; top: ${finalY}%; cursor: ${canDrag ? 'grab' : 'pointer'};" 
                 onmousedown="initDrag(event, ${player.id})" ontouchstart="initDrag(event, ${player.id})"
                 onclick="highlightPlayer(${player.id}); event.stopPropagation();">
                <div class="player-circle"><div class="node-rating">${Math.floor(player.rating)}</div></div>
                <div class="node-name-outside">${player.name}</div>
            </div>`;
    });

    MySquad.forEach(player => {
        const isSelectedClass = selectedPlayerId === player.id ? "selected-row" : "";
        const targetContainer = player.status === "playing" ? activeList : benchedList;
        const statusClass = player.status === "playing" ? "" : "benched";
        const ownershipBadge = (currentUserCode && player.code === currentUserCode) ? `<span style="background:var(--fifa-yellow); color:#111; padding:2px 6px; border-radius:4px; font-size:0.65rem; font-weight:bold; margin-left:6px;">YOU</span>` : "";

        targetContainer.innerHTML += `
            <div class="player-list-card user ${statusClass} ${isSelectedClass}" onclick="highlightPlayer(${player.id})">
                <div>
                    <strong>${player.name} <span style="color:var(--fifa-green)">#${player.jersey}</span> ${ownershipBadge}</strong>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${player.type}</div>
                </div>
                <div style="color:var(--fifa-green); font-weight:bold; font-size:1.05rem;">${Math.floor(player.rating)}</div>
            </div>`;
    });
}

function highlightPlayer(id) {
    if (!isAdmin) return; 
    selectedPlayerId = id;
    const player = MySquad.find(p => p.id === id);
    if (!player) return;

    const bar = document.getElementById('quick-action-bar');
    document.getElementById('action-bar-text').innerText = `Selected Asset: ${player.name}`;
    bar.classList.remove('action-bar-hidden');

    const btnPlay = document.getElementById('btn-quick-play');
    const btnBench = document.getElementById('btn-quick-bench');

    if (player.status === "playing") {
        btnPlay.disabled = true; btnPlay.style.opacity = "0.3"; btnBench.disabled = false; btnBench.style.opacity = "1";
    } else {
        btnPlay.disabled = false; btnPlay.style.opacity = "1"; btnBench.disabled = true; btnBench.style.opacity = "0.3";
    }

    btnPlay.onclick = () => { 
        const activeUnits = MySquad.filter(p => p.status === "playing");
        const cat = getPlayerCategory(player.type);
        const gkCount = activeUnits.filter(p => getPlayerCategory(p.type) === "GK").length;
        const defCount = activeUnits.filter(p => getPlayerCategory(p.type) === "DEF").length;
        if (activeUnits.length >= 11) return alert("Squad Full.");
        if (cat === "GK" && gkCount >= 1) return alert("Only 1 GK.");
        if (cat === "DEF" && defCount >= 4) return alert("Max 4 Defenders.");
        player.status = "playing"; clearSelection(); renderMySquadScreen(); 
    };
    btnBench.onclick = () => { player.status = "benched"; clearSelection(); renderMySquadScreen(); };
    document.getElementById('btn-quick-bin').onclick = () => { MySquad = MySquad.filter(p => p.id !== id); clearSelection(); renderMySquadScreen(); };
    renderMySquadScreen();
}

function clearSelection() {
    selectedPlayerId = null;
    document.getElementById('quick-action-bar')?.classList.add('action-bar-hidden');
}
