const Joi = require('@hapi/joi');
const Domicilio = require('../model/Domicilio');

const schemaRegisters = Joi.object({
  nombre: Joi.string().required(),
  cordenadas_x: Joi.number().required(),
  cordenadas_y: Joi.number().required()
});

exports.createDomicilio = async (req, res) => {
  try {

    if (req.user.rol !== 'admin_general') {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para crear un domicilio. Solo el admin_general puede realizar esta acción."
        });
      }

    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const newDomicilio = new Domicilio(value);
    await newDomicilio.save();

    const responseObject = {
      success: true,
      domicilio: newDomicilio,
    };

    res.status(201).json(responseObject);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar registrar un domicilio. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

exports.getDomicilios = async (req, res) => {
    try {
      const domicilios = await Domicilio.find().lean();
      res.json(domicilios);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "¡Ups! Algo salió mal al intentar obtener los domicilios. Por favor, inténtalo nuevamente más tarde.",
        error: error.message,
      });
    }
};

exports.updateDomicilio = async (req, res) => {
  try {
    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const domicilio = await Domicilio.findByIdAndUpdate(req.params.id, value, { new: true });

    if (!domicilio) {
      return res.status(404).json({
        success: false,
        message: "Domicilio no encontrado."
      });
    }

    const responseObject = {
      success: true,
      domicilio: domicilio,
    };

    res.json(responseObject);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar actualizar el domicilio. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

exports.deleteDomicilio = async (req, res) => {
  try {
    if (req.user.rol !== 'admin_general') {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para eliminar un albergue. Solo el admin_general puede realizar esta acción."
        });
      }


    const domicilio = await Domicilio.findByIdAndDelete(req.params.id);

    if (!domicilio) {
      return res.status(404).json({
        success: false,
        message: "Domicilio no encontrado."
      });
    }

    res.json({
      success: true,
      message: "Domicilio eliminado correctamente."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar eliminar el domicilio. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};
