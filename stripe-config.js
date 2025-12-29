// Configuration Stripe pour ACORD HOTEL
// Pour la production, remplacer avec vos vraies clés Stripe

const STRIPE_CONFIG = {
  // Clés de test (remplacer par les clés de production)
  publishableKey: 'pk_live_51234567890abcdef', // Clé publique Stripe
  secretKey: 'sk_live_51234567890abcdef',     // Clé secrète Stripe
  
  // Configuration du compte
  account: {
    name: 'ACORD HOTEL SARL',
    email: 'contact@acordhotel.com',
    phone: '+237 6XX XXX XXX',
    address: {
      line1: 'Yaoundé, Cameroun',
      city: 'Yaoundé',
      country: 'CM',
      postal_code: '00000'
    }
  },
  
  // Configuration des paiements
  payment: {
    currency: 'xaf', // Franc CFA BEAC
    locale: 'fr-FR',
    method: 'card', // Carte bancaire
    
    // Frais de traitement (3% + 100 FCFA)
    fees: {
      percentage: 0.03,
      fixed: 100
    }
  }
};

// Configuration Orange Money
const ORANGE_MONEY_CONFIG = {
  apiKey: 'orange_money_live_key',
  merchantId: 'ACORD_HOTEL_CM',
  phoneNumber: '+237 690000000', // Numéro merchant Orange Money
  callbackUrl: 'https://acordhotel.com/payment/orange-callback'
};

// Configuration MTN Mobile Money
const MTN_MOMO_CONFIG = {
  apiKey: 'mtn_momo_live_key',
  merchantId: 'ACORD_HOTEL_CM',
  phoneNumber: '+237 670000000', // Numéro merchant MTN MoMo
  callbackUrl: 'https://acordhotel.com/payment/mtn-callback'
};

// Export des configurations
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STRIPE_CONFIG,
    ORANGE_MONEY_CONFIG,
    MTN_MOMO_CONFIG
  };
}
