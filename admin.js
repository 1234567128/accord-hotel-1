// Tableau de bord administration
class AdminDashboard {
  constructor() {
    this.roomsData = [];
    this.bookingsData = [];
    this.init();
  }

  async init() {
    await this.loadRooms();
    await this.loadBookings();
    await this.updateStats();
    
    // Ajouter l'écouteur d'événements pour le formulaire d'ajout
    const newRoomForm = document.getElementById('newRoomForm');
    if (newRoomForm) {
      newRoomForm.addEventListener('submit', (e) => this.handleAddRoom(e));
    }
    
    // Actualisation automatique toutes les 30 secondes
    setInterval(() => {
      this.loadRooms();
      this.loadBookings();
      this.updateStats();
    }, 30000);
  }

  // Charger les données depuis localStorage ou utiliser les données par défaut
  loadFromLocalStorage(key, defaultData) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultData;
    } catch (error) {
      console.error(`Erreur lors du chargement de ${key}:`, error);
      return defaultData;
    }
  }

  // Sauvegarder les données dans localStorage
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
    }
  }

  async loadRooms() {
    try {
      const response = await fetch('/api/rooms');
      this.roomsData = await response.json();
      
      const roomList = document.getElementById('roomsList');
      if (roomList) {
        roomList.innerHTML = this.roomsData.map(room => this.createRoomItem(room)).join('');
        
        // Ajouter les écouteurs d'événements pour les boutons
        roomList.querySelectorAll('.toggle-btn').forEach(btn => {
          btn.addEventListener('click', (e) => this.toggleRoomAvailability(e));
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chambres:', error);
    }
  }

  async loadBookings() {
    try {
      const response = await fetch('/api/bookings');
      this.bookingsData = await response.json();
      
      const bookingsTable = document.getElementById('bookingsTable');
      if (bookingsTable) {
        bookingsTable.innerHTML = this.bookingsData.map(booking => this.createBookingRow(booking)).join('');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
    }
  }

  async updateStats() {
    try {
      // Utiliser les données réelles pour les statistiques
      const totalRooms = this.roomsData.length;
      const availableRooms = this.roomsData.filter(room => room.available).length;
      const totalBookings = this.bookingsData.length;
      const todayRevenue = this.bookingsData
        .filter(booking => booking.status === 'confirmed')
        .reduce((sum, booking) => sum + booking.totalPrice, 0);
      
      document.getElementById('totalRooms').textContent = totalRooms;
      document.getElementById('availableRooms').textContent = availableRooms;
      document.getElementById('totalBookings').textContent = totalBookings;
      document.getElementById('todayRevenue').textContent = todayRevenue.toLocaleString('fr-FR') + ' FCFA';
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statistiques:', error);
    }
  }

  createRoomItem(room) {
    return `
      <div class="room-item">
        <div class="room-info">
          <h4><i class="ri-door-lock-line"></i> ${room.name}</h4>
          <p><i class="ri-group-line"></i> Capacité: ${room.capacity} personne(s) | <i class="ri-money-cny-circle-line"></i> Prix: ${room.price.toLocaleString('fr-FR')} FCFA/nuit</p>
          <p><i class="ri-file-text-line"></i> ${room.description}</p>
        </div>
        <div class="room-actions">
          <button class="toggle-btn ${room.available ? 'toggle-available' : 'toggle-unavailable'}" 
                  data-room-id="${room.id}">
            <i class="ri-${room.available ? 'checkbox-circle' : 'close-circle'}-line"></i>
            ${room.available ? 'Disponible' : 'Indisponible'}
          </button>
          <button class="delete-btn" onclick="showDeleteModal('room', ${room.id}, '${room.name}')">
            <i class="ri-delete-bin-line"></i> Supprimer
          </button>
        </div>
      </div>
    `;
  }

  createBookingRow(booking) {
    const arrivalDate = new Date(booking.arrivalDate);
    const departureDate = new Date(booking.departureDate);
    
    const statusClass = booking.status === 'confirmed' ? 'status-confirmed' : 'status-pending';
    const statusText = booking.status === 'confirmed' ? 'Confirmée' : 'En attente';
    
    // Gérer les deux formats de données
    const clientName = booking.clientName || booking.guestName || 'Non spécifié';
    const phone = booking.phone || 'Non spécifié';
    const guests = booking.guests || 1;
    const totalPrice = booking.totalPrice || 0;
    const roomName = booking.roomName || this.getRoomName(booking.roomId);
    
    return `
      <tr>
        <td>#${booking.id}</td>
        <td>
          <div class="booking-info">
            <div class="booking-client">${clientName}</div>
            <div class="booking-contact">${booking.email} | ${phone}</div>
          </div>
        </td>
        <td>
          <span class="booking-room">${roomName}</span>
        </td>
        <td>
          <div class="booking-dates">
            <div class="booking-date">${arrivalDate.toLocaleDateString('fr-FR')}</div>
            <div class="booking-date">${departureDate.toLocaleDateString('fr-FR')}</div>
          </div>
        </td>
        <td>${guests}</td>
        <td>
          <div class="booking-price">${totalPrice.toLocaleString('fr-FR')} FCFA</div>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td>
          <button class="delete-btn" onclick="showDeleteModal('booking', ${booking.id}, '${clientName}')">
            <i class="ri-delete-bin-line"></i> Supprimer
          </button>
        </td>
      </tr>
    `;
  }

  getRoomName(roomId) {
    const room = this.roomsData.find(r => r.id === roomId);
    return room ? room.name : 'Chambre inconnue';
  }

  // Fonctions utilitaires
  toggleAddRoomForm() {
    const form = document.getElementById('addRoomForm');
    if (form) {
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
  }

  async toggleRoomAvailability(event) {
    const button = event.target;
    const roomId = button.dataset.roomId;
    const isCurrentlyAvailable = button.classList.contains('toggle-available');
    
    // Ajouter un effet de chargement
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="ri-loader-4-line animate-spin"></i> Mise à jour...';
    button.disabled = true;
    
    try {
      const response = await fetch(`/api/rooms/${roomId}/toggle`, {
        method: 'PATCH'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Inverser l'état
        if (isCurrentlyAvailable) {
          button.classList.remove('toggle-available');
          button.classList.add('toggle-unavailable');
          button.innerHTML = '<i class="ri-close-circle-line"></i> Indisponible';
          this.showNotification('Chambre marquée comme indisponible', 'warning');
        } else {
          button.classList.remove('toggle-unavailable');
          button.classList.add('toggle-available');
          button.innerHTML = '<i class="ri-checkbox-circle-line"></i> Disponible';
          this.showNotification('Chambre marquée comme disponible', 'success');
        }
        
        // Recharger les données
        this.loadRooms();
        this.updateStats();
      } else {
        this.showNotification(result.error || 'Erreur lors de la mise à jour', 'error');
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    } catch (error) {
      console.error('Erreur:', error);
      this.showNotification('Erreur de connexion au serveur', 'error');
      button.innerHTML = originalContent;
      button.disabled = false;
    }
  }

  async handleAddRoom(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const newRoom = {
      name: formData.get('name'),
      price: parseInt(formData.get('price')),
      type: formData.get('type'),
      capacity: parseInt(formData.get('capacity')),
      description: formData.get('description')
    };
    
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRoom)
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('Chambre ajoutée avec succès!', 'success');
        this.loadRooms(); // Recharger pour voir la nouvelle chambre
        this.updateStats();
      } else {
        this.showNotification(result.error || 'Erreur lors de l\'ajout', 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      this.showNotification('Erreur de connexion au serveur', 'error');
    }
    
    // Réinitialiser le formulaire
    event.target.reset();
    document.getElementById('addRoomForm').style.display = 'none';
  }

  // Système de notification
  showNotification(message, type = 'info') {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="ri-${type === 'success' ? 'checkbox-circle' : type === 'warning' ? 'alert' : 'information'}-line"></i>
      <span>${message}</span>
    `;
    
    // Ajouter au DOM
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

// Fonctions globales
function toggleAddRoomForm() {
  const form = document.getElementById('addRoomForm');
  if (form) {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  }
}

function showDeleteModal(type, id, name) {
  const modal = document.getElementById('deleteModal');
  const deleteTypeText = document.getElementById('deleteTypeText');
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  
  if (deleteTypeText) {
    deleteTypeText.textContent = type === 'room' ? ' chambre' : ' réservation';
  }
  
  if (confirmBtn) {
    confirmBtn.onclick = () => {
      // Effectuer la suppression
      performDelete(type, id, name);
      closeDeleteModal();
    };
  }
  
  if (modal) {
    modal.style.display = 'flex';
  }
}

async function performDelete(type, id, name) {
  // Afficher une notification de suppression
  if (window.dashboard) {
    window.dashboard.showNotification(`Suppression de ${type === 'room' ? 'la chambre' : 'la réservation'} "${name}"...`, 'info');
  }
  
  try {
    let response;
    if (type === 'room') {
      // Appeler l'API pour supprimer la chambre
      response = await fetch(`/api/rooms/${id}`, {
        method: 'DELETE'
      });
    } else if (type === 'booking') {
      // Appeler l'API pour supprimer la réservation
      response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE'
      });
    }
    
    const result = await response.json();
    
    if (result.success) {
      // Afficher une notification de succès
      if (window.dashboard) {
        window.dashboard.showNotification(`${type === 'room' ? 'Chambre' : 'Réservation'} "${name}" supprimée avec succès`, 'success');
      }
      
      // Suppression immédiate de l'élément du DOM avec animation
      if (type === 'room') {
        // Trouver et supprimer l'élément de chambre du DOM
        const roomElement = document.querySelector(`[data-room-id="${id}"]`).closest('.room-item');
        if (roomElement) {
          // Ajouter la classe d'animation
          roomElement.classList.add('removing');
          
          // Supprimer après l'animation
          setTimeout(() => {
            roomElement.remove();
          }, 300);
        }
      } else if (type === 'booking') {
        // Trouver et supprimer l'élément de réservation du DOM
        const bookingRow = document.querySelector(`button[onclick="showDeleteModal('booking', ${id}, '${name}')"]`).closest('tr');
        if (bookingRow) {
          // Ajouter la classe d'animation
          bookingRow.classList.add('removing');
          
          // Supprimer après l'animation
          setTimeout(() => {
            bookingRow.remove();
          }, 300);
        } else {
          // Alternative : chercher par ID dans la première cellule
          const alternativeRow = Array.from(document.querySelectorAll('tr')).find(row => 
            row.querySelector('td') && row.querySelector('td').textContent.includes(`#${id}`)
          );
          if (alternativeRow) {
            alternativeRow.classList.add('removing');
            setTimeout(() => {
              alternativeRow.remove();
            }, 300);
          }
        }
      }
      
      // Recharger les données et mettre à jour les statistiques
      if (type === 'room') {
        await window.dashboard.loadRooms();
      } else if (type === 'booking') {
        await window.dashboard.loadBookings();
      }
      window.dashboard.updateStats();
      
    } else {
      throw new Error(result.error || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    if (window.dashboard) {
      window.dashboard.showNotification('Erreur lors de la suppression: ' + error.message, 'error');
    }
  }
}

function closeDeleteModal() {
  const modal = document.getElementById('deleteModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function adminLogout() {
  if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminLoginTime');
    localStorage.removeItem('adminUsername');
    window.location.href = 'index.html';
  }
}

function goToMainSite() {
  if (confirm('Voulez-vous retourner au site principal ?')) {
    window.location.href = 'index.html';
  }
}

// Initialiser le dashboard
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new AdminDashboard();
});
