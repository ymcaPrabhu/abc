export type UserRole = 'Assistive' | 'Section Officer' | 'Under Secretary' | 'Professional Creator';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
}
