"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Shield, 
  Smartphone, 
  QrCode, 
  Key, 
  Copy, 
  Check,
  AlertTriangle,
  Loader2,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

interface TwoFactorSetupProps {
  onClose?: () => void;
}

export default function TwoFactorSetup({ onClose }: TwoFactorSetupProps) {
  const { has2FA, enableTwoFactor, disableTwoFactor } = useAuth();
  const [step, setStep] = useState<'overview' | 'setup' | 'verify' | 'backup'>('overview');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleSetup = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup' })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Setup failed');
      }
      
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setStep('setup');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'verify', 
          token: verificationCode,
          secret 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
      
      setStep('backup');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'disable', 
          token: verificationCode 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Disable failed');
      }
      
      await disableTwoFactor();
      onClose?.();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    try {
      const codesText = backupCodes.join('\n');
      await navigator.clipboard.writeText(codesText);
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch (error) {
      console.error('Failed to copy backup codes:', error);
    }
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taptap-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-black/90 border border-white/20 rounded-2xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-white/60">
            {has2FA ? 'Manage your 2FA settings' : 'Add an extra layer of security'}
          </p>
        </div>

        {/* Overview Step */}
        {step === 'overview' && (
          <div className="space-y-6">
            {!has2FA ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Shield size={20} className="text-blue-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-white mb-1">Enhanced Security</h3>
                      <p className="text-sm text-white/70">
                        Protect your account with time-based codes from your phone
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <Smartphone size={20} className="text-green-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-white mb-1">Authenticator App Required</h3>
                      <p className="text-sm text-white/70">
                        You'll need Google Authenticator, Authy, or similar app
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSetup}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin" size={18} />}
                  Enable Two-Factor Authentication
                </button>
              </>
            ) : (
              <>
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                  <Check size={24} className="text-green-400 mx-auto mb-2" />
                  <p className="text-green-300 font-medium">2FA is currently enabled</p>
                  <p className="text-sm text-white/70 mt-1">
                    Your account is protected with two-factor authentication
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code to disable"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:border-red-300 focus:outline-none text-center"
                    maxLength={6}
                  />
                  
                  <button
                    onClick={handleDisable}
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="animate-spin" size={18} />}
                    Disable Two-Factor Authentication
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Setup Step */}
        {step === 'setup' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="font-medium text-white mb-2">Scan QR Code</h3>
              <p className="text-sm text-white/70 mb-4">
                Open your authenticator app and scan this QR code
              </p>
              
              {qrCode && (
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-white">Manual Entry</h4>
              <p className="text-sm text-white/70">
                Can't scan? Enter this code manually:
              </p>
              <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg">
                <code className="flex-1 text-sm font-mono text-white break-all">
                  {secret}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(secret)}
                  className="p-2 hover:bg-white/10 rounded transition-colors"
                >
                  <Copy size={16} className="text-white/60" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              I've Added the Code
            </button>
          </div>
        )}

        {/* Verify Step */}
        {step === 'verify' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="font-medium text-white mb-2">Verify Setup</h3>
              <p className="text-sm text-white/70">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="000000"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:border-blue-300 focus:outline-none text-center text-2xl tracking-widest"
                maxLength={6}
              />

              <button
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={18} />}
                Verify and Enable
              </button>
            </div>
          </div>
        )}

        {/* Backup Codes Step */}
        {step === 'backup' && (
          <div className="space-y-6">
            <div className="text-center">
              <Check size={32} className="text-green-400 mx-auto mb-4" />
              <h3 className="font-medium text-white mb-2">2FA Enabled Successfully!</h3>
              <p className="text-sm text-white/70">
                Save these backup codes in a safe place
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">Backup Codes</h4>
                <button
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                >
                  {showBackupCodes ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showBackupCodes ? 'Hide' : 'Show'}
                </button>
              </div>

              {showBackupCodes && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="font-mono text-sm text-white bg-black/30 p-2 rounded">
                        {code}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={copyBackupCodes}
                      className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm transition-colors"
                    >
                      {copiedCodes ? <Check size={16} /> : <Copy size={16} />}
                      {copiedCodes ? 'Copied!' : 'Copy All'}
                    </button>
                    
                    <button
                      onClick={downloadBackupCodes}
                      className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm transition-colors"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>
              )}

              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-400 mt-0.5" />
                  <div className="text-sm text-red-300">
                    <p className="font-medium mb-1">Important:</p>
                    <p>Store these codes safely. You'll need them if you lose access to your authenticator app.</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                enableTwoFactor();
                onClose?.();
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Complete Setup
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </div>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
