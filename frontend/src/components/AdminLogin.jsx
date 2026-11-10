import React, { useState } from 'react';
import { Shield, Lock, Key, User, Cpu, AlertTriangle, ArrowRight, CheckCircle2, Sparkles, Terminal } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authStep, setAuthStep] = useState('idle'); // idle | verifying | granted

  const handleLogin = (e) => {
    e?.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both Operator ID and Password.');
      return;
    }

    setIsLoading(true);
    setAuthStep('verifying');

    // Simulate authenticating cryptographic handshake for professional SCADA feel
    setTimeout(() => {
      // Standard credentials for project evaluation & viva demonstration
      if (
        (username.trim().toLowerCase() === 'admin' && password.trim() === 'admin123') ||
        (username.trim().toLowerCase() === 'examiner' && password.trim() === 'viva2026') ||
        (username.trim().toLowerCase() === 'operator' && password.trim() === 'power123')
      ) {
        setAuthStep('granted');
        setTimeout(() => {
          if (rememberMe) {
            localStorage.setItem('scada_admin_auth', 'true');
            localStorage.setItem('scada_operator_id', username.trim().toUpperCase());
          } else {
            sessionStorage.setItem('scada_admin_auth', 'true');
            sessionStorage.setItem('scada_operator_id', username.trim().toUpperCase());
          }
          onLoginSuccess(username.trim().toUpperCase());
        }, 600);
      } else {
        setIsLoading(false);
        setAuthStep('idle');
        setError('Access Denied: Invalid Operator ID or Security Password.');
      }
    }, 700);
  };

  const handleQuickDemoLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-black">
      {/* Background Decorative Grid & Cyber Radial Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F172A_1px,transparent_1px),linear-gradient(to_bottom,#0F172A_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Top Node Pill */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 flex items-center space-x-2 text-xs font-mono text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-semibold tracking-wider">PWR//OPT-X1 • SCADA NODE</span>
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-[#0B132B]/95 border border-[#1E2E4A] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl p-7 sm:p-9 relative overflow-hidden">
          
          {/* Top Scanline Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

          {/* Header Title & Icon */}
          <div className="text-center mb-7">
            <div className="mx-auto w-14 h-14 rounded-xl bg-gradient-to-b from-cyan-500/20 to-blue-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.3)] mb-3">
              <Cpu className="w-7 h-7 animate-pulse text-cyan-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-sans">
              Smart Power Optimization
            </h1>
            <p className="text-xs font-mono text-cyan-400 tracking-wide mt-1">
              AI-Driven IoT SCADA Controller
            </p>
            <div className="mt-3 text-[11px] font-mono text-slate-400 flex items-center justify-center space-x-2">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Operator Authorization Gate</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Operator ID Field */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Operator Identifier</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  disabled={isLoading}
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-[#1E2E4A] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg text-sm font-mono text-slate-100 placeholder:text-slate-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>Security Access Key</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-[#1E2E4A] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg text-sm font-mono text-slate-100 placeholder:text-slate-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs font-mono text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#1E2E4A] bg-slate-900 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0 w-3.5 h-3.5"
                />
                <span>Persist Operator Session</span>
              </label>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/50 flex items-center space-x-2.5 text-xs text-rose-300 font-mono animate-shake">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit / Authenticate Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 border shadow-lg ${
                authStep === 'granted'
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-[0.99]'
              } ${isLoading ? 'opacity-90 cursor-wait' : ''}`}
            >
              {authStep === 'verifying' ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>VERIFYING CRYPTOGRAPHIC TOKEN...</span>
                </>
              ) : authStep === 'granted' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>AUTHORIZATION GRANTED — INITIALIZING SCADA...</span>
                </>
              ) : (
                <>
                  <span>UNLOCK SCADA DASHBOARD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Examiner Viva Demonstration Quick-Access Hint */}
          <div className="mt-6 pt-5 border-t border-[#1E2E4A]/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center space-x-1.5">
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>Evaluation Credentials:</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400/80">Viva / Demo Mode</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin', 'admin123')}
                className="p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition-colors group"
              >
                <div className="text-[10px] text-slate-400">Chief Engineer</div>
                <div className="font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center justify-between">
                  <span>admin</span>
                  <span className="text-[10px] text-slate-500">123</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('examiner', 'viva2026')}
                className="p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-colors group"
              >
                <div className="text-[10px] text-slate-400">Examiner / Reviewer</div>
                <div className="font-semibold text-slate-200 group-hover:text-amber-300 flex items-center justify-between">
                  <span>examiner</span>
                  <span className="text-[10px] text-slate-500">viva</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Specification Details */}
        <div className="mt-4 text-center text-[10px] font-mono text-slate-500 space-y-1">
          <div>ESP32 DevKit V1 • Dual INA219 (0x40/0x41) • Supabase Cloud DB</div>
          <div className="text-slate-600">Final Year Project • Department of Electrical / CS Engineering</div>
        </div>
      </div>
    </div>
  );
}
