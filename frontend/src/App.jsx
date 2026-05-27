import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './App.css'

const API = import.meta.env.VITE_API_TRUEQUES_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3003' : '/api/trueques')

function obtenerToken() {
  return localStorage.getItem('token')
}

function leerUsuarioDesdeToken() {
  const token = obtenerToken()
  if (!token) return null

  try {
    const parte = token.split('.')[1]
    const padded = parte + '==='.slice((parte.length + 3) % 4)
    const json = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json)

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token')
      return null
    }

    return payload
  } catch {
    return null
  }
}

function authHeaders() {
  const token = obtenerToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function numeroLimpio(valor) {
  const numero = Number(valor)
  if (Number.isNaN(numero)) return valor
  return Number.isInteger(numero) ? String(numero) : numero.toFixed(2).replace(/\.?0+$/, '')
}

function singularizarUnidad(unidad = '') {
  const texto = String(unidad).trim().toLowerCase()
  const mapa = {
    kilos: 'kilo',
    libras: 'libra',
    racimos: 'racimo',
    unidades: 'unidad'
  }

  return mapa[texto] || texto.replace(/s$/, '')
}

function pluralizarUnidad(unidad = '', cantidad = 0) {
  const numero = Number(cantidad)
  const texto = String(unidad || '').trim()
  if (!texto) return ''

  if (numero === 1) {
    return singularizarUnidad(texto)
  }

  return texto
}

function formatearCantidadUnidad(cantidad, unidad) {
  const textoCantidad = numeroLimpio(cantidad)
  const textoUnidad = pluralizarUnidad(unidad, cantidad)
  return `${textoCantidad} ${textoUnidad}`.trim()
}

function formatearDisponibles(cantidad, unidad) {
  const disponible = Number(cantidad) === 1 ? 'disponible' : 'disponibles'
  return `${formatearCantidadUnidad(cantidad, unidad)} ${disponible}`.trim()
}

function App() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [historial, setHistorial] = useState([])
  const [usuarioLocal, setUsuarioLocal] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [pestana, setPestana] = useState('productos')
  const [modalPublicar, setModalPublicar] = useState(false)
  const [modalSolicitud, setModalSolicitud] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [tokenVersion, setTokenVersion] = useState(0)
  const [formLogin, setFormLogin] = useState({ email: 'usuario@demo.com', password: '123456' })

  const usuarioAuth = useMemo(() => leerUsuarioDesdeToken(), [tokenVersion])
  const esAdmin = usuarioAuth?.rol === 'admin'

  const [formProducto, setFormProducto] = useState({
    nombre_producto: '',
    descripcion: '',
    cantidad: '',
    unidad_medida: 'kilos',
    id_categoria: '',
    imagen: null
  })

  const [formSolicitud, setFormSolicitud] = useState({
    id_producto_ofrecido: '',
    cantidad_solicitada: '',
    cantidad_ofrecida: '',
    mensaje: ''
  })

  useEffect(() => {
    cargarProductos()
    cargarCategorias()
  }, [])

  useEffect(() => {
    sincronizarUsuario()
    if (usuarioAuth) {
      cargarSolicitudes()
      cargarHistorial()
    } else {
      setUsuarioLocal(null)
      setSolicitudes([])
      setHistorial([])
    }
  }, [tokenVersion])

  const limpiarMensaje = () => {
    setTimeout(() => setMensaje(''), 4500)
  }

  const mostrarMensaje = (texto) => {
    setMensaje(texto)
    limpiarMensaje()
  }

  const cargarProductos = async () => {
    try {
      const res = await axios.get(`${API}/productos`)
      setProductos(res.data)
    } catch (error) {
      mostrarMensaje('No se pudieron cargar los productos.')
    }
  }

  const cargarCategorias = async () => {
    try {
      const res = await axios.get(`${API}/productos/categorias`)
      setCategorias(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  const sincronizarUsuario = async () => {
    if (!obtenerToken()) return

    try {
      const res = await axios.get(`${API}/usuarios/me`, {
        headers: authHeaders()
      })
      setUsuarioLocal(res.data.usuarioTrueques)
    } catch (error) {
      mostrarMensaje('No se pudo sincronizar el usuario autenticado con Trueques.')
    }
  }

  const cargarSolicitudes = async () => {
    if (!obtenerToken()) return

    try {
      const res = await axios.get(`${API}/solicitudes`, { headers: authHeaders() })
      setSolicitudes(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  const cargarHistorial = async () => {
    if (!obtenerToken()) return

    try {
      const res = await axios.get(`${API}/trueques`, { headers: authHeaders() })
      setHistorial(res.data)
    } catch (error) {
      console.error(error)
    }
  }


  const iniciarSesionDemo = async (e) => {
    e.preventDefault()

    try {
      setCargando(true)
      const res = await axios.post(`${API}/auth/demo-login`, formLogin)
      localStorage.setItem('token', res.data.token)
      setTokenVersion((valor) => valor + 1)
      mostrarMensaje(`Bienvenido, ${res.data.usuario.nombre}.`)
    } catch (error) {
      mostrarMensaje(error.response?.data?.mensaje || 'No se pudo iniciar sesión demo.')
    } finally {
      setCargando(false)
    }
  }

  const entrarComoAdminDemo = async () => {
    const datosAdmin = { email: 'admin@demo.com', password: 'admin123' }
    setFormLogin(datosAdmin)

    try {
      setCargando(true)
      const res = await axios.post(`${API}/auth/demo-login`, datosAdmin)
      localStorage.setItem('token', res.data.token)
      setTokenVersion((valor) => valor + 1)
      mostrarMensaje(`Bienvenido, ${res.data.usuario.nombre}.`)
    } catch (error) {
      mostrarMensaje(error.response?.data?.mensaje || 'No se pudo iniciar sesión como administrador demo.')
    } finally {
      setCargando(false)
    }
  }

  const activarModoPrueba = async () => {
    try {
      const res = await axios.get(`${API}/dev-token`)
      localStorage.setItem('token', res.data.token)
      setTokenVersion((valor) => valor + 1)
      mostrarMensaje('Modo prueba local activado. Ya puedes publicar y solicitar trueques.')
    } catch (error) {
      mostrarMensaje('No se pudo activar el modo prueba local.')
    }
  }

  const cerrarSesionLocal = () => {
    localStorage.removeItem('token')
    setTokenVersion((valor) => valor + 1)
    mostrarMensaje('Sesión local cerrada.')
  }

  const abrirSolicitud = (producto) => {
    if (!usuarioAuth) {
      mostrarMensaje('Para solicitar un trueque primero debes iniciar sesión o activar el modo prueba local.')
      return
    }

    setModalSolicitud(producto)
    setFormSolicitud({
      id_producto_ofrecido: '',
      cantidad_solicitada: '',
      cantidad_ofrecida: '',
      mensaje: `Me interesa hacer trueque por ${producto.nombre_producto}.`
    })
  }

  const eliminarProducto = async (producto) => {
    if (!esAdmin) {
      mostrarMensaje('Solo el administrador puede eliminar publicaciones.')
      return
    }

    const confirmar = window.confirm(`¿Seguro que deseas eliminar la publicación de ${producto.nombre_producto}?`)
    if (!confirmar) return

    try {
      setCargando(true)

      await axios.delete(`${API}/productos/${producto.id_producto}`, {
        headers: authHeaders()
      })

      mostrarMensaje('Publicación eliminada correctamente.')
      cargarProductos()
      cargarSolicitudes()
      cargarHistorial()
    } catch (error) {
      mostrarMensaje(error.response?.data?.mensaje || 'No se pudo eliminar la publicación.')
    } finally {
      setCargando(false)
    }
  }

  const volverAtras = () => {
    if (modalSolicitud) {
      setModalSolicitud(null)
      return
    }

    if (modalPublicar) {
      setModalPublicar(false)
      return
    }

    if (pestana !== 'productos') {
      setPestana('productos')
      return
    }

    if (window.history.length > 1) {
      window.history.back()
    }
  }

  const enviarSolicitud = async (e) => {
    e.preventDefault()

    if (!modalSolicitud) return

    try {
      setCargando(true)
      await axios.post(`${API}/solicitudes`, {
        id_producto_solicitado: modalSolicitud.id_producto,
        id_producto_ofrecido: Number(formSolicitud.id_producto_ofrecido),
        cantidad_solicitada: Number(formSolicitud.cantidad_solicitada),
        cantidad_ofrecida: Number(formSolicitud.cantidad_ofrecida),
        mensaje: formSolicitud.mensaje
      }, { headers: authHeaders() })

      setModalSolicitud(null)
      mostrarMensaje('Solicitud de trueque creada correctamente.')
      cargarSolicitudes()
    } catch (error) {
      mostrarMensaje(error.response?.data?.mensaje || 'No se pudo crear la solicitud.')
    } finally {
      setCargando(false)
    }
  }

  const publicarProducto = async (e) => {
    e.preventDefault()

    try {
      setCargando(true)
      const data = new FormData()
      data.append('nombre_producto', formProducto.nombre_producto)
      data.append('descripcion', formProducto.descripcion)
      data.append('cantidad', formProducto.cantidad)
      data.append('unidad_medida', formProducto.unidad_medida)
      data.append('id_categoria', formProducto.id_categoria)
      if (formProducto.imagen) {
        data.append('imagen', formProducto.imagen)
      }

      await axios.post(`${API}/productos`, data, {
        headers: {
          ...authHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      })

      setModalPublicar(false)
      setFormProducto({
        nombre_producto: '',
        descripcion: '',
        cantidad: '',
        unidad_medida: 'kilos',
        id_categoria: '',
        imagen: null
      })
      mostrarMensaje('Producto publicado correctamente.')
      cargarProductos()
    } catch (error) {
      mostrarMensaje(error.response?.data?.mensaje || 'No se pudo publicar el producto.')
    } finally {
      setCargando(false)
    }
  }

  const confirmarTrueque = async (solicitud) => {
    try {
      setCargando(true)
      await axios.post(`${API}/trueques`, {
        id_solicitud: solicitud.id_solicitud,
        observacion: 'Trueque confirmado desde la interfaz web'
      }, { headers: authHeaders() })

      mostrarMensaje('Trueque confirmado. Las cantidades fueron actualizadas.')
      cargarProductos()
      cargarSolicitudes()
      cargarHistorial()
    } catch (error) {
      mostrarMensaje(error.response?.data?.mensaje || 'No se pudo confirmar el trueque.')
    } finally {
      setCargando(false)
    }
  }

  const productosOfrecibles = productos.filter((p) => p.id_producto !== modalSolicitud?.id_producto && p.estado !== 'agotado')

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="tag">Economía comunitaria</p>
          <h1>Trueques Comunitarios</h1>
          <p>Intercambia productos del campo sin usar dinero.</p>
        </div>

        <div className="usuario-box">
          <label>Usuario autenticado</label>
          {usuarioAuth ? (
            <div>
              <strong>{usuarioAuth.nombre}</strong>
              <p>Rol: {usuarioAuth.rol}</p>
              {usuarioLocal && <small>ID local Trueques: {usuarioLocal.id_usuario}</small>}
              <button className="btn-link" onClick={cerrarSesionLocal}>Cerrar sesión local</button>
            </div>
          ) : (
            <div>
              <p>Inicia sesión para publicar, solicitar y confirmar trueques.</p>

              <form className="login-demo" onSubmit={iniciarSesionDemo}>
                <input
                  type="email"
                  value={formLogin.email}
                  onChange={(e) => setFormLogin({ ...formLogin, email: e.target.value })}
                  placeholder="usuario@demo.com"
                  required
                />
                <input
                  type="password"
                  value={formLogin.password}
                  onChange={(e) => setFormLogin({ ...formLogin, password: e.target.value })}
                  placeholder="Contraseña"
                  required
                />
                <button className="btn-mini" type="submit" disabled={cargando}>Entrar</button>
              </form>

              <div className="credenciales-demo">
                <small>Usuario: usuario@demo.com / 123456</small>
                <small>Admin: admin@demo.com / admin123</small>
              </div>

              <button className="btn-link" type="button" onClick={entrarComoAdminDemo} disabled={cargando}>
                Entrar como administrador demo
              </button>

              {window.location.hostname === 'localhost' && (
                <button className="btn-mini" onClick={activarModoPrueba}>Token rápido local</button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="barra-superior">
        <button type="button" className="btn-volver" onClick={volverAtras}>
          ← Volver
        </button>

        <nav className="tabs">
          <button className={pestana === 'productos' ? 'active' : ''} onClick={() => setPestana('productos')}>Productos</button>
          <button className={pestana === 'solicitudes' ? 'active' : ''} onClick={() => setPestana('solicitudes')} disabled={!usuarioAuth}>Solicitudes</button>
          <button className={pestana === 'historial' ? 'active' : ''} onClick={() => setPestana('historial')} disabled={!usuarioAuth}>Historial</button>
        </nav>
      </div>

      {mensaje && <p className="mensaje-alerta">{mensaje}</p>}

      {pestana === 'productos' && (
        <main>
          <div className="section-title">
            <h2>Productos disponibles</h2>
            <button className="btn-primary" disabled={!usuarioAuth} onClick={() => setModalPublicar(true)}>+ Publicar producto</button>
          </div>

          <section className="grid-productos">
            {productos.map((p) => (
              <div className="card" key={p.id_producto}>
                <img
                  src={p.imagen ? `${API}/${p.imagen}` : 'https://via.placeholder.com/300x180'}
                  alt={p.nombre_producto}
                />

                <div className="card-body">
                  <span className="categoria">{p.nombre_categoria}</span>
                  <h3>{p.nombre_producto}</h3>
                  <p className="cantidad">{formatearDisponibles(p.cantidad, p.unidad_medida)}</p>
                  <p className="usuario">Publicado por: {p.publicado_por}</p>

                  <button className="btn-card" disabled={!usuarioAuth} onClick={() => abrirSolicitud(p)}>Solicitar trueque</button>

                  {esAdmin && (
                    <button
                      className="btn-card btn-danger"
                      disabled={cargando}
                      onClick={() => eliminarProducto(p)}
                    >
                      Eliminar publicación
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>
        </main>
      )}

      {pestana === 'solicitudes' && (
        <main>
          <div className="section-title">
            <h2>Solicitudes de trueque</h2>
            <button className="btn-primary" onClick={cargarSolicitudes}>Actualizar</button>
          </div>

          <section className="lista">
            {solicitudes.length === 0 && <p className="vacio">No hay solicitudes registradas.</p>}
            {solicitudes.map((s) => (
              <article className="fila" key={s.id_solicitud}>
                <div>
                  <strong>{s.solicitante}</strong>
                  <p>
                    Solicita {formatearCantidadUnidad(s.cantidad_solicitada, s.unidad_solicitada)} de {s.producto_solicitado}
                    {' '}y ofrece {formatearCantidadUnidad(s.cantidad_ofrecida, s.unidad_ofrecida)} de {s.producto_ofrecido}.
                  </p>
                  <small>Estado: {s.estado} · {s.mensaje}</small>
                </div>
                <button className="btn-card btn-small" disabled={s.estado !== 'pendiente' || cargando} onClick={() => confirmarTrueque(s)}>Confirmar</button>
              </article>
            ))}
          </section>
        </main>
      )}

      {pestana === 'historial' && (
        <main>
          <div className="section-title">
            <h2>Historial de trueques</h2>
            <button className="btn-primary" onClick={cargarHistorial}>Actualizar</button>
          </div>

          <section className="lista">
            {historial.length === 0 && <p className="vacio">Aún no hay trueques confirmados.</p>}
            {historial.map((t) => (
              <article className="fila" key={t.id_trueque}>
                <div>
                  <strong>{t.solicitante}</strong>
                  <p>Cambió {t.solicitado} por {t.ofrecido}.</p>
                  <small>Estado: {t.estado}</small>
                </div>
              </article>
            ))}
          </section>
        </main>
      )}

      {modalSolicitud && (
        <div className="modal-fondo">
          <form className="modal" onSubmit={enviarSolicitud}>
            <h2>Solicitar trueque</h2>
            <p className="modal-desc">Producto que quieres recibir: <strong>{modalSolicitud.nombre_producto}</strong></p>

            <label>Cantidad que solicitas</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formSolicitud.cantidad_solicitada}
              onChange={(e) => setFormSolicitud({ ...formSolicitud, cantidad_solicitada: e.target.value })}
              placeholder={`Ej: 1 ${singularizarUnidad(modalSolicitud.unidad_medida)}`}
              required
            />

            <label>Producto que ofreces</label>
            <select
              value={formSolicitud.id_producto_ofrecido}
              onChange={(e) => setFormSolicitud({ ...formSolicitud, id_producto_ofrecido: e.target.value })}
              required
            >
              <option value="">Selecciona un producto</option>
              {productosOfrecibles.map((p) => (
                <option key={p.id_producto} value={p.id_producto}>
                  {p.nombre_producto} ({formatearDisponibles(p.cantidad, p.unidad_medida)})
                </option>
              ))}
            </select>

            <label>Cantidad que ofreces</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formSolicitud.cantidad_ofrecida}
              onChange={(e) => setFormSolicitud({ ...formSolicitud, cantidad_ofrecida: e.target.value })}
              placeholder="Ej: 2"
              required
            />

            <label>Mensaje</label>
            <textarea
              value={formSolicitud.mensaje}
              onChange={(e) => setFormSolicitud({ ...formSolicitud, mensaje: e.target.value })}
              rows="3"
            />

            <div className="modal-actions">
              <button type="button" className="btn-secundario" onClick={() => setModalSolicitud(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={cargando}>Crear solicitud</button>
            </div>
          </form>
        </div>
      )}

      {modalPublicar && (
        <div className="modal-fondo">
          <form className="modal" onSubmit={publicarProducto}>
            <h2>Publicar producto</h2>

            <label>Nombre del producto</label>
            <input
              value={formProducto.nombre_producto}
              onChange={(e) => setFormProducto({ ...formProducto, nombre_producto: e.target.value })}
              placeholder="Ej: Maíz"
              required
            />

            <label>Descripción</label>
            <textarea
              value={formProducto.descripcion}
              onChange={(e) => setFormProducto({ ...formProducto, descripcion: e.target.value })}
              rows="3"
              placeholder="Descripción breve del producto"
            />

            <div className="form-grid">
              <div>
                <label>Cantidad</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formProducto.cantidad}
                  onChange={(e) => setFormProducto({ ...formProducto, cantidad: e.target.value })}
                  required
                />
              </div>

              <div>
                <label>Unidad</label>
                <select
                  value={formProducto.unidad_medida}
                  onChange={(e) => setFormProducto({ ...formProducto, unidad_medida: e.target.value })}
                  required
                >
                  <option value="kilos">kilos</option>
                  <option value="libras">libras</option>
                  <option value="racimos">racimos</option>
                  <option value="unidades">unidades</option>
                </select>
              </div>
            </div>

            <label>Categoría</label>
            <select
              value={formProducto.id_categoria}
              onChange={(e) => setFormProducto({ ...formProducto, id_categoria: e.target.value })}
              required
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
              ))}
            </select>

            <label>Imagen</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => setFormProducto({ ...formProducto, imagen: e.target.files[0] })}
            />

            <div className="modal-actions">
              <button type="button" className="btn-secundario" onClick={() => setModalPublicar(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={cargando}>Publicar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default App