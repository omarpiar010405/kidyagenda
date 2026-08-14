const express = require('express');
const router = express.Router();
const controller = require('../controllers/eventoController');
const tareaController = require('../controllers/tareaController');
const extraController = require('../controllers/extraController');

router.get('/', controller.listarPorMes); // soporta ?mes=&anio=
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

// Sub-recursos anidados
router.get('/:idEvento/tareas', tareaController.listarPorEvento);
router.post('/:idEvento/tareas', tareaController.crear);

router.get('/:idEvento/extras', extraController.listarPorEvento);
router.post('/:idEvento/extras', extraController.crear);

module.exports = router;
