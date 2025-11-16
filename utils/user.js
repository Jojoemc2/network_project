const users = [];
// R8: This Set stores the user-created group chats
// --- CHANGED: Default groups are now removed ---
const rooms = new Set();

function userJoin(id, username , room){
    const user = {id, username , room};
    users.push(user);
    return user;
}

function getCurrentUser(id){
    return users.find(user => user.id === id);
}

function userLeave(id){
    const index = users.findIndex(user => user.id === id);
    if(index !== -1){
        return users.splice(index, 1)[0];
    }
}

function getRoomUsers(room){
    return users.filter(user => user.room === room);
}

function getAllUsers(){
    return users;
}

function getUserByUsername(username) {
    if (!username) return undefined;
    const searchName = username.toLowerCase();
    return users.find(user => user.username.toLowerCase() === searchName);
}

function addRoom(roomName) {
    // Avoid adding 'Lobby' as a creatable room
    if (roomName.toLowerCase() !== 'lobby') {
        rooms.add(roomName);
    }
}

function getPublicRooms() {
    return Array.from(rooms);
}

function getRoomData() {
    const allRoomsData = [];
    
    // Add Lobby first
    allRoomsData.push({
        name: 'Lobby',
        users: getRoomUsers('Lobby').map(u => u.username)
    });
    
    // Add all other public rooms
    for (const roomName of rooms) {
        allRoomsData.push({
            name: roomName,
            users: getRoomUsers(roomName).map(u => u.username)
        });
    }
    return allRoomsData;
}

function userChangeRoom(id, newRoom) {
    const user = getCurrentUser(id);
    if (user) {
        user.room = newRoom;
    }
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