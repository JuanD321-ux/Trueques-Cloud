const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

const cuentasDemo = [
  {
    email: 'usuario@demo.com',
    password: '123456',
    userId: 'demo-usuario-001',
    nombre: 'Usuario Demo',
    rol: 'usuario',
    modulo: 'trueques'
  },
  {
    email: 'admin@demo.com',
    password: 'admin123',
    userId: 'demo-admin-001',
    nombre: 'Administrador Demo',
    rol: 'admin',
    modulo: 'trueques'
  }
];

function demoLoginHabilitado() {
  return process.env.ALLOW_DEMO_LOGIN === 'true' || process.env.ALLOW_DEV_TOKEN === 'true';
}

router.post('/demo-login', (req, res) => {
  if (!demoLoginHabilitado()) {
    return res.status(403).json({ mensaje: 'El login demo no está habilitado en este entorno' });
  }

  const { email, password } = req.body || {};
  const cuenta = cuentasDemo.find(
    (item) => item.email === String(email || '').trim().toLowerCase() && item.password === String(password || '')
  );

  if (!cuenta) {
    return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ mensaje: 'Falta configurar JWT_SECRET en el servidor' });
  }

  const { password: _password, email: _email, ...payload } = cuenta;
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  res.json({
    token,
    usuario: payload,
    mensaje: 'Inicio de sesión demo correcto'
  });
});

module.exports = router;
