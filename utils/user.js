const User = require('../models/User');
// R8: This Set stores the user-created group chats
// --- CHANGED: Default groups are now removed ---
const Room = require('../models/Room');

async function userJoin(socketId, username, room = 'Lobby') {
  const user = await User.findOneAndUpdate(
    { username }, // find by username
    {
      $set: {
        socketId,
        room,
        online: true,
        lastSeen: new Date()
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
      lean: true
    }
  );
  return user;
}

async function getCurrentUser(socketId) {
    return User.findOne({ socketId }).lean();
}

async function userLeave(socketId) {
    const user = await User.findOneAndUpdate(
    { socketId },
    { $set: { socketId: null, online: false, lastSeen: new Date() } },
    { new: true, lean: true }
    );
    return user;
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
    return User.findOne({ username }).lean();
}

async function addRoom(name, isPrivate = false) {
    // Avoid adding 'Lobby' as a creatable room
    if (name.toLowerCase().trim() !== 'lobby') {
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

async function cleanupEmptyRoom(roomName, excludeSocketId = null) {
    // Don't delete Lobby
    if (roomName === 'Lobby') {
        return;
    }
    
    // Check if room has any users - query database directly
    // Exclude the user who just left (by socketId)
    const query = { room: roomName, online: true };
    if (excludeSocketId) {
        query.socketId = { $ne: excludeSocketId };
    }
    const usersInRoom = await User.countDocuments(query);
    
    
    if (usersInRoom === 0) {
        // Check if room is private (DM rooms or private rooms)
        const roomDoc = await Room.findOne({ name: roomName });
        const isPrivateRoom = (roomDoc && roomDoc.isPrivate) || roomName.startsWith('dm-');
        
        // Don't delete private rooms
        if (isPrivateRoom) {
            return;
        }
        
        // Delete the room from database (only public rooms)
        const deletedRoom = await Room.findOneAndDelete({ name: roomName });
        
        // Delete all messages in this room
        const Message = require('../models/Message');
        const deletedMessages = await Message.deleteMany({ room: roomName });
        
        
    } else {
        
    }
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
    userChangeRoom,
    cleanupEmptyRoom
}