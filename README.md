# Quebecois Rider – Boutique d'accessoires moto (React + Node.js + MongoDB)

## Prerequis
- Node.js 18+
- MongoDB Atlas (ou Mongo local) avec `MONGODB_URI`
- Cle Stripe test `STRIPE_SECRET`
- `JWT_SECRET` pour l'auth
- Optionnel : Ollama en local (chat support)

## Lancer l'API
```bash
cd server
cp .env.example .env   # remplir MONGODB_URI, STRIPE_SECRET (test), JWT_SECRET, FRONTEND_ORIGIN
npm install
npm run dev
```
API: http://localhost:4000

Seeder (15+ accessoires moto) :
```bash
cd server
npm run seed
# ou GET http://localhost:4000/api/products/__dev/seed
```

## Lancer le Front
```bash
cd client
npm install
npm run dev
```
Front: http://localhost:5173 (proxy /api et /ollama)

## Fonctionnalites
- Catalogue, recherche, categories, promos (prix barre + fin de promo)
- Panier, adresse de livraison, paiement test Stripe ou paiement a la livraison
- Commandes : historique, date de livraison estimee, annulation avec motif
- Auth JWT, role admin pour CRUD produits
- Avis produits (note + commentaire)
- Chat service client (Ollama via `/ollama/api/chat`)

## Role admin
1) Assigner `role: "admin"` au user en base.  
2) Vider `qr_token`, `qr_user`, `qr_role` dans le navigateur puis se reconnecter.  
3) Acces admin : creation/edition/suppression produits, gestion des promos.

## Paiement test Stripe
- Cle `STRIPE_SECRET` test requise.  
- Carte test : 4242 4242 4242 4242, date future, CVC 123.  
- Si Stripe absent, seul le paiement a la livraison est propose.

## Deploiement (a adapter)
- Front : Vercel/Netlify  
- API : Render/Railway  
- Env vars (API) : `MONGODB_URI`, `STRIPE_SECRET`, `JWT_SECRET`, `PORT`, `FRONTEND_ORIGIN` (URL du front)  
- CORS : `FRONTEND_ORIGIN` doit contenir l'URL du front en prod.

## Build & tests
- API: `npm run build` puis `npm start`
- Tests API: `npm test`
- Front build: `cd client && npm run build`
