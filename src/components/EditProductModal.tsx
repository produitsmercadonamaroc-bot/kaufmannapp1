import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Upload, Link as LinkIcon, Trash2, Camera, AlertCircle, Loader2, Check } from 'lucide-react';
import { AutoProduct } from '../types';
import { ProductThumb } from './ProductThumb';

interface EditProductModalProps {
  isOpen: boolean;
  product: AutoProduct | null;
  onClose: () => void;
  onSave: (updatedProduct: AutoProduct) => Promise<void> | void;
}

const COMMON_BRANDS = [
  'LIQUI MOLY',
  'WIX',
  'HENGST',
  'FRI.TECH',
  'BOSCH',
  'VALEO',
  'MANN-FILTER',
  'PURFLUX',
  'CASTROL',
  'MOTUL',
  'TOTAL',
  'FERODO',
  'BREMBO',
  'SKF',
  'GATES',
  'AUTRE',
];

const COMMON_FAMILIES = [
  'Additifs & Traitements',
  'Huiles & Lubrifiants',
  'Refroidissement & Antigel',
  'Filtre à air',
  'Filtre à carburant',
  'Filtre à huile',
  "Filtre air d'habitacle",
  'Disques de frein',
  'Plaquettes de frein',
  'Alternateurs & Démarreurs',
  'Batteries',
  "Balais d'essuie-glace",
  'Pièces Moteur & Filtration',
];

/**
 * Compresses image file to ~600x600 JPEG (~30-60KB) to stay comfortably within Firestore limits
 */
const compressImageFile = (file: File, maxDim = 600, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
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
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  product,
  onClose,
  onSave,
}) => {
  const [ref, setRef] = useState('');
  const [oemRef, setOemRef] = useState('');
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('LIQUI MOLY');
  const [customBrand, setCustomBrand] = useState('');
  const [family, setFamily] = useState('Additifs & Traitements');
  const [customFamily, setCustomFamily] = useState('');
  const [initialPriceMAD, setInitialPriceMAD] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [priceMAD, setPriceMAD] = useState<number>(0);
  const [costPriceMAD, setCostPriceMAD] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [specs, setSpecs] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [isCompressing, setIsCompressing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setRef(product.ref || '');
      setOemRef(product.oemRef || '');
      setTitle(product.title || '');
      if (COMMON_BRANDS.includes(product.brand)) {
        setBrand(product.brand);
        setCustomBrand('');
      } else {
        setBrand('AUTRE');
        setCustomBrand(product.brand || '');
      }

      if (COMMON_FAMILIES.includes(product.family)) {
        setFamily(product.family);
        setCustomFamily('');
      } else {
        setFamily('AUTRE');
        setCustomFamily(product.family || '');
      }

      setInitialPriceMAD(product.initialPriceMAD || 0);
      setDiscountPercent(product.discountPercent || 0);
      setPriceMAD(product.priceMAD || 0);
      setCostPriceMAD(product.costPriceMAD || 0);
      setStockQuantity(product.stockQuantity || 0);
      setSpecs(product.specs || '');
      setImageUrl(product.imageUrl || '');
      setImageError(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).');
      return;
    }

    try {
      setIsCompressing(true);
      setImageError(null);
      const compressedData = await compressImageFile(file);
      setImageUrl(compressedData);
    } catch (err) {
      setImageError('Erreur de traitement de l\'image.');
      console.error(err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !ref.trim()) {
      alert('Veuillez renseigner au moins la Référence et la Désignation du produit.');
      return;
    }

    const finalBrand = brand === 'AUTRE' ? customBrand.trim() || 'DIVERS' : brand;
    const finalFamily = family === 'AUTRE' ? customFamily.trim() || 'Pièces Diverses' : family;
    const safeStock = Math.max(0, Number(stockQuantity) || 0);

    const updatedProduct: AutoProduct = {
      ...product,
      ref: ref.trim(),
      oemRef: oemRef.trim() || ref.trim(),
      title: title.trim(),
      brand: finalBrand,
      family: finalFamily,
      initialPriceMAD: Number(initialPriceMAD) || undefined,
      discountPercent: Number(discountPercent) || undefined,
      priceMAD: Number(priceMAD) || 0,
      costPriceMAD: Number(costPriceMAD) || 0,
      stockQuantity: safeStock,
      status: safeStock > 0 ? 'in_stock' : 'out_of_stock',
      specs: specs.trim(),
      imageUrl: imageUrl.trim() || undefined,
    };

    setIsSaving(true);
    try {
      await onSave(updatedProduct);
      onClose();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-black">
              ✏️
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                <span>Modifier le Produit</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  {product.ref}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Mettre à jour les informations, prix, stock ou photo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Reference & OEM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Référence Article <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="Ex: 7180/250ML"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#e52e2d] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Référence Fabricant / OEM
              </label>
              <input
                type="text"
                value={oemRef}
                onChange={(e) => setOemRef(e.target.value)}
                placeholder="Ex: LM-7180"
                className="w-full px-3 py-2 text-xs font-mono font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#e52e2d] focus:bg-white"
              />
            </div>
          </div>

          {/* Designation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Désignation / Nom complet du Produit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: ADDITIF DIESEL PROTECTION FILTRE A PARTICULES LM 250ML"
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#e52e2d] focus:bg-white"
            />
          </div>

          {/* Brand & Family */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Marque
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#e52e2d] focus:bg-white"
              >
                {COMMON_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {brand === 'AUTRE' && (
                <input
                  type="text"
                  placeholder="Tapez le nom de la marque..."
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Famille / Catégorie
              </label>
              <select
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#e52e2d] focus:bg-white"
              >
                {COMMON_FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
                <option value="AUTRE">Autre catégorie...</option>
              </select>
              {family === 'AUTRE' && (
                <input
                  type="text"
                  placeholder="Tapez la famille de produit..."
                  value={customFamily}
                  onChange={(e) => setCustomFamily(e.target.value)}
                  className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                />
              )}
            </div>
          </div>

          {/* 4-Step Pricing Structure & Stock */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>💰 Structure des Prix & Remises Fournisseur</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Calcul automatique de la marge nette
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Prix Initial (Prix Catalogue avant remise) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Prix Initial Brut (MAD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="ex: 134.48"
                    value={initialPriceMAD || ''}
                    onChange={(e) => {
                      const initial = parseFloat(e.target.value) || 0;
                      setInitialPriceMAD(initial);
                      if (initial > 0 && discountPercent > 0) {
                        const calculatedCost = Math.round(initial * (1 - discountPercent / 100) * 100) / 100;
                        setCostPriceMAD(calculatedCost);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#e52e2d]"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-slate-400">
                    DH
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Prix catalogue de base</span>
              </div>

              {/* 2. Remise Achat Fournisseur (%) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    2. Remise Achat (%)
                  </label>
                  {/* Quick percentage buttons for 35% & 42% */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountPercent(35);
                        if (initialPriceMAD > 0) {
                          setCostPriceMAD(Math.round(initialPriceMAD * 0.65 * 100) / 100);
                        }
                      }}
                      className="px-1.5 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-700 hover:bg-blue-200 rounded cursor-pointer"
                    >
                      35%
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountPercent(42);
                        if (initialPriceMAD > 0) {
                          setCostPriceMAD(Math.round(initialPriceMAD * 0.58 * 100) / 100);
                        }
                      }}
                      className="px-1.5 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-700 hover:bg-blue-200 rounded cursor-pointer"
                    >
                      42%
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="35 ou 42"
                    value={discountPercent || ''}
                    onChange={(e) => {
                      const disc = parseFloat(e.target.value) || 0;
                      setDiscountPercent(disc);
                      if (initialPriceMAD > 0 && disc > 0) {
                        const calculatedCost = Math.round(initialPriceMAD * (1 - disc / 100) * 100) / 100;
                        setCostPriceMAD(calculatedCost);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-blue-700 focus:outline-none focus:border-[#e52e2d]"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-slate-400">
                    %
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Taux de remise</span>
              </div>

              {/* 3. Prix Achat Net Payé (bshhal shrito ana) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Prix Achat Net Payé
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="ex: 78.00"
                    value={costPriceMAD || ''}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      setCostPriceMAD(cost);
                      if (initialPriceMAD > 0 && cost > 0 && cost < initialPriceMAD) {
                        const discount = Math.round(((initialPriceMAD - cost) / initialPriceMAD) * 1000) / 10;
                        setDiscountPercent(discount);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#e52e2d]"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-slate-400">
                    DH
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Bshhal shrito ana</span>
              </div>

              {/* 4. Prix Vente Client Final (TTC) */}
              <div>
                <label className="block text-xs font-bold text-emerald-800 mb-1">
                  4. Prix Vente Client <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={priceMAD || ''}
                    onChange={(e) => setPriceMAD(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono font-black bg-white border-2 border-emerald-500 rounded-lg text-emerald-900 focus:outline-none focus:border-emerald-600"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-emerald-600">
                    DH TTC
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Bshhal kanbi3 l client</span>
              </div>
            </div>

            {/* Profit margin banner & stock quantity */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Profit margin calculation */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Bénéfice estimé :</span>
                {(() => {
                  const cost = costPriceMAD || 0;
                  const sale = priceMAD || 0;
                  const profit = sale - cost;
                  const pct = cost > 0 ? Math.round((profit / cost) * 100) : 0;
                  if (sale > 0 && cost > 0) {
                    return (
                      <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-md border ${
                        profit >= 0
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {profit >= 0 ? `+${profit.toFixed(2)} MAD (+${pct}%)` : `${profit.toFixed(2)} MAD (${pct}%)`}
                      </span>
                    );
                  }
                  return <span className="text-xs text-slate-400">Renseignez prix d'achat et de vente</span>;
                })()}
              </div>

              {/* Stock quantity input */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 shrink-0">
                  Unités en Stock <span className="text-red-500">*</span>:
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStockQuantity((prev) => Math.max(0, prev - 1))}
                    className="w-8 h-8 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-black text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 px-2 py-1 text-center text-xs font-mono font-black bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#e52e2d]"
                  />
                  <button
                    type="button"
                    onClick={() => setStockQuantity((prev) => prev + 1)}
                    className="w-8 h-8 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-black text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Conditionnement / Specs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Conditionnement / Spécifications
            </label>
            <input
              type="text"
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              placeholder="Ex: PU x 20 • Flacon 250ml • Additif FAP"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#e52e2d] focus:bg-white"
            />
          </div>

          {/* Image & Photo Management */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#e52e2d]" />
                <span>Photo du Produit</span>
              </label>

              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    imageInputMode === 'upload'
                      ? 'bg-[#e52e2d] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fichier / Caméra
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    imageInputMode === 'url'
                      ? 'bg-[#e52e2d] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lien URL
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Preview Thumbnail */}
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 relative shrink-0 shadow-2xs">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt="Aperçu"
                      className="w-full h-full object-contain rounded"
                      onError={() => setImageError('Impossible de charger l\'image spécifiée')}
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center shadow hover:bg-red-700"
                      title="Supprimer la photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <ProductThumb
                    imageType={product.imageType}
                    brand={brand === 'AUTRE' ? customBrand : brand}
                    className="w-16 h-16"
                  />
                )}
              </div>

              {/* Upload or URL Inputs */}
              <div className="flex-1 space-y-2">
                {imageInputMode === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      disabled={isCompressing}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-white border border-dashed border-slate-300 hover:border-[#e52e2d] rounded-lg text-xs font-bold text-slate-700 hover:text-[#e52e2d] flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
                    >
                      {isCompressing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#e52e2d]" />
                          <span>Compression de l'image...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-[#e52e2d]" />
                          <span>Choisir une photo / Prendre avec caméra</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Les images sont automatiquement compressées et optimisées.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://exemple.com/image.jpg"
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#e52e2d]"
                      />
                    </div>
                  </div>
                )}

                {imageError && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{imageError}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#e52e2d] hover:bg-[#c82322] text-white font-extrabold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Enregistrer les Modifications</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
