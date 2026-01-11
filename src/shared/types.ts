export interface SoteriaConfig {
  product_id: string;
  passkey: string;
  currency?: string;
  success_url?: string;
}

export interface SoteriaResponse {
  id: string;
  client_secret: string;
}
