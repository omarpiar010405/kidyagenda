# KidyAgenda · KidyEventos

Sistema de gestión de eventos para **KidyLand** (empresa organizadora de eventos).

- **Frontend:** React (calendario mensual, modal de eventos, página de configuración)
- **Backend:** Node.js + Express (API REST)
- **ORM:** Sequelize
- **Base de datos:** MySQL (Clever Cloud)
- **Correos:** SendGrid (envío asíncrono al crear/editar eventos)

Ver `TUTORIAL_DESPLIEGUE.md` para instrucciones completas de instalación local y despliegue en Render.

## Estructura

```
proyecto-eventos/
├── backend/
│   ├── config/database.js
│   ├── models/            (Cliente, Evento, DetalleOperativo, TareaEvento, ExtraMobiliario, ConfigEmail)
│   ├── controllers/
│   ├── routes/
│   ├── services/emailService.js
│   ├── middlewares/errorHandler.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/api.js
    │   ├── components/ (CalendarioMensual, EventoModal, PanelDia)
    │   ├── pages/ (CalendarioPage, Configuracion)
    │   ├── App.js
    │   └── index.js
    └── package.json
```
