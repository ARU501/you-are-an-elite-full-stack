'use client';

import { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { generateTwoFactorSecret, generateBackupCodes, formatBackupCodes } from '@/lib/2fa';
import { Button } from '@/components/ui/button';

interface TwoFactorSetupProps {
  email: string;
  onSetupComplete?: (secret: string, backupCodes: string[]) => void;
}

type Step = 'intro' | 'qr' | 'verify' | 'backup';

export function TwoFactorSetup({ email, onSetupComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<Step>('intro');
  const [secret, setSecret] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const handleGenerateQR = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Failed to generate QR code');

      const data = await response.json();
      setSecret(data.secret);
      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setStep('qr');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    if (!token || token.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, token, isSetup: true }),
      });

      if (!response.ok) throw new Error('Invalid code. Please try again.');

      setStep('backup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = () => {
    onSetupComplete?.(secret, backupCodes);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 border rounded-lg space-y-6">
      <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>

      {/* Step 1: Introduction */}
      {step === 'intro' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add an extra layer of security to your account. You'll need an authenticator app like:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
              <li>Google Authenticator</li>
              <li>Authy</li>
              <li>Microsoft Authenticator</li>
              <li>1Password</li>
            </ul>
          </div>
          <Button onClick={handleGenerateQR} disabled={loading} className="w-full">
            {loading ? 'Generating...' : 'Get Started'}
          </Button>
        </div>
      )}

      {/* Step 2: QR Code */}
      {step === 'qr' && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold mb-3">Scan this QR code with your authenticator app:</p>
            {qrCode && (
              <div className="flex justify-center p-4 bg-white dark:bg-gray-800 rounded border">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Or enter this code manually:</p>
            <div className="flex gap-2">
              <code className="flex-1 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm break-all">
                {secret}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopySecret}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Button onClick={() => setStep('verify')} className="w-full">
            Next
          </Button>
        </div>
      )}

      {/* Step 3: Verify Token */}
      {step === 'verify' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter the 6-digit code from your authenticator app to verify:
          </p>
          <input
            type="text"
            placeholder="000000"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="w-full px-3 py-2 border rounded text-center text-2xl tracking-widest font-mono"
            autoFocus
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            onClick={handleVerifyToken}
            disabled={loading || token.length !== 6}
            className="w-full"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </Button>
        </div>
      )}

      {/* Step 4: Backup Codes */}
      {step === 'backup' && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold mb-2">Save your backup codes</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border space-y-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                {backupCodes.length} codes
              </span>
              <button
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {showBackupCodes ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {showBackupCodes ? (
              <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                {formatBackupCodes(backupCodes)}
              </pre>
            ) : (
              <p className="text-xs text-gray-500">Click the eye icon to reveal codes</p>
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleCopyBackupCodes}
            className="w-full"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Codes
          </Button>

          <Button onClick={handleComplete} className="w-full">
            Setup Complete
          </Button>
        </div>
      )}
    </div>
  );
}
