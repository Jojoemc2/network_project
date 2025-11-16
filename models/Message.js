const mongoose = require('mongoose');
const moment = require('moment');

const MessageSchema = new mongoose.Schema({
  room: { type: String, required: true, index: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['public','dm'], required: true },
  createdAt: { type: String, default: moment().add(7, 'hours').format('HH:mm'), index: true }
});
module.exports = mongoose.model('Message', MessageSchema);