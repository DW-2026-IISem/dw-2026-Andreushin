import { UserStatus } from "../user.model";

// POST /api/users. Status defaults to active; afterwards it only changes via deactivate.
export interface UserCreateDto {
  username: string;
  email: string;
  password: string;
  avatar: string | null;
  status?: UserStatus;
}

// PUT /api/users/:id (full replacement). Neither password (own operation that checks the
// current one) nor status (only via deactivate).
export interface UserUpdateDto {
  username: string;
  email: string;
  avatar: string | null;
}

// PATCH /api/users/:id.
export type UserPatchDto = Partial<UserUpdateDto>;

// PATCH /api/users/:id/password: the current password is required even for an admin
// (defense in depth: a compromised admin cannot silently rotate someone else's credential).
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
