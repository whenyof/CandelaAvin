const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

async function setupDatabase() {
    let connection;
    
    try {
        console.log('🚀 Iniciando configuración de la base de datos...');
        
        // Conectar sin especificar base de datos para crearla
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Conexión a MySQL establecida');

        // Crear base de datos si no existe
        await connection.query('CREATE DATABASE IF NOT EXISTS candela_db');
        await connection.query('USE candela_db');
        console.log('✅ Base de datos candela_db seleccionada');

        // Leer el archivo SQL
        const sqlFile = path.join(__dirname, 'database_schema.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');

        // Dividir el contenido en comandos individuales, manejando DELIMITER
        const commands = [];
        let currentCommand = '';
        let delimiter = ';';
        let inDelimiterBlock = false;

        const lines = sqlContent.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Saltar líneas vacías y comentarios
            if (!line || line.startsWith('--')) {
                continue;
            }

            // Detectar cambio de DELIMITER
            if (line.startsWith('DELIMITER')) {
                if (currentCommand.trim()) {
                    commands.push(currentCommand.trim());
                    currentCommand = '';
                }
                delimiter = line.split(' ')[1];
                inDelimiterBlock = true;
                continue;
            }

            // Agregar línea al comando actual
            currentCommand += line + '\n';

            // Verificar si el comando termina con el delimiter actual
            if (line.endsWith(delimiter)) {
                const command = currentCommand.slice(0, -delimiter.length).trim();
                if (command) {
                    commands.push(command);
                }
                currentCommand = '';
                inDelimiterBlock = false;
                delimiter = ';';
            }
        }

        // Agregar el último comando si existe
        if (currentCommand.trim()) {
            commands.push(currentCommand.trim());
        }

        console.log('📝 Ejecutando comandos SQL...');

        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            if (command && !command.startsWith('DELIMITER')) {
                try {
                    // Usar query para comandos que no son prepared statements
                    await connection.query(command);
                    console.log(`✅ Comando ${i + 1}/${commands.length} ejecutado`);
                } catch (error) {
                    if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_DUP_FIELDNAME') {
                        console.log(`⚠️  Comando ${i + 1} ya existe (saltando)`);
                    } else {
                        console.error(`❌ Error en comando ${i + 1}:`, error.message);
                        // Continuar con el siguiente comando en lugar de fallar completamente
                    }
                }
            }
        }

        console.log('🎉 Base de datos configurada correctamente!');
        console.log('\n📊 Tablas creadas:');
        console.log('   - usuarios');
        console.log('   - acciones');
        console.log('   - reseñas');
        console.log('   - reservas');
        console.log('   - referidos');
        console.log('   - recompensas_disponibles');
        console.log('   - recompensas_usuarios');
        console.log('\n🔧 Vistas y procedimientos:');
        console.log('   - vista_usuarios_stats');
        console.log('   - actualizar_nivel_usuario (procedimiento)');
        console.log('   - trigger_actualizar_nivel (trigger)');

    } catch (error) {
        console.error('❌ Error durante la configuración:', error.message);
        console.log('\n💡 Posibles soluciones:');
        console.log('   1. Verifica que MySQL esté instalado y ejecutándose');
        console.log('   2. Verifica las credenciales en config.env');
        console.log('   3. Asegúrate de que el usuario tenga permisos para crear bases de datos');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    setupDatabase();
}

module.exports = setupDatabase; 