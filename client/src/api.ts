// client/src/api.ts
export type Product = {
  _id: string;
  title: string;
  description?: string;
  price: number;
  salePrice?: number;
  promoEndsAt?: string;
  category?: string;
  images?: string[];
  stock?: number;
  popularity?: number;
  compatibility?: string;
  averageRating?: number;
  reviewsCount?: number;
};

export type ProductsResponse = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
};

export type Review = {
  _id: string;
  product: string;
  user: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewsResponse = {
  items: Review[];
  average: number;
  total: number;
};

export async function listProducts(params?: {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}): Promise<ProductsResponse> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.category) query.set("category", params.category);
  if (params?.minPrice !== undefined) query.set("minPrice", String(params.minPrice));
  if (params?.maxPrice !== undefined) query.set("maxPrice", String(params.maxPrice));
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const response = await fetch(`/api/products?${query.toString()}`);
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  return (await response.json()) as ProductsResponse;
}

export async function getProductById(id: string): Promise<Product | null> {
  const response = await fetch(`/api/products/${id}`);
  if (!response.ok) return null;
  return (await response.json()) as Product;
}

// Creer une session de paiement Stripe (mode test)
export async function createCheckoutSession(
  items: { productId: string; qty: number }[],
  shippingAddress?: string,
  token?: string
) {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ items, shippingAddress }),
  });

  const text = await response.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data?.error || `Erreur HTTP ${response.status}`);
  }

  if (data.url) {
    window.location.href = data.url;
    return data.url as string;
  }
  throw new Error("Pas d'URL retournee par l'API Stripe");
}

export async function register(email: string, password: string, name?: string) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function fetchOrders(token: string) {
  const res = await fetch("/api/orders", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export type OrderResponse = {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  estimatedDelivery?: string;
  cancelReason?: string;
  items: { title: string; price: number; qty: number }[];
  shippingAddress?: string;
};

export async function createOrder(
  items: { productId: string; qty: number }[],
  token: string,
  shippingAddress?: string
) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items, shippingAddress }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
  return data as OrderResponse;
}

export async function cancelOrder(id: string, token: string, reason: string) {
  const res = await fetch(`/api/orders/${id}/cancel`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
  return data as OrderResponse;
}

// Admin products
export async function createProduct(payload: Partial<Product>, token: string) {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
  return data as Product;
}

export async function updateProduct(id: string, payload: Partial<Product>, token: string) {
  const res = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
  return data as Product;
}

export async function deleteProduct(id: string, token: string) {
  const res = await fetch(`/api/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
  return data;
}

export async function listReviews(productId: string): Promise<ReviewsResponse> {
  const res = await fetch(`/api/products/${productId}/reviews`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function addReview(productId: string, rating: number, comment: string, token: string) {
  const res = await fetch(`/api/products/${productId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rating, comment }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
  return data as Review;
}

export type ConfigResponse = {
  stripeEnabled: boolean;
  paymentMethods: string[];
};

export async function fetchConfig(): Promise<ConfigResponse> {
  const res = await fetch("/api/config");
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
  return data;
}

// Appel au modèle local Ollama (chat)
export async function askOllama(message: string, fallback?: string): Promise<string> {
  // Essaie d'abord via le proxy Vite, puis retombe sur l'URL directe si échec réseau
  const payload = {
    model: "llama3",
    messages: [{ role: "user", content: message }],
    stream: false,
  };

  const tryFetch = async (url: string) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Ollama indisponible (${res.status})`);
    const data = await res.json().catch(() => ({}));
    return data?.message?.content ?? "Pas de réponse";
  };

  try {
    return await tryFetch("/ollama/api/chat");
  } catch (e) {
    // fallback direct si le proxy n'est pas en place
    try {
      return await tryFetch("http://localhost:11434/api/chat");
    } catch {
      return fallback ?? "Je note ta demande, un conseiller te répondra.";
    }
  }
}
