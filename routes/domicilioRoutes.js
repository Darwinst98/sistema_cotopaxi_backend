const express = require('express');
const dominicioController = require('../controller/domicilioController');
const authenticateToken = require('../Middleware/authenticateToken');
const { esAdminGeneral } = require('../Middleware/authMiddleware');
const router = express.Router();

router.post('/register', esAdminGeneral, authenticateToken, dominicioController.createDomicilio);
router.get('/',  dominicioController.getDomicilios);
router.put('/:id', esAdminGeneral, authenticateToken, dominicioController.updateDomicilio);
router.delete('/:id', esAdminGeneral, authenticateToken, dominicioController.deleteDomicilio);


module.exports = router;