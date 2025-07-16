const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config({ path: './config.env' });

// Simular localStorage para leer datos existentes
class LocalStorageSimulator {
    constructor() {
        this.data = {};
        this.loadFromFile();
    }

    loadFromFile() {
        try {
            if (fs.existsSync('./localstorage_backup.json')) {
                this.data = JSON.parse(fs.readFileSync('./localstorage_backup.json', 'utf8'));
                console.log('📁 Datos de localStorage cargados desde backup');
            }
        } catch (error) {
            console.log('⚠️ No se encontró backup de localStorage');
        }
    }

    getItem(key) {
        return this.data[key] || null;
    }

    setItem(key, value) {
        this.data[key] = value;
    }
}

async function migrateFromLocalStorage() {
    let connection;
    
    try {
        console.log('🚀 Iniciando migración desde localStorage a MySQL...');
        
        // Simular localStorage
        const localStorage = new LocalStorageSimulator();
        
        // Conectar a MySQL
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'candela_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Conexión a MySQL establecida');

        // Migrar usuarios
        const users = JSON.parse(localStorage.getItem('vibes_users') || '[]');
        console.log(`📊 Migrando ${users.length} usuarios...`);
        
        for (const user of users) {
            try {
                // Verificar si el usuario ya existe
                const [existing] = await connection.execute(
                    'SELECT id FROM usuarios WHERE email = ?',
                    [user.email]
                );

                if (existing.length === 0) {
                    // Insertar usuario
                    await connection.execute(
                        `INSERT INTO usuarios (id, nombre, email, password, puntos, nivel, refer_code, fecha_registro, compras_acumuladas, sesiones_usadas) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            user.id,
                            user.nombre,
                            user.email,
                            user.password,
                            user.puntos,
                            user.nivel,
                            user.refer_code,
                            user.fecha_registro,
                            user.compras_acumuladas || 0,
                            user.sesiones_usadas || 0
                        ]
                    );
                    console.log(`✅ Usuario migrado: ${user.email}`);
                } else {
                    console.log(`⚠️ Usuario ya existe: ${user.email}`);
                }
            } catch (error) {
                console.error(`❌ Error migrando usuario ${user.email}:`, error.message);
            }
        }

        // Migrar acciones
        const actions = JSON.parse(localStorage.getItem('vibes_actions') || '[]');
        console.log(`📊 Migrando ${actions.length} acciones...`);
        
        for (const action of actions) {
            try {
                await connection.execute(
                    `INSERT INTO acciones (id, usuario_id, tipo_accion, puntos_obtenidos, descripcion, fecha) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        action.id,
                        action.user_id,
                        action.tipo_accion,
                        action.puntos_obtenidos,
                        action.descripcion,
                        action.fecha
                    ]
                );
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️ Acción ya existe: ${action.id}`);
                } else {
                    console.error(`❌ Error migrando acción ${action.id}:`, error.message);
                }
            }
        }

        // Migrar reseñas
        const reviews = JSON.parse(localStorage.getItem('vibes_reviews') || '[]');
        console.log(`📊 Migrando ${reviews.length} reseñas...`);
        
        for (const review of reviews) {
            try {
                await connection.execute(
                    `INSERT INTO reseñas (id, usuario_id, texto, rating, fecha, validada) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        review.id,
                        review.user_id,
                        review.texto,
                        review.rating,
                        review.fecha,
                        review.validada
                    ]
                );
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️ Reseña ya existe: ${review.id}`);
                } else {
                    console.error(`❌ Error migrando reseña ${review.id}:`, error.message);
                }
            }
        }

        // Migrar referidos
        const referrals = JSON.parse(localStorage.getItem('vibes_referrals') || '[]');
        console.log(`📊 Migrando ${referrals.length} referidos...`);
        
        for (const referral of referrals) {
            try {
                await connection.execute(
                    `INSERT INTO referidos (id, invitador_id, invitado_email, estado, fecha, fecha_completado) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        referral.id,
                        referral.invitador_id,
                        referral.invitado_email,
                        referral.estado,
                        referral.fecha,
                        referral.fecha_completado || null
                    ]
                );
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️ Referido ya existe: ${referral.id}`);
                } else {
                    console.error(`❌ Error migrando referido ${referral.id}:`, error.message);
                }
            }
        }

        // Migrar recompensas de usuarios
        const userRewards = JSON.parse(localStorage.getItem('vibes_rewards') || '[]');
        console.log(`📊 Migrando ${userRewards.length} recompensas de usuarios...`);
        
        for (const reward of userRewards) {
            try {
                await connection.execute(
                    `INSERT INTO recompensas_usuarios (id, usuario_id, recompensa_id, puntos_usados, fecha, usado) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        reward.id,
                        reward.user_id,
                        reward.reward_id,
                        reward.puntos_usados,
                        reward.fecha,
                        reward.usado || false
                    ]
                );
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️ Recompensa ya existe: ${reward.id}`);
                } else {
                    console.error(`❌ Error migrando recompensa ${reward.id}:`, error.message);
                }
            }
        }

        console.log('🎉 Migración completada exitosamente!');
        console.log('\n📈 Resumen de migración:');
        console.log(`   - Usuarios: ${users.length}`);
        console.log(`   - Acciones: ${actions.length}`);
        console.log(`   - Reseñas: ${reviews.length}`);
        console.log(`   - Referidos: ${referrals.length}`);
        console.log(`   - Recompensas: ${userRewards.length}`);

        // Crear backup de los datos migrados
        const backupData = {
            users,
            actions,
            reviews,
            referrals,
            userRewards,
            migratedAt: new Date().toISOString()
        };

        fs.writeFileSync('./migration_backup.json', JSON.stringify(backupData, null, 2));
        console.log('\n💾 Backup de migración guardado en migration_backup.json');

    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    migrateFromLocalStorage();
}

module.exports = migrateFromLocalStorage; 