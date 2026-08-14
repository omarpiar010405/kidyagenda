import React from 'react';

const ETIQUETAS_ESTADO = { pendiente: 'Pendiente', parcial: 'Parcial', pagado: 'Pagado' };

export default function PanelDia({ fecha, eventos, onSeleccionarEvento, onNuevoEvento, onCerrar }) {
  if (!fecha) return null;

  return (
    <div className="panel-dia">
      <div className="panel-dia-header">
        <h3>{fecha}</h3>
        <button onClick={onCerrar}>✕</button>
      </div>

      {eventos.length === 0 && <p>No hay eventos este día.</p>}

      <ul className="lista-eventos-dia">
        {eventos.map((ev) => (
          <li key={ev.id_evento} onClick={() => onSeleccionarEvento(ev.id_evento)}>
            <strong>{ev.hora_inicio?.slice(0, 5)}</strong> — {ev.nombre_festejado}
            <span className={`badge estado-${ev.estado_pago}`}>{ETIQUETAS_ESTADO[ev.estado_pago] || ev.estado_pago}</span>
          </li>
        ))}
      </ul>

      <button className="btn-primario" onClick={onNuevoEvento}>+ Nuevo evento este día</button>
    </div>
  );
}
