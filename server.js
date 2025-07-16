const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.static('.')); // Servir archivos estáticos

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'candela_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para generar código de referido
function generateReferCode() {
    return 'VIBES' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Middleware de autenticación
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
}

// Rutas de autenticación
app.post('/api/register', async (req, res) => {
    try {
        const { nombre, email, password, referCode } = req.body;
        
        // Validar datos
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        // Verificar si el email ya existe
        const [existingUsers] = await pool.execute(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        const referCodeGenerated = generateReferCode();

        // Insertar usuario
        const [result] = await pool.execute(
            'INSERT INTO usuarios (nombre, email, password, refer_code, puntos, nivel) VALUES (?, ?, ?, ?, 50, ?)',
            [nombre, email, hashedPassword, referCodeGenerated, 'Bronce']
        );

        // Si hay código de referido, crear la relación
        if (referCode) {
            const [referrer] = await pool.execute(
                'SELECT id FROM usuarios WHERE refer_code = ?',
                [referCode]
            );
            
            if (referrer.length > 0) {
                await pool.execute(
                    'INSERT INTO referidos (invitador_id, invitado_email) VALUES (?, ?)',
                    [referrer[0].id, email]
                );
            }
        }

        // Crear token JWT
        const token = jwt.sign(
            { id: result.insertId, email, nombre },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: result.insertId,
                nombre,
                email,
                puntos: 50,
                nivel: 'Bronce',
                refer_code: referCodeGenerated
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const [users] = await pool.execute(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = users[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Crear token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, nombre: user.nombre },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                puntos: user.puntos,
                nivel: user.nivel,
                refer_code: user.refer_code,
                fecha_registro: user.fecha_registro
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para obtener datos del usuario autenticado
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, nombre, email, puntos, nivel, refer_code, fecha_registro FROM usuarios WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para crear reseña
app.post('/api/reviews', authenticateToken, async (req, res) => {
    try {
        const { texto, rating } = req.body;
        const userId = req.user.id;

        // Verificar si ya tiene reseña
        const [existingReviews] = await pool.execute(
            'SELECT id FROM reseñas WHERE usuario_id = ?',
            [userId]
        );

        if (existingReviews.length > 0) {
            // Actualizar reseña existente
            await pool.execute(
                'UPDATE reseñas SET texto = ?, rating = ?, fecha = NOW() WHERE usuario_id = ?',
                [texto, rating, userId]
            );

            res.json({ 
                message: 'Reseña actualizada exitosamente'
            });
        } else {
            // Insertar nueva reseña
            await pool.execute(
                'INSERT INTO reseñas (usuario_id, texto, rating, validada) VALUES (?, ?, ?, TRUE)',
                [userId, texto, rating]
            );

            // Añadir puntos por reseña
            await pool.execute(
                'UPDATE usuarios SET puntos = puntos + 30 WHERE id = ?',
                [userId]
            );

            // Registrar acción
            await pool.execute(
                'INSERT INTO acciones (usuario_id, tipo_accion, puntos_obtenidos, descripcion) VALUES (?, ?, ?, ?)',
                [userId, 'reseña', 30, 'Reseña publicada']
            );

            res.status(201).json({ 
                message: 'Reseña enviada exitosamente',
                pointsEarned: 30
            });
        }

    } catch (error) {
        console.error('Error creando reseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para obtener reseña del usuario
app.get('/api/user/review', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [reviews] = await pool.execute(
            'SELECT * FROM reseñas WHERE usuario_id = ?',
            [userId]
        );

        if (reviews.length > 0) {
            res.json({ review: reviews[0] });
        } else {
            res.json({ review: null });
        }

    } catch (error) {
        console.error('Error obteniendo reseña del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para obtener reseñas públicas
app.get('/api/reviews/public', async (req, res) => {
    try {
        const [reviews] = await pool.execute(`
            SELECT r.id, r.texto, r.rating, r.fecha, u.nombre, u.nivel
            FROM reseñas r
            JOIN usuarios u ON r.usuario_id = u.id
            WHERE r.validada = TRUE
            ORDER BY r.fecha DESC
        `);

        res.json({ reviews });
    } catch (error) {
        console.error('Error obteniendo reseñas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para crear reserva
app.post('/api/bookings', async (req, res) => {
    try {
        const { nombre, email, telefono, servicio, fecha_evento, mensaje, userId } = req.body;

        // Insertar reserva
        const [result] = await pool.execute(
            'INSERT INTO reservas (usuario_id, nombre, email, telefono, servicio, fecha_evento, mensaje) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId || null, nombre, email, telefono, servicio, fecha_evento, mensaje]
        );

        res.status(201).json({
            message: 'Reserva creada exitosamente',
            bookingId: result.insertId
        });

    } catch (error) {
        console.error('Error creando reserva:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para crear una reserva
app.post('/api/reservas', async (req, res) => {
    try {
        const { name, email, phone, service, date, message } = req.body;
        if (!name || !email || !phone || !service || !message) {
            return res.status(400).json({ error: 'Todos los campos obligatorios deben estar completos.' });
        }
        // Crear tabla si no existe
        await pool.execute(`CREATE TABLE IF NOT EXISTS reservas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            phone VARCHAR(30) NOT NULL,
            service VARCHAR(50) NOT NULL,
            date DATE,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        // Insertar reserva
        await pool.execute(
            'INSERT INTO reservas (name, email, phone, service, date, message) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, phone, service, date || null, message]
        );
        res.status(201).json({ message: 'Reserva registrada correctamente.' });
    } catch (error) {
        console.error('Error al registrar reserva:', error);
        res.status(500).json({ error: 'Error interno del servidor al registrar la reserva.' });
    }
});

// Ruta para obtener estadísticas del usuario
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Obtener estadísticas usando la vista
        const [stats] = await pool.execute(
            'SELECT * FROM vista_usuarios_stats WHERE id = ?',
            [userId]
        );

        if (stats.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ stats: stats[0] });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para obtener acciones del usuario
app.get('/api/user/actions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [actions] = await pool.execute(
            'SELECT * FROM acciones WHERE usuario_id = ? ORDER BY fecha DESC',
            [userId]
        );

        res.json({ actions });
    } catch (error) {
        console.error('Error obteniendo acciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para obtener recompensas disponibles
app.get('/api/rewards', async (req, res) => {
    try {
        const [rewards] = await pool.execute(
            'SELECT * FROM recompensas_disponibles WHERE activa = TRUE ORDER BY puntos_requeridos'
        );

        res.json({ rewards });
    } catch (error) {
        console.error('Error obteniendo recompensas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para canjear recompensa
app.post('/api/rewards/redeem', authenticateToken, async (req, res) => {
    try {
        const { rewardId } = req.body;
        const userId = req.user.id;

        // Obtener datos del usuario y la recompensa
        const [users] = await pool.execute('SELECT puntos, nivel FROM usuarios WHERE id = ?', [userId]);
        const [rewards] = await pool.execute('SELECT * FROM recompensas_disponibles WHERE id = ?', [rewardId]);

        if (users.length === 0 || rewards.length === 0) {
            return res.status(404).json({ error: 'Usuario o recompensa no encontrado' });
        }

        const user = users[0];
        const reward = rewards[0];

        // Verificar si tiene suficientes puntos
        if (user.puntos < reward.puntos_requeridos) {
            return res.status(400).json({ error: 'Puntos insuficientes' });
        }

        // Calcular descuento según nivel
        let discountMultiplier = 1;
        if (user.nivel === 'Plata') discountMultiplier = 0.9;
        else if (user.nivel === 'Oro') discountMultiplier = 0.85;

        const puntosUsados = Math.floor(reward.puntos_requeridos * discountMultiplier);

        // Actualizar puntos del usuario
        await pool.execute(
            'UPDATE usuarios SET puntos = puntos - ? WHERE id = ?',
            [puntosUsados, userId]
        );

        // Registrar recompensa canjeada
        await pool.execute(
            'INSERT INTO recompensas_usuarios (usuario_id, recompensa_id, puntos_usados) VALUES (?, ?, ?)',
            [userId, rewardId, puntosUsados]
        );

        // Registrar acción
        await pool.execute(
            'INSERT INTO acciones (usuario_id, tipo_accion, puntos_obtenidos, descripcion) VALUES (?, ?, ?, ?)',
            [userId, 'canje', -puntosUsados, `Canjeado: ${reward.nombre}`]
        );

        res.json({
            message: 'Recompensa canjeada exitosamente',
            pointsUsed: puntosUsados,
            reward: reward
        });

    } catch (error) {
        console.error('Error canjeando recompensa:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para servir la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para servir el dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal!' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Base de datos conectada: ${process.env.DB_NAME}`);
}); 