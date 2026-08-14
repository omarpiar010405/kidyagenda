import React, { useEffect, useState } from 'react';
import { crearEvento, actualizarEvento, eliminarEvento, getEvento } from '../api/api';

const PETICIONES_OPCIONES = ['Hielera', 'Microondas'];

const ESTADO_VACIO = {
  cliente: { nombre_completo: '', telefono: '' },
  id_cliente: null,
  nombre_festejado: '',
  tematica: '',
  fecha_evento: '',
  hora_inicio: '',
  hora_fin: '',
  numero_personas: '',
  total_costo: '',
  notas_pago: '',
  detalles_operativos: {
    decoracion_notas: '',
    peticiones: PETICIONES_OPCIONES.join(', '),
    actividades: '',
    comida_notas: '',
  },
  tareas: [
    { descripcion: 'Mobiliario para personas', completada: false },
    { descripcion: 'Arco de bienvenida', completada: false },
  ],
  extras: [
    { articulo: 'Mesas largas', cantidad: 2 },
    { articulo: 'Manteles', cantidad: 2 },
    { articulo: 'Mesas pequeñas', cantidad: 2 },
  ],
  pagos: [],
};

const fechaHoy = () => new Date().toISOString().slice(0, 10);

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'];

function calcularEstado(total, pagos) {
  const totalPagado = (pagos || []).reduce((s, p) => s + (Number(p.monto) || 0), 0);
  if (totalPagado <= 0) return 'pendiente';
  if (Number(total) > 0 && totalPagado >= Number(total)) return 'pagado';
  return 'parcial';
}

const ETIQUETAS_ESTADO = { pendiente: 'Pendiente', parcial: 'Pago parcial', pagado: 'Pagado' };
const etiquetaEstado = (estado) => ETIQUETAS_ESTADO[estado] || estado;

const formatMonto = (valor) =>
  (Number(valor) || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const crearTareaMobiliario = (numPersonas) =>
  `Mobiliario para ${numPersonas ? `${numPersonas} ` : ''}personas`;

// Divide la lista de peticiones (separada por comas) en opciones marcadas y el resto libre.
function dividirPeticiones(peticiones) {
  const partes = (peticiones || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const marcadas = PETICIONES_OPCIONES.filter((op) =>
    partes.some((p) => p.toLowerCase() === op.toLowerCase())
  );
  const resto = partes.filter(
    (p) => !PETICIONES_OPCIONES.some((op) => p.toLowerCase() === op.toLowerCase())
  );
  return { marcadas, resto: resto.join(', ') };
}

function construirPeticiones(marcadas, resto) {
  return [...marcadas, ...(resto.trim() ? [resto.trim()] : [])].join(', ');
}

export default function EventoModal({ fecha, eventoId, onCerrar, onGuardado }) {
  const [form, setForm] = useState(() => ({
    ...ESTADO_VACIO,
    fecha_evento: fecha,
    detalles_operativos: { ...ESTADO_VACIO.detalles_operativos },
    tareas: ESTADO_VACIO.tareas.map((t) => ({ ...t })),
    extras: ESTADO_VACIO.extras.map((e) => ({ ...e })),
    pagos: [],
  }));
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState('');
  const [nuevoExtra, setNuevoExtra] = useState({ articulo: '', cantidad: 1 });

  useEffect(() => {
    if (!eventoId) return;
    setCargando(true);
    getEvento(eventoId)
      .then((ev) => {
        setForm({
          id_cliente: ev.id_cliente,
          cliente: ev.Cliente || { nombre_completo: '', telefono: '' },
          nombre_festejado: ev.nombre_festejado || '',
          tematica: ev.tematica || '',
          fecha_evento: ev.fecha_evento,
          hora_inicio: ev.hora_inicio?.slice(0, 5) || '',
          hora_fin: ev.hora_fin?.slice(0, 5) || '',
          numero_personas: ev.numero_personas || '',
          total_costo: ev.total_costo || '',
          notas_pago: ev.notas_pago || '',
          detalles_operativos: ev.DetalleOperativo || ESTADO_VACIO.detalles_operativos,
          tareas: ev.TareaEventos || [],
          extras: ev.ExtraMobiliarios || [],
          pagos: ev.Pagos || [],
        });
      })
      .finally(() => setCargando(false));
  }, [eventoId]);

  const actualizarCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const actualizarCliente = (campo, valor) =>
    setForm((f) => ({ ...f, cliente: { ...f.cliente, [campo]: valor } }));
  const actualizarDetalle = (campo, valor) =>
    setForm((f) => ({ ...f, detalles_operativos: { ...f.detalles_operativos, [campo]: valor } }));

  // Al cambiar el numero de personas, actualiza la tarea por defecto de mobiliario
  // siempre que siga siendo la plantilla original (no fue editada manualmente).
  const actualizarNumeroPersonas = (valor) =>
    setForm((f) => {
      const tareas = f.tareas.map((t) => ({ ...t }));
      const idx = tareas.findIndex((t) => /^Mobiliario para/.test(t.descripcion));
      if (idx !== -1) tareas[idx].descripcion = crearTareaMobiliario(valor);
      return { ...f, numero_personas: valor, tareas };
    });

  const togglePeticion = (opcion) =>
    setForm((f) => {
      const { marcadas, resto } = dividirPeticiones(f.detalles_operativos.peticiones);
      const nuevas = marcadas.includes(opcion)
        ? marcadas.filter((x) => x !== opcion)
        : [...marcadas, opcion];
      return {
        ...f,
        detalles_operativos: {
          ...f.detalles_operativos,
          peticiones: construirPeticiones(nuevas, resto),
        },
      };
    });

  const actualizarPeticionExtra = (valor) =>
    setForm((f) => {
      const { marcadas } = dividirPeticiones(f.detalles_operativos.peticiones);
      return {
        ...f,
        detalles_operativos: {
          ...f.detalles_operativos,
          peticiones: construirPeticiones(marcadas, valor),
        },
      };
    });

  const agregarTarea = () => {
    if (!nuevaTarea.trim()) return;
    setForm((f) => ({ ...f, tareas: [...f.tareas, { descripcion: nuevaTarea, completada: false }] }));
    setNuevaTarea('');
  };

  const toggleTarea = (idx) => {
    setForm((f) => {
      const tareas = [...f.tareas];
      tareas[idx] = { ...tareas[idx], completada: !tareas[idx].completada };
      return { ...f, tareas };
    });
  };

  const quitarTarea = (idx) => {
    setForm((f) => ({ ...f, tareas: f.tareas.filter((_, i) => i !== idx) }));
  };

  const agregarExtra = () => {
    if (!nuevoExtra.articulo.trim()) return;
    setForm((f) => ({ ...f, extras: [...f.extras, nuevoExtra] }));
    setNuevoExtra({ articulo: '', cantidad: 1 });
  };

  const quitarExtra = (idx) => {
    setForm((f) => ({ ...f, extras: f.extras.filter((_, i) => i !== idx) }));
  };

  const agregarPago = () =>
    setForm((f) => ({
      ...f,
      pagos: [...f.pagos, { monto: '', fecha_pago: fechaHoy(), metodo_pago: METODOS_PAGO[0], notas: '' }],
    }));

  const actualizarPago = (idx, campo, valor) =>
    setForm((f) => {
      const pagos = f.pagos.map((p, i) => (i === idx ? { ...p, [campo]: valor } : p));
      return { ...f, pagos };
    });

  const quitarPago = (idx) =>
    setForm((f) => ({ ...f, pagos: f.pagos.filter((_, i) => i !== idx) }));

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (eventoId) {
        await actualizarEvento(eventoId, form);
      } else {
        await crearEvento(form);
      }
      onGuardado();
    } catch (err) {
      alert('Error al guardar el evento: ' + (err.response?.data?.error || err.message));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar este evento?')) return;
    await eliminarEvento(eventoId);
    onGuardado();
  };

  const totalPagado = form.pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const saldoPendiente = Math.max(0, (Number(form.total_costo) || 0) - totalPagado);
  const estadoCalculado = calcularEstado(form.total_costo, form.pagos);

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{eventoId ? 'Editar evento' : 'Nuevo evento'} — {form.fecha_evento}</h2>
          <button className="btn-cerrar" onClick={onCerrar}>✕</button>
        </div>

        {cargando ? (
          <p>Cargando…</p>
        ) : (
          <form onSubmit={handleGuardar} className="form-evento">
            <fieldset>
              <legend>Cliente</legend>
              <div className="fila">
                <input
                  placeholder="Nombre completo del cliente"
                  value={form.cliente.nombre_completo}
                  onChange={(e) => actualizarCliente('nombre_completo', e.target.value)}
                  required
                  disabled={!!form.id_cliente}
                />
                <input
                  placeholder="Teléfono"
                  value={form.cliente.telefono || ''}
                  onChange={(e) => actualizarCliente('telefono', e.target.value)}
                  disabled={!!form.id_cliente}
                />
              </div>
            </fieldset>

            <fieldset>
              <legend>Datos del evento</legend>
              <div className="fila">
                <input
                  placeholder="Nombre del festejado"
                  value={form.nombre_festejado}
                  onChange={(e) => actualizarCampo('nombre_festejado', e.target.value)}
                  required
                />
                <input
                  placeholder="Temática"
                  value={form.tematica}
                  onChange={(e) => actualizarCampo('tematica', e.target.value)}
                />
              </div>
              <div className="fila">
                <label>Fecha
                  <input
                    type="date"
                    value={form.fecha_evento}
                    onChange={(e) => actualizarCampo('fecha_evento', e.target.value)}
                    required
                  />
                </label>
                <label>Hora inicio
                  <input
                    type="time"
                    value={form.hora_inicio}
                    onChange={(e) => actualizarCampo('hora_inicio', e.target.value)}
                    required
                  />
                </label>
                <label>Hora fin
                  <input
                    type="time"
                    value={form.hora_fin}
                    onChange={(e) => actualizarCampo('hora_fin', e.target.value)}
                  />
                </label>
                <label># Personas
                  <input
                    type="number"
                    value={form.numero_personas}
                    onChange={(e) => actualizarNumeroPersonas(e.target.value)}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Pago</legend>
              <div className="fila">
                <label>Total
                  <input
                    type="number"
                    step="0.01"
                    value={form.total_costo}
                    onChange={(e) => actualizarCampo('total_costo', e.target.value)}
                  />
                </label>
                <div className="resumen-pago">
                  <span className={`badge estado-${estadoCalculado}`}>{etiquetaEstado(estadoCalculado)}</span>
                </div>
              </div>

              <label className="campo-etiqueta">Abonos</label>
              {form.pagos.map((pago, idx) => (
                <div key={idx} className="fila fila-abono">
                  <label>Fecha
                    <input
                      type="date"
                      value={pago.fecha_pago}
                      onChange={(e) => actualizarPago(idx, 'fecha_pago', e.target.value)}
                      required
                    />
                  </label>
                  <label>Monto
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={pago.monto}
                      onChange={(e) => actualizarPago(idx, 'monto', e.target.value)}
                      required
                    />
                  </label>
                  <label>Método
                    <select
                      value={pago.metodo_pago || METODOS_PAGO[0]}
                      onChange={(e) => actualizarPago(idx, 'metodo_pago', e.target.value)}
                    >
                      {METODOS_PAGO.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                  <button type="button" className="btn-quitar" onClick={() => quitarPago(idx)}>✕</button>
                </div>
              ))}
              {form.pagos.length === 0 && (
                <p className="sin-abonos">Aún no hay abonos registrados.</p>
              )}
              <button type="button" className="btn-secundario" onClick={agregarPago}>
                + Agregar abono
              </button>

              <div className="resumen-pagos">
                <div><span>Total pagado:</span> <strong>{formatMonto(totalPagado)}</strong></div>
                <div><span>Saldo pendiente:</span> <strong>{formatMonto(saldoPendiente)}</strong></div>
              </div>

              <label className="campo-etiqueta">Notas de pago</label>
              <textarea
                placeholder="Notas de pago"
                value={form.notas_pago}
                onChange={(e) => actualizarCampo('notas_pago', e.target.value)}
              />
            </fieldset>

            <fieldset>
              <legend>Detalles operativos</legend>
              <textarea
                placeholder="Decoración"
                value={form.detalles_operativos.decoracion_notas}
                onChange={(e) => actualizarDetalle('decoracion_notas', e.target.value)}
              />
              <div className="peticiones-opciones">
                {PETICIONES_OPCIONES.map((opcion) => {
                  const marcada = dividirPeticiones(form.detalles_operativos.peticiones).marcadas.includes(opcion);
                  return (
                    <label key={opcion} className={`casilla-peticion ${marcada ? 'activa' : ''}`}>
                      <input type="checkbox" checked={marcada} onChange={() => togglePeticion(opcion)} />
                      {opcion}
                    </label>
                  );
                })}
              </div>
              <textarea
                placeholder="Otras peticiones especiales"
                value={dividirPeticiones(form.detalles_operativos.peticiones).resto}
                onChange={(e) => actualizarPeticionExtra(e.target.value)}
              />
              <textarea
                placeholder="Actividades"
                value={form.detalles_operativos.actividades}
                onChange={(e) => actualizarDetalle('actividades', e.target.value)}
              />
              <textarea
                placeholder="Comida"
                value={form.detalles_operativos.comida_notas}
                onChange={(e) => actualizarDetalle('comida_notas', e.target.value)}
              />
            </fieldset>

            <fieldset>
              <legend>Tareas</legend>
              {form.tareas.map((t, idx) => (
                <div key={idx} className="fila-tarea">
                  <input type="checkbox" checked={!!t.completada} onChange={() => toggleTarea(idx)} />
                  <span className={t.completada ? 'tachado' : ''}>{t.descripcion}</span>
                  <button type="button" onClick={() => quitarTarea(idx)}>✕</button>
                </div>
              ))}
              <div className="fila">
                <input
                  placeholder="Nueva tarea"
                  value={nuevaTarea}
                  onChange={(e) => setNuevaTarea(e.target.value)}
                />
                <button type="button" onClick={agregarTarea}>Agregar</button>
              </div>
            </fieldset>

            <fieldset>
              <legend>Extras / Mobiliario</legend>
              {form.extras.map((ex, idx) => (
                <div key={idx} className="fila-tarea">
                  <span>{ex.articulo} (x{ex.cantidad})</span>
                  <button type="button" onClick={() => quitarExtra(idx)}>✕</button>
                </div>
              ))}
              <div className="fila">
                <input
                  placeholder="Artículo"
                  value={nuevoExtra.articulo}
                  onChange={(e) => setNuevoExtra((n) => ({ ...n, articulo: e.target.value }))}
                />
                <input
                  type="number"
                  min="1"
                  value={nuevoExtra.cantidad}
                  onChange={(e) => setNuevoExtra((n) => ({ ...n, cantidad: Number(e.target.value) }))}
                />
                <button type="button" onClick={agregarExtra}>Agregar</button>
              </div>
            </fieldset>

            <div className="modal-acciones">
              {eventoId && (
                <button type="button" className="btn-peligro" onClick={handleEliminar}>
                  Eliminar evento
                </button>
              )}
              <button type="submit" className="btn-primario" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
