// Gestion de l'authentification admin
class AdminAuth {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuthStatus();
  }

  setupEventListeners() {
    // Bouton admin dans la navigation
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
      adminBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLoginModal();
      });
    }

    // Modal de connexion
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
      adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Boutons de fermeture du modal
    const closeAdminModal = document.getElementById('closeAdminModal');
    const cancelAdminLogin = document.getElementById('cancelAdminLogin');
    
    if (closeAdminModal) {
      closeAdminModal.addEventListener('click', () => this.hideLoginModal());
    }
    
    if (cancelAdminLogin) {
      cancelAdminLogin.addEventListener('click', () => this.hideLoginModal());
    }

    // Fermer le modal en cliquant à l'extérieur
    const adminLoginModal = document.getElementById('adminLoginModal');
    if (adminLoginModal) {
      adminLoginModal.addEventListener('click', (e) => {
        if (e.target === adminLoginModal) {
          this.hideLoginModal();
        }
      });
    }

    // Protection contre le retour en arrière après déconnexion
    window.addEventListener('popstate', () => {
      this.checkAuthStatus();
    });
  }

  checkAuthStatus() {
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    const adminBtn = document.getElementById('adminBtn');
    
    if (adminBtn) {
      if (isAuthenticated) {
        adminBtn.style.display = 'flex';
        adminBtn.innerHTML = '<i class="ri-shield-user-line"></i> Administration';
      } else {
        // Pour le développement : toujours afficher le bouton
        adminBtn.style.display = 'flex';
        adminBtn.innerHTML = '<i class="ri-shield-user-line"></i> Connexion Admin';
      }
    }

    // Si on est sur la page admin et qu'on n'est pas authentifié
    if (window.location.pathname.includes('admin.html') && !isAuthenticated) {
      window.location.href = 'index.html';
    }
  }

  // Ajouter une méthode pour afficher temporairement le bouton de connexion
  showAdminAccess() {
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
      adminBtn.style.display = 'flex';
      adminBtn.innerHTML = '<i class="ri-shield-user-line"></i> Connexion Admin';
    }
  }

  showLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    const errorDiv = document.getElementById('adminLoginError');
    const form = document.getElementById('adminLoginForm');
    
    if (modal) {
      modal.style.display = 'flex';
      // Réinitialiser le formulaire et cacher les erreurs
      if (form) form.reset();
      if (errorDiv) errorDiv.style.display = 'none';
      
      // Focus sur le premier champ
      setTimeout(() => {
        const usernameInput = document.getElementById('adminUsername');
        if (usernameInput) usernameInput.focus();
      }, 100);
    }
  }

  hideLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    const form = document.getElementById('adminLoginForm');
    const errorDiv = document.getElementById('adminLoginError');
    
    if (modal) {
      modal.style.display = 'none';
      if (form) form.reset();
      if (errorDiv) errorDiv.style.display = 'none';
    }
  }

  async handleLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('adminLoginError');
    const submitBtn = document.querySelector('#adminLoginForm button[type="submit"]');
    
    // Désactiver le bouton pendant la vérification
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="ri-loader-line"></i> Vérification...';
    }

    try {
      // Simuler une vérification côté serveur (remplacer par un vrai appel API)
      const isAuthenticated = await this.authenticateUser(username, password);
      
      if (isAuthenticated) {
        // Authentification réussie
        localStorage.setItem('adminAuthenticated', 'true');
        localStorage.setItem('adminLoginTime', new Date().toISOString());
        localStorage.setItem('adminUsername', username);
        
        // Mettre à jour le bouton admin immédiatement
        this.updateAdminButton(true);
        
        // Fermer le modal
        this.hideLoginModal();
        
        // Rediriger vers la page admin
        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 500);
      } else {
        // Afficher l'erreur
        if (errorDiv) {
          errorDiv.style.display = 'flex';
        }
        
        // Réactiver le bouton
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="ri-login-box-line"></i> Se connecter';
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      
      // Afficher l'erreur
      if (errorDiv) {
        errorDiv.style.display = 'flex';
        errorDiv.querySelector('span').textContent = 'Erreur de connexion. Veuillez réessayer.';
      }
      
      // Réactiver le bouton
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="ri-login-box-line"></i> Se connecter';
      }
    }
  }

  updateAdminButton(isAuthenticated) {
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
      if (isAuthenticated) {
        adminBtn.innerHTML = '<i class="ri-shield-user-line"></i> Administration';
      } else {
        adminBtn.innerHTML = '<i class="ri-shield-user-line"></i> Connexion Admin';
      }
    }
  }

  async authenticateUser(username, password) {
    // Utiliser la configuration du fichier admin-config.js
    try {
      const user = validateCredentials(username, password);
      
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return user !== undefined;
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      return false;
    }
  }

  // Méthode pour se déconnecter
  logout() {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminLoginTime');
    window.location.href = 'index.html';
  }

  // Vérifier si la session est toujours valide (24h)
  isSessionValid() {
    const loginTime = localStorage.getItem('adminLoginTime');
    if (!loginTime) return false;
    
    const loginDate = new Date(loginTime);
    const now = new Date();
    const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
    
    return hoursDiff < 24;
  }
}

// Initialiser l'authentification admin
document.addEventListener('DOMContentLoaded', () => {
  new AdminAuth();
});

// Fonctions globales pour la déconnexion
function adminLogout() {
  const auth = new AdminAuth();
  auth.logout();
}
