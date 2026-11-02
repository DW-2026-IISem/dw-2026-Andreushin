import { Status, Timestamps } from './api.model';

/** Table `users` — /api/users. Never includes `password`. */
export interface User extends Timestamps {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  status: Status;
}

/** POST body: `password` is required on create. */
export interface UserCreatePayload {
  username: string;
  email: string;
  password: string;
  avatar: string | null;
  status?: Status;
}

/** PUT/PATCH body: no password (it has its own endpoint) and no status. */
export interface UserUpdatePayload {
  username: string;
  email: string;
  avatar: string | null;
}

/** PATCH /api/users/:id/password: the current password is required even for an admin. */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
