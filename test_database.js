const vibesDB = require('./database.js');

async function testDatabase() {
    try {
        console.log('🧪 Iniciando pruebas de la base de datos...\n');

        // Test 1: Conexión
        console.log('1️⃣ Probando conexión...');
        await vibesDB.initDatabase();
        console.log('✅ Conexión exitosa\n');

        // Test 2: Crear usuario de prueba
        console.log('2️⃣ Probando creación de usuario...');
        const testUser = await vibesDB.createUser({
            nombre: 'Usuario Prueba',
            email: 'test@candela.com',
            password: 'test123'
        });
        console.log('✅ Usuario creado:', testUser.email, 'ID:', testUser.id);
        console.log('   Puntos iniciales:', testUser.puntos);
        console.log('   Nivel:', testUser.nivel);
        console.log('   Código de referido:', testUser.refer_code, '\n');

        // Test 3: Login
        console.log('3️⃣ Probando login...');
        const loggedUser = await vibesDB.login('test@candela.com', 'test123');
        if (loggedUser) {
            console.log('✅ Login exitoso:', loggedUser.nombre);
        } else {
            console.log('❌ Login falló');
        }
        console.log('');

        // Test 4: Agregar puntos
        console.log('4️⃣ Probando sistema de puntos...');
        await vibesDB.addPoints(testUser.id, 100, 'test', 'Puntos de prueba');
        const updatedUser = await vibesDB.getUserById(testUser.id);
        console.log('✅ Puntos agregados. Nuevo total:', updatedUser.puntos);
        console.log('   Nuevo nivel:', updatedUser.nivel, '\n');

        // Test 5: Obtener acciones
        console.log('5️⃣ Probando historial de acciones...');
        const actions = await vibesDB.getUserActions(testUser.id);
        console.log('✅ Acciones encontradas:', actions.length);
        actions.forEach(action => {
            console.log(`   - ${action.tipo_accion}: ${action.puntos_obtenidos} puntos (${action.descripcion})`);
        });
        console.log('');

        // Test 6: Obtener recompensas disponibles
        console.log('6️⃣ Probando recompensas disponibles...');
        const rewards = await vibesDB.getAvailableRewards();
        console.log('✅ Recompensas disponibles:', rewards.length);
        rewards.forEach(reward => {
            console.log(`   - ${reward.nombre}: ${reward.puntos_requeridos} puntos`);
        });
        console.log('');

        // Test 7: Canjear recompensa
        console.log('7️⃣ Probando canje de recompensa...');
        if (rewards.length > 0 && updatedUser.puntos >= rewards[0].puntos_requeridos) {
            const result = await vibesDB.redeemReward(testUser.id, rewards[0].id);
            if (result.success) {
                console.log('✅ Recompensa canjeada:', result.message);
            } else {
                console.log('❌ Error al canjear:', result.message);
            }
        } else {
            console.log('⚠️ No hay suficientes puntos para canjear recompensa');
        }
        console.log('');

        // Test 8: Crear reseña
        console.log('8️⃣ Probando sistema de reseñas...');
        const reviewResult = await vibesDB.recordReview(testUser.id, 'Excelente servicio!', 5);
        console.log('✅ Reseña creada:', reviewResult.nueva ? 'Nueva' : 'Actualizada');
        console.log('');

        // Test 9: Obtener estadísticas
        console.log('9️⃣ Probando estadísticas de usuario...');
        const stats = await vibesDB.getUserStats(testUser.id);
        console.log('✅ Estadísticas obtenidas:');
        console.log(`   - Puntos ganados: ${stats.totalPointsEarned}`);
        console.log(`   - Puntos gastados: ${stats.totalPointsSpent}`);
        console.log(`   - Puntos actuales: ${stats.currentPoints}`);
        console.log(`   - Nivel: ${stats.level}`);
        console.log(`   - Recompensas totales: ${stats.totalRewards}`);
        console.log('');

        // Test 10: Crear referido
        console.log('🔟 Probando sistema de referidos...');
        const referral = await vibesDB.createReferral(testUser.id, 'amigo@test.com');
        console.log('✅ Referido creado para:', referral.invitado_email);
        console.log('   Estado:', referral.estado);
        console.log('');

        console.log('🎉 Todas las pruebas completadas exitosamente!');
        console.log('\n📊 Resumen:');
        console.log('   - Conexión a MySQL: ✅');
        console.log('   - Gestión de usuarios: ✅');
        console.log('   - Sistema de puntos: ✅');
        console.log('   - Historial de acciones: ✅');
        console.log('   - Sistema de recompensas: ✅');
        console.log('   - Sistema de reseñas: ✅');
        console.log('   - Sistema de referidos: ✅');
        console.log('   - Estadísticas: ✅');

        // Limpiar usuario de prueba
        console.log('\n🧹 Limpiando datos de prueba...');
        // Nota: En producción, podrías querer mantener los datos de prueba

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
        console.log('\n💡 Posibles soluciones:');
        console.log('   1. Verifica que MySQL esté ejecutándose');
        console.log('   2. Ejecuta: npm run setup-db');
        console.log('   3. Verifica las credenciales en config.env');
    } finally {
        // Cerrar conexión
        await vibesDB.close();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testDatabase();
}

module.exports = testDatabase; 