const mongoose = require('mongoose');
const moment = require('moment');

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  isPrivate: { type: Boolean, default: false },
  createdAt: { type: String, default: moment().format('h:mm a') }
});
module.exports = mongoose.model('Room', RoomSchema);