const mongoose = require('mongoose');
const { Schema } = mongoose;

const enfermedadSchema = new Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  medicamentos: [{ type: Schema.Types.ObjectId, ref: 'Medicamento' }]
});

module.exports = mongoose.model('Enfermedad', enfermedadSchema);
