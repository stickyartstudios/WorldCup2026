// State Configs
let isAdmin = false;
let currentUserCode = null;
let CodePlayers = []; 

const Formations = {
    "4-3-3": [
        {x: 50, y: 92}, 
        {x: 15, y: 75}, {x: 35, y: 75}, {x: 65, y: 75}, {x: 85, y: 75}, 
        {x: 25, y: 50}, {x: 50, y: 50}, {x: 75, y: 50}, 
        {x: 20, y: 20}, {x: 50, y: 15}, {x: 80, y: 20}  
    ],
    "3-5-2": [
        {x: 50, y: 92}, 
        {x: 25, y: 78}, {x: 50, y: 78}, {x: 75, y: 78}, 
        {x: 10, y: 52}, {x: 30, y: 48}, {x: 50, y: 52}, {x: 70, y: 48}, {x: 90, y: 52}, 
        {x: 35, y: 18}, {x: 65, y: 18} 
    ],
    "4-4-2": [
        {x: 50, y: 92}, 
        {x: 15, y: 75}, {x: 35, y: 75}, {x: 65, y: 75}, {x: 85, y: 75}, 
        {x: 15, y: 48}, {x: 38, y: 48}, {x: 62, y: 48}, {x: 85, y: 48}, 
        {x: 35, y: 18}, {x: 65, y: 18} 
    ]
};

const MasterElitePool = [
    { name: "M. ter Stegen", type: "Goalkeeper", rating: 89 },
    { name: "K. Mbappé", type: "Burst dribbler", rating: 93 },
    { name: "L. Yamal", type: "Burst dribbler", rating: 91 },
    { name: "L. Messi", type: "Dynamic playmaker", rating: 90 },
    { name: "Vini Jr.", type: "Power dribbler", rating: 92 },
    { name: "E. Haaland", type: "Power dribbler", rating: 91 },
    { name: "K. De Bruyne", type: "Anchor playmaker", rating: 91 },
    { name: "W. Saliba", type: "Front-footer", rating: 89 },
    { name: "R. Araújo", type: "Ball-hawk diffuser", rating: 87 },
    { name: "Pedri", type: "Dvavser Regista", rating: 88 },
    { name: "A. Rüdiger", type: "Retalia", rating: 88 },
    { name: "Alisson", type: "Goalkeeper", rating: 90 }
];

let WorldXI = [];

let MySquad = [
    { id: 1, name: "G. Donnarumma", jersey: "1", type: "Goalkeeper", rating: 50, status: "playing" },
    { id: 2, name: "Marquinhos", jersey: "5", type: "Front-footer", rating: 50, status: "playing" },
    { id: 3, name: "A. Hakimi", jersey: "2", type: "Burst dribbler", rating: 50, status: "playing" },
    { id: 4, name: "N. Mendes", jersey: "25", type: "Burst dribbler", rating: 50, status: "playing" },
    { id: 5, name: "Vitinha", jersey: "17", type: "Dynamic playmaker", rating: 50, status: "playing" },
    { id: 12, name: "M. Safonov", jersey: "39", type: "Goalkeeper", rating: 50, status: "benched" },
    { id: 14, name: "M. Škriniar", jersey: "37", type: "Retalia", rating: 50, status: "benched" },
    { id: 16, name: "Y. Zague", jersey: "42", type: "Front-footer", rating: 50, status: "benched" },
    { id: 21, name: "Marco Asensio", jersey: "11", type: "Anchor playmaker", rating: 50, status: "benched" }
];

let selectedPlayerId = null;
let historicalGamesPlayed = 0;
let historicalRatingsRecord = {}; 

MySquad.forEach(p => {
    historicalRatingsRecord[p.name] = { totalSum: p.rating, appearances: 0 };
});

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
