import React, { useState, useMemo } from 'react';
import {
  Grid,
  List,
  CheckCircle2,
  XCircle,
  Copy,
  ShoppingCart,
  Eye,
  ZoomIn,
  Smile,
  AlertTriangle,
  Search,
  Filter,
  Check,
  Edit2,
  Trash2,
  Plus,
  Minus,
  Save,
  Package,
  Boxes,
  ArrowDownToLine,
  TrendingUp,
  Camera,
  Pencil,
  PackagePlus,
  Layers,
  Tag,
  Percent,
} from 'lucide-react';
import { AutoProduct, VehicleSelection, StockStatus } from '../types';
import { ProductThumb } from './ProductThumb';
import { EditProductModal } from './EditProductModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface ProductCatalogProps {
  products: AutoProduct[];
  currentVehicle?: VehicleSelection;
  onAddToCart: (product: AutoProduct, quantity: number) => void;
  onUpdateProductStock: (productId: string, newStock: number, newPrice?: number) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenAddModal: () => void;
  onOpenBulkAddModal?: () => void;
  onOpenStockArrivalModal: () => void;
  searchTerm: string;
  selectedFamily: string;
  setSelectedFamily: (fam: string) => void;
  onUpdateProductImage?: (productId: string, imageUrl: string) => void;
  onUpdateProduct?: (updatedProduct: AutoProduct) => void;
  isAdmin?: boolean;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  currentVehicle,
  onAddToCart,
  onUpdateProductStock,
  onDeleteProduct,
  onOpenAddModal,
  onOpenBulkAddModal,
  onOpenStockArrivalModal,
  searchTerm,
  selectedFamily,
  setSelectedFamily,
  onUpdateProductImage,
  onUpdateProduct,
  isAdmin = true,
}) => {
  // Modal states for editing and deleting
  const [editingProduct, setEditingProduct] = useState<AutoProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<AutoProduct | null>(null);

  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Stock status filter: 'all' | 'in_stock' | 'out_of_stock'
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  // Quantity map for sale/exit
  const [saleQuantities, setSaleQuantities] = useState<Record<string, number>>({});

  // Inline editing state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);

  // Left sidebar filters
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [filterCriteria, setFilterCriteria] = useState('');
  const [onlySuggested, setOnlySuggested] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');

  // Copy feedback
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const handleCopy = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleUploadCardImage = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateProductImage) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        const maxDim = 600;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.82);
          onUpdateProductImage(productId, base64);
        }
      };
    };
  };

  const getSaleQty = (id: string) => saleQuantities[id] || 1;
  const setSaleQty = (id: string, val: number) => {
    setSaleQuantities((prev) => ({ ...prev, [id]: Math.max(1, val) }));
  };

  // Stock calculations
  const totalReferences = products.length;
  const totalPhysicalUnits = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const inStockCount = products.filter((p) => p.status === 'in_stock').length;
  const outOfStockCount = products.filter((p) => p.status === 'out_of_stock').length;
  const totalStockValueMAD = products.reduce((acc, p) => acc + p.stockQuantity * p.priceMAD, 0);

  const availableBrands = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.brand)));
    return list.sort();
  }, [products]);

  const familiesList = [
    'Filtre à air',
    'Filtre à carburant',
    'Filtre à huile',
    'Filtre air d\'habitacle',
    'Kit de filtres, air d\'habitacle',
    'Kit de filtres',
    'Filtre hydraulique, boîte automatique',
    'Disques de frein',
    'Plaquettes de frein',
    'Alternateurs & Démarreurs',
    'Batteries',
    'Balais d\'essuie-glace',
    'Huiles & Lubrifiants',
    'Amortisseurs & Suspension',
    'Embrayage',
  ];

  // Filtering products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Stock status filter
      if (stockFilter === 'in_stock' && p.status !== 'in_stock') return false;
      if (stockFilter === 'out_of_stock' && p.status !== 'out_of_stock') return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          p.title.toLowerCase().includes(term) ||
          p.ref.toLowerCase().includes(term) ||
          p.oemRef.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term) ||
          p.family.toLowerCase().includes(term);
        if (!match) return false;
      }

      // Family filter
      if (selectedFamily !== 'Toutes les familles' && p.family !== selectedFamily) {
        return false;
      }

      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) {
        return false;
      }

      // Price filter
      if (priceMin && p.priceMAD < parseFloat(priceMin)) return false;
      if (priceMax && p.priceMAD > parseFloat(priceMax)) return false;

      // Suggested badge
      if (onlySuggested && !p.suggested) return false;

      return true;
    });
  }, [
    products,
    stockFilter,
    searchTerm,
    selectedFamily,
    selectedBrands,
    priceMin,
    priceMax,
    onlySuggested,
  ]);

  const toggleBrand = (b: string) => {
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((item) => item !== b) : [...prev, b]
    );
  };

  const handleStockDelta = (prod: AutoProduct, delta: number) => {
    const newQty = Math.max(0, prod.stockQuantity + delta);
    onUpdateProductStock(prod.id, newQty);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* =========================================
          TOP ADMIN STOCK KPI BANNER
         ========================================= */}
      {/* =========================================
          TOP ADMIN STOCK KPI BANNER (Responsive Mobile & Desktop)
         ========================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#e52e2d] shrink-0" />
              <span>Tableau de Bord Stock & Entrées</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Gérez vos références de pièces, suivez les ruptures et ajustez les stocks en temps réel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:items-center gap-2 w-full md:w-auto">
            <button
              onClick={onOpenStockArrivalModal}
              className="py-2 px-3 bg-emerald-600 active:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Entrée Stock</span>
            </button>
            {onOpenBulkAddModal && (
              <button
                onClick={onOpenBulkAddModal}
                className="py-2 px-3 bg-slate-900 active:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer border border-slate-700 hover:border-slate-500 transition-colors truncate"
                title="Ajouter plusieurs pièces d'un coup"
              >
                <PackagePlus className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">+ Multi-Produits</span>
              </button>
            )}
            <button
              onClick={onOpenAddModal}
              className="py-2 px-3.5 bg-[#e52e2d] active:bg-[#c82322] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer truncate"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">+ Nouveau Produit</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Cards (2x2 on mobile, 4 columns on desktop) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 sm:p-3">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase block truncate">Total Références</span>
            <div className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-0.5">{totalReferences}</div>
            <span className="text-[10px] text-slate-400 block truncate">Articles catalogués</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 sm:p-3">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase block truncate">Unités en Stock</span>
            <div className="text-lg sm:text-xl font-black font-mono text-emerald-700 mt-0.5">{totalPhysicalUnits}</div>
            <span className="text-[10px] text-emerald-600 font-semibold block truncate">{inStockCount} en stock</span>
          </div>

          <div className="bg-red-50/70 border border-red-200 rounded-lg p-2.5 sm:p-3">
            <span className="text-[10px] sm:text-[11px] font-bold text-red-800 uppercase block truncate">En Rupture</span>
            <div className="text-lg sm:text-xl font-black font-mono text-red-600 mt-0.5">{outOfStockCount}</div>
            <span className="text-[10px] text-red-600 font-semibold block truncate">0 unité disponible</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 sm:p-3">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase block truncate">Valeur Stock</span>
            <div className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-0.5">
              {totalStockValueMAD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD
            </div>
            <span className="text-[10px] text-slate-400 block truncate">Capital pièces</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Filters & Right Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================
            DESKTOP SIDEBAR FILTERS (lg:col-span-3)
           ========================================= */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4 no-print">
          {/* Tableau de Bord Widget: Aperçu Rapide */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  Tableau de Bord
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                Tanger
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Total Références :</span>
                <span className="font-bold font-mono text-slate-900">{totalReferences}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Unités en Stock :</span>
                <span className="font-bold font-mono text-emerald-600">{totalPhysicalUnits}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>En Rupture :</span>
                <span className={`font-bold font-mono ${outOfStockCount > 0 ? 'text-red-600 font-black' : 'text-slate-400'}`}>
                  {outOfStockCount}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={onOpenAddModal}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#e52e2d]" />
                <span>+ Nouveau Produit</span>
              </button>
            </div>
          </div>

          {/* Familles Filter */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>▾ Familles de pièces</span>
            </label>
            <div className="max-h-56 overflow-y-auto space-y-1.5 pt-1 text-xs pr-1">
              {familiesList.map((fam, idx) => {
                const isSelected = selectedFamily === fam;
                const isRedHighlight = idx < 2;
                return (
                  <label
                    key={fam}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) setSelectedFamily('Toutes les familles');
                        else setSelectedFamily(fam);
                      }}
                      className="rounded text-[#e52e2d] focus:ring-[#e52e2d]"
                    />
                    <span
                      className={`${
                        isSelected
                          ? 'font-bold text-[#e52e2d]'
                          : isRedHighlight
                          ? 'text-[#e52e2d] font-semibold'
                          : 'text-slate-700'
                      }`}
                    >
                      {fam}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Prix Filter */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2">
            <label className="text-xs font-bold text-slate-800">▾ Fourchette de Prix (TTC)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Prix MIN"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#e52e2d]"
              />
              <input
                type="number"
                placeholder="Prix MAX"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#e52e2d]"
              />
            </div>
          </div>

          {/* Équipementiers / Brands Filter */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-2">
            <label className="text-xs font-bold text-slate-800">▾ Équipementiers & Marques</label>
            <input
              type="text"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="Chercher marque (Bosch, Valeo...)"
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#e52e2d]"
            />
            <div className="max-h-56 overflow-y-auto space-y-1.5 pt-1 text-xs pr-1">
              {availableBrands
                .filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase()))
                .map((brand) => {
                  const isChecked = selectedBrands.includes(brand);
                  return (
                    <label
                      key={brand}
                      className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleBrand(brand)}
                        className="rounded text-[#e52e2d] focus:ring-[#e52e2d]"
                      />
                      <span className={isChecked ? 'font-bold text-slate-900' : 'text-slate-700'}>
                        {brand}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>
        </aside>

        {/* =========================================
            RIGHT MAIN PRODUCT LISTING
           ========================================= */}
        <main className="lg:col-span-9 space-y-4 sm:space-y-5">
          {/* Mobile Filter Toggle Drawer (shown on mobile when toggled) */}
          {/* Mobile Filter Sheet Modal (< lg) */}
          {isMobileFiltersOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-5 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Filter className="w-4 h-4 text-[#e52e2d]" />
                    <span>Filtres de recherche & Familles</span>
                  </div>
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 px-2.5 py-1 bg-slate-100 rounded-lg cursor-pointer"
                  >
                    ✕ Fermer
                  </button>
                </div>

                {/* Mobile Famille Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Famille de pièces :
                  </label>
                  <select
                    value={selectedFamily}
                    onChange={(e) => setSelectedFamily(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Toutes les familles">Toutes les familles</option>
                    {familiesList.map((fam) => (
                      <option key={fam} value={fam}>{fam}</option>
                    ))}
                  </select>
                </div>

                {/* Mobile Price Range */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Fourchette de Prix TTC (DH) :
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min DH"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="p-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
                    />
                    <input
                      type="number"
                      placeholder="Max DH"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="p-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
                    />
                  </div>
                </div>

                {/* Mobile Marques Checkbox List */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Marques & Équipementiers :
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
                    {availableBrands.map((brand) => {
                      const isChecked = selectedBrands.includes(brand);
                      return (
                        <label
                          key={brand}
                          className="flex items-center gap-2 p-1.5 rounded text-xs select-none hover:bg-white cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBrand(brand)}
                            className="rounded text-[#e52e2d] focus:ring-[#e52e2d]"
                          />
                          <span className={isChecked ? 'font-bold text-slate-900' : 'text-slate-700'}>
                            {brand}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Action row in mobile filters */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFamily('Toutes les familles');
                      setSelectedBrands([]);
                      setPriceMin('');
                      setPriceMax('');
                    }}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Réinitialiser tout
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="px-5 py-2.5 bg-[#e52e2d] active:bg-[#c82322] text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Appliquer ({filteredProducts.length} pièces)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header Row: Title, Stock Filters, Toggle & Mobile Filter Button */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Title & Mobile Filter Trigger */}
              <div className="flex items-center justify-between">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-baseline">
                  <span className="border-b-2 border-[#e52e2d] pb-0.5">Pièces</span>
                  <span className="ml-1.5 text-slate-600 font-bold text-base sm:text-xl">en catalogue</span>
                </h1>

                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                  className={`lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    isMobileFiltersOpen || selectedFamily !== 'Toutes les familles' || selectedBrands.length > 0 || priceMin || priceMax
                      ? 'bg-red-50 text-[#e52e2d] border-red-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200 active:bg-slate-200'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filtres</span>
                  {(selectedFamily !== 'Toutes les familles' || selectedBrands.length > 0 || priceMin || priceMax) && (
                    <span className="w-2 h-2 rounded-full bg-[#e52e2d]"></span>
                  )}
                </button>
              </div>

              {/* Stock Filter Segment: Responsive for Mobile and Desktop */}
              <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] sm:text-xs font-semibold w-full sm:w-auto">
                <button
                  onClick={() => setStockFilter('all')}
                  className={`flex items-center justify-center gap-1 py-1.5 px-1 sm:px-3 rounded-md transition-all cursor-pointer text-center truncate ${
                    stockFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">Tous ({products.length})</span>
                </button>

                <button
                  onClick={() => setStockFilter('in_stock')}
                  className={`flex items-center justify-center gap-1 py-1.5 px-1 sm:px-3 rounded-md transition-all cursor-pointer text-center truncate ${
                    stockFilter === 'in_stock'
                      ? 'bg-[#e52e2d] text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Stock ({inStockCount})</span>
                </button>

                <button
                  onClick={() => setStockFilter('out_of_stock')}
                  className={`flex items-center justify-center gap-1 py-1.5 px-1 sm:px-3 rounded-md transition-all cursor-pointer text-center truncate ${
                    stockFilter === 'out_of_stock'
                      ? 'bg-[#e52e2d] text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Rupture ({outOfStockCount})</span>
                </button>
              </div>
            </div>

            {/* Results count & Liste/Grille toggle row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div className="font-extrabold text-slate-700 tracking-tight text-[11px] sm:text-xs">
                {filteredProducts.length.toLocaleString('fr-FR')} Articles affichés
              </div>

              {/* Liste / Grille Toggles */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                    viewMode === 'list'
                      ? 'bg-[#e52e2d] text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Liste</span>
                </button>

                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                    viewMode === 'grid'
                      ? 'bg-[#e52e2d] text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Grille</span>
                </button>
              </div>
            </div>
          </div>

          {/* Empty State for when catalogue is empty or filtered */}
          {filteredProducts.length === 0 && (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center space-y-4 shadow-2xs">
              <div className="w-16 h-16 bg-red-50 text-[#e52e2d] rounded-full flex items-center justify-center mx-auto">
                <Boxes className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Votre catalogue est prêt pour vos vrais produits
                </h3>
                <p className="text-xs text-slate-500">
                  Tous les produits virtuels ont été supprimés. Les nouvelles pièces que vous ajoutez sont directement enregistrées et disponibles dans votre catalogue.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={onOpenAddModal}
                  className="px-5 py-2.5 bg-[#e52e2d] hover:bg-[#c82322] text-white font-extrabold text-xs rounded-lg shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Ajouter un Produit Réel</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              GRID VIEW (Screenshot 2 - The exact 5-column product cards with Admin stock manager)
             ======================================================== */}
          {viewMode === 'grid' && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((p) => {
                const saleQty = getSaleQty(p.id);
                const isOutOfStock = p.status === 'out_of_stock';
                const isEditingPrice = editingPriceId === p.id;

                return (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow relative"
                  >
                    <div>
                      {/* Top Brand Tag, Modifier & Supprimer buttons */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded shrink-0">
                          {p.brand}
                        </span>
                        {isAdmin && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setEditingProduct(p)}
                              className="px-2 py-1 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                              title="Modifier ce produit (Prix, stock, infos, photo)"
                            >
                              <Pencil className="w-3 h-3 text-amber-600" />
                              <span>Modifier</span>
                            </button>
                            <button
                              onClick={() => setDeletingProduct(p)}
                              className="px-2 py-1 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                              title="Supprimer la référence du catalogue"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Product Image & Right Icon Strip */}
                      <div className="relative bg-white border border-slate-100 rounded-md p-2 flex items-center justify-center min-h-[140px] group">
                        <ProductThumb imageType={p.imageType} brand={p.brand} imageUrl={p.imageUrl} className="w-32 h-32" />

                        {/* Quick Camera Upload Button */}
                        {isAdmin && onUpdateProductImage && (
                          <label
                            className="absolute left-2 bottom-2 p-1.5 bg-white/90 hover:bg-white text-slate-500 hover:text-[#e52e2d] rounded-md shadow-xs border border-slate-200 cursor-pointer transition-all hover:scale-105"
                            title={p.imageUrl ? "Modifier la photo de cette pièce" : "Ajouter une photo à cette pièce"}
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadCardImage(p.id, e)}
                            />
                          </label>
                        )}

                        {/* Floating Action Icons on right of image */}
                        {isAdmin && (
                          <div className="absolute right-2 top-2 flex flex-col gap-1.5 text-slate-500">
                            <button
                              onClick={() => onAddToCart(p, 1)}
                              className="p-1 hover:text-[#e52e2d] hover:bg-slate-50 rounded"
                              title="Sortie rapide de stock"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStockDelta(p, 5)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded text-[10px] font-bold"
                              title="Ajouter +5 au stock"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handleStockDelta(p, 10)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded text-[10px] font-bold"
                              title="Ajouter +10 au stock"
                            >
                              +10
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Product Title */}
                      <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-tight mt-3 line-clamp-1">
                        {p.title}
                      </h2>

                      {/* Reference line with red OEM and copy icon (Screenshot 2) */}
                      <div className="flex items-center gap-1.5 text-xs mt-1">
                        <span className="font-bold text-slate-900 font-mono">{p.ref}</span>
                        <span className="text-[#e52e2d] font-semibold font-mono text-[11px]">{p.oemRef}</span>
                        <button
                          onClick={() => handleCopy(p.ref)}
                          className="text-slate-400 hover:text-slate-800"
                          title="Copier la référence"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {copiedRef === p.ref && (
                          <span className="text-[10px] text-emerald-600 font-bold">Copié!</span>
                        )}
                      </div>

                      {/* Pricing Display: Confidential 3-tier breakdown for Admin, Public price for Visitors */}
                      {isAdmin ? (
                        <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200/90 rounded-lg space-y-2">
                          {/* Top: Buying breakdown (Prix Initial & Remise) */}
                          <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-slate-200/80 text-[11px]">
                            <div>
                              <span className="text-slate-500 block text-[10px] font-semibold">1. Prix Initial (Catalogue)</span>
                              <span className="font-mono font-bold text-slate-700">
                                {p.initialPriceMAD
                                  ? `${p.initialPriceMAD.toFixed(2)} MAD`
                                  : p.costPriceMAD
                                  ? `${(p.costPriceMAD * 1.5).toFixed(2)} MAD`
                                  : `${(p.priceMAD * 1.3).toFixed(2)} MAD`}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-500 block text-[10px] font-semibold">2. Remise Achat</span>
                              {p.discountPercent !== undefined && p.discountPercent > 0 ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                                  <Percent className="w-2.5 h-2.5" />
                                  <span>-{p.discountPercent}%</span>
                                </span>
                              ) : p.costPriceMAD && p.costPriceMAD < p.priceMAD ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                                  <span>~35% à 42%</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">Net fournisseur</span>
                              )}
                            </div>
                          </div>

                          {/* Middle: Prix Achat Réel Net Payé */}
                          <div className="flex items-center justify-between text-[11px] pt-0.5">
                            <span className="text-slate-600 font-semibold flex items-center gap-1">
                              <span>💼 Prix Achat (Shrito ana) :</span>
                            </span>
                            <span className="font-mono font-black text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {(p.costPriceMAD || p.priceMAD * 0.65).toFixed(2)} MAD
                            </span>
                          </div>

                          {/* Bottom: Prix Vente Client Final + Net Profit */}
                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                                <span>🛒 Vente Client Final</span>
                                <span className="text-[9px] text-slate-400 font-normal">TTC</span>
                              </div>
                              {isEditingPrice ? (
                                <div className="flex items-center gap-1 mt-1">
                                  <input
                                    type="number"
                                    value={tempPrice}
                                    onChange={(e) => setTempPrice(parseFloat(e.target.value) || 0)}
                                    className="w-24 px-1.5 py-0.5 text-sm font-bold font-mono border border-slate-300 rounded bg-white"
                                  />
                                  <button
                                    onClick={() => {
                                      onUpdateProductStock(p.id, p.stockQuantity, tempPrice);
                                      setEditingPriceId(null);
                                    }}
                                    className="px-2 py-0.5 bg-emerald-600 text-white rounded text-xs font-bold cursor-pointer"
                                  >
                                    OK
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => {
                                    setEditingPriceId(p.id);
                                    setTempPrice(p.priceMAD);
                                  }}
                                  className="text-lg font-black text-slate-900 font-mono tabular-nums tracking-tight cursor-pointer hover:text-[#e52e2d] transition-colors"
                                  title="Cliquer pour modifier le prix"
                                >
                                  {p.priceMAD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD
                                </div>
                              )}
                            </div>

                            {/* Profit margin badge */}
                            {(() => {
                              const cost = p.costPriceMAD || p.priceMAD * 0.65;
                              const marginMAD = p.priceMAD - cost;
                              const marginPct = cost > 0 ? Math.round((marginMAD / cost) * 100) : 0;
                              return marginMAD > 0 ? (
                                <div className="text-right">
                                  <span className="text-[9px] text-slate-500 block font-semibold">Marge Bénéfice</span>
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100/90 text-emerald-800 border border-emerald-300 font-mono">
                                    +{marginMAD.toFixed(2)} DH (+{marginPct}%)
                                  </span>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      ) : (
                        /* PUBLIC CLIENT PRICE (No sensitive costs or margins shown) */
                        <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Prix Client (TTC)
                            </span>
                            <div className="text-xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                              {p.priceMAD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-extrabold ${
                              p.stockQuantity > 0
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {p.stockQuantity > 0 ? `En Stock (${p.stockQuantity})` : 'Sur Commande'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Prominent Stock Badge */}
                      <div className="mt-2.5">
                        {p.status === 'in_stock' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#ecfdf5] text-[#059669] border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>EN STOCK : {p.stockQuantity} UNITÉS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#fef2f2] text-[#dc2626] border border-red-200">
                            <XCircle className="w-4 h-4" />
                            <span>RUPTURE DE STOCK (0)</span>
                          </span>
                        )}
                      </div>

                      {/* Direct Stock Modifier Bar (ADMIN ONLY) */}
                      {isAdmin && (
                        <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">Ajuster Stock :</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStockDelta(p, -1)}
                              className="w-8 h-8 sm:w-7 sm:h-7 bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 rounded text-slate-800 font-bold flex items-center justify-center cursor-pointer shadow-2xs"
                              title="Diminuer stock (-1)"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={p.stockQuantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                onUpdateProductStock(p.id, Math.max(0, val));
                              }}
                              className="w-12 py-1 text-center font-mono font-black text-sm bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#e52e2d]"
                            />
                            <button
                              onClick={() => handleStockDelta(p, 1)}
                              className="w-8 h-8 sm:w-7 sm:h-7 bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 rounded text-slate-800 font-bold flex items-center justify-center cursor-pointer shadow-2xs"
                              title="Augmenter stock (+1)"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action: Sortie de stock / Vente Comptoir */}
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <button
                        onClick={() => onAddToCart(p, 1)}
                        className="w-full py-2.5 px-3 min-h-[38px] rounded-lg font-bold text-xs text-white bg-[#e52e2d] hover:bg-[#c82322] active:bg-[#a71d1c] transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>{isAdmin ? 'Enregistrer Sortie / Vente' : 'Ajouter à la commande'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========================================================
              LIST VIEW (Screenshot 1 - The exact horizontal layout with specs & Admin stock controls)
             ======================================================== */}
          {viewMode === 'list' && filteredProducts.length > 0 && (
            <div className="space-y-4">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                      {p.brand}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="px-2.5 py-1 text-xs font-extrabold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        title="Modifier cet article"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-600" />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => setDeletingProduct(p)}
                        className="px-2.5 py-1 text-xs font-extrabold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        title="Supprimer cet article"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Product Image & Details */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="relative bg-white border border-slate-100 rounded-lg p-2 flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 shrink-0 group self-center sm:self-auto">
                        <ProductThumb imageType={p.imageType} brand={p.brand} imageUrl={p.imageUrl} className="w-20 h-20 sm:w-24 sm:h-24" />
                        {onUpdateProductImage && (
                          <label
                            className="absolute left-1.5 bottom-1.5 p-1 bg-white/90 hover:bg-white text-slate-500 hover:text-[#e52e2d] rounded shadow-xs border border-slate-200 cursor-pointer transition-all hover:scale-105"
                            title={p.imageUrl ? "Modifier la photo de cette pièce" : "Ajouter une photo"}
                          >
                            <Camera className="w-3 h-3" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadCardImage(p.id, e)}
                            />
                          </label>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0 w-full">
                        <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase">
                          {p.title}
                        </h2>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-900 font-mono">{p.ref}</span>
                          <span className="text-[#e52e2d] font-semibold font-mono text-[11px]">{p.oemRef}</span>
                          <button onClick={() => handleCopy(p.ref)} className="text-slate-400 hover:text-slate-800 p-0.5">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* PRICING DISPLAY IN LIST VIEW */}
                        {isAdmin ? (
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 pt-1 text-[11px]">
                            <div className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              <span className="text-slate-500 font-semibold mr-1">1. Prix Initial:</span>
                              <span className="font-mono font-bold">
                                {p.initialPriceMAD
                                  ? `${p.initialPriceMAD.toFixed(2)} MAD`
                                  : p.costPriceMAD
                                  ? `${(p.costPriceMAD * 1.5).toFixed(2)} MAD`
                                  : `${(p.priceMAD * 1.3).toFixed(2)} MAD`}
                              </span>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-blue-700 font-mono font-bold flex items-center gap-1">
                              <Percent className="w-2.5 h-2.5" />
                              <span>Remise: {p.discountPercent ? `-${p.discountPercent}%` : '~35%'}</span>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-800">
                              <span className="text-slate-500 font-semibold mr-1">💼 Achat:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {(p.costPriceMAD || p.priceMAD * 0.65).toFixed(2)} MAD
                              </span>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded font-black text-emerald-800 font-mono">
                              <span className="text-emerald-600 font-semibold mr-1">🛒 Vente:</span>
                              <span>{p.priceMAD.toFixed(2)} MAD</span>
                            </div>

                            {(() => {
                              const cost = p.costPriceMAD || p.priceMAD * 0.65;
                              const marginMAD = p.priceMAD - cost;
                              const marginPct = cost > 0 ? Math.round((marginMAD / cost) * 100) : 0;
                              return marginMAD > 0 ? (
                                <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                                  Marge: +{marginMAD.toFixed(2)} DH (+{marginPct}%)
                                </span>
                              ) : null;
                            })()}
                          </div>
                        ) : (
                          /* Public Visitor / Client price in list view */
                          <div className="flex items-center gap-2 pt-1 text-xs">
                            <span className="text-slate-500 font-semibold text-xs">Prix TTC :</span>
                            <span className="text-base font-black text-slate-900 font-mono">
                              {p.priceMAD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD
                            </span>
                          </div>
                        )}

                        {/* Stock badge */}
                        <div className="pt-0.5">
                          {p.status === 'in_stock' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#ecfdf5] text-[#059669]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>EN STOCK : {p.stockQuantity} UNITÉS</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#fef2f2] text-[#dc2626]">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>RUPTURE DE STOCK (0)</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Direct Stock Adjuster & Sortie Button */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-2.5 shrink-0 pt-2 border-t lg:border-t-0 border-slate-100">
                      {isAdmin && (
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between sm:justify-start gap-2 text-xs">
                          <span className="font-bold text-slate-700 text-xs">Stock :</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStockDelta(p, -1)}
                              className="w-8 h-8 sm:w-7 sm:h-7 bg-white border border-slate-300 rounded font-bold cursor-pointer active:bg-slate-100"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={p.stockQuantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                onUpdateProductStock(p.id, Math.max(0, val));
                              }}
                              className="w-14 py-1 text-center font-mono font-black text-sm bg-white border border-slate-300 rounded"
                            />
                            <button
                              onClick={() => handleStockDelta(p, 1)}
                              className="w-8 h-8 sm:w-7 sm:h-7 bg-white border border-slate-300 rounded font-bold cursor-pointer active:bg-slate-100"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => onAddToCart(p, 1)}
                        className="py-2.5 px-4 min-h-[38px] rounded-lg font-bold text-xs text-white bg-[#e52e2d] active:bg-[#c82322] flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isAdmin ? 'Sortie Stock / Facturer' : 'Ajouter à la commande'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Technical Specifications (Screenshot 1) */}
                  {p.specs && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600">
                      {p.specs}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          isOpen={!!editingProduct}
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={async (updated) => {
            if (onUpdateProduct) {
              await onUpdateProduct(updated);
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <DeleteConfirmModal
          isOpen={!!deletingProduct}
          product={deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onConfirmDelete={async (productId) => {
            await onDeleteProduct(productId);
          }}
        />
      )}
    </div>
  );
};
