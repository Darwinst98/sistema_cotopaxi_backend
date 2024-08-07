const express = require('express');
const usuarioController = require('../controller/usuarioController');
const authController = require('../controller/authController');
const authenticateToken = require('../Middleware/authenticateToken');
const { esAdminGeneral } = require('../Middleware/authMiddleware');
const router = express.Router();

router.post('/registerAdmin', usuarioController.createAdminGeneral);
router.post('/register', esAdminGeneral, usuarioController.createUsuario);
router.post('/login', authController.loginUsuario);
router.get('/', esAdminGeneral, authenticateToken, usuarioController.getUsuarios);
router.put('/:id', esAdminGeneral, authenticateToken, usuarioController.editUsuario);
router.delete('/:id', esAdminGeneral, authenticateToken, usuarioController.deleteUsuario);
router.post('/:id/asignar-albergue', esAdminGeneral, authenticateToken, usuarioController.asignarAlbergue);
router.get('/:id/albergue', authenticateToken, usuarioController.getUsuariosPorAlbergue);
router.post('/updateProfileImage', usuarioController.updateProfileImage);
module.exports = router;