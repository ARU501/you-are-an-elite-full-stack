# Two-Factor Authentication (2FA) Implementation Guide

This guide explains how to integrate the 2FA system into your LandlordForge application.

## Overview

The 2FA system provides:
- **TOTP (Time-based One-Time Password)** support with authenticator apps
- **Backup codes** for account recovery
- **QR code generation** for easy setup
- **TypeScript** type safety throughout

## Components

### 1. Core Library (`lib/2fa.ts`)

Utility functions for 2FA operations:

```typescript
// Generate a new secret with QR code
const { secret, qrCode, manualEntry } = await generateTwoFactorSecret(
  'user@example.com',
  'LandlordForge'
);

// Verify a TOTP token
const isValid = verifyTwoFactorToken(secret, '123456');

// Generate backup codes
const codes = generateBackupCodes(); // Returns 10 codes

// Verify a backup code
const result = verifyBackupCode(codes, 'ABCD1234', usedCodes);
```

### 2. Setup Component (`components/auth/two-factor-setup.tsx`)

A complete 4-step wizard for enabling 2FA:

```tsx
import { TwoFactorSetup } from '@/components/auth/two-factor-setup';

<TwoFactorSetup
  email={user.email}
  onSetupComplete={(secret, backupCodes) => {
    // Save secret to database
    // Display backup codes to user
    console.log('Secret:', secret);
    console.log('Backup codes:', backupCodes);
  }}
/>
```

**Steps:**
1. Introduction - Explains what 2FA is
2. QR Code - Display QR code and manual entry option
3. Verify - User enters 6-digit code from authenticator
4. Backup - Display and save backup codes

### 3. Verify Component (`components/auth/two-factor-verify.tsx`)

A tabbed component for verifying 2FA during login:

```tsx
import { TwoFactorVerify } from '@/components/auth/two-factor-verify';

<TwoFactorVerify
  onVerified={(method) => {
    // method is either 'totp' or 'backup'
    console.log('Verified with:', method);
    // Complete login process
  }}
  onCancel={() => {
    // User cancelled
  }}
/>
```

**Features:**
- Tab for TOTP code entry (6 digits)
- Tab for backup code entry
- Real-time validation
- Error messages

### 4. State Management (`store/auth.ts`)

Zustand store for managing auth state:

```tsx
import { useAuthStore } from '@/store/auth';

const { twoFactorEnabled, enableTwoFactor, disableTwoFactor } = useAuthStore();

// Enable 2FA
enableTwoFactor(secret);

// Disable 2FA
disableTwoFactor();

// Track used backup codes
addUsedBackupCode('CODE1234');
```

## API Endpoints

### POST `/api/auth/2fa/setup`

Generate a new 2FA secret with QR code and backup codes.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qrCode": "data:image/png;base64,...",
  "manualEntry": "JBSWY3DPEBLW64TMMQ======",
  "backupCodes": ["CODE1", "CODE2", ...]
}
```

### POST `/api/auth/2fa/verify`

Verify a TOTP token or backup code.

**Request (TOTP):**
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "token": "123456",
  "method": "totp",
  "isSetup": false
}
```

**Request (Backup Code):**
```json
{
  "code": "ABCD1234",
  "method": "backup"
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Verified successfully"
}
```

## Integration Steps

### 1. Update User Schema

Add these fields to your user database schema:

```typescript
interface User {
  id: string;
  email: string;
  // ... other fields
  twoFactorSecret?: string; // Store encrypted
  twoFactorEnabled: boolean;
  backupCodes: string[]; // Store encrypted
  usedBackupCodes: string[];
}
```

### 2. Setup Page

Add 2FA setup to user settings:

```tsx
// pages/settings/security.tsx
import { TwoFactorSetup } from '@/components/auth/two-factor-setup';

export default function SecuritySettings() {
  const { user } = useAuth();

  const handleSetupComplete = async (secret: string, backupCodes: string[]) => {
    // Save to database
    await fetch('/api/user/2fa', {
      method: 'PUT',
      body: JSON.stringify({
        twoFactorSecret: encryptSecret(secret),
        backupCodes: encryptBackupCodes(backupCodes),
        twoFactorEnabled: true,
      }),
    });
  };

  return (
    <div>
      <h1>Security Settings</h1>
      <TwoFactorSetup
        email={user.email}
        onSetupComplete={handleSetupComplete}
      />
    </div>
  );
}
```

### 3. Login Flow

Add 2FA verification to login:

```tsx
// pages/login.tsx
import { TwoFactorVerify } from '@/components/auth/two-factor-verify';

export default function LoginPage() {
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    // Verify credentials
    const user = await verifyCredentials(email, password);

    if (user.twoFactorEnabled) {
      setTempUserId(user.id);
      setNeedsTwoFactor(true);
      return;
    }

    // Complete login
    completeLogin(user);
  };

  const handleTwoFactorVerified = (method: 'totp' | 'backup') => {
    // Complete login after 2FA verification
    completeLogin(tempUserId);
  };

  if (needsTwoFactor) {
    return (
      <TwoFactorVerify
        onVerified={handleTwoFactorVerified}
        onCancel={() => setNeedsTwoFactor(false)}
      />
    );
  }

  return (
    // ... login form
  );
}
```

## Security Best Practices

### 1. Encrypt Secrets

**Never store unencrypted secrets in the database:**

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

function encryptSecret(secret: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptSecret(encrypted: string): string {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 2. Time Window

Allow a small time window for token verification (default is 2 intervals = 60 seconds):

```typescript
verifyTwoFactorToken(secret, token, 2); // window of 2
```

### 3. Rate Limiting

Implement rate limiting on verify endpoints:

```typescript
// Limit to 5 attempts per minute
const rateLimit = new RateLimiter({
  points: 5,
  duration: 60,
});

await rateLimit.consume(userId);
```

### 4. Backup Codes

- Generate and display only once during setup
- Store used codes to prevent reuse
- Hash backup codes before storing
- Provide "download" or "print" option for users

### 5. Recovery Options

Always provide recovery options:
- Backup codes (implemented)
- Admin account recovery
- Email-based verification
- Support contact information

## Troubleshooting

### "Invalid code" error

**Causes:**
- Wrong secret stored in database
- Time sync issues between client and server
- User entered wrong code

**Solutions:**
- Verify secret is correctly encrypted/decrypted
- Check server time is synchronized (NTP)
- Increase time window tolerance

### QR Code not scanning

**Causes:**
- QR code generation failed
- User's camera not working
- App doesn't support authenticator

**Solutions:**
- Provide manual entry option (already included)
- Test with different authenticator apps
- Check browser console for errors

### Lost authenticator device

**Solution:**
- User uses backup codes
- Admin can disable 2FA and user re-enables
- Email verification as fallback

## Dependencies

- `speakeasy` - TOTP generation and verification
- `qrcode` - QR code generation
- `zustand` - State management
- `lucide-react` - Icons (already in project)

## Testing

### Manual Testing

1. **Setup 2FA:**
   - Go to settings
   - Click "Enable 2FA"
   - Scan QR code with authenticator app
   - Enter code from app
   - Save backup codes

2. **Login with 2FA:**
   - Enter credentials
   - On 2FA screen, enter code from authenticator
   - Should complete login

3. **Backup Code:**
   - Login with credentials
   - On 2FA screen, switch to backup code tab
   - Enter one backup code
   - Should complete login

### Unit Testing

```typescript
import { verifyTwoFactorToken, generateBackupCodes } from '@/lib/2fa';

describe('2FA', () => {
  it('should verify valid TOTP token', () => {
    const secret = 'JBSWY3DPEBLW64TMMQ======';
    const token = '123456';
    const result = verifyTwoFactorToken(secret, token);
    expect(result).toBe(true);
  });

  it('should reject invalid TOTP token', () => {
    const secret = 'JBSWY3DPEBLW64TMMQ======';
    const token = '000000';
    const result = verifyTwoFactorToken(secret, token);
    expect(result).toBe(false);
  });

  it('should generate 10 backup codes', () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(10);
    expect(codes[0]).toHaveLength(8);
  });
});
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API endpoint documentation
3. Test with different authenticator apps
4. Check browser console for errors
