const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Créer la base de données
const db = new sqlite3.Database(path.join(__dirname, 'hotel_miranda.db'), (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err.message);
  } else {
    console.log('Connecté à la base de données SQLite.');
  }
});

// Créer les tables
db.serialize(() => {
  // Table des chambres
  db.run(`CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    description TEXT NOT NULL,
    available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Erreur création table rooms:', err.message);
    } else {
      console.log('Table rooms créée ou existe déjà.');
      
      // Insérer les chambres par défaut si la table est vide
      db.get("SELECT COUNT(*) as count FROM rooms", (err, row) => {
        if (!err && row.count === 0) {
          const defaultRooms = [
            ["Suite Royale", 150000, "suite", 4, "Suite luxueuse avec vue sur la ville", 1],
            ["Chambre Double Deluxe", 75000, "double", 2, "Chambre confortable avec lit king-size", 1],
            ["Chambre Simple Standard", 50000, "simple", 1, "Chambre simple économique", 1],
            ["Suite Présidentielle", 250000, "suite", 6, "Suite présidentielle avec services VIP", 1],
            ["Chambre Familiale", 100000, "double", 3, "Chambre familiale spacieuse", 1]
          ];
          
          const stmt = db.prepare("INSERT INTO rooms (name, price, type, capacity, description, available) VALUES (?, ?, ?, ?, ?, ?)");
          defaultRooms.forEach(room => {
            stmt.run(room);
          });
          stmt.finalize();
          console.log('Chambres par défaut insérées.');
        }
      });
    }
  });

  // Table des réservations
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    arrival_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    guests INTEGER NOT NULL,
    guest_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    special_requests TEXT,
    payment_method TEXT NOT NULL,
    total_price INTEGER NOT NULL,
    status TEXT DEFAULT 'confirmed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms (id)
  )`, (err) => {
    if (err) {
      console.error('Erreur création table bookings:', err.message);
    } else {
      console.log('Table bookings créée ou existe déjà.');
      
      // Insérer une réservation par défaut si la table est vide
      db.get("SELECT COUNT(*) as count FROM bookings", (err, row) => {
        if (!err && row.count === 0) {
          const stmt = db.prepare("INSERT INTO bookings (room_id, arrival_date, departure_date, guests, guest_name, email, payment_method, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
          stmt.run([1, '2024-12-25', '2024-12-28', 2, 'Jean Dupont', 'jean@example.com', 'hotel', 450000]);
          stmt.finalize();
          console.log('Réservation par défaut insérée.');
        }
      });
    }
  });

  // Table des transactions (pour les paiements en ligne)
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    payment_intent_id TEXT,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'XAF',
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings (id)
  )`, (err) => {
    if (err) {
      console.error('Erreur création table transactions:', err.message);
    } else {
      console.log('Table transactions créée ou existe déjà.');
    }
  });
});

// Fermer la connexion
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Erreur fermeture base de données:', err.message);
    } else {
      console.log('Base de données initialisée avec succès.');
      console.log('Fichier créé: hotel_miranda.db');
    }
  });
}, 2000);
