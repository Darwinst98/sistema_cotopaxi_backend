 const mongoose = require('mongoose');
const { Schema } = mongoose;

const bodegaSchema = new Schema({
  nombre: { type: String, required: true },
  categoria: { type: String, required: true },
  capacidad: { type: Number, required: true },
  albergue: { type: Schema.Types.ObjectId, ref: 'Albergue' },
  productos: [{ type: Schema.Types.ObjectId, ref: 'Producto' }] 
}, {
  timestamps: true
});

// Añadimos un método virtual para calcular el porcentaje de ocupación
bodegaSchema.virtual('porcentajeOcupacion').get(function() {
  return (this.productos.length / this.capacidad) * 100;
});

module.exports = mongoose.model('Bodega', bodegaSchema);
