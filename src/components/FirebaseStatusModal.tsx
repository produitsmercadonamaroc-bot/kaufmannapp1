import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  CloudUpload,
  Info,
} from 'lucide-react';
import { testFirestoreConnection, syncAllToFirestore } from '../lib/firebase';
import { AutoProduct, InvoiceDocument } from '../types';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: AutoProduct[];
  invoices: InvoiceDocument[];
  onSyncSuccess?: () => void;
}

export const FIRESTORE_RULES_SNIPPET = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

export const FirebaseStatusModal: React.FC<FirebaseStatusModalProps> = ({
  isOpen,
  onClose,
  products,
  invoices,
  onSyncSuccess,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    code?: string;
    message?: string;
  } | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    productsCount?: number;
    invoicesCount?: number;
    error?: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testFirestoreConnection();
      setTestResult({
        tested: true,
        success: res.success,
        code: res.code,
        message: res.message,
      });
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        code: 'error',
        message: String(err),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncAllToFirestore(products, invoices);
      if (res.success) {
        setSyncResult({
          success: true,
          productsCount: res.productsSynced,
          invoicesCount: res.invoicesSynced,
        });
        if (onSyncSuccess) onSyncSuccess();
      } else {
        setSyncResult({
          success: false,
          error: res.code === 'permission-denied'
            ? 'Règles de sécurité Firestore toujours bloquées (Permission Denied). N\'oubliez pas de cliquer sur "Publier" dans la console Firebase.'
            : res.error,
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        error: String(err?.message || err),
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#e52e2d] rounded-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                État de Connexion Firebase Firestore
              </h3>
              <p className="text-xs text-slate-400">
                Projet : <span className="font-mono text-amber-400 font-bold">kaufmann-projet</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700 flex-1">
          {/* Diagnostic Banner explaining why data didn't show up */}
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">
                  3lash matzadlek walo f compte Firebase ? (Pourquoi rien n'apparaît ?)
                </h4>
                <p className="text-amber-800 mt-1 leading-relaxed">
                  L-configuration dyal Firebase s-hiha 100%, <strong>walakin Firebase kay-koun f l-bidaya bloqué b les Règles de sécurité (Security Rules : Permission Denied)</strong>.
                  <br />
                  Khassek ghir t-fetah les règles f Firebase Console f <strong>30 thania</strong> bach Firebase y-qbel l-hifd d l-produits w les factures !
                </p>
              </div>
            </div>
          </div>

          {/* Test Status Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-800 block text-xs">
                Test en direct de la base de données :
              </span>
              <span className="text-[11px] text-slate-500">
                Vérifie si les règles autorisent l'écriture de vos produits
              </span>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Test en cours...' : 'Tester la connexion'}</span>
            </button>
          </div>

          {/* Test Result Feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-lg border ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-xs">
                    {testResult.success
                      ? '✅ Connexion réussie ! Firebase accepte maintenant l\'écriture !'
                      : '❌ Bloqué : Permission Denied (Règles Firestore non publiées)'}
                  </div>
                  <p className="text-[11px] mt-0.5">
                    {testResult.success
                      ? 'Vos données peuvent maintenant être enregistrées et synchronisées en temps réel dans votre projet kaufmann-projet.'
                      : 'Firebase bloque l\'accès. Suivez les 3 étapes ci-dessous pour débloquer en 30 secondes.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3 Simple Steps Guide */}
          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400" />
                Kifash t-hell l-mushkil f 30 thania (3 étapes faciles) :
              </span>
              <a
                href="https://console.firebase.google.com/project/kaufmann-projet/firestore/rules"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 underline underline-offset-2"
              >
                <span>Ouvrir Firebase Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="space-y-2 text-slate-300 text-xs">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0 border border-slate-700">
                  1
                </span>
                <span>
                  Dkhol l <strong>Firebase Console</strong> ➜ Projet <strong>kaufmann-projet</strong> ➜ Clique f le menu gauche sur <strong>Firestore Database</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0 border border-slate-700">
                  2
                </span>
                <span>
                  Clique sur l'onglet <strong>Règles (Rules)</strong> en haut.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-mono font-bold flex items-center justify-center shrink-0 border border-slate-700">
                  3
                </span>
                <span>
                  Mseh li kayn w collé had les règles, w wrék ela <strong>Publier (Publish)</strong> :
                </span>
              </li>
            </ol>

            {/* Code Snippet Box */}
            <div className="relative bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-emerald-400 border border-slate-800">
              <pre className="overflow-x-auto whitespace-pre">{FIRESTORE_RULES_SNIPPET}</pre>
              <button
                type="button"
                onClick={handleCopyRules}
                className="absolute top-2.5 right-2.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-sans text-[10px] font-bold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copier le code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sync All Button */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-emerald-950 text-xs">
                  Synchroniser tout vers Firebase en 1 clic
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Envoie tous vos articles ({products.length}) et factures ({invoices.length}) directement dans Firebase.
                </p>
              </div>
              <button
                onClick={handleSyncAll}
                disabled={syncing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
              >
                <CloudUpload className={`w-4 h-4 ${syncing ? 'animate-bounce' : ''}`} />
                <span>{syncing ? 'Envoi en cours...' : 'Synchroniser Tout'}</span>
              </button>
            </div>

            {syncResult && (
              <div
                className={`p-2.5 rounded font-medium text-xs ${
                  syncResult.success
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {syncResult.success ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Succès ! {syncResult.productsCount} articles et {syncResult.invoicesCount} factures enregistrés dans Firebase !
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    {syncResult.error}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            kaufmann-projet.firebaseapp.com
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
