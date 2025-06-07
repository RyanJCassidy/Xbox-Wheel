const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(__dirname));

let scoreboard = {
  scores: [
    { team1: 'Astros', score1: 4, team2: 'Diamondbacks', score2: 6 },
    { team1: 'Fill in here', score1: '', team2: 'Fill in here', score2: '' },
    { team1: 'Fill in here', score1: '', team2: 'Fill in here', score2: '' },
    { team1: 'Fill in here', score1: '', team2: 'Fill in here', score2: '' },
    { team1: 'Fill in here', score1: '', team2: 'Fill in here', score2: '' },
    { team1: 'Fill in here', score1: '', team2: 'Fill in here', score2: '' },
    { team1: 'Fill in here', score1: '', team2: 'Fill in here', score2: '' },
    { team1: 'Fill in here', score1: '', team2: 'Fill in here', score2: '' },
    { team1: 'Fill in here', score1: '', team2: 'Fill in here', score2: '' }
  ],
  wins: [
    { player: 'Ryan', wins: 0, losses: 0 },
    { player: 'Jayden', wins: 0, losses: 0 }
  ]
};

app.get('/api/scoreboard', (req, res) => {
  res.json(scoreboard);
});

app.post('/api/scoreboard', (req, res) => {
  scoreboard = req.body;
  io.emit('scoreUpdate', scoreboard);
  res.json({ status: 'ok' });
});

io.on('connection', socket => {
  socket.emit('scoreUpdate', scoreboard);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
