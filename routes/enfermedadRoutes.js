const express = require('express');
const enfermedadController = require('../controller/enfermedadController');
const authenticateToken = require('../Middleware/authenticateToken');
const router = express.Router();

router.post('/register', authenticateToken, enfermedadController.crearEnfermedad);
router.get('/',  enfermedadController.obtenerTodasEnfermedades);
router.get('/:id', authenticateToken, enfermedadController.obtenerEnfermedad);
router.put('/:id', authenticateToken, enfermedadController.editarEnfermedad);
router.delete('/:id', authenticateToken, enfermedadController.eliminarEnfermedad);

module.exports = router;