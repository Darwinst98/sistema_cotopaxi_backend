const express = require('express');
const sitioSeguroController = require('../controller/sitioSeguroController');
const authenticateToken = require('../Middleware/authenticateToken');
const router = express.Router();

router.post('/register', authenticateToken, sitioSeguroController.createSitioSeguro);
router.get('/', sitioSeguroController.getSitioSeguros);
router.put('/:id', authenticateToken, sitioSeguroController.updateSitioSeguro);
router.delete('/:id', authenticateToken, sitioSeguroController.deleteSitioSeguro);
router.get('/total', authenticateToken, sitioSeguroController.getTotalSitioSeguros);

module.exports = router;