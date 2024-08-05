const express = require('express');
const ciudadanoController = require('../controller/ciudadanoController');
const authController = require('../controller/authController');
const authenticateToken = require('../Middleware/authenticateToken');
const router = express.Router();

router.post('/login', authController.loginCiudadano);
router.post('/register', ciudadanoController.createCiudadano);
router.post('/registerUser', authenticateToken, ciudadanoController.createCiudadanoUser);
router.get('/:id/ciudadanos', authenticateToken, ciudadanoController.getCiudadanos);
router.delete('/:id', authenticateToken, ciudadanoController.deleteCiudadano);
router.put('/:id', authenticateToken, ciudadanoController.updateCiudadano);
router.get('/total', authenticateToken, ciudadanoController.getTotalCiudadanos);
router.get('/ciudadanosDeTodosLosAlbergues', authenticateToken, ciudadanoController.getCiudadanosDeTodosLosAlbergues);
router.post('/scanQrCode', authenticateToken, ciudadanoController.scanQrCode);

module.exports = router;