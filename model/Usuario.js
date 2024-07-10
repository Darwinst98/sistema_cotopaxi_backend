const mongoose = require('mongoose');
const { Schema } = mongoose;

const usuarioSchema = new Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  cedula: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  telefono: { type: String, required: true, unique: true },
  rol: { type: String, enum: ['admin_general', 'admin_zonal', 'admin_farmaceutico'], required: true },
  albergue: { type: Schema.Types.ObjectId, ref: 'Albergue' },
}, {
  timestamps: true
});

module.exports = mongoose.model('Usuario', usuarioSchema);
