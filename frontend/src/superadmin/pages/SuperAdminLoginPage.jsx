import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { useSuperAdminAuth } from '../context/SuperAdminAuthContext';
import { superAdminAuthService } from '../services/superAdminAuthService';

export const SuperAdminLoginPage = () => {
  const { login, isAuthenticated } = useSuperAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || '/superadmin';
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid Platform Owner credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/70 via-[#FEFDF9] to-yellow-50/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased relative overflow-hidden text-slate-800">
      {/* Background Ambient Glow - Warm light yellow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-yellow-300/20 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-400/15 rounded-full blur-[80px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Logo & Headline */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-2xl mx-auto shadow-md shadow-amber-500/20 border border-amber-300 mb-3">
            OF
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            OrderFlow HQ
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Platform Owner & Multi-Tenant Licensing Console
          </p>
        </div>

        {/* Login Box - Light White & Light Yellow */}
        <div className="bg-white/95 border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-amber-900/5 backdrop-blur-md">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Platform Owner Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-amber-600 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="progixtechnology@gmail.com"
                  className="w-full h-11 pl-10 pr-4 bg-amber-50/20 border border-amber-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-amber-600 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 bg-amber-50/20 border border-amber-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Persist Owner Console Session
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-slate-950 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating Platform Owner...</span>
                ) : (
                  <>
                    <span>Enter Platform Command Center</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>Bcrypt Multi-Tenant SaaS Licensing • Protected Owner Access</span>
        </div>
      </div>
    </div>
  );
};
