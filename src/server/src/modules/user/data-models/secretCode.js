const mongoose = require('mongoose');

const secretCode = mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
    expires: 600,
  },
});

module.exports = mongoose.model('secretCode', secretCode);
