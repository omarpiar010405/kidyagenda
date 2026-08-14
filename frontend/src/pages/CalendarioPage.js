import React, { useEffect, useState, useCallback } from 'react';
import CalendarioMensual from '../components/CalendarioMensual';
import PanelDia from '../components/PanelDia';
import EventoModal from '../components/EventoModal';
import { getEventosPorMes } from '../api/api';

export default function CalendarioPage() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [eventosPorDia, setEventosPorDia] = useState({});
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [eventosDelDia, setEventosDelDia] = useState([]);
  const [modal, setModal] = useState(null); // { fecha, eventoId } | null

  const cargarEventos = useCallback(() => {
    getEventosPorMes(mes, anio).then((eventos) => {
      const agrupados = {};
      eventos.forEach((ev) => {
        const fecha = ev.fecha_evento;
        if (!agrupados[fecha]) agrupados[fecha] = [];
        agrupados[fecha].push(ev);
      });
      setEventosPorDia(agrupados);
    });
  }, [mes, anio]);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  const cambiarMes = (delta) => {
    let nuevoMes = mes + delta;
    let nuevoAnio = anio;
    if (nuevoMes > 12) { nuevoMes = 1; nuevoAnio++; }
    if (nuevoMes < 1) { nuevoMes = 12; nuevoAnio--; }
    setMes(nuevoMes);
    setAnio(nuevoAnio);
    setDiaSeleccionado(null);
  };

  const seleccionarDia = (fecha, eventos) => {
    setDiaSeleccionado(fecha);
    setEventosDelDia(eventos);
  };

  const cerrarModalYRecargar = () => {
    setModal(null);
    cargarEventos();
    setDiaSeleccionado(null);
  };

  return (
    <div className="pagina-calendario">
      <CalendarioMensual
        mes={mes}
        anio={anio}
        eventosPorDia={eventosPorDia}
        onCambiarMes={cambiarMes}
        onSeleccionarDia={seleccionarDia}
      />

      {diaSeleccionado && (
        <PanelDia
          fecha={diaSeleccionado}
          eventos={eventosDelDia}
          onSeleccionarEvento={(id) => setModal({ fecha: diaSeleccionado, eventoId: id })}
          onNuevoEvento={() => setModal({ fecha: diaSeleccionado, eventoId: null })}
          onCerrar={() => setDiaSeleccionado(null)}
        />
      )}

      {modal && (
        <EventoModal
          fecha={modal.fecha}
          eventoId={modal.eventoId}
          onCerrar={() => setModal(null)}
          onGuardado={cerrarModalYRecargar}
        />
      )}
    </div>
  );
}
