-- =========================================
-- ACTUALIZACIÓN PARA BASE EXISTENTE: trueques_db
-- Proyecto: Trueques Comunitarios
-- Objetivo: integrar la base original con el auth-service.
--
-- Este script NO cambia tu modelo de trueques.
-- Solo agrega el campo auth_user_id en usuario para enlazar:
-- auth-service.userId -> trueques.usuario.auth_user_id
-- =========================================

ALTER TABLE usuario
ADD COLUMN IF NOT EXISTS auth_user_id VARCHAR(80);

ALTER TABLE usuario
ALTER COLUMN auth_user_id TYPE VARCHAR(80)
USING auth_user_id::VARCHAR;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_auth_user_id
ON usuario(auth_user_id);

-- La vista de productos se actualiza para incluir más datos que usa el frontend.
CREATE OR REPLACE VIEW vista_productos_publicados AS
SELECT
    p.id_producto,
    p.nombre_producto,
    p.descripcion,
    p.cantidad,
    p.unidad_medida,
    p.imagen,
    p.estado,
    p.fecha_publicacion,
    u.nombre_completo AS publicado_por,
    c.nombre_categoria
FROM producto p
JOIN usuario u ON p.id_usuario = u.id_usuario
JOIN categoria c ON p.id_categoria = c.id_categoria;


-- Vista solicitudes con unidades e IDs para el frontend
CREATE OR REPLACE VIEW vista_solicitudes_trueque AS
SELECT
    st.id_solicitud,
    st.mensaje,
    st.estado,
    st.fecha_solicitud,
    st.cantidad_solicitada,
    st.cantidad_ofrecida,
    st.id_producto_solicitado,
    st.id_producto_ofrecido,
    st.id_usuario_solicitante,
    u.nombre_completo AS solicitante,
    ps.nombre_producto AS producto_solicitado,
    ps.unidad_medida AS unidad_solicitada,
    po.nombre_producto AS producto_ofrecido,
    po.unidad_medida AS unidad_ofrecida
FROM solicitud_trueque st
JOIN usuario u ON st.id_usuario_solicitante = u.id_usuario
JOIN producto ps ON st.id_producto_solicitado = ps.id_producto
JOIN producto po ON st.id_producto_ofrecido = po.id_producto;
