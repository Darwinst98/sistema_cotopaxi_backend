const express = require('express');
const dominicioController = require('../controller/domicilioController');
const authenticateToken = require('../Middleware/authenticateToken');
const router = express.Router();

router.post('/register', authenticateToken, dominicioController.createDomicilio);
router.get('/',  dominicioController.getDomicilios);
router.put('/:id', authenticateToken, dominicioController.updateDomicilio);
router.delete('/:id', authenticateToken, dominicioController.deleteDomicilio);

module.exports = router;