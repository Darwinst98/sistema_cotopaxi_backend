const bcrypt = require("bcrypt");
const Joi = require("@hapi/joi");
const Usuario = require('../model/Usuario');
const Albergue = require('../model/Albergue');
const schemaRegisters = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  apellido: Joi.string().min(2).max(100).required(),
  email: Joi.string().min(4).max(100).required().email(),
  cedula: Joi.string().min(10).max(10).required(),
  password: Joi.string().min(5).max(100).optional(),
  telefono: Joi.string().min(10).max(10).required(),
  imgPerfil: Joi.string().optional(),
  rol: Joi.string()
    .valid("admin_general", "admin_zonal", "admin_farmaceutico")
    .required(),
  albergue: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
  __v: Joi.number().optional()
}).unknown(true); // Esto permite campos desconocidos


const schemaAdminGeneral = Joi.object({
  nombre: Joi.string().min(2).max(100).required(),
  apellido: Joi.string().min(2).max(100).required(),
  email: Joi.string().min(4).max(100).required().email(),
  cedula: Joi.string().min(10).max(10).required(),
  password: Joi.string().min(5).max(100).required(),
  telefono: Joi.string().min(10).max(10).required(),
  imgPerfil: Joi.string().optional(),
  rol: Joi.string().valid("admin_general").required(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
  __v: Joi.number().optional()
}).unknown(true);

exports.createAdminGeneral = async (req, res) => {
  try {
    const { error, value } = schemaAdminGeneral.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existeEmail = await Usuario.findOne({ email: value.email });
    if (existeEmail) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const existeCedula = await Usuario.findOne({ cedula: value.cedula });
    if (existeCedula) {
      return res.status(400).json({ error: "La cédula ya está registrada" });
    }

    const existeTelefono = await Usuario.findOne({ telefono: value.telefono });
    if (existeTelefono) {
      return res.status(400).json({ error: "El teléfono ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(value.password, 10);
    const nuevoAdminGeneral = new Usuario({
      ...value,
      password: hashedPassword,
      rol: "admin_general"
    });

    await nuevoAdminGeneral.save();

    res.status(201).json({
      success: true,
      usuario: nuevoAdminGeneral,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar registrar el administrador general. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};


exports.createUsuario = async (req, res) => {
  try {
    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existeEmail = await Usuario.findOne({ email: value.email });
    if (existeEmail) {
      return res.status(400).json({ error: "El email ya está registrado" });
      
    }

    const existeCedula = await Usuario.findOne({ cedula: value.cedula });
    if (existeCedula) {
      return res.status(400).json({ error: "La cédula ya está registrada" });
      
    }

    const existeTelefono = await Usuario.findOne({ telefono: value.telefono });
    if (existeTelefono) {
      return res.status(400).json({ error: "El telefono ya está registrado" });
    }

    if ((value.rol === 'admin_zonal' || value.rol === 'admin_farmaceutico') && !value.albergue) {
      return res.status(400).json({ error: "Los roles admin_zonal y admin_farmaceutico requieren un albergue asignado" });
    }

    const albergue = await Albergue.findById(value.albergue);
    if (!albergue) {
      return res.status(400).json({ error: "Albergue no encontrado" });
    }

    if (albergue.usuarios.length >= albergue.capacidadUsuarios) {
      return res.status(400).json({ error: "Capacidad máxima de administradores alcanzada en el albergue" });
    }

    const hashedPassword = await bcrypt.hash(value.password, 10);
    const nuevoUsuario = new Usuario({
      ...value,
      password: hashedPassword,
    });

    await nuevoUsuario.save();

    if (nuevoUsuario.albergue) {
      await Albergue.findByIdAndUpdate(
        nuevoUsuario.albergue,
        { $push: { usuarios: nuevoUsuario._id } },
        { new: true, useFindAndModify: false }
      );
    }

    res.status(201).json({
      success: true,
      usuario: nuevoUsuario,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar registrar el usuario. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};


exports.createUsuario = async (req, res) => {
  try {
    const { error, value } = schemaRegisters.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existeEmail = await Usuario.findOne({ email: value.email });
    if (existeEmail) {
      return res.status(400).json({ error: "El email ya está registrado" });
      
    }

    const existeCedula = await Usuario.findOne({ cedula: value.cedula });
    if (existeCedula) {
      return res.status(400).json({ error: "La cédula ya está registrada" });
      
    }

    const existeTelefono = await Usuario.findOne({ telefono: value.telefono });
    if (existeTelefono) {
      return res.status(400).json({ error: "El telefono ya está registrado" });
    }

    if ((value.rol === 'admin_zonal' || value.rol === 'admin_farmaceutico') && !value.albergue) {
      return res.status(400).json({ error: "Los roles admin_zonal y admin_farmaceutico requieren un albergue asignado" });
    }

    const albergue = await Albergue.findById(value.albergue);
    if (!albergue) {
      return res.status(400).json({ error: "Albergue no encontrado" });
    }

    if (albergue.usuarios.length >= albergue.capacidadUsuarios) {
      return res.status(400).json({ error: "Capacidad máxima de administradores alcanzada en el albergue" });
    }

    const hashedPassword = await bcrypt.hash(value.password, 10);
    const nuevoUsuario = new Usuario({
      ...value,
      password: hashedPassword,
    });

    await nuevoUsuario.save();

    if (nuevoUsuario.albergue) {
      await Albergue.findByIdAndUpdate(
        nuevoUsuario.albergue,
        { $push: { usuarios: nuevoUsuario._id } },
        { new: true, useFindAndModify: false }
      );
    }

    res.status(201).json({
      success: true,
      usuario: nuevoUsuario,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar registrar el usuario. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

exports.updateProfileImage = async (req, res) => {
  const { cedula, imgPerfil } = req.body;

  console.log("Recibí una solicitud de actualización de ProfileImage con cédula:", cedula, "e imgPerfil:", imgPerfil);

  if (!cedula || !imgPerfil) {
    return res.status(400).json({ message: 'Cédula e imagen de perfil son requeridos' });
  }

  try {
    const usuario = await Usuario.findOneAndUpdate(
      { cedula: cedula },
      { imgPerfil: imgPerfil },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Imagen de perfil actualizada', usuario: usuario });
  } catch (error) {
    console.error("Error al actualizar la imagen del perfil:", error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find({ rol: { $in: ['admin_zonal', 'admin_farmaceutico'] } })
  .populate('albergue', 'nombre')
  .lean();
    
    // Transformamos los datos para asegurarnos de que el campo albergue tenga la estructura correcta
    const usuariosFormateados = usuarios.map(usuario => ({
      ...usuario,
      albergue: usuario.albergue ? { _id: usuario.albergue._id, nombre: usuario.albergue.nombre } : null
    }));

    res.json(usuariosFormateados);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar obtener los usuarios. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

exports.editUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Eliminar campos que no deben ser actualizados manualmente
    ['_id', 'createdAt', 'updatedAt', '__v'].forEach(field => delete updateData[field]);

    // Validar los datos de actualización
    const { error } = schemaRegisters.validate(updateData, { abortEarly: false });
    if (error) {
      return res.status(400).json({ error: error.details.map(err => err.message) });
    }

    // Si se proporciona una nueva contraseña, hasheala
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('albergue', 'nombre');

    if (!usuarioActualizado) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      success: true,
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el usuario",
      error: error.message
    });
  }
};

exports.deleteUsuario =  async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (usuario.albergue) {
      await Albergue.findByIdAndUpdate(
        usuario.albergue,
        { $pull: { usuarios: usuario._id } },
        { new: true, useFindAndModify: false }
      );
    }

    await Usuario.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Usuario eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar eliminar el usuario. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

exports.asignarAlbergue =  async (req, res) => {
  try {
    const { usuarioId, albergueId } = req.body;

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (usuario.rol === 'admin_general') {
      return res.status(400).json({ error: "No se puede asignar un albergue a un admin_general" });
    }

    const albergue = await Albergue.findById(albergueId);
    if (!albergue) {
      return res.status(404).json({ error: "Albergue no encontrado" });
    }

    usuario.albergue = albergueId;
    await usuario.save();

    await Albergue.findByIdAndUpdate(
      albergueId,
      { $addToSet: { usuarios: usuarioId } },
      { new: true, useFindAndModify: false }
    );

    res.json({
      success: true,
      message: "Albergue asignado correctamente",
      usuario,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "¡Ups! Algo salió mal al intentar asignar el albergue. Por favor, inténtalo nuevamente más tarde.",
      error: error.message,
    });
  }
};

exports.getUsuariosPorAlbergue = async (req, res) => {
  try {
    const albergueId  = req.params.id;

    // Verifica si el albergueId es válido
    if (!albergueId || !albergueId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "ID de albergue inválido" });
    }

    // Busca todos los usuarios que pertenecen al albergue especificado
    const usuarios = await Usuario.find({ albergue: albergueId })
      .select('-password') // Excluye el campo password por seguridad
      .populate('albergue', 'nombre'); // Opcionalmente, puedes poblar la información del albergue

    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios por albergue:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios del albergue",
      error: error.message
    });
  }
};