const express = require('express');
const productoController = require('../controller/productoController');
const authenticateToken = require('../Middleware/authenticateToken');
const router = express.Router();

router.post('/register', authenticateToken, productoController.createProducto);
router.get('/', authenticateToken, productoController.getProductos);
router.get('/:id', authenticateToken, productoController.getProductoById);
router.put('/:id', authenticateToken, productoController.updateProducto);
router.delete('/:id', authenticateToken, productoController.deleteProducto);
router.post('/transferirProducto', authenticateToken, productoController.transferirProductos);
router.post('/actualizarProductoPorQR', authenticateToken, productoController.actualizarProductoPorQR);
module.exports = router;