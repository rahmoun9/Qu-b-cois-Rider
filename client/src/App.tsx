import { useEffect, useMemo, useRef, useState } from "react";
import {
  createCheckoutSession,
  createOrder,
  cancelOrder,
  fetchConfig,
  fetchOrders,
  listReviews,
  addReview,
  listProducts,
  login,
  register,
  createProduct,
  updateProduct,
  deleteProduct,
  askOllama,
  type OrderResponse,
  type Product,
  type ProductsResponse,
  type Review,
  type ReviewsResponse,
} from "./api";

type Toast = { type: "success" | "error"; message: string } | null;
type CartItem = { product: Product; qty: number };

const accent = "#e53935";
const dark = "#0b1224";
const globalStyles = `
  body {
    margin: 0;
    font-family: 'Poppins', 'Inter', 'Segoe UI', sans-serif;
    background-color: ${dark};
  }
  .qr-shell {
    min-height: 100vh;
  }
  .qr-glass {
    backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow: 0 20px 60px rgba(0,0,0,0.32);
  }
  .qr-product {
    transition: transform 0.18s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .qr-product:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.18);
    border-color: rgba(17,24,39,0.08);
  }
  .qr-pill {
    box-shadow: 0 10px 24px rgba(0,0,0,0.12);
  }
`;

const navCategories: { label: string; value?: string }[] = [
  { label: "Tous", value: undefined },
  { label: "Casques", value: "casques" },
  { label: "Blousons", value: "blousons" },
  { label: "Vestes", value: "vestes" },
  { label: "Gants", value: "gants" },
  { label: "Pantalons", value: "pantalons" },
  { label: "Bottes", value: "bottes" },
  { label: "Casual", value: "casual" },
  { label: "Bagagerie", value: "bagagerie" },
  { label: "Électronique", value: "electronique" },
  { label: "Éclairage", value: "eclairage" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Protection", value: "protection" },
];

const highlightCategories = [
  { title: "Protections & sécurité", icon: "PRO", category: "protection" },
  { title: "Bagagerie & voyage", icon: "BAG", category: "bagagerie" },
  { title: "Électronique / charge", icon: "ELEC", category: "electronique" },
  { title: "Entretien / chaîne", icon: "CARE", category: "maintenance" },
];

export default function App() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("qr_token"));
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem("qr_user"));
  const [userRole, setUserRole] = useState<string | null>(() => localStorage.getItem("qr_role"));
  const [toast, setToast] = useState<Toast>(null);
  const [showAuth, setShowAuth] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsMeta, setProductsMeta] = useState<{ total: number; page: number; limit: number }>({
    total: 0,
    page: 1,
    limit: 16,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<{ orderId: string | null; reason: string; loading: boolean }>({
    orderId: null,
    reason: "",
    loading: false,
  });
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [showCatalogue, setShowCatalogue] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shipStreet, setShipStreet] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shipPostal, setShipPostal] = useState("");
  const [adminForm, setAdminForm] = useState<Partial<Product>>({
    title: "",
    price: 0,
    salePrice: undefined,
    promoEndsAt: undefined,
    category: "",
    stock: 0,
    description: "",
    images: [],
  });
  const [adminEditingId, setAdminEditingId] = useState<string | null>(null);
  const [adminImages, setAdminImages] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const catalogueRef = useRef<HTMLDivElement | null>(null);
  const adminRef = useRef<HTMLDivElement | null>(null);
  const [reviewsByProduct, setReviewsByProduct] = useState<Record<string, Review[]>>({});
  const [reviewsMeta, setReviewsMeta] = useState<Record<string, { average: number; total: number }>>({});
  const [reviewsLoading, setReviewsLoading] = useState<Record<string, boolean>>({});
  const [reviewsError, setReviewsError] = useState<Record<string, string | null>>({});
  const [reviewDraft, setReviewDraft] = useState<Record<string, { rating: number; comment: string }>>({});
  const [openReviews, setOpenReviews] = useState<Record<string, boolean>>({});
  const [showSupport, setShowSupport] = useState(false);
  const [supportMessages, setSupportMessages] = useState<{ from: "user" | "bot"; text: string }[]>([
    {
      from: "bot",
      text:
        "Bonjour! Je peux t'aider sur : paiement (carte test), livraison, retour/annulation, stock/tailles ou conseil produit. Pose ta question ou clique sur un raccourci.",
    },
  ]);
  const [supportInput, setSupportInput] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const supportFaq = [
    {
      keywords: ["livraison", "delai", "delivery", "expedition", "expédition", "tracking"],
      reply:
        "Livraison : 3 à 7 jours ouvrés au Canada.\nSuivi : un lien de suivi est envoyé dès l'expédition.\nFrais : calculés au panier selon l'adresse.",
    },
    {
      keywords: ["paiement", "payer", "carte", "stripe", "visa", "mastercard"],
      reply:
        "Paiement carte (mode test Stripe) :\n• Carte test 4242 4242 4242 4242, date future, CVC 123.\n• Ou choisis Paiement à la livraison au checkout.",
    },
    {
      keywords: ["retour", "remb", "annul", "annulation", "probleme", "problème"],
      reply:
        "Retour / annulation :\n• Annule depuis la section commandes si le statut le permet.\n• Sinon indique le n° de commande, produit concerné et la raison, on s'occupe du retour.",
    },
    {
      keywords: ["stock", "dispo", "taille", "size"],
      reply:
        "Disponibilité : le stock affiché est en temps réel.\nTailles : précise ton tour de tête/poitrine ou le modèle de moto, je te propose la bonne taille ou un équivalent.",
    },
    {
      keywords: ["commande", "order", "suivi", "status"],
      reply:
        "Suivi commande :\n• Connecte-toi, ouvre 'Mes commandes' pour voir le statut.\n• Le lien de suivi est ajouté dès l'expédition.",
    },
    {
      keywords: ["produit", "conseil", "accessoire", "casque", "gants", "sac"],
      reply:
        "Conseil produit : donne-moi l'usage (ville, touring, trail), le modèle de moto et ton budget. Je te suggère un article adapté.",
    },
  ];
  const supportSuggestions = [
    "Aide paiement (carte test)",
    "Délais de livraison",
    "Retour ou annulation",
    "Disponibilité / tailles",
    "Conseil produit",
  ];

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSupportSend = async (custom?: string) => {
    const message = (custom ?? supportInput).trim();
    if (!message) {
      showToast("Ecris un message pour le support", "error");
      return;
    }
    setSupportMessages((m) => [...m, { from: "user", text: message }]);
    if (!custom) setSupportInput("");
    setSupportLoading(true);

    const lower = message.toLowerCase();
    const match = supportFaq.find((item) => item.keywords.some((k) => lower.includes(k)));
    const fallback =
      match?.reply ??
      "Je note ta demande. Donne-moi le numero de commande ou la reference du produit et ce que tu cherches (paiement, livraison, retour, stock).";

    try {
      const reply = await askOllama(message, fallback);
      setSupportMessages((m) => [...m, { from: "bot", text: reply }]);
    } catch (err: any) {
      setSupportMessages((m) => [...m, { from: "bot", text: err?.message ?? fallback }]);
    } finally {
      setSupportLoading(false);
    }
  };

  useEffect(() => {
    setEmail("");
    setPassword("");
    setName("");
  }, [authMode]);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await fetchConfig();
        setStripeEnabled(cfg.stripeEnabled);
        if (!cfg.stripeEnabled) setPaymentMethod("cod");
      } catch {
        // keep defaults if config endpoint is unreachable
      }
    })();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("qr_cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("qr_cart", JSON.stringify(cart));
  }, [cart]);

  const loadOrders = async (authToken?: string) => {
    if (!authToken) return;
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await fetchOrders(authToken);
      setOrders(data);
    } catch (err: any) {
      setOrdersError(err?.message ?? "Impossible de charger les commandes");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setOrders([]);
      return;
    }
    loadOrders(token);
  }, [token]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!showCatalogue) return;
        setError(null);
        setLoading(true);
        const data: ProductsResponse = await listProducts({
          q: search,
          category: categoryFilter,
          page,
          limit: productsMeta.limit,
        });
        setProducts(data.items);
        setProductsMeta({ total: data.total, page: data.page, limit: data.limit });
      } catch (e: any) {
        setError(e?.message ?? "Erreur inconnue");
        showToast(e?.message ?? "Impossible de charger les produits", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [search, categoryFilter, page, productsMeta.limit, showCatalogue]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  const handleAuth = async () => {
    try {
      if (!email || !password || (authMode === "register" && !name)) {
        showToast("Merci de remplir tous les champs", "error");
        return;
      }
      const fn = authMode === "login" ? login : register;
      const data = await fn(email, password, name);
      setToken(data.token);
      setUserEmail(data.user.email);
      setUserRole(data.user.role);
      localStorage.setItem("qr_token", data.token);
      localStorage.setItem("qr_user", data.user.email);
      localStorage.setItem("qr_role", data.user.role);
      showToast(authMode === "login" ? "Connexion réussie" : "Compte créé");
      setShowAuth(false);
      loadOrders(data.token);
    } catch (e: any) {
      showToast(e?.message ?? "Erreur", "error");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserEmail(null);
    setUserRole(null);
    setOrders([]);
    setCart([]);
    localStorage.removeItem("qr_token");
    localStorage.removeItem("qr_user");
    localStorage.removeItem("qr_role");
    localStorage.removeItem("qr_cart");
    showToast("Déconnexion réussie", "success");
  };

  const resetAdminForm = () => {
    setAdminForm({
      title: "",
      price: 0,
      salePrice: undefined,
      promoEndsAt: undefined,
      category: "",
      stock: 0,
      description: "",
      images: [],
    });
    setAdminImages("");
    setAdminEditingId(null);
  };

  const addToCart = (p: Product) => {
    setIsCartOpen(true);
    setCart((prev) => {
      const index = prev.findIndex((i) => i.product._id === p._id);
      if (index >= 0) {
        const next = [...prev];
        next[index].qty++;
        return next;
      }
      return [...prev, { product: p, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.product._id !== id));
  };

  const promoActive = (p: Product) => {
    const end = p.promoEndsAt ? new Date(p.promoEndsAt).getTime() : null;
    const now = Date.now();
    return typeof p.salePrice === "number" && p.salePrice > 0 && p.salePrice < p.price && (!end || end > now);
  };
  const unitPrice = (p: Product) => (promoActive(p) ? p.salePrice! : p.price);

  const total = cart.reduce((sum, i) => sum + unitPrice(i.product) * i.qty, 0);
  const categoriesFromProducts = useMemo(
    () => Array.from(new Set(products.map((p) => p.category || "Divers"))),
    [products]
  );
  const visibleOrders = useMemo(() => orders.filter((o) => o.status !== "canceled"), [orders]);

  const scrollToCatalogue = () => {
    if (!showCatalogue) setShowCatalogue(true);
    if (catalogueRef.current) {
      setTimeout(() => catalogueRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const scrollToAdmin = () => {
    if (adminRef.current) {
      adminRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCheckout = async () => {
    try {
      if (!token) {
        showToast("Connecte-toi pour finaliser la commande", "error");
        return;
      }
      const addressParts = [shipStreet.trim(), shipPostal.trim(), shipCity.trim()].filter((p) => p.length > 0);
      const address = addressParts.join(", ");
      if (address.length < 10 || shipStreet.trim().length < 5 || shipPostal.trim().length < 4 || shipCity.trim().length < 2) {
        showToast("Ajoute une adresse de livraison complète (rue, code postal, ville)", "error");
        return;
      }
      if (paymentMethod === "card") {
        if (!stripeEnabled) {
          showToast("Paiement carte indisponible. Sélectionne paiement à la livraison.", "error");
          setPaymentMethod("cod");
          return;
        }
        await createCheckoutSession(
          cart.map((it) => ({ productId: it.product._id, qty: it.qty })),
          address,
          token
        );
      } else {
        const order = await createOrder(
          cart.map((it) => ({ productId: it.product._id, qty: it.qty })),
          token,
          address
        );
        showToast("Commande enregistrée (paiement à la livraison)", "success");
        setOrders((prev) => [order, ...prev]);
        setCart([]);
        setIsCartOpen(false);
        setShipStreet("");
        setShipCity("");
        setShipPostal("");
      }
    } catch (err: any) {
      showToast(err?.message ?? "Impossible de démarrer le paiement", "error");
    }
  };

  const checkoutDisabled = paymentMethod === "card" && !stripeEnabled;
  const checkoutLabel =
    paymentMethod === "card" ? "Payer par carte (test)" : "Confirmer la commande";

  const loadReviews = async (productId: string) => {
    setReviewsLoading((p) => ({ ...p, [productId]: true }));
    setReviewsError((p) => ({ ...p, [productId]: null }));
    try {
      const data: ReviewsResponse = await listReviews(productId);
      setReviewsByProduct((p) => ({ ...p, [productId]: data.items }));
      setReviewsMeta((p) => ({ ...p, [productId]: { average: data.average, total: data.total } }));
    } catch (err: any) {
      setReviewsError((p) => ({ ...p, [productId]: err?.message ?? "Erreur" }));
    } finally {
      setReviewsLoading((p) => ({ ...p, [productId]: false }));
    }
  };

  const handleAddReview = async (productId: string) => {
    if (!token) {
      showToast("Connecte-toi pour laisser un avis", "error");
      return;
    }
    const draft = reviewDraft[productId] || { rating: 5, comment: "" };
    if (!draft.rating || draft.rating < 1 || draft.rating > 5) {
      showToast("Note entre 1 et 5 requise", "error");
      return;
    }
    try {
      const created = await addReview(productId, draft.rating, draft.comment || "", token);
      setReviewsByProduct((p) => ({ ...p, [productId]: [created, ...(p[productId] || [])] }));
      const meta = reviewsMeta[productId] || { average: 0, total: 0 };
      const total = meta.total + 1;
      const average = ((meta.average * meta.total) + draft.rating) / total;
      setReviewsMeta((p) => ({ ...p, [productId]: { average, total } }));
      setReviewDraft((p) => ({ ...p, [productId]: { rating: 5, comment: "" } }));
      showToast("Avis ajouté", "success");
    } catch (err: any) {
      showToast(err?.message ?? "Impossible d'ajouter l'avis", "error");
    }
  };

  const handleAdminSubmit = async () => {
    if (!token) {
      showToast("Connecte-toi en admin", "error");
      return;
    }
    if (!adminForm.title || typeof adminForm.price !== "number" || Number(adminForm.price) <= 0) {
      showToast("Titre et prix requis (prix > 0)", "error");
      return;
    }
    setAdminSubmitting(true);
    const payload: Partial<Product> = {
      title: adminForm.title?.toString() || "",
      price: Number(adminForm.price) || 0,
      description: adminForm.description?.toString() || "",
      category: adminForm.category?.toString() || "",
      stock: Math.max(0, Number(adminForm.stock) || 0),
      salePrice: adminForm.salePrice !== undefined ? Number(adminForm.salePrice) : undefined,
      promoEndsAt: adminForm.promoEndsAt ? adminForm.promoEndsAt : undefined,
      images: adminImages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (adminEditingId) {
        const updated = await updateProduct(adminEditingId, payload, token);
        setProducts((prev) => prev.map((p) => (p._id === adminEditingId ? updated : p)));
        showToast("Produit mis à jour", "success");
      } else {
        const created = await createProduct(payload, token);
        setProducts((prev) => [created, ...prev]);
        showToast("Produit créé", "success");
      }
      resetAdminForm();
    } catch (err: any) {
      showToast(err?.message ?? "Action admin impossible", "error");
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleEditProduct = (p: Product) => {
    setAdminEditingId(p._id);
    setAdminForm({
      title: p.title,
      price: p.price,
      salePrice: p.salePrice,
      promoEndsAt: p.promoEndsAt,
      description: p.description,
      category: p.category,
      stock: p.stock,
    });
    setAdminImages(Array.isArray(p.images) ? p.images.join(", ") : "");
    scrollToAdmin();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Supprimer ce produit ?")) return;
    try {
      await deleteProduct(id, token);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      showToast("Produit supprimé", "success");
    } catch (err: any) {
      showToast(err?.message ?? "Suppression impossible", "error");
    }
  };

    const handleConfirmCancel = async () => {
    if (!token || !cancelModal.orderId) return;
    const reason = cancelModal.reason.trim();
    if (reason.length < 8) {
      showToast("Motif d'annulation trop court (8 caract?res mini)", "error");
      return;
    }
    setCancelModal((prev) => ({ ...prev, loading: true }));
    try {
      await cancelOrder(cancelModal.orderId, token, reason);
      setOrders((prev) => prev.filter((ord) => ord._id !== cancelModal.orderId));
      showToast("Commande annul?e", "success");
      setCancelModal({ orderId: null, reason: "", loading: false });
    } catch (err: any) {
      showToast(err?.message ?? "Annulation impossible", "error");
      setCancelModal((prev) => ({ ...prev, loading: false }));
    }
  };

return (
    <div
      className="qr-shell"
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 20% 20%, rgba(229,57,53,0.08), transparent 36%), radial-gradient(circle at 80% 10%, rgba(14,165,233,0.08), transparent 32%), linear-gradient(150deg, ${dark} 0%, #0f172a 55%, ${dark} 100%)`,
        color: "#0f172a",
      }}
    >
      <style>{globalStyles}</style>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            padding: "12px 14px",
            borderRadius: 12,
            background: toast.type === "success" ? "#dcfce7" : "#fee2e2",
            color: toast.type === "success" ? "#166534" : "#b91c1c",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            zIndex: 40,
            minWidth: 240,
          }}
        >
          {toast.message}
        </div>
      )}

      <div
        style={{
          background: accent,
          color: "white",
          textAlign: "center",
          padding: "6px 12px",
          fontWeight: 700,
          fontSize: "0.95rem",
        }}
      >
        Livraison Canada | Accessoires moto sélectionnés
      </div>

      <header
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "18px 16px",
          display: "flex",
          gap: 16,
          rowGap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
          <div style={{ fontWeight: 900, fontSize: "1.5rem", color: "white", letterSpacing: "0.02em" }}>
            Québécois Rider
          </div>
          <span
            style={{
              background: "rgba(255,255,255,0.12)",
              color: "#e5e7eb",
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: "0.85rem",
              fontWeight: 700,
            }}
          >
            Moto
          </span>
        </div>
        <div style={{ flex: "1 1 420px", minWidth: 260, maxWidth: 620 }}>
          <input
            placeholder="Rechercher par nom ou référence"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.12)",
              color: "white",
              outline: "none",
              fontSize: "0.95rem",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap", flex: "0 0 auto" }}>
          <button
            type="button"
            onClick={() => setShowSupport(true)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              cursor: "pointer",
              minWidth: 120,
            }}
          >
            Service client
          </button>
          {userRole === "admin" && (
            <button
              type="button"
              onClick={scrollToAdmin}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
                minWidth: 120,
              }}
            >
              Espace admin
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
              minWidth: 110,
            }}
          >
            Panier ({cart.reduce((s, i) => s + i.qty, 0)})
          </button>
          {token ? (
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "white",
                color: dark,
                cursor: "pointer",
                fontWeight: 700,
                minWidth: 130,
              }}
            >
              Déconnexion
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "white",
                color: dark,
                cursor: "pointer",
                fontWeight: 700,
                minWidth: 130,
              }}
            >
              Se connecter
            </button>
          )}
        </div>
      </header>

      <nav
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 16px",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          rowGap: 8,
        }}
      >
        {navCategories.map((t) => (
          <div
            key={t.label}
            onClick={() => {
              setCategoryFilter(t.value);
              scrollToCatalogue();
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: (categoryFilter ?? undefined) === t.value ? `2px solid ${accent}` : "1px solid rgba(255,255,255,0.2)",
              color: (categoryFilter ?? undefined) === t.value ? "white" : "#cbd5e1",
              fontWeight: 700,
              cursor: "pointer",
              background: (categoryFilter ?? undefined) === t.value ? "rgba(255,255,255,0.12)" : "transparent",
            }}
          >
            {t.label}
          </div>
        ))}
      </nav>
      {categoriesFromProducts.length > 0 && (
        <div
          style={{
            maxWidth: 1200,
            margin: "6px auto 0",
            padding: "0 16px",
            color: "#cbd5e1",
            fontSize: "0.9rem",
          }}
        >
          Catégories en stock : {categoriesFromProducts.join(" · ")}
        </div>
      )}

      <div
        style={{
          maxWidth: 1200,
          margin: "20px auto",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            position: "relative",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
            minHeight: 360,
            background: "#0f172a",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 30% 20%, rgba(229,57,53,0.16), transparent 40%)",
              zIndex: 1,
            }}
          />
          <iframe
            src="https://www.youtube.com/embed/MiKodijExSw?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=MiKodijExSw"
            title="Moto 3D"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              opacity: 0.9,
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(120deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.62) 100%)",
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 24,
              bottom: 20,
              zIndex: 3,
              color: "white",
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>Votre prochaine aventure vous attend</div>
            <div style={{ color: "#e2e8f0", fontSize: "1rem" }}>
              Bagagerie, protection, électronique — sélection moto Québec.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={scrollToCatalogue}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: accent,
                  color: "white",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 12px 32px rgba(229,57,53,0.35)",
                }}
              >
                Magasinez
              </button>
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: "transparent",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto 24px",
          padding: "0 16px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {highlightCategories.map((c) => (
          <div
            key={c.title}
            className="qr-glass"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(244,246,248,0.96) 100%)",
              borderRadius: 16,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.2s ease",
            }}
            onClick={() => {
              setCategoryFilter(c.category);
              scrollToCatalogue();
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                }}
              >
                {c.icon}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.98rem" }}>{c.title}</div>
                <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Magasinez</div>
              </div>
            </div>
            <span style={{ color: "#9ca3af", fontWeight: 700 }}>›</span>
          </div>
        ))}
      </div>

      {showCatalogue && (
        <section
          ref={catalogueRef}
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 16px 36px",
          }}
        >
        <div style={{ color: "white", fontWeight: 800, fontSize: "1.4rem", marginBottom: 12 }}>
          Catalogue
        </div>
        {loading && <p style={{ color: "white" }}>Chargement des produits...</p>}
        {error && <p style={{ color: "#fecdd3" }}>Erreur : {error}</p>}

        {!loading && !error && products.length === 0 && (
          <div
            style={{
              background: "white",
              padding: "16px",
              borderRadius: 12,
              boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
            }}
          >
            Aucun produit ne correspond pour le moment.
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 18,
            }}
          >
            {products.map((p) => {
              const outOfStock = (p.stock ?? 0) <= 0;
              return (
                <article
                  key={p._id}
                  style={{
                    background: "white",
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      background: "#f8fafc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {p.images && p.images[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ color: "#9ca3af" }}>Image</span>
                    )}
                  </div>
                  <div style={{ padding: "12px 14px", display: "grid", gap: 8, flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          background: "#ecfeff",
                          color: "#0ea5e9",
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontSize: "0.8rem",
                          fontWeight: 700,
                        }}
                      >
                        {p.category || "Divers"}
                      </span>
                      <span style={{ color: outOfStock ? "#ef4444" : "#6b7280", fontSize: "0.85rem" }}>
                        {outOfStock ? "Rupture" : `Stock: ${p.stock ?? 0}`}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700 }}>{p.title}</div>
                    <p style={{ color: "#4b5563", fontSize: "0.92rem", lineHeight: 1.4 }}>
                      {p.description ?? "Aucune description"}
                    </p>
                    {(() => {
                      const now = new Date().getTime();
                      const promoEnd = p.promoEndsAt ? new Date(p.promoEndsAt).getTime() : null;
                      const promoActive = typeof p.salePrice === "number" && p.salePrice > 0 && p.salePrice < p.price && (!promoEnd || promoEnd > now);
                      return (
                        <div style={{ display: "grid", gap: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                            <div style={{ fontWeight: 800, fontSize: "1.05rem", display: "flex", gap: 6, alignItems: "baseline" }}>
                              {promoActive ? (
                                <>
                                  <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "0.95rem", fontWeight: 700 }}>
                                    {p.price.toFixed(2)} $
                                  </span>
                                  <span style={{ color: "#e53935" }}>{p.salePrice!.toFixed(2)} $</span>
                                </>
                              ) : (
                                <span>{p.price.toFixed(2)} $</span>
                              )}
                            </div>
                            {promoActive && promoEnd && (
                              <span style={{ color: "#e11d48", fontSize: "0.82rem", fontWeight: 700 }}>
                                Promo jusqu'au {new Date(p.promoEndsAt!).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => addToCart(p)}
                            disabled={outOfStock}
                            style={{
                              background: outOfStock ? "#e5e7eb" : "#111827",
                              color: outOfStock ? "#9ca3af" : "white",
                              border: "none",
                              padding: "8px 12px",
                              borderRadius: 8,
                              cursor: outOfStock ? "not-allowed" : "pointer",
                              fontWeight: 700,
                            }}
                          >
                            {outOfStock ? "Rupture" : "Ajouter"}
                          </button>
                        </div>
                      );
                    })()}
                    {userRole === "admin" && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleEditProduct(p)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                            background: "white",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p._id)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #ef4444",
                            background: "white",
                            color: "#b91c1c",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                    <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenReviews((prev) => ({ ...prev, [p._id]: !prev[p._id] }));
                          if (!openReviews[p._id]) loadReviews(p._id);
                        }}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid #e5e7eb",
                          background: "white",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        Avis ({reviewsMeta[p._id]?.total ?? 0}){reviewsMeta[p._id]?.average ? ` • ${reviewsMeta[p._id]!.average.toFixed(1)}/5` : ""}
                      </button>
                      {openReviews[p._id] && (
                        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10, display: "grid", gap: 8 }}>
                          {reviewsLoading[p._id] && <div style={{ color: "#475569" }}>Chargement des avis...</div>}
                          {reviewsError[p._id] && <div style={{ color: "#b91c1c" }}>{reviewsError[p._id]}</div>}
                          {!reviewsLoading[p._id] && (reviewsByProduct[p._id]?.length || 0) === 0 && (
                            <div style={{ color: "#64748b" }}>Pas encore d'avis.</div>
                          )}
                          {reviewsByProduct[p._id]?.slice(0, 5).map((r) => (
                            <div key={r._id} style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 6 }}>
                              <div style={{ fontWeight: 700, color: "#0f172a" }}>{r.rating}/5</div>
                              {r.comment && <div style={{ color: "#475569", fontSize: "0.92rem" }}>{r.comment}</div>}
                              <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                            </div>
                          ))}
                          <div style={{ display: "grid", gap: 6 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <label style={{ fontWeight: 700, color: "#0f172a" }}>Note</label>
                              <input
                                type="number"
                                min={1}
                                max={5}
                                value={reviewDraft[p._id]?.rating ?? 5}
                                onChange={(e) =>
                                  setReviewDraft((prev) => ({
                                    ...prev,
                                    [p._id]: { rating: Number(e.target.value), comment: prev[p._id]?.comment ?? "" },
                                  }))
                                }
                                style={{ width: 70, padding: "6px 8px", borderRadius: 8, border: "1px solid #e5e7eb" }}
                              />
                            </div>
                            <textarea
                              placeholder="Votre avis (optionnel)"
                              value={reviewDraft[p._id]?.comment ?? ""}
                              onChange={(e) =>
                                setReviewDraft((prev) => ({
                                  ...prev,
                                  [p._id]: { rating: prev[p._id]?.rating ?? 5, comment: e.target.value },
                                }))
                              }
                              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb", minHeight: 60, fontFamily: "inherit" }}
                            />
                            <button
                              type="button"
                              onClick={() => handleAddReview(p._id)}
                              style={{
                                padding: "10px 12px",
                                borderRadius: 10,
                                border: "none",
                                background: `linear-gradient(130deg, ${accent}, #f97316)`,
                                color: "white",
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              Publier l'avis
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {productsMeta.total > productsMeta.limit && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              marginTop: 16,
              alignItems: "center",
              color: "white",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: page <= 1 ? "#f3f4f6" : "white",
                cursor: page <= 1 ? "not-allowed" : "pointer",
              }}
            >
              Précédent
            </button>
            <div style={{ fontWeight: 700 }}>
              Page {productsMeta.page} / {Math.ceil(productsMeta.total / productsMeta.limit)}
            </div>
            <button
              type="button"
              disabled={page >= Math.ceil(productsMeta.total / productsMeta.limit)}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: page >= Math.ceil(productsMeta.total / productsMeta.limit) ? "#f3f4f6" : "white",
                cursor: page >= Math.ceil(productsMeta.total / productsMeta.limit) ? "not-allowed" : "pointer",
              }}
            >
              Suivant
            </button>
          </div>
        )}
        </section>
      )}

      {userRole === "admin" && (
        <section
          ref={adminRef}
          style={{
            maxWidth: 1200,
            margin: "0 auto 32px",
            padding: "0 16px",
          }}
        >
          <div style={{ color: "white", fontWeight: 800, fontSize: "1.3rem", marginBottom: 12 }}>
            Admin produits
          </div>
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 16,
              border: "1px solid #e5e7eb",
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                placeholder="Titre"
                value={adminForm.title || ""}
                onChange={(e) => setAdminForm((p) => ({ ...p, title: e.target.value }))}
                style={{ flex: 1, minWidth: 180, padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              />
              <input
                placeholder="Prix"
                type="number"
                value={adminForm.price ?? 0}
                onChange={(e) => setAdminForm((p) => ({ ...p, price: Number(e.target.value) }))}
                style={{ width: 120, padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              />
              <input
                placeholder="Prix promo (optionnel)"
                type="number"
                value={adminForm.salePrice ?? ""}
                onChange={(e) => setAdminForm((p) => ({ ...p, salePrice: e.target.value ? Number(e.target.value) : undefined }))}
                style={{ width: 150, padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              />
              <input
                placeholder="Fin promo (YYYY-MM-DD)"
                type="date"
                value={adminForm.promoEndsAt ? adminForm.promoEndsAt.slice(0, 10) : ""}
                onChange={(e) => setAdminForm((p) => ({ ...p, promoEndsAt: e.target.value || undefined }))}
                style={{ width: 180, padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              />
              <input
                placeholder="Catégorie"
                value={adminForm.category || ""}
                onChange={(e) => setAdminForm((p) => ({ ...p, category: e.target.value }))}
                style={{ flex: 1, minWidth: 140, padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              />
              <input
                placeholder="Stock"
                type="number"
                value={adminForm.stock ?? 0}
                onChange={(e) => setAdminForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                style={{ width: 120, padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              />
            </div>
            <textarea
              placeholder="Description"
              value={adminForm.description || ""}
              onChange={(e) => setAdminForm((p) => ({ ...p, description: e.target.value }))}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", minHeight: 70 }}
            />
            <input
              placeholder="Images (URLs séparées par des virgules)"
              value={adminImages}
              onChange={(e) => setAdminImages(e.target.value)}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleAdminSubmit}
                disabled={adminSubmitting}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: adminSubmitting ? "#e5e7eb" : `linear-gradient(130deg, ${accent}, #f97316)`,
                  color: adminSubmitting ? "#94a3b8" : "white",
                  fontWeight: 800,
                  cursor: adminSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {adminSubmitting ? "..." : adminEditingId ? "Mettre à jour" : "Créer"}
              </button>
              {adminEditingId && (
                <button
                  type="button"
                  onClick={resetAdminForm}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Annuler l'édition
                </button>
              )}
            </div>
          </div>

          <div style={{ color: "#0f172a", fontSize: "0.9rem", lineHeight: 1.5, marginTop: 6 }}>
            <strong>Note promo :</strong> prix promo doit ?tre inf?rieur au prix normal et la date de fin (optionnelle)
            doit ?tre au format AAAA-MM-JJ. La remise s'affiche automatiquement si la date est future.
          </div>
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {(products || []).map((p) => (
              <div
                key={p._id}
                style={{
                  background: "white",
                  borderRadius: 12,
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontWeight: 800 }}>{p.title}</div>
                  <div style={{ color: "#475569" }}>
                    {p.price.toFixed(2)} $ • {p.category || "Divers"} • Stock {p.stock ?? 0}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleEditProduct(p)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      background: "white",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Éditer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(p._id)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid #ef4444",
                      background: "white",
                      color: "#b91c1c",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {token && (
        <section
          style={{
            maxWidth: 1200,
            margin: "0 auto 32px",
            padding: "0 16px",
          }}
        >
          <div style={{ color: "white", fontWeight: 800, fontSize: "1.3rem", marginBottom: 12 }}>
            Mes commandes
          </div>
          {ordersLoading && <p style={{ color: "white" }}>Chargement...</p>}
          {ordersError && <p style={{ color: "#fecdd3" }}>{ordersError}</p>}
          {!ordersLoading && !ordersError && visibleOrders.length === 0 && (
            <div
              style={{
                background: "white",
                padding: "14px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
              }}
            >
              Aucune commande pour l'instant.
            </div>
          )}
          {!ordersLoading && !ordersError && visibleOrders.length > 0 && (
            <div style={{ display: "grid", gap: 10 }}>
              {visibleOrders.map((o) => (
                <div
                  key={o._id}
                  style={{
                    background: "white",
                    borderRadius: 12,
                    padding: "12px 14px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>
                    Commande #{o._id.slice(-6).toUpperCase()}
                  </div>
                  <div style={{ color: "#475569", fontWeight: 700 }}>
                    {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ marginTop: 6, color: "#0f172a", fontWeight: 700 }}>
                  Total : {o.total.toFixed(2)} $ · Statut : {o.status}
                </div>
                {o.estimatedDelivery && (
                  <div style={{ marginTop: 4, color: "#475569", fontSize: "0.92rem", fontWeight: 700 }}>
                    Livraison estimée : {new Date(o.estimatedDelivery).toLocaleDateString()}
                  </div>
                )}
                <div style={{ marginTop: 6, color: "#475569", fontSize: "0.92rem" }}>
                  {o.items.map((it) => `${it.qty} x ${it.title}`).join(" · ")}
                </div>
                {o.status !== "canceled" && (
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() =>
                        setCancelModal({
                          orderId: o._id,
                          reason: "",
                          loading: false,
                        })
                      }
                      style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid #ef4444",
                          background: "white",
                          color: "#b91c1c",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Annuler la commande
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {cancelModal.orderId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 45,
          }}
          onClick={() => {
            if (!cancelModal.loading) setCancelModal({ orderId: null, reason: "", loading: false });
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(480px, 100%)",
              background: "white",
              borderRadius: 16,
              padding: 18,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              display: "grid",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>Annuler la commande</div>
              <button
                type="button"
                onClick={() => !cancelModal.loading && setCancelModal({ orderId: null, reason: "", loading: false })}
                style={{
                  background: "white",
                  color: "#0f172a",
                  border: "1px solid #e5e7eb",
                  padding: "6px 10px",
                  borderRadius: 10,
                  cursor: cancelModal.loading ? "not-allowed" : "pointer",
                  opacity: cancelModal.loading ? 0.7 : 1,
                }}
              >
                Fermer
              </button>
            </div>
            <div style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.4 }}>
              Merci d'indiquer un motif clair (ex: erreur d'adresse, doublon, changement de plan). Cela nous aide ? am?liorer le service.
            </div>
            <textarea
              value={cancelModal.reason}
              onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Raison de l'annulation"
              rows={4}
              disabled={cancelModal.loading}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "0.9rem" }}>
                {cancelModal.reason.trim().length < 8 ? "8 caract?res minimum" : ""}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => !cancelModal.loading && setCancelModal({ orderId: null, reason: "", loading: false })}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "white",
                    cursor: cancelModal.loading ? "not-allowed" : "pointer",
                    color: "#0f172a",
                    fontWeight: 700,
                  }}
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelModal.loading}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "none",
                    background: cancelModal.loading ? "#e5e7eb" : `linear-gradient(130deg, ${accent}, #f97316)` ,
                    color: cancelModal.loading ? "#94a3b8" : "white",
                    fontWeight: 800,
                    cursor: cancelModal.loading ? "not-allowed" : "pointer",
                  }}
                >
                  {cancelModal.loading ? "Envoi..." : "Confirmer l'annulation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 30,
          }}
          onClick={() => setIsCartOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(640px, 100%)",
              maxHeight: "80vh",
              background: "white",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>Panier</div>
                <div style={{ color: "#475569", fontSize: "0.92rem" }}>
                  {cart.reduce((s, i) => s + i.qty, 0)} article(s)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                style={{
                  background: "white",
                  color: "#0f172a",
                  border: "1px solid #e5e7eb",
                  padding: "8px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                Fermer
              </button>
            </div>

            <div style={{ padding: "14px 18px", overflowY: "auto", flex: 1, display: "grid", gap: 12 }}>
              {cart.length === 0 ? (
                <p style={{ color: "#6b7280" }}>Votre panier est vide.</p>
              ) : (
                cart.map((i) => (
                  <div
                    key={i.product._id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: "10px 12px",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{i.product.title}</div>
                      <div style={{ color: "#64748b", fontSize: "0.9rem", display: "flex", gap: 6, alignItems: "center" }}>
                        <span>{i.qty} x</span>
                        {promoActive(i.product) ? (
                          <>
                            <span style={{ textDecoration: "line-through", color: "#94a3b8" }}>
                              {i.product.price.toFixed(2)} $
                            </span>
                            <span style={{ color: "#e53935", fontWeight: 700 }}>{unitPrice(i.product).toFixed(2)} $</span>
                          </>
                        ) : (
                          <span>{unitPrice(i.product).toFixed(2)} $</span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>
                        {(unitPrice(i.product) * i.qty).toFixed(2)} $
                      </div>
                      <button
                        onClick={() => removeFromCart(i.product._id)}
                        style={{
                          marginTop: 6,
                          background: "transparent",
                          color: "#e53935",
                          border: "1px solid rgba(229,57,53,0.5)",
                          padding: "6px 10px",
                          borderRadius: 10,
                          cursor: "pointer",
                        }}
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: "14px 18px", borderTop: "1px solid #e5e7eb", display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>Adresse de livraison</div>
                  <input
                    value={shipStreet}
                    onChange={(e) => setShipStreet(e.target.value)}
                    placeholder="Numéro et rue"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
                  />
                  <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", alignItems: "center" }}>
                    <input
                      value={shipPostal}
                      onChange={(e) => setShipPostal(e.target.value)}
                      placeholder="Code postal"
                      style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
                    />
                    <input
                      value={shipCity}
                      onChange={(e) => setShipCity(e.target.value)}
                      placeholder="Ville"
                      style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#334155", fontWeight: 700 }}>
                  <span>Total</span>
                  <strong style={{ fontSize: "1.1rem", color: "#0f172a" }}>{total.toFixed(2)} $</strong>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#0f172a", fontWeight: 700, opacity: stripeEnabled ? 1 : 0.5 }}>
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                        disabled={!stripeEnabled}
                      />
                      Carte (Stripe test)
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#0f172a", fontWeight: 700 }}>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                      />
                      Paiement à la livraison
                    </label>
                  </div>
                  {!stripeEnabled && (
                    <div style={{ color: "#e53935", fontSize: "0.9rem", fontWeight: 600 }}>
                      Paiement carte (Stripe test) désactivé tant que STRIPE_SECRET n'est pas configuré.
                    </div>
                  )}
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkoutDisabled}
                  style={{
                    background: checkoutDisabled ? "#e5e7eb" : `linear-gradient(130deg, ${accent}, #f97316)` ,
                    color: checkoutDisabled ? "#94a3b8" : "white",
                    border: "none",
                    padding: "12px",
                    borderRadius: 12,
                    cursor: checkoutDisabled ? "not-allowed" : "pointer",
                    fontWeight: 800,
                    fontSize: "1rem",
                    boxShadow: checkoutDisabled ? "none" : "0 12px 30px rgba(229,57,53,0.25)",
                  }}
                >
                  {checkoutLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showAuth && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
          onClick={() => setShowAuth(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(420px, 100%)",
              background: "white",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              display: "grid",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setAuthMode("login")}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: authMode === "login" ? `2px solid ${accent}` : "1px solid #e5e7eb",
                  background: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Connexion
              </button>
              <button
                onClick={() => setAuthMode("register")}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: authMode === "register" ? `2px solid ${accent}` : "1px solid #e5e7eb",
                  background: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Inscription
              </button>
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #e5e7eb" }}
            />
            {authMode === "register" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom"
                style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #e5e7eb" }}
              />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                style={{ flex: 1, padding: "12px 14px", borderRadius: 12, border: "1px solid #e5e7eb" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                  minWidth: 100,
                }}
              >
                {showPassword ? "Masquer" : "Afficher"}
              </button>
            </div>
            <button
              onClick={handleAuth}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "none",
                background: `linear-gradient(130deg, ${accent}, #f97316)` ,
                color: "white",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 12px 32px rgba(229,57,53,0.35)",
              }}
            >
              {authMode === "login" ? "Se connecter" : "S'inscrire"}
            </button>
          </div>
        </div>
      )}

      {showSupport && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
          onClick={() => setShowSupport(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(420px, 100%)",
              maxHeight: "80vh",
              background: "white",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>Service client</div>
              <button
                type="button"
                onClick={() => setShowSupport(false)}
                style={{
                  background: "white",
                  color: "#0f172a",
                  border: "1px solid #e5e7eb",
                  padding: "6px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                Fermer
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 10,
                display: "grid",
                gap: 8,
              }}
            >
              {supportMessages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    justifySelf: m.from === "user" ? "end" : "start",
                    maxWidth: "90%",
                    background: m.from === "user" ? "#111827" : "#f3f4f6",
                    color: m.from === "user" ? "white" : "#0f172a",
                    padding: "8px 10px",
                    borderRadius: 10,
                    whiteSpace: "pre-line",
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {supportSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSupportSend(s)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={supportInput}
                onChange={(e) => setSupportInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSupportSend();
                  }
                }}
                placeholder="Écris ton message..."
                style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}
              />
              <button
                type="button"
                onClick={() => handleSupportSend()}
                disabled={supportLoading}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: supportLoading ? "#e5e7eb" : `linear-gradient(130deg, ${accent}, #f97316)`,
                  color: supportLoading ? "#94a3b8" : "white",
                  fontWeight: 800,
                  cursor: supportLoading ? "not-allowed" : "pointer",
                  minWidth: 80,
                }}
              >
                {supportLoading ? "..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
