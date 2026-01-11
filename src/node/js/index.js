import { API_BASE } from "../../shared/js/constants.js";

export const soteria = {
  createCheckout: async (config) => {
    try {
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
    } catch (err) {
      console.error("SOTERIA_SDK_ERROR:", err);
      throw err;
    }
  }
};