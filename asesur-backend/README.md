# Asesur Backend - Sistema de Gestión de Pólizas

Backend completo para el sistema de gestión de seguros de Grupo Asesur.

## 📋 Características

- **Autenticación JWT** con Supabase Auth
- **Gestión de Clientes** (CRUD completo)
- **Gestión de Pólizas** (CRUD + Estados automáticos)
- **Dashboard** con métricas en tiempo real
- **Notificaciones automáticas** por email
- **Renovaciones** - Seguimiento de pólizas por vencer
- **Buscador global** de expedientes
- **Métricas financieras** y reportes
- **Seguridad** con Helmet, CORS y Rate Limiting
- **Clustering** para producción con múltiples núcleos

## 🚀 Instalación

### Requisitos previos
- Node.js v16 o superior
- Cuenta de Supabase
- Cuenta de Gmail (para notificaciones)

### Pasos de instalación

1. **Clonar e instalar dependencias**
```bash
cd asesur-backend
npm install
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Edita el archivo .env con tus credenciales
```

3. **Variables de entorno requeridas**

```env
# Supabase
SUPABASE_URL=tu_url_de_supabase
SUPABASE_KEY=tu_service_role_key

# JWT
JWT_SECRET=un_secreto_muy_seguro_y_largo

# Email (Gmail)
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion

# Servidor
PORT=4000
NODE_ENV=development
```

4. **Iniciar el servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 🗂️ Estructura del Proyecto

```
asesur-backend/
├── server.js                    # Punto de entrada + Clustering
├── src/
│   ├── config/
│   │   └── supabase.js         # Configuración de Supabase
│   ├── controllers/            # Controladores HTTP
│   │   ├── authController.js
│   │   ├── clientController.js
│   │   ├── policyController.js
│   │   ├── dashboardController.js
│   │   ├── notificationController.js
│   │   ├── metricsController.js
│   │   ├── recordsController.js
│   │   ├── configController.js
│   │   └── renewalsController.js
│   ├── services/               # Lógica de negocio
│   │   ├── authService.js
│   │   ├── clientService.js
│   │   ├── policyService.js
│   │   ├── dashboardService.js
│   │   ├── notificationService.js
│   │   ├── metricsService.js
│   │   ├── recordsService.js
│   │   ├── configService.js
│   │   ├── renewalsService.js
│   │   └── emailScheduler.js
│   ├── routes/                 # Definición de rutas
│   │   ├── authRoutes.js
│   │   ├── clientRoutes.js
│   │   ├── policyRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── metricsRoutes.js
│   │   ├── recordsRoutes.js
│   │   └── configRoutes.js
│   ├── middlewares/            # Middlewares
│   │   ├── authMiddleware.js   # Verificación JWT
│   │   ├── errorHandler.js     # Manejo global de errores
│   │   └── validateSchema.js   # Validación Joi
│   ├── schemas/                # Validaciones Joi
│   │   ├── authSchema.js
│   │   ├── clientSchema.js
│   │   ├── policySchema.js
│   │   ├── notificationSchema.js
│   │   └── configSchema.js
│   └── utils/
│       ├── responseFormatter.js
│       └── sanitize.js
└── package.json
```

## 🔐 Autenticación

Todas las rutas excepto `/api/auth/login` y `/api/auth/register` requieren un token JWT en el header:

```
Authorization: Bearer <tu_token_jwt>
```

## 📡 Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Clientes
- `GET /api/clientes` - Obtener todos los clientes
- `GET /api/clientes/search?q=nombre` - Buscar clientes
- `POST /api/clientes` - Crear cliente
- `PUT /api/clientes/:id` - Actualizar cliente

### Pólizas
- `GET /api/polizas` - Obtener todas las pólizas
- `GET /api/polizas/cliente/:cliente_id` - Pólizas por cliente
- `POST /api/polizas` - Crear póliza
- `PUT /api/polizas/:id` - Actualizar póliza
- `PUT /api/polizas/:id/pagar` - Marcar como pagada
- `PUT /api/polizas/:id/cancelar` - Cancelar póliza
- `GET /api/polizas/renovaciones` - Ver renovaciones

### Dashboard
- `GET /api/dashboard` - Datos del dashboard

### Notificaciones
- `GET /api/notifications/dashboard` - Alertas del dashboard
- `PUT /api/notifications/config` - Actualizar email de notificaciones
- `GET /api/notifications/renewals` - Renovaciones próximas

### Métricas
- `GET /api/metrics` - Métricas financieras y estadísticas

### Buscador Global
- `GET /api/records/search?q=termino` - Buscar expedientes

### Configuración
- `GET /api/config` - Obtener configuración
- `PUT /api/config` - Actualizar configuración

## 🤖 Automatizaciones

### Cron Job de Cobranza
El sistema envía automáticamente un reporte diario por email a las 9:00 AM con:
- Recibos pendientes de pago (próximos 15 días)
- Renovaciones de contrato próximas

### Estados Automáticos de Pólizas
El sistema actualiza automáticamente los estados:
- `pendiente` → `vencido` si pasó la fecha de fin
- `vencido` → `pendiente` si se extiende la fecha

## 🛡️ Seguridad

- **Helmet**: Protección de headers HTTP
- **CORS**: Control de orígenes permitidos
- **Rate Limiting**: Máximo 100 peticiones por 15 minutos
- **JWT**: Autenticación con tokens
- **Joi**: Validación estricta de datos de entrada

## 🚨 Manejo de Errores

Todos los errores son capturados y formateados consistentemente:

```json
{
  "success": false,
  "error": "Mensaje descriptivo del error",
  "stack": {} // Solo en desarrollo
}
```

## 📊 Base de Datos (Supabase)

### Tablas requeridas:

#### `profiles`
```sql
- id (uuid, PK, FK a auth.users)
- email (text)
- nombre (text)
- rol (text: 'admin' | 'empleado')
- created_at (timestamp)
```

#### `clientes`
```sql
- id (uuid, PK)
- nombre (text)
- apellido (text)
- email (text, opcional)
- telefono (text)
- rfc (text, opcional)
- tipo_persona (text: 'Física' | 'Moral')
- direccion (text, opcional)
- colonia (text, opcional)
- municipio (text, opcional)
- estado_direccion (text, opcional)
- created_at (timestamp)
```

#### `polizas`
```sql
- id (uuid, PK)
- cliente_id (uuid, FK a clientes)
- numero_poliza (text)
- aseguradora (text)
- tipo_poliza (text)
- forma_pago (text)
- vendedor (text)
- poliza_inicio (date)
- poliza_fin (date)
- recibo_inicio (date)
- recibo_fin (date)
- prima_neta (decimal)
- prima_total (decimal)
- numero_recibo (text)
- estado (text: 'pendiente' | 'pagado' | 'cancelada' | 'vencido')
- created_at (timestamp)
```

#### `configuracion`
```sql
- clave (text, PK)
- valor (text)
- created_at (timestamp)
```

Claves de configuración:
- `email_notificaciones`: Email destino para reportes
- `hora_notificaciones`: Hora del cron job (formato HH:MM)

## 🔄 Flujo de Trabajo

1. Usuario se registra/loguea → Recibe JWT
2. Frontend envía peticiones con JWT en header
3. Middleware `authMiddleware` valida el token
4. Middleware `validateSchema` valida los datos (Joi)
5. Controller recibe la petición limpia
6. Service ejecuta la lógica de negocio
7. Controller responde al cliente
8. `errorHandler` captura cualquier error

## 🌐 Clustering en Producción

En producción (`NODE_ENV=production`), el servidor:
- Detecta el número de CPUs disponibles
- Crea un worker por núcleo
- El proceso maestro gestiona el cron job (solo 1 instancia)
- Los workers atienden peticiones HTTP

## 📧 Configuración de Gmail

Para usar Gmail como servidor SMTP:

1. Activar verificación en 2 pasos
2. Generar contraseña de aplicación:
   - Ir a https://myaccount.google.com/apppasswords
   - Generar nueva contraseña
   - Usar esa contraseña en `EMAIL_PASS`

## 🧪 Testing

```bash
# Probar conexión a Supabase
node -e "const {supabase} = require('./src/config/supabase'); supabase.from('clientes').select('count').then(console.log)"

# Probar servidor
curl http://localhost:4000/

# Probar login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

## 📝 Scripts NPM

```json
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "echo \"No tests yet\""
}
```

## 🐛 Solución de Problemas

### El servidor no inicia
- Verifica que todas las variables de entorno estén configuradas
- Revisa que el puerto 4000 no esté ocupado
- Verifica la conexión a Supabase

### Los emails no se envían
- Verifica las credenciales de Gmail
- Asegúrate de usar una contraseña de aplicación (no tu contraseña normal)
- Revisa que `EMAIL_USER` y `EMAIL_PASS` estén en `.env`

### Error de JWT
- Verifica que `JWT_SECRET` esté configurado
- Asegúrate de enviar el token en el header: `Authorization: Bearer <token>`

### Errores de Supabase
- Verifica que las tablas existan
- Revisa que el `SUPABASE_KEY` sea el **service_role_key** (no el anon key)
- Confirma que las RLS policies permitan las operaciones

## 👥 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y pertenece a Grupo Asesur.

## 🤝 Soporte

Para soporte, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ para Grupo Asesur**
