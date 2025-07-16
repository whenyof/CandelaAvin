# 🎨 Candela - Sistema de Puntos Vibes con MySQL

## 📋 Requisitos Previos

### 1. MySQL Server
- **macOS**: Instalar con Homebrew o descargar desde [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
- **Windows**: Descargar desde [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
- **Linux**: `sudo apt-get install mysql-server` (Ubuntu/Debian)

### 2. Sequel Ace (macOS) o DBeaver (Multiplataforma)
- **Sequel Ace**: Descargar desde [Sequel Ace](https://sequel-ace.com/)
- **DBeaver**: Descargar desde [DBeaver](https://dbeaver.io/)

## 🚀 Instalación y Configuración

### Paso 1: Instalar Dependencias
```bash
cd Candela
npm install
```

### Paso 2: Configurar MySQL

#### Opción A: Usando Sequel Ace (macOS)
1. Abrir Sequel Ace
2. Crear nueva conexión:
   - **Host**: `localhost`
   - **Username**: `root`
   - **Password**: (dejar vacío si no tienes contraseña)
   - **Port**: `3306`
3. Conectar y crear base de datos `candela_db`

#### Opción B: Usando DBeaver
1. Abrir DBeaver
2. Crear nueva conexión MySQL:
   - **Host**: `localhost`
   - **Port**: `3306`
   - **Database**: `candela_db`
   - **Username**: `root`
   - **Password**: (dejar vacío si no tienes contraseña)
3. Conectar

#### Opción C: Línea de Comandos
```bash
mysql -u root -p
CREATE DATABASE candela_db;
USE candela_db;
```

### Paso 3: Configurar Variables de Entorno
Editar `config.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          # Dejar vacío si no tienes contraseña
DB_NAME=candela_db
DB_PORT=3306
```

### Paso 4: Ejecutar Script de Configuración
```bash
npm run setup-db
```

Este comando:
- ✅ Crea todas las tablas necesarias
- ✅ Inserta datos iniciales (recompensas)
- ✅ Crea vistas y procedimientos almacenados
- ✅ Configura triggers automáticos

## 📊 Estructura de la Base de Datos

### Tablas Principales
- **`usuarios`**: Información de usuarios y puntos
- **`acciones`**: Historial de puntos ganados/gastados
- **`reseñas`**: Reseñas de clientes
- **`reservas`**: Citas y reservas
- **`referidos`**: Sistema de referidos
- **`recompensas_disponibles`**: Recompensas que se pueden canjear
- **`recompensas_usuarios`**: Recompensas canjeadas por usuarios

### Vistas Útiles
- **`vista_usuarios_stats`**: Estadísticas completas de usuarios

### Procedimientos y Triggers
- **`actualizar_nivel_usuario`**: Actualiza nivel basado en puntos
- **`trigger_actualizar_nivel`**: Trigger automático para cambios de nivel

## 🔧 Comandos Útiles

### Iniciar Servidor
```bash
npm start          # Producción
npm run dev        # Desarrollo (con nodemon)
```

### Configurar Base de Datos
```bash
npm run setup-db   # Configurar tablas y datos iniciales
```

### Verificar Conexión
```bash
node -e "require('./database.js').then(() => console.log('✅ Conexión OK'))"
```

## 🛠️ Solución de Problemas

### Error: "Access denied for user 'root'"
1. Verificar credenciales en `config.env`
2. Si no tienes contraseña, dejar `DB_PASSWORD=` vacío
3. Si tienes contraseña, asegúrate de que sea correcta

### Error: "Can't connect to MySQL server"
1. Verificar que MySQL esté ejecutándose
2. **macOS**: `brew services start mysql`
3. **Windows**: Verificar servicios de Windows
4. **Linux**: `sudo systemctl start mysql`

### Error: "Database doesn't exist"
1. Crear base de datos manualmente:
   ```sql
   CREATE DATABASE candela_db;
   ```
2. O ejecutar `npm run setup-db`

### Error: "Table already exists"
- Es normal, el script salta tablas existentes
- No afecta la funcionalidad

## 📱 Uso con Sequel Ace/DBeaver

### Consultas Útiles

#### Ver todos los usuarios
```sql
SELECT * FROM usuarios ORDER BY fecha_registro DESC;
```

#### Ver estadísticas de usuarios
```sql
SELECT * FROM vista_usuarios_stats;
```

#### Ver acciones de un usuario específico
```sql
SELECT * FROM acciones WHERE usuario_id = 1 ORDER BY fecha DESC;
```

#### Ver recompensas canjeadas
```sql
SELECT u.nombre, ru.*, rd.nombre as recompensa_nombre
FROM recompensas_usuarios ru
JOIN usuarios u ON ru.usuario_id = u.id
JOIN recompensas_disponibles rd ON ru.recompensa_id = rd.id
ORDER BY ru.fecha DESC;
```

## 🔐 Seguridad

- Las contraseñas se hashean con bcrypt
- Todas las consultas usan prepared statements
- Conexiones se cierran automáticamente
- Variables de entorno para configuración sensible

## 📈 Monitoreo

### Logs del Servidor
- Conexiones exitosas: `✅ Conexión a MySQL establecida correctamente`
- Errores de conexión: `❌ Error conectando a MySQL: [mensaje]`

### Métricas de Base de Datos
- Usuarios activos
- Puntos totales en el sistema
- Recompensas canjeadas
- Referidos completados

## 🎯 Próximos Pasos

1. **Backup automático**: Configurar respaldos de la base de datos
2. **Monitoreo**: Implementar métricas de rendimiento
3. **Optimización**: Índices adicionales según uso
4. **Escalabilidad**: Considerar replicación para alta disponibilidad 