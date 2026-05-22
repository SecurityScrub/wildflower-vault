// Password policy for The Wild Flower Vault:
//   - 12 character minimum
//   - At least one uppercase letter
//   - At least one lowercase letter
//   - At least one digit
//   - At least one symbol
//   - Maximum length 128 (to bound bcrypt input)

export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSymbol: true,
} as const;

export const PASSWORD_POLICY_DESCRIPTION =
  "Password must be at least 12 characters and include uppercase, lowercase, a number, and a symbol.";

const SYMBOL_RE = /[^A-Za-z0-9]/;

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  if (typeof password !== "string") {
    return { valid: false, errors: ["Password is required."] };
  }
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Must be at least ${PASSWORD_POLICY.minLength} characters.`);
  }
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Must be at most ${PASSWORD_POLICY.maxLength} characters.`);
  }
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Must include an uppercase letter.");
  }
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Must include a lowercase letter.");
  }
  if (PASSWORD_POLICY.requireDigit && !/[0-9]/.test(password)) {
    errors.push("Must include a number.");
  }
  if (PASSWORD_POLICY.requireSymbol && !SYMBOL_RE.test(password)) {
    errors.push("Must include a symbol (anything that isn't a letter or number).");
  }
  return { valid: errors.length === 0, errors };
}
