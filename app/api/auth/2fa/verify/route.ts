import { NextRequest, NextResponse } from 'next/server';
import { verifyTwoFactorToken, verifyBackupCode } from '@/lib/2fa';

interface VerifyRequest {
  secret?: string;
  token?: string;
  code?: string;
  method?: 'totp' | 'backup';
  isSetup?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();
    const { secret, token, code, method = 'totp', isSetup = false } = body;

    // Validation
    if (!secret && !isSetup) {
      return NextResponse.json(
        { error: 'Secret is required' },
        { status: 400 }
      );
    }

    // For setup phase, only verify token
    if (isSetup) {
      if (!token) {
        return NextResponse.json(
          { error: 'Token is required' },
          { status: 400 }
        );
      }

      const isValid = verifyTwoFactorToken(secret!, token);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { valid: true, message: '2FA setup verified successfully' },
        { status: 200 }
      );
    }

    // For login phase, verify either TOTP or backup code
    if (method === 'totp') {
      if (!token) {
        return NextResponse.json(
          { error: 'Token is required' },
          { status: 400 }
        );
      }

      // Note: In production, you would fetch the user's secret from database
      const isValid = verifyTwoFactorToken(secret!, token);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { valid: true, message: 'Verified successfully' },
        { status: 200 }
      );
    }

    if (method === 'backup') {
      if (!code) {
        return NextResponse.json(
          { error: 'Backup code is required' },
          { status: 400 }
        );
      }

      // Note: In production, you would fetch backup codes from database
      const backupCodes: string[] = []; // Fetch from database
      const usedCodes = new Set<string>(); // Fetch from database

      const result = verifyBackupCode(backupCodes, code, usedCodes);

      if (!result.valid) {
        return NextResponse.json(
          { error: 'Invalid backup code' },
          { status: 401 }
        );
      }

      // Note: In production, you would update used codes in database

      return NextResponse.json(
        {
          valid: true,
          message: 'Verified with backup code',
          remainingBackupCodes: backupCodes.length - usedCodes.size,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid method' },
      { status: 400 }
    );
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify 2FA' },
      { status: 500 }
    );
  }
}
