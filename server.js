const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    getAllUsers,
    getUserByUsername,
    addRoom,
    getPublicRooms,
    getRoomData,
    userChangeRoom // --- Make sure this is imported ---
} = require('./utils/user');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botname = 'ChatCord Bot';
// --- ADDED: Store for chat history ---
const chatHistory = {}; // { roomName: [message1, message2] }

// --- Helper function to broadcast updated room list ---
function broadcastRoomList(socket) {
    const roomData = getRoomData();
    io.emit('roomListUpdate', roomData);
}

// Run when client connects
io.on('connection', socket => {

    // Handles user validation and joining the lobby
    socket.on('joinLobby', ({ username }) => {
        const existingUser = getUserByUsername(username); 
        if (existingUser) {
            socket.emit('joinError', 'This username is already taken. Please choose another.');
            return;
        }
        
        const user = userJoin(socket.id, username, 'Lobby');
        socket.join(user.room);
        socket.emit('joinSuccess', user.username);

        // --- ADDED: Send chat history for the lobby ---
        if (chatHistory[user.room]) {
            socket.emit('chatHistory', chatHistory[user.room]);
        }

        socket.emit('message', formatMessage(botname, 'Welcome to the ChatCord Lobby!'));
        socket.broadcast
            .to(user.room)
            .emit('message', formatMessage(botname, `${user.username} has joined the lobby`));
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
        io.emit('allUsers', getAllUsers());
        broadcastRoomList(socket);
    });

    // Listen for new room creation
    socket.on('createRoom', (roomName) => {
        addRoom(roomName);
        broadcastRoomList(socket);
    });
    
    // --- MODIFIED: Listen for user joining a different room ---
    socket.on('joinRoom', (roomName) => {
        const user = getCurrentUser(socket.id);
        if (!user) return; 

        const oldRoom = user.room;
        if (oldRoom) {
            socket.leave(oldRoom);
            io.to(oldRoom).emit('message', formatMessage(botname, `${user.username} has left this room`));
            io.to(oldRoom).emit('roomUsers', {
                room: oldRoom,
                users: getRoomUsers(oldRoom)
            });
        }
        
        userChangeRoom(socket.id, roomName);
        socket.join(roomName);
        
        // --- ADDED: Send chat history for the new room ---
        if (chatHistory[roomName]) {
            socket.emit('chatHistory', chatHistory[roomName]);
        }
        
        socket.emit('message', formatMessage(botname, `Welcome to ${roomName}!`));
        socket.broadcast
            .to(roomName)
            .emit('message', formatMessage(botname, `${user.username} has joined the chat`));
        io.to(roomName).emit('roomUsers', {
            room: roomName,
            users: getRoomUsers(roomName)
        });
        broadcastRoomList(socket);
    });

    // --- MODIFIED: Listen for chatMessage ---
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            const formattedMsg = formatMessage(user.username, msg);
            
            // --- ADDED: Store message in history ---
            if (!chatHistory[user.room]) {
                chatHistory[user.room] = [];
            }
            // Add a type hint for DMs
            if (user.room.startsWith('dm-')) {
                formattedMsg.type = 'dm';
            }
            chatHistory[user.room].push(formattedMsg);

            // --- ADDED: DM Notification Logic ---
            if (user.room.startsWith('dm-')) {
                // Find the other user in the DM room
                const names = user.room.split('-').slice(1);
                const recipientName = names.find(name => name !== user.username);
                const recipient = getUserByUsername(recipientName);

                // If recipient exists but is NOT in this room, send a notification
                if (recipient && recipient.room !== user.room) {
                    io.to(recipient.id).emit('dmNotification', {
                        fromUsername: user.username,
                        roomName: user.room
                    });
                }
            }
            
            // Send the message to everyone in the room
            io.to(user.room).emit('message', formattedMsg);
        }
    });

    // --- (Disconnect logic remains the same) ---
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(botname, `${user.username} has left the chat`));
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
            io.emit('allUsers', getAllUsers());
            broadcastRoomList(socket);
        }
    });
})

const PORT = 3000 || process.env.PORT;
server.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));