import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useCRM();

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || 'valid-token';

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simple password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { text: 'Empty', color: 'bg-outline-variant', width: '0%' };
    if (password.length < 6) return { text: 'Weak', color: 'bg-error', width: '33%' };
    if (password.length < 10) return { text: 'Medium', color: 'bg-[#ca8a04]', width: '66%' };
    return { text: 'Strong', color: 'bg-[#166534]', width: '100%' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      showToast('Error', 'Please enter a valid password.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Mismatch', 'Passwords do not match.', 'error');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      showToast('Password Updated', 'Your institutional account password has been set successfully!', 'success');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      {/* Background Brand Pattern */}
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-8 space-y-6 animate-in fade-in duration-300">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white shadow-md mb-2">
            <span className="material-symbols-outlined text-[28px]">lock_reset</span>
          </div>
          <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
            {tokenParam ? 'Set Your Password' : 'Reset Account Password'}
          </h1>
          <p className="font-body-sm text-xs text-secondary max-w-xs mx-auto">
            Configure secure credentials for your Nexus Institute staff and operations account.
          </p>
        </div>

        {isSubmitted ? (
          <div className="text-center space-y-4 py-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#dcfce7] text-[#166534] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">check_circle</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-headline-md text-base font-bold text-on-surface">Password Configured!</h3>
              <p className="text-xs text-secondary">Your new password is now active. You can proceed to sign in.</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Go to Sign In</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">
                Institutional Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@nexus-institute.ng"
                className="w-full h-10 px-3 rounded bg-surface-container-low border border-outline-variant text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password (min. 8 chars)"
                  className="w-full h-10 pl-3 pr-10 rounded bg-surface-container-low border border-outline-variant text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface p-0.5"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Password strength bar */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${strength.color} transition-all duration-300`} 
                      style={{ width: strength.width }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-secondary font-data-tabular">
                    <span>Strength: {strength.text}</span>
                    <span>Min. 8 characters</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className={`w-full h-10 px-3 rounded bg-surface-container-low border text-sm focus:ring-1 outline-none transition-all ${
                  confirmPassword && confirmPassword !== password 
                    ? 'border-error focus:border-error focus:ring-error' 
                    : 'border-outline-variant focus:border-primary focus:ring-primary'
                }`}
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[11px] text-error font-medium mt-1">Passwords do not match.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving Credentials...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">key</span>
                  <span>Save Password &amp; Activate</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-outline-variant/60 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-semibold text-primary hover:underline"
          >
            ← Return to Sign In
          </button>
        </div>
      </div>

      <p className="font-data-tabular text-[11px] text-secondary mt-6">
        NEXUS INSTITUTE SECURITY &amp; ACCESS CONTROL • LAGOS, NIGERIA
      </p>
    </div>
  );
};
