export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: 'user' | 'admin';
  year: number | null;
  /** Nur bei Gast-Kurzzeitkonten: Ablauf des Zugangs (ISO-Zeitpunkt). */
  gastBis?: string | null;
}

export interface AuthResponse {
  user: AppUser;
  token: string;
}
