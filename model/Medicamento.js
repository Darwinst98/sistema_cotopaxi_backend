const mongoose = require('mongoose');
const { Schema } = mongoose;

const medicamentoSchema = new Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Medicamento', medicamentoSchema);
