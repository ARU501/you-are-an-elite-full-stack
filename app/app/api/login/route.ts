import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Verify credentials with your database
    // This is pseudocode - replace with your actual authentication
    const user = await verifyUserCredentials(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        twoFactorEnabled: user.twoFactorEnabled, // Important!
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

// Helper function - implement with your database
async function verifyUserCredentials(email: string, password: string) {
  // TODO: Replace with your actual database query
  // Example with Prisma:
  // const user = await db.user.findUnique({ where: { email } });
  // const isPasswordValid = await comparePasswords(password, user.passwordHash);
  // return isPasswordValid ? user : null;
}
