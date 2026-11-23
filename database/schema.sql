-- ============================================================================
-- LabCare - Esquema PostgreSQL para Supabase
-- Sistema de gestión de solicitudes de mantenimiento de equipos de laboratorio
-- ============================================================================
-- Instrucciones:
--   1. Crea un proyecto en https://supabase.com
--   2. Abre SQL Editor -> New query
--   3. Pega TODO este archivo y ejecútalo (Run)
--   4. Verifica en Table Editor que existan equipos, solicitudes,
--      historial_estados y contadores_codigo.
-- ============================================================================

-- Necesario para gen_random_uuid(). En Supabase ya suele estar disponible.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. TABLAS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.equipos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo      VARCHAR(20) NOT NULL,
    nombre      VARCHAR(120) NOT NULL,
    ubicacion   VARCHAR(120) NOT NULL,
    estado      VARCHAR(30) NOT NULL DEFAULT 'OPERATIVO',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_equipos_codigo UNIQUE (codigo),
    CONSTRAINT ck_equipos_codigo_no_vacio CHECK (length(btrim(codigo)) > 0),
    CONSTRAINT ck_equipos_nombre_no_vacio CHECK (length(btrim(nombre)) > 0),
    CONSTRAINT ck_equipos_ubicacion_no_vacio CHECK (length(btrim(ubicacion)) > 0),
    CONSTRAINT ck_equipos_estado_no_vacio CHECK (length(btrim(estado)) > 0)
);

CREATE TABLE IF NOT EXISTS public.solicitudes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_solicitud    VARCHAR(30) NOT NULL,
    equipo_id           UUID NOT NULL,
    solicitante         VARCHAR(120) NOT NULL,
    descripcion         TEXT NOT NULL,
    prioridad           VARCHAR(10) NOT NULL,
    estado              VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    fecha_registro      TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_solicitudes_codigo UNIQUE (codigo_solicitud),
    CONSTRAINT fk_solicitudes_equipos
        FOREIGN KEY (equipo_id) REFERENCES public.equipos (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_solicitudes_codigo_no_vacio CHECK (length(btrim(codigo_solicitud)) > 0),
    CONSTRAINT ck_solicitudes_solicitante CHECK (length(btrim(solicitante)) >= 3),
    CONSTRAINT ck_solicitudes_descripcion CHECK (length(btrim(descripcion)) >= 10),
    CONSTRAINT ck_solicitudes_prioridad CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA')),
    CONSTRAINT ck_solicitudes_estado CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'CANCELADA'))
);

CREATE TABLE IF NOT EXISTS public.historial_estados (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id    UUID NOT NULL,
    estado_anterior VARCHAR(20) NOT NULL,
    estado_nuevo    VARCHAR(20) NOT NULL,
    fecha_cambio    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_historial_solicitudes
        FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_historial_estado_anterior
        CHECK (estado_anterior IN ('PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'CANCELADA')),
    CONSTRAINT ck_historial_estado_nuevo
        CHECK (estado_nuevo IN ('PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'CANCELADA'))
);

-- Contador por fecha para generar códigos SOL-AAAAMMDD-XXX sin duplicados.
CREATE TABLE IF NOT EXISTS public.contadores_codigo (
    fecha   DATE PRIMARY KEY,
    ultimo  INTEGER NOT NULL DEFAULT 0 CHECK (ultimo >= 0)
);

-- ----------------------------------------------------------------------------
-- 2. FUNCIONES
-- ----------------------------------------------------------------------------

-- Genera un código único usando un bloqueo de fila (FOR UPDATE) sobre el
-- contador del día. Dos inserciones simultáneas obtienen números distintos.
CREATE OR REPLACE FUNCTION public.generar_codigo_solicitud()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_fecha DATE := CURRENT_DATE;
    v_numero INTEGER;
BEGIN
    INSERT INTO public.contadores_codigo (fecha, ultimo)
    VALUES (v_fecha, 0)
    ON CONFLICT (fecha) DO NOTHING;

    SELECT ultimo + 1 INTO v_numero
    FROM public.contadores_codigo
    WHERE fecha = v_fecha
    FOR UPDATE;

    UPDATE public.contadores_codigo
    SET ultimo = v_numero
    WHERE fecha = v_fecha;

    RETURN 'SOL-' || to_char(v_fecha, 'YYYYMMDD') || '-' || lpad(v_numero::TEXT, 3, '0');
END;
$$;

-- Actualiza fecha_actualizacion en cualquier modificación real de la solicitud.
CREATE OR REPLACE FUNCTION public.touch_solicitud_actualizacion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.fecha_actualizacion := now();
    RETURN NEW;
END;
$$;

-- Registra automáticamente cada transición de estado.
CREATE OR REPLACE FUNCTION public.registrar_historial_estado()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
        INSERT INTO public.historial_estados (solicitud_id, estado_anterior, estado_nuevo)
        VALUES (NEW.id, OLD.estado, NEW.estado);
    END IF;
    RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. TRIGGERS
-- ----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_solicitudes_fecha_actualizacion ON public.solicitudes;
CREATE TRIGGER trg_solicitudes_fecha_actualizacion
    BEFORE UPDATE ON public.solicitudes
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_solicitud_actualizacion();

DROP TRIGGER IF EXISTS trg_solicitudes_historial_estado ON public.solicitudes;
CREATE TRIGGER trg_solicitudes_historial_estado
    AFTER UPDATE OF estado ON public.solicitudes
    FOR EACH ROW
    EXECUTE FUNCTION public.registrar_historial_estado();

-- ----------------------------------------------------------------------------
-- 4. ÍNDICES
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_equipos_nombre_lower ON public.equipos (lower(nombre));
CREATE INDEX IF NOT EXISTS idx_solicitudes_activo_fecha ON public.solicitudes (activo, fecha_registro DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_equipo_id ON public.solicitudes (equipo_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_prioridad ON public.solicitudes (prioridad);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON public.solicitudes (estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_codigo_lower ON public.solicitudes (lower(codigo_solicitud));
CREATE INDEX IF NOT EXISTS idx_solicitudes_solicitante_lower ON public.solicitudes (lower(solicitante));
CREATE INDEX IF NOT EXISTS idx_historial_solicitud_fecha ON public.historial_estados (solicitud_id, fecha_cambio DESC);

-- ----------------------------------------------------------------------------
-- 5. VISTA DE CONSULTA (solicitudes + equipo + estado actual)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_solicitudes_detalle AS
SELECT
    s.id,
    s.codigo_solicitud,
    s.solicitante,
    s.descripcion,
    s.prioridad,
    s.estado,
    s.fecha_registro,
    s.fecha_actualizacion,
    s.activo,
    e.id            AS equipo_id,
    e.codigo        AS equipo_codigo,
    e.nombre        AS equipo_nombre,
    e.ubicacion     AS equipo_ubicacion,
    e.estado        AS equipo_estado
FROM public.solicitudes s
JOIN public.equipos e ON e.id = s.equipo_id;

-- ----------------------------------------------------------------------------
-- 6. SEGURIDAD (RLS)
-- ----------------------------------------------------------------------------
-- El backend usa exclusivamente la SERVICE_ROLE_KEY, que bypasea RLS.
-- No se crean políticas para anon/authenticated: el navegador NUNCA habla
-- directamente con Supabase, solo con la API de Express.

ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contadores_codigo ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 7. DATOS INICIALES (catálogo obligatorio: solo estos cuatro equipos)
-- ----------------------------------------------------------------------------

INSERT INTO public.equipos (codigo, nombre, ubicacion, estado) VALUES
    ('EQ-001', 'Computadora de escritorio', 'Laboratorio 1', 'OPERATIVO'),
    ('EQ-002', 'Proyector multimedia', 'Aula 204', 'OPERATIVO'),
    ('EQ-003', 'Router de laboratorio', 'Laboratorio de Redes', 'OPERATIVO'),
    ('EQ-004', 'Impresora de oficina', 'Secretaría', 'OPERATIVO')
ON CONFLICT (codigo) DO NOTHING;

-- Recarga la caché de esquema de PostgREST para que la vista y el RPC estén
-- disponibles de inmediato desde el backend.
NOTIFY pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- 8. VERIFICACIÓN RÁPIDA (opcional)
-- ----------------------------------------------------------------------------
-- SELECT codigo, nombre, ubicacion, estado FROM public.equipos ORDER BY codigo;
-- SELECT public.generar_codigo_solicitud() AS codigo_de_prueba;
-- NOTA: la última llamada incrementa el contador; solo úsala para probar.
