-- =========================================
-- LIMPIEZA DE DATOS DE PRUEBA
-- Proyecto: Trueques Comunitarios
-- Uso: ejecutar una sola vez antes de entregar el sistema a la comunidad.
-- Este script elimina productos, solicitudes, historial y usuarios locales de prueba.
-- Mantiene las categorías base del sistema.
-- =========================================

TRUNCATE TABLE trueque, solicitud_trueque, producto, usuario RESTART IDENTITY CASCADE;

INSERT INTO categoria (nombre_categoria, descripcion)
SELECT 'Frutas', 'Productos frutales de la region'
WHERE NOT EXISTS (
  SELECT 1 FROM categoria WHERE nombre_categoria = 'Frutas'
);

INSERT INTO categoria (nombre_categoria, descripcion)
SELECT 'Lacteos', 'Productos derivados de la leche'
WHERE NOT EXISTS (
  SELECT 1 FROM categoria WHERE nombre_categoria = 'Lacteos'
);

INSERT INTO categoria (nombre_categoria, descripcion)
SELECT 'Verduras', 'Productos agricolas frescos'
WHERE NOT EXISTS (
  SELECT 1 FROM categoria WHERE nombre_categoria = 'Verduras'
);

INSERT INTO categoria (nombre_categoria, descripcion)
SELECT 'Granos', 'Productos secos o de cosecha'
WHERE NOT EXISTS (
  SELECT 1 FROM categoria WHERE nombre_categoria = 'Granos'
);