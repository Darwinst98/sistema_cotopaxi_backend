// middleware/authMiddleware.js

const Usuario = require('../model/Usuario');
const jwt = require('jsonwebtoken');

exports.esAdminGeneral = async (req, res, next) => {
  try {
    // Verifica que haya un token en el header de la petición
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: "No se proporcionó token de autenticación" });
    }

    // Verifica y decodifica el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Busca el usuario en la base de datos
    const usuario = await Usuario.findById(decoded.id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verifica si el usuario es admin_general
    if (usuario.rol !== 'admin_general') {
      return res.status(403).json({ error: "Acceso denegado. Solo el admin_general puede realizar esta acción." });
    }

    // Si todo está bien, añade el usuario a la petición y pasa al siguiente middleware
    req.user = usuario;
    next();
  } catch (error) {
    console.error('Error en middleware esAdminGeneral:', error);
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};