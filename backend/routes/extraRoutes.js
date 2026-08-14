const express = require('express');
const router = express.Router();
const controller = require('../controllers/extraController');

router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router;
