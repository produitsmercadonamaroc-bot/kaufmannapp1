import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  Mail,
  Phone,
  MapPin,
  LogOut,
  CheckCircle2,
  RefreshCw,
  Database,
  Calendar,
} from 'lucide-react';
import { AppUser } from '../types';
import { saveUserToFirestore } from '../lib/firebase';

interface AccountModalProps {
  user: AppUser;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  user,
  isOpen,
  onClose,
  onLogout,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  if (!isOpen) return null;

  const handleResync = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      const ok = await saveUserToFirestore(user);
      if (ok) {
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 to-[#001f3f] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e52e2d] flex items-center justify-center font-bold text-white shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base uppercase tracking-tight">
                {user.displayName}
              </h3>
              <p className="text-xs text-slate-300">Profil Administrateur</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Chip */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Session Authentifiée & Sécurisée</span>
            </div>
            <span className="bg-emerald-600 text-white font-mono px-2 py-0.5 rounded text-[10px] font-bold">
              ACTIF
            </span>
          </div>

          {/* User Attributes Grid */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                Email officiel
              </span>
              <span className="font-mono font-bold text-slate-900">{user.email}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#e52e2d]" />
                Rôle & Privilèges
              </span>
              <span className="font-bold text-white bg-slate-900 px-2 py-0.5 rounded text-[11px] uppercase">
                {user.role} (Accès Total)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                Téléphone
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {user.phone || '0658629841'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                Localisation
              </span>
              <span className="font-semibold text-slate-800">
                {user.city || 'Tanger'}, Maroc
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Dernière connexion
              </span>
              <span className="font-mono text-slate-700">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString('fr-FR')
                  : 'Aujourd\'hui'}
              </span>
            </div>
          </div>

          {/* Security & System Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Statut du compte</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Actif & Synchronisé</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Session administrateur sécurisée pour Garage Auto El Haji.
            </p>
            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResync}
                disabled={isSyncing}
                className="text-[11px] font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5 underline cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Actualiser la session</span>
              </button>
              {syncSuccess && (
                <span className="text-[11px] font-semibold text-emerald-700">
                  ✓ Synchronisé
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 py-2.5 px-4 bg-[#e52e2d] hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
