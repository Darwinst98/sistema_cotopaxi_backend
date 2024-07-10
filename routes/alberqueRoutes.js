const express = require('express');
const albergueController = require('../controller/albergueController');
const authenticateToken = require('../Middleware/authenticateToken');
const router = express.Router();

router.post('/register', authenticateToken, albergueController.createAlbergue);
router.get('/', authenticateToken, albergueController.getAlbergues);
router.put('/:id', authenticateToken, albergueController.updateAlbergue);
router.delete('/:id', authenticateToken, albergueController.deleteAlbergue);

module.exports = router;