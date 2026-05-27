const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const upload = require('../config/multer');
const { verificarToken, requiereRol } = require('../middleware/auth.middleware');
const sincronizarUsuario = require('../middleware/sincronizarUsuario.middleware');

router.get('/categorias', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_categoria, nombre_categoria, descripcion FROM categoria ORDER BY id_categoria ASC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener categorías' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vista_productos_publicados');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener productos' });
  }
});

router.post('/', verificarToken, requiereRol('usuario'), sincronizarUsuario, upload.single('imagen'), async (req, res) => {
  try {
    const body = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => [key.trim(), value])
    );

    const { nombre_producto, descripcion, cantidad, unidad_medida, id_categoria } = body;
    const id_usuario = req.usuarioLocal.id_usuario;
    const imagen = req.file ? `uploads/${req.file.filename}` : null;

    if (!nombre_producto || !cantidad || !unidad_medida || !id_categoria) {
      return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
    }

    const result = await pool.query(
      `INSERT INTO producto (
        nombre_producto, descripcion, cantidad, unidad_medida, imagen, id_usuario, id_categoria
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [nombre_producto, descripcion || null, Number(cantidad), unidad_medida, imagen, id_usuario, Number(id_categoria)]
    );

    res.status(201).json({ mensaje: 'Producto registrado correctamente', producto: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar producto' });
  }
});

router.delete('/:id', verificarToken, requiereRol('admin'), async (req, res) => {
  const client = await pool.connect();

  try {
    const idProducto = Number(req.params.id);

    if (!idProducto) {
      return res.status(400).json({ mensaje: 'ID de producto inválido' });
    }

    await client.query('BEGIN');

    const producto = await client.query(
      'SELECT id_producto, nombre_producto FROM producto WHERE id_producto = $1',
      [idProducto]
    );

    if (producto.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'El producto no existe' });
    }

    await client.query(
      `DELETE FROM trueque
       WHERE id_solicitud IN (
         SELECT id_solicitud
         FROM solicitud_trueque
         WHERE id_producto_solicitado = $1
            OR id_producto_ofrecido = $1
       )`,
      [idProducto]
    );

    await client.query(
      `DELETE FROM solicitud_trueque
       WHERE id_producto_solicitado = $1
          OR id_producto_ofrecido = $1`,
      [idProducto]
    );

    await client.query(
      'DELETE FROM producto WHERE id_producto = $1',
      [idProducto]
    );

    await client.query('COMMIT');

    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar producto' });
  } finally {
    client.release();
  }
});

module.exports = router;