const pool = require('../config/db');

async function sincronizarUsuario(req, res, next) {
  try {
    if (!req.usuario || !req.usuario.userId) {
      return res.status(401).json({ error: 'Usuario autenticado no encontrado en el token' });
    }

    const authUserId = String(req.usuario.userId);
    const nombre = req.usuario.nombre || 'Usuario Nodo Travesías';

    const existente = await pool.query(
      `SELECT id_usuario, auth_user_id, nombre_completo, telefono, correo, estado, fecha_registro
       FROM usuario
       WHERE auth_user_id = $1`,
      [authUserId]
    );

    if (existente.rows.length > 0) {
      req.usuarioLocal = existente.rows[0];
      return next();
    }

    const creado = await pool.query(
      `INSERT INTO usuario (auth_user_id, nombre_completo, telefono, correo, estado)
       VALUES ($1, $2, 'Sin telefono', NULL, 'activo')
       RETURNING id_usuario, auth_user_id, nombre_completo, telefono, correo, estado, fecha_registro`,
      [authUserId, nombre]
    );

    req.usuarioLocal = creado.rows[0];
    return next();
  } catch (error) {
    console.error('[sincronizarUsuario] Error:', error.message);
    return res.status(500).json({ mensaje: 'Error al sincronizar usuario autenticado' });
  }
}

module.exports = sincronizarUsuario;
