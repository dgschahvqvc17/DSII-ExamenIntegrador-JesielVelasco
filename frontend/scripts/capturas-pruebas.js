/**
 * Captura las evidencias técnicas generadas por `npm run auditoria`.
 * Abre el informe HTML con respuestas HTTP y consultas a Supabase y guarda
 * una imagen por bloque en docs/evidencias/.
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCIAS = path.resolve(__dirname, '../../docs/evidencias');
const ARCHIVO = path.join(EVIDENCIAS, 'evidencia-pruebas.html');

const bloques = [
  ['#resumen', 'captura-01-resumen.png', 'Tabla de resultados de los 12 casos'],
  ['#grupo-1', 'captura-02-cp01-cp04.png', 'CP-01 a CP-04 con respuestas HTTP'],
  ['#grupo-2', 'captura-03-cp05-cp08.png', 'CP-05 a CP-08 con transiciones'],
  ['#grupo-3', 'captura-04-cp09-cp12.png', 'CP-09 a CP-12 con persistencia'],
  [
    '#verificacion-db',
    'captura-05-supabase.png',
    'Verificación directa en Supabase',
  ],
];

const navegador = await chromium.launch({ headless: true });
try {
  const pagina = await navegador.newPage({
    viewport: { width: 1400, height: 1000 },
    deviceScaleFactor: 1,
  });
  await pagina.goto(pathToFileURL(ARCHIVO).href, { waitUntil: 'load' });

  for (const [selector, nombre, descripcion] of bloques) {
    await pagina.locator(selector).screenshot({
      path: path.join(EVIDENCIAS, nombre),
      animations: 'disabled',
    });
    console.log(`📸 ${nombre} — ${descripcion}`);
  }
  console.log('\n✅ Evidencias gráficas de pruebas generadas.');
} finally {
  await navegador.close();
}
