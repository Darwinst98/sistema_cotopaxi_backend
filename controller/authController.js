const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../model/Usuario');
const Ciudadano = require('../model/Ciudadano');


exports.loginUsuario = async (req, res) => {
    try {
        const { cedula, nombre, password } = req.body;
        let usuario;

        // Determina si es login web (cédula + password) o móvil (nombre + password)
        if (cedula) {
            // Login web
            usuario = await Usuario.findOne({ cedula });
        } else if (nombre) {
            // Login móvil
            usuario = await Usuario.findOne({ nombre });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Datos de login incompletos o inválidos.'
            });
        }

        if (usuario) {
            const isPasswordValid = await bcrypt.compare(password, usuario.password);
            if (isPasswordValid) {
                const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

                const responseObject = {
                    success: true,
                    token,
                    usuario: {
                        rol: usuario.rol,
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        cedula: usuario.cedula,
                        email: usuario.email,
                        telefono: usuario.telefono,
                        cedula: usuario.cedula,
                        albergue: usuario.albergue
                    }
                };
                return res.status(200).json(responseObject);
            }
        }

        res.status(401).json({
            success: false,
            message: '¡Ups! Las credenciales parecen estar incorrectas. Por favor, inténtalo nuevamente.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '¡Oh no! Algo salió mal. Por favor, inténtalo nuevamente más tarde.',
            error: error.message,
        });
    }
};

exports.loginCiudadano = async (req, res) => {
    try {
        const { nombre, cedula } = req.body;
        const ciudadano = await Ciudadano.findOne({ cedula, nombre }).populate({
            path: "albergue",
            select: "nombre", // Esto seleccionará solo el nombre del medicamento
          }).lean();

        if (ciudadano && ciudadano.cedula === cedula && ciudadano.nombre === nombre) {
            const token = jwt.sign({ id: ciudadano.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

            const responseObject = {
                success: true,
                token,
                ciudadano: ciudadano
            };
            res.status(200).json(responseObject);
        } else {
            res.status(401).json({
                success: false,
                message: '¡Ups! Las credenciales parecen estar incorrectas. Por favor, inténtalo nuevamente.'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '¡Oh no! Algo salió mal. Por favor, inténtalo nuevamente más tarde.',
            error: error.message,
        });
    }
};