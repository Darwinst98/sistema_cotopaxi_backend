const mongoose = require('mongoose');
const { Schema } = mongoose;

const albergueSchema = new Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: false },
  cordenadas_x: { type: Number, required: true },
  cordenadas_y: { type: Number, required: true },
  capacidadCiudadanos: { type: Number, required: true },
  capacidadBodegas: { type: Number, required: true },
  capacidadUsuarios: { type: Number, required: true },
  ciudadanos: [{ type: Schema.Types.ObjectId, ref: 'Ciudadano' }],
  bodegas: [{ type: Schema.Types.ObjectId, ref: 'Bodega' }],
  usuarios: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }]
}, {
  timestamps: true
});

albergueSchema.pre('save', async function(next) {
  if (this.isModified('ciudadanos')) {
    for (let ciudadanoId of this.ciudadanos) {
      await mongoose.model('Ciudadano').findByIdAndUpdate(ciudadanoId, { albergue: this._id });
    }
  }
  next();
});


module.exports = mongoose.model('Albergue', albergueSchema);
