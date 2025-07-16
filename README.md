# Candela - Maquillaje Profesional en Asturias

Una página web profesional, minimalista y visualmente atractiva para una maquilladora profesional ubicada en Asturias, España. Incluye un sistema completo de gamificación "Vibes Points" que incentiva el registro, recompensa las acciones positivas y permite a los usuarios obtener beneficios por invitar a otros o repetir compras.

## 🎨 Características

- **Diseño Minimalista y Elegante**: Interfaz limpia con tipografía elegante y paleta de colores suave
- **Totalmente Responsive**: Optimizada para móviles, tablets y desktop
- **Animaciones Suaves**: Transiciones fluidas y efectos hover sutiles
- **Portafolio Interactivo**: Galería con filtros y lightbox para visualizar trabajos
- **Formulario de Contacto**: Validación completa y notificaciones en tiempo real
- **Sistema Vibes Points**: Gamificación completa con puntos, recompensas y referidos
- **Autenticación de Usuarios**: Registro, login y dashboard personalizado
- **SEO Optimizado**: Meta tags, estructura semántica y rendimiento optimizado
- **Accesibilidad**: Navegación por teclado y soporte para lectores de pantalla

## 📁 Estructura del Proyecto

```
Candela/
├── index.html              # Página principal
├── login.html              # Página de inicio de sesión
├── register.html           # Página de registro
├── dashboard.html          # Dashboard del usuario
├── styles.css              # Estilos principales
├── auth-styles.css         # Estilos de autenticación
├── dashboard-styles.css    # Estilos del dashboard
├── database.js             # Sistema de base de datos simulada
├── auth.js                 # Funcionalidades de autenticación
├── dashboard.js            # Funcionalidades del dashboard
├── script.js               # Funcionalidades principales
└── README.md               # Documentación
```

## 🚀 Instalación y Uso

### Opción 1: Servidor Local
1. Clona o descarga los archivos en tu servidor web
2. Abre `index.html` en tu navegador
3. ¡Listo! La web está funcionando

### Opción 2: Servicios de Hosting
- **Vercel**: Arrastra la carpeta a [vercel.com](https://vercel.com)
- **Netlify**: Arrastra la carpeta a [netlify.com](https://netlify.com)
- **GitHub Pages**: Sube a un repositorio y activa GitHub Pages

### Opción 3: Servidor Local con Live Server
```bash
# Si tienes Node.js instalado
npx live-server

# O con Python
python -m http.server 8000
```

## 🎯 Personalización

### Información de Contacto
Edita en `index.html`:
```html
<!-- Teléfono -->
<p>+34 600 000 000</p>

<!-- WhatsApp -->
<a href="https://wa.me/34600000000" class="whatsapp-btn" target="_blank">

<!-- Ubicación -->
<p>Asturias, España</p>
```

### Colores y Estilo
Modifica las variables CSS en `styles.css`:
```css
:root {
    --primary-color: #f8b4d9;      /* Color principal */
    --primary-dark: #e69ac7;       /* Color principal oscuro */
    --secondary-color: #2c3e50;    /* Color secundario */
    --text-dark: #2c3e50;          /* Texto oscuro */
    --text-light: #7f8c8d;         /* Texto claro */
}
```

### Imágenes del Portafolio
Reemplaza las URLs de Unsplash en `index.html`:
```html
<img src="tu-imagen.jpg" alt="Descripción de la imagen" loading="lazy">
```

### Contenido
- **Hero Section**: Modifica el mensaje principal en la sección `#inicio`
- **Servicios**: Actualiza descripciones en la sección `#servicios`
- **Sobre Mí**: Personaliza la información profesional en `#sobre-mi`
- **Portafolio**: Añade tus trabajos reales en `#portafolio`

## 📱 Optimización para Móviles

La web está completamente optimizada para dispositivos móviles con:
- Navegación hamburger responsive
- Imágenes adaptativas
- Touch-friendly buttons
- Optimización de carga

## 🔧 Funcionalidades JavaScript

### Navegación
- Menú hamburger para móviles
- Scroll suave entre secciones
- Efecto de transparencia en navbar

### Portafolio
- Filtros por categoría (Bodas, Eventos, Artístico, Teatro/Cine)
- Lightbox para visualizar imágenes
- Animaciones de entrada

### Formulario de Contacto
- Validación en tiempo real
- Notificaciones de éxito/error
- Integración con WhatsApp

### Sistema Vibes Points
- **Autenticación**: Registro, login y gestión de sesiones
- **Dashboard**: Panel completo con estadísticas y actividad
- **Puntos**: Sistema de ganancia y canje de puntos
- **Recompensas**: Descuentos y beneficios por nivel
- **Referidos**: Sistema de invitaciones con códigos únicos
- **Historial**: Seguimiento completo de acciones

### Animaciones
- Scroll-triggered animations (AOS-like)
- Hover effects en elementos interactivos
- Transiciones suaves

## 📊 SEO y Rendimiento

### Meta Tags Incluidos
- Title optimizado
- Meta description
- Keywords relevantes
- Open Graph tags
- Favicon personalizado

### Optimizaciones de Rendimiento
- Lazy loading de imágenes
- CSS y JS minificados
- Preload de recursos críticos
- Debounced scroll handlers
- Optimización de fuentes web

### Lighthouse Score Objetivo
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

## 🎨 Personalización Avanzada

### Sistema Vibes Points

#### Configuración de Puntos
Edita en `database.js`:
```javascript
// Puntos por acción
const POINTS = {
    REGISTRO: 50,
    COMPRA: 10, // por cada 10€
    RESEÑA: 30,
    REFERIDO: 150,
    HITO: 100 // cada 5 compras
};
```

#### Niveles y Beneficios
```javascript
// Niveles de usuario
const LEVELS = {
    BRONCE: { min: 0, max: 499, discount: 0.95 },
    PLATA: { min: 500, max: 999, discount: 0.90 },
    ORO: { min: 1000, max: Infinity, discount: 0.85 }
};
```

#### Recompensas Disponibles
```javascript
const REWARDS = [
    { id: 1, name: '5€ descuento', points: 300, type: 'discount' },
    { id: 2, name: '10€ descuento', points: 500, type: 'discount' },
    { id: 3, name: '50% descuento', points: 800, type: 'percentage' },
    { id: 4, name: 'Sesión gratis', points: 1200, type: 'free' }
];
```

### Añadir Nuevas Secciones
1. Crea la estructura HTML en `index.html`
2. Añade los estilos correspondientes en `styles.css`
3. Implementa funcionalidades JavaScript si es necesario

### Cambiar Fuentes
```css
:root {
    --font-heading: 'Tu-Fuente-Heading', serif;
    --font-body: 'Tu-Fuente-Body', sans-serif;
}
```

### Añadir Más Animaciones
```css
/* Ejemplo de animación personalizada */
@keyframes tuAnimacion {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.tu-elemento {
    animation: tuAnimacion 0.6s ease forwards;
}
```

## 🔒 Seguridad y Privacidad

### Formulario de Contacto
- Validación del lado del cliente
- Sanitización de datos
- Protección contra spam (implementar reCAPTCHA si es necesario)

### Integración con Backend
Para procesar el formulario, puedes usar:
- **Formspree**: Servicio gratuito para formularios
- **Netlify Forms**: Si usas Netlify
- **Tu propio backend**: PHP, Node.js, etc.

## 📈 Analytics y Tracking

### Google Analytics
Añade en el `<head>` de `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=TU-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'TU-ID');
</script>
```

### Facebook Pixel
```html
<!-- Facebook Pixel -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'TU-PIXEL-ID');
  fbq('track', 'PageView');
</script>
```

## 🚀 Despliegue

### Vercel (Recomendado)
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. Vercel detectará automáticamente que es un proyecto estático
4. ¡Listo! Tu web estará online

### Netlify
1. Ve a [netlify.com](https://netlify.com)
2. Arrastra la carpeta del proyecto
3. Netlify te dará una URL automáticamente
4. Configura tu dominio personalizado si lo deseas

### Hosting Tradicional
1. Sube todos los archivos a tu servidor web
2. Asegúrate de que `index.html` esté en la raíz
3. Configura tu dominio para apuntar al servidor

## 📞 Soporte

Para personalizaciones adicionales o soporte técnico:
- Revisa la documentación de las tecnologías utilizadas
- Consulta las mejores prácticas de desarrollo web
- Considera contratar un desarrollador para modificaciones complejas

## 📄 Licencia

Este proyecto está disponible para uso personal y comercial. Se agradece la atribución pero no es obligatoria.

---

**Desarrollado con ❤️ para profesionales del maquillaje en Asturias** 

¡Listo!  
Ya tienes los scripts y dependencias para lanzar el backend y el frontend juntos fácilmente.

### Ahora puedes hacer esto:

1. **Abre una terminal en la carpeta `Candela`**:
   ```sh
   cd /Users/iyanrp_/Desktop/Proyects/Candela
   ```

2. **Lanza ambos servidores (backend y frontend) a la vez**:
   ```sh
   npm run dev
   ```

Esto hará:
- Backend (Node.js) en `http://localhost:3000`
- Frontend (estático) en `http://localhost:5500`

Abre tu navegador en `http://localhost:5500/register.html` o `login.html` y prueba el registro/login.

---

**Con esto, el JS de frontend funcionará y el backend responderá a las peticiones.**  
Si algo sigue sin funcionar, dime exactamente qué ves en consola o pantalla y lo solucionamos al instante. 