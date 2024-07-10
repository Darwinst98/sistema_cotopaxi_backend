const Joi = require("@hapi/joi");
const Albergue = require('../model/Albergue');
const Ciudadano = require('../model/Ciudadano');
const Usuario = require('../model/Usuario');
const Bodega = require('../model/Bodega');
const schemaRegisters = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  descripcion: Joi.string().min(2).max(200),
  capacidadCiudadanos: Joi.number().required(),
  capacidadBodegas: Joi.number().required(),
  capacidadUsuarios: Joi.number().required(),
  cordenadas_x: Joi.number().required(),
  cordenadas_y: Joi.number().required()
});



exports.getAlbergues = async (req, res) => {
  try {
    const albergues = await Albergue.find().lean();

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
exports.createAlbergue = async (req, res) => {
  try {
    if (req.user.rol !== 'admin_general') {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para crear un albergue. Solo el admin_general puede realizar esta acción."
      });
    }

    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const nuevoAlbergue = new Albergue(value);
    await nuevoAlbergue.save();


    const responseObject = {
      success: true,
      albergue: nuevoAlbergue,
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
exports.deleteAlbergue = async (req, res) => {
  try {
    if (req.user.rol !== 'admin_general') {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar un albergue. Solo el admin_general puede realizar esta acción."
      });
    }

    const albergueEliminado = await Albergue.findByIdAndDelete(req.params.id);

    if (!albergueEliminado) {
      return res.status(404).json({
        success: false,
        message: "Albergue no encontrado."
      });
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
