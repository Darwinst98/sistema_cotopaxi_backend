const mongoose = require('mongoose');

// URL de conexión a MongoDB Atlas
const uri = 'mongodb+srv://djsimba:Dj140498@tesis.khmn9bk.mongodb.net/db_sistema_cotopaxi?retryWrites=true&w=majority';

// Conexión a la base de datos MongoDB Atlas
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Conexión a la base de datos establecida correctamente');
  })
  .catch((error) => {
    console.error('Error al conectar a la base de datos:', error);
  });
