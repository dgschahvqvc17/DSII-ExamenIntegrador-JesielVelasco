const app = require('./app');
const env = require('./config/env');

app.listen(env.PORT, () => {
  console.log(`[LabCare] API escuchando en http://localhost:${env.PORT}/api`);
  console.log(`[LabCare] Orígenes CORS permitidos: ${env.CORS_ORIGIN}`);
});
