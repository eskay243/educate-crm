import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { apiService } from '../../services/api';

export const ChangePasswordModal: React.FC = () => {
  const { activeModal, closeModal, currentUser, staffUsers, showToast, logActivity } = useCRM();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (activeModal !== 'change-password' || !currentUser) return null;

  // Password strength checker
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const strengthScore = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    if (strengthScore < 2) {
      setError('Please choose a stronger password (at least 8 characters with numbers or symbols).');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find and update staff member password
      const user = staffUsers.find(u => u.id === currentUser.id || u.email === currentUser.email);
      if (user) {
        user.password = newPassword;
      }
      currentUser.password = newPassword;

      await apiService.resetPassword(currentUser.email, newPassword);

      showToast('Password Updated', 'Your security credentials have been updated successfully.', 'success');
      logActivity({
        title: 'Security Password Changed',
        description: `Account password was updated for ${currentUser.name}.`,
        type: 'system',
        user: currentUser.name,
      });

      closeModal();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="flex justify-between items-start border-b border-outline-variant pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">lock_reset</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">Change Password</h3>
              <p className="text-xs text-secondary">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-8 h-8 rounded-full hover:bg-surface-container text-secondary flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-error text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Current Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter existing password"
              className="w-full h-9 px-3 rounded bg-surface border border-outline-variant text-xs outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">New Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
              className="w-full h-9 px-3 rounded bg-surface border border-outline-variant text-xs outline-none focus:border-primary"
            />
          </div>

          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="space-y-1.5 p-2.5 rounded-lg bg-surface border border-outline-variant/60 text-[11px]">
              <div className="flex justify-between items-center font-medium">
                <span className="text-secondary">Password Strength:</span>
                <span className={`font-bold ${
                  strengthScore <= 1 ? 'text-error' : strengthScore === 2 ? 'text-[#ca8a04]' : 'text-[#166534]'
                }`}>
                  {strengthScore <= 1 ? 'Weak' : strengthScore === 2 ? 'Medium' : strengthScore === 3 ? 'Strong' : 'Very Strong'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden flex gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full flex-1 transition-all ${
                      strengthScore >= step
                        ? strengthScore <= 1
                          ? 'bg-error'
                          : strengthScore === 2
                          ? 'bg-[#ca8a04]'
                          : 'bg-[#166534]'
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Confirm New Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full h-9 px-3 rounded bg-surface border border-outline-variant text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPass}
                onChange={(e) => setShowPass(e.target.checked)}
                className="rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span>Show password text</span>
            </label>
          </div>

          <div className="flex gap-2 pt-2 border-t border-outline-variant">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 h-9 rounded-lg bg-surface hover:bg-surface-container border border-outline-variant text-xs font-bold text-on-surface transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-9 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{isSubmitting ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
