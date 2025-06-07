const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinSound = document.getElementById('spinSound');
const winSound = document.getElementById('winSound');
const teams = [
    "Yankees", "Red Sox", "Blue Jays", "Orioles", "Rays",
    "White Sox", "Guardians", "Tigers", "Royals", "Twins",
    "Astros", "Angels", "Athletics", "Mariners", "Rangers",
    "Braves", "Marlins", "Mets", "Phillies", "Nationals",
    "Cubs", "Reds", "Brewers", "Pirates", "Cardinals",
    "Diamondbacks", "Rockies", "Dodgers", "Padres", "Giants"
];
const colors = [
    "#FF5733", "#33FF57", "#3357FF", "#FF33A6", "#A633FF",
    "#FFBD33", "#33FFBD", "#BD33FF", "#FF5733", "#33FF57",
    "#3357FF", "#FF33A6", "#A633FF", "#FFBD33", "#33FFBD",
    "#BD33FF", "#FF5733", "#33FF57", "#3357FF", "#FF33A6",
    "#A633FF", "#FFBD33", "#33FFBD", "#BD33FF", "#FF5733",
    "#33FF57", "#3357FF", "#FF33A6", "#A633FF", "#FFBD33"
];

let startAngle = 0;
let arc = Math.PI / (teams.length / 2);
let spinRequest = null;
let spinStartTimestamp = null;
let spinAngleStart = 10;
let spinTime = 0;
let spinTimeTotal = 0;

let socket;
let scores = JSON.parse(localStorage.getItem('scores'));
if (!scores) {
    scores = [
        { ryanTeam: 'Astros', ryanScore: '4', jaydenTeam: 'Diamondbacks', jaydenScore: '6' }
    ];
    for (let i = 0; i < 8; i++) {
        scores.push({ ryanTeam: '', ryanScore: '', jaydenTeam: '', jaydenScore: '' });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    drawRouletteWheel();
    fetchScoreboard();
    renderScoreTable();
    socket = io();
    socket.on('scoreUpdate', data => {
        updateScoreboardTables(data);
        renderScoreTable();
    });
});

function drawRouletteWheel(highlightIndex = -1) {
    ctx.clearRect(0, 0, 500, 500);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    for (let i = 0; i < teams.length; i++) {
        const angle = startAngle + i * arc;
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(250, 250, 250, angle, angle + arc, false);
        ctx.arc(250, 250, 0, angle + arc, angle, true);
        ctx.fill();
        if (i === highlightIndex) {
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#FFD700';
            ctx.stroke();
        }
        ctx.save();
        ctx.fillStyle = "black";
        ctx.translate(250, 250);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.font = "bold 16px Arial";
        ctx.fillText(teams[i], 220, 10);
        ctx.restore();
    }
}

function spinWheel() {
    spinSound.play();
    spinAngleStart = Math.random() * 10 + 10;
    spinTime = 0;
    spinTimeTotal = (Math.random() * 3 + 4) * 1000;
    spinStartTimestamp = null;
    if (spinRequest) cancelAnimationFrame(spinRequest);
    document.getElementById('winnerBanner').classList.add('hidden');
    rotateWheel();
}

function rotateWheel(timestamp) {
    if (!spinStartTimestamp) spinStartTimestamp = timestamp;
    spinTime = timestamp - spinStartTimestamp;
    if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
    }
    const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
    startAngle += (spinAngle * Math.PI / 180);
    const degrees = startAngle * 180 / Math.PI + 90;
    const arcd = arc * 180 / Math.PI;
    const index = Math.floor((360 - degrees % 360) / arcd);
    drawRouletteWheel(index);
    spinRequest = requestAnimationFrame(rotateWheel);
}

function stopRotateWheel() {
    if (spinRequest) cancelAnimationFrame(spinRequest);
    const degrees = startAngle * 180 / Math.PI + 90;
    const arcd = arc * 180 / Math.PI;
    const index = Math.floor((360 - degrees % 360) / arcd);
    drawRouletteWheel(index);

    ctx.save();
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = 'white';
    const text = teams[index];
    ctx.fillText(text, 250 - ctx.measureText(text).width / 2, 250 + 10);
    ctx.restore();

    const banner = document.getElementById('winnerBanner');
    banner.textContent = `Winner: ${text}`;
    banner.classList.remove('hidden');

    winSound.play();
}

function easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
}

// ------------------- Server-Backed Scoreboard -------------------

function fetchScoreboard() {
    fetch('/api/scoreboard')
        .then(res => res.json())
        .then(data => {
            updateScoreboardTables(data);
            renderScoreTable(); // ensure local rendering if needed
        })
        .catch(err => console.error('Failed to load scoreboard', err));
}

function updateScoreboardTables(data) {
    if (!data) return;
    const tbody = document.getElementById('scoreTable').querySelector('tbody');
    tbody.innerHTML = '';
    data.scores.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.team1}</td><td>${row.score1}</td><td>${row.team2}</td><td>${row.score2}</td>`;
        tbody.appendChild(tr);
    });

    const winBody = document.getElementById('winLossTable').querySelector('tbody');
    winBody.innerHTML = '';
    data.wins.forEach(w => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${w.player}</td><td>${w.wins}</td><td>${w.losses}</td>`;
        winBody.appendChild(tr);
    });
}

function pushScoreboard(data) {
    fetch('/api/scoreboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(err => console.error('Failed to push scoreboard', err));
}

// ------------------- Local Editable Scoreboard -------------------

function saveScores() {
    localStorage.setItem('scores', JSON.stringify(scores));
}

function renderScoreTable() {
    const tbody = document.querySelector('#scoreTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    scores.forEach((row, index) => {
        const tr = document.createElement('tr');

        ['ryanTeam', 'ryanScore', 'jaydenTeam', 'jaydenScore'].forEach(field => {
            const td = document.createElement('td');
            td.textContent = row[field];
            td.contentEditable = 'true';
            td.dataset.index = index;
            td.dataset.field = field;
            if (field === 'ryanScore') td.style.color = 'red';
            if (field === 'jaydenScore') td.style.color = 'green';
            td.addEventListener('blur', handleCellEdit);
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

function handleCellEdit(e) {
    const td = e.target;
    const index = parseInt(td.dataset.index, 10);
    const field = td.dataset.field;
    updateScore(index, field, td.textContent.trim());
}

function updateScore(index, field, value) {
    if (!scores[index]) return;
    scores[index][field] = value;
    saveScores();
}


