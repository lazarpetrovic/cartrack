export type UserRole = "user" | "mechanic";

export interface AppUser {
  uid: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  createdAt?: string;
}

