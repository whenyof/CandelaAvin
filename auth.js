// Definir la URL base de la API (ajusta según tu entorno)
const API_URL = "http://localhost:3000/api";
// Authentication System
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('[Candela] DOMContentLoaded');
        initAuth();
        console.log('[Candela] initAuth ejecutado');
    } catch (e) {
        console.error('[Candela] Error en initAuth:', e);
    }
    initForgotPassword();
});

function initAuth() {
    // Initialize navigation
    initNavigation();
    // Initialize forms
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) initLoginForm(loginForm);
    if (registerForm) initRegisterForm(registerForm);
}

function initForgotPassword() {
    const forgotBtn = document.getElementById('forgotPasswordBtn');
    const forgotModal = document.getElementById('forgotModal');
    const closeForgotModal = document.getElementById('closeForgotModal');
    const forgotForm = document.getElementById('forgotForm');
    const forgotMessage = document.getElementById('forgotMessage');
    if (!forgotBtn || !forgotModal) return;
    forgotBtn.addEventListener('click', function(e) {
        e.preventDefault();
        forgotModal.style.display = 'block';
        forgotMessage.innerHTML = '';
        forgotForm.reset();
    });
    closeForgotModal.addEventListener('click', function() {
        forgotModal.style.display = 'none';
    });
    window.addEventListener('click', function(e) {
        if (e.target === forgotModal) forgotModal.style.display = 'none';
    });
    forgotForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        if (!email || !isValidEmail(email)) {
            forgotMessage.innerHTML = '<span style="color:#e74c3c;">Introduce un email válido.</span>';
            return;
        }
        // Llamar a la API real (simulada)
        try {
            const response = await fetch(`${API_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (response.ok) {
                forgotMessage.innerHTML = '<span style="color:#27ae60;">Enlace de recuperación enviado a tu correo (simulado).</span>';
                setTimeout(() => { forgotModal.style.display = 'none'; }, 2500);
            } else {
                forgotMessage.innerHTML = `<span style="color:#e74c3c;">${data.error || 'No existe ninguna cuenta con ese email.'}</span>`;
            }
        } catch (error) {
            forgotMessage.innerHTML = '<span style="color:#e74c3c;">Error de conexión. Intenta de nuevo.</span>';
        }
    });
}

function initNavigation() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (navbar && !navbar.contains(e.target)) {
            if (hamburger) hamburger.classList.remove('active');
            if (navMenu) navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

function initLoginForm(form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearFormErrors();
        clearAuthMessages();
        const formData = new FormData(this);
        const email = formData.get('email');
        const password = formData.get('password');
        let valid = true;
        if (!email || !isValidEmail(email)) {
            showFieldError('email', 'Introduce un email válido');
            valid = false;
        }
        if (!password) {
            showFieldError('password', 'Introduce tu contraseña');
            valid = false;
        }
        if (!valid) return;
        // Loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        submitBtn.disabled = true;
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok && data.token) {
                localStorage.setItem('authToken', data.token);
                showAuthMessage('¡Bienvenido de vuelta!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showAuthMessage(data.error || 'Email o contraseña incorrectos', 'error');
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
                submitBtn.disabled = false;
            }
        } catch (error) {
            showAuthMessage('Error de conexión. Intenta de nuevo.', 'error');
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
}

function initRegisterForm(form) {
    // Barra de fuerza de contraseña en tiempo real
    const passwordInput = form.querySelector('#password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearFormErrors();
        clearAuthMessages();
        const formData = new FormData(this);
        const nombre = formData.get('nombre');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const referCode = formData.get('referCode');
        const terms = formData.get('terms');
        let valid = true;
        if (!nombre || !nombre.trim()) {
            showFieldError('nombre', 'El nombre es requerido');
            valid = false;
        }
        if (!email || !isValidEmail(email)) {
            showFieldError('email', 'Introduce un email válido');
            valid = false;
        }
        if (!password || password.length < 8) {
            showFieldError('password', 'La contraseña debe tener al menos 8 caracteres');
            valid = false;
        }
        if (!confirmPassword || password !== confirmPassword) {
            showFieldError('confirmPassword', 'Las contraseñas no coinciden');
            valid = false;
        }
        if (!terms) {
            showFieldError('terms', 'Debes aceptar los términos y condiciones');
            valid = false;
        }
        if (!valid) return;
        // Loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        submitBtn.disabled = true;
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, password, referCode })
            });
            const data = await response.json();
            if (response.ok && data.token) {
                localStorage.setItem('authToken', data.token);
                showAuthMessage('¡Cuenta creada con éxito! Ganas 50 puntos por registrarte', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showAuthMessage(data.error || 'Error al registrar', 'error');
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
                submitBtn.disabled = false;
            }
        } catch (error) {
            showAuthMessage('Error de conexión. Intenta de nuevo.', 'error');
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
}

function updatePasswordStrength(password) {
    const bar = document.getElementById('passwordStrength');
    const barFill = document.getElementById('passwordStrengthBar');
    const text = document.getElementById('passwordStrengthText');
    if (!bar || !barFill || !text) return;
    // Lógica de fuerza
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    // Feedback visual
    if (password.length === 0) {
        bar.className = 'password-strength';
        barFill.style.width = '0%';
        text.textContent = '';
    } else if (score <= 2) {
        bar.className = 'password-strength weak';
        barFill.style.width = '33%';
        text.textContent = 'Débil';
    } else if (score === 3 || score === 4) {
        bar.className = 'password-strength medium';
        barFill.style.width = '66%';
        text.textContent = 'Media';
    } else if (score === 5) {
        bar.className = 'password-strength strong';
        barFill.style.width = '100%';
        text.textContent = 'Fuerte';
    }
}

function showAuthMessage(message, type) {
    clearAuthMessages();
    const form = document.querySelector('.auth-form');
    if (!form) return;
    const msg = document.createElement('div');
    msg.className = 'auth-message ' + (type === 'error' ? 'error' : 'success');
    msg.textContent = message;
    form.parentNode.insertBefore(msg, form);
}

function clearAuthMessages() {
    document.querySelectorAll('.auth-message').forEach(el => el.remove());
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    formGroup.classList.add('error');
    // Remove existing error message
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) existingError.remove();
    // Add new error message
    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.textContent = message;
    formGroup.appendChild(errorMsg);
}

function clearFormErrors() {
    document.querySelectorAll('.form-group.error').forEach(field => {
        field.classList.remove('error');
        const errorMsg = field.querySelector('.error-message');
        if (errorMsg) errorMsg.remove();
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function handleReferral(referCode, newUserEmail) {
    // Find user with this referral code
    // Eliminar referencias a vibesDB y lógica antigua
    // Usar solo JWT/localStorage para la sesión
}

function showNotification(message, type = 'info') {
    // Popup además de la notificación visual
    alert(message);
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.auth-message');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `auth-message ${type}`;
    notification.textContent = message;
    
    // Add to auth card
    const authCard = document.querySelector('.auth-card');
    if (authCard) {
        authCard.insertBefore(notification, authCard.firstChild);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Password strength indicator creation
function createPasswordStrengthIndicator() {
    const passwordField = document.getElementById('password');
    if (!passwordField) return;
    
    const formGroup = passwordField.closest('.form-group');
    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength';
    strengthIndicator.innerHTML = '<div class="password-strength-bar"></div>';
    
    formGroup.appendChild(strengthIndicator);
}

// Initialize password strength indicator if on register page
if (document.getElementById('password')) {
    createPasswordStrengthIndicator();
}

// Demo user creation for testing
function createDemoUser() {
    const demoUser = {
        nombre: 'Usuario Demo',
        email: 'demo@example.com',
        password: 'demo123'
    };
    
    // Eliminar referencias a vibesDB y lógica antigua
    // Usar solo JWT/localStorage para la sesión
}

// Create demo user on page load (for testing purposes)
setTimeout(createDemoUser, 1000); 

// Toast visual al ganar puntos
function showPointsToast(points, motivo) {
    showNotification(`🎉 ¡Has ganado ${points} Vibes Points ${motivo ? motivo : ''}!`, 'success');
}

// En registro y login, usar showPointsToast cuando corresponda 