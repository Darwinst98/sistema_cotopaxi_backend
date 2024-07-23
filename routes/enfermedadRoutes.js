const express = require('express');
const enfermedadController = require('../controller/enfermedadController');
const authenticateToken = require('../Middleware/authenticateToken');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
    
router.post('/register', authenticateToken, enfermedadController.crearEnfermedad);
router.get('/',  enfermedadController.obtenerTodasEnfermedades);
router.get('/:id', authenticateToken, enfermedadController.obtenerEnfermedad);
router.put('/:id', authenticateToken, enfermedadController.editarEnfermedad);
router.delete('/:id', authenticateToken, enfermedadController.eliminarEnfermedad);
router.post('/upload-excel', upload.single('file'), enfermedadController.procesarExcel);
module.exports = router;