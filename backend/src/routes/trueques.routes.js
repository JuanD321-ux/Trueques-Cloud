const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verificarToken, requiereRol } = require('../middleware/auth.middleware');

// GET listar trueques
router.get('/', verificarToken, requiereRol('usuario'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vista_trueques');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener trueques' });
    }
});

// POST confirmar trueque
router.post('/', verificarToken, requiereRol('usuario'), async (req, res) => {
    try {
        const { id_solicitud, observacion } = req.body;

        if (!id_solicitud) {
            return res.status(400).json({ mensaje: 'Falta el id_solicitud' });
        }

        // 1. Verificar que la solicitud exista
        const solicitudResult = await pool.query(
            `SELECT 
                st.id_solicitud,
                st.estado,
                st.cantidad_solicitada,
                st.cantidad_ofrecida,
                ps.id_producto AS id_producto_solicitado,
                ps.nombre_producto AS producto_solicitado,
                ps.cantidad AS cantidad_producto_solicitado,
                po.id_producto AS id_producto_ofrecido,
                po.nombre_producto AS producto_ofrecido,
                po.cantidad AS cantidad_producto_ofrecido
            FROM solicitud_trueque st
            JOIN producto ps ON st.id_producto_solicitado = ps.id_producto
            JOIN producto po ON st.id_producto_ofrecido = po.id_producto
            WHERE st.id_solicitud = $1`,
            [id_solicitud]
        );

        if (solicitudResult.rows.length === 0) {
            return res.status(404).json({ mensaje: 'La solicitud no existe' });
        }

        const solicitud = solicitudResult.rows[0];

        // 2. Validar que esté pendiente
        if (solicitud.estado !== 'pendiente') {
            return res.status(400).json({
                mensaje: 'La solicitud no está pendiente'
            });
        }

        // 3. Validar que no esté confirmada antes
        const truequeExistente = await pool.query(
            'SELECT * FROM trueque WHERE id_solicitud = $1',
            [id_solicitud]
        );

        if (truequeExistente.rows.length > 0) {
            return res.status(400).json({
                mensaje: 'Esta solicitud ya fue confirmada en un trueque'
            });
        }

        // 4. Validar cantidades disponibles
        if (Number(solicitud.cantidad_producto_solicitado) < Number(solicitud.cantidad_solicitada)) {
            return res.status(400).json({
                mensaje: `No hay suficiente cantidad disponible de ${solicitud.producto_solicitado}`
            });
        }

        if (Number(solicitud.cantidad_producto_ofrecido) < Number(solicitud.cantidad_ofrecida)) {
            return res.status(400).json({
                mensaje: `No hay suficiente cantidad disponible de ${solicitud.producto_ofrecido}`
            });
        }

        // 5. Confirmar trueque
        await pool.query(
            `INSERT INTO trueque (id_solicitud, observacion)
             VALUES ($1, $2)`,
            [
                id_solicitud,
                observacion || 'Trueque confirmado desde API'
            ]
        );

        // 6. Cambiar estado de la solicitud a confirmada
        await pool.query(
            `UPDATE solicitud_trueque 
             SET estado = 'confirmada'
             WHERE id_solicitud = $1`,
            [id_solicitud]
        );

        res.json({ mensaje: 'Trueque confirmado correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al confirmar trueque' });
    }
});

module.exports = router;