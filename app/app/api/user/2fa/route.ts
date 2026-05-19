import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { twoFactorSecret, backupCodes, twoFactorEnabled } = await request.json();
    const userId = request.headers.get('x-user-id'); // Get from session/auth

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Save to database
    // Example with Prisma:
    // await db.user.update({
    //   where: { id: userId },
    //   data: {
    //     twoFactorSecret: encryptSecret(twoFactorSecret),
    //     backupCodes: encryptBackupCodes(backupCodes),
    //     twoFactorEnabled: twoFactorEnabled,
    //   },
    // });

    return NextResponse.json(
      { message: 'Two-factor authentication enabled' },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA save error:', error);
    return NextResponse.json(
      { error: 'Failed to save 2FA settings' },
      { status: 500 }
    );
  }
}
