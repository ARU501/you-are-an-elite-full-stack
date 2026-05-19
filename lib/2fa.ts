import { generateSecret, totp, authenticator } from 'speakeasy';
import QRCode from 'qrcode';

export interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  manualEntry: string;
}

export interface VerifyTokenResult {
  valid: boolean;
  remainingBackupCodes?: number;
}

/**
 * Generate a new 2FA secret with QR code
 * @param email User email for the authenticator app
 * @param appName Name of your application
 * @returns Object containing secret, QR code, and manual entry string
 */
export async function generateTwoFactorSecret(
  email: string,
  appName: string = 'LandlordForge'
): Promise<TwoFactorSecret> {
  const secret = generateSecret({
    name: `${appName} (${email})`,
    issuer: appName,
    length: 32,
  });

  if (!secret.otpauth_url) {
    throw new Error('Failed to generate OTP auth URL');
  }

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32!,
    qrCode,
    manualEntry: secret.base32!,
  };
}

/**
 * Verify a TOTP token
 * @param secret The base32 encoded secret
 * @param token The 6-digit code from authenticator app
 * @param window Time window tolerance in 30-second intervals (default: 2)
 * @returns Whether the token is valid
 */
export function verifyTwoFactorToken(
  secret: string,
  token: string,
  window: number = 2
): boolean {
  try {
    // Remove any spaces or hyphens from token
    const cleanToken = token.replace(/[\s-]/g, '');

    const verified = authenticator.verify({
      secret,
      encoding: 'base32',
      token: cleanToken,
      window,
    });

    return verified;
  } catch (error) {
    console.error('Error verifying 2FA token:', error);
    return false;
  }
}

/**
 * Generate backup codes for account recovery
 * @returns Array of 10 backup codes
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // Generate random 8-character codes
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Verify a backup code
 * @param backupCodes Array of backup codes
 * @param code Code to verify
 * @param usedCodes Set of already used backup codes
 * @returns Object with validity and remaining codes
 */
export function verifyBackupCode(
  backupCodes: string[],
  code: string,
  usedCodes: Set<string> = new Set()
): { valid: boolean; usedCodes: Set<string> } {
  const cleanCode = code.replace(/[\s-]/g, '').toUpperCase();

  if (backupCodes.includes(cleanCode) && !usedCodes.has(cleanCode)) {
    usedCodes.add(cleanCode);
    return {
      valid: true,
      usedCodes,
    };
  }

  return {
    valid: false,
    usedCodes,
  };
}

/**
 * Format backup codes for display
 * @param codes Array of backup codes
 * @returns Formatted string for display
 */
export function formatBackupCodes(codes: string[]): string {
  return codes.map((code, index) => `${index + 1}. ${code.slice(0, 4)}-${code.slice(4)}`).join('\n');
}
