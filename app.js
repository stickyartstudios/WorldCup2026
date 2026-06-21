// --- ADMIN UNLOCK LOGIC ---
let adminTapCount = 0;
let adminTapTimer = null;
const SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz9EzDAvIXHcQjjLnSV1jagJVp3GKjG8vmrxnuFvmonKQ7-6SKX9wj0RJQ63s4sS5Hkxw/exec";

window.onload = () => {
    const savedData = localStorage.getItem('WC_CodePlayers');
    if(savedData) CodePlayers = JSON.parse(savedData);
    
    // Load saved lineup if exists
    const savedLineup = localStorage.getItem('WC_SavedLineup');
    if(savedLineup) MySquad = JSON.parse(savedLineup);

    const savedUser = localStorage.getItem('WC_CurrentUser');
    if(savedUser) {
        currentUserCode = savedUser;
        updatePortalDashboard();
    }
    randomizeWorldXI();
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

// --- CORE FUNCTIONS ---
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

function randomizeWorldXI() {
    const formationKeys = Object.keys(Formations);
    const chosenFormation = formationKeys[Math.floor(Math.random() * formationKeys.length)];
    
    let pool = [...MasterElitePool].sort(() => 0.5 - Math.random());
    let keepers = pool.filter(p => p.type === "Goalkeeper");
    let outfield = pool.filter(p => p.type !== "Goalkeeper");
    
    WorldXI = [keepers[0], ...outfield.slice(0, 10)];
    renderWorldXIScreen(chosenFormation);
}

// --- RENDER FUNCTIONS ---
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
        // ... (Keep your existing Admin Ledger logic here)
        document.querySelector('.metrics-grid').style.display = 'grid';
        // ...
    }
}

// --- REMAINDER OF YOUR EXISTING FUNCTIONS (navigate, register, etc.) ---
// Ensure you copy your existing navigation, portal, and render logic below this point.
