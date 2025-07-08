export interface User {
  userId: string;
  clientId: string;
  email: string;
  role: string;
  shopifyStore: string; // nakon verifikacije obrisati
  shopifyAccessToken: string; // nakon verifikacije obrisati
  facebookAccessToken: string; // nakon verifikacije obrisati
}
