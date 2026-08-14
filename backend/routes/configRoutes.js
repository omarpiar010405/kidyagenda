const express = require('express');
const router = express.Router();
const controller = require('../controllers/configController');

router.get('/emails', controller.listar);
router.post('/emails', controller.crear);
router.put('/emails/:id', controller.actualizar);
router.delete('/emails/:id', controller.eliminar);

module.exports = router;
