import { API_BASE, CHECKOUT_WEB } from "../shared/constants.js";
import crypto from 'node:crypto'; 

class SoteriaServer {
  #passkey = "";
  #secretKey = "";

  /**
   * Initialize SDK with credentials
   * @param {string} passkey
   * @param {string} secretKey
   */
  configure(passkey, secretKey) {
    this.#passkey = passkey;
    this.#secretKey = secretKey;
  }

  /**
   * Handles both Catalog IDs and Dynamic Items.
   */
  async createCheckout(items) {
    if (!this.#passkey) {
      throw new Error("Soteria not configured. Call .configure(passkey, secretKey) first.");
    }

    const payload = JSON.stringify(items);
    const signature = crypto
      .createHmac('sha256', this.#secretKey) 
      .update(payload)
      .digest('hex');

    const res = await fetch(`${API_BASE}/products/create-checkout`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Soteria-Signature": signature
      },
      body: JSON.stringify({
        passkey: this.#passkey,
        items: items
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.msg || "Checkout session failed");
    }

    return await res.json();
  }

  /**
   * Helper to generate the URL for redirects
   * @param {string} clientSecret
   */
  getCheckoutUrl(clientSecret) {
    return `${CHECKOUT_WEB}/${clientSecret}`;
  }

  /**
   * @private
   */
  async #internalIntent(config) {
    const res = await fetch(`${API_BASE}/payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...config, passkey: this.#passkey }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.msg || "Soteria session failed");
    }

    return await res.json();
  }

  /**
   * @deprecated use createCheckout instead.
   */
  async createIntent(config) {
    try {
      console.warn(".createIntent() is deprecated. please use .createCheckout() instead");
      return await this.#internalIntent(config);
    } catch (err) {
      console.error("SOTERIA_NODE_ERROR:", err);
      throw err;
    }
  }

  /**
   * Syncs an array of products to the Soteria Catalog.
   */
  async syncCatalog(products) {
    if (!this.#passkey) throw new Error("Soteria not configured.");

    const res = await fetch(`${API_BASE}/products/sync`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passkey: this.#passkey,
        products: products
      })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.msg || "Catalog sync failed");
    }

    return await res.json();
  }

  /**
   * Delete a product from the catalog
   * @param {string} productId 
   */
  async deleteProduct(productId) {
    const res = await fetch(`${API_BASE}/products/delete`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passkey: this.#passkey, id: productId })
    });
  
    if (!res.ok) {
      const text = await res.text();
      
      if (text.includes("<!DOCTYPE html>")) {
        throw new Error(`Server returned an HTML error page (404/500). Check if the URL ${API_BASE}/products/delete is correct.`);
      }
      
      throw new Error(`API Error: ${res.status} - ${text}`);
    }

    return await res.json();
  }

  /**
   * Update an existing product
   * @param {Object} data - { id, name, price, sku, etc }
   */
  async editProduct(data) {
    if (!this.#passkey) throw new Error("Soteria not configured.");

    const res = await fetch(`http://localhost:33031/api/v1/products/edit`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        passkey: this.#passkey
      })
    });

    if (!res.ok) {
      const text = await res.text();
      if (text.includes("<!DOCTYPE html>")) {
        throw new Error("Backend Crushed: The server sent an HTML error page. Check your backend console logs.");
      }
      
      const errorData = JSON.parse(text);
      throw new Error(errorData.msg || "Edit failed");
    }

    return await res.json();
  }

  /**
   * Fetches the merchant's product details
   */
  async getProduct(params = {}) {
    if (!this.#passkey) throw new Error("Soteria not configured.");
  
    const queryParams = new URLSearchParams({
      passkey: this.#passkey,
      ...params
    }).toString();
  
    const res = await fetch(`http://localhost:33031/api/v1/products/get?${queryParams}`, {
      method: 'GET',
      headers: { "Content-Type": "application/json" }
    });
  
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.msg || "Fetch failed");
    }
  
    return await res.json();
  }
}

export const soteria = new SoteriaServer();