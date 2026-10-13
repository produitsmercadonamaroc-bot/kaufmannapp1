import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Wrench,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { authenticateUser } from '../lib/firebase';
import { AppUser } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: AppUser) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onClose,
  isModal = false,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Veuillez renseigner votre email et mot de passe administrateur.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessInfo(null);

    try {
      const result = await authenticateUser(email, password);

      if (result.success && result.user) {
        setSuccessInfo(
          `Connexion réussie ! Bienvenue ${result.user.displayName}.`
        );
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 500);
      } else {
        setErrorMessage(
          result.error ||
            'Email ou mot de passe incorrect. Accès réservé à l\'administrateur.'
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Une erreur inattendue est survenue lors de la connexion.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const containerClasses = isModal
    ? 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs'
    : 'min-h-screen bg-slate-950 bg-linear-to-b from-slate-900 via-[#00172e] to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100';

  return (
    <div className={containerClasses}>
      {/* Background soft glow */}
      {!isModal && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#e52e2d] blur-3xl" />
        </div>
      )}

      <div className="w-full max-w-sm relative z-10">
        {/* Brand Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-tr from-[#e52e2d] to-red-600 shadow-xl shadow-red-500/20 mb-3 border border-red-400/30">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            EL HAJI AUTO
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Garage Auto El Haji · Tanger
          </p>
        </div>

        {/* Simple Login Card */}
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl relative">
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-xs"
            >
              ✕
            </button>
          )}

          <div className="mb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#e52e2d]" />
              Connexion
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Entrez vos identifiants pour accéder à l'application.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-100">Erreur</p>
                <p className="mt-0.5 text-red-200/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successInfo && (
            <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-200 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-100">{successInfo}</p>
                <p className="text-[11px] text-emerald-300/80">Chargement en cours...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elhajiauto@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#e52e2d] focus:ring-1 focus:ring-[#e52e2d] placeholder-slate-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#e52e2d] focus:ring-1 focus:ring-[#e52e2d] placeholder-slate-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full pt-3 pb-3 px-4 bg-[#e52e2d] hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm uppercase tracking-wider mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-5 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Garage Auto El Haji · Tanger</p>
        </div>
      </div>
    </div>
  );
};
