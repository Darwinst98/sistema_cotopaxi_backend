const express = require('express');
const ciudadanoController = require('../controller/ciudadanoController');
const authenticateToken = require('../Middleware/authenticateToken');
const router = express.Router();

router.post('/register', ciudadanoController.createCiudadano);
router.get('/:id/ciudadanos', authenticateToken, ciudadanoController.getCiudadanos);
router.delete('/:id', authenticateToken, ciudadanoController.deleteCiudadano);
router.put('/:id', authenticateToken, ciudadanoController.updateCiudadano);

module.exports = router;