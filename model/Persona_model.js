const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema({
  nombres: {
    type: String,
    required: true
  },
  apellidos: {
    type: String,
    required: true
  },
  cedula: {
    type: String,
    required: true,
    unique: true
  },
  correoElectronico: {
    type: String,
    required: true,
  },
  edad: {
    type: Number,
    required: true
  },
  enfermedadesAlergias: {
    type: String,
    default: ''
  },
  medicamentos: {
    type: String,
    default: ''
  },
  lugarResidencia: {
    type: String,
    required: true
  },
  albergue: {
    type: String,
    default: ''
  },
  qrURL: {
    type: String,
    default: '' 
  }
});

module.exports = mongoose.model('Persona', personaSchema);
