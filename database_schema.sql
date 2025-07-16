-- Base de datos para Candela - Maquillaje Profesional
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS candela_db;
USE candela_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    refer_code VARCHAR(20) UNIQUE,
    puntos INT DEFAULT 50,
    nivel VARCHAR(20) DEFAULT 'Bronce',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de acciones/historial de puntos
CREATE TABLE acciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo_accion VARCHAR(50) NOT NULL,
    puntos_obtenidos INT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_fecha (usuario_id, fecha)
);

-- Tabla de reseñas
CREATE TABLE reseñas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    texto TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validada BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_review (usuario_id),
    INDEX idx_rating (rating),
    INDEX idx_fecha (fecha)
);

-- Tabla de reservas/citas
CREATE TABLE reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    servicio ENUM('boda', 'evento', 'artistico', 'teatro', 'consulta') NOT NULL,
    fecha_evento DATE,
    mensaje TEXT,
    estado ENUM('pendiente', 'confirmada', 'cancelada', 'completada') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_estado (estado),
    INDEX idx_fecha_evento (fecha_evento),
    INDEX idx_email (email)
);

-- Tabla de referidos
CREATE TABLE referidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invitador_id INT NOT NULL,
    invitado_email VARCHAR(100) NOT NULL,
    estado ENUM('pendiente', 'completado') DEFAULT 'pendiente',
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_completado TIMESTAMP NULL,
    FOREIGN KEY (invitador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_invitador (invitador_id),
    INDEX idx_invitado_email (invitado_email)
);

-- Tabla de recompensas disponibles
CREATE TABLE recompensas_disponibles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    puntos_requeridos INT NOT NULL,
    descripcion TEXT,
    tipo ENUM('descuento', 'porcentaje', 'gratis') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    activa BOOLEAN DEFAULT TRUE
);

-- Tabla de recompensas canjeadas por usuarios
CREATE TABLE recompensas_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    recompensa_id INT NOT NULL,
    puntos_usados INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (recompensa_id) REFERENCES recompensas_disponibles(id),
    INDEX idx_usuario_fecha (usuario_id, fecha)
);

-- Insertar recompensas por defecto
INSERT INTO recompensas_disponibles (nombre, puntos_requeridos, descripcion, tipo, valor) VALUES
('5€ de descuento', 300, 'Descuento de 5€ en tu próxima sesión', 'descuento', 5.00),
('10€ de descuento', 500, 'Descuento de 10€ en tu próxima sesión', 'descuento', 10.00),
('50% en próxima sesión', 800, '50% de descuento en tu próxima sesión', 'porcentaje', 50.00),
('Sesión gratuita', 1200, 'Una sesión completamente gratis', 'gratis', 100.00);

-- Crear vistas útiles para consultas frecuentes
CREATE VIEW vista_usuarios_stats AS
SELECT 
    u.id,
    u.nombre,
    u.email,
    u.puntos,
    u.nivel,
    u.fecha_registro,
    COUNT(DISTINCT r.id) as total_reseñas,
    COUNT(DISTINCT res.id) as total_reservas,
    COUNT(DISTINCT ref.id) as total_referidos,
    SUM(CASE WHEN a.puntos_obtenidos > 0 THEN a.puntos_obtenidos ELSE 0 END) as puntos_ganados,
    SUM(CASE WHEN a.puntos_obtenidos < 0 THEN ABS(a.puntos_obtenidos) ELSE 0 END) as puntos_gastados
FROM usuarios u
LEFT JOIN reseñas r ON u.id = r.usuario_id
LEFT JOIN reservas res ON u.id = res.usuario_id
LEFT JOIN referidos ref ON u.id = ref.invitador_id
LEFT JOIN acciones a ON u.id = a.usuario_id
GROUP BY u.id;

-- Crear procedimiento para actualizar nivel de usuario
DELIMITER //
CREATE PROCEDURE actualizar_nivel_usuario(IN user_id INT)
BEGIN
    DECLARE user_points INT;
    DECLARE new_level VARCHAR(10);
    
    SELECT puntos INTO user_points FROM usuarios WHERE id = user_id;
    
    IF user_points >= 1000 THEN
        SET new_level = 'Oro';
    ELSEIF user_points >= 500 THEN
        SET new_level = 'Plata';
    ELSE
        SET new_level = 'Bronce';
    END IF;
    
    UPDATE usuarios SET nivel = new_level WHERE id = user_id;
END //
DELIMITER ;

-- Crear trigger para actualizar nivel automáticamente
DELIMITER //
CREATE TRIGGER trigger_actualizar_nivel
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
    IF OLD.puntos != NEW.puntos THEN
        CALL actualizar_nivel_usuario(NEW.id);
    END IF;
END //
DELIMITER ; 