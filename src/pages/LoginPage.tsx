import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { demoUsers } from '../data/mockData';
import { UserRole } from '../types/crm';

export const LoginPage: React.FC = () => {
  const { login, settings } = useCRM();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const [email, setEmail] = useState('abiola@nexus-institute.ng');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole, email);
    navigate(from, { replace: true });
  };

  const handleQuickLogin = (role: UserRole) => {
    login(role);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-surface-container-low p-4 sm:p-margin-page">
      <div className="w-full max-w-lg space-y-6">
        {/* Institution Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center mx-auto shadow-md">
            <span className="material-symbols-outlined text-[32px]">domain</span>
          </div>
          <h1 className="font-headline-lg text-2xl font-bold text-on-surface tracking-tight">
            {settings.instituteName}
          </h1>
          <p className="font-body-md text-xs text-secondary">
            Edu-Business Operations &amp; Academic Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <h2 className="font-headline-md text-base font-bold text-on-surface">Institutional Staff Sign In</h2>
            <p className="font-body-sm text-xs text-secondary mt-0.5">Enter your institutional credentials or choose a pre-configured role.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Institutional Role</label>
              <select
                value={selectedRole}
                onChange={e => {
                  const r = e.target.value as UserRole;
                  setSelectedRole(r);
                  if (r === 'super_admin') setEmail('abiola@nexus-institute.ng');
                  else if (r === 'admissions') setEmail('folake@nexus-institute.ng');
                  else if (r === 'mentor') setEmail('a.pendelton@nexus-institute.ng');
                  else if (r === 'finance') setEmail('daniels@nexus-institute.ng');
                }}
                className="w-full h-11 px-3 rounded bg-surface border border-outline-variant text-sm font-body-md focus:border-primary outline-none cursor-pointer"
              >
                <option value="super_admin">Super Admin / Managing Director</option>
                <option value="admissions">Admissions Officer</option>
                <option value="mentor">Faculty Mentor</option>
                <option value="finance">Finance Officer / Accountant</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Institutional Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@nexus-institute.ng"
                  className="w-full h-11 pl-9 pr-3 rounded bg-surface border border-outline-variant text-sm font-body-md focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-label-md text-xs text-secondary font-semibold">Access Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  lock
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-11 pl-9 pr-3 rounded bg-surface border border-outline-variant text-sm font-body-md focus:border-primary outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-primary text-on-primary rounded font-label-md text-xs font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <span>Sign In to Workspace</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </form>

          {/* Quick Persona Switcher for Verification */}
          <div className="pt-4 border-t border-outline-variant space-y-3">
            <p className="font-label-md text-xs text-secondary font-semibold uppercase tracking-wider text-center">
              1-Click Demo Persona Sign In
            </p>

            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickLogin(user.role)}
                  className="p-2.5 rounded-lg border border-outline-variant bg-surface hover:border-primary hover:bg-surface-container-high transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-[10px]">
                      {user.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-bold text-xs text-on-surface truncate group-hover:text-primary">
                      {user.name.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-[10px] text-secondary truncate font-medium">
                    {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admissions' ? 'Admissions' : user.role === 'mentor' ? 'Faculty Mentor' : 'Finance'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-secondary">
          Nexus Institute • Victoria Island &amp; Abuja Campus Operations • RC-1849201
        </p>
      </div>
    </div>
  );
};
