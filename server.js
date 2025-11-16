const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const connectDB = require('./utils/db');
const Message = require('./models/Message');
const User = require('./models/User');
const Room = require('./models/Room');
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

require('dotenv').config();
connectDB(process.env.MONGO_URI).catch(err => 
    { 
        console.error(err); 
        process.exit(1); 
    }
);

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botname = 'ChatCord Bot';
// --- ADDED: Store for chat history ---
// const chatHistory = {}; // { roomName: [message1, message2] }

// --- Helper function to broadcast updated room list ---
async function broadcastRoomList(socket) {
    const roomData = await getRoomData();
    io.emit('roomListUpdate', roomData);
}

// Run when client connects
io.on('connection', socket => {

    // Handles user validation and joining the lobby
    socket.on('joinLobby', async ({ username }) => {
        const existingUser = await getUserByUsername(username); 
        if (existingUser) {
            socket.emit('joinError', 'This username is already taken. Please choose another.');
            return;
        }
        
        const user = await userJoin(socket.id, username, 'Lobby');
        socket.join(user.room);
        socket.emit('joinSuccess', user.username);

        // Fetch recent history (last 30 messages)
        const history = await Message.find({ room: user.room }).sort({ createdAt: 1 }).limit(30).lean();
        socket.emit('chatHistory', history.map(m => ({
            username: m.username,
            text: m.text,
            time: m.createdAt,
            type: m.type
        })));

        socket.emit('message', formatMessage(botname, 'Welcome to the ChatCord Lobby!'));
        socket.broadcast
            .to(user.room)
            .emit('message', formatMessage(botname, `${user.username} has joined the lobby`));
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: await getRoomUsers(user.room)
        });
        io.emit('allUsers', await getAllUsers());
        await broadcastRoomList(socket);
    });

    // Listen for new room creation
    socket.on('createRoom', async (roomName) => {
        await addRoom(roomName);
        await broadcastRoomList(socket);
    });
    
    // --- MODIFIED: Listen for user joining a different room ---
    socket.on('joinRoom', async (roomName) => {
        const user = await getCurrentUser(socket.id);
        if (!user) return; 

        const oldRoom = user.room;
        if (oldRoom) {
            socket.leave(oldRoom);
            io.to(oldRoom).emit('message', formatMessage(botname, `${user.username} has left this room`));
            io.to(oldRoom).emit('roomUsers', {
                room: oldRoom,
                users: await getRoomUsers(oldRoom)
            });
        }
        
        const updatedUser = await userChangeRoom(socket.id, roomName);
        socket.join(roomName);

        // Fetch recent history (last 30 messages)
        const history = await Message.find({ room: roomName }).sort({ createdAt: 1 }).limit(30).lean();
        socket.emit('chatHistory', history.map(m => ({
            username: m.username,
            text: m.text,
            time: m.createdAt,
            type: m.type
        })));

        socket.emit('message', formatMessage(botname, `Welcome to ${roomName}!`));
        socket.broadcast
            .to(roomName)
            .emit('message', formatMessage(botname, `${updatedUser.username} has joined the chat`));
        io.to(roomName).emit('roomUsers', {
            room: roomName,
            users: await getRoomUsers(roomName)
        });
        await broadcastRoomList(socket);
    });

    // --- MODIFIED: Listen for chatMessage ---
    socket.on('chatMessage', async (msg) => {
        const user = await getCurrentUser(socket.id);
        if (user) {
            const type = user.room.startsWith('dm-') ? 'dm' : 'public';
            const messageDoc = await Message.create({
                room: user.room,
                username: user.username,
                text: msg,
                type: type
            });
            const formattedMsg = formatMessage(user.username, msg);
            if (type === 'dm') formattedMsg.type = 'dm';
            io.to(user.room).emit('message', formattedMsg);

            // DM notify
            if (type === 'dm') {
            const names = user.room.split('-').slice(1);
            const recipientName = names.find(name => name !== user.username);
            const recipient = await getUserByUsername(recipientName);
            if (recipient && recipient.socketId && recipient.room !== user.room) {
                io.to(recipient.socketId).emit('dmNotification', { fromUsername: user.username, roomName: user.room });
            }
            }
        }
    });

    // --- (Disconnect logic remains the same) ---
    socket.on('disconnect', async () => {
        const user = await userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(botname, `${user.username} has left the chat`));
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: await getRoomUsers(user.room)
            });
            io.emit('allUsers', await getAllUsers());
            await broadcastRoomList(socket);
        }
    });
})

const PORT = 3000 || process.env.PORT;
server.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));