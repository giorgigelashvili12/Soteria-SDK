import { API_BASE, CHECKOUT_WEB } from "../../shared/js/constants";
import { SoteriaConfig, SoteriaResponse } from "../../shared/js/types";
import * as crypto from 'node:crypto';

class SoteriaServer {
  private passkey: string = "";
  private secretKey: string = "";

  /**
   * Initialize sdk with a passkey
   */
  configure(passkey: string, secretKey: string) {
    this.passkey = passkey;
    this.secretKey = secretKey;
  }

  /**
   * Handles both Catalog IDs and Dynamic Items.
   * Sends data to the backend to generate a PaymentIntent and Checkout URL.
   */
  async createCheckout(items: any[]): Promise<SoteriaResponse> {
    if (!this.passkey) {
      throw new Error("Soteria not configured. Call .configure(passkey) first.");
    }

    const payload = JSON.stringify(items);
    const signature = crypto
    .createHmac('sha256', this.secretKey) 
    .update(payload)
    .digest('hex');

    const res = await fetch(`${API_BASE}/checkout/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Soteria-Signature": signature
      },
      body: JSON.stringify({
        passkey: this.passkey,
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
   * Helper to generate the URL if the merchant wants to
   * send a link using email or sms instead of a frontend redirect.
   */
  getCheckoutUrl(clientSecret: string): string {
    return `${CHECKOUT_WEB}/${clientSecret}`;
  }

  /**
   * api fetch
   */
  private async internalIntent(
    config: SoteriaConfig,
  ): Promise<SoteriaResponse> {
    const res = await fetch(`${API_BASE}/payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.msg || "Soteria session failed");
    }

    return await res.json();
  }

  /**
   * @deprecated Use createCheckout instead. 
   * This handles the old SoteriaConfig structure.
   */
  async createIntent(config: SoteriaConfig): Promise<SoteriaResponse> {
    try {
      return await this.internalIntent(config);
    } catch (err) {
      console.error("SOTERIA_NODE_ERROR:", err);
      throw err;

    }

  }

  /**
   * Syncs an array of products to the Soteria Catalog.
   * using upsert logic: If a product in the list exists
   * move onto another one and add it instead (if not in catalog)
   */
  async syncCatalog(products: any[]): Promise<any> {
    if (!this.passkey) throw new Error("Soteria not configured. Call .configure(passkey) first.");

    const res = await fetch(`${API_BASE}/products/sync`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passkey: this.passkey,
        products: products
      })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.msg || "Catalog sync failed");
    }

    return await res.json();
  }
}

export const soteria = new SoteriaServer();
