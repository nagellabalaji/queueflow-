import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  initiateGoogleLogin, 
  getGoogleClientId, 
  setGoogleClientId, 
  isGoogleOAuthConfigured 
} from '../services/googleAuth';
import { 
  Layers, 
  Lock, 
  User, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Building2, 
  Clock, 
  Radio, 
  ShieldCheck, 
  X,
  HelpCircle,
  Settings,
  Copy,
  Check,
  ExternalLink,
  KeyRound
} from 'lucide-react';

export default function LoginModal() {
  const { login, register, demoLogin, loginWithGoogle } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showGoogleConfigModal, setShowGoogleConfigModal] = useState(false);
  const [configClientIdInput, setConfigClientIdInput] = useState(() => getGoogleClientId() || '');
  const [copiedField, setCopiedField] = useState(null);
  const [configError, setConfigError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setError('Full name is required.');
        return;
      }
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters long.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register(username.trim(), password, name.trim());
      } else {
        await login(username.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setUsername('admin');
    setPassword('admin123');
    setLoading(true);
    try {
      await login('admin', 'admin123');
    } catch (err) {
      setError(err.message || 'Demo authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const configured = isGoogleOAuthConfigured();
    if (!configured) {
      setShowGoogleConfigModal(true);
      return;
    }

    setLoading(true);
    try {
      // Initiates REAL Google OAuth authentication
      const googleProfile = await initiateGoogleLogin();
      await loginWithGoogle(googleProfile);
    } catch (err) {
      if (err.code === 'CONFIG_REQUIRED' || (err.message && err.message.includes('invalid_client'))) {
        setShowGoogleConfigModal(true);
        setConfigError(err.message || 'Google OAuth Client ID is required.');
      } else {
        setError(err.message || 'Google authentication was cancelled or failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoogleClientId = (e) => {
    e?.preventDefault?.();
    setConfigError('');
    const trimmed = configClientIdInput.trim();
    if (!trimmed) {
      setConfigError('Please enter a valid Google Client ID.');
      return;
    }
    if (!trimmed.includes('.apps.googleusercontent.com')) {
      setConfigError('Invalid Client ID format. It must end with ".apps.googleusercontent.com"');
      return;
    }
    setGoogleClientId(trimmed);
    setShowGoogleConfigModal(false);
    setTimeout(() => {
      handleGoogleLogin();
    }, 150);
  };

  const copyToClipboard = (text, field) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch min-h-screen bg-[#F8FAFC] text-[#1E293B] overflow-y-auto">
      {/* LEFT PANEL: Professional SaaS Brand Showcase (Visible on lg and up) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#F1F5F9] via-[#F8FAFC] to-[#EFF6FF] border-r border-[#E2E8F0] text-[#1E293B] p-12 xl:p-16 flex-col justify-between relative overflow-hidden">
        {/* Subtle geometric line pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(#1E293B 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-[#1E293B] font-sans">QueueFlow</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
                Commercial
              </span>
            </div>
            <p className="text-xs text-[#64748B]">Intelligent Queue Management System</p>
          </div>
        </div>

        {/* Center Editorial Hero & Live Station Preview */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-xl">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold">
              <Radio className="w-3 h-3 text-[#2563EB] animate-pulse" />
              <span>Real-Time Operational Telemetry</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold text-[#1E293B] leading-tight tracking-tight">
              Orchestrate customer queues with real-time intelligence.
            </h1>

            <p className="text-sm xl:text-base text-[#64748B] leading-relaxed">
              Enterprise token dispatch, multi-station queue management, acoustic voice announcements, and live performance analytics — built for modern service centers.
            </p>
          </div>

          {/* Live Station Simulated Preview Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-card space-y-3.5">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5 font-semibold text-[#1E293B]">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
                Customer Support • Desk 1
              </span>
              <span className="flex items-center gap-1 text-[#10B981] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Live Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Now Serving</span>
                <div className="font-mono text-2xl font-black text-[#2563EB]">SUP-004</div>
                <div className="text-xs text-[#1E293B] font-semibold">Eleanor Vance</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Service Elapsed</span>
                <div className="font-mono text-lg font-bold text-[#10B981] flex items-center justify-end gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>04:12</span>
                </div>
                <span className="text-[11px] text-[#2563EB] font-medium">3 waiting in line</span>
              </div>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-3 gap-3 text-xs text-[#1E293B]">
            <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>Multi-Station Queues</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>Voice Synthesizer</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>Wait Telemetry</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-[#64748B] pt-6 border-t border-[#E2E8F0]">
          <span>QueueFlow Operations Suite</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>JWT Secured & ACID SQLite Storage</span>
          </span>
        </div>
      </div>

      {/* RIGHT PANEL: Modern Clean SaaS Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 xl:p-16 bg-white">
        <div className="w-full max-w-md space-y-5 sm:space-y-6 animate-fade-in">
          {/* Mobile Branding Header (< lg) */}
          <div className="lg:hidden flex items-center gap-3 mb-2 sm:mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-sm shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-[#1E293B]">QueueFlow</span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB]">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">Queue Management System</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight font-sans">
              {isRegister ? 'Create Manager Account' : 'Manager Sign In'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              {isRegister 
                ? 'Register an administrative manager account to operate queues.' 
                : 'Welcome back. Enter your credentials to access the management console.'}
            </p>
          </div>

          {/* 1-Click Demo Login Banner */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-subtle">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1E293B]">Quick Evaluation Account</div>
                <div className="text-[11px] font-mono font-semibold text-[#2563EB]">admin / admin123</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full sm:w-auto min-h-[38px] py-1.5 px-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <span>Auto-Fill & Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-[#E2E8F0] w-full" />
            <span className="bg-white px-3 text-[11px] uppercase tracking-wider font-semibold text-[#94A3B8]">
              Or enter credentials
            </span>
            <div className="border-t border-[#E2E8F0] w-full" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-slide-up">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-[#94A3B8]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Johnathan Davis"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all shadow-subtle"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                Username or Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#94A3B8]" />
                <input
                  type="text"
                  required
                  placeholder="admin or manager@queueflow.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all shadow-subtle"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#94A3B8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all shadow-subtle"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#94A3B8] hover:text-[#1E293B] transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#94A3B8]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all shadow-subtle"
                  />
                </div>
              </div>
            )}

            {!isRegister && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#64748B] hover:text-[#1E293B]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB] accent-[#2563EB]"
                  />
                  <span>Remember me for 7 days</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-xl transition-all shadow-card flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Create Manager Account' : 'Sign In to Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-[#E2E8F0] w-full" />
            <span className="bg-white px-3 text-[11px] uppercase tracking-wider font-bold text-[#94A3B8]">
              Or continue with
            </span>
            <div className="border-t border-[#E2E8F0] w-full" />
          </div>

          {/* Google Sign In Button - Positioned properly at the bottom of the options */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex-1 min-h-[44px] py-2.5 px-4 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#2563EB]/50 text-[#1E293B] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2.5 sm:gap-3 disabled:opacity-50 group cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setConfigClientIdInput(getGoogleClientId() || '');
                setShowGoogleConfigModal(true);
              }}
              title="Configure Google OAuth Client ID"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#2563EB]/50 text-[#64748B] hover:text-[#1E293B] rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Footer mode toggle */}
          <div className="pt-2 text-center text-xs text-[#64748B]">
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(''); }}
                  className="font-semibold text-[#2563EB] hover:underline ml-1"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New to QueueFlow?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(''); }}
                  className="font-semibold text-[#2563EB] hover:underline ml-1"
                >
                  Create an account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Google OAuth 2.0 Configuration Modal */}
      {showGoogleConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowGoogleConfigModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#1E293B] p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1E293B]">Google OAuth 2.0 Configuration</h3>
                <p className="text-xs text-[#64748B]">Configure genuine Google Sign-In for QueueFlow</p>
              </div>
            </div>

            {configError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{configError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs text-[#1E293B]">
              <p className="leading-relaxed text-[#64748B]">
                Google requires a valid <strong>Web application</strong> OAuth 2.0 Client ID created in Google Cloud Console. To avoid <span className="font-mono text-rose-600 bg-rose-50 px-1 py-0.5 rounded font-semibold">Error 401: invalid_client</span>, set the exact origins and redirect URIs below:
              </p>

              <div className="space-y-2.5 p-3 sm:p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div className="font-semibold text-[#1E293B] text-[11px] uppercase tracking-wider">
                  1. Authorized JavaScript Origins:
                </div>
                <div className="flex items-center justify-between bg-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E2E8F0] font-mono text-[10px] sm:text-[11px]">
                  <span className="truncate">https://nagellabalaji.github.io</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('https://nagellabalaji.github.io', 'orig1')}
                    className="ml-2 text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-sans text-xs font-medium shrink-0"
                  >
                    {copiedField === 'orig1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'orig1' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between bg-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E2E8F0] font-mono text-[10px] sm:text-[11px]">
                  <span className="truncate">http://localhost:5173</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('http://localhost:5173', 'orig2')}
                    className="ml-2 text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-sans text-xs font-medium shrink-0"
                  >
                    {copiedField === 'orig2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'orig2' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="font-semibold text-[#1E293B] text-[11px] uppercase tracking-wider pt-1">
                  2. Authorized Redirect URIs:
                </div>
                <div className="flex items-center justify-between bg-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E2E8F0] font-mono text-[10px] sm:text-[11px]">
                  <span className="truncate">https://nagellabalaji.github.io/queueflow-/</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('https://nagellabalaji.github.io/queueflow-/', 'redir1')}
                    className="ml-2 text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-sans text-xs font-medium shrink-0"
                  >
                    {copiedField === 'redir1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'redir1' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between bg-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E2E8F0] font-mono text-[10px] sm:text-[11px]">
                  <span className="truncate">http://localhost:5173/</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('http://localhost:5173/', 'redir2')}
                    className="ml-2 text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-sans text-xs font-medium shrink-0"
                  >
                    {copiedField === 'redir2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'redir2' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">
                  Paste your Google Client ID:
                </label>
                <input
                  type="text"
                  placeholder="xxxx-xxxxxxxx.apps.googleusercontent.com"
                  value={configClientIdInput}
                  onChange={(e) => setConfigClientIdInput(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 sm:px-3.5 py-2 font-mono text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
                <p className="text-[11px] text-[#64748B] mt-1">
                  Saved securely in your browser and used for real Google authentication.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#2563EB] hover:underline flex items-center gap-1 font-medium order-2 sm:order-1"
                >
                  <span>Open Google Cloud Credentials</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={() => setShowGoogleConfigModal(false)}
                    className="flex-1 sm:flex-none px-3.5 py-2 border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveGoogleClientId}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Save & Authenticate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Helper Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#1E293B] p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#1E293B]">Password Recovery</h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                For administrative security, default manager credentials are set to:
              </p>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono text-xs space-y-1 text-[#1E293B]">
              <div><strong>Username:</strong> admin</div>
              <div><strong>Password:</strong> admin123</div>
            </div>

            <p className="text-[11px] text-[#64748B]">
              You can also use the blue <strong>"1-Click Demo Fill"</strong> button on the login screen to sign in automatically.
            </p>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
