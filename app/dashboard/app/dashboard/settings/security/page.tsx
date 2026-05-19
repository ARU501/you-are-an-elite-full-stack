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
