const express = require('express');
const cors = require('cors');
const db = require('./connection/db');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor en ejecución en el puerto ${PORT}`));

