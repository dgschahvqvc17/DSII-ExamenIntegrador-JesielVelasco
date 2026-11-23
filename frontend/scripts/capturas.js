/**
 * Generación automática de evidencia gráfica del sistema LabCare.
 *
 * Requiere:
 *   1. backend/.env configurado y schema.sql ejecutado en Supabase.
 *   2. API corriendo en http://localhost:3000/api  (npm start)
 *   3. Frontend corriendo en http://localhost:5173 (npm run dev:frontend)
 *
 * Uso:  npm run capturas
 *
 * Los registros que se crean son REALES (Supabase) y se desactivan
 * lógicamente al finalizar. No se usan datos simulados ni localStorage.
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.resolve(__dirname, '../../docs/capturas');
const API = process.env.API_URL || 'http://localhost:3000/api';
const WEB = process.env.WEB_URL || 'http://localhost:5173';

const creados = [];
let navegador;
let limpiezaHecha = false;

const peticion = async (metodo, ruta, cuerpo) => {
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
  });
  const json = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(`${metodo} ${ruta} → ${respuesta.status}: ${json.error}`);
  }
  return json.data;
};

const capturar = async (pagina, nombre, descripcion) => {
  const destino = path.join(SALIDA, nombre);
  await pagina.screenshot({
    path: destino,
    fullPage: true,
    animations: 'disabled',
  });
  console.log(`  📸 ${nombre} — ${descripcion}`);
};

const sembrar = async () => {
  const equipos = await peticion('GET', '/equipos');
  if (equipos.length < 4) {
    throw new Error('Supabase debe tener los 4 equipos iniciales.');
  }

  const datos = [
    {
      equipo_id: equipos[0].id,
      solicitante: 'María Rojas (Demo)',
      descripcion:
        'La computadora de escritorio no enciende desde esta mañana y el ventilador no gira.',
      prioridad: 'ALTA',
    },
    {
      equipo_id: equipos[1].id,
      solicitante: 'Carlos Mendoza (Demo)',
      descripcion:
        'El proyector multimedia muestra la imagen parpadeante durante las clases.',
      prioridad: 'MEDIA',
    },
    {
      equipo_id: equipos[2].id,
      solicitante: 'Ana Flores (Demo)',
      descripcion:
        'El router del laboratorio pierde la conexión inalámbrica de forma intermitente.',
      prioridad: 'BAJA',
    },
    {
      equipo_id: equipos[3].id,
      solicitante: 'Luis Camacho (Demo)',
      descripcion:
        'La impresora de oficina se atascó y no responde a los trabajos enviados.',
      prioridad: 'MEDIA',
    },
    {
      equipo_id: equipos[0].id,
      solicitante: 'Sofía Vargas (Demo)',
      descripcion:
        'El teclado de la computadora no registra algunas teclas al escribir.',
      prioridad: 'ALTA',
    },
  ];

  const solicitudes = [];
  for (const dato of datos) {
    const creada = await peticion('POST', '/solicitudes', dato);
    creados.push(creada.id);
    solicitudes.push(creada);
  }

  // Estados variados para que el dashboard y el historial muestren información real.
  await peticion('PATCH', `/solicitudes/${solicitudes[1].id}/estado`, {
    estado: 'EN_PROCESO',
  });
  await peticion('PATCH', `/solicitudes/${solicitudes[2].id}/estado`, {
    estado: 'EN_PROCESO',
  });
  await peticion('PATCH', `/solicitudes/${solicitudes[2].id}/estado`, {
    estado: 'RESUELTA',
  });
  await peticion('PATCH', `/solicitudes/${solicitudes[3].id}/estado`, {
    estado: 'EN_PROCESO',
  });
  await peticion('PATCH', `/solicitudes/${solicitudes[3].id}/estado`, {
    estado: 'CANCELADA',
  });

  return solicitudes;
};

const limpiar = async () => {
  if (limpiezaHecha) return;
  limpiezaHecha = true;
  for (const id of creados) {
    try {
      await peticion('DELETE', `/solicitudes/${id}`);
    } catch {
      // Si ya fue eliminada lógicamente desde la interfaz, no hay nada que hacer.
    }
  }
  console.log(`  🧹 ${creados.length} registros de demostración desactivados.`);
};

const esperarTexto = (pagina, texto) =>
  pagina.getByText(texto, { exact: false }).first().waitFor({ timeout: 20000 });

const ejecutar = async () => {
  await fs.mkdir(SALIDA, { recursive: true });

  console.log('🌱 Sembrando datos reales en Supabase…');
  const sembradas = await sembrar();
  console.log(`  ✔ ${sembradas.length} solicitudes creadas.\n`);

  // Por defecto usa el Chromium de Playwright; con PLAYWRIGHT_CHANNEL=msedge
  // aprovecha un navegador ya instalado en el sistema.
  const canal = process.env.PLAYWRIGHT_CHANNEL || undefined;
  navegador = await chromium.launch({
    headless: true,
    ...(canal ? { channel: canal } : {}),
  });

  try {
    // ---------- Escritorio ----------
    const escritorio = await navegador.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const pagina = await escritorio.newPage();

    console.log('📷 Capturando vistas de escritorio…');

    await pagina.goto(WEB, { waitUntil: 'domcontentloaded' });
    await esperarTexto(pagina, 'Distribución por prioridad');
    await esperarTexto(pagina, sembradas[0].solicitante);
    await capturar(pagina, '01-dashboard.png', 'Dashboard con estadísticas reales');

    await pagina.getByRole('link', { name: 'Solicitudes' }).click();
    await esperarTexto(pagina, 'Listado de solicitudes activas');
    await esperarTexto(pagina, sembradas[0].codigo_solicitud);
    await capturar(
      pagina,
      '02-solicitudes-listado.png',
      'Listado de solicitudes activas con badges y acciones',
    );

    await pagina.locator('#buscar').fill('María Rojas');
    await pagina.locator('#filtro-prioridad').selectOption('ALTA');
    await pagina.locator('#filtro-estado').selectOption('PENDIENTE');
    await esperarTexto(pagina, sembradas[0].codigo_solicitud);
    await capturar(
      pagina,
      '03-solicitudes-filtros.png',
      'Búsqueda y filtros combinados por prioridad y estado',
    );

    await pagina.getByRole('button', { name: 'Limpiar filtros' }).click();
    await pagina.getByRole('button', { name: 'Nueva solicitud' }).click();
    await esperarTexto(pagina, 'Registrar nueva solicitud');
    await capturar(
      pagina,
      '04-modal-registrar.png',
      'Modal de registro con selector de equipos y validaciones',
    );
    await pagina
      .locator('.lab-modal button[aria-label="Cerrar"]')
      .click();

    await pagina
      .locator('button[title="Ver detalle"]')
      .first()
      .click();
    await esperarTexto(pagina, 'Detalle de la solicitud');
    await esperarTexto(pagina, 'Historial de estados');
    await capturar(
      pagina,
      '05-modal-detalle.png',
      'Detalle completo y línea de tiempo de estados',
    );
    await pagina
      .locator('.lab-modal button.footer-close, .lab-modal__footer button')
      .first()
      .click();

    await pagina
      .locator('button[title="Cambiar estado"]')
      .first()
      .click();
    await esperarTexto(pagina, 'Selecciona el nuevo estado');
    await capturar(
      pagina,
      '06-modal-cambio-estado.png',
      'Transiciones permitidas validadas por el backend',
    );
    await pagina
      .locator('.lab-modal button[aria-label="Cerrar"]')
      .click();

    const botonEliminar = pagina.locator(
      `tr:has-text("${sembradas[4].solicitante}") button[title="Eliminar lógicamente"]`,
    );
    await botonEliminar.click();
    await pagina.locator('.swal2-popup').waitFor({ timeout: 10000 });
    await capturar(
      pagina,
      '07-confirmacion-eliminacion.png',
      'Confirmación de eliminación lógica con SweetAlert2',
    );
    await pagina.locator('.swal2-cancel').click();

    await pagina.getByRole('link', { name: 'Equipos' }).click();
    await esperarTexto(pagina, 'Equipos de laboratorio');
    await esperarTexto(pagina, 'EQ-004');
    await capturar(
      pagina,
      '08-equipos.png',
      'Catálogo de los cuatro equipos desde Supabase',
    );

    await pagina.getByRole('link', { name: 'Historial' }).click();
    await esperarTexto(pagina, 'Historial y seguimiento');
    await esperarTexto(pagina, 'Todas las solicitudes');
    await capturar(
      pagina,
      '09-historial.png',
      'Historial de solicitudes incluyendo registros inactivos',
    );

    await escritorio.close();

    // ---------- Móvil ----------
    console.log('📷 Capturando vistas móviles…');
    const movil = await navegador.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const paginaMovil = await movil.newPage();

    await paginaMovil.goto(WEB, { waitUntil: 'domcontentloaded' });
    await esperarTexto(paginaMovil, 'Distribución por prioridad');
    await capturar(
      paginaMovil,
      '10-movil-dashboard.png',
      'Dashboard adaptado a teléfono móvil',
    );

    await paginaMovil.getByRole('button', { name: 'Abrir menú' }).click();
    await paginaMovil.locator('.lab-sidebar.is-open').waitFor();
    await capturar(
      paginaMovil,
      '11-movil-menu.png',
      'Navegación lateral desplegable en móvil',
    );
    await paginaMovil
      .getByRole('button', { name: 'Cerrar menú' })
      .click();
    await paginaMovil.locator('.lab-sidebar:not(.is-open)').waitFor();

    // Navegación directa: evita depender de la animación del sidebar móvil.
    await paginaMovil.goto(`${WEB}/solicitudes`, {
      waitUntil: 'domcontentloaded',
    });
    await esperarTexto(paginaMovil, 'Listado de solicitudes activas');
    await capturar(
      paginaMovil,
      '12-movil-solicitudes.png',
      'Tabla responsive de solicitudes en móvil',
    );

    await movil.close();
    console.log('\n✅ Capturas generadas en docs/capturas/');
  } finally {
    if (navegador) await navegador.close();
    await limpiar();
  }
};

ejecutar().catch(async (error) => {
  console.error('\n❌ No se pudieron generar las capturas:', error.message);
  console.error(
    'Verifica que la API y el frontend estén corriendo y que Supabase esté conectado.',
  );
  if (navegador) await navegador.close();
  await limpiar();
  process.exit(1);
});
