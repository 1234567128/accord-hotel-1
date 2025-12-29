// Gestionnaire de disponibilité des chambres
class AvailabilityChecker {
  constructor() {
    this.form = document.getElementById('availabilityForm');
    this.resultsDiv = document.getElementById('availabilityResults');
    this.roomsList = document.getElementById('roomsList');
    this.init();
  }

  init() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    // Définir la date minimale à aujourd'hui
    this.setMinDates();
  }

  setMinDates() {
    const today = new Date().toISOString().split('T')[0];
    const arrivalInput = document.getElementById('arrival');
    const departureInput = document.getElementById('departure');
    
    if (arrivalInput) {
      arrivalInput.min = today;
    }
    
    if (departureInput) {
      departureInput.min = today;
      
      // Mettre à jour la date minimale de départ quand la date d'arrivée change
      arrivalInput.addEventListener('change', () => {
        departureInput.min = arrivalInput.value;
        if (departureInput.value && departureInput.value <= arrivalInput.value) {
          const nextDay = new Date(arrivalInput.value);
          nextDay.setDate(nextDay.getDate() + 1);
          departureInput.value = nextDay.toISOString().split('T')[0];
        }
      });
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(this.form);
    const data = {
      arrivalDate: formData.get('arrival'),
      departureDate: formData.get('departure'),
      capacity: parseInt(formData.get('guests'))
    };

    // Validation
    if (!this.validateForm(data)) {
      return;
    }

    this.showLoading();
    
    try {
      const response = await fetch('/api/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (response.ok) {
        this.displayResults(result);
      } else {
        this.showError(result.error || 'Une erreur est survenue');
      }
    } catch (error) {
      this.showError('Erreur de connexion au serveur');
    }
  }

  validateForm(data) {
    const errors = [];

    if (!data.arrivalDate) {
      errors.push('La date d\'arrivée est requise');
    }

    if (!data.departureDate) {
      errors.push('La date de départ est requise');
    }

    if (data.arrivalDate && data.departureDate) {
      const arrival = new Date(data.arrivalDate);
      const departure = new Date(data.departureDate);
      
      if (arrival >= departure) {
        errors.push('La date de départ doit être postérieure à la date d\'arrivée');
      }
      
      if (arrival < new Date().setHours(0, 0, 0, 0)) {
        errors.push('La date d\'arrivée ne peut pas être dans le passé');
      }
    }

    if (!data.capacity || data.capacity < 1) {
      errors.push('Le nombre d\'invités doit être d\'au moins 1');
    }

    if (data.capacity > 10) {
      errors.push('Le nombre d\'invités ne peut pas dépasser 10');
    }

    if (errors.length > 0) {
      this.showError(errors.join('<br>'));
      return false;
    }

    return true;
  }

  showLoading() {
    this.resultsDiv.style.display = 'block';
    this.roomsList.innerHTML = '<div class="loading">Vérification de la disponibilité...</div>';
  }

  displayResults(result) {
    this.resultsDiv.style.display = 'block';
    
    if (result.availableRooms && result.availableRooms.length > 0) {
      this.roomsList.innerHTML = result.availableRooms.map(room => this.createRoomCard(room)).join('');
      
      // Ajouter les écouteurs d'événements pour les boutons de réservation
      this.roomsList.querySelectorAll('.book-room-btn').forEach(btn => {
        btn.addEventListener('click', (e) => this.handleBooking(e));
      });
    } else {
      this.roomsList.innerHTML = '<div class="no-rooms">Aucune chambre disponible pour ces dates. Veuillez essayer d\'autres dates.</div>';
    }
  }

  createRoomCard(room) {
    return `
      <div class="room-card" data-room-id="${room.id}">
        <h4>${room.name}</h4>
        <p>${room.description}</p>
        <div class="room-capacity">Capacité: ${room.capacity} personne(s)</div>
        <div class="room-price">${room.price.toLocaleString('fr-FR')} FCFA<span>/nuit</span></div>
        <button class="book-room-btn" data-room-id="${room.id}">
          Réserver cette chambre
        </button>
      </div>
    `;
  }

  async handleBooking(e) {
    const btn = e.target;
    const roomId = parseInt(btn.dataset.roomId);
    
    // Récupérer les données du formulaire
    const formData = new FormData(this.form);
    const bookingData = {
      roomId: roomId,
      arrivalDate: formData.get('arrival'),
      departureDate: formData.get('departure'),
      guests: parseInt(formData.get('guests'))
    };

    // Rediriger vers la page de checkout avec les paramètres
    const params = new URLSearchParams(bookingData);
    window.location.href = `checkout.html?${params.toString()}`;
  }

  calculateTotal(pricePerNight, arrivalDate, departureDate) {
    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);
    const nights = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));
    return pricePerNight * nights;
  }

  showError(message) {
    this.resultsDiv.style.display = 'block';
    this.roomsList.innerHTML = `<div class="error-message" style="color: #e74c3c; text-align: center; padding: 1rem;">${message}</div>`;
  }
}

// Initialiser le système de réservation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
  new AvailabilityChecker();
});
