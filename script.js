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
let spinTimeout = null;
let spinAngleStart = 10;
let spinTime = 0;
let spinTimeTotal = 0;

document.addEventListener("DOMContentLoaded", () => {
    drawRouletteWheel();
    renderScoreTable();
});

function drawRouletteWheel() {
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
    spinTimeTotal = Math.random() * 3 + 4 * 1000;
    rotateWheel();
}

function rotateWheel() {
    spinTime += 30;
    if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
    }
    const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
    startAngle += (spinAngle * Math.PI / 180);
    drawRouletteWheel();
    spinTimeout = setTimeout(rotateWheel, 30);
}

function stopRotateWheel() {
    clearTimeout(spinTimeout);
    const degrees = startAngle * 180 / Math.PI + 90;
    const arcd = arc * 180 / Math.PI;
    const index = Math.floor((360 - degrees % 360) / arcd);
    ctx.save();
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = 'white'; // Explicitly set the text color to black
    const text = teams[index];
    ctx.fillText(text, 250 - ctx.measureText(text).width / 2, 250 + 10);
    ctx.restore();
    winSound.play();
}

function easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
}

// ------------------- Score Table Logic -------------------

let scores = JSON.parse(localStorage.getItem('scores'));
if (!scores) {
    scores = [
        { ryanTeam: 'Astros', ryanScore: '4', jaydenTeam: 'Diamondbacks', jaydenScore: '6' }
    ];
    for (let i = 0; i < 8; i++) {
        scores.push({ ryanTeam: '', ryanScore: '', jaydenTeam: '', jaydenScore: '' });
    }
}

function saveScores() {
    localStorage.setItem('scores', JSON.stringify(scores));
}

function renderScoreTable() {
    const tbody = document.querySelector('#scoreTable tbody');
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




