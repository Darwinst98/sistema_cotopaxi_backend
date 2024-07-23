const express = require('express');
const connectDB = require('./connection/db'); // Ajusta la ruta si es necesario
const models = require('./model');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
connectDB();

app.use(express.json());
app.use(cors())

const usuarioRoutes = require('./routes/usuarioRoutes');
const albergueRoutes = require('./routes/alberqueRoutes');
const ciudadanoRoutes = require('./routes/ciudadanoRoutes');
const bodegaRoutes = require('./routes/bodegaRoutes');
const sitioSeguroRoutes = require('./routes/sitioSeguroRoutes');
const productoRoutes = require('./routes/productoRoutes');
const domicilioRoutes = require('./routes/domicilioRoutes');
const enfermedadRoutes = require('./routes/enfermedadRoutes');

app.use('/api/usuario', usuarioRoutes);
app.use('/api/albergue', albergueRoutes);
app.use('/api/ciudadano', ciudadanoRoutes);
app.use('/api/bodega', bodegaRoutes);
app.use('/api/sitioSeguro', sitioSeguroRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/domicilios', domicilioRoutes);
app.use('/api/enfermedad', enfermedadRoutes);

port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});

// const mongoose = require('mongoose');
// const Enfermedad = require('./model/Enfermedad');  // Asegúrate de que la ruta al modelo sea correcta
// const Medicamento = require('./model/Medicamento');
// const fs = require('fs');

// const mongoURI = 'mongodb+srv://wowsolowow:NLfA2ZOzxBv4fNr0@work.krljzub.mongodb.net/sistema_cotopaxi?retryWrites=true&w=majority&appName=Work';
// async function insertarDatos() {
//   try {
//     await mongoose.connect(mongoURI);
//     console.log('Connected to MongoDB Atlas');

//     const data = JSON.parse(fs.readFileSync('enfermedades.json', 'utf-8'));

//     for (let enfermedadData of data) {
//       const medicamentos = await Medicamento.insertMany(enfermedadData.medicamentos);
//       const enfermedad = new Enfermedad({
//         nombre: enfermedadData.nombre,
//         descripcion: enfermedadData.descripcion,
//         medicamentos: medicamentos.map(med => med._id)
//       });
//       await enfermedad.save();
//     }

//     console.log('Data successfully inserted');
//   } catch (err) {
//     console.error('Error inserting data:', err);
//   } finally {
//     await mongoose.disconnect();
//     console.log('Disconnected from MongoDB Atlas');
//   }
// }

// insertarDatos();