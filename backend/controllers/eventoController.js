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
const cache = require('../services/cacheService');

const INCLUDES_COMPLETOS = [
  { model: Cliente },
  { model: DetalleOperativo },
  { model: TareaEvento },
  { model: ExtraMobiliario },
  { model: Pago, order: [['fecha_pago', 'ASC'], ['id_pago', 'ASC']] },
];

const fechaHoy = () => new Date().toISOString().slice(0, 10);

// Prefijos de caché relacionados con eventos.
const PREFIJO_EVENTOS = 'eventos:';
const PREFIJO_CLIENTES = 'clientes';
const claveMes = (mes, anio) => `${PREFIJO_EVENTOS}mes:${mes}-${anio}`;
const claveEvento = (id) => `${PREFIJO_EVENTOS}id:${id}`;

// Invalida todo lo que dependa de los eventos (listados por mes y por id).
const invalidarEventos = () => cache.invalidar(PREFIJO_EVENTOS);

const fmtMonto = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return '';
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
};

const txt = (v) => String(v ?? '').trim();

const ETIQUETA_ESTADO = { pendiente: 'Pendiente', parcial: 'Pago parcial', pagado: 'Pagado' };

const sumarPagos = (pagos) => (pagos || []).reduce((s, p) => s + Number(p.monto || 0), 0);

/**
 * Compara el evento antes y despues de una edicion y devuelve una lista de
 * { etiqueta, anterior, nuevo } con los campos que cambiaron, para marcarlos en el correo.
 */
function compararEventos(anterior, actual) {
  const cambios = [];

  const escalares = [
    ['nombre_festejado', 'Festejado'],
    ['tematica', 'Temática'],
    ['fecha_evento', 'Fecha'],
    ['hora_inicio', 'Hora inicio'],
    ['hora_fin', 'Hora fin'],
    ['numero_personas', 'Número de personas'],
    ['total_costo', 'Total'],
    ['notas_pago', 'Notas de pago'],
  ];

  for (const [campo, etiqueta] of escalares) {
    const a = txt(anterior?.[campo]);
    const n = txt(actual?.[campo]);
    if (a !== n) {
      cambios.push({ etiqueta, anterior: a, nuevo: n });
    }
  }

  const estadoA = anterior?.estado_pago;
  const estadoN = actual?.estado_pago;
  if (estadoA !== estadoN) {
    cambios.push({
      etiqueta: 'Estado de pago',
      anterior: ETIQUETA_ESTADO[estadoA] || estadoA,
      nuevo: ETIQUETA_ESTADO[estadoN] || estadoN,
    });
  }

  const pagosA = anterior?.Pagos || [];
  const pagosN = actual?.Pagos || [];
  if (sumarPagos(pagosA) !== sumarPagos(pagosN) || pagosA.length !== pagosN.length) {
    cambios.push({
      etiqueta: 'Abonos',
      anterior: `${pagosA.length} abono(s) · ${fmtMonto(sumarPagos(pagosA))}`,
      nuevo: `${pagosN.length} abono(s) · ${fmtMonto(sumarPagos(pagosN))}`,
    });
  }

  const tareasA = anterior?.TareaEventos || [];
  const tareasN = actual?.TareaEventos || [];
  const textoTareas = (lista) =>
    (lista || [])
      .map((t) => t.descripcion)
      .sort()
      .join(';');
  if (textoTareas(tareasA) !== textoTareas(tareasN)) {
    cambios.push({
      etiqueta: 'Tareas',
      anterior: `${tareasA.length} tarea(s)`,
      nuevo: `${tareasN.length} tarea(s)`,
    });
  }

  const extrasA = anterior?.ExtraMobiliarios || [];
  const extrasN = actual?.ExtraMobiliarios || [];
  if (extrasA.length !== extrasN.length) {
    cambios.push({
      etiqueta: 'Extras / mobiliario',
      anterior: `${extrasA.length}`,
      nuevo: `${extrasN.length}`,
    });
  }

  const detA = anterior?.DetalleOperativo || {};
  const detN = actual?.DetalleOperativo || {};
  const notasOper = [
    ['decoracion_notas', 'Decoración'],
    ['peticiones', 'Peticiones'],
    ['actividades', 'Actividades'],
    ['comida_notas', 'Comida'],
  ];
  for (const [campo, etiqueta] of notasOper) {
    const a = txt(detA[campo]);
    const n = txt(detN[campo]);
    if (a !== n) cambios.push({ etiqueta, anterior: a, nuevo: n });
  }

  const firmaProveedores = (provs) =>
    (provs || [])
      .map((p) =>
        `${p.tipo || ''}|${p.negocio || ''}|${p.proveedor || ''}|${p.telefono || ''}|${p.hora_llegada || ''}|${p.notas || ''}`
      )
      .join(';');
  if (firmaProveedores(detA.proveedores) !== firmaProveedores(detN.proveedores)) {
    cambios.push({
      etiqueta: 'Proveedores',
      anterior: `${(detA.proveedores || []).length} proveedor(es)`,
      nuevo: `${(detN.proveedores || []).length} proveedor(es)`,
    });
  }

  const firmaEmpleados = (emps) =>
    (emps || []).map((e) => `${e.nombre || ''}|${e.hora_llegada || ''}`).join(';');
  if (firmaEmpleados(detA.empleados) !== firmaEmpleados(detN.empleados)) {
    cambios.push({
      etiqueta: 'Empleados',
      anterior: `${(detA.empleados || []).length} empleado(s)`,
      nuevo: `${(detN.empleados || []).length} empleado(s)`,
    });
  }

  const cliA = anterior?.Cliente || {};
  const cliN = actual?.Cliente || {};
  if (txt(cliA.nombre_completo) !== txt(cliN.nombre_completo) || txt(cliA.telefono) !== txt(cliN.telefono)) {
    cambios.push({
      etiqueta: 'Cliente',
      anterior: txt(cliA.nombre_completo) || '—',
      nuevo: txt(cliN.nombre_completo) || '—',
    });
  }

  return cambios;
}

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
    const clave = mes && anio ? claveMes(mes, anio) : `${PREFIJO_EVENTOS}mes:all`;
    const enCache = cache.obtener(clave);
    if (enCache !== undefined) return res.json(enCache);

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
    const datos = eventos.map((e) => e.toJSON());
    cache.guardar(clave, datos);
    res.json(datos);
  } catch (err) {
    next(err);
  }
};

// GET /api/eventos/:id
exports.obtener = async (req, res, next) => {
  try {
    const clave = claveEvento(req.params.id);
    const enCache = cache.obtener(clave);
    if (enCache !== undefined) return res.json(enCache);

    const evento = await Evento.findByPk(req.params.id, { include: INCLUDES_COMPLETOS });
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
    const datos = evento.toJSON();
    cache.guardar(clave, datos);
    res.json(datos);
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
        tareas.map((t) => ({ id_evento: nuevoEvento.id_evento, descripcion: t.descripcion }))
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

    invalidarEventos();
    cache.invalidar(PREFIJO_CLIENTES);

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

    // Snapshot del evento ANTES de la edicion (para marcar los cambios en el correo).
    const eventoAnterior = await Evento.findByPk(req.params.id, { include: INCLUDES_COMPLETOS });

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
          tareas.map((t) => ({ id_evento: evento.id_evento, descripcion: t.descripcion }))
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

    const cambios = compararEventos(eventoAnterior, eventoActualizado);
    notificarEvento(eventoActualizado, 'actualizado', cambios);

    invalidarEventos();

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
    invalidarEventos();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
