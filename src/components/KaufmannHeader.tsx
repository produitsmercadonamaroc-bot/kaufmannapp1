import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Boxes,
  LayoutDashboard,
  FileText,
  ChevronDown,
  Plus,
  ArrowDownToLine,
  Receipt,
  Check,
  User,
  LogOut,
  Lock,
  ShoppingBag,
} from 'lucide-react';
import { AppUser } from '../types';

export type MainNavView = 'catalogue' | 'factures';

interface KaufmannHeaderProps {
  currentView: MainNavView;
  setCurrentView: (view: MainNavView) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenAddModal: () => void;
  onOpenStockArrivalModal: () => void;
  onOpenNewInvoiceModal: () => void;
  selectedFamily: string;
  setSelectedFamily: (family: string) => void;
  totalInvoicesCount: number;
  currentUser?: AppUser | null;
  onOpenAccountModal?: () => void;
  onLogout?: () => void;
  onOpenLoginModal?: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export const KaufmannHeader: React.FC<KaufmannHeaderProps> = ({
  currentView,
  setCurrentView,
  searchTerm,
  setSearchTerm,
  onOpenAddModal,
  onOpenStockArrivalModal,
  onOpenNewInvoiceModal,
  selectedFamily,
  setSelectedFamily,
  totalInvoicesCount,
  currentUser,
  onOpenAccountModal,
  onLogout,
  onOpenLoginModal,
  cartCount = 0,
  onOpenCart,
}) => {
  const [isFamilyDropdownOpen, setIsFamilyDropdownOpen] = useState(false);
  const familyDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (familyDropdownRef.current && !familyDropdownRef.current.contains(e.target as Node)) {
        setIsFamilyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const familiesList = [
    'Toutes les familles',
    'Filtre à air',
    'Filtre à carburant',
    'Filtre à huile',
    'Filtre air d\'habitacle',
    'Disques de frein',
    'Plaquettes de frein',
    'Alternateurs & Démarreurs',
    'Batteries',
    'Balais d\'essuie-glace',
    'Huiles & Lubrifiants',
    'Amortisseurs & Suspension',
    'Embrayage',
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print">
      {/* ========================================================
          DESKTOP TOP BAR (md and up)
         ======================================================== */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Left: Burger Menu & Brand Logo */}
          <div className="flex items-center gap-3 shrink-0 relative" ref={familyDropdownRef}>
            <button
              onClick={() => setIsFamilyDropdownOpen(!isFamilyDropdownOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              title="Menu Familles de pièces"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Red Kaufmann-style Logo */}
            <div
              onClick={() => setCurrentView('catalogue')}
              className="cursor-pointer select-none"
            >
              <div className="text-2xl font-black tracking-tight text-[#e52e2d] leading-none uppercase">
                EL HAJI AUTO
              </div>
              <div className="text-[10px] font-bold text-slate-700 tracking-tight mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="bg-slate-900 text-white px-1.5 py-0.2 rounded font-mono text-[9px]">
                  PORTAIL ADMIN
                </span>
                <span className="text-slate-500 font-medium text-[10px]">· GARAGE AUTO EL HAJI · TANGER</span>
              </div>
            </div>

            {/* Desktop Family Dropdown Menu */}
            {isFamilyDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 font-bold text-slate-400 uppercase text-[10px] border-b border-slate-100">
                  Familles de pièces
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {familiesList.map((fam) => (
                    <button
                      key={fam}
                      onClick={() => {
                        setSelectedFamily(fam);
                        setIsFamilyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                        selectedFamily === fam ? 'bg-red-50 text-[#e52e2d] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span>{fam}</span>
                      {selectedFamily === fam && <Check className="w-3.5 h-3.5 text-[#e52e2d]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center: Search input */}
          <div className="flex-1 max-w-2xl mx-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une pièce par RÉFÉRENCE, OE, NOM, VÉHICULE..."
                className="w-full pl-10 pr-20 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#e52e2d] focus:ring-1 focus:ring-[#e52e2d] transition-all font-medium shadow-2xs"
              />
              <span className="absolute right-3 text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 pointer-events-none">
                Ctrl + K
              </span>
            </div>
          </div>

          {/* Right: Quick Action Buttons for Morad */}
          <div className="flex items-center gap-2.5 shrink-0">
            {currentUser ? (
              <>
                {/* Quick Stock Arrival */}
                <button
                  onClick={onOpenStockArrivalModal}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  title="Ajouter des quantités reçues au stock"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Entrée Stock</span>
                </button>

                {/* Quick Add Product Button */}
                <button
                  onClick={onOpenAddModal}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors shadow-2xs cursor-pointer border border-slate-700"
                  title="Ajouter un nouveau produit au catalogue"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Nouveau Produit</span>
                </button>

                {/* Create Invoice Button */}
                <button
                  onClick={onOpenNewInvoiceModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#e52e2d] hover:bg-[#c82322] rounded-lg transition-colors shadow-2xs cursor-pointer"
                  title="Créer une nouvelle facture suite à une vente"
                >
                  <Receipt className="w-4 h-4" />
                  <span>+ Nouvelle Facture</span>
                </button>

                {/* Cart Button on Desktop */}
                {onOpenCart && (
                  <button
                    onClick={onOpenCart}
                    className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                    title="Ouvrir le panier"
                  >
                    <ShoppingBag className="w-4 h-4 text-slate-700" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#e52e2d] text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-xs">
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Authenticated Admin Badge & Profile Button */}
                <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={onOpenAccountModal}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors text-xs font-semibold cursor-pointer border border-slate-200"
                    title="Voir les détails du compte administrateur"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#e52e2d] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                      HA
                    </div>
                    <div className="hidden lg:block text-left">
                      <div className="text-[11px] font-bold leading-tight text-slate-900">
                        EL HAJI AUTO
                      </div>
                      <div className="text-[9px] text-emerald-600 font-mono font-semibold leading-tight flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Administrateur</span>
                      </div>
                    </div>
                  </button>

                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Se déconnecter (Verrouiller le portail)"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-linear-to-r from-[#e52e2d] to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all shadow-md shadow-red-500/20 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Connexion Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          MOBILE TOP BAR (< md - Phones) - Clean, Modern, Organized
         ======================================================== */}
      <div className="block md:hidden bg-white px-3 pt-2.5 pb-2 border-b border-slate-100 space-y-2">
        {/* Mobile Row 1: Brand Logo + User Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFamilyDropdownOpen(!isFamilyDropdownOpen)}
              className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Familles de pièces"
              aria-label="Menu familles"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div
              onClick={() => setCurrentView('catalogue')}
              className="cursor-pointer select-none"
            >
              <div className="text-lg font-black tracking-tight text-[#e52e2d] leading-none uppercase flex items-center gap-1.5">
                <span>EL HAJI AUTO</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#e52e2d]"></span>
              </div>
              <div className="text-[10px] font-bold text-slate-500 tracking-tight mt-0.5">
                GARAGE TANGER · ATELIER & STOCK
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Cart Button on Mobile */}
            {onOpenCart && (
              <button
                type="button"
                onClick={onOpenCart}
                className="relative w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer active:bg-slate-200 transition-colors"
                title="Panier"
                aria-label="Panier"
              >
                <ShoppingBag className="w-4 h-4 text-slate-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#e52e2d] text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onOpenAccountModal}
              className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-all"
              title="Profil Administrateur"
            >
              HA
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-9 h-9 text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Family Dropdown Drawer */}
        {isFamilyDropdownOpen && (
          <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl space-y-2 border border-slate-800 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase pb-1.5 border-b border-slate-800">
              <span>Sélectionner une famille</span>
              <button
                onClick={() => setIsFamilyDropdownOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-0.5 rounded bg-slate-800"
              >
                ✕ Fermer
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto text-[11px] pt-1">
              {familiesList.map((fam) => (
                <button
                  key={fam}
                  onClick={() => {
                    setSelectedFamily(fam);
                    setIsFamilyDropdownOpen(false);
                  }}
                  className={`text-left px-2.5 py-2 rounded-lg transition-colors truncate font-medium ${
                    selectedFamily === fam ? 'bg-[#e52e2d] text-white font-bold' : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {fam}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Row 2: Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              currentView === 'factures'
                ? "Chercher une facture, client, véhicule..."
                : "Chercher référence, nom, OEM, véhicule..."
            }
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#e52e2d] focus:bg-white transition-all font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              aria-label="Effacer recherche"
            >
              ✕
            </button>
          )}
        </div>

        {/* Mobile Row 3: Quick Action Buttons Grid (Designed for Thumbs) */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          <button
            onClick={onOpenNewInvoiceModal}
            className="flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-bold text-white bg-[#e52e2d] active:bg-[#c82322] rounded-lg shadow-2xs cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">+ Facture</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-bold text-white bg-slate-800 active:bg-slate-900 rounded-lg shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">+ Produit</span>
          </button>
          <button
            onClick={onOpenStockArrivalModal}
            className="flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-bold text-white bg-emerald-600 active:bg-emerald-700 rounded-lg shadow-2xs cursor-pointer"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Entrée Stock</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          SUB-NAVIGATION TABS (Clean 2-tab switch)
         ======================================================== */}
      <div className="bg-[#001f3f] text-white text-xs font-medium border-t border-[#001428]">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:gap-1">
            {/* 1. TABLEAU DE BORD TAB */}
            <button
              onClick={() => setCurrentView('catalogue')}
              className={`flex items-center justify-center gap-2 py-2.5 sm:px-6 sm:py-2.5 transition-colors cursor-pointer text-center ${
                currentView === 'catalogue'
                  ? 'bg-[#e52e2d] text-white font-extrabold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="text-xs uppercase tracking-wide">
                Tableau de Bord
              </span>
            </button>

            {/* 2. MES FACTURES TAB */}
            {currentUser && (
              <button
                onClick={() => setCurrentView('factures')}
                className={`flex items-center justify-center gap-2 py-2.5 sm:px-6 sm:py-2.5 transition-colors cursor-pointer text-center ${
                  currentView === 'factures'
                    ? 'bg-[#e52e2d] text-white font-extrabold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="text-xs uppercase tracking-wide">Mes Factures</span>
                {totalInvoicesCount > 0 && (
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                    {totalInvoicesCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
