import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import CalendarioPage from './pages/CalendarioPage';
import Configuracion from './pages/Configuracion';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <header className="app-header">
          <h1>🎪 KidyAgenda <span className="marca-tag">KidyEventos</span></h1>
          <nav className="nav-escritorio">
            <NavLink to="/" end>Calendario</NavLink>
            <NavLink to="/configuracion">Configuración</NavLink>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<CalendarioPage />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Routes>
        </main>

        <nav className="nav-movil">
          <NavLink to="/" end>
            <span className="nav-movil-icono">📅</span>
            <span>Calendario</span>
          </NavLink>
          <NavLink to="/configuracion">
            <span className="nav-movil-icono">⚙️</span>
            <span>Configuración</span>
          </NavLink>
        </nav>
      </div>
    </BrowserRouter>
  );
}
