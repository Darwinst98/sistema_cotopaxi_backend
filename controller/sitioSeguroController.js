const Joi = require("@hapi/joi");
const SitioSeguro = require("../model/SitioSeguro");

const schemaRegisters = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  descripcion: Joi.string().min(2).max(200),
  cordenadas_x: Joi.number().required(),
  cordenadas_y: Joi.number().required()
});

exports.getSitioSeguros = async (req, res) => {
  try {
    const sitioSeguros = await SitioSeguro.find().lean();
    res.json(sitioSeguros);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createSitioSeguro = async (req, res) => {
  try {

    if (req.user.rol !== 'admin_general') {
      return res.status(403).json({
          success: false,
          message: "No tienes permisos para crear un sitio seguro. Solo el admin_general puede realizar esta acción."
      });
  }


    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const nuevoSitioSeguro = new SitioSeguro(value);
    await nuevoSitioSeguro.save();

    const responseObject = {
      success: true,
      sitioSeguro: nuevoSitioSeguro,
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

exports.updateSitioSeguro = async (req, res) => {
  try {

    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const sitioSeguroActualizado = await SitioSeguro.findByIdAndUpdate(req.params.id, value, { new: true });

    if (!sitioSeguroActualizado) {
      return res.status(404).json({
        success: false,
        message: "Sitio seguro no encontrado."
      });
    }

    const responseObject = {
      success: true,
      sitioSeguro: sitioSeguroActualizado,
    };

    res.json(responseObject);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar actualizar el sitio seguro. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

// Controlador para eliminar un sitio seguro
exports.deleteSitioSeguro = async (req, res) => {
  try {
    if (req.user.rol !== 'admin_general') {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar un sitio seguro. Solo el admin_general puede realizar esta acción."
      });
    }

    const sitioSeguroEliminado = await SitioSeguro.findByIdAndDelete(req.params.id);

    if (!sitioSeguroEliminado) {
      return res.status(404).json({
        success: false,
        message: "Sitio seguro no encontrado."
      });
    }

    res.json({
      success: true,
      message: "Sitio seguro eliminado correctamente."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar eliminar el Sitio seguro. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

