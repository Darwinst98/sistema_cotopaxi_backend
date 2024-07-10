const mongoose = require('mongoose');
const { Schema } = mongoose;

const sitioSeguroSchema = new Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: false },
  cordenadas_x: { type: Number, required: true },
  cordenadas_y: { type: Number, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('SitioSeguro', sitioSeguroSchema);
