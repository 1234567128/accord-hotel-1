// Gestionnaire de checkout
class CheckoutManager {
  constructor() {
    this.selectedRoom = null;
    this.selectedPayment = null;
    this.rooms = [];
    this.init();
  }

  async init() {
    await this.loadRooms();
    this.setupEventListeners();
    this.loadURLParameters();
    this.setupDateValidation();
  }

  async loadRooms() {
    try {
      const response = await fetch('/api/rooms');
      this.rooms = await response.json();
      this.displayRooms();
    } catch (error) {
      console.error('Erreur lors du chargement des chambres:', error);
      this.showError('Impossible de charger les chambres disponibles');
    }
  }

  displayRooms() {
    const roomSelection = document.getElementById('roomSelection');
    if (!roomSelection) return;

    const availableRooms = this.rooms.filter(room => room.available);
    
    if (availableRooms.length === 0) {
      roomSelection.innerHTML = '<p style="text-align: center; color: #e74c3c;">Aucune chambre disponible pour le moment.</p>';
      return;
    }

    roomSelection.innerHTML = availableRooms.map(room => this.createRoomOption(room)).join('');
    
    // Ajouter les écouteurs d'événements
    roomSelection.querySelectorAll('.room-option').forEach(option => {
      option.addEventListener('click', () => this.selectRoom(option));
    });
  }

  createRoomOption(room) {
    return `
      <div class="room-option" data-room-id="${room.id}" data-price="${room.price}" data-name="${room.name}">
        <div class="room-option-header">
          <h4>${room.name}</h4>
          <div class="room-price">${room.price.toLocaleString('fr-FR')} FCFA</div>
        </div>
        <div class="room-details">
          <p>Capacité: ${room.capacity} personne(s)</p>
          <p>${room.description}</p>
        </div>
      </div>
    `;
  }

  selectRoom(option) {
    // Désélectionner les autres options
    document.querySelectorAll('.room-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    
    // Sélectionner l'option actuelle
    option.classList.add('selected');
    
    // Mettre à jour la chambre sélectionnée
    this.selectedRoom = {
      id: parseInt(option.dataset.roomId),
      name: option.dataset.name,
      price: parseInt(option.dataset.price)
    };
    
    this.updateSummary();
  }

  setupEventListeners() {
    // Formulaire principal
    const form = document.getElementById('checkoutForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Options de paiement
    document.querySelectorAll('.payment-option').forEach(option => {
      option.addEventListener('click', () => this.selectPayment(option));
    });

    // Changement de dates
    const arrivalDate = document.getElementById('arrivalDate');
    const departureDate = document.getElementById('departureDate');
    
    if (arrivalDate) arrivalDate.addEventListener('change', () => this.updateSummary());
    if (departureDate) departureDate.addEventListener('change', () => this.updateSummary());
    
    // Validation des champs de carte bancaire
    this.setupCardValidation();
  }

  selectPayment(option) {
    // Désélectionner les autres options
    document.querySelectorAll('.payment-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    
    // Sélectionner l'option actuelle
    option.classList.add('selected');
    this.selectedPayment = option.dataset.payment;
    
    // Masquer tous les formulaires de paiement
    document.querySelectorAll('.payment-form').forEach(form => {
      form.classList.remove('active');
    });
    
    // Afficher le formulaire approprié
    if (this.selectedPayment === 'online') {
      document.getElementById('onlinePaymentForm').classList.add('active');
    } else if (this.selectedPayment === 'transfer') {
      document.getElementById('transferPaymentForm').classList.add('active');
    }
  }

  loadURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Charger les paramètres depuis l'URL
    const arrivalDate = urlParams.get('arrivalDate');
    const departureDate = urlParams.get('departureDate');
    const guests = urlParams.get('guests');
    const roomId = urlParams.get('roomId');
    
    if (arrivalDate) {
      const arrivalInput = document.getElementById('arrivalDate');
      if (arrivalInput) arrivalInput.value = arrivalDate;
    }
    
    if (departureDate) {
      const departureInput = document.getElementById('departureDate');
      if (departureInput) departureInput.value = departureDate;
    }
    
    if (guests) {
      const guestsInput = document.getElementById('guests');
      if (guestsInput) guestsInput.value = guests;
    }
    
    // Sélectionner la chambre si spécifiée
    if (roomId) {
      const roomOption = document.querySelector(`.room-option[data-room-id="${roomId}"]`);
      if (roomOption) {
        this.selectRoom(roomOption);
      }
    }
    
    this.updateSummary();
  }

  setupDateValidation() {
    const today = new Date().toISOString().split('T')[0];
    const arrivalInput = document.getElementById('arrivalDate');
    const departureInput = document.getElementById('departureDate');
    
    if (arrivalInput) {
      arrivalInput.min = today;
      arrivalInput.addEventListener('change', () => {
        if (departureInput) {
          departureInput.min = arrivalInput.value;
          if (departureInput.value && departureInput.value <= arrivalInput.value) {
            const nextDay = new Date(arrivalInput.value);
            nextDay.setDate(nextDay.getDate() + 1);
            departureInput.value = nextDay.toISOString().split('T')[0];
          }
        }
      });
    }
    
    if (departureInput) {
      departureInput.min = today;
    }
  }

  updateSummary() {
    const arrivalDate = document.getElementById('arrivalDate')?.value;
    const departureDate = document.getElementById('departureDate')?.value;
    const guests = document.getElementById('guests')?.value;
    
    // Mettre à jour le récapitulatif
    document.getElementById('selectedRoom').textContent = this.selectedRoom ? this.selectedRoom.name : '-';
    document.getElementById('summaryArrival').textContent = arrivalDate ? this.formatDate(arrivalDate) : '-';
    document.getElementById('summaryDeparture').textContent = departureDate ? this.formatDate(departureDate) : '-';
    
    if (arrivalDate && departureDate) {
      const nights = this.calculateNights(arrivalDate, departureDate);
      document.getElementById('summaryNights').textContent = nights;
      
      if (this.selectedRoom) {
        const pricePerNight = this.selectedRoom.price;
        const totalPrice = pricePerNight * nights;
        
        document.getElementById('summaryPrice').textContent = `${pricePerNight.toLocaleString('fr-FR')} FCFA`;
        document.getElementById('summaryTotal').textContent = `${totalPrice.toLocaleString('fr-FR')} FCFA`;
      }
    }
  }

  formatDate(dateString) {
    if (!dateString) return 'Date non spécifiée';
    
    // Si la date est déjà un objet Date, l'utiliser directement
    let date;
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      // Convertir la chaîne en Date
      date = new Date(dateString);
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.error('Date invalide:', dateString);
      return 'Date invalide';
    }
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  calculateNights(arrivalDate, departureDate) {
    const arrival = new Date(arrivalDate);
    const departure = new Date(departureDate);
    return Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    // Validation
    if (!this.validateForm()) {
      return;
    }
    
    // Afficher la modal de confirmation au lieu de traiter directement
    this.showConfirmationModal();
  }

  showConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    
    // Remplir les informations dans la modal
    document.getElementById('modalRoomName').textContent = this.selectedRoom ? this.selectedRoom.name : '-';
    document.getElementById('modalDates').textContent = this.getFormattedDates();
    document.getElementById('modalGuests').textContent = document.getElementById('guests').value + ' personne(s)';
    document.getElementById('modalPaymentMethod').textContent = this.getPaymentMethodName();
    document.getElementById('modalTotal').textContent = this.calculateTotal().toLocaleString('fr-FR') + ' FCFA';
    
    // Afficher la modal
    modal.style.display = 'flex';
    
    // Ajouter l'écouteur d'événement pour le bouton final
    const finalConfirmBtn = document.getElementById('finalConfirmBtn');
    finalConfirmBtn.onclick = () => this.finalConfirmation();
  }

  getFormattedDates() {
    const arrivalDate = document.getElementById('arrivalDate').value;
    const departureDate = document.getElementById('departureDate').value;
    
    if (!arrivalDate || !departureDate) return '-';
    
    return `Du ${this.formatDate(arrivalDate)} au ${this.formatDate(departureDate)}`;
  }

  async finalConfirmation() {
    const finalConfirmBtn = document.getElementById('finalConfirmBtn');
    const originalText = finalConfirmBtn.innerHTML;
    
    // Ajouter l'état de chargement
    finalConfirmBtn.classList.add('btn-loading');
    finalConfirmBtn.innerHTML = 'Traitement...';
    finalConfirmBtn.disabled = true;
    
    try {
      const formData = new FormData(document.getElementById('checkoutForm'));
      const bookingData = {
        roomId: this.selectedRoom.id,
        arrivalDate: formData.get('arrivalDate'),
        departureDate: formData.get('departureDate'),
        guests: parseInt(formData.get('guests')),
        guestName: `${formData.get('firstName')} ${formData.get('lastName')}`,
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        city: formData.get('city'),
        specialRequests: formData.get('specialRequests'),
        paymentMethod: this.selectedPayment,
        totalPrice: this.calculateTotal()
      };
      
      if (this.selectedPayment === 'online') {
        await this.processOnlinePayment(bookingData);
      } else {
        await this.processOfflinePayment(bookingData);
      }
      
      // Fermer la modal en cas de succès
      this.closeConfirmationModal();
      
    } catch (error) {
      console.error('Erreur:', error);
      this.showError('Erreur lors du traitement: ' + error.message);
    } finally {
      // Restaurer le bouton
      finalConfirmBtn.classList.remove('btn-loading');
      finalConfirmBtn.innerHTML = originalText;
      finalConfirmBtn.disabled = false;
    }
  }

  closeConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'none';
  }

  async processOnlinePayment(bookingData) {
    try {
      // Créer l'intention de paiement Stripe
      const clientSecret = await createPaymentIntent(bookingData.totalPrice, 'booking_' + Date.now());
      
      // Obtenir les données de carte
      const cardData = {
        number: document.getElementById('cardNumber').value,
        expiry: document.getElementById('cardExpiry').value,
        cvv: document.getElementById('cardCVV').value,
        name: document.getElementById('cardName').value
      };
      
      // Créer l'élément de carte Stripe (simulation)
      const cardElement = {
        token: 'tok_' + Date.now() // En production, utiliser Stripe Elements
      };
      
      // Confirmer le paiement
      const paymentIntent = await confirmPayment(clientSecret, cardElement);
      
      // Confirmer la réservation avec le paiement
      const response = await fetch('/api/confirm-payment-and-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          bookingData: bookingData
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        this.showSuccess(result);
      } else {
        this.showError(result.error || 'Échec de la réservation');
      }
    } catch (error) {
      this.showError('Erreur lors du traitement du paiement: ' + error.message);
    }
  }

  async processOfflinePayment(bookingData) {
    try {
      const response = await fetch('/api/book-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        this.showSuccess(result);
      } else {
        this.showError(result.error || 'Échec de la réservation');
      }
    } catch (error) {
      this.showError('Erreur lors de la réservation: ' + error.message);
    }
  }

  validateForm() {
    const errors = [];
    
    if (!this.selectedRoom) {
      errors.push('Veuillez sélectionner une chambre');
    }
    
    if (!this.selectedPayment) {
      errors.push('Veuillez choisir une option de paiement');
    }
    
    const arrivalDate = document.getElementById('arrivalDate').value;
    const departureDate = document.getElementById('departureDate').value;
    
    if (!arrivalDate || !departureDate) {
      errors.push('Veuillez sélectionner les dates de séjour');
    }
    
    if (arrivalDate && departureDate && new Date(arrivalDate) >= new Date(departureDate)) {
      errors.push('La date de départ doit être postérieure à la date d\'arrivée');
    }
    
    const email = document.getElementById('email').value;
    if (email && !this.isValidEmail(email)) {
      errors.push('Veuillez entrer une adresse email valide');
    }
    
    // Validation spécifique au paiement en ligne
    if (this.selectedPayment === 'online') {
      const cardNumber = document.getElementById('cardNumber').value;
      const cardExpiry = document.getElementById('cardExpiry').value;
      const cardCVV = document.getElementById('cardCVV').value;
      const cardName = document.getElementById('cardName').value;
      
      if (!cardNumber || !this.isValidCardNumber(cardNumber)) {
        errors.push('Numéro de carte invalide');
      }
      
      if (!cardExpiry || !this.isValidExpiry(cardExpiry)) {
        errors.push('Date d\'expiration invalide (MM/AA)');
      }
      
      if (!cardCVV || !/^\d{3,4}$/.test(cardCVV)) {
        errors.push('CVV invalide (3 ou 4 chiffres)');
      }
      
      if (!cardName || cardName.length < 3) {
        errors.push('Nom sur la carte invalide');
      }
    }
    
    if (errors.length > 0) {
      this.showError(errors.join('<br>'));
      return false;
    }
    
    return true;
  }

  setupCardValidation() {
    // Formatage du numéro de carte
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
      cardNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
      });
    }
    
    // Formatage de la date d'expiration
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
      cardExpiryInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
          value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
      });
    }
    
    // Limitation du CVV aux chiffres
    const cardCVVInput = document.getElementById('cardCVV');
    if (cardCVVInput) {
      cardCVVInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
      });
    }
  }

  isValidCardNumber(number) {
    const cleanNumber = number.replace(/\s/g, '');
    return /^\d{13,19}$/.test(cleanNumber) && this.luhnCheck(cleanNumber);
  }

  luhnCheck(number) {
    let sum = 0;
    let isEven = false;
    
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  isValidExpiry(expiry) {
    const match = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;
    
    const month = parseInt(match[1]);
    const year = parseInt(match[2]) + 2000;
    
    if (month < 1 || month > 12) return false;
    
    const now = new Date();
    const expiryDate = new Date(year, month - 1, 1);
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    expiryDate.setDate(0);
    
    return expiryDate >= now;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  calculateTotal() {
    const arrivalDate = document.getElementById('arrivalDate').value;
    const departureDate = document.getElementById('departureDate').value;
    
    if (!arrivalDate || !departureDate || !this.selectedRoom) {
      return 0;
    }
    
    const nights = this.calculateNights(arrivalDate, departureDate);
    return this.selectedRoom.price * nights;
  }

  showSuccess(result) {
    // S'assurer que les dates sont correctement formatées
    const booking = result.booking;
    
    // Debug: afficher les dates brutes
    console.log('Arrival date raw:', booking.arrivalDate);
    console.log('Departure date raw:', booking.departureDate);
    
    let paymentMessage = '';
    
    switch (this.selectedPayment) {
      case 'online':
        paymentMessage = 'Paiement en ligne traité avec succès. Vous recevrez une confirmation par email.';
        break;
      case 'hotel':
        paymentMessage = 'Vous pourrez régler le montant directement à l\'hôtel lors de votre arrivée.';
        break;
      case 'transfer':
        paymentMessage = 'Veuillez effectuer le virement bancaire et envoyer la preuve par email pour confirmer votre réservation.';
        break;
    }
    
    const message = `
      <div class="success-container">
        <div class="success-animation">
          <div class="checkmark-circle">
            <div class="checkmark"></div>
          </div>
          <div class="confetti">
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
          </div>
        </div>
        
        <div class="success-content">
          <h1 class="success-title">
            <i class="ri-checkbox-circle-line"></i>
            Réservation Confirmée!
          </h1>
          <h2 class="success-subtitle">Merci ${booking.guestName}!</h2>
          <p class="success-message">
            Votre réservation a été confirmée avec succès. Nous vous avons envoyé un email de confirmation avec tous les détails.
          </p>
          
          <div class="booking-details-card">
            <div class="card-header">
              <h3><i class="ri-calendar-check-line"></i> Détails de la réservation</h3>
              <span class="booking-number">#${booking.id}</span>
            </div>
            <div class="card-body">
              <div class="detail-row">
                <div class="detail-icon">
                  <i class="ri-user-line"></i>
                </div>
                <div class="detail-content">
                  <span class="detail-label">Client</span>
                  <span class="detail-value">${booking.guestName}</span>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-icon">
                  <i class="ri-door-line"></i>
                </div>
                <div class="detail-content">
                  <span class="detail-label">Chambre</span>
                  <span class="detail-value">${result.room.name}</span>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-icon">
                  <i class="ri-calendar-line"></i>
                </div>
                <div class="detail-content">
                  <span class="detail-label">Dates de séjour</span>
                  <span class="detail-value">Du ${this.formatDate(booking.arrivalDate)} au ${this.formatDate(booking.departureDate)}</span>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-icon">
                  <i class="ri-time-line"></i>
                </div>
                <div class="detail-content">
                  <span class="detail-label">Durée</span>
                  <span class="detail-value">${this.calculateNights(booking.arrivalDate, booking.departureDate)} nuit(s)</span>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-icon">
                  <i class="ri-group-line"></i>
                </div>
                <div class="detail-content">
                  <span class="detail-label">Invités</span>
                  <span class="detail-value">${booking.guests} personne(s)</span>
                </div>
              </div>
              
              <div class="detail-row total-row">
                <div class="detail-icon">
                  <i class="ri-money-dollar-circle-line"></i>
                </div>
                <div class="detail-content">
                  <span class="detail-label">Total payé</span>
                  <span class="detail-value total-amount">${booking.totalPrice.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="payment-info-card">
            <div class="payment-header">
              <i class="ri-bank-card-line"></i>
              <h4>Méthode de paiement</h4>
            </div>
            <div class="payment-method">
              ${this.getPaymentMethodIcon()} ${this.getPaymentMethodName()}
            </div>
            <p class="payment-message">${paymentMessage}</p>
          </div>
          
          <div class="next-steps">
            <h3><i class="ri-map-pin-line"></i> Prochaines étapes</h3>
            <div class="steps-list">
              <div class="step-item">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h4>Email de confirmation</h4>
                  <p>Un email de confirmation a été envoyé à ${booking.email}</p>
                </div>
              </div>
              <div class="step-item">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h4>Préparation de votre arrivée</h4>
                  <p>Votre chambre sera prête le ${this.formatDate(booking.arrivalDate)}</p>
                </div>
              </div>
              <div class="step-item">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h4>Check-in</h4>
                  <p>Présentez-vous à la réception à partir de 14h00</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="contact-info">
            <h3><i class="ri-customer-service-line"></i> Besoin d'aide?</h3>
            <p>Notre équipe est à votre disposition pour toute question concernant votre réservation.</p>
            <div class="contact-buttons">
              <a href="tel:+2376XXXXXXXX" class="contact-btn">
                <i class="ri-phone-line"></i> Appeler
              </a>
              <a href="mailto:contact@acordhotel.com" class="contact-btn">
                <i class="ri-mail-line"></i> Email
              </a>
            </div>
          </div>
          
          <div class="action-buttons">
            <button onclick="window.print()" class="btn btn-secondary">
              <i class="ri-printer-line"></i> Imprimer la réservation
            </button>
            <button onclick="window.location.href='index.html'" class="btn btn-primary">
              <i class="ri-home-line"></i> Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.querySelector('.checkout-container').innerHTML = message;
    
    // Déclencher les animations
    this.triggerSuccessAnimations();
  }

  getPaymentMethodIcon() {
    const icons = {
      'online': '<i class="ri-bank-card-line"></i>',
      'hotel': '<i class="ri-money-dollar-circle-line"></i>',
      'transfer': '<i class="ri-bank-line"></i>'
    };
    return icons[this.selectedPayment] || '<i class="ri-question-line"></i>';
  }

  triggerSuccessAnimations() {
    // Animation du checkmark
    setTimeout(() => {
      document.querySelector('.checkmark-circle').classList.add('animate');
    }, 300);
    
    // Animation des confettis
    setTimeout(() => {
      document.querySelectorAll('.confetti-piece').forEach((piece, index) => {
        setTimeout(() => {
          piece.classList.add('animate');
        }, index * 100);
      });
    }, 500);
    
    // Animation des cartes
    setTimeout(() => {
      document.querySelector('.booking-details-card').classList.add('slide-in');
    }, 800);
    
    setTimeout(() => {
      document.querySelector('.payment-info-card').classList.add('slide-in');
    }, 1000);
    
    // Animation des étapes
    setTimeout(() => {
      document.querySelectorAll('.step-item').forEach((step, index) => {
        setTimeout(() => {
          step.classList.add('fade-in');
        }, index * 200);
      });
    }, 1200);
  }

  getPaymentMethodName() {
    const methods = {
      'online': 'Paiement en ligne',
      'hotel': 'Paiement à l\'hôtel',
      'transfer': 'Virement bancaire'
    };
    return methods[this.selectedPayment] || 'Non spécifié';
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      background: #f8d7da;
      color: #721c24;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      border: 1px solid #f5c6cb;
    `;
    errorDiv.innerHTML = message;
    
    const container = document.querySelector('.checkout-container');
    container.insertBefore(errorDiv, container.firstChild);
    
    // Supprimer le message après 5 secondes
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

// Initialiser le gestionnaire de checkout
document.addEventListener('DOMContentLoaded', () => {
  new CheckoutManager();
});
