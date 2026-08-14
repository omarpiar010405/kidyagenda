const sgMail = require('@sendgrid/mail');
const { ConfigEmail } = require('../models');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Escapa caracteres especiales para evitar romper el HTML del correo.
 */
function escapeHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formatea un monto numerico como moneda mexicana.
 */
function formatearMoneda(valor) {
  const num = Number(valor);
  if (Number.isNaN(num)) return '$0.00';
  return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

const COLOR_ESTADO = {
  pendiente: '#ef4444',
  parcial: '#f59e0b',
  pagado: '#10b981',
};

function etiquetaEstado(estado) {
  const mapa = { pendiente: 'Pendiente', parcial: 'Pago parcial', pagado: 'Pagado' };
  return mapa[estado] || estado || '—';
}

/**
 * Construye el HTML del correo de notificacion.
 */
function buildEventoEmailHtml(evento, tipo) {
  const esCreado = tipo === 'creado';
  const titulo = esCreado ? 'Nuevo evento registrado' : 'Evento actualizado';
  const colorAccion = esCreado ? '#4f46e5' : '#f59e0b';

  const pagos = evento.Pagos || [];
  const totalPagado = pagos.reduce((sum, p) => sum + Number(p.monto || 0), 0);
  const saldo = Math.max(0, Number(evento.total_costo || 0) - totalPagado);

  const filasDetalle = [
    ['Festejado', escapeHtml(evento.nombre_festejado)],
    ['Temática', escapeHtml(evento.tematica || '—')],
    ['Fecha', escapeHtml(evento.fecha_evento)],
    ['Horario', `${escapeHtml(evento.hora_inicio)} - ${escapeHtml(evento.hora_fin || '—')}`],
    ['Número de personas', escapeHtml(evento.numero_personas || '—')],
    ['Total', formatearMoneda(evento.total_costo)],
    ['Total pagado', formatearMoneda(totalPagado)],
    ['Saldo pendiente', formatearMoneda(saldo)],
  ];

  const filasDetalleHtml = filasDetalle
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:8px 12px;font-size:13px;color:#6b7280;width:45%;background:#f9fafb;border-bottom:1px solid #eef0f4;vertical-align:top;">${k}</td>
        <td style="padding:8px 12px;font-size:14px;color:#111827;border-bottom:1px solid #eef0f4;vertical-align:top;"><strong>${v}</strong></td>
      </tr>`
    )
    .join('');

  const tareas = (evento.TareaEventos || []);
  const tareasHtml = tareas.length
    ? `
      <tr>
        <td style="padding:8px 12px;font-size:13px;color:#6b7280;width:45%;background:#f9fafb;border-bottom:1px solid #eef0f4;vertical-align:top;">Tareas</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#111827;">
          ${tareas
            .map(
              (t) => `
            <div style="padding:2px 0;${t.completada ? 'color:#9ca3af;text-decoration:line-through;' : ''}">
              ${t.completada ? '✔' : '○'} ${escapeHtml(t.descripcion)}
            </div>`
            )
            .join('')}
        </td>
      </tr>`
    : '';

  const extras = (evento.ExtraMobiliarios || []);
  const extrasHtml = extras.length
    ? `
      <tr>
        <td style="padding:8px 12px;font-size:13px;color:#6b7280;width:45%;background:#f9fafb;border-bottom:1px solid #eef0f4;vertical-align:top;">Extras / mobiliario</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#111827;">
          ${extras
            .map((x) => `<div style="padding:2px 0;">${escapeHtml(x.articulo)} <span style="color:#6b7280;">(x${escapeHtml(x.cantidad)})</span></div>`)
            .join('')}
        </td>
      </tr>`
    : '';

  const detalle = evento.DetalleOperativo || {};
  const notas = [
    ['Decoración', detalle.decoracion_notas],
    ['Peticiones especiales', detalle.peticiones],
    ['Actividades', detalle.actividades],
    ['Comida', detalle.comida_notas],
  ].filter(([, v]) => v);

  const notasHtml = notas.length
    ? `
      <tr>
        <td style="padding:8px 12px;font-size:13px;color:#6b7280;width:45%;background:#f9fafb;border-bottom:1px solid #eef0f4;vertical-align:top;">Detalles operativos</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#111827;">
          ${notas
            .map(([k, v]) => `<div style="padding:2px 0;"><strong style="color:#4b5563;">${escapeHtml(k)}:</strong> ${escapeHtml(v)}</div>`)
            .join('')}
        </td>
      </tr>`
    : '';

  const notasPago = escapeHtml(evento.notas_pago || '');
  const notasPagoHtml = notasPago
    ? `
      <tr>
        <td style="padding:8px 12px;font-size:13px;color:#6b7280;width:45%;background:#f9fafb;border-bottom:1px solid #eef0f4;vertical-align:top;">Notas de pago</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#111827;">${notasPago}</td>
      </tr>`
    : '';

  const cliente = evento.Cliente || {};
  const clienteHtml =
    cliente.nombre_completo || cliente.telefono
      ? `
      <tr>
        <td style="padding:8px 12px;font-size:13px;color:#6b7280;width:45%;background:#f9fafb;border-bottom:1px solid #eef0f4;vertical-align:top;">Cliente</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#111827;">
          ${escapeHtml(cliente.nombre_completo || '—')}
          ${cliente.telefono ? `<div style="color:#6b7280;font-size:12px;">${escapeHtml(cliente.telefono)}</div>` : ''}
        </td>
      </tr>`
      : '';

  const pagosHtml = pagos.length
    ? `
      <tr>
        <td style="padding:8px 12px;font-size:13px;color:#6b7280;width:45%;background:#f9fafb;border-bottom:1px solid #eef0f4;vertical-align:top;">Abonos</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#111827;">
          <table style="width:100%;border-collapse:collapse;">
            <tr style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;">
              <td style="padding:2px 4px;">Fecha</td>
              <td style="padding:2px 4px;">Método</td>
              <td style="padding:2px 4px;text-align:right;">Monto</td>
            </tr>
            ${pagos
              .map(
                (p) => `
              <tr>
                <td style="padding:3px 4px;">${escapeHtml(p.fecha_pago)}</td>
                <td style="padding:3px 4px;color:#6b7280;">${escapeHtml(p.metodo_pago || '—')}</td>
                <td style="padding:3px 4px;text-align:right;"><strong>${formatearMoneda(p.monto)}</strong></td>
              </tr>`
              )
              .join('')}
          </table>
        </td>
      </tr>`
    : '';

  return `
  <div style="background:#f4f5f7;padding:24px 12px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <!-- Encabezado -->
      <div style="background:${colorAccion};padding:20px 24px;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.85);font-weight:600;">KidyAgenda · KidyEventos</div>
        <h1 style="margin:4px 0 0;font-size:20px;color:#ffffff;">${titulo}</h1>
      </div>

      <div style="padding:24px;">
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">
          Se ha ${esCreado ? 'creado un nuevo evento' : 'actualizado el evento'} con los siguientes datos:
        </p>

        <!-- Estado de pago -->
        <div style="text-align:center;margin-bottom:18px;">
          <span style="display:inline-block;background:${COLOR_ESTADO[evento.estado_pago] || '#6b7280'};color:#ffffff;font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">
            ${etiquetaEstado(evento.estado_pago)}
          </span>
        </div>

        <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #eef0f4;">
          ${clienteHtml}
          ${filasDetalleHtml}
          ${notasPagoHtml}
          ${pagosHtml}
          ${tareasHtml}
          ${extrasHtml}
          ${notasHtml}
        </table>

        <!-- Pie -->
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #eef0f4;">
          <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">Notificación automática del sistema de gestión de eventos.</p>
          <p style="margin:0;font-size:12px;color:#9ca3af;">No responder a este correo.</p>
        </div>
      </div>
    </div>
  </div>
  `;
}

/**
 * Envia notificacion por correo a todas las direcciones activas configuradas.
 * Se ejecuta de forma asincrona / "fire and forget": nunca bloquea ni
 * revienta la respuesta HTTP del endpoint que la invoca.
 */
async function notificarEvento(evento, tipo = 'creado') {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('[emailService] SENDGRID_API_KEY no configurada. Se omite el envio de correo.');
      return;
    }

    const destinatarios = await ConfigEmail.findAll({ where: { activo: true } });
    if (!destinatarios.length) {
      console.warn('[emailService] No hay direcciones de notificacion configuradas.');
      return;
    }

    const msg = {
      to: destinatarios.map((d) => d.email),
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Evento ${tipo}: ${evento.nombre_festejado} (${evento.fecha_evento})`,
      html: buildEventoEmailHtml(evento, tipo),
    };

    await sgMail.send(msg);
    console.log(`[emailService] Notificacion enviada (${tipo}) a ${destinatarios.length} destinatario(s).`);
  } catch (error) {
    // No relanzamos el error: un fallo de correo no debe tumbar la operacion principal.
    console.error('[emailService] Error enviando correo:', error?.response?.body || error.message);
  }
}

module.exports = { notificarEvento };
