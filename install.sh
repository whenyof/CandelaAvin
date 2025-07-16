#!/bin/bash

echo "🎨 Instalando Candela - Sistema de Puntos Vibes"
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si Node.js está instalado
print_status "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js primero."
    echo "Visita: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Node.js encontrado: $NODE_VERSION"

# Verificar si npm está instalado
print_status "Verificando npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado."
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm encontrado: $NPM_VERSION"

# Verificar si MySQL está instalado
print_status "Verificando MySQL..."
if ! command -v mysql &> /dev/null; then
    print_warning "MySQL no está instalado."
    echo ""
    echo "Para instalar MySQL:"
    echo "  macOS: brew install mysql"
    echo "  Ubuntu/Debian: sudo apt-get install mysql-server"
    echo "  Windows: Descarga desde https://dev.mysql.com/downloads/mysql/"
    echo ""
    read -p "¿Quieres continuar sin MySQL? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    MYSQL_VERSION=$(mysql --version)
    print_success "MySQL encontrado: $MYSQL_VERSION"
fi

# Instalar dependencias
print_status "Instalando dependencias de Node.js..."
if npm install; then
    print_success "Dependencias instaladas correctamente"
else
    print_error "Error instalando dependencias"
    exit 1
fi

# Verificar archivo de configuración
print_status "Verificando configuración..."
if [ ! -f "config.env" ]; then
    print_warning "Archivo config.env no encontrado. Creando uno por defecto..."
    cat > config.env << EOF
# Configuración de la base de datos MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=candela_db
DB_PORT=3306

# Configuración del servidor
PORT=3000
JWT_SECRET=candela_jwt_secret_2024_super_secure

# Configuración de CORS
CORS_ORIGIN=http://localhost:5500
EOF
    print_success "Archivo config.env creado"
else
    print_success "Archivo config.env encontrado"
fi

# Configurar base de datos si MySQL está disponible
if command -v mysql &> /dev/null; then
    print_status "Configurando base de datos MySQL..."
    
    # Intentar iniciar MySQL si no está ejecutándose
    if ! pgrep -x "mysqld" > /dev/null; then
        print_warning "MySQL no está ejecutándose. Intentando iniciarlo..."
        if command -v brew &> /dev/null; then
            brew services start mysql
        elif command -v systemctl &> /dev/null; then
            sudo systemctl start mysql
        fi
    fi
    
    # Ejecutar script de configuración de base de datos
    if npm run setup-db; then
        print_success "Base de datos configurada correctamente"
    else
        print_warning "Error configurando base de datos. Puedes intentarlo manualmente más tarde con: npm run setup-db"
    fi
else
    print_warning "MySQL no está disponible. Omitiendo configuración de base de datos."
fi

# Ejecutar pruebas si la base de datos está configurada
if command -v mysql &> /dev/null && [ -f "config.env" ]; then
    print_status "Ejecutando pruebas de la base de datos..."
    if npm test; then
        print_success "Pruebas completadas exitosamente"
    else
        print_warning "Algunas pruebas fallaron. Verifica la configuración de MySQL."
    fi
fi

echo ""
echo "🎉 Instalación completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura las credenciales de MySQL en config.env si es necesario"
echo "2. Ejecuta 'npm run setup-db' para configurar la base de datos"
echo "3. Ejecuta 'npm start' para iniciar el servidor"
echo "4. Abre http://localhost:3000 en tu navegador"
echo ""
echo "🔧 Comandos útiles:"
echo "  npm start          - Iniciar servidor en producción"
echo "  npm run dev        - Iniciar servidor en desarrollo"
echo "  npm run setup-db   - Configurar base de datos"
echo "  npm run test       - Ejecutar pruebas"
echo "  npm run migrate    - Migrar datos desde localStorage"
echo ""
echo "📚 Documentación: README_MYSQL.md" 