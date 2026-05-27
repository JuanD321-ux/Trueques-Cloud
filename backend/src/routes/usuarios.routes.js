const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verificarToken, requiereRol } = require('../middleware/auth.middleware');
const sincronizarUsuario = require('../middleware/sincronizarUsuario.middleware');

// Perfil local del usuario autenticado. Si no existe en Trueques, se crea.
router.get('/me', verificarToken, sincronizarUsuario, async (req, res) => {
  res.json({ usuarioAuth: req.usuario, usuarioTrueques: req.usuarioLocal });
});

// Listar usuarios locales del módulo. Solo admin/moderador del módulo.
router.get('/', verificarToken, requiereRol('moderador'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_usuario, auth_user_id, nombre_completo, telefono, correo, estado, fecha_registro
      FROM usuario
      ORDER BY id_usuario ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
});

// Registrar usuario manual se deja solo para pruebas/admin; el flujo normal usa /usuarios/me.
router.post('/', verificarToken, requiereRol('admin'), async (req, res) => {
  try {
    const { auth_user_id, nombre_completo, telefono, correo } = req.body;

    if (!nombre_completo) {
      return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
    }

    const result = await pool.query(
      `INSERT INTO usuario (auth_user_id, nombre_completo, telefono, correo)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [auth_user_id || null, nombre_completo, telefono || null, correo || null]
    );

    res.status(201).json({ mensaje: 'Usuario registrado correctamente', usuario: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar usuario' });
  }
});

module.exports = router;
