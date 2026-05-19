import { NextRequest, NextResponse } from 'next/server';
import { generateTwoFactorSecret, generateBackupCodes } from '@/lib/2fa';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { secret, qrCode, manualEntry } = await generateTwoFactorSecret(email);
    const backupCodes = generateBackupCodes();

    return NextResponse.json(
      {
        secret,
        qrCode,
        manualEntry,
        backupCodes,
        message: 'Successfully generated 2FA secret',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate 2FA secret' },
      { status: 500 }
    );
  }
}
