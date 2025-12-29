// Configuration des accès administrateur
const ADMIN_CONFIG = {
  // Définir ici les identifiants administrateurs
  credentials: [
    {
      username: 'admin',
      password: 'acordhotel2024',
      role: 'admin',
      name: 'Administrateur Principal'
    },
    {
      username: 'manager',
      password: 'manager2024',
      role: 'manager',
      name: 'Manager'
    },
    {
      username: 'reception',
      password: 'reception2024',
      role: 'reception',
      name: 'Réception'
    }
  ],
  
  // Configuration de sécurité
  security: {
    sessionTimeout: 24, // heures
    maxAttempts: 3,
    lockoutTime: 15 // minutes
  },
  
  // Pour ajouter/modifier un utilisateur :
  // 1. Ajouter un objet dans le tableau credentials
  // 2. Changer username, password, role, name selon vos besoins
  // 3. Rafraîchir la page pour appliquer les changements
  
  // Exemple pour ajouter un nouvel utilisateur :
  // {
  //   username: 'nouveau',
  //   password: 'nouveaupass',
  //   role: 'staff',
  //   name: 'Nouveau Staff'
  // }
};

// Fonction pour valider les identifiants
function validateCredentials(username, password) {
  return ADMIN_CONFIG.credentials.find(cred => 
    cred.username === username && cred.password === password
  );
}

// Fonction pour obtenir les infos utilisateur
function getUserInfo(username) {
  return ADMIN_CONFIG.credentials.find(cred => cred.username === username);
}

// Exporter pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ADMIN_CONFIG, validateCredentials, getUserInfo };
}
