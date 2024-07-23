const mongoose = require('mongoose');
const { Schema } = mongoose;

const domicilioSchema = new Schema({
  nombre: { type: String, required: true },
  zonaDeRiesgo: { type: Boolean, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Domicilio', domicilioSchema);