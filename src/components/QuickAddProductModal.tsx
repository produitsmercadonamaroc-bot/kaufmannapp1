import React, { useState, useRef } from 'react';
import { X, Save, Upload, Link as LinkIcon, Trash2, Camera, Check, AlertCircle, Loader2 } from 'lucide-react';
import { AutoProduct } from '../types';
import { ProductThumb } from './ProductThumb';

interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: AutoProduct) => void;
}

// Map family name to default SVG illustration
const mapFamilyToImageType = (fam: string): string => {
  switch (fam) {
    case 'Filtre à air':
    case "Filtre air d'habitacle":
      return 'filtre_air';
    case 'Filtre à carburant':
      return 'filtre_gasoil';
    case 'Filtre à huile':
      return 'filtre_huile';
    case 'Disques de frein':
    case 'Plaquettes de frein':
      return 'disque';
    case 'Alternateurs & Démarreurs':
      return 'alternateur';
    case 'Batteries':
      return 'batterie';
    case "Balais d'essuie-glace":
      return 'balais';
    case 'Huiles & Lubrifiants':
    default:
      return 'liquide';
  }
};

/**
 * Compresses an image file using an offscreen canvas to ~600x600 JPEG.
 * This guarantees the base64 string is only ~30-60KB, well below Firestore 1MB limits.
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

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
}) => {
  const [brand, setBrand] = useState('BOSCH');
  const [title, setTitle] = useState('');
  const [ref, setRef] = useState('');
  const [oemRef, setOemRef] = useState('');
  const [initialPriceMAD, setInitialPriceMAD] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(35);
  const [costPriceMAD, setCostPriceMAD] = useState<number>(0);
  const [priceMAD, setPriceMAD] = useState<number>(250);
  const [stockQuantity, setStockQuantity] = useState<number>(5);
  const [family, setFamily] = useState('Filtre à air');

  // Image states
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [isCompressing, setIsCompressing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentImageType = mapFamilyToImageType(family);

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
      console.warn('Erreur compression image:', err);
      setImageError("Impossible de traiter cette image. Réessayez avec une autre photo.");
    } finally {
      setIsCompressing(false);
      // Reset input value so same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearImage = () => {
    setImageUrl('');
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !ref.trim()) {
      alert('Veuillez renseigner le nom et la référence de la pièce.');
      return;
    }

    const calculatedCost = costPriceMAD > 0
      ? costPriceMAD
      : initialPriceMAD > 0 && discountPercent > 0
      ? Math.round(initialPriceMAD * (1 - discountPercent / 100) * 100) / 100
      : Math.round(Number(priceMAD) * 0.65 * 100) / 100;

    const newProd: AutoProduct = {
      id: `prod-${Date.now()}`,
      brand: brand.trim().toUpperCase(),
      title: title.trim().toUpperCase(),
      ref: ref.trim(),
      oemRef: oemRef.trim() ? `(${oemRef.trim()})` : `(${ref.trim()})`,
      initialPriceMAD: Number(initialPriceMAD) || undefined,
      discountPercent: Number(discountPercent) || undefined,
      costPriceMAD: calculatedCost,
      priceMAD: Number(priceMAD) || 0,
      stockQuantity: Number(stockQuantity) || 0,
      status: Number(stockQuantity) > 0 ? 'in_stock' : 'out_of_stock',
      family,
      categoryGroup: 'Pièces Auto',
      substitutes: 'Aucun substitut',
      imageType: currentImageType,
      imageUrl: imageUrl.trim() || undefined,
      specs: `Libellé: ${title.trim().toUpperCase()} Marque: ${brand.trim().toUpperCase()} Réf: ${ref.trim()}`,
      compatibleVehicles: ['PEUGEOT', 'DACIA', 'RENAULT'],
    };

    onAddProduct(newProd);
    onClose();
    // Reset form fields
    setTitle('');
    setRef('');
    setOemRef('');
    setImageUrl('');
    setImageError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl my-6">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-[#e52e2d]">EL HAJI AUTO</span>
            <span className="text-xs text-slate-300">· Ajouter une Pièce au Stock & Catalogue</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Brand & Family */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Marque / Équipementier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="ex: BOSCH, VALEO, TOTAL..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold uppercase focus:border-[#e52e2d] focus:ring-1 focus:ring-[#e52e2d] focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Famille de pièce</label>
              <select
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium bg-white focus:border-[#e52e2d] focus:ring-1 focus:ring-[#e52e2d] focus:outline-none"
              >
                <option value="Filtre à air">Filtre à air</option>
                <option value="Filtre à carburant">Filtre à carburant</option>
                <option value="Filtre à huile">Filtre à huile</option>
                <option value="Filtre air d'habitacle">Filtre air d'habitacle</option>
                <option value="Disques de frein">Disques de frein</option>
                <option value="Plaquettes de frein">Plaquettes de frein</option>
                <option value="Alternateurs & Démarreurs">Alternateurs & Démarreurs</option>
                <option value="Batteries">Batteries</option>
                <option value="Balais d'essuie-glace">Balais d'essuie-glace</option>
                <option value="Huiles & Lubrifiants">Huiles & Lubrifiants</option>
                <option value="Amortisseurs & Suspension">Amortisseurs & Suspension</option>
                <option value="Embrayage">Embrayage</option>
              </select>
            </div>
          </div>

          {/* Designation */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Désignation de la pièce <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: FILTRE À AIR BOSCH DACIA LOGAN / PEUGEOT 208..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold uppercase focus:border-[#e52e2d] focus:ring-1 focus:ring-[#e52e2d] focus:outline-none"
            />
          </div>

          {/* References */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Référence pièce <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="ex: F 026 400 220"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:border-[#e52e2d] focus:ring-1 focus:ring-[#e52e2d] focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Référence OEM / Origine</label>
              <input
                type="text"
                value={oemRef}
                onChange={(e) => setOemRef(e.target.value)}
                placeholder="ex: 1444 TT / F.026.400.220"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[#e52e2d] focus:border-[#e52e2d] focus:ring-1 focus:ring-[#e52e2d] focus:outline-none"
              />
            </div>
          </div>

          {/* Full Pricing Structure: Prix Initial, Remise Achat, Prix Net & Vente Client */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="font-bold text-slate-800 text-[11px] uppercase">
                💰 Structure des Prix & Remises Fournisseur
              </span>
              <span className="text-[10px] text-slate-500">
                Calcul automatique de la marge
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Prix Initial Brut */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                  1. Prix Initial Brut (MAD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="ex: 100.00"
                  value={initialPriceMAD || ''}
                  onChange={(e) => {
                    const initial = parseFloat(e.target.value) || 0;
                    setInitialPriceMAD(initial);
                    if (initial > 0 && discountPercent > 0) {
                      setCostPriceMAD(Math.round(initial * (1 - discountPercent / 100) * 100) / 100);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-xs bg-white focus:outline-none focus:border-[#e52e2d]"
                />
              </div>

              {/* 2. Remise Achat (%) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 text-[11px]">2. Remise Achat (%)</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountPercent(35);
                        if (initialPriceMAD > 0) {
                          setCostPriceMAD(Math.round(initialPriceMAD * 0.65 * 100) / 100);
                        }
                      }}
                      className="px-1 py-0.2 text-[9px] font-bold bg-blue-100 text-blue-700 rounded cursor-pointer"
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
                      className="px-1 py-0.2 text-[9px] font-bold bg-blue-100 text-blue-700 rounded cursor-pointer"
                    >
                      42%
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  placeholder="35 ou 42"
                  value={discountPercent || ''}
                  onChange={(e) => {
                    const disc = parseFloat(e.target.value) || 0;
                    setDiscountPercent(disc);
                    if (initialPriceMAD > 0 && disc > 0) {
                      setCostPriceMAD(Math.round(initialPriceMAD * (1 - disc / 100) * 100) / 100);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-xs bg-white text-blue-700 focus:outline-none focus:border-[#e52e2d]"
                />
              </div>

              {/* 3. Prix Achat Net Payé */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                  3. Prix Achat (Shrito ana)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="ex: 65.00"
                  value={costPriceMAD || ''}
                  onChange={(e) => {
                    const cost = parseFloat(e.target.value) || 0;
                    setCostPriceMAD(cost);
                    if (initialPriceMAD > 0 && cost > 0 && cost < initialPriceMAD) {
                      setDiscountPercent(Math.round(((initialPriceMAD - cost) / initialPriceMAD) * 1000) / 10);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-xs bg-white text-slate-800 focus:outline-none focus:border-[#e52e2d]"
                />
              </div>
            </div>

            {/* Row 2: Prix Vente Client & Quantité en stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="font-bold text-emerald-800 block mb-1 text-xs">
                  4. Prix Vente Client Final (TTC) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={priceMAD}
                  onChange={(e) => setPriceMAD(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border-2 border-emerald-500 rounded-md font-mono font-black text-sm text-emerald-900 bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">
                  Quantité en stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono font-bold text-sm bg-white focus:outline-none focus:border-[#e52e2d]"
                />
              </div>
            </div>

            {/* Profit margin estimation */}
            {(() => {
              const cost = costPriceMAD || (initialPriceMAD > 0 && discountPercent > 0 ? initialPriceMAD * (1 - discountPercent / 100) : priceMAD * 0.65);
              const margin = priceMAD - cost;
              const pct = cost > 0 ? Math.round((margin / cost) * 100) : 0;
              return margin > 0 ? (
                <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-1.5 flex items-center justify-between">
                  <span>Marge nette calculée :</span>
                  <span className="font-bold font-mono">+{margin.toFixed(2)} MAD (+{pct}%)</span>
                </div>
              ) : null;
            })()}
          </div>

          {/* ========================================================
              PHOTO / IMAGE DE LA PIÈCE (Requested by User)
             ======================================================== */}
          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
                <Camera className="w-4 h-4 text-[#e52e2d]" />
                <span>Photo du produit</span>
                <span className="text-[10px] font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Optionnel
                </span>
              </div>

              {/* Mode switch (Fichier / URL) */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-md text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    imageInputMode === 'upload'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Fichier / Appareil</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    imageInputMode === 'url'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    <span>Lien URL</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Upload Zone or URL Input */}
            {imageInputMode === 'upload' ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="product-photo-file-input"
                />

                {!imageUrl && (
                  <label
                    htmlFor="product-photo-file-input"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-[#e52e2d] bg-white rounded-lg cursor-pointer transition-colors group"
                  >
                    {isCompressing ? (
                      <div className="flex flex-col items-center gap-1.5 text-slate-600 py-1">
                        <Loader2 className="w-6 h-6 animate-spin text-[#e52e2d]" />
                        <span className="font-semibold text-xs">Optimisation de l'image en cours...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-red-50 text-[#e52e2d] group-hover:scale-110 transition-transform flex items-center justify-center mb-1.5">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-800 text-xs">
                          Cliquez pour choisir une photo ou prenez-la en direct
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Format JPG, PNG, WEBP (compression automatique fluide)
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemple.com/images/piece-auto.jpg"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:border-[#e52e2d] focus:outline-none"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="p-2 text-slate-400 hover:text-red-600 rounded bg-white border border-slate-200"
                      title="Effacer le lien"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  Collez l'adresse d'une photo trouvée sur Google ou le catalogue fournisseur.
                </p>
              </div>
            )}

            {imageError && (
              <div className="flex items-center gap-1.5 p-2 bg-red-50 text-red-700 rounded text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            {/* Preview Box */}
            <div className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-lg">
              <div className="w-16 h-16 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden relative">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Aperçu pièce"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ProductThumb
                    imageType={currentImageType}
                    brand={brand}
                    className="w-14 h-14"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {imageUrl ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-[11px]">
                      <Check className="w-3.5 h-3.5" />
                      <span>Photo personnalisée prête</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      Cette photo apparaîtra sur la fiche article, la liste et vos factures.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 pt-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Supprimer la photo</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-700 text-[11px] block">
                      Aperçu par défaut : illustration {family}
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Si vous n'ajoutez pas de photo, l'icône technique standard sera utilisée automatiquement.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#e52e2d] hover:bg-[#c82322] text-white rounded-lg font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer la pièce</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
