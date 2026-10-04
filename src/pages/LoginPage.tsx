import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { demoUsers } from '../data/mockData';
import { UserRole } from '../types/crm';
import { BrandLogo } from '../components/common/BrandLogo';
import { usePWA } from '../context/PWAContext';

const VALID_ROLES: UserRole[] = ['super_admin', 'student', 'admissions', 'mentor', 'finance', 'program_officer'];

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  super_admin: 'Super Admin / Managing Director',
  student: 'Enrolled Scholar / Student',
  admissions: 'Admissions Officer',
  mentor: 'Faculty Mentor & Instructor',
  finance: 'Finance Officer & Bursar',
  program_officer: 'Program Officer & Curriculum Lead',
};

const ROLE_SHORT_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  student: 'Student',
  admissions: 'Admissions',
  mentor: 'Faculty Mentor',
  finance: 'Finance',
  program_officer: 'Program Officer',
};

export const LoginPage: React.FC = () => {
  const { login, settings, staffUsers, mentors, students } = useCRM();
  const { isStandalone, isIOS, promptInstall, setShowIOSInstallGuide } = usePWA();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const handleInstallPWA = async () => {
    if (isIOS) {
      setShowIOSInstallGuide(true);
    } else {
      await promptInstall();
    }
  };

  const queryRole = searchParams.get('role') as UserRole | null;
  const queryEmail = searchParams.get('email') || '';

  // Initialize selected role safely: respect query param if valid, otherwise default to 'student' (safest role)
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    if (queryRole && VALID_ROLES.includes(queryRole)) {
      return queryRole;
    }
    return 'student';
  });

  // Never hardcode pre-filled Super Admin credentials
  const [email, setEmail] = useState<string>(queryEmail);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state if query params change
  useEffect(() => {
    if (queryRole && VALID_ROLES.includes(queryRole)) {
      setSelectedRole(queryRole);
    }
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, [queryRole, queryEmail]);

  // Intelligent auto-detection of role based on email input
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errorMessage) setErrorMessage('');
    const norm = val.trim().toLowerCase();
    if (!norm) return;

    // 0. Super Admin Aliases
    if (
      norm === 'admin@codelab.institute' || 
      norm === 'superadmin@codelab.institute' || 
      norm === 'abiola.adefowope@codelab.institute' ||
      norm.startsWith('superadmin') ||
      norm === 'admin'
    ) {
      setSelectedRole('super_admin');
      return;
    }

    // 1. Check if matches a registered staff member
    const staffMatch = staffUsers?.find(u => u.email.toLowerCase() === norm);
    if (staffMatch?.role && VALID_ROLES.includes(staffMatch.role)) {
      setSelectedRole(staffMatch.role);
      return;
    }

    // 2. Check if matches a registered mentor
    const mentorMatch = mentors?.find(m => m.email.toLowerCase() === norm);
    if (mentorMatch) {
      setSelectedRole('mentor');
      return;
    }

    // 3. Check if matches an enrolled student
    const studentMatch = students?.find(s => s.email.toLowerCase() === norm);
    if (studentMatch) {
      setSelectedRole('student');
      return;
    }

    // 4. Check demo users
    const demoMatch = demoUsers.find(u => u.email.toLowerCase() === norm);
    if (demoMatch?.role && VALID_ROLES.includes(demoMatch.role)) {
      setSelectedRole(demoMatch.role);
      return;
    }
  };

  const handleFillSuperAdminDemo = () => {
    setSelectedRole('super_admin');
    setEmail('abiola.adefowope@codelab.institute');
    setPassword('password123');
    setErrorMessage('');
  };

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(selectedRole, email, password);
      if (!result.success) {
        setErrorMessage(result.message || 'Invalid credentials. Please verify your email and password.');
        setIsSubmitting(false);
        return;
      }
      
      const authenticatedRole = result.user?.role || selectedRole;
      let target = from === '/' ? '/' : from;
      if (from === '/') {
        if (authenticatedRole === 'student') target = '/student/dashboard';
        else if (authenticatedRole === 'program_officer') target = '/courses';
        else if (authenticatedRole === 'admissions') target = '/leads';
        else if (authenticatedRole === 'finance') target = '/expenses';
        else if (authenticatedRole === 'mentor') target = '/mentors';
        else target = '/';
      }
      navigate(target, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
      setIsSubmitting(false);
    }
  };

  const isRoleSpecifiedInUrl = !!queryRole;

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-canvas p-4 sm:p-margin-page">
      <div className="w-full max-w-lg space-y-6">
        {/* Institution Brand Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <BrandLogo size="lg" logoUrl={settings.logoUrl} className="justify-center" />
          <h1 className="font-headline-lg text-xl font-bold text-crisp-black tracking-tight mt-2">
            {settings.instituteName}
          </h1>
          <p className="font-sans text-xs text-on-surface-variant">
            Enterprise Operations &amp; Academic Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-border-subtle rounded-xl shadow-modal p-8 space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-base font-bold text-on-surface">Institutional Portal Sign In</h2>
              {isRoleSpecifiedInUrl && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-[11px] border border-primary/20">
                  {ROLE_SHORT_LABELS[selectedRole]} Portal
                </span>
              )}
            </div>
            <p className="font-body-sm text-xs text-secondary mt-0.5">
              Enter your institutional credentials to authenticate into your assigned workspace.
            </p>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3.5 bg-[#FEE2E2] border border-error/30 rounded-xl flex items-center gap-2.5 text-xs text-[#991B1B] animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-[#991B1B] text-[20px] shrink-0">error</span>
              <span className="font-semibold leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Invitation / Role Specific Welcome Notice if routed with parameters */}
          {(queryRole || queryEmail) && !errorMessage && (
            <div className="p-3 bg-secondary-container/30 border border-secondary-container rounded-lg flex items-center gap-2.5 text-xs text-on-surface animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
              <div className="leading-tight">
                <span className="font-semibold text-primary">{ROLE_SHORT_LABELS[selectedRole]} Sign In Link</span>
                <p className="text-[11px] text-secondary mt-0.5">
                  Signing in with institutional role <strong>{ROLE_DISPLAY_NAMES[selectedRole]}</strong>
                  {email && <span> for <strong>{email}</strong></span>}.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Institutional Role / Portal</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as UserRole)}
                className="w-full h-11 px-3 rounded bg-surface border border-outline-variant text-sm font-body-md focus:border-primary outline-none cursor-pointer"
              >
                <option value="student">🎓 Enrolled Scholar / Student</option>
                <option value="mentor">💼 Faculty Mentor &amp; Instructor</option>
                <option value="admissions">📋 Admissions &amp; Enrollments Officer</option>
                <option value="finance">💰 Finance &amp; Bursary Officer</option>
                <option value="program_officer">📋 Program Officer &amp; Curriculum Lead</option>
                <option value="super_admin">🛡️ Super Admin / Managing Director</option>
              </select>
            </div>

            {selectedRole === 'super_admin' && (
              <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-on-surface min-w-0">
                  <span className="material-symbols-outlined text-primary text-[18px] shrink-0">admin_panel_settings</span>
                  <div className="text-[11px] leading-tight truncate">
                    <span className="font-semibold text-primary">Super Admin Identity:</span> <span className="font-mono text-on-surface">abiola.adefowope@codelab.institute</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFillSuperAdminDemo}
                  className="px-2.5 py-1 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded transition-colors shrink-0 cursor-pointer ml-2"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Institutional Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  placeholder="e.g. name@codelab.institute or personal email"
                  className="w-full h-11 pl-9 pr-3 rounded bg-surface border border-outline-variant text-sm font-body-md focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-xs text-secondary font-semibold">Access Password</label>
                <button
                  type="button"
                  onClick={() => navigate(`/reset-password?role=${encodeURIComponent(selectedRole)}&email=${encodeURIComponent(email)}`)}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Forgot / Reset Password?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Enter your account password"
                  className="w-full h-11 pl-9 pr-10 rounded bg-surface border border-outline-variant text-sm font-body-md focus:border-primary outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-primary text-on-primary rounded font-label-md text-xs font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to {ROLE_SHORT_LABELS[selectedRole]} Portal</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </>
              )}
            </button>

            {/* Mobile PWA Quick Install Action */}
            {!isStandalone && (
              <button
                type="button"
                onClick={handleInstallPWA}
                className="w-full h-9 rounded border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">install_mobile</span>
                <span>Add Nexus CRM App to Home Screen</span>
              </button>
            )}
          </form>

          {/* Institutional Security Notice */}
          <div className="pt-4 border-t border-outline-variant/60 text-center space-y-1">
            <p className="text-[11px] text-secondary flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-outline">lock</span>
              <span>Enterprise Single Sign-On &amp; Role-Based Institutional Access Control</span>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-secondary">
          CODELAB EDUCARE LTD • Victoria Island Financial District &amp; Yaba Innovation Campus • RC-1849201
        </p>
      </div>
    </div>
  );
};
