const mongoose = require('mongoose');
const { Schema } = mongoose;

const productoSchema = new Schema({
  nombre: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  descripcion: { type: String, required: false },
  bodega: { type: Schema.Types.ObjectId, ref: 'Bodega', required: true } 
}, {
  timestamps: true
});

module.exports = mongoose.model('Producto', productoSchema);
