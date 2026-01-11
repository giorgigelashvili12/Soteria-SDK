import { CHECKOUT_WEB } from "../shared/constants";

class SoteriaWeb {
  /**
   * Redirects the user to the secure UI.
   * Only needs the public client_secret.
   */
  redirectToCheckout(clientSecret: string) {
    if (!clientSecret) throw new Error("Client Secret is required");
    window.location.href = `${CHECKOUT_WEB}/${clientSecret}`;
  }
}

export const soteria = new SoteriaWeb();
