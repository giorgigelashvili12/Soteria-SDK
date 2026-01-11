import { CHECKOUT_WEB } from "../../shared/js/constants.js";

export const soteria = {
    redirectToCheckout: (clientSecret) => {
        if (!clientSecret) throw new Error("Soteria: Client Secret is required");
        window.location.href = `${CHECKOUT_WEB}/${clientSecret}`;
    }
};