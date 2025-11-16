const mongoose = require('mongoose');
const moment = require('moment');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  socketId: { type: String, default: null },
  room: { type: String, default: 'Lobby' },
  online: { type: Boolean, default: true },
  lastSeen: { type: String, default: moment().format('h:mm a') }
});
module.exports = mongoose.model('User', UserSchema);