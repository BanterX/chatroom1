const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (your front-end HTML, CSS, JS files)
app.use(express.static('public'));

// Store users and their rooms
let users = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    // When a user joins, store their username and room code
    socket.on('join', ({ username, roomCode }) => {
        if (username && roomCode) {
            users[socket.id] = { username, roomCode };
            socket.join(roomCode);

            // Emit a "user joined" message to the room
            io.to(roomCode).emit('user joined', `${username} has joined the room`);

            // Send a welcome message to the user
            socket.emit('chat message', { type: 'text', content: `Welcome, ${username}!`, username });
        } else {
            socket.emit('chat message', { type: 'text', content: 'Error: Username and Room Code are required!', username: 'System' });
        }
    });

    // When a message is received, emit it to the room with the sender's username
    socket.on('chat message', (msg) => {
        const roomCode = users[socket.id]?.roomCode;
        const username = users[socket.id]?.username;
        if (roomCode) {
            io.to(roomCode).emit('chat message', { ...msg, username });
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        const username = users[socket.id]?.username;
        const roomCode = users[socket.id]?.roomCode;
        if (roomCode && username) {
            io.to(roomCode).emit('user joined', `${username} has left the room`);
        }
        delete users[socket.id];
        console.log('A user disconnected');
    });
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
