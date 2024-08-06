const Joi = require("@hapi/joi");
const Albergue = require("../model/Albergue");
const Ciudadano = require("../model/Ciudadano");
const Usuario = require("../model/Usuario");
const Bodega = require("../model/Bodega");
const QRCode = require("qrcode");
const express = require("express");
const router = express.Router();

const schemaRegisters = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  capacidadCiudadanos: Joi.number().required(),
  capacidadBodegas: Joi.number().required(),
  capacidadUsuarios: Joi.number().required(),
  cordenadas_x: Joi.number().required(),
  cordenadas_y: Joi.number().required(),
});

exports.getAlbergues = async (req, res) => {
  try {
    const userId = req.user.id; // Suponiendo que el ID del usuario está en req.user.id
    const user = await Usuario.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    let albergues;
    if (user.rol === "admin_general") {
      albergues = await Albergue.find().lean(); // Admin general ve todos los albergues
    } else {
      albergues = await Albergue.find({ _id: user.albergue }).lean(); // Otros roles ven solo su albergue
    }

    const albergueIds = albergues.map((albergue) => albergue._id);

    const ciudadanosCount = await Ciudadano.aggregate([
      { $match: { albergue: { $in: albergueIds } } },
      { $group: { _id: "$albergue", count: { $sum: 1 } } },
    ]);

    const usuariosCount = await Usuario.aggregate([
      { $match: { albergue: { $in: albergueIds } } },
      { $group: { _id: "$albergue", count: { $sum: 1 } } },
    ]);

    const bodegasCount = await Bodega.aggregate([
      { $match: { albergue: { $in: albergueIds } } },
      { $group: { _id: "$albergue", count: { $sum: 1 } } },
    ]);

    albergues.forEach((albergue) => {
      const ciudadanos = ciudadanosCount.find((item) =>
        item._id.equals(albergue._id)
      );
      const usuarios = usuariosCount.find((item) =>
        item._id.equals(albergue._id)
      );
      const bodegas = bodegasCount.find((item) =>
        item._id.equals(albergue._id)
      );

      albergue.ciudadanosCount = ciudadanos ? ciudadanos.count : 0;
      albergue.usuariosCount = usuarios ? usuarios.count : 0;
      albergue.bodegasCount = bodegas ? bodegas.count : 0;
    });

    res.json(albergues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAlberguesMovil = async (req, res) => {
  try {
    const albergues = await Albergue.find().lean();
    res.json(albergues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controlador para crear un nuevo albergue
exports.createAlbergue = async (req, res) => {
  try {
    // Validar los datos de la solicitud
    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Crear y guardar el nuevo albergue
    const nuevoAlbergue = new Albergue(value);
    await nuevoAlbergue.save();

    // Crear y guardar las nuevas bodegas
    const bodegas = [
      {
        nombre: `Bodega de ${value.nombre} (Medicamentos)`,
        categoria: "Medicamentos",
        capacidad: 500,
        albergue: nuevoAlbergue._id,
      },
      {
        nombre: `Bodega de ${value.nombre} (Suministros)`,
        categoria: "Suministros",
        capacidad: 500,
        albergue: nuevoAlbergue._id,
      },
    ];

    const nuevasBodegas = await Bodega.insertMany(bodegas);

    // Agregar las bodegas al albergue
    nuevoAlbergue.bodegas.push(...nuevasBodegas.map((bodega) => bodega._id));
    await nuevoAlbergue.save();

    // Crear la respuesta
    const responseObject = {
      success: true,
      albergue: nuevoAlbergue,
      bodegas: nuevasBodegas,
    };

    res.status(201).json(responseObject);
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "¡Ups! Algo salió mal al intentar registrarte. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

// Controlador para editar un albergue existente
exports.updateAlbergue = async (req, res) => {
  try {
    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const albergueActualizado = await Albergue.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true }
    );

    if (!albergueActualizado) {
      return res.status(404).json({
        success: false,
        message: "Albergue no encontrado.",
      });
    }

    const responseObject = {
      success: true,
      albergue: albergueActualizado,
    };

    res.json(responseObject);
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "¡Ups! Algo salió mal al intentar actualizar el albergue. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

// Controlador para eliminar un albergue
exports.deleteAlbergue = async (req, res) => {
  try {
    const albergueEliminado = await Albergue.findByIdAndDelete(req.params.id);

    if (!albergueEliminado) {
      return res.status(404).json({
        success: false,
        message: "Albergue no encontrado.",
      });
    }

    const bodegas = await Bodega.find({ albergue: albergueEliminado._id });
    for (let bodega of bodegas) {
      await Bodega.findByIdAndDelete(bodega._id);
    }
    res.json({
      success: true,
      message: "Albergue eliminado correctamente.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "¡Ups! Algo salió mal al intentar eliminar el albergue. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

//Controlador para traer el numero total de albergues
exports.getTotalAlbergues = async (req, res) => {
  try {
    const totalAlbergues = await Albergue.countDocuments();
    res.json({
      success: true,
      totalAlbergues: totalAlbergues,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "¡Ups! Algo salió mal al intentar obtener el total de albergues. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

exports.getAlbergueIdQR = async (req, res) => {
  try {
    const url = `${req.protocol}://localhost:5000/api/albergue/${req.params.id}`;

    const qrCode = await QRCode.toDataURL(url);
    res.send({ qrCode, url });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getAlbergueQrView = async (req, res) => {
  try {
    const albergue = await Albergue.findById(req.params.id);
    if (!albergue) {
      return res.status(404).send("Albergue no encontrado");
    }
     

    res.send(`
      <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${albergue.nombre}</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    .background {
      background-image: url('https://www.comecuamex.com/wp-content/uploads/2021/04/cotopaxi-1200x600-1-450x278.jpg');
      background-size: cover;
      background-position: center;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }
    .card {
      background: rgba(0, 0, 0, 0.75);
      padding: 30px;
      border-radius: 12px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 15px 25px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      text-align: center;
    }
    .title {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 20px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.2);
      padding-bottom: 10px;
    }
    .info {
      font-size: 1.125rem;
      margin-bottom: 15px;
    }
    .form-group {
      margin-top: 20px;
    }
    .form-input {
      border: 1px solid #ccc;
      padding: 10px;
      border-radius: 8px;
      width: calc(100% - 120px);
      display: inline-block;
      margin-right: 10px;
      color:black;
    }
    .form-button {
      background-color: #4CAF50;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
    .form-button:hover {
      background-color: #45a049;
    }
    .message {
      margin-top: 20px;
      color: blue;
    }
      .styled-link {
      color: #1d4ed8; /* Azul claro */
      font-weight: 600; /* Negrita */
      text-decoration: underline; /* Subrayado */
      transition: color 0.3s ease, transform 0.3s ease; /* Transición suave */
    }

    .styled-link:hover {
      color: #1e40af; /* Azul oscuro */
      transform: scale(1.05); /* Efecto de zoom al pasar el cursor */
    }

    .styled-link:focus {
      outline: none; /* Elimina el contorno al enfocarse */
      box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.5); /* Sombra alrededor del enlace al ser enfocado */
    }
  </style>
  <script>
    async function handleSubmit(event) {
      event.preventDefault();
      const cedula = document.getElementById('cedula').value;
      try {
        const response = await fetch(\`/api/albergue/${albergue._id}/sumarse\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cedula })
        });
        const data = await response.json();
        document.getElementById('message').innerText = data.message;
      } catch (error) {
        document.getElementById('message').innerText = 'Error en la solicitud. Inténtalo de nuevo.';
      }
    }
  </script>
</head>
<body>
  <div class="background">
    <div class="card">
      <h1 class="title">${albergue.nombre}</h1>
      <p class="info">🌍 <span class="font-semibold">Coordenadas:</span> (${albergue.cordenadas_x}, ${albergue.cordenadas_y})</p>
      <p class="info">👥 <span class="font-semibold">Capacidad de Ciudadanos:</span> ${albergue.capacidadCiudadanos}</p>
      <p class="info">🏢 <span class="font-semibold">Capacidad de Bodegas:</span> ${albergue.capacidadBodegas}</p>
      <form class="form-group" onsubmit="handleSubmit(event)">
        <input type="text" id="cedula" class="form-input" placeholder="Ingrese su cédula" required />
        <button type="submit" class="form-button">Sumarse al Albergue</button>
      </form>
      <p id="message" class="message"></p>
      <a href="http://localhost:5173/formulario" target="_blank" class="styled-link">
    Si no estás registrado en el sistema, regístrate aquí
  </a>

    </div>
  </div>
</body>
</html>
    `);

    
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.sumarCiudadanoAlbergueQR = async (req, res) => {
  const { cedula } = req.body;

  try {
    const ciudadano = await Ciudadano.findOne({ cedula });
    if (!ciudadano) {
      return res.status(404).send({
        message:
          "Cédula no registrada en el sistema. Por favor, regístrese primero.",
      });
    }

    if (ciudadano.albergue) {
      if (ciudadano.albergue.toString() === req.params.id) {
        return res
          .status(400)
          .send({ message: "Ya estás registrado en este albergue." });
      } else {
        return res
          .status(400)
          .send({ message: "Ya estás registrado en otro albergue." });
      }
    }

    ciudadano.albergue = req.params.id;
    ciudadano.salvaldo = true;
    await ciudadano.save();

    const albergue = await Albergue.findById(req.params.id);
    albergue.ciudadanos.push(ciudadano._id);
    await albergue.save();

    res.send({ message: "Te has sumado exitosamente al albergue." });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
