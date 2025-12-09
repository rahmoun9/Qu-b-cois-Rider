"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedProducts = void 0;
exports.seedProductsIfEmpty = seedProductsIfEmpty;
const Product_1 = __importDefault(require("../models/Product"));
exports.seedProducts = [
    {
        title: "Casque integral Nightfall",
        description: "Coque composite, double visiere fumee claire, ventilation 4 points, boucle micrometrique.",
        price: 219.99,
        category: "casques",
        images: ["https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80"],
        stock: 18,
        popularity: 5,
        compatibility: "Route / Sport",
    },
    {
        title: "Casque modulable Atlas",
        description: "Ecran Pinlock-ready, mentonniere relevable, ideal pour les trajets mixtes ville/route.",
        price: 279.0,
        category: "casques",
        images: ["https://images.unsplash.com/photo-1504595403659-9088ce801e29?auto=format&fit=crop&w=900&q=80"],
        stock: 14,
        popularity: 5,
        compatibility: "Urbain / Touring",
    },
    {
        title: "Blouson cuir Stormguard",
        description: "Cuir 1.2 mm, protections CE niv.2, doublure microperforee et empiècements stretch.",
        price: 259.5,
        category: "blousons",
        images: ["https://images.unsplash.com/photo-1504274066651-8d31a536b11a?auto=format&fit=crop&w=900&q=80"],
        stock: 20,
        popularity: 4,
        compatibility: "Route / Touring",
    },
    {
        title: "Veste textile Apex 3 saisons",
        description: "Membrane impermeable, doublure thermique amovible, larges ventilations thorax.",
        price: 189.0,
        category: "vestes",
        images: ["https://images.unsplash.com/photo-1502877828070-33b167ad6860?auto=format&fit=crop&w=900&q=80"],
        stock: 24,
        popularity: 4,
        compatibility: "ADV / Touring",
    },
    {
        title: "Gants hiver Nordic",
        description: "Gant long, coque rigide, membrane Hipora et insert thermique, essuie-visiere.",
        price: 74.9,
        category: "gants",
        images: ["https://images.unsplash.com/photo-1516478177764-9fe5bdc5aff3?auto=format&fit=crop&w=900&q=80"],
        stock: 40,
        popularity: 4,
        compatibility: "Froid / Pluie",
    },
    {
        title: "Gants mesh Boreal",
        description: "Cuir et mesh, coques aerées, paume slider, doigts tactile.",
        price: 49.5,
        category: "gants",
        images: ["https://images.unsplash.com/photo-1525303630008-1a43c26d9fee?auto=format&fit=crop&w=900&q=80"],
        stock: 55,
        popularity: 4,
        compatibility: "Ete",
    },
    {
        title: "Jean moto renforce",
        description: "Denim Cordura, doublure aramide, protections CE genoux/hanche incluses.",
        price: 149.0,
        category: "pantalons",
        images: ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80"],
        stock: 28,
        popularity: 4,
        compatibility: "Urbain",
    },
    {
        title: "Hoodie renforce aramide",
        description: "Look casual, doublure aramide, poches dorsale/coudes/épaules pour protections CE.",
        price: 129.0,
        category: "casual",
        images: ["https://images.unsplash.com/photo-1523419400524-2230bcd99ce1?auto=format&fit=crop&w=900&q=80"],
        stock: 32,
        popularity: 3,
        compatibility: "Urbain",
    },
    {
        title: "Bottes touring imper Long Range",
        description: "Haute tige, membrane etanche, plaque tibia, semelle crampon pour pose a pied.",
        price: 199.0,
        category: "bottes",
        images: ["https://images.unsplash.com/photo-1517154421771-990c53949dd7?auto=format&fit=crop&w=900&q=80"],
        stock: 22,
        popularity: 5,
        compatibility: "Touring / ADV",
    },
    {
        title: "Sneakers moto urbaines",
        description: "Renfort malléole, plaque selecteur, semelle antiderapante, look discret.",
        price: 149.0,
        category: "bottes",
        images: ["https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80"],
        stock: 35,
        popularity: 4,
        compatibility: "Urbain",
    },
    {
        title: "Sacoche reservoir 9L magnetique",
        description: "Base magnetique, passage cable, housse pluie et poche carte transparente.",
        price: 89.0,
        category: "bagagerie",
        images: ["https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=80"],
        stock: 26,
        popularity: 3,
        compatibility: "Reservoirs acier",
    },
    {
        title: "Sac etanche roll-top 30L",
        description: "Fixation sangles rapides, construction IPX6, bandes reflechissantes.",
        price: 109.0,
        category: "bagagerie",
        images: ["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"],
        stock: 30,
        popularity: 4,
        compatibility: "Universel",
    },
    {
        title: "Kit feux additionnels LED",
        description: "Deux pods 3 pouces, faisceau cablage, interrupteur guidon, 12V.",
        price: 169.0,
        category: "eclairage",
        images: ["https://images.unsplash.com/photo-1541447271451-4b5e1c06ecb0?auto=format&fit=crop&w=900&q=80"],
        stock: 18,
        popularity: 4,
        compatibility: "12V",
    },
    {
        title: "Protège-mains enduro alu",
        description: "Arceau aluminium, coques resistantes, protege leviers et mains en off-road.",
        price: 59.0,
        category: "protection",
        images: ["https://images.unsplash.com/photo-1514053026555-49ce8886ae41?auto=format&fit=crop&w=900&q=80"],
        stock: 34,
        popularity: 3,
        compatibility: "ADV / Trail",
    },
    {
        title: "Kit chaine pignon couronne 520",
        description: "Pignon et couronne acier + chaine O-ring pour long intervalle d entretien.",
        price: 139.0,
        category: "maintenance",
        images: ["https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=80"],
        stock: 25,
        popularity: 4,
        compatibility: "Standard 520",
    },
    {
        title: "Chargeur USB guidon",
        description: "Double USB 3.1A, etanche IP66, avec support guidon 22/28 mm et fusible integre.",
        price: 36.0,
        category: "electronique",
        images: ["https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80"],
        stock: 42,
        popularity: 4,
        compatibility: "12V",
    },
];
// Helper to seed in both route and CLI
async function seedProductsIfEmpty() {
    const count = await Product_1.default.countDocuments();
    if (count > 0) {
        return { inserted: 0, skipped: true };
    }
    await Product_1.default.insertMany(exports.seedProducts);
    return { inserted: exports.seedProducts.length, skipped: false };
}
