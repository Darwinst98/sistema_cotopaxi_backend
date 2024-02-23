const mongoose = require('mongoose');

const albergueSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  coordenadaX: {
    type: Number,
    required: true
  },
  coordenadaY: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Albergue', albergueSchema);
