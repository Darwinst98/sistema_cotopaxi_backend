const mongoose = require('mongoose');

const enfermedadeSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  medicamentos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicina'
  }]
});

module.exports = mongoose.model('Enfermedad', enfermedadeSchema);
