const Joi = require("@hapi/joi");
const SitioSeguro = require("../model/SitioSeguro");
const { esAdminGeneral } = require('../Middleware/authMiddleware');

const schemaRegisters = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
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

exports.createSitioSeguro = [esAdminGeneral, async (req, res) => {
  try {


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
}];

exports.updateSitioSeguro = [esAdminGeneral, async (req, res) => {
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
}];

// Controlador para eliminar un sitio seguro
exports.deleteSitioSeguro = [esAdminGeneral, async (req, res) => {
  try {

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
}];


//Controlador para traer el numero total de sitios seguros
exports.getTotalSitioSeguros = async (req, res) => {
  try {
    const totalSitioSeguros = await SitioSeguro.countDocuments();
    res.json({
      success: true,
      totalSitioSeguros: totalSitioSeguros
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar obtener el total de sitios seguros. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};