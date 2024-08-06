const express = require('express');
const albergueController = require('../controller/albergueController');
const authenticateToken = require('../Middleware/authenticateToken');
const { esAdminGeneral } = require('../Middleware/authMiddleware');
const router = express.Router();

router.post('/register', esAdminGeneral, authenticateToken, albergueController.createAlbergue);
router.get('/', authenticateToken, albergueController.getAlbergues);
router.get('/movil', albergueController.getAlberguesMovil);
router.put('/:id', authenticateToken, albergueController.updateAlbergue);
router.delete('/:id', esAdminGeneral, authenticateToken, albergueController.deleteAlbergue);
router.get('/total', authenticateToken, albergueController.getTotalAlbergues);
router.get('/:id/qr', authenticateToken, albergueController.getAlbergueIdQR);
router.get('/:id', albergueController.getAlbergueQrView);
router.post('/:id/sumarse', albergueController.sumarCiudadanoAlbergueQR);

module.exports = router;