const express = require('express');
const usuarioController = require('../controller/usuarioController');
const authController = require('../controller/authController');
const authenticateToken = require('../Middleware/authenticateToken');
const router = express.Router();

router.post('/register', usuarioController.createUsuario);
router.post('/login', authController.loginUsuario);
router.get('/:id/usuarios', authenticateToken, usuarioController.getUsuarios);

module.exports = router;