import React, { useMemo } from 'react';

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatearFecha(anio, mes, dia) {
  const mm = String(mes).padStart(2, '0');
  const dd = String(dia).padStart(2, '0');
  return `${anio}-${mm}-${dd}`;
}

/**
 * Calendario mensual simple. mes es 1-12.
 * eventosPorDia: { 'YYYY-MM-DD': [evento, evento, ...] }
 */
export default function CalendarioMensual({ mes, anio, eventosPorDia, onCambiarMes, onSeleccionarDia }) {
  const celdas = useMemo(() => {
    const primerDiaSemana = new Date(anio, mes - 1, 1).getDay(); // 0=Dom
    const diasEnMes = new Date(anio, mes, 0).getDate();
    const total = [];

    for (let i = 0; i < primerDiaSemana; i++) total.push(null);
    for (let d = 1; d <= diasEnMes; d++) total.push(d);

    return total;
  }, [mes, anio]);

  const hoy = new Date();
  const esHoy = (dia) =>
    dia && hoy.getFullYear() === anio && hoy.getMonth() + 1 === mes && hoy.getDate() === dia;

  const totalEventosMes = Object.values(eventosPorDia || {}).reduce(
    (sum, lista) => sum + (Array.isArray(lista) ? lista.length : 0),
    0
  );

  return (
    <div className="calendario">
      <div className="calendario-header">
        <button onClick={() => onCambiarMes(-1)}>‹</button>
        <div className="calendario-titulo-mes">
          <h2>{MESES[mes - 1]} {anio}</h2>
          <span className="contador-mes">
            <strong>{totalEventosMes}</strong> {totalEventosMes === 1 ? 'evento' : 'eventos'} este mes
          </span>
        </div>
        <button onClick={() => onCambiarMes(1)}>›</button>
      </div>

      <div className="calendario-grid calendario-dias-semana">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="calendario-dia-nombre">{d}</div>
        ))}
      </div>

      <div className="calendario-grid">
        {celdas.map((dia, idx) => {
          if (!dia) return <div key={`vacio-${idx}`} className="calendario-celda vacia" />;

          const fecha = formatearFecha(anio, mes, dia);
          const eventosDelDia = eventosPorDia[fecha] || [];

          return (
            <div
              key={fecha}
              className={`calendario-celda ${esHoy(dia) ? 'hoy' : ''} ${eventosDelDia.length ? 'con-eventos' : ''}`}
              onClick={() => onSeleccionarDia(fecha, eventosDelDia)}
            >
              <span className="calendario-numero">{dia}</span>
              <div className="calendario-eventos-preview">
                {eventosDelDia.slice(0, 2).map((ev) => (
                  <div key={ev.id_evento} className="calendario-evento-chip" title={ev.nombre_festejado}>
                    {ev.hora_inicio?.slice(0, 5)} {ev.nombre_festejado}
                  </div>
                ))}
                {eventosDelDia.length > 2 && (
                  <div className="calendario-evento-chip mas">+{eventosDelDia.length - 2} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
