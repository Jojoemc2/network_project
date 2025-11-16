const socket = io();
const chatMessages = document.querySelector('.chat-messages');
const chatForm = document.getElementById('chat-form');
const roomNameEl = document.getElementById('room-name');
const roomUserList = document.getElementById('room-users'); 
const allUserList = document.getElementById('all-users');   
const roomListEl = document.getElementById('room-list');    
const createRoomForm = document.getElementById('create-room-form');
const createRoomInput = document.getElementById('room-name-input');
const msgInput = document.getElementById('msg');

let allUsersCache = [];
let dmNotifications = {}; // { fromUsername: true }

// Get username from URL
const { username } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});


// Listen for chat history
socket.on('chatHistory', (messages) => {
    chatMessages.innerHTML = '';
    messages.forEach(message => {
        outputMessage(message);
    });
    // Scroll to the bottom after loading history
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('roomListUpdate', (rooms) => {
    outputRoomList(rooms);
});

socket.on('allUsers', (users) => {
    allUsersCache = users; 
    outputAllUsers(allUsersCache); 
});

socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputRoomUsers(users);
});

socket.on('message', message => {
    console.log(message);
    outputMessage(message);
    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('dmNotification', ({ fromUsername, roomName }) => {
    dmNotifications[fromUsername] = true;
    outputAllUsers(allUsersCache); 
});

// Handle chat form submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = e.target.elements.msg.value;
    if (msg) {
        socket.emit('chatMessage', msg);
    }
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

// Handle Create Room form
createRoomForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newRoomName = createRoomInput.value;
    if (newRoomName) {
        chatMessages.innerHTML = '';
        socket.emit('createRoom', newRoomName); 
    }
});

roomListEl.addEventListener('click', (e) => {
    const roomLi = e.target.closest('li[data-room]');
    if (roomLi) {
        const roomName = roomLi.dataset.room;
        if (roomName && roomName !== roomNameEl.dataset.raw) { 
            chatMessages.innerHTML = '';
            socket.emit('joinRoom', roomName);
        }
    }
});

allUserList.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        const toUsername = e.target.dataset.username;
        if (toUsername && toUsername !== username) { 
            const dmRoomName = getDmRoomName(username, toUsername);
            
            if (dmNotifications[toUsername]) {
                delete dmNotifications[toUsername];
                outputAllUsers(allUsersCache);
            }
            
            if (dmRoomName !== roomNameEl.dataset.raw) {
                chatMessages.innerHTML = '';
                socket.emit('joinRoom', dmRoomName);
            }
        }
    }
});


// --- MODIFIED: outputMessage function ---
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');

    // --- ADDED: Alignment Logic ---
    // Note: 'botname' is not defined here, so we must check
    // if the username is 'ChatCord Bot' (from server.js)
    if (message.username === 'Teak Bot') {
        div.classList.add('bot-message');
    } else if (message.username === username) {
        div.classList.add('my-message');
    } else {
        div.classList.add('other-message');
    }
    // --- END Alignment Logic ---

    let metaHtml = `<p class="meta">${message.username} <span>${message.time}</span></p>`;

    if (message.type === 'dm') {
        div.classList.add('dm');
        // Add a "Private" note
        if (message.username === username) {
             metaHtml = `<p class="meta"><span class="private-note">(Private)</span> ${message.username} <span>${message.time}</span></p>`;
        } else {
             metaHtml = `<p class="meta"><span class="private-note">(Private)</span> ${message.username} <span>${message.time}</span></p>`;
        }
    }
    
    div.innerHTML = metaHtml;
    
    const textEl = document.createElement('p');
    textEl.classList.add('text');
    textEl.innerText = message.text; // Use innerText to prevent XSS
    div.appendChild(textEl);

    document.querySelector('.chat-messages').appendChild(div);
}

function outputRoomName(room) {
    roomNameEl.dataset.raw = room;
    if (room.startsWith('dm-')) {
        const otherUser = room.split('-').filter(name => name !== 'dm' && name !== username)[0];
        roomNameEl.innerText = `Private: ${otherUser}`;
    } else {
        roomNameEl.innerText = room;
    }
}

function outputRoomUsers(users) {
    roomUserList.innerHTML = `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}

function outputRoomList(rooms) {
    roomListEl.innerHTML = rooms.map(room => {
        const userLis = room.users.map(user => `<li>${user}</li>`).join('');
        return `
            <li data-room="${room.name}">
                <strong>${room.name} (${room.users.length})</strong>
                ${room.users.length > 0 ? `<ul>${userLis}</ul>` : ''}
            </li>
        `;
    }).join('');
}

function outputAllUsers(users) {
    // Sort users to show current user first
    const sortedUsers = [...users].sort((a, b) => {
        if (a.username === username) return -1;
        if (b.username === username) return 1;
        return 0;
    });
    
    allUserList.innerHTML = sortedUsers.map(user => {
        const notiBadge = dmNotifications[user.username] 
            ? '<span class="noti-badge">1</span>' 
            : '';
            
        return `
            <li data-username="${user.username}">
                ${user.username} 
                ${user.username === username ? '(You)' : ''}
                ${notiBadge}
            </li>`
        }).join('');
}

// Helper to create consistent DM room name
function getDmRoomName(user1, user2) {
    const names = [user1, user2].sort();
    return `dm-${names[0]}-${names[1]}`;
}

socket.on('createSuccess', (newRoomName) => {
    socket.emit('joinRoom', newRoomName);   
    createRoomInput.value = '';
});

socket.on('joinSuccess', (joinedUsername) => {
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        window.location.href = `chat.html?username=${joinedUsername}`;
    }
});

socket.on('joinError', (errorMessage) => {
    console.error(errorMessage);
});

// request to join the lobby
socket.emit('joinLobby', { username });