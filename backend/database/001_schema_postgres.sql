-- =========================================
-- BASE DE DATOS: trueques_db
-- Proyecto: Trueques Comunitarios
-- Versión: PostgreSQL + integración con auth-service
--
-- Este script conserva la base original del grupo.
-- Único ajuste de integración:
--   usuario.auth_user_id VARCHAR(80) UNIQUE
-- para relacionar el usuario del auth-service con el usuario local de Trueques.
-- =========================================

-- =========================================
-- TABLAS
-- =========================================

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    auth_user_id VARCHAR(80) UNIQUE,
    nombre_completo VARCHAR(80) NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    correo VARCHAR(80),
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria VARCHAR(40) NOT NULL,
    descripcion VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS producto (
    id_producto SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(60) NOT NULL,
    descripcion VARCHAR(200),
    cantidad NUMERIC(10,2) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL,
    imagen VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'disponible',
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL REFERENCES usuario(id_usuario),
    id_categoria INT NOT NULL REFERENCES categoria(id_categoria)
);

CREATE TABLE IF NOT EXISTS solicitud_trueque (
    id_solicitud SERIAL PRIMARY KEY,
    mensaje VARCHAR(200),
    cantidad_solicitada NUMERIC(10,2) NOT NULL,
    cantidad_ofrecida NUMERIC(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_producto_solicitado INT NOT NULL REFERENCES producto(id_producto),
    id_producto_ofrecido INT NOT NULL REFERENCES producto(id_producto),
    id_usuario_solicitante INT NOT NULL REFERENCES usuario(id_usuario)
);

CREATE TABLE IF NOT EXISTS trueque (
    id_trueque SERIAL PRIMARY KEY,
    fecha_trueque TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'confirmado',
    observacion VARCHAR(200),
    id_solicitud INT UNIQUE NOT NULL REFERENCES solicitud_trueque(id_solicitud)
);

CREATE TABLE IF NOT EXISTS auditoria_trueque (
    id_auditoria SERIAL PRIMARY KEY,
    accion VARCHAR(50),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descripcion VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS auditoria_producto (
    id_auditoria SERIAL PRIMARY KEY,
    accion VARCHAR(50),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descripcion VARCHAR(200)
);

-- =========================================
-- INSERTS DE PRUEBA / DATOS INICIALES
-- =========================================
-- Nota: se dejan como datos iniciales para presentación.
-- En producción real, los usuarios nuevos se crean/sincronizan desde el auth-service.

INSERT INTO usuario (nombre_completo, telefono, correo)
SELECT 'Ever Cordoba', '3124567890', NULL
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE nombre_completo = 'Ever Cordoba' AND telefono = '3124567890');

INSERT INTO usuario (nombre_completo, telefono, correo)
SELECT 'Juan Sanchez', '3001234567', 'juan@gmail.com'
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE nombre_completo = 'Juan Sanchez' AND telefono = '3001234567');

INSERT INTO usuario (nombre_completo, telefono, correo)
SELECT 'Maryi Trujillo', '3119876543', NULL
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE nombre_completo = 'Maryi Trujillo' AND telefono = '3119876543');

INSERT INTO usuario (nombre_completo, telefono, correo)
SELECT 'Maria Gomez', '3205557788', 'maria@gmail.com'
WHERE NOT EXISTS (SELECT 1 FROM usuario WHERE nombre_completo = 'Maria Gomez' AND telefono = '3205557788');

INSERT INTO categoria (nombre_categoria, descripcion)
SELECT 'Frutas', 'Productos frutales de la region'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nombre_categoria = 'Frutas');

INSERT INTO categoria (nombre_categoria, descripcion)
SELECT 'Lacteos', 'Productos derivados de la leche'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nombre_categoria = 'Lacteos');

INSERT INTO categoria (nombre_categoria, descripcion)
SELECT 'Verduras', 'Productos agricolas frescos'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nombre_categoria = 'Verduras');

INSERT INTO categoria (nombre_categoria, descripcion)
SELECT 'Granos', 'Productos secos o de cosecha'
WHERE NOT EXISTS (SELECT 1 FROM categoria WHERE nombre_categoria = 'Granos');

INSERT INTO producto (
    nombre_producto, descripcion, cantidad, unidad_medida, imagen, id_usuario, id_categoria
)
SELECT 'Platano', 'Platano verde recien cosechado', 3, 'racimos', 'uploads/Platano.jpg', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre_producto = 'Platano' AND id_usuario = 1);

INSERT INTO producto (
    nombre_producto, descripcion, cantidad, unidad_medida, imagen, id_usuario, id_categoria
)
SELECT 'Queso', 'Queso campesino fresco', 5, 'libras', 'uploads/Queso.jpg', 2, 2
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre_producto = 'Queso' AND id_usuario = 2);

INSERT INTO producto (
    nombre_producto, descripcion, cantidad, unidad_medida, imagen, id_usuario, id_categoria
)
SELECT 'Limones', 'Limones frescos de cosecha local', 20, 'unidades', 'uploads/Limones.jpg', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre_producto = 'Limones' AND id_usuario = 3);

INSERT INTO producto (
    nombre_producto, descripcion, cantidad, unidad_medida, imagen, id_usuario, id_categoria
)
SELECT 'Yuca', 'Yuca lista para consumo', 10, 'kilos', 'uploads/Yuca.jpg', 4, 3
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre_producto = 'Yuca' AND id_usuario = 4);

INSERT INTO producto (
    nombre_producto, descripcion, cantidad, unidad_medida, imagen, id_usuario, id_categoria
)
SELECT 'Frijol', 'Frijol seco seleccionado', 8, 'kilos', 'uploads/Frijol.jpg', 1, 4
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE nombre_producto = 'Frijol' AND id_usuario = 1);

INSERT INTO solicitud_trueque (
    mensaje,
    id_producto_solicitado,
    id_producto_ofrecido,
    id_usuario_solicitante,
    cantidad_solicitada,
    cantidad_ofrecida
)
SELECT 'Cambio 1 platano por 2 de queso', 1, 2, 2, 1, 2
WHERE NOT EXISTS (SELECT 1 FROM solicitud_trueque WHERE mensaje = 'Cambio 1 platano por 2 de queso');

INSERT INTO solicitud_trueque (
    mensaje,
    id_producto_solicitado,
    id_producto_ofrecido,
    id_usuario_solicitante,
    cantidad_solicitada,
    cantidad_ofrecida
)
SELECT 'Cambio 2 yuca por 5 limones', 4, 3, 3, 2, 5
WHERE NOT EXISTS (SELECT 1 FROM solicitud_trueque WHERE mensaje = 'Cambio 2 yuca por 5 limones');

-- =========================================
-- VISTAS
-- =========================================

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

CREATE OR REPLACE VIEW vista_productos_disponibles AS
SELECT
    id_producto,
    nombre_producto,
    cantidad,
    estado
FROM producto
WHERE estado = 'disponible';

CREATE OR REPLACE VIEW vista_trueques AS
SELECT
    t.id_trueque,
    t.fecha_trueque,
    t.estado,
    u.nombre_completo AS solicitante,
    ps.nombre_producto AS solicitado,
    po.nombre_producto AS ofrecido
FROM trueque t
JOIN solicitud_trueque st ON t.id_solicitud = st.id_solicitud
JOIN usuario u ON st.id_usuario_solicitante = u.id_usuario
JOIN producto ps ON st.id_producto_solicitado = ps.id_producto
JOIN producto po ON st.id_producto_ofrecido = po.id_producto;

CREATE OR REPLACE VIEW vista_reporte_general AS
SELECT
    u.nombre_completo,
    COUNT(p.id_producto) AS total_productos,
    SUM(p.cantidad) AS total_cantidad
FROM usuario u
LEFT JOIN producto p ON u.id_usuario = p.id_usuario
GROUP BY u.nombre_completo;

-- =========================================
-- TRIGGERS Y FUNCIONES DE TRUEQUE
-- =========================================

CREATE OR REPLACE FUNCTION actualizar_cantidad_productos()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE producto p
    SET
        cantidad = p.cantidad - st.cantidad_solicitada,
        estado = CASE
            WHEN p.cantidad - st.cantidad_solicitada <= 0 THEN 'agotado'
            ELSE 'disponible'
        END
    FROM solicitud_trueque st
    WHERE p.id_producto = st.id_producto_solicitado
      AND st.id_solicitud = NEW.id_solicitud;

    UPDATE producto p
    SET
        cantidad = p.cantidad - st.cantidad_ofrecida,
        estado = CASE
            WHEN p.cantidad - st.cantidad_ofrecida <= 0 THEN 'agotado'
            ELSE 'disponible'
        END
    FROM solicitud_trueque st
    WHERE p.id_producto = st.id_producto_ofrecido
      AND st.id_solicitud = NEW.id_solicitud;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_cantidad_productos ON trueque;
CREATE TRIGGER trg_actualizar_cantidad_productos
AFTER INSERT ON trueque
FOR EACH ROW
EXECUTE FUNCTION actualizar_cantidad_productos();

CREATE OR REPLACE FUNCTION validar_cantidad_trueque()
RETURNS TRIGGER AS $$
DECLARE
    cant_solicitada NUMERIC;
    cant_ofrecida NUMERIC;
    cant_prod_solicitado NUMERIC;
    cant_prod_ofrecido NUMERIC;
BEGIN
    SELECT cantidad_solicitada, cantidad_ofrecida
    INTO cant_solicitada, cant_ofrecida
    FROM solicitud_trueque
    WHERE id_solicitud = NEW.id_solicitud;

    SELECT cantidad INTO cant_prod_solicitado
    FROM producto
    WHERE id_producto = (
        SELECT id_producto_solicitado FROM solicitud_trueque WHERE id_solicitud = NEW.id_solicitud
    );

    SELECT cantidad INTO cant_prod_ofrecido
    FROM producto
    WHERE id_producto = (
        SELECT id_producto_ofrecido FROM solicitud_trueque WHERE id_solicitud = NEW.id_solicitud
    );

    IF cant_prod_solicitado < cant_solicitada THEN
        RAISE EXCEPTION 'No hay suficiente cantidad del producto solicitado';
    END IF;

    IF cant_prod_ofrecido < cant_ofrecida THEN
        RAISE EXCEPTION 'No hay suficiente cantidad del producto ofrecido';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_cantidad ON trueque;
CREATE TRIGGER trg_validar_cantidad
BEFORE INSERT ON trueque
FOR EACH ROW
EXECUTE FUNCTION validar_cantidad_trueque();

-- =========================================
-- ÍNDICES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_usuario_auth_user_id ON usuario(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_producto_nombre ON producto(nombre_producto);
CREATE INDEX IF NOT EXISTS idx_producto_estado ON producto(estado);
CREATE INDEX IF NOT EXISTS idx_solicitud_estado ON solicitud_trueque(estado);
CREATE INDEX IF NOT EXISTS idx_producto_categoria ON producto(id_categoria);
CREATE INDEX IF NOT EXISTS idx_producto_usuario ON producto(id_usuario);

-- =========================================
-- FUNCIONES
-- =========================================

CREATE OR REPLACE FUNCTION contar_productos_usuario(id_usuario_buscar INT)
RETURNS INT AS $$
DECLARE
    total INT;
BEGIN
    SELECT COUNT(*) INTO total
    FROM producto
    WHERE id_usuario = id_usuario_buscar;

    RETURN total;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION contar_productos_disponibles()
RETURNS INT AS $$
DECLARE
    total INT;
BEGIN
    SELECT COUNT(*) INTO total
    FROM producto
    WHERE estado = 'disponible';

    RETURN total;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION consultar_cantidad_producto(id_producto_buscar INT)
RETURNS NUMERIC AS $$
DECLARE
    cantidad_actual NUMERIC;
BEGIN
    SELECT cantidad INTO cantidad_actual
    FROM producto
    WHERE id_producto = id_producto_buscar;

    RETURN cantidad_actual;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- PROCEDIMIENTOS ALMACENADOS
-- =========================================

CREATE OR REPLACE PROCEDURE registrar_solicitud(
    p_mensaje VARCHAR,
    p_id_solicitado INT,
    p_id_ofrecido INT,
    p_id_usuario INT,
    p_cant_solicitada NUMERIC,
    p_cant_ofrecida NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO solicitud_trueque (
        mensaje,
        id_producto_solicitado,
        id_producto_ofrecido,
        id_usuario_solicitante,
        cantidad_solicitada,
        cantidad_ofrecida
    )
    VALUES (
        p_mensaje,
        p_id_solicitado,
        p_id_ofrecido,
        p_id_usuario,
        p_cant_solicitada,
        p_cant_ofrecida
    );
END;
$$;

-- =========================================
-- AUDITORÍAS
-- =========================================

CREATE OR REPLACE FUNCTION registrar_auditoria_trueque()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auditoria_trueque (accion, descripcion)
    VALUES (
        'INSERT',
        'Se realizo un trueque con solicitud ID ' || NEW.id_solicitud
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditoria_trueque ON trueque;
CREATE TRIGGER trg_auditoria_trueque
AFTER INSERT ON trueque
FOR EACH ROW
EXECUTE FUNCTION registrar_auditoria_trueque();

CREATE OR REPLACE FUNCTION registrar_auditoria_producto()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auditoria_producto (accion, descripcion)
    VALUES (
        'INSERT',
        'Se registro el producto ' || NEW.nombre_producto
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditoria_producto ON producto;
CREATE TRIGGER trg_auditoria_producto
AFTER INSERT ON producto
FOR EACH ROW
EXECUTE FUNCTION registrar_auditoria_producto();
