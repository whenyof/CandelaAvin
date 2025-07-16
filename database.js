const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

class VibesDatabase {
    constructor() {
        this.pool = null;
        this.initDatabase();
    }

    // Initialize database connection
    async initDatabase() {
        try {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME || 'candela_db',
                port: process.env.DB_PORT || 3306,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });

            // Test connection
            const connection = await this.pool.getConnection();
            console.log('✅ Conexión a MySQL establecida correctamente');
            connection.release();
        } catch (error) {
            console.error('❌ Error conectando a MySQL:', error.message);
            throw error;
        }
    }

    // User Management
    async createUser(userData) {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const referCode = this.generateReferCode();

            const [result] = await this.pool.execute(
                `INSERT INTO usuarios (nombre, email, password, puntos, nivel, refer_code) 
                 VALUES (?, ?, ?, 50, 'Bronce', ?)`,
                [userData.nombre, userData.email, hashedPassword, referCode]
            );

            const newUser = {
                id: result.insertId,
                nombre: userData.nombre,
                email: userData.email,
                puntos: 50,
                nivel: 'Bronce',
                refer_code: referCode,
                fecha_registro: new Date().toISOString(),
                compras_acumuladas: 0,
                sesiones_usadas: 0
            };

            // Add registration action
            await this.addAction(newUser.id, 'registro', 50, 'Registro en Vibes Points');

            return newUser;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM usuarios WHERE email = ?',
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error getting user by email:', error);
            throw error;
        }
    }

    async getUserById(id) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM usuarios WHERE id = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error getting user by id:', error);
            throw error;
        }
    }

    async updateUser(userId, updates) {
        try {
            const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const updateValues = Object.values(updates);
            updateValues.push(userId);

            await this.pool.execute(
                `UPDATE usuarios SET ${updateFields} WHERE id = ?`,
                updateValues
            );

            return await this.getUserById(userId);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Authentication
    async login(email, password) {
        try {
            const user = await this.getUserByEmail(email);
            if (user && await bcrypt.compare(password, user.password)) {
                return user;
            }
            return null;
        } catch (error) {
            console.error('Error during login:', error);
            throw error;
        }
    }

    // Points System
    async addPoints(userId, points, action, description) {
        try {
            const user = await this.getUserById(userId);
            if (!user) return false;

            const newPoints = user.puntos + points;
            
            // Update user points
            await this.updateUser(userId, { puntos: newPoints });

            // Add action
            await this.addAction(userId, action, points, description);

            // Check for level up bonus
            const newNivel = this.calculateLevel(newPoints);
            if (newNivel !== user.nivel) {
                await this.addAction(userId, 'nivel_up', 25, `¡Subiste a nivel ${newNivel}!`);
                await this.updateUser(userId, { puntos: newPoints + 25 });
            }

            return true;
        } catch (error) {
            console.error('Error adding points:', error);
            throw error;
        }
    }

    calculateLevel(points) {
        if (points >= 1000) return 'Oro';
        if (points >= 500) return 'Plata';
        return 'Bronce';
    }

    // Actions History
    async addAction(userId, tipo_accion, puntos_obtenidos, descripcion) {
        try {
            await this.pool.execute(
                `INSERT INTO acciones (usuario_id, tipo_accion, puntos_obtenidos, descripcion) 
                 VALUES (?, ?, ?, ?)`,
                [userId, tipo_accion, puntos_obtenidos, descripcion]
            );
        } catch (error) {
            console.error('Error adding action:', error);
            throw error;
        }
    }

    async getUserActions(userId) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM acciones WHERE usuario_id = ? ORDER BY fecha DESC',
                [userId]
            );
            return rows;
        } catch (error) {
            console.error('Error getting user actions:', error);
            throw error;
        }
    }

    // Rewards System
    async getAvailableRewards() {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM recompensas_disponibles WHERE activa = TRUE'
            );
            return rows;
        } catch (error) {
            console.error('Error getting available rewards:', error);
            throw error;
        }
    }

    async redeemReward(userId, rewardId) {
        try {
            const user = await this.getUserById(userId);
            const rewards = await this.getAvailableRewards();
            const reward = rewards.find(r => r.id === rewardId);

            if (!user || !reward || user.puntos < reward.puntos_requeridos) {
                return { success: false, message: 'Puntos insuficientes' };
            }

            // Calculate discount based on user level
            let discountMultiplier = 1;
            switch (user.nivel) {
                case 'Plata':
                    discountMultiplier = 0.9; // 10% extra discount
                    break;
                case 'Oro':
                    discountMultiplier = 0.85; // 15% extra discount
                    break;
            }

            const puntosUsados = Math.floor(reward.puntos_requeridos * discountMultiplier);
            
            // Update user points
            await this.updateUser(userId, {
                puntos: user.puntos - puntosUsados
            });

            // Add reward to user's rewards
            const [result] = await this.pool.execute(
                `INSERT INTO recompensas_usuarios (usuario_id, recompensa_id, puntos_usados) 
                 VALUES (?, ?, ?)`,
                [userId, rewardId, puntosUsados]
            );

            // Add action
            await this.addAction(userId, 'canje', -puntosUsados, `Canjeado: ${reward.nombre}`);

            return { 
                success: true, 
                message: `¡Recompensa canjeada! Has usado ${puntosUsados} puntos`,
                reward: {
                    id: result.insertId,
                    usuario_id: userId,
                    recompensa_id: rewardId,
                    puntos_usados: puntosUsados,
                    fecha: new Date().toISOString(),
                    usado: false
                }
            };
        } catch (error) {
            console.error('Error redeeming reward:', error);
            throw error;
        }
    }

    async getUserRewards(userId) {
        try {
            const [rows] = await this.pool.execute(
                `SELECT ru.*, rd.nombre as reward_name, rd.descripcion, rd.tipo, rd.valor
                 FROM recompensas_usuarios ru
                 JOIN recompensas_disponibles rd ON ru.recompensa_id = rd.id
                 WHERE ru.usuario_id = ?
                 ORDER BY ru.fecha DESC`,
                [userId]
            );
            return rows;
        } catch (error) {
            console.error('Error getting user rewards:', error);
            throw error;
        }
    }

    // Referral System
    async createReferral(invitadorId, invitadoEmail) {
        try {
            const [result] = await this.pool.execute(
                `INSERT INTO referidos (invitador_id, invitado_email) 
                 VALUES (?, ?)`,
                [invitadorId, invitadoEmail]
            );

            return {
                id: result.insertId,
                invitador_id: invitadorId,
                invitado_email: invitadoEmail,
                estado: 'pendiente',
                fecha: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error creating referral:', error);
            throw error;
        }
    }

    async completeReferral(invitadoEmail) {
        try {
            const [rows] = await this.pool.execute(
                `UPDATE referidos 
                 SET estado = 'completado', fecha_completado = NOW() 
                 WHERE invitado_email = ? AND estado = 'pendiente'`,
                [invitadoEmail]
            );

            if (rows.affectedRows > 0) {
                // Get the referral to add points to inviter
                const [referralRows] = await this.pool.execute(
                    'SELECT * FROM referidos WHERE invitado_email = ? AND estado = "completado"',
                    [invitadoEmail]
                );

                if (referralRows[0]) {
                    await this.addPoints(referralRows[0].invitador_id, 150, 'referido', 'Amigo registrado y compró');
                }
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error completing referral:', error);
            throw error;
        }
    }

    async getUserReferrals(userId) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM referidos WHERE invitador_id = ? ORDER BY fecha DESC',
                [userId]
            );
            return rows;
        } catch (error) {
            console.error('Error getting user referrals:', error);
            throw error;
        }
    }

    // Purchase System
    async recordPurchase(userId, amount) {
        try {
            const user = await this.getUserById(userId);
            if (!user) return false;

            // Calculate points (10 points per 10€)
            const points = Math.floor(amount / 10) * 10;
            
            // Add points
            await this.addPoints(userId, points, 'compra', `Compra de ${amount}€`);

            // Update accumulated purchases
            const newComprasAcumuladas = user.compras_acumuladas + 1;
            await this.updateUser(userId, { compras_acumuladas: newComprasAcumuladas });

            // Check for milestone bonus (every 5 purchases)
            if (newComprasAcumuladas % 5 === 0) {
                await this.addPoints(userId, 100, 'hito', '5 compras acumuladas');
            }

            return true;
        } catch (error) {
            console.error('Error recording purchase:', error);
            throw error;
        }
    }

    // Review System
    async recordReview(userId, reviewText, rating) {
        try {
            // Check if user already has a review
            const existingReview = await this.getUserReview(userId);
            
            if (!existingReview) {
                // New review: give points
                await this.pool.execute(
                    `INSERT INTO reseñas (usuario_id, texto, rating, validada) 
                     VALUES (?, ?, ?, TRUE)`,
                    [userId, reviewText, rating]
                );
                
                await this.addPoints(userId, 30, 'reseña', 'Reseña publicada');
                
                return { nueva: true };
            } else {
                // Edit review: only update text, no points
                await this.pool.execute(
                    'UPDATE reseñas SET texto = ?, fecha = NOW() WHERE usuario_id = ?',
                    [reviewText, userId]
                );
                
                return { nueva: false };
            }
        } catch (error) {
            console.error('Error recording review:', error);
            throw error;
        }
    }

    async getUserReview(userId) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM reseñas WHERE usuario_id = ?',
                [userId]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error getting user review:', error);
            throw error;
        }
    }

    async getAllReviews(validatedOnly = true) {
        try {
            const query = validatedOnly 
                ? 'SELECT r.*, u.nombre FROM reseñas r JOIN usuarios u ON r.usuario_id = u.id WHERE r.validada = TRUE ORDER BY r.fecha DESC'
                : 'SELECT r.*, u.nombre FROM reseñas r JOIN usuarios u ON r.usuario_id = u.id ORDER BY r.fecha DESC';
            
            const [rows] = await this.pool.execute(query);
            return rows;
        } catch (error) {
            console.error('Error getting all reviews:', error);
            throw error;
        }
    }

    // Utility Functions
    generateReferCode() {
        return 'VIBES' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    // Statistics
    async getUserStats(userId) {
        try {
            const user = await this.getUserById(userId);
            const actions = await this.getUserActions(userId);
            const referrals = await this.getUserReferrals(userId);
            const rewards = await this.getUserRewards(userId);

            const totalPointsEarned = actions
                .filter(a => a.puntos_obtenidos > 0)
                .reduce((sum, a) => sum + a.puntos_obtenidos, 0);

            const totalPointsSpent = actions
                .filter(a => a.puntos_obtenidos < 0)
                .reduce((sum, a) => sum + Math.abs(a.puntos_obtenidos), 0);

            const completedReferrals = referrals.filter(r => r.estado === 'completado').length;
            const pendingReferrals = referrals.filter(r => r.estado === 'pendiente').length;

            return {
                totalPointsEarned,
                totalPointsSpent,
                currentPoints: user.puntos,
                level: user.nivel,
                completedReferrals,
                pendingReferrals,
                totalRewards: rewards.length,
                usedRewards: rewards.filter(r => r.usado).length
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }

    // Close database connection
    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

// Initialize database
const vibesDB = new VibesDatabase();

// Export for use in other files
module.exports = vibesDB; 