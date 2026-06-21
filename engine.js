// State Configs
let isAdmin = false;
let currentUserCode = null;
let CodePlayers = []; // Portal Users generated with Codeusernames

// Spaced out effectively for the 520px pitch height
const Formations = {
    "4-3-3": [
        {x: 50, y: 92}, // GK
        {x: 15, y: 75}, {x: 35, y: 75}, {x: 65, y: 75}, {x: 85, y: 75}, // DEF
        {x: 25, y: 50}, {x: 50, y: 50}, {x: 75, y: 50}, // MID
        {x: 20, y: 20}, {x: 50, y: 15}, {x: 80, y: 20}  // FWD
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