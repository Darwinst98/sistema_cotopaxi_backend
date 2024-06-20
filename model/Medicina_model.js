const mongoose = require('mongoose');

const medicinaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Medicina', medicinaSchema);
