// Dashboard System
document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
});

// Dashboard functionality
let currentUser = null;

// Initialize dashboard
function initDashboard() {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Load user data
    loadUserData();
    initNavigation();
    initTabs();
    initModals();
    initActions();
}

// En loadUserData, asegurar que currentUser.puntos siempre sea un número y actualizar todos los lugares donde se muestra el puntaje.
async function loadUserData() {
    try {
        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load user data');
        }

        const data = await response.json();
        currentUser = data.user;
        currentUser.puntos = Number(currentUser.puntos) || 0;
        
        // Update UI
        document.getElementById('userName').textContent = currentUser.nombre;
        document.getElementById('userEmail').textContent = currentUser.email;
        document.getElementById('userLevel').textContent = currentUser.nivel;
        // No se requiere actualizar currentPoints fuera de las tarjetas de estadísticas, ya que la información de puntos se muestra en las stats.
        document.getElementById('memberSince').textContent = new Date(currentUser.fecha_registro).getFullYear();
        
        // Update referral code
        document.getElementById('referralCode').textContent = currentUser.refer_code;
        document.getElementById('referralLink').value = `${window.location.origin}/register.html?ref=${currentUser.refer_code}`;
        
        // Load dashboard data
        loadDashboardData(currentUser.id);
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Error cargando datos del usuario', 'error');
    }
}

// Initialize navigation
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const logoutBtn = document.getElementById('logoutBtn');

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

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }
}

// Initialize tabs
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab pane
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            
            // Load tab data
            loadTabData(tabName);
        });
    });
}

// Load tab data
function loadTabData(tabName) {
    if (!currentUser) return;
    
    switch (tabName) {
        case 'overview':
            loadOverviewData(currentUser.id);
            break;
        case 'rewards':
            loadRewardsData(currentUser.id);
            break;
        case 'referrals':
            loadReferralsData(currentUser.id);
            break;
        case 'history':
            loadHistoryData(currentUser.id);
            break;
    }
}

// Load dashboard data
async function loadDashboardData(userId) {
    await loadOverviewData(userId);
    await loadRewardsData(userId);
    await loadReferralsData(userId);
    await loadHistoryData(userId);
}

// Load overview data
async function loadOverviewData(userId) {
    try {
        const [statsResponse, actionsResponse] = await Promise.all([
            fetch('/api/user/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            }),
            fetch('/api/user/actions', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            })
        ]);

        if (!statsResponse.ok || !actionsResponse.ok) {
            throw new Error('Failed to load overview data');
        }

        const statsData = await statsResponse.json();
        const actionsData = await actionsResponse.json();
        
        const stats = statsData.stats;
        const actions = actionsData.actions;

        // Update stats
        document.getElementById('totalEarned').textContent = stats.puntos_ganados || 0;
        document.getElementById('totalRewards').textContent = stats.total_recompensas || 0;
        document.getElementById('totalReferrals').textContent = stats.total_referidos || 0;
        
        // Calculate points needed for next level
        let nextLevelPoints = 0;
        if (currentUser.nivel === 'Bronce') {
            nextLevelPoints = 500 - currentUser.puntos;
        } else if (currentUser.nivel === 'Plata') {
            nextLevelPoints = 1000 - currentUser.puntos;
        } else {
            nextLevelPoints = 0;
        }
        document.getElementById('nextLevel').textContent = nextLevelPoints > 0 ? nextLevelPoints : '¡Máximo nivel!';
        
        // Load recent activity
        const activityList = document.getElementById('recentActivity');
        activityList.innerHTML = '';
        
        if (actions.length === 0) {
            activityList.innerHTML = '<div class="activity-item"><p>No hay actividad reciente</p></div>';
            return;
        }
        
        actions.slice(0, 5).forEach(action => {
            const activityItem = createActivityItem(action);
            activityList.appendChild(activityItem);
        });
    } catch (error) {
        console.error('Error loading overview data:', error);
        showNotification('Error cargando datos del resumen', 'error');
    }
}

// Load rewards data
async function loadRewardsData(userId) {
    try {
        const response = await fetch('/api/rewards');
        if (!response.ok) {
            throw new Error('Failed to load rewards');
        }

        const data = await response.json();
        const availableRewards = data.rewards;
        
        // Load available rewards
        const rewardsGrid = document.getElementById('rewardsGrid');
        rewardsGrid.innerHTML = '';
        
        availableRewards.forEach(reward => {
            const canAfford = currentUser.puntos >= reward.puntos_requeridos;
            const rewardCard = createRewardCard(reward, canAfford);
            rewardsGrid.appendChild(rewardCard);
        });
        
        // Load user's rewards (this would need a new API endpoint)
        const myRewardsList = document.getElementById('myRewardsList');
        myRewardsList.innerHTML = '<p>Funcionalidad en desarrollo</p>';
    } catch (error) {
        console.error('Error loading rewards data:', error);
        showNotification('Error cargando recompensas', 'error');
    }
}

// Load referrals data
async function loadReferralsData(userId) {
    try {
        // This would need new API endpoints for referrals
        const referralsList = document.getElementById('referralsList');
        referralsList.innerHTML = '<div class="referral-item"><p>Funcionalidad en desarrollo</p></div>';
        
        // Update stats with placeholder data
        document.getElementById('completedReferrals').textContent = '0';
        document.getElementById('pendingReferrals').textContent = '0';
        document.getElementById('referralPoints').textContent = '0';
    } catch (error) {
        console.error('Error loading referrals data:', error);
        showNotification('Error cargando referidos', 'error');
    }
}

// Load history data
async function loadHistoryData(userId) {
    try {
        const response = await fetch('/api/user/actions', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load history');
        }

        const data = await response.json();
        const actions = data.actions;
        
        // Load all history
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        
        if (actions.length === 0) {
            historyList.innerHTML = '<div class="history-item"><p>No hay historial disponible</p></div>';
            return;
        }
        
        actions.forEach(action => {
            const historyItem = createHistoryItem(action);
            historyList.appendChild(historyItem);
        });
        
        // Initialize filters
        initHistoryFilters(actions);
    } catch (error) {
        console.error('Error loading history data:', error);
        showNotification('Error cargando historial', 'error');
    }
}

// Initialize history filters
function initHistoryFilters(actions) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const historyItems = document.querySelectorAll('.history-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active filter button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter items
            historyItems.forEach(item => {
                const actionType = item.getAttribute('data-type');
                const points = parseInt(item.getAttribute('data-points'));
                
                let show = true;
                if (filter === 'earned') {
                    show = points > 0;
                } else if (filter === 'spent') {
                    show = points < 0;
                }
                
                item.style.display = show ? 'block' : 'none';
            });
        });
    });
}

// Create activity item
function createActivityItem(action) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
        <div class="activity-icon">${getActionIcon(action.tipo_accion)}</div>
        <div class="activity-content">
            <p class="activity-description">${action.descripcion}</p>
            <p class="activity-date">${formatDate(action.fecha)}</p>
        </div>
        <div class="activity-points ${action.puntos_obtenidos > 0 ? 'positive' : 'negative'}">
            ${action.puntos_obtenidos > 0 ? '+' : ''}${action.puntos_obtenidos}
        </div>
    `;
    return item;
}

// Create reward card
function createRewardCard(reward, canAfford) {
    const card = document.createElement('div');
    card.className = `reward-card ${canAfford ? 'affordable' : 'expensive'}`;
    card.innerHTML = `
        <div class="reward-header">
            <h4>${reward.nombre}</h4>
            <div class="reward-icon">${getRewardIcon(reward.tipo)}</div>
        </div>
        <p class="reward-description">${reward.descripcion}</p>
        <div class="reward-footer">
            <span class="reward-points">${reward.puntos_requeridos} puntos</span>
            <button class="btn btn-primary" onclick="redeemReward(${reward.id})" ${!canAfford ? 'disabled' : ''}>
                ${canAfford ? 'Canjear' : 'Puntos insuficientes'}
            </button>
        </div>
    `;
    return card;
}

// Create my reward item
function createMyRewardItem(reward) {
    const item = document.createElement('div');
    item.className = 'my-reward-item';
    item.innerHTML = `
        <div class="reward-info">
            <h4>${reward.reward_name}</h4>
            <p>Canjeado el ${formatDate(reward.fecha)}</p>
        </div>
        <div class="reward-status ${reward.usado ? 'used' : 'unused'}">
            ${reward.usado ? 'Usado' : 'Disponible'}
        </div>
    `;
    return item;
}

// Create referral item
function createReferralItem(referral) {
    const item = document.createElement('div');
    item.className = 'referral-item';
    item.innerHTML = `
        <div class="referral-info">
            <h4>${referral.invitado_email}</h4>
            <p>Invitado el ${formatDate(referral.fecha)}</p>
        </div>
        <div class="referral-status ${referral.estado}">
            ${referral.estado === 'completado' ? '✅ Completado' : '⏳ Pendiente'}
        </div>
    `;
    return item;
}

// Create history item
function createHistoryItem(action) {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.setAttribute('data-type', action.tipo_accion);
    item.setAttribute('data-points', action.puntos_obtenidos);
    item.innerHTML = `
        <div class="history-icon">${getActionIcon(action.tipo_accion)}</div>
        <div class="history-content">
            <p class="history-description">${action.descripcion}</p>
            <p class="history-date">${formatDate(action.fecha)}</p>
        </div>
        <div class="history-points ${action.puntos_obtenidos > 0 ? 'positive' : 'negative'}">
            ${action.puntos_obtenidos > 0 ? '+' : ''}${action.puntos_obtenidos}
        </div>
    `;
    return item;
}

// Initialize modals
function initModals() {
    // Invite modal
    const inviteModal = document.getElementById('inviteModal');
    const inviteBtn = document.getElementById('inviteFriendBtn');
    const closeInviteBtn = document.getElementById('closeInviteModal');
    
    if (inviteBtn) {
        inviteBtn.addEventListener('click', function() {
            inviteModal.style.display = 'block';
        });
    }
    
    if (closeInviteBtn) {
        closeInviteBtn.addEventListener('click', function() {
            inviteModal.style.display = 'none';
        });
    }
    
    // Review modal
    const reviewModal = document.getElementById('reviewModal');
    const reviewBtn = document.getElementById('writeReviewBtn');
    const closeReviewBtn = document.getElementById('closeReviewModal');
    
    if (reviewBtn) {
        reviewBtn.addEventListener('click', function() {
            reviewModal.style.display = 'block';
            loadUserReview();
        });
    }
    
    // Check if user has already written a review and update button
    checkUserReviewStatus();
    
    if (closeReviewBtn) {
        closeReviewBtn.addEventListener('click', function() {
            reviewModal.style.display = 'none';
        });
    }
    
    // Close modals on background click
    window.addEventListener('click', function(e) {
        if (e.target === inviteModal) {
            inviteModal.style.display = 'none';
        }
        if (e.target === reviewModal) {
            reviewModal.style.display = 'none';
        }
    });
}

// Check user review status and update button
async function checkUserReviewStatus() {
    try {
        const response = await fetch('/api/user/review', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        const reviewBtn = document.getElementById('writeReviewBtn');
        
        if (response.ok) {
            const data = await response.json();
            const userReview = data.review;
            
            if (userReview) {
                // User has already written a review
                reviewBtn.innerHTML = `
                    <span class="action-icon">⭐</span>
                    <span style="color: #e74c3c;">Ya escribiste una reseña</span>
                `;
                reviewBtn.style.cursor = 'not-allowed';
                reviewBtn.style.opacity = '0.7';
                reviewBtn.disabled = true;
            } else {
                // User hasn't written a review yet
                reviewBtn.innerHTML = `
                    <span class="action-icon">⭐</span>
                    <span>Escribir Reseña</span>
                `;
                reviewBtn.style.cursor = 'pointer';
                reviewBtn.style.opacity = '1';
                reviewBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Error checking review status:', error);
    }
}

// Load user review
async function loadUserReview() {
    try {
        const response = await fetch('/api/user/review', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        const reviewForm = document.getElementById('reviewForm');
        
        if (response.ok) {
            const data = await response.json();
            const userReview = data.review;
            
            if (userReview) {
                reviewForm.querySelector('#reviewText').value = userReview.texto;
                const stars = reviewForm.querySelectorAll('.star');
                stars.forEach(star => {
                    if (parseInt(star.getAttribute('data-rating')) <= userReview.rating) {
                        star.classList.add('active');
                    } else {
                        star.classList.remove('active');
                    }
                    star.style.pointerEvents = ''; // Allow editing
                });
                reviewForm.querySelector('button[type="submit"]').textContent = 'Actualizar Reseña';
            } else {
                reviewForm.querySelector('#reviewText').value = '';
                const stars = reviewForm.querySelectorAll('.star');
                stars.forEach(star => {
                    star.classList.remove('active');
                    star.style.pointerEvents = '';
                });
                reviewForm.querySelector('button[type="submit"]').textContent = 'Publicar Reseña';
            }
        } else {
            // No review exists
            reviewForm.querySelector('#reviewText').value = '';
            const stars = reviewForm.querySelectorAll('.star');
            stars.forEach(star => {
                star.classList.remove('active');
                star.style.pointerEvents = '';
            });
            reviewForm.querySelector('button[type="submit"]').textContent = 'Publicar Reseña';
        }
    } catch (error) {
        console.error('Error loading user review:', error);
    }
}

// Initialize actions
function initActions() {
    // Copy referral code
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', function() {
            const code = document.getElementById('referralCode').textContent;
            copyToClipboard(code);
            copyCodeBtn.classList.add('copied');
            showNotification('¡Código copiado al portapapeles!', 'success');
            setTimeout(() => copyCodeBtn.classList.remove('copied'), 1200);
        });
    }
    
    // Copy referral link
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', function() {
            const link = document.getElementById('referralLink').value;
            copyToClipboard(link);
            copyLinkBtn.classList.add('copied');
            showNotification('¡Link copiado al portapapeles!', 'success');
            setTimeout(() => copyLinkBtn.classList.remove('copied'), 1200);
        });
    }
    
    // Invite form
    const inviteForm = document.getElementById('inviteForm');
    if (inviteForm) {
        inviteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const friendEmail = formData.get('friendEmail');
            
            if (!friendEmail) {
                showNotification('Introduce el email de tu amigo', 'error');
                return;
            }
            
            // This would need a new API endpoint for referrals
            showNotification('Funcionalidad en desarrollo', 'info');
            this.reset();
            document.getElementById('inviteModal').style.display = 'none';
        });
    }
    
    // Review form
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const reviewText = reviewForm.querySelector('#reviewText').value;
            const activeStar = reviewForm.querySelector('.star.active');
            let rating = activeStar ? parseInt(activeStar.getAttribute('data-rating')) : 5;
            
            if (!reviewText) {
                showNotification('Escribe tu reseña', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({
                        texto: reviewText,
                        rating: rating
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al publicar reseña');
                }

                const data = await response.json();
                
                if (data.pointsEarned) {
                    showPointsToast(data.pointsEarned, 'por tu reseña');
                } else {
                    showNotification('Reseña actualizada', 'success');
                }
                
                reviewForm.reset();
                document.getElementById('reviewModal').style.display = 'none';
                updateAllDashboardData();
            } catch (error) {
                console.error('Error submitting review:', error);
                showNotification(error.message, 'error');
            }
        });
    }
    
    // Rating stars
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            
            // Update stars
            stars.forEach(s => {
                s.classList.remove('active');
                if (s.getAttribute('data-rating') <= rating) {
                    s.classList.add('active');
                }
            });
            
            // Add hidden input for form
            let ratingInput = document.querySelector('input[name="rating"]');
            if (!ratingInput) {
                ratingInput = document.createElement('input');
                ratingInput.type = 'hidden';
                ratingInput.name = 'rating';
                reviewForm.appendChild(ratingInput);
            }
            ratingInput.value = rating;
        });
    });
    
    // Book service button
    const bookServiceBtn = document.getElementById('bookServiceBtn');
    if (bookServiceBtn) {
        bookServiceBtn.addEventListener('click', function() {
            window.location.href = 'index.html#contacto';
        });
    }
}

// Update all dashboard data
async function updateAllDashboardData() {
    if (!currentUser) return;
    await loadUserData();
    await loadOverviewData(currentUser.id);
    await loadRewardsData(currentUser.id);
    await loadReferralsData(currentUser.id);
    await loadHistoryData(currentUser.id);
    await checkUserReviewStatus();
}

// Redeem reward
async function redeemReward(rewardId) {
    try {
        const response = await fetch('/api/rewards/redeem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ rewardId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al canjear recompensa');
        }

        const data = await response.json();
        showNotification(data.message, 'success');
        
        // Reload dashboard data
        await updateAllDashboardData();
    } catch (error) {
        console.error('Error redeeming reward:', error);
        showNotification(error.message, 'error');
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

// Show notification
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
        font-size: 1.08rem;
        letter-spacing: 0.01em;
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
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

// Show points toast
function showPointsToast(points, motivo) {
    showNotification(`🎉 ¡Has ganado ${points} Vibes Points ${motivo ? motivo : ''}!`, 'success');
}

// Utility functions
function getActionIcon(actionType) {
    const icons = {
        'registro': '🎉',
        'compra': '💰',
        'reseña': '⭐',
        'referido': '👥',
        'canje': '🎁',
        'nivel_up': '🏆',
        'hito': '🎯'
    };
    return icons[actionType] || '📝';
}

function getRewardIcon(rewardType) {
    const icons = {
        'descuento': '💰',
        'porcentaje': '📊',
        'gratis': '🎁'
    };
    return icons[rewardType] || '🎁';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
} 