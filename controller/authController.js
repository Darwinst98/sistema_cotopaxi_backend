const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../model/Usuario');
const Ciudadano = require('../model/Ciudadano');


exports.loginUsuario = async (req, res) => {
    try {
        const { cedula, password } = req.body;
        const usuario = await Usuario.findOne({ cedula });

        if (usuario) {
            const isPasswordValid = await bcrypt.compare(password, usuario.password);
            if (isPasswordValid) {
                const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

                const responseObject = {
                    success: true,
                    token,
                    usuario: {
                        rol: usuario.rol
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
        const { cedula } = req.body;
        const ciudadano = await Ciudadano.findOne({ cedula });

        if (ciudadano && compare(cedula, ciudadano.cedula)) {
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