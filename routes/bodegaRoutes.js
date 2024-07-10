const express = require('express');
const bodegaController = require('../controller/bodegaController');
const authenticateToken = require('../Middleware/authenticateToken');
const router = express.Router();

router.post('/register', authenticateToken, bodegaController.createBodega);
router.get('/', authenticateToken, bodegaController.getBodegas);
router.get('/:id', authenticateToken, bodegaController.getBodegaById);
router.put('/:id', authenticateToken, bodegaController.updateBodega);
router.delete('/:id', authenticateToken, bodegaController.deleteBodega);
router.get('/:id/bodegas', authenticateToken, bodegaController.getBodegasAlBergue);

module.exports = router;