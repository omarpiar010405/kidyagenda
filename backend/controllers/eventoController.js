const { Op } = require('sequelize');
const {
  Evento,
  Cliente,
  DetalleOperativo,
  TareaEvento,
  ExtraMobiliario,
  Pago,
} = require('../models');
const { notificarEvento } = require('../services/emailService');

const INCLUDES_COMPLETOS = [
  { model: Cliente },
  { model: DetalleOperativo },
  { model: TareaEvento },
  { model: ExtraMobiliario },
  { model: Pago, order: [['fecha_pago', 'ASC'], ['id_pago', 'ASC']] },
];

const fechaHoy = () => new Date().toISOString().slice(0, 10);

/**
 * Calcula el estado de pago a partir del total y la suma de abonos:
 * sin abonos -> pendiente; menos del total -> parcial; total cubierto -> pagado.
 */
function calcularEstadoPago(total, pagos) {
  const totalPagado = (pagos || []).reduce((sum, p) => sum + Number(p.monto || 0), 0);
  if (totalPagado <= 0) return 'pendiente';
  if (Number(total) > 0 && totalPagado >= Number(total)) return 'pagado';
  return 'parcial';
}

// GET /api/eventos?mes=8&anio=2026  -> eventos de un mes (para pintar el calendario)
exports.listarPorMes = async (req, res, next) => {
  try {
    const { mes, anio } = req.query;
    const where = {};

    if (mes && anio) {
      const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
      const fin = new Date(anio, mes, 0).toISOString().slice(0, 10); // ultimo dia del mes
      where.fecha_evento = { [Op.between]: [inicio, fin] };
    }

    const eventos = await Evento.findAll({
      where,
      include: [{ model: Cliente }],
      order: [['fecha_evento', 'ASC'], ['hora_inicio', 'ASC']],
    });
    res.json(eventos);
  } catch (err) {
    next(err);
  }
};

// GET /api/eventos/:id
exports.obtener = async (req, res, next) => {
  try {
    const evento = await Evento.findByPk(req.params.id, { include: INCLUDES_COMPLETOS });
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(evento);
  } catch (err) {
    next(err);
  }
};

// POST /api/eventos
// Body esperado: { cliente: {...} o id_cliente, datos del evento, detalles_operativos, tareas: [], extras: [] }
exports.crear = async (req, res, next) => {
  try {
    const {
      id_cliente,
      cliente, // { nombre_completo, telefono } - si no se manda id_cliente
      nombre_festejado,
      tematica,
      fecha_evento,
      hora_inicio,
      hora_fin,
      numero_personas,
      total_costo,
      notas_pago,
      detalles_operativos,
      tareas,
      extras,
      pagos,
    } = req.body;

    if (!fecha_evento || !hora_inicio || !nombre_festejado) {
      return res.status(400).json({
        error: 'fecha_evento, hora_inicio y nombre_festejado son requeridos',
      });
    }

    let idClienteFinal = id_cliente;
    if (!idClienteFinal && cliente?.nombre_completo) {
      const nuevoCliente = await Cliente.create({
        nombre_completo: cliente.nombre_completo,
        telefono: cliente.telefono,
      });
      idClienteFinal = nuevoCliente.id_cliente;
    }

    if (!idClienteFinal) {
      return res.status(400).json({ error: 'Se requiere id_cliente o datos del cliente' });
    }

    const nuevoEvento = await Evento.create({
      id_cliente: idClienteFinal,
      nombre_festejado,
      tematica,
      fecha_evento,
      hora_inicio,
      hora_fin,
      numero_personas,
      total_costo,
      estado_pago: 'pendiente',
      notas_pago,
    });

    if (detalles_operativos) {
      await DetalleOperativo.create({
        id_evento: nuevoEvento.id_evento,
        ...detalles_operativos,
      });
    }

    if (Array.isArray(tareas) && tareas.length) {
      await TareaEvento.bulkCreate(
        tareas.map((t) => ({ id_evento: nuevoEvento.id_evento, descripcion: t.descripcion, completada: !!t.completada }))
      );
    }

    if (Array.isArray(extras) && extras.length) {
      await ExtraMobiliario.bulkCreate(
        extras.map((e) => ({ id_evento: nuevoEvento.id_evento, articulo: e.articulo, cantidad: e.cantidad || 1 }))
      );
    }

    if (Array.isArray(pagos) && pagos.length) {
      await Pago.bulkCreate(
        pagos.map((p) => ({
          id_evento: nuevoEvento.id_evento,
          monto: p.monto,
          fecha_pago: p.fecha_pago || fechaHoy(),
          metodo_pago: p.metodo_pago,
          notas: p.notas,
        }))
      );
    }

    // Estado de pago automatico segun la suma de abonos.
    const estadoCalculado = calcularEstadoPago(total_costo, pagos);
    if (estadoCalculado !== 'pendiente') {
      await nuevoEvento.update({ estado_pago: estadoCalculado });
    }

    const eventoCompleto = await Evento.findByPk(nuevoEvento.id_evento, { include: INCLUDES_COMPLETOS });

    // Envio de correo de forma asincrona: no bloquea la respuesta al cliente.
    notificarEvento(eventoCompleto, 'creado');

    res.status(201).json(eventoCompleto);
  } catch (err) {
    next(err);
  }
};

// PUT /api/eventos/:id
exports.actualizar = async (req, res, next) => {
  try {
    const evento = await Evento.findByPk(req.params.id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    const {
      detalles_operativos,
      tareas,
      extras,
      pagos,
      estado_pago: _ignorado, // el estado siempre se recalcula solo
      anticipo: _anticipo, // campo eliminado, se ignora por compatibilidad
      ...datosEvento
    } = req.body;

    await evento.update(datosEvento);

    if (detalles_operativos) {
      const [detalle] = await DetalleOperativo.findOrCreate({
        where: { id_evento: evento.id_evento },
        defaults: { id_evento: evento.id_evento },
      });
      await detalle.update(detalles_operativos);
    }

    // Para tareas y extras: reemplazo simple de la lista (borra y vuelve a crear).
    if (Array.isArray(tareas)) {
      await TareaEvento.destroy({ where: { id_evento: evento.id_evento } });
      if (tareas.length) {
        await TareaEvento.bulkCreate(
          tareas.map((t) => ({ id_evento: evento.id_evento, descripcion: t.descripcion, completada: !!t.completada }))
        );
      }
    }

    if (Array.isArray(extras)) {
      await ExtraMobiliario.destroy({ where: { id_evento: evento.id_evento } });
      if (extras.length) {
        await ExtraMobiliario.bulkCreate(
          extras.map((e) => ({ id_evento: evento.id_evento, articulo: e.articulo, cantidad: e.cantidad || 1 }))
        );
      }
    }

    // Abonos: reemplazo simple de la lista (borra y vuelve a crear).
    if (Array.isArray(pagos)) {
      await Pago.destroy({ where: { id_evento: evento.id_evento } });
      if (pagos.length) {
        await Pago.bulkCreate(
          pagos.map((p) => ({
            id_evento: evento.id_evento,
            monto: p.monto,
            fecha_pago: p.fecha_pago || fechaHoy(),
            metodo_pago: p.metodo_pago,
            notas: p.notas,
          }))
        );
      }
    }

    // Estado de pago automatico segun la suma de abonos.
    await evento.update({ estado_pago: calcularEstadoPago(datosEvento.total_costo ?? evento.total_costo, pagos) });

    const eventoActualizado = await Evento.findByPk(evento.id_evento, { include: INCLUDES_COMPLETOS });

    notificarEvento(eventoActualizado, 'actualizado');

    res.json(eventoActualizado);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/eventos/:id
exports.eliminar = async (req, res, next) => {
  try {
    const evento = await Evento.findByPk(req.params.id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
    await evento.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
