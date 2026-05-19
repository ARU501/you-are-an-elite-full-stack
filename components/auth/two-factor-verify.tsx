'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface TwoFactorVerifyProps {
  onVerified?: (method: 'totp' | 'backup') => void;
  onCancel?: () => void;
}

export function TwoFactorVerify({ onVerified, onCancel }: TwoFactorVerifyProps) {
  const [totpCode, setTotpCode] = useState<string>('');
  const [backupCode, setBackupCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleVerifyTOTP = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpCode, method: 'totp' }),
      });

      if (!response.ok) {
        throw new Error('Invalid code. Please try again.');
      }

      setSuccess(true);
      setTimeout(() => onVerified?.('totp'), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBackupCode = async () => {
    if (!backupCode) {
      setError('Please enter a backup code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: backupCode, method: 'backup' }),
      });

      if (!response.ok) {
        throw new Error('Invalid backup code. Please try again.');
      }

      setSuccess(true);
      setTimeout(() => onVerified?.('backup'), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 border rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Two-Factor Authentication</h2>

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded text-green-800 dark:text-green-100 text-sm">
          ✓ Verified successfully!
        </div>
      )}

      <Tabs defaultValue="totp" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="totp">Authenticator App</TabsTrigger>
          <TabsTrigger value="backup">Backup Code</TabsTrigger>
        </TabsList>

        <TabsContent value="totp" className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter the 6-digit code from your authenticator app:
          </p>
          <input
            type="text"
            placeholder="000000"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="w-full px-3 py-2 border rounded text-center text-2xl tracking-widest font-mono"
            autoFocus
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1" disabled={loading}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleVerifyTOTP}
              disabled={loading || totpCode.length !== 6}
              className="flex-1"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter one of your backup codes:
          </p>
          <input
            type="text"
            placeholder="XXXX-XXXX"
            value={backupCode}
            onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border rounded font-mono text-sm uppercase"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1" disabled={loading}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleVerifyBackupCode}
              disabled={loading || !backupCode}
              className="flex-1"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
