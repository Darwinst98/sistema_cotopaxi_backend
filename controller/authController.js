const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../model/Usuario');
const Ciudadano = require('../model/Ciudadano');

const createToken = (payload, expiresIn) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const findUser = async (query) => {
    return Usuario.findOne(query).populate({
        path: "albergue",
        select: "nombre",
    }).lean();
};

const validatePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};

const handleLoginResponse = (res, success, data = {}, status = 200) => {
    const message = success 
        ? undefined 
        : '¡Ups! Las credenciales parecen estar incorrectas. Por favor, inténtalo nuevamente.';
    
    res.status(status).json({ success, message, ...data });
};

const handleErrorResponse = (res, error) => {
    res.status(500).json({
        success: false,
        message: '¡Oh no! Algo salió mal. Por favor, inténtalo nuevamente más tarde.',
        error: error.message,
    });
};

exports.loginUsuario = async (req, res) => {
    try {
        const { cedula, nombre, password } = req.body;
        let usuario;

        if (cedula) {
            // Login web
            usuario = await findUser({ cedula });
        } else if (nombre) {
            // Login móvil
            usuario = await findUser({ nombre });
        } else {
            return handleLoginResponse(res, false, { message: 'Datos de login incompletos o inválidos.' }, 400);
        }

        if (usuario && await validatePassword(password, usuario.password)) {
            const token = createToken({ id: usuario._id, rol: usuario.rol }, '12h');
            const { password: _, ...userWithoutPassword } = usuario;
            
            handleLoginResponse(res, true, { token, usuario: userWithoutPassword });
        } else {
            handleLoginResponse(res, false, {}, 401);
        }
    } catch (error) {
        handleErrorResponse(res, error);
    }
};

exports.loginCiudadano = async (req, res) => {
    try {
        const { nombre, cedula } = req.body;
        const ciudadano = await Ciudadano.findOne({ cedula, nombre }).populate({
            path: "albergue",
            select: "nombre",
        }).lean();

        if (ciudadano) {
            const token = createToken({ id: ciudadano._id }, '1h');
            handleLoginResponse(res, true, { token, ciudadano });
        } else {
            handleLoginResponse(res, false, {}, 401);
        }
    } catch (error) {
        handleErrorResponse(res, error);
    }
};