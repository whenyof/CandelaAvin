// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initScrollAnimations();
    initPortfolioFilter();
    initLightbox();
    initContactForm();
    initSmoothScrolling();
    initLazyLoading();
    initVibesPoints();
    loadPublicReviews();
});

// Navigation functionality
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navbar.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Scroll animations (AOS-like functionality)
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, observerOptions);

    // Observe all elements with data-aos attribute
    const animatedElements = document.querySelectorAll('[data-aos]');
    animatedElements.forEach(el => observer.observe(el));
}

// Portfolio filtering
function initPortfolioFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter items
            portfolioItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filter === 'todos' || category === filter) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Lightbox functionality
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    // Open lightbox
    portfolioItems.forEach(item => {
        item.addEventListener('click', function() {
            const img = this.querySelector('img');
            const title = this.querySelector('h4').textContent;
            const description = this.querySelector('p').textContent;
            
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxCaption.innerHTML = `<h4>${title}</h4><p>${description}</p>`;
            
            lightbox.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Fade in effect
            setTimeout(() => {
                lightbox.style.opacity = '1';
            }, 10);
        });
    });

    // Close lightbox
    function closeLightbox() {
        lightbox.style.opacity = '0';
        setTimeout(() => {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    lightboxClose.addEventListener('click', closeLightbox);
    
    // Close on background click
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && lightbox.style.display === 'block') {
            closeLightbox();
        }
    });
}

// Contact form handling
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Basic validation
            if (!validateForm(data)) {
                return;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('/api/reservas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al registrar la reserva');
                }
                showNotification('¡Reserva enviada con éxito! Te contactaremos pronto.', 'success');
                this.reset();
            } catch (error) {
                showNotification(error.message, 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Form validation
function validateForm(data) {
    const requiredFields = ['name', 'email', 'service', 'message'];
    
    for (let field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            showNotification(`Por favor, completa el campo ${field === 'name' ? 'nombre' : field === 'email' ? 'email' : field === 'service' ? 'tipo de servicio' : 'mensaje'}.`, 'error');
            return false;
        }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showNotification('Por favor, introduce un email válido.', 'error');
        return false;
    }
    
    return true;
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 70; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Lazy loading for images
function initLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.src; // Trigger load
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// Performance optimization: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimized scroll handler
const optimizedScrollHandler = debounce(function() {
    // Any scroll-based functionality can be added here
}, 10);

window.addEventListener('scroll', optimizedScrollHandler);

// Service Worker registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Add loading animation for page transitions
window.addEventListener('load', function() {
    // Remove loading screen if exists
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
    
    // Add loaded class to body
    document.body.classList.add('loaded');
});

// Enhanced form field interactions
document.addEventListener('DOMContentLoaded', function() {
    const formFields = document.querySelectorAll('.form-group input, .form-group textarea, .form-group select');
    
    formFields.forEach(field => {
        // Add focus effects
        field.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        field.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Add floating label effect
        if (field.value) {
            field.parentElement.classList.add('focused');
        }
    });
});

// Portfolio item hover effects
document.addEventListener('DOMContentLoaded', function() {
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    portfolioItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

// WhatsApp integration
function openWhatsApp(message = '') {
    const phone = '34611416487'; // Número real de Candela
    const text = encodeURIComponent(message || 'Hola, me gustaría consultar sobre tus servicios de maquillaje.');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
}

// Add WhatsApp click handlers
document.addEventListener('DOMContentLoaded', function() {
    const whatsappButtons = document.querySelectorAll('.whatsapp-btn');
    
    whatsappButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            openWhatsApp();
        });
    });
});

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Tab navigation for portfolio filters
    if (e.key === 'Tab') {
        const activeElement = document.activeElement;
        if (activeElement.classList.contains('filter-btn')) {
            activeElement.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        }
    }
});

// Accessibility improvements
document.addEventListener('DOMContentLoaded', function() {
    // Add ARIA labels where needed
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    portfolioItems.forEach((item, index) => {
        const img = item.querySelector('img');
        if (img) {
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.setAttribute('aria-label', `Ver imagen ${index + 1}: ${img.alt}`);
        }
    });
    
    // Add keyboard support for portfolio items
    portfolioItems.forEach(item => {
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        }, 0);
    });
}

// Vibes Points Integration
function initVibesPoints() {
    // Mostrar estado de login en la navegación usando JWT/localStorage
    const token = localStorage.getItem('authToken');
    const loginBtn = document.querySelector('.btn-login');
    if (loginBtn) {
        if (token) {
            loginBtn.textContent = 'Mi Cuenta';
            loginBtn.href = 'dashboard.html';
        } else {
            loginBtn.textContent = 'Iniciar Sesión';
            loginBtn.href = 'login.html';
        }
    }
    // Add Vibes Points info to contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const serviceSelect = contactForm.querySelector('#service');
        if (serviceSelect) {
            // Add points info after service selection
            serviceSelect.addEventListener('change', function() {
                const pointsInfo = document.querySelector('.points-info');
                if (pointsInfo) pointsInfo.remove();
                if (this.value && this.value !== 'consulta') {
                    const info = document.createElement('div');
                    info.className = 'points-info';
                    info.innerHTML = `
                        <p style="color: var(--primary-color); font-size: 0.9rem; margin-top: 0.5rem;">
                            💡 Gana puntos con cada compra: +10 pts por cada 10€
                        </p>
                    `;
                    this.parentNode.appendChild(info);
                }
            });
        }
    }
    // Add referral code handling to registration links (opcional)
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
        // Store referral code for registration
        localStorage.setItem('pending_referral', refCode);
    }
} 

async function loadPublicReviews() {
    const track = document.getElementById('reviewsCarouselTrack');
    const leftBtn = document.getElementById('carouselLeft');
    const rightBtn = document.getElementById('carouselRight');
    
    if (!track) return;
    
    try {
        const response = await fetch('/api/reviews/public');
        
        if (!response.ok) {
            throw new Error('Failed to load reviews');
        }
        
        const data = await response.json();
        const reviews = data.reviews;
        
        if (reviews.length === 0) {
            track.innerHTML = '<div class="no-reviews-msg" style="text-align:center;color:var(--text-light);padding:2rem 0;">Aún no hay reseñas públicas.<br><span style="font-size:1.2rem;">¡Sé la primera persona en dejar una reseña!</span></div>';
            if (leftBtn) leftBtn.style.display = 'none';
            if (rightBtn) rightBtn.style.display = 'none';
            return;
        }
        
        track.innerHTML = '';
        
        // Mostrar las reseñas más recientes primero
        reviews.slice(0, 12).forEach((review, idx) => {
            const name = review.nombre ? review.nombre.split(' ')[0] : 'Anónimo';
            const avatar = name.charAt(0).toUpperCase();
            const date = new Date(review.fecha).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            const stars = createStarsHTML(review.rating);
            const card = document.createElement('div');
            card.className = 'review-card review-animate';
            card.style.animationDelay = (idx * 0.07) + 's';
            card.innerHTML = `
                <div class="review-header">
                    <div class="review-avatar">${avatar}</div>
                    <span class="review-name">${name}</span>
                    <span class="review-level ${review.nivel ? review.nivel.toLowerCase() : 'bronce'}">${review.nivel || 'Bronce'}</span>
                    <div class="review-rating">${stars}</div>
                </div>
                <div class="review-text">${review.texto}</div>
                <div class="review-date">${date}</div>
            `;
            track.appendChild(card);
        });
        
        // Carrusel funcional y responsivo
        let current = 0;
        const total = track.children.length;
        
        function updateCarousel() {
            if (total === 0) return;
            const cardWidth = track.children[0]?.offsetWidth || 320;
            const gap = parseInt(window.getComputedStyle(track).gap) || 16;
            const visible = Math.floor(track.parentElement.offsetWidth / (cardWidth + gap));
            const max = Math.max(0, total - visible);
            if (current < 0) current = 0;
            if (current > max) current = max;
            track.style.transform = `translateX(-${(cardWidth + gap) * current}px)`;
            if (leftBtn) leftBtn.style.opacity = current === 0 ? 0.4 : 1;
            if (rightBtn) rightBtn.style.opacity = current === max ? 0.4 : 1;
        }
        if (leftBtn) leftBtn.onclick = () => { current--; updateCarousel(); };
        if (rightBtn) rightBtn.onclick = () => { current++; updateCarousel(); };
        window.addEventListener('resize', updateCarousel);
        updateCarousel();
        // Animación de entrada
        setTimeout(() => {
            document.querySelectorAll('.review-animate').forEach(card => {
                card.classList.add('review-animate-in');
            });
        }, 100);
    } catch (error) {
        console.error('Error loading public reviews:', error);
        track.innerHTML = '<p style="text-align:center;color:var(--text-light);">Error al cargar las reseñas.</p>';
        if (leftBtn) leftBtn.style.display = 'none';
        if (rightBtn) rightBtn.style.display = 'none';
    }
}

// Función para crear el HTML de las estrellas
function createStarsHTML(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Estrellas llenas
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<span class="star filled">⭐</span>';
    }
    
    // Media estrella si es necesario
    if (hasHalfStar) {
        starsHTML += '<span class="star half">⭐</span>';
    }
    
    // Estrellas vacías
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<span class="star empty">☆</span>';
    }
    
    return starsHTML;
} 