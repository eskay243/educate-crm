import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { BrandLogo } from '../components/common/BrandLogo';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useCRM();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getPasswordStrength = () => {
    if (!password) return { text: 'Empty', color: 'bg-outline-variant', width: '0%' };
    if (password.length < 6) return { text: 'Weak', color: 'bg-error', width: '33%' };
    if (password.length < 10) return { text: 'Medium', color: 'bg-[#ca8a04]', width: '66%' };
    return { text: 'Strong', color: 'bg-[#166534]', width: '100%' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter all required credentials.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Update staff password in localStorage / mock
      const existing = localStorage.getItem('nexus_clean_prod_staff_v1');
      if (existing) {
        try {
          const users = JSON.parse(existing);
          const updated = users.map((u: any) => u.email === email ? { ...u, password } : u);
          localStorage.setItem('nexus_clean_prod_staff_v1', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to update credentials:', e);
        }
      }
      setIsLoading(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
      {/* Background Brand Pattern */}
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-8 space-y-6 animate-in fade-in duration-300">
        
        {/* Header Branding */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <BrandLogo size="md" logoUrl={settings.logoUrl} className="justify-center" />
          <h1 className="font-headline-lg text-2xl font-bold text-on-surface mt-2">
            {tokenParam ? 'Set Your Password' : 'Reset Account Password'}
          </h1>
          <p className="font-body-sm text-xs text-secondary max-w-xs mx-auto">
            Configure secure credentials for your CODELAB EDUCARE LTD staff and operations account.
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
                placeholder="name@codelab.institute"
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

            {errorMessage && (
              <div className="p-2.5 bg-error-container/20 border border-error/30 rounded text-xs text-error font-medium">
                {errorMessage}
              </div>
            )}

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
        CODELAB EDUCARE LTD SECURITY &amp; ACCESS CONTROL • LAGOS, NIGERIA
      </p>
    </div>
  );
};
