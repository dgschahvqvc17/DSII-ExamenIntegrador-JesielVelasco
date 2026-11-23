const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

// Carga backend/.env (nunca el .env del frontend).
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const envSchema = z
  .object({
    SUPABASE_URL: z.string().url('SUPABASE_URL debe ser una URL válida'),

    // Formato nuevo recomendado por Supabase: sb_secret_...
    SUPABASE_SECRET_KEY: z.string().min(20).optional(),

    // Formato legado: service_role JWT (eyJ...). Sigue siendo válido.
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),

    PORT: z.coerce.number().int().positive().default(3000),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  })
  .refine(
    (datos) =>
      Boolean(datos.SUPABASE_SECRET_KEY || datos.SUPABASE_SERVICE_ROLE_KEY),
    {
      message:
        'Define SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY en backend/.env',
      path: ['SUPABASE_SECRET_KEY'],
    },
  );

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errores = parsed.error.flatten();
  console.error('[LabCare] Error de configuración en backend/.env:');
  console.error(
    JSON.stringify(
      { campos: errores.fieldErrors, general: errores.formErrors },
      null,
      2,
    ),
  );
  console.error('Copia backend/.env.example a backend/.env y completa los valores.');
  process.exit(1);
}

// Normalizamos ambos formatos a una sola clave para el cliente de Supabase.
const apiKey =
  parsed.data.SUPABASE_SECRET_KEY || parsed.data.SUPABASE_SERVICE_ROLE_KEY;

module.exports = Object.freeze({
  ...parsed.data,
  SUPABASE_API_KEY: apiKey,
});
