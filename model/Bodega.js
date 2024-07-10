const mongoose = require('mongoose');
const { Schema } = mongoose;

const bodegaSchema = new Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: false },
  categoria: { type: String, required: true },
  capacidad: { type: Number, required: true },
  albergue: { type: Schema.Types.ObjectId, ref: 'Albergue' },
  productos: [{ type: Schema.Types.ObjectId, ref: 'Producto' }] 
}, {
  timestamps: true
});

module.exports = mongoose.model('Bodega', bodegaSchema);
