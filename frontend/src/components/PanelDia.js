import React from 'react';

const ETIQUETAS_ESTADO = { pendiente: 'Pendiente', parcial: 'Parcial', pagado: 'Pagado' };

const formatearHorario = (ev) => {
  const inicio = ev.hora_inicio?.slice(0, 5);
  const fin = ev.hora_fin?.slice(0, 5);
  return fin ? `${inicio} - ${fin}` : inicio || '—';
};

export default function PanelDia({ fecha, eventos, onSeleccionarEvento, onNuevoEvento, onCerrar }) {
  if (!fecha) return null;

  const sinEventos = eventos.length === 0;

  return (
    <div className="panel-dia">
      <div className="panel-dia-header">
        <h3>{fecha}</h3>
        <button onClick={onCerrar}>✕</button>
      </div>

      {sinEventos ? (
        <>
          <button className="btn-primario btn-nuevo-evento" onClick={onNuevoEvento}>+ Nuevo evento este día</button>
          <p>No hay eventos este día.</p>
        </>
      ) : (
        <ul className="lista-eventos-dia">
          {eventos.map((ev) => (
            <li key={ev.id_evento} className="tarjeta-evento-resumen" onClick={() => onSeleccionarEvento(ev.id_evento)}>
              <div className="tarjeta-festejado">
                <strong>{ev.nombre_festejado}</strong>
                <span className={`badge estado-${ev.estado_pago}`}>{ETIQUETAS_ESTADO[ev.estado_pago] || ev.estado_pago}</span>
              </div>
              <div className="tarjeta-datos">
                <span>🕐 {formatearHorario(ev)}</span>
                <span>👥 {ev.numero_personas || '—'} personas</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}