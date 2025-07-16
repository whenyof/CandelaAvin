// login.js
const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    // Si ya hay sesión, redirigir al dashboard
    if (localStorage.getItem('authToken') || sessionStorage.getItem('authToken')) {
        window.location.href = 'dashboard.html';
        return;
    }
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginError');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        errorDiv.textContent = '';
        const email = form.loginEmail.value.trim();
        const password = form.loginPassword.value;
        const remember = form.rememberMe.checked;
        if (!email || !password) {
            errorDiv.textContent = 'Completa todos los campos.';
            return;
        }
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok || !data.token) {
                errorDiv.textContent = data.error || 'Email o contraseña incorrectos.';
                return;
            }
            // Guardar token según preferencia
            if (remember) {
                localStorage.setItem('authToken', data.token);
                // Guardar fecha de expiración (30 días)
                const expires = new Date();
                expires.setDate(expires.getDate() + 30);
                localStorage.setItem('authTokenExpires', expires.toISOString());
            } else {
                sessionStorage.setItem('authToken', data.token);
            }
            window.location.href = 'dashboard.html';
        } catch (err) {
            errorDiv.textContent = 'Error de conexión. Intenta de nuevo.';
        }
    });
    // Cierre de sesión global
    window.logout = function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authTokenExpires');
        sessionStorage.removeItem('authToken');
        window.location.href = 'login.html';
    };
    // Expiración automática de sesión persistente
    const expires = localStorage.getItem('authTokenExpires');
    if (expires && new Date() > new Date(expires)) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authTokenExpires');
    }
}); 