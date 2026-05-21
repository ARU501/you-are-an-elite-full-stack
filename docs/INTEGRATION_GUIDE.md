# 2FA Integration Guide - Step by Step

This guide walks you through integrating 2FA into your existing login and settings flows.

## Quick Start (5 Steps)

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Add to Login Flow
In your `app/login/landlord/page.tsx` (or wherever your login form is):

```tsx
'use client';

import { useState } from 'react';
import { TwoFactorVerify } from '@/components/auth/two-factor-verify';

export default function LoginPage() {
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      // Verify credentials with your backend
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const user = await response.json();

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        setTempUserId(user.id);
        setShowTwoFactor(true); // Show 2FA component
        return;
      }

      // Complete login if no 2FA
      completeLogin(user);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleTwoFactorVerified = () => {
    // Complete login after 2FA verification
    completeLogin(tempUserId);
    setShowTwoFactor(false);
  };

  // Show 2FA component if needed
  if (showTwoFactor) {
    return (
      <TwoFactorVerify
        onVerified={handleTwoFactorVerified}
        onCancel={() => setShowTwoFactor(false)}
      />
    );
  }

  // Your existing login form
  return (
    <div>
      <h1>Login</h1>
      {/* Your login form here */}
    </div>
  );
}
```

### Step 3: Add to Settings/Profile Page
Create a new file `app/dashboard/settings/security/page.tsx`:

```tsx
'use client';

import { TwoFactorSetup } from '@/components/auth/two-factor-setup';
import { useAuth } from '@/hooks/useAuth'; // Your existing auth hook

export default function SecuritySettingsPage() {
  const { user } = useAuth();

  const handleSetupComplete = async (secret: string, backupCodes: string[]) => {
    try {
      // Save 2FA secret to database
      const response = await fetch('/api/user/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twoFactorSecret: secret,
          backupCodes: backupCodes,
          twoFactorEnabled: true,
        }),
      });

      if (response.ok) {
        alert('2FA has been successfully enabled!');
      }
    } catch (error) {
      console.error('Failed to save 2FA:', error);
      alert('Failed to enable 2FA');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Security Settings</h1>

      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication</h2>

        {user?.twoFactorEnabled ? (
          <div className="bg-green-50 dark:bg-green-900 p-4 rounded border border-green-200">
            <p className="text-green-800 dark:text-green-100">
              ✓ 2FA is enabled on your account
            </p>
          </div>
        ) : (
          <TwoFactorSetup
            email={user?.email || ''}
            onSetupComplete={handleSetupComplete}
          />
        )}
      </div>
    </div>
  );
}
```

### Step 4: Create Backend API Endpoints

Create `app/api/login/route.ts`:

```typescript
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
```

Create `app/api/user/2fa/route.ts`:

```typescript
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
```

### Step 5: Update Login Verification API
Modify `app/api/auth/2fa/verify/route.ts` to use your database:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyTwoFactorToken, verifyBackupCode } from '@/lib/2fa';

export async function POST(request: NextRequest) {
  try {
    const { token, code, method = 'totp' } = await request.json();
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    // const user = await db.user.findUnique({ where: { id: userId } });
    // if (!user?.twoFactorEnabled) {
    //   return NextResponse.json({ error: 'Invalid' }, { status: 400 });
    // }

    if (method === 'totp' && token) {
      // Verify TOTP token
      // const secret = decryptSecret(user.twoFactorSecret);
      // const isValid = verifyTwoFactorToken(secret, token);
      // if (!isValid) {
      //   return NextResponse.json(
      //     { error: 'Invalid code' },
      //     { status: 401 }
      //   );
      // }
      return NextResponse.json({ valid: true }, { status: 200 });
    }

    if (method === 'backup' && code) {
      // Verify backup code
      // const backupCodes = decryptBackupCodes(user.backupCodes);
      // const result = verifyBackupCode(backupCodes, code, new Set(user.usedBackupCodes));
      // if (!result.valid) {
      //   return NextResponse.json(
      //     { error: 'Invalid backup code' },
      //     { status: 401 }
      //   );
      // }
      // Mark code as used in database
      // await db.user.update({
      //   where: { id: userId },
      //   data: {
      //     usedBackupCodes: [...user.usedBackupCodes, code],
      //   },
      // });
      return NextResponse.json({ valid: true }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Invalid method' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
```

---

## Complete Example Flow

### Flow Diagram

```
User Login Page
    ↓
Enter Email & Password
    ↓
POST /api/login
    ↓
Check if 2FA enabled?
    ├─ YES → Show TwoFactorVerify component
    │         ↓
    │      User enters TOTP or Backup Code
    │         ↓
    │      POST /api/auth/2fa/verify
    │         ↓
    │      Valid? → Set Session Cookie → Redirect to Dashboard
    │
    └─ NO → Set Session Cookie → Redirect to Dashboard
```

### User Story Example

**First time user setting up 2FA:**

1. User goes to Settings → Security
2. Clicks "Enable 2FA"
3. TwoFactorSetup component shows:
   - Step 1: Introduction
   - Step 2: Displays QR code
   - Step 3: User scans with Google Authenticator
   - Step 4: User enters 6-digit code to verify
   - Step 5: Shows backup codes (user downloads/saves them)
4. Secret and backup codes saved to database

**User logs in with 2FA enabled:**

1. User enters email and password
2. POST /api/login returns `twoFactorEnabled: true`
3. Login page shows TwoFactorVerify component
4. User has two options:
   - Tab 1: Enter 6-digit code from authenticator app
   - Tab 2: Enter backup code if lost phone
5. After verification, user is redirected to dashboard

---

## Database Integration Example

### Using Prisma

Update your `schema.prisma`:

```prisma
model User {
  id                   String     @id @default(cuid())
  email                String     @unique
  password             String
  name                 String?
  
  // 2FA fields
  twoFactorEnabled     Boolean    @default(false)
  twoFactorSecret      String?    // Store encrypted!
  backupCodes          String?    // Store encrypted JSON array
  usedBackupCodes      String?    // Store encrypted JSON array

  createdAt            DateTime   @default(now())
  updatedAt            DateTime   @updatedAt
}
```

Run migration:
```bash
pnpm prisma migrate dev --name add_2fa
```

### Using MongoDB

Add to your User schema:

```typescript
interface User {
  _id: ObjectId;
  email: string;
  password: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string; // encrypted
  backupCodes?: string[]; // encrypted
  usedBackupCodes?: string[];
}
```

---

## Testing

### Manual Testing Checklist

- [ ] Install `pnpm install`
- [ ] Create login page with TwoFactorVerify
- [ ] Create settings page with TwoFactorSetup
- [ ] Test QR code generation
- [ ] Scan QR code with authenticator app (Google Authenticator, Authy, etc)
- [ ] Enter code to verify setup
- [ ] Save secret to database
- [ ] Log out and log back in
- [ ] Enter 2FA code at login
- [ ] Test backup code login
- [ ] Verify used backup codes can't be reused

### Test with Real Authenticators

Download one of these apps to test:
- **Google Authenticator** (iOS/Android)
- **Authy** (iOS/Android)
- **Microsoft Authenticator** (iOS/Android)
- **1Password** (iOS/Android)
- **FreeOTP** (Android)

---

## Common Issues & Fixes

### Issue: "QR Code not displaying"
```tsx
// Make sure you're using 'use client' directive
'use client';

// And import is correct
import { TwoFactorSetup } from '@/components/auth/two-factor-setup';
```

### Issue: "TOTP token always invalid"
```typescript
// Make sure you're storing and retrieving the correct secret
// Check it's not being encrypted/decrypted incorrectly
const secret = decryptSecret(user.twoFactorSecret);
const isValid = verifyTwoFactorToken(secret, token);
console.log('Secret:', secret);
console.log('Token:', token);
console.log('Valid:', isValid);
```

### Issue: "API endpoints returning 401"
```typescript
// Make sure you're passing userId in request headers
// In your client-side fetch:
fetch('/api/auth/2fa/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId, // Make sure this is set
  },
  body: JSON.stringify({ token }),
});
```

---

## Next Steps

1. **Start with the login page** - Add TwoFactorVerify after password verification
2. **Add settings page** - Add TwoFactorSetup for enabling 2FA
3. **Create database endpoints** - `/api/login` and `/api/user/2fa`
4. **Test with real authenticator app** - Download Google Authenticator
5. **Add encryption** - Use node crypto to encrypt secrets before storing
6. **Add rate limiting** - Prevent brute force attempts on verify endpoint

Need help with any specific step? Check the component code or docs/2FA_SETUP.md for more details!
