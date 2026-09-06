export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: 'user' | 'admin';
  year: number | null;
}

export interface AuthResponse {
  user: AppUser;
  token: string;
}
