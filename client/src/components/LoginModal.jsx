import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
  HelpCircle
} from 'lucide-react';

export default function LoginModal() {
  const { login, register, demoLogin } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register(username, password, name);
      } else {
        await login(username, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await demoLogin();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch min-h-screen bg-[#F7F6F2] text-[#30343B] overflow-y-auto">
      {/* LEFT PANEL: Professional SaaS Brand Showcase (Visible on lg and up) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#243447] text-white p-12 xl:p-16 flex-col justify-between relative overflow-hidden">
        {/* Subtle geometric line pattern */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(#FFFFFF 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4F807A] flex items-center justify-center text-white shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-white font-sans">QueueFlow</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#4F807A]/30 text-[#EDF5F4] border border-[#4F807A]/40">
                Commercial
              </span>
            </div>
            <p className="text-xs text-slate-300">Intelligent Queue Management System</p>
          </div>
        </div>

        {/* Center Editorial Hero & Live Station Preview */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-xl">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4F807A]/25 border border-[#4F807A]/40 text-[#EDF5F4] text-xs font-medium">
              <Radio className="w-3 h-3 text-[#EDF5F4] animate-pulse" />
              <span>Real-Time Operational Telemetry</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Orchestrate customer queues with real-time intelligence.
            </h1>

            <p className="text-sm xl:text-base text-slate-300 leading-relaxed">
              Enterprise token dispatch, multi-station queue management, acoustic voice announcements, and live performance analytics — built for modern service centers.
            </p>
          </div>

          {/* Live Station Simulated Preview Card */}
          <div className="bg-[#1B2735]/80 border border-[#2F435C] rounded-2xl p-5 shadow-xl space-y-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-200">
                <Building2 className="w-4 h-4 text-[#4F807A]" />
                Customer Support • Desk 1
              </span>
              <span className="flex items-center gap-1 text-[#64866A] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#64866A] animate-pulse" />
                Live Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#243447] border border-[#2F435C]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Now Serving</span>
                <div className="font-mono text-2xl font-black text-white">SUP-004</div>
                <div className="text-xs text-slate-300 font-medium">Eleanor Vance</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Service Elapsed</span>
                <div className="font-mono text-lg font-bold text-[#64866A] flex items-center justify-end gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>04:12</span>
                </div>
                <span className="text-[11px] text-[#4F807A] font-medium">3 waiting in line</span>
              </div>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-[#1B2735]/50 border border-[#2F435C]/60 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4F807A] shrink-0" />
              <span>Multi-Station Queues</span>
            </div>
            <div className="p-3 rounded-xl bg-[#1B2735]/50 border border-[#2F435C]/60 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4F807A] shrink-0" />
              <span>Voice Synthesizer</span>
            </div>
            <div className="p-3 rounded-xl bg-[#1B2735]/50 border border-[#2F435C]/60 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4F807A] shrink-0" />
              <span>Wait Telemetry</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-[#2F435C]">
          <span>QueueFlow Operations Suite</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4F807A]" />
            <span>JWT Secured & ACID SQLite Storage</span>
          </span>
        </div>
      </div>

      {/* RIGHT PANEL: Modern Clean SaaS Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 xl:p-16">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          {/* Mobile Branding Header (< lg) */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#243447] text-white flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-[#243447]">QueueFlow</span>
              <p className="text-[11px] text-[#5B626C]">Queue Management System</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#243447] tracking-tight font-sans">
              {isRegister ? 'Create Manager Account' : 'Manager Sign In'}
            </h2>
            <p className="text-sm text-[#5B626C]">
              {isRegister 
                ? 'Register an administrative manager account to operate queues.' 
                : 'Welcome back. Enter your credentials to access the management console.'}
            </p>
          </div>

          {/* 1-Click Demo Login Banner */}
          <div className="p-3.5 rounded-2xl bg-[#EDF5F4] border border-[#4F807A]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#4F807A] text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#243447]">Instant Evaluation Account</div>
                <div className="text-[11px] font-mono text-[#4F807A]">admin / admin123</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="py-1.5 px-3 bg-[#4F807A] hover:bg-[#416B66] text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              <span>1-Click Demo Fill</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-[#E3E0D8] w-full" />
            <span className="bg-[#F7F6F2] px-3 text-[11px] uppercase tracking-wider font-semibold text-[#8B929C]">
              Or with credentials
            </span>
            <div className="border-t border-[#E3E0D8] w-full" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-[#F9F1ED] border border-[#C98262]/40 rounded-xl text-[#B57051] text-xs flex items-start gap-2 animate-slide-up">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-[#30343B] mb-1.5">
                  Full Name <span className="text-[#C98262]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-[#8B929C]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Johnathan Davis"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-[#E3E0D8] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#30343B] placeholder-[#8B929C] focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all shadow-subtle"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#30343B] mb-1.5">
                Username or Email <span className="text-[#C98262]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#8B929C]" />
                <input
                  type="text"
                  required
                  placeholder="admin or manager@queueflow.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-[#E3E0D8] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#30343B] placeholder-[#8B929C] focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all shadow-subtle"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#30343B] mb-1.5">
                Password <span className="text-[#C98262]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#8B929C]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#E3E0D8] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#30343B] placeholder-[#8B929C] focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all shadow-subtle"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#8B929C] hover:text-[#30343B] transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-[#30343B] mb-1.5">
                  Confirm Password <span className="text-[#C98262]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#8B929C]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-[#E3E0D8] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#30343B] placeholder-[#8B929C] focus:outline-none focus:border-[#4F807A] focus:ring-1 focus:ring-[#4F807A] transition-all shadow-subtle"
                  />
                </div>
              </div>
            )}

            {!isRegister && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#5B626C] hover:text-[#30343B]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#E3E0D8] text-[#4F807A] focus:ring-[#4F807A] accent-[#4F807A]"
                  />
                  <span>Remember me for 7 days</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="font-medium text-[#4F807A] hover:text-[#3F6863] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#243447] hover:bg-[#1B2735] text-white font-semibold text-sm rounded-xl transition-all shadow-card flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
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

          {/* Footer mode toggle */}
          <div className="pt-2 text-center text-xs text-[#5B626C]">
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(''); }}
                  className="font-semibold text-[#4F807A] hover:underline ml-1"
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
                  className="font-semibold text-[#4F807A] hover:underline ml-1"
                >
                  Create an account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Helper Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white border border-[#E3E0D8] rounded-2xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-[#8B929C] hover:text-[#30343B] p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-[#EDF5F4] text-[#4F807A] flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#243447]">Password Recovery</h3>
              <p className="text-xs text-[#5B626C] mt-1 leading-relaxed">
                For administrative security, default manager credentials are set to:
              </p>
            </div>

            <div className="p-3 bg-[#F7F6F2] border border-[#E3E0D8] rounded-xl font-mono text-xs space-y-1 text-[#30343B]">
              <div><strong>Username:</strong> admin</div>
              <div><strong>Password:</strong> admin123</div>
            </div>

            <p className="text-[11px] text-[#8B929C]">
              You can also use the green <strong>"1-Click Demo Fill"</strong> button on the login screen to sign in automatically.
            </p>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-[#243447] text-white text-xs font-semibold rounded-xl"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
