const mongoose = require('mongoose');
const { Schema } = mongoose;

const ciudadanoSchema = new Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  edad: { type: Number, required: true },
  cedula: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  telefono: { type: String, required: true },
  enfermedades: { type: [String], required: true },
  medicamentos: { type: [String], required: true },
  qrURL: { type: String, required: true },
  imgPerfil: {
    type: String,
    default: '' 
  },
  salvaldo: { type: Boolean, required: true, default: false },
  medicamentos: [{ type: Schema.Types.ObjectId, ref: 'Medicamento' }],
  domicilio: { type: Schema.Types.ObjectId, ref: 'Domicilio', required: true },
  albergue: { type: Schema.Types.ObjectId, ref: 'Albergue'},
}, {
  timestamps: true
});


module.exports = mongoose.model('Ciudadano', ciudadanoSchema);
