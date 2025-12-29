const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Connexion à la base de données SQLite
const db = new sqlite3.Database('hotel_miranda.db', (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err.message);
  } else {
    console.log('Connecté à la base de données SQLite.');
  }
});

// API pour vérifier la disponibilité
app.post('/api/check-availability', (req, res) => {
  const { arrivalDate, departureDate, capacity } = req.body;
  
  // Convertir les dates en objets Date
  const arrival = new Date(arrivalDate);
  const departure = new Date(departureDate);
  
  // Vérifier si les dates sont valides
  if (arrival >= departure) {
    return res.status(400).json({ 
      error: 'La date de départ doit être postérieure à la date d\'arrivée' 
    });
  }
  
  // Vérifier la disponibilité pour chaque chambre
  const availableRooms = rooms.filter(room => {
    // Vérifier la capacité
    if (room.capacity < capacity) return false;
    
    // Vérifier si la chambre n'est pas déjà réservée pour ces dates
    const isBooked = bookings.some(booking => {
      if (booking.roomId !== room.id) return false;
      
      const bookingArrival = new Date(booking.arrivalDate);
      const bookingDeparture = new Date(booking.departureDate);
      
      // Vérifier si les périodes se chevauchent
      return (arrival < bookingDeparture && departure > bookingArrival);
    });
    
    return !isBooked;
  });
  
  res.json({
    availableRooms,
    message: availableRooms.length > 0 
      ? `${availableRooms.length} chambre(s) disponible(s)` 
      : 'Aucune chambre disponible pour ces dates'
  });
});

// API pour créer une intention de paiement Stripe
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'xaf', bookingId } = req.body;
    
    // Calculer les frais (3% + 100 FCFA)
    const fees = Math.round(amount * 0.03) + 100;
    const totalAmount = amount + fees;
    
    // Créer l'intention de paiement avec Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100, // Stripe utilise les centimes
      currency: currency,
      metadata: {
        bookingId: bookingId,
        hotel: 'ACORD HOTEL',
        fees: fees.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
      fees: fees
    });
  } catch (error) {
    console.error('Erreur création intention paiement:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du paiement'
    });
  }
});

// API pour confirmer le paiement et créer la réservation
app.post('/api/confirm-payment-and-book', async (req, res) => {
  try {
    const { paymentIntentId, bookingData } = req.body;
    
    // Vérifier le paiement Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Paiement non confirmé'
      });
    }
    
    // Créer la réservation
    const { roomId, arrivalDate, departureDate, guests, guestName, email, phone, address, city, specialRequests } = bookingData;
    
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({ error: 'Chambre non trouvée' });
    }
    
    // Vérifier la disponibilité
    const isBooked = bookings.some(booking => {
      return booking.roomId === roomId &&
        new Date(booking.arrivalDate) < new Date(departureDate) &&
        new Date(booking.departureDate) > new Date(arrivalDate);
    });
    
    if (isBooked) {
      return res.status(400).json({ error: 'Chambre déjà réservée' });
    }
    
    // Calculer le total
    const nights = Math.ceil((new Date(departureDate) - new Date(arrivalDate)) / (1000 * 60 * 60 * 24));
    const totalPrice = room.price * nights;
    
    // Créer la réservation
    const newBooking = {
      id: bookings.length + 1,
      roomId,
      arrivalDate,
      departureDate,
      guests,
      guestName,
      email,
      phone,
      address,
      city,
      specialRequests,
      paymentMethod: 'online',
      totalPrice,
      status: 'confirmed',
      paymentIntentId: paymentIntentId,
      createdAt: new Date().toISOString()
    };
    
    bookings.push(newBooking);
    saveBookings(bookings); // Sauvegarder dans le fichier
    
    // Enregistrer la transaction
    const transaction = {
      id: transactions.length + 1,
      bookingId: newBooking.id,
      paymentIntentId: paymentIntentId,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      method: 'stripe',
      status: 'completed',
      fees: paymentIntent.metadata.fees,
      createdAt: new Date().toISOString()
    };
    
    transactions.push(transaction);
    
    res.json({
      success: true,
      booking: newBooking,
      room: room,
      transaction: transaction,
      message: 'Réservation confirmée avec paiement réussi!'
    });
  } catch (error) {
    console.error('Erreur confirmation paiement:', error);
    res.status(500).json({
      error: 'Erreur lors de la confirmation du paiement'
    });
  }
});

// API pour traiter le paiement
app.post('/api/process-payment', async (req, res) => {
  const { paymentMethod, paymentData, amount, bookingId } = req.body;
  
  try {
    let result;
    
    switch (paymentMethod) {
      case 'card':
        result = await paymentProcessor.processCardPayment(paymentData, amount, bookingId);
        break;
      case 'orange_money':
        result = await paymentProcessor.processOrangeMoneyPayment(paymentData.phoneNumber, amount, bookingId);
        break;
      case 'mtn_momo':
        result = await paymentProcessor.processMTNMoMoPayment(paymentData.phoneNumber, amount, bookingId);
        break;
      default:
        throw new Error('Méthode de paiement non supportée');
    }
    
    if (result.success) {
      // Enregistrer la transaction
      const transaction = {
        id: transactions.length + 1,
        bookingId: bookingId,
        ...result,
        createdAt: new Date().toISOString()
      };
      transactions.push(transaction);
      
      res.json({
        success: true,
        transaction: transaction,
        message: 'Paiement traité avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement du paiement'
    });
  }
});

// API pour vérifier le statut d'un paiement
app.get('/api/payment-status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const status = await paymentProcessor.checkPaymentStatus(transactionId);
    
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification du statut'
    });
  }
});

// API pour obtenir les coordonnées bancaires
app.get('/api/bank-accounts', (req, res) => {
  res.json({
    success: true,
    accounts: hotelBankAccounts
  });
});

// API pour obtenir l'historique des transactions (admin)
app.get('/api/transactions', (req, res) => {
  res.json({
    success: true,
    transactions: transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  });
});

// API pour supprimer une chambre
app.delete('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const roomIdNum = parseInt(roomId);
  
  // Vérifier si la chambre existe
  const roomIndex = rooms.findIndex(r => r.id === roomIdNum);
  if (roomIndex === -1) {
    return res.status(404).json({ error: 'Chambre non trouvée' });
  }
  
  // Vérifier si la chambre a des réservations actives
  const hasActiveBookings = bookings.some(booking => {
    return booking.roomId === roomIdNum && 
           new Date(booking.departureDate) >= new Date();
  });
  
  if (hasActiveBookings) {
    return res.status(400).json({ 
      error: 'Impossible de supprimer cette chambre car elle a des réservations actives' 
    });
  }
  
  // Supprimer la chambre
  const deletedRoom = rooms.splice(roomIndex, 1)[0];
  
  res.json({
    success: true,
    room: deletedRoom,
    message: 'Chambre supprimée avec succès!'
  });
});

// API pour supprimer une réservation
app.delete('/api/bookings/:bookingId', (req, res) => {
  const { bookingId } = req.params;
  const bookingIdNum = parseInt(bookingId);
  
  // Vérifier si la réservation existe
  const bookingIndex = bookings.findIndex(b => b.id === bookingIdNum);
  if (bookingIndex === -1) {
    return res.status(404).json({ error: 'Réservation non trouvée' });
  }
  
  // Supprimer la réservation
  const deletedBooking = bookings.splice(bookingIndex, 1)[0];
  saveBookings(bookings); // Sauvegarder dans le fichier
  
  res.json({
    success: true,
    booking: deletedBooking,
    message: 'Réservation supprimée avec succès!'
  });
});

// API pour faire une réservation
app.post('/api/book-room', (req, res) => {
  const { roomId, arrivalDate, departureDate, guests, guestName, email, phone, address, city, specialRequests, paymentMethod, totalPrice } = req.body;
  
  // Vérifier si la chambre existe
  const room = rooms.find(r => r.id === roomId);
  if (!room) {
    return res.status(404).json({ error: 'Chambre non trouvée' });
  }
  
  // Vérifier la capacité
  if (room.capacity < guests) {
    return res.status(400).json({ error: 'La capacité de la chambre est insuffisante' });
  }
  
  // Vérifier la disponibilité
  const arrival = new Date(arrivalDate);
  const departure = new Date(departureDate);
  
  const isBooked = bookings.some(booking => {
    if (booking.roomId !== roomId) return false;
    
    const bookingArrival = new Date(booking.arrivalDate);
    const bookingDeparture = new Date(booking.departureDate);
    
    return (arrival < bookingDeparture && departure > bookingArrival);
  });
  
  if (isBooked) {
    return res.status(400).json({ error: 'Chambre déjà réservée pour ces dates' });
  }
  
  // Créer la réservation
  const newBooking = {
    id: bookings.length + 1,
    roomId,
    arrivalDate,
    departureDate,
    guests,
    guestName,
    email,
    phone,
    address,
    city,
    specialRequests,
    paymentMethod,
    totalPrice,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };
  
  bookings.push(newBooking);
  saveBookings(bookings); // Sauvegarder dans le fichier
  
  res.json({
    success: true,
    booking: newBooking,
    room: room,
    message: 'Réservation confirmée avec succès!'
  });
});

// API pour obtenir toutes les chambres
app.get('/api/rooms', (req, res) => {
  db.all("SELECT * FROM rooms ORDER BY id", (err, rows) => {
    if (err) {
      console.error('Erreur récupération chambres:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      // Convertir les champs pour compatibilité avec le frontend
      const rooms = rows.map(room => ({
        id: room.id,
        name: room.name,
        price: room.price,
        type: room.type,
        capacity: room.capacity,
        description: room.description,
        available: Boolean(room.available)
      }));
      res.json(rooms);
    }
  });
});

// API pour obtenir toutes les réservations
app.get('/api/bookings', (req, res) => {
  db.all(`
    SELECT b.*, r.name as room_name 
    FROM bookings b 
    LEFT JOIN rooms r ON b.room_id = r.id 
    ORDER BY b.created_at DESC
  `, (err, rows) => {
    if (err) {
      console.error('Erreur récupération réservations:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      // Convertir les champs pour compatibilité avec le frontend
      const bookings = rows.map(booking => ({
        id: booking.id,
        roomId: booking.room_id,
        arrivalDate: booking.arrival_date,
        departureDate: booking.departure_date,
        guests: booking.guests,
        guestName: booking.guest_name,
        email: booking.email,
        phone: booking.phone || 'Non spécifié',
        address: booking.address || '',
        city: booking.city || '',
        specialRequests: booking.special_requests || '',
        paymentMethod: booking.payment_method,
        totalPrice: booking.total_price,
        status: booking.status,
        roomName: booking.room_name || `Chambre ${booking.room_id}`
      }));
      res.json(bookings);
    }
  });
});

// API pour ajouter une nouvelle chambre
app.post('/api/rooms', (req, res) => {
  const { name, price, capacity, description, type } = req.body;
  
  // Validation
  if (!name || !price || !capacity || !description || !type) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  
  if (price < 0 || capacity < 1 || capacity > 10) {
    return res.status(400).json({ error: 'Prix ou capacité invalides' });
  }
  
  // Insérer la nouvelle chambre dans la base de données
  const stmt = db.prepare(`
    INSERT INTO rooms (name, price, capacity, description, type, available) 
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  
  stmt.run([name, price, capacity, description, type], function(err) {
    if (err) {
      console.error('Erreur insertion chambre:', err);
      res.status(500).json({ error: 'Erreur lors de l\'ajout de la chambre' });
    } else {
      // Récupérer la chambre insérée
      db.get("SELECT * FROM rooms WHERE id = ?", [this.lastID], (err, room) => {
        if (err) {
          console.error('Erreur récupération chambre:', err);
          res.status(500).json({ error: 'Erreur lors de la récupération de la chambre' });
        } else {
          const newRoom = {
            id: room.id,
            name: room.name,
            price: room.price,
            type: room.type,
            capacity: room.capacity,
            description: room.description,
            available: Boolean(room.available)
          };
          
          res.json({
            success: true,
            room: newRoom,
            message: 'Chambre ajoutée avec succès!'
          });
        }
      });
    }
  });
  
  stmt.finalize();
});

// API pour basculer la disponibilité d'une chambre
app.patch('/api/rooms/:roomId/toggle', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.find(r => r.id === parseInt(roomId));
  
  if (!room) {
    return res.status(404).json({ error: 'Chambre non trouvée' });
  }
  
  // Vérifier si la chambre a des réservations actives
  const hasActiveBookings = bookings.some(booking => {
    if (booking.roomId !== room.id) return false;
    
    const today = new Date();
    const bookingArrival = new Date(booking.arrivalDate);
    const bookingDeparture = new Date(booking.departureDate);
    
    return (today <= bookingDeparture && today >= bookingArrival);
  });
  
  if (hasActiveBookings) {
    return res.status(400).json({ 
      error: 'Impossible de modifier la disponibilité: chambre avec réservations actives' 
    });
  }
  
  // Basculer la disponibilité
  room.available = !room.available;
  saveRooms(rooms); // Sauvegarder dans le fichier
  
  res.json({
    success: true,
    room: room,
    message: `Chambre marquée comme ${room.available ? 'disponible' : 'indisponible'}!`
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur ACORD HOTEL démarré sur http://localhost:${PORT}`);
});
