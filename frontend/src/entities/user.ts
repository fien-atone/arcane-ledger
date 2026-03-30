export type SystemRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: SystemRole;
  createdAt: string;
}
