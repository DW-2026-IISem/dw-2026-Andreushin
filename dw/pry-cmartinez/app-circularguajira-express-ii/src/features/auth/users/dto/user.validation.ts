import { BadRequestError } from "../../../../shared/errors/httpError";
import { asBody, Body, oneOf, optionalText, requiredText } from "../../../../shared/http/validation";
import { UserStatus } from "../user.model";
import { ChangePasswordDto, UserCreateDto, UserPatchDto, UserUpdateDto } from "./user.dto";

const STATUSES: readonly UserStatus[] = ["active", "inactive"];
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,80}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/\S+$/;

// bcrypt only uses the first 72 bytes; at least one letter and one digit.
export const password = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.length < 8 || Buffer.byteLength(value) > 72) {
    throw new BadRequestError(`El campo ${field} debe tener entre 8 y 72 caracteres`);
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw new BadRequestError(`El campo ${field} debe incluir al menos una letra y un número`);
  }
  return value;
};

const identity = (body: Body): UserUpdateDto => ({
  username: requiredText(body.username, "username", 80, USERNAME_PATTERN).toLowerCase(),
  email: requiredText(body.email, "email", 150, EMAIL_PATTERN).toLowerCase(),
  avatar: optionalText(body.avatar, "avatar", 500, URL_PATTERN),
});

export const parseUserCreate = (raw: unknown): UserCreateDto => {
  const body = asBody(raw);
  const input: UserCreateDto = { ...identity(body), password: password(body.password, "password") };
  if (body.status !== undefined) input.status = oneOf(body.status, "status", STATUSES);
  return input;
};

export const parseUserUpdate = (raw: unknown): UserUpdateDto => identity(asBody(raw));

export const parseUserPatch = (raw: unknown): UserPatchDto => {
  const body = asBody(raw);
  const patch: UserPatchDto = {};
  if (body.username !== undefined) patch.username = requiredText(body.username, "username", 80, USERNAME_PATTERN).toLowerCase();
  if (body.email !== undefined) patch.email = requiredText(body.email, "email", 150, EMAIL_PATTERN).toLowerCase();
  if (body.avatar !== undefined) patch.avatar = optionalText(body.avatar, "avatar", 500, URL_PATTERN);
  if (body.password !== undefined || body.status !== undefined) {
    throw new BadRequestError("password y status no se cambian aquí: usa /password o /deactivate");
  }
  if (Object.keys(patch).length === 0) {
    throw new BadRequestError("Envía al menos un campo para actualizar (username, email, avatar)");
  }
  return patch;
};

export const parseChangePassword = (raw: unknown): ChangePasswordDto => {
  const body = asBody(raw);
  if (typeof body.currentPassword !== "string" || body.currentPassword === "") {
    throw new BadRequestError("El campo currentPassword es obligatorio");
  }
  const newPassword = password(body.newPassword, "newPassword");
  if (newPassword === body.currentPassword) {
    throw new BadRequestError("La nueva contraseña debe ser distinta de la actual");
  }
  return { currentPassword: body.currentPassword, newPassword };
};
