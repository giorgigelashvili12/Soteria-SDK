import { API_BASE, CHECKOUT_WEB } from "../shared/constants";
import { SoteriaConfig, SoteriaResponse } from "../shared/types";

class SoteriaServer {
  /**
   * Creates the intent and returns the full object
   */
  async createCheckout(config: SoteriaConfig): Promise<SoteriaResponse> {
    try {
      return await this.internalIntent(config);
    } catch (err) {
      console.error("SOTERIA_NODE_ERROR:", err);
      throw err;
    }
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
    const response = await fetch(`${API_BASE}/payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || "Soteria session failed");
    }

    return await response.json();
  }
}

export const soteria = new SoteriaServer();
