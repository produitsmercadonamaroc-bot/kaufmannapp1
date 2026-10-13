import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileSpreadsheet,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  PackagePlus,
  ArrowRight,
  ListPlus,
  Table as TableIcon
} from 'lucide-react';
import { AutoProduct } from '../types';

interface BulkProductRow {
  id: string;
  ref: string;
  oemRef: string;
  title: string;
  brand: string;
  family: string;
  stockQuantity: number;
  initialPriceMAD: number;
  discountPercent: number;
  buyingPriceMAD: number;
  priceMAD: number;
  compatibleVehicles: string;
}

interface BulkAddProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProducts: (newProducts: AutoProduct[]) => Promise<void> | void;
}

const COMMON_BRANDS = [
  'WIX',
  'LIQUI MOLY',
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
  'AUTRE',
];

const COMMON_FAMILIES = [
  'Filtre à huile',
  'Filtre à air',
  'Filtre à carburant',
  "Filtre air d'habitacle",
  'Plaquettes de frein',
  'Disques de frein',
  'Huiles & Lubrifiants',
  'Additifs & Traitement',
  'Liquide de refroidissement',
  'Alternateurs & Démarreurs',
  'Batteries',
  'Autre',
];

const mapFamilyToImageType = (fam: string): string => {
  const f = fam.toLowerCase();
  if (f.includes('air') || f.includes('habitacle')) return 'filtre_air';
  if (f.includes('carbur') || f.includes('gasoil') || f.includes('essence')) return 'filtre_gasoil';
  if (f.includes('huile') && f.includes('filtre')) return 'filtre_huile';
  if (f.includes('frein') || f.includes('disque') || f.includes('plaquette')) return 'disque';
  if (f.includes('huile') || f.includes('lubrif') || f.includes('additif') || f.includes('antigel')) return 'liquide';
  return 'liquide';
};

const createEmptyRow = (customRef = ''): BulkProductRow => ({
  id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  ref: customRef,
  oemRef: '',
  title: '',
  brand: 'WIX',
  family: 'Filtre à huile',
  stockQuantity: 10,
  initialPriceMAD: 0,
  discountPercent: 35,
  buyingPriceMAD: 0,
  priceMAD: 0,
  compatibleVehicles: '',
});

/**
 * Parses freeform text pasted from invoices, Excel, or supplier notes.
 * Detects patterns like:
 * "WL7296 FILTRE A HUILE WIX GOLF 20 40,80"
 * or tab/semicolon/comma delimited rows
 */
function parseSmartText(text: string): BulkProductRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('---') && !l.toLowerCase().includes('stock\tquantit'));

  const parsedRows: BulkProductRow[] = [];

  let currentBlockRef = '';
  let currentBlockTitle = '';
  let currentBlockStock: number | null = null;
  let currentBlockPrice: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is CSV / TSV format
    if (line.includes('\t') || (line.includes(';') && line.split(';').length >= 3)) {
      const parts = line.includes('\t') ? line.split('\t') : line.split(';');
      const cleanParts = parts.map((p) => p.trim());
      
      // Attempt extract: [Ref, Title, Stock, Price, Brand]
      if (cleanParts.length >= 2) {
        const ref = cleanParts[0].replace(/[\(\)]/g, '');
        const title = cleanParts[1];
        const stock = parseInt(cleanParts[2]?.replace(/\D/g, '') || '10', 10) || 10;
        const priceStr = (cleanParts[3] || '').replace('MAD', '').replace(',', '.').replace(/\s/g, '');
        const price = parseFloat(priceStr) || 0;
        const brand = cleanParts[4] || guessBrand(title) || 'WIX';

        if (ref && title) {
          parsedRows.push({
            ...createEmptyRow(),
            ref,
            title,
            brand,
            family: guessFamily(title),
            stockQuantity: stock,
            priceMAD: price,
            buyingPriceMAD: Math.round(price * 0.75 * 100) / 100,
          });
          continue;
        }
      }
    }

    // Check if line is a single reference or start of block (like "WL7296" or "Non trouvé WL7296")
    const cleanLine = line.replace(/^(non trouvé|trouvé|en stock|en rupture)\s*/i, '').trim();
    
    // Check if line looks like "WL7296 - FILTRE A HUILE..."
    const singleLineMatch = cleanLine.match(/^([A-Z0-9\.\-\/]{3,15})\s+[\-\:]?\s*(.+)$/i);
    if (singleLineMatch) {
      const ref = singleLineMatch[1].replace(/[\(\)]/g, '');
      const rest = singleLineMatch[2];
      
      // Look for numbers at the end like "20 40.80" or "Stock 20 Prix 50"
      const numMatch = rest.match(/(.*?)\s+(\d+)\s+([\d\.\,]+)\s*(?:MAD)?$/i);
      if (numMatch) {
        const title = numMatch[1].trim();
        const stock = parseInt(numMatch[2], 10) || 10;
        const price = parseFloat(numMatch[3].replace(',', '.')) || 0;
        parsedRows.push({
          ...createEmptyRow(),
          ref,
          title,
          brand: guessBrand(title),
          family: guessFamily(title),
          stockQuantity: stock,
          priceMAD: price,
          buyingPriceMAD: Math.round(price * 0.75 * 100) / 100,
        });
        continue;
      } else {
        // Just ref and title
        parsedRows.push({
          ...createEmptyRow(),
          ref,
          title: rest,
          brand: guessBrand(rest),
          family: guessFamily(rest),
          stockQuantity: 10,
          priceMAD: 0,
        });
        continue;
      }
    }

    // Multiline pattern fallback (e.g., invoice blocks)
    // If line has ref format
    if (/^[A-Z0-9\.\-\/]{3,15}$/i.test(line.replace(/[\(\)]/g, ''))) {
      currentBlockRef = line.replace(/[\(\)]/g, '');
      continue;
    }

    if (currentBlockRef && !currentBlockTitle && line.length > 5 && !/^\d+/.test(line)) {
      currentBlockTitle = line;
      continue;
    }

    // Price or Stock line
    if (line.toLowerCase().includes('mad') || /^\d+\s*[\d\.\,]*\s*mad/i.test(line)) {
      const matchNum = line.match(/([\d\.\,]+)\s*MAD/i);
      if (matchNum) {
        currentBlockPrice = parseFloat(matchNum[1].replace(',', '.'));
      }
    }

    if (/^\d+$/.test(line) && currentBlockStock === null) {
      currentBlockStock = parseInt(line, 10);
    }

    // Once we have at least ref and title, commit row
    if (currentBlockRef && currentBlockTitle) {
      parsedRows.push({
        ...createEmptyRow(),
        ref: currentBlockRef,
        title: currentBlockTitle,
        brand: guessBrand(currentBlockTitle),
        family: guessFamily(currentBlockTitle),
        stockQuantity: currentBlockStock ?? 10,
        priceMAD: currentBlockPrice ?? 0,
        buyingPriceMAD: Math.round((currentBlockPrice ?? 0) * 0.75 * 100) / 100,
      });
      currentBlockRef = '';
      currentBlockTitle = '';
      currentBlockStock = null;
      currentBlockPrice = null;
    }
  }

  return parsedRows;
}

function guessBrand(text: string): string {
  const upper = text.toUpperCase();
  if (upper.includes('WIX')) return 'WIX';
  if (upper.includes('LIQUI') || upper.includes('MOLY') || upper.includes('LM ')) return 'LIQUI MOLY';
  if (upper.includes('HENGST')) return 'HENGST';
  if (upper.includes('FRI.TECH') || upper.includes('FRITECH')) return 'FRI.TECH';
  if (upper.includes('BOSCH')) return 'BOSCH';
  if (upper.includes('VALEO')) return 'VALEO';
  if (upper.includes('MANN')) return 'MANN-FILTER';
  if (upper.includes('PURFLUX')) return 'PURFLUX';
  if (upper.includes('CASTROL')) return 'CASTROL';
  if (upper.includes('MOTUL')) return 'MOTUL';
  if (upper.includes('TOTAL')) return 'TOTAL';
  if (upper.includes('BREMBO')) return 'BREMBO';
  return 'WIX';
}

function guessFamily(text: string): string {
  const upper = text.toUpperCase();
  if (upper.includes('HABITACLE')) return "Filtre air d'habitacle";
  if (upper.includes('FILTRE A HUILE') || upper.includes('HUILE') && upper.includes('FILTRE')) return 'Filtre à huile';
  if (upper.includes('FILTRE A CARBURANT') || upper.includes('GASOIL') || upper.includes('CARBURANT')) return 'Filtre à carburant';
  if (upper.includes('FILTRE A AIR') || upper.includes('AIR')) return 'Filtre à air';
  if (upper.includes('PLAQUETTES') || upper.includes('FREIN')) return 'Plaquettes de frein';
  if (upper.includes('DISQUE')) return 'Disques de frein';
  if (upper.includes('ADDITIF') || upper.includes('DEF') || upper.includes('STOP FUMEE') || upper.includes('RINCAGE')) return 'Additifs & Traitement';
  if (upper.includes('ANTIGEL') || upper.includes('KFS') || upper.includes('RADIATEUR')) return 'Liquide de refroidissement';
  if (upper.includes('HUILE MOT') || upper.includes('5W30') || upper.includes('10W40') || upper.includes('5W40')) return 'Huiles & Lubrifiants';
  return 'Filtre à huile';
}

export const BulkAddProductsModal: React.FC<BulkAddProductsModalProps> = ({
  isOpen,
  onClose,
  onAddProducts,
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'smart-paste'>('smart-paste');
  const [pastedText, setPastedText] = useState('');
  const [rows, setRows] = useState<BulkProductRow[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddEmptyRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const handleRemoveRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof BulkProductRow, val: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: val };
        // If user changed title and brand is default, auto-guess brand/family
        if (field === 'title' && typeof val === 'string') {
          if (r.brand === 'WIX' || !r.brand) {
            updated.brand = guessBrand(val);
          }
          if (r.family === 'Filtre à huile') {
            updated.family = guessFamily(val);
          }
        }
        return updated;
      })
    );
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setParseError('Veuillez coller du texte d\'abord (liste de pièces ou facture).');
      return;
    }
    const detected = parseSmartText(pastedText);
    if (detected.length === 0) {
      setParseError(
        'Impossible de détecter des articles. Essayez d\'écrire sous le format : "REF - DESIGNATION - QTE - PRIX" ou collez le tableau directement.'
      );
      return;
    }
    setParseError(null);
    setRows(detected);
    setActiveTab('table');
  };

  const handleLoadExample = () => {
    const example = `WL7296	FILTRE A HUILE WIX GOLF V - VI JETTA	20	40.80	WIX
WL7476	FILTRE A HUILE WIX AUDI SEAT VW SKODA TDI	20	53.44	WIX
WA9759	FILTRE A AIR WIX FORD FOCUS MEGANE	20	89.66	WIX
8360	ADDITIF STOP FUMEE D'HUILE LIQUI-MOLY 300ML	20	93.11	LIQUI MOLY
569.0	KIT PLAQUETTES DE FREIN FRITECH AR	5	216.00	FRI.TECH`;
    setPastedText(example);
  };

  const validRows = rows.filter((r) => r.ref.trim().length > 0 && r.title.trim().length > 0);

  const handleSubmit = async () => {
    if (validRows.length === 0) {
      alert('Veuillez remplir au moins un article avec une Référence et une Désignation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newAutoProducts: AutoProduct[] = validRows.map((row) => {
        const cleanRef = row.ref.trim().toUpperCase();
        const brandClean = row.brand.trim() || 'WIX';
        const familyClean = row.family || 'Filtre à huile';
        const priceMAD = Number(row.priceMAD) || 0;
        const stockQty = Math.max(0, Number(row.stockQuantity) || 0);
        const initialPrice = Number(row.initialPriceMAD) || 0;
        const discPercent = Number(row.discountPercent) || 35;
        const buyingPrice = Number(row.buyingPriceMAD) > 0
          ? Number(row.buyingPriceMAD)
          : initialPrice > 0 && discPercent > 0
          ? Math.round(initialPrice * (1 - discPercent / 100) * 100) / 100
          : Math.round(priceMAD * 0.65 * 100) / 100;

        const imgType = mapFamilyToImageType(familyClean);
        return {
          id: `prod-${cleanRef.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          ref: cleanRef,
          oemRef: row.oemRef.trim() || cleanRef,
          title: row.title.trim(),
          brand: brandClean,
          family: familyClean,
          categoryGroup: familyClean,
          initialPriceMAD: initialPrice || undefined,
          discountPercent: discPercent || undefined,
          costPriceMAD: buyingPrice,
          priceMAD: priceMAD,
          stockQuantity: stockQty,
          status: (stockQty > 0 ? 'in_stock' : 'out_of_stock') as 'in_stock' | 'out_of_stock',
          imageType: imgType,
          specs: `Réf: ${cleanRef} | Marque: ${brandClean}`,
          compatibleVehicles: row.compatibleVehicles
            ? row.compatibleVehicles.split(',').map((v) => v.trim()).filter(Boolean)
            : ['TOUS VEHICULES COMPATIBLES'],
          suggested: true,
        };
      });

      await onAddProducts(newAutoProducts);
      onClose();
    } catch (err) {
      console.error('Error adding bulk products:', err);
      alert('Erreur lors de l\'enregistrement des articles.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e52e2d] flex items-center justify-center text-white shadow-md">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>Ajout Multi-Produits (En Masse / Lot)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/40">
                  ⚡ Mode Rapide
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Ajoutez 10, 20 ou 50 pièces d'un seul coup f deqqa wehda dans le catalogue.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="px-3 sm:px-6 py-2 sm:py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('smart-paste')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'smart-paste'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              <span className="truncate">📋 Copier-Coller</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e52e2d] shrink-0" />
              <span className="truncate">📊 Tableau ({validRows.length})</span>
            </button>
          </div>

          <div className="text-[11px] sm:text-xs text-slate-500 text-right sm:text-left">
            Total valide : <strong className="text-emerald-700 font-mono">{validRows.length} pièces</strong>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/40">
          {activeTab === 'smart-paste' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 text-xs text-blue-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Collez n'importe quel texte ou liste reçue du fournisseur :</div>
                  <p className="text-blue-700 text-[11px] leading-relaxed">
                    Vous pouvez coller des colonnes Excel (Ref, Titre, Stock, Prix), un message WhatsApp avec vos références, ou le format brut de facture. L'outil analyse et extrait automatiquement les références, marques, prix et stocks !
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Zone de texte / Collez votre liste ici :
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadExample}
                    className="text-xs text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer"
                  >
                    Exemple de données
                  </button>
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Exemple :\nWL7296  FILTRE A HUILE WIX GOLF V  20  40.80\nWF8477  FILTRE A CARBURANT WIX  10  126.00\n8360  ADDITIF STOP FUMEE 300ML  20  93.11\n...`}
                  rows={10}
                  className="w-full text-xs font-mono p-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e52e2d] focus:border-transparent leading-relaxed"
                />
              </div>

              {parseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analyser & Remplir le Tableau ➜</span>
                </button>
                <span className="text-xs text-slate-400">
                  Ou passez directement à l'onglet "Tableau" pour saisir ligne par ligne.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  Vérifiez ou complétez vos pièces ci-dessous avant d'enregistrer :
                </div>
                <button
                  type="button"
                  onClick={handleAddEmptyRow}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Ajouter une ligne vide</span>
                </button>
              </div>

              {/* Editable Grid */}
              <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-3 w-28">Référence *</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Désignation / Article *</th>
                      <th className="py-2.5 px-3 w-28">Marque</th>
                      <th className="py-2.5 px-3 w-32">Famille</th>
                      <th className="py-2.5 px-3 w-16 text-center">Stock</th>
                      <th className="py-2.5 px-3 w-24 text-right">1. Prix Initial</th>
                      <th className="py-2.5 px-3 w-24 text-center">2. Remise %</th>
                      <th className="py-2.5 px-3 w-24 text-right">3. Prix Achat</th>
                      <th className="py-2.5 px-3 w-28 text-right bg-emerald-50/50 text-emerald-800">4. Vente Client</th>
                      <th className="py-2.5 px-2 w-8 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {rows.map((row, idx) => {
                      const isValid = row.ref.trim().length > 0 && row.title.trim().length > 0;
                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isValid ? 'bg-white' : 'bg-amber-50/30'
                          }`}
                        >
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={row.ref}
                              onChange={(e) => handleUpdateRow(row.id, 'ref', e.target.value)}
                              placeholder="ex: WL7296"
                              className="w-full text-xs font-mono font-bold uppercase px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#e52e2d] focus:outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={row.title}
                              onChange={(e) => handleUpdateRow(row.id, 'title', e.target.value)}
                              placeholder="FILTRE A HUILE WIX GOLF V..."
                              className="w-full text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#e52e2d] focus:outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <select
                              value={row.brand}
                              onChange={(e) => handleUpdateRow(row.id, 'brand', e.target.value)}
                              className="w-full text-xs px-1.5 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#e52e2d] focus:outline-none"
                            >
                              {COMMON_BRANDS.map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-1.5 px-2">
                            <select
                              value={row.family}
                              onChange={(e) => handleUpdateRow(row.id, 'family', e.target.value)}
                              className="w-full text-xs px-1.5 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#e52e2d] focus:outline-none"
                            >
                              {COMMON_FAMILIES.map((f) => (
                                <option key={f} value={f}>
                                  {f}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={row.stockQuantity}
                              onChange={(e) =>
                                handleUpdateRow(row.id, 'stockQuantity', parseInt(e.target.value, 10) || 0)
                              }
                              className="w-14 text-center text-xs font-mono font-bold px-1 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#e52e2d] focus:outline-none"
                            />
                          </td>
                          {/* 1. Prix Initial Brut */}
                          <td className="py-1.5 px-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={row.initialPriceMAD || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                handleUpdateRow(row.id, 'initialPriceMAD', val);
                                if (val > 0 && row.discountPercent > 0) {
                                  handleUpdateRow(row.id, 'buyingPriceMAD', Math.round(val * (1 - row.discountPercent / 100) * 100) / 100);
                                }
                              }}
                              placeholder="0.00"
                              className="w-18 text-right text-xs font-mono px-1 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#e52e2d] focus:outline-none"
                            />
                          </td>
                          {/* 2. Remise % avec boutons rapides 35% / 42% */}
                          <td className="py-1.5 px-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <select
                                value={row.discountPercent || 35}
                                onChange={(e) => {
                                  const disc = parseFloat(e.target.value) || 0;
                                  handleUpdateRow(row.id, 'discountPercent', disc);
                                  if (row.initialPriceMAD > 0) {
                                    handleUpdateRow(row.id, 'buyingPriceMAD', Math.round(row.initialPriceMAD * (1 - disc / 100) * 100) / 100);
                                  }
                                }}
                                className="text-[11px] font-mono font-bold bg-blue-50 border border-blue-200 text-blue-700 rounded px-1 py-1 focus:outline-none"
                              >
                                <option value={35}>35%</option>
                                <option value={42}>42%</option>
                                <option value={30}>30%</option>
                                <option value={40}>40%</option>
                                <option value={50}>50%</option>
                                <option value={0}>0%</option>
                              </select>
                            </div>
                          </td>
                          {/* 3. Prix Achat (Shrito ana) */}
                          <td className="py-1.5 px-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={row.buyingPriceMAD || ''}
                              onChange={(e) =>
                                handleUpdateRow(row.id, 'buyingPriceMAD', parseFloat(e.target.value) || 0)
                              }
                              placeholder="0.00"
                              className="w-18 text-right text-xs font-mono font-bold px-1.5 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-[#e52e2d] focus:outline-none text-slate-800"
                            />
                          </td>
                          {/* 4. Prix Vente Client Final */}
                          <td className="py-1.5 px-2 text-right bg-emerald-50/30">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={row.priceMAD || ''}
                              onChange={(e) =>
                                handleUpdateRow(row.id, 'priceMAD', parseFloat(e.target.value) || 0)
                              }
                              placeholder="0.00"
                              className="w-20 text-right text-xs font-mono font-black px-1.5 py-1 bg-white border border-emerald-300 rounded focus:bg-white focus:border-emerald-600 focus:outline-none text-emerald-800"
                            />
                          </td>
                          <td className="py-1.5 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              disabled={rows.length <= 1}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-30 cursor-pointer"
                              title="Supprimer la ligne"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <div>
                  * Les lignes sans Référence ou sans Désignation ne seront pas enregistrées.
                </div>
                <button
                  type="button"
                  onClick={handleAddEmptyRow}
                  className="text-xs text-[#e52e2d] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une autre ligne</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            {validRows.length === 0 ? (
              <span className="text-amber-700 font-medium">
                ⚠️ Remplissez au moins 1 article valide pour enregistrer.
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {validRows.length} pièce{validRows.length > 1 ? 's' : ''} prête
                  {validRows.length > 1 ? 's' : ''} à être ajoutée
                  {validRows.length > 1 ? 's' : ''} dans le catalogue
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || validRows.length === 0}
              className="px-5 py-2 bg-[#e52e2d] hover:bg-[#c82322] disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enregistrement ({validRows.length})...</span>
                </>
              ) : (
                <>
                  <PackagePlus className="w-4 h-4" />
                  <span>Enregistrer Tout ({validRows.length} Pièces)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
