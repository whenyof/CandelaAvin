// register.js
const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    // Si ya hay sesión, redirigir al dashboard
    if (localStorage.getItem('authToken') || sessionStorage.getItem('authToken')) {
        window.location.href = 'dashboard.html';
        return;
    }
    const form = document.getElementById('registerForm');
    const errorDiv = document.getElementById('registerError');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        errorDiv.textContent = '';
        const nombre = form.registerName.value.trim();
        const email = form.registerEmail.value.trim();
        const password = form.registerPassword.value;
        if (!nombre || !email || !password) {
            errorDiv.textContent = 'Completa todos los campos.';
            return;
        }
        if (password.length < 8) {
            errorDiv.textContent = 'La contraseña debe tener al menos 8 caracteres.';
            return;
        }
        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                errorDiv.textContent = data.error || 'Error al registrar.';
                return;
            }
            // Registro exitoso
            window.location.href = 'login.html';
        } catch (err) {
            errorDiv.textContent = 'Error de conexión. Intenta de nuevo.';
        }
    });
}); 