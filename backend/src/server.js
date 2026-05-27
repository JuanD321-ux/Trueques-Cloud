const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const productosRoutes = require('./routes/productos.routes');
const solicitudesRoutes = require('./routes/solicitudes.routes');
const truequesRoutes = require('./routes/trueques.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const authRoutes = require('./routes/auth.routes');

const pool = require('./config/db');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origen) => origen.trim()) : true,
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/uploads', express.static('uploads'));
app.use('/api/trueques/uploads', express.static('uploads'));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    servicio: 'trueques',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});


app.get('/dev-token', (req, res) => {
  const esLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  const habilitado = process.env.ALLOW_DEV_TOKEN === 'true' || process.env.NODE_ENV !== 'production';

  if (!esLocal || !habilitado) {
    return res.status(403).json({ mensaje: 'Token de prueba no disponible fuera de desarrollo local' });
  }

  const payload = {
    userId: 'dev-trueques-001',
    nombre: 'Usuario de Prueba Trueques',
    rol: 'usuario',
    modulo: 'trueques'
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, usuario: payload });
});

// nginx recibe /api/trueques/productos y lo reescribe a /productos.
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/trueques/auth', authRoutes);
app.use('/productos', productosRoutes);
app.use('/solicitudes', solicitudesRoutes);
app.use('/trueques', truequesRoutes);
app.use('/usuarios', usuariosRoutes);

// Alias útiles para despliegues en nube donde no existe nginx haciendo rewrite.
app.use('/api/trueques/productos', productosRoutes);
app.use('/api/trueques/solicitudes', solicitudesRoutes);
app.use('/api/trueques/trueques', truequesRoutes);
app.use('/api/trueques/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/trueques', truequesRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.get('/api', (req, res) => {
  res.json({ mensaje: 'API de Trueques funcionando', servicio: 'trueques' });
});

app.get('/probar-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ mensaje: 'Conexión correcta a PostgreSQL', fecha: result.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error conectando a PostgreSQL' });
  }
});

// En despliegue de una sola app, Express también puede publicar el build de React.
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ mensaje: 'API de Trueques funcionando', servicio: 'trueques' });
  });
}

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`[trueques] servidor corriendo en http://localhost:${PORT}`);
});
