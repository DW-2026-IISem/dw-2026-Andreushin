import { asBody, requiredText } from "../../../../shared/http/validation";
import { LoginDto, RefreshTokenDto } from "./session.dto";

// Shape checks only: credential rules (length, charset) are not revealed at login.
export const parseLogin = (raw: unknown): LoginDto => {
  const body = asBody(raw);
  return {
    identifier: requiredText(body.identifier, "identifier", 150),
    password: requiredText(body.password, "password", 200),
  };
};

export const parseRefreshToken = (raw: unknown): RefreshTokenDto => ({
  refreshToken: requiredText(asBody(raw).refreshToken, "refreshToken", 200),
});
