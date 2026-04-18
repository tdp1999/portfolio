export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  hasPassword: boolean;
  hasGoogleLinked: boolean;
  createdAt: string;
  updatedAt: string;
}
