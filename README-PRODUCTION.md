# ACORD HOTEL - Guide de Production

## Configuration pour un vrai client

### 1. Configuration Stripe

**Créer un compte Stripe :**
1. Allez sur https://dashboard.stripe.com/register
2. Créez un compte pour ACORD HOTEL SARL
3. Complétez la vérification de l'entreprise

**Obtenir les clés :**
- Clé publique : `pk_live_XXXXXXXXXXXXXXXXXX`
- Clé secrète : `sk_live_XXXXXXXXXXXXXXXXXX`

**Mettre à jour `stripe-config.js` :**
```javascript
const STRIPE_CONFIG = {
  publishableKey: 'pk_live_VOTRE_CLÉ_PUBLIQUE',
  secretKey: 'sk_live_VOTRE_CLÉ_SECRÈTE',
  // ... autres configurations
};
```

### 2. Configuration Mobile Money

**Orange Money :**
- Contactez Orange Cameroun pour un compte marchand
- Obtenez une clé API et un numéro merchant
- Configurez les webhooks

**MTN Mobile Money :**
- Contactez MTN Cameroun pour un compte marchand
- Obtenez une clé API et un numéro merchant
- Configurez les callbacks

### 3. Configuration des comptes bancaires

**Comptes réels à configurer :**
```javascript
const hotelBankAccounts = {
  bicec: {
    bank: 'BICEC',
    accountNumber: 'VRAI_NUMÉRO_DE_COMPTE',
    accountName: 'ACORD HOTEL SARL',
    rib: 'VRAI_RIB',
    swift: 'BICECCMXXX'
  },
  // ... autres banques
};
```

### 4. Déploiement

**Étape 1 : Installation des dépendances**
```bash
npm install stripe express cors
```

**Étape 2 : Configuration des variables d'environnement**
```bash
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXX
STRIPE_SECRET_KEY=sk_live_XXXXXXXX
ORANGE_MONEY_KEY=votre_clé_orange
MTN_MOMO_KEY=votre_clé_mtn
```

**Étape 3 : Démarrage du serveur**
```bash
node server.js
```

### 5. Sécurité

**HTTPS obligatoire :**
- Configurez SSL/TLS sur votre domaine
- Utilisez un certificat valide (Let's Encrypt gratuit)

**Validation des paiements :**
- Tous les paiements sont vérifiés avec Stripe
- Webhooks sécurisés pour les confirmations
- Journalisation de toutes les transactions

### 6. Test de production

**Test avec vraies cartes :**
- Utilisez les cartes de test Stripe pour valider
- Testez Mobile Money avec de petits montants
- Vérifiez les virements bancaires

**Monitoring :**
- Surveillez les transactions en temps réel
- Configurez les alertes pour les échecs
- Backup régulier des données

### 7. Support client

**Informations à afficher :**
- Numéro de téléphone : +237 6XX XXX XXX
- Email : contact@acordhotel.com
- Adresse physique de l'hôtel

**Processus de remboursement :**
- Configurer les remboursements automatiques
- Processus manuel pour les cas exceptionnels
- Délai de traitement : 5-7 jours ouvrables

### 8. Legal et conformité

**Documents requis :**
- Registre de commerce
- Identité du représentant légal
- Justificatif de domicile
- Compte bancaire professionnel

**Taxes et frais :**
- TVA sur les hébergements
- Frais de transaction Stripe (2.9% + 100 FCFA)
- Frais Mobile Money (1-2%)

### 9. Maintenance

**Mises à jour régulières :**
- Mettre à jour les dépendances npm
- Surveiller les API de paiement
- Backup quotidien de la base de données

**Performance :**
- Monitoring du temps de réponse
- Optimisation des images
- Cache des pages statiques

## Contact support technique

Pour toute question technique :
- Email : tech@acordhotel.com
- Téléphone : +237 6XX XXX XXX
- Réponse sous 24h ouvrables
