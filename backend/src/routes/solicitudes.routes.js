const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verificarToken, requiereRol } = require('../middleware/auth.middleware');
const sincronizarUsuario = require('../middleware/sincronizarUsuario.middleware');

router.get('/', verificarToken, requiereRol('usuario'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vista_solicitudes_trueque');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener solicitudes' });
  }
});

router.post('/', verificarToken, requiereRol('usuario'), sincronizarUsuario, async (req, res) => {
  try {
    const {
      mensaje,
      id_producto_solicitado,
      id_producto_ofrecido,
      cantidad_solicitada,
      cantidad_ofrecida
    } = req.body;

    const id_usuario_solicitante = req.usuarioLocal.id_usuario;

    if (!id_producto_solicitado || !id_producto_ofrecido || !cantidad_solicitada || !cantidad_ofrecida) {
      return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
    }

    await pool.query(
      'CALL registrar_solicitud($1, $2, $3, $4, $5, $6)',
      [
        mensaje || 'Solicitud de trueque',
        Number(id_producto_solicitado),
        Number(id_producto_ofrecido),
        id_usuario_solicitante,
        Number(cantidad_solicitada),
        Number(cantidad_ofrecida)
      ]
    );

    res.status(201).json({ mensaje: 'Solicitud creada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear solicitud' });
  }
});

module.exports = router;
