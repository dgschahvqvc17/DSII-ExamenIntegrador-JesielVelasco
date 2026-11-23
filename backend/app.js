const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const supabase = require('./config/supabase');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

const origenesPermitidos = env.CORS_ORIGIN.split(',')
  .map((origen) => origen.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: origenesPermitidos,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => {
  const { error } = await supabase.from('equipos').select('id').limit(1);
  res.status(error ? 503 : 200).json({
    success: !error,
    servicio: 'LabCare API',
    supabase: error ? 'sin conexión' : 'conectado',
    entorno: env.NODE_ENV,
  });
});

app.use('/api/solicitudes', require('./routes/solicitudesRoutes'));
app.use('/api/equipos', require('./routes/equiposRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
