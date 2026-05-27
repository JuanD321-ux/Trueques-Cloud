const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { userId, nombre, rol, modulo }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function requiereRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { rol } = req.usuario;
    const esAdmin = rol === 'admin';

    const tienePermiso = rolesPermitidos.some((requerido) => {
      if (requerido === 'admin') return esAdmin;
      if (requerido === 'moderador') return esAdmin || rol === 'moderador';
      if (requerido === 'usuario') return esAdmin || rol === 'moderador' || rol === 'usuario';
      return false;
    });

    if (!tienePermiso) {
      return res.status(403).json({ error: 'Sin permisos para esta acción' });
    }

    next();
  };
}

function requiereModerador(nombreModulo) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { rol, modulo } = req.usuario;
    if (rol === 'admin') return next();
    if (rol === 'moderador' && modulo === nombreModulo) return next();

    return res.status(403).json({ error: 'No eres moderador de este módulo' });
  };
}

module.exports = { verificarToken, requiereRol, requiereModerador };
