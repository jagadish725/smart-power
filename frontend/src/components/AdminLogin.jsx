import React, { useState } from 'react';
import { Shield, Lock, Key, User, Cpu, AlertTriangle, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authStep, setAuthStep] = useState('idle');

  const handleLogin = (e) => {
    e?.preventDefault();
    setError('');

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('Please enter both Username and Password.');
      return;
    }

    setIsLoading(true);
    setAuthStep('verifying');

    setTimeout(() => {
      if (
        (trimmedUser === 'admin' && trimmedPass === 'admin123') ||
        (trimmedUser === 'examiner' && trimmedPass === 'viva2026') ||
        (trimmedUser === 'operator' && trimmedPass === 'power123')
      ) {
        setAuthStep('granted');
        setTimeout(() => {
          sessionStorage.setItem('scada_admin_auth', 'true');
          sessionStorage.setItem('scada_operator_id', username.trim().toUpperCase());
          if (rememberMe) {
            localStorage.setItem('scada_admin_auth', 'true');
            localStorage.setItem('scada_operator_id', username.trim().toUpperCase());
          }
          onLoginSuccess(username.trim().toUpperCase());
        }, 500);
      } else {
        setIsLoading(false);
        setAuthStep('idle');
        setError('Invalid username or password. Please try again.');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center items-center px-4 py-6 sm:p-6 relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-black">
      {/* Background Grid & Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F172A_1px,transparent_1px),linear-gradient(to_bottom,#0F172A_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] sm:bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 sm:w-96 sm:h-96 bg-cyan-600/15 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 sm:w-96 sm:h-96 bg-blue-600/15 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-sm sm:max-w-md relative z-10 my-auto">

        {/* Card */}
        <div className="bg-[#0B132B]/95 border border-[#1E2E4A] rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.8)] backdrop-blur-xl p-6 sm:p-8 relative overflow-hidden">
          
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-90" />

          {/* Header */}
          <div className="text-center mb-6 sm:mb-7">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-b from-cyan-500/20 to-blue-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.3)] mb-3">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
            </div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white uppercase">
              Smart Power Optimization
            </h1>
            <p className="text-[11px] sm:text-xs font-mono text-cyan-400 tracking-wide mt-1">
              AI-Powered Energy Management System
            </p>
            <p className="mt-2.5 text-[11px] font-mono text-slate-400">
              Sign in to access the control dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username Field */}
            <div>
              <label className="block text-[11px] sm:text-xs font-mono font-medium text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Username</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                autoCapitalize="none"
                className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-900/90 border border-[#1E2E4A] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg text-sm font-mono text-slate-100 placeholder:text-slate-600 transition-all outline-none"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] sm:text-xs font-mono font-medium text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 sm:py-3 pr-10 bg-slate-900/90 border border-[#1E2E4A] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg text-sm font-mono text-slate-100 placeholder:text-slate-600 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-0.5">
              <label className="flex items-center space-x-2 text-[11px] sm:text-xs font-mono text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#1E2E4A] bg-slate-900 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0 w-3.5 h-3.5"
                />
                <span>Keep me signed in</span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="p-2.5 sm:p-3 rounded-lg bg-rose-950/60 border border-rose-500/60 flex items-center space-x-2 text-xs text-rose-300 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 sm:py-3.5 px-4 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 border shadow-lg ${
                authStep === 'granted'
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-[0.98]'
              } ${isLoading ? 'opacity-90 cursor-wait' : ''}`}
            >
              {authStep === 'verifying' ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>SIGNING IN...</span>
                </>
              ) : authStep === 'granted' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>ACCESS GRANTED</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>SIGN IN</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center text-[10px] font-mono text-slate-600">
          <div>Smart Power Optimization System &copy; 2026</div>
        </div>
      </div>
    </div>
  );
}
