const Joi = require("@hapi/joi");
const Albergue = require('../model/Albergue');
const Ciudadano = require('../model/Ciudadano');
const Usuario = require('../model/Usuario');
const Bodega = require('../model/Bodega');

const schemaRegisters = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  capacidadCiudadanos: Joi.number().required(),
  capacidadBodegas: Joi.number().required(),
  capacidadUsuarios: Joi.number().required(),
  cordenadas_x: Joi.number().required(),
  cordenadas_y: Joi.number().required()
});



exports.getAlbergues = async (req, res) => {
  try {
    const userId = req.user.id; // Suponiendo que el ID del usuario está en req.user.id
    const user = await Usuario.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    let albergues;
    if (user.rol === 'admin_general') {
      albergues = await Albergue.find().lean(); // Admin general ve todos los albergues
    } else {
      albergues = await Albergue.find({ _id: user.albergue }).lean(); // Otros roles ven solo su albergue
    }

    const albergueIds = albergues.map(albergue => albergue._id);

    const ciudadanosCount = await Ciudadano.aggregate([
      { $match: { albergue: { $in: albergueIds } } },
      { $group: { _id: "$albergue", count: { $sum: 1 } } }
    ]);

    const usuariosCount = await Usuario.aggregate([
      { $match: { albergue: { $in: albergueIds } } },
      { $group: { _id: "$albergue", count: { $sum: 1 } } }
    ]);

    const bodegasCount = await Bodega.aggregate([
      { $match: { albergue: { $in: albergueIds } } },
      { $group: { _id: "$albergue", count: { $sum: 1 } } }
    ]);

    albergues.forEach(albergue => {
      const ciudadanos = ciudadanosCount.find(item => item._id.equals(albergue._id));
      const usuarios = usuariosCount.find(item => item._id.equals(albergue._id));
      const bodegas = bodegasCount.find(item => item._id.equals(albergue._id));

      albergue.ciudadanosCount = ciudadanos ? ciudadanos.count : 0;
      albergue.usuariosCount = usuarios ? usuarios.count : 0;
      albergue.bodegasCount = bodegas ? bodegas.count : 0;
    });

    res.json(albergues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Controlador para crear un nuevo albergue
exports.createAlbergue =  async (req, res) => {
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
        categoria: 'Medicamentos',
        capacidad: 500,
        albergue: nuevoAlbergue._id,
      },
      {
        nombre: `Bodega de ${value.nombre} (Suministros)`,
        categoria: 'Suministros',
        capacidad: 500,
        albergue: nuevoAlbergue._id,
      },
    ];

    const nuevasBodegas = await Bodega.insertMany(bodegas);

    // Agregar las bodegas al albergue
    nuevoAlbergue.bodegas.push(...nuevasBodegas.map(bodega => bodega._id));
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
      message: "¡Ups! Algo salió mal al intentar registrarte. Por favor, inténtalo nuevamente más tarde.",
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

    const albergueActualizado = await Albergue.findByIdAndUpdate(req.params.id, value, { new: true });

    if (!albergueActualizado) {
      return res.status(404).json({
        success: false,
        message: "Albergue no encontrado."
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
      message: "¡Ups! Algo salió mal al intentar actualizar el albergue. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

// Controlador para eliminar un albergue
exports.deleteAlbergue =  async (req, res) => {
  try {

    const albergueEliminado = await Albergue.findByIdAndDelete(req.params.id);

    if (!albergueEliminado) {
      return res.status(404).json({
        success: false,
        message: "Albergue no encontrado."
      });
    }

    const bodegas = await Bodega.find({ albergue: albergueEliminado._id });
    for (let bodega of bodegas) {
      await Bodega.findByIdAndDelete(bodega._id);
    }
    res.json({
      success: true,
      message: "Albergue eliminado correctamente."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar eliminar el albergue. Por favor, inténtalo nuevamente más tarde.",
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
      totalAlbergues: totalAlbergues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar obtener el total de albergues. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};