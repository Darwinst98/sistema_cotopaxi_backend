const jwt = require('jsonwebtoken');
const Usuario = require('../model/Usuario');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Acceso denegado. No se proporcionó un token.'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const usuario = await Usuario.findById(decoded.id);
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o usuario no encontrado.'
            });
        }

        req.user = usuario;
        req.token = token;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido.'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado.'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error en la autenticación.',
            error: error.message
        });
    }
};

module.exports = authenticateToken;