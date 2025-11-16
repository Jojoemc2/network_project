const User = require('../models/User');
// R8: This Set stores the user-created group chats
// --- CHANGED: Default groups are now removed ---
const Room = require('../models/Room');

async function userJoin(socketId, username, room = 'Lobby') {
    // If user already exists, update socketId and room.
    let user = await User.findOne({ username });
    if (user) {
        user.socketId = socketId;
        user.room = room;
        user.online = true;
        user.lastSeen = new Date();
        await user.save();
    } else {
        user = await User.create({ username, socketId, room, online: true });
    }
    return user.toObject();
}

async function getCurrentUser(socketId) {
    return User.findOne({ socketId }).lean();
}

async function userLeave(socketId) {
    const user = await User.findOne({ socketId });
    if (!user) return null;
    user.socketId = null;
    user.online = false;
    user.lastSeen = new Date();
    await user.save();
    return user.toObject();
}

async function getRoomUsers(room) {
    const users = await User.find({ room, online: true }).lean();
    // Return array of { username } of online users in the room
    return users.map(u => ({ username: u.username }));
}

async function getAllUsers() {
    const users = await User.find({ online: true }).lean();
    return users.map(u => ({ username: u.username }));
}

async function getUserByUsername(username) {
    if (!username) return null;
    return User.findOne({ username, online: true }).lean();
}

async function addRoom(name, isPrivate = false) {
    // Avoid adding 'Lobby' as a creatable room
    if (name.toLowerCase() !== 'lobby') {
        await Room.findOneAndUpdate({ name }, { name, isPrivate }, { upsert: true });
    }
}


async function getPublicRooms() {
    const rooms = await Room.find({ isPrivate: false }).lean();
    return rooms;
}

async function getRoomData() {
    const rooms = await Room.find({}).lean();

    // Always include Lobby even if not present in DB
    const roomNames = new Set(rooms.map(r => r.name));
    roomNames.add('Lobby');

    const allRoomsData = [];
    for (const roomName of roomNames) {
        const users = await getRoomUsers(roomName);
        allRoomsData.push({
            name: roomName,
            users: users.map(u => u.username)
        });
    }
    return allRoomsData;
}

async function userChangeRoom(id, newRoom) {
    const user = await User.findOneAndUpdate(
        { socketId: id },
        { $set: { room: newRoom } },
        { new: true, lean: true }
    );
    return user;
}

module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    getAllUsers,        
    getUserByUsername,  
    addRoom,            
    getPublicRooms,
    getRoomData,
    userChangeRoom      
}