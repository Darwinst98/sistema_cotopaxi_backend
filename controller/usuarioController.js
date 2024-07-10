const bcrypt = require("bcrypt");
const Joi = require("@hapi/joi");
const Usuario = require('../model/Usuario');
const Albergue = require('../model/Albergue');

const schemaRegisters = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  apellido: Joi.string().min(2).max(100).required(),
  email: Joi.string().min(4).max(100).required().email(),
  cedula: Joi.string().min(10).max(10).required(),
  password: Joi.string().min(5).max(100).required(),
  telefono: Joi.string().min(10).max(10).required(),
  rol: Joi.string()
    .valid("admin_general", "admin_zonal", "admin_farmaceutico")
    .required(),
  albergue: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});

exports.createUsuario = async (req, res) => {
  try {
    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existeEmail = await Usuario.findOne({ email: value.email });
    if (existeEmail) {
      return res.response({ error: "El email ya está registrado" }).code(400);
    }

    const existeCedula = await Usuario.findOne({ cedula: value.cedula });
    if (existeCedula) {
      return res.response({ error: "La cédula ya está registrada" }).code(400);
    }

    const existeTelefono = await Usuario.findOne({ telefono: value.telefono });
    if (existeTelefono) {
      return res
        .response({ error: "El telefono ya está registrada" })
        .code(400);
    }

    if ((value.rol === 'admin_zonal' || value.rol === 'admin_farmaceutico') && !value.albergue) {
      return res.status(400).json({ error: "Los roles admin_zonal y admin_farmaceutico requieren un albergue asignada" });
    }

    const hashedPassword = await bcrypt.hash(value.password, 10);
    const nuevoUsuario = new Usuario({
      ...value,
      password: hashedPassword,
    });
    await nuevoUsuario.save();

    await Albergue.findByIdAndUpdate(
      nuevoUsuario.albergue,
      { $push: { usuarios: nuevoUsuario._id } },
      { new: true, useFindAndModify: false }
    );

    const responseObject = {
      success: true,
      usuario: nuevoUsuario,
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

// Controlador para traer todos los usuarios que pertenecen a un albergue
exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find({ albergue: req.params.id });

    res.json(usuarios);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar obtener los usuarios. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};
