import { asBody, positiveInt } from "../../../../shared/http/validation";
import { RoleUserCreateDto } from "./role-user.dto";

const MAX_ID = 2_147_483_647;

export const parseRoleUserCreate = (raw: unknown): RoleUserCreateDto => {
  const body = asBody(raw);
  return { userId: positiveInt(body.userId, "userId", MAX_ID), roleId: positiveInt(body.roleId, "roleId", MAX_ID) };
};
