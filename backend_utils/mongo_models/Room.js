const mongoose = require('mongoose');
const moment = require('moment');

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  isPrivate: { type: Boolean, default: false },
  createdAt: { type: String, default: moment().add(7, 'hours').format('HH:mm') }
});
module.exports = mongoose.model('Room', RoomSchema);