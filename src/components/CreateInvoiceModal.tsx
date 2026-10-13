import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Receipt,
  User,
  ShoppingBag,
  Car,
  Phone,
  Percent,
  Search,
} from 'lucide-react';
import { AutoProduct, CartItem, InvoiceItemDetail } from '../types';

export interface CreateInvoicePayload {
  clientName: string;
  clientPhone?: string;
  clientVehicle?: string;
  clientICE?: string;
  paymentMethod: string;
  paymentCondition: string;
  commercial: string;
  transporteur: string;
  items: CartItem[];
  itemsDetail: InvoiceItemDetail[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: AutoProduct[];
  onCreateInvoice: (payload: CreateInvoicePayload) => void;
}

interface LineItemState {
  product: AutoProduct;
  quantity: number;
  unitPriceTTC: number;
  discountPercent: number;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  products,
  onCreateInvoice,
}) => {
  const [clientName, setClientName] = useState('Client Comptoir Tanger');
  const [clientPhone, setClientPhone] = useState('');
  const [clientVehicle, setClientVehicle] = useState('Dacia Logan 1.5 dCi - 48120-A-40');
  const [clientICE, setClientICE] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  const [paymentCondition, setPaymentCondition] = useState('Comptant (0J)');
  const [commercial, setCommercial] = useState('Morad Fouder (Gérant)');
  const [transporteur, setTransporteur] = useState('Retrait Comptoir Garage El Haji Tanger');

  // Items chosen for the invoice
  const [lines, setLines] = useState<LineItemState[]>([]);

  // Product picker
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [pickerQty, setPickerQty] = useState(1);
  const [pickerCustomPrice, setPickerCustomPrice] = useState<number | ''>('');
  const [pickerDiscount, setPickerDiscount] = useState<number>(0);

  if (!isOpen) return null;

  const filteredProducts = products.filter((p) => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.ref.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.family.toLowerCase().includes(q)
    );
  });

  const currentSelectedProduct = products.find((p) => p.id === selectedProductId);

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setPickerCustomPrice(prod.priceMAD);
    }
  };

  const handleAddLine = () => {
    if (!currentSelectedProduct) return;

    if (currentSelectedProduct.stockQuantity < pickerQty) {
      alert(
        `Attention: Stock insuffisant pour ${currentSelectedProduct.title} (${currentSelectedProduct.stockQuantity} disponibles).`
      );
      return;
    }

    const price = typeof pickerCustomPrice === 'number' ? pickerCustomPrice : currentSelectedProduct.priceMAD;
    const discount = Number(pickerDiscount) || 0;

    const existingIdx = lines.findIndex((l) => l.product.id === currentSelectedProduct.id);
    if (existingIdx >= 0) {
      const newQty = lines[existingIdx].quantity + pickerQty;
      if (newQty > currentSelectedProduct.stockQuantity) {
        alert(
          `Quantité totale (${newQty}) dépasse le stock disponible (${currentSelectedProduct.stockQuantity}).`
        );
        return;
      }
      setLines((prev) =>
        prev.map((l, idx) =>
          idx === existingIdx
            ? { ...l, quantity: newQty, unitPriceTTC: price, discountPercent: discount }
            : l
        )
      );
    } else {
      setLines((prev) => [
        ...prev,
        {
          product: currentSelectedProduct,
          quantity: pickerQty,
          unitPriceTTC: price,
          discountPercent: discount,
        },
      ]);
    }

    setSelectedProductId('');
    setPickerQty(1);
    setPickerCustomPrice('');
    setPickerDiscount(0);
    setProductSearch('');
  };

  const handleRemoveLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== id));
  };

  const handleUpdateLineQty = (id: string, qty: number) => {
    const line = lines.find((l) => l.product.id === id);
    if (!line) return;
    if (qty <= 0) {
      handleRemoveLine(id);
      return;
    }
    if (qty > line.product.stockQuantity) {
      alert(`Stock maximum disponible : ${line.product.stockQuantity}`);
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.product.id === id ? { ...l, quantity: qty } : l))
    );
  };

  // Totals calculations
  const totalTTC = lines.reduce((acc, l) => {
    const discountedUnitPrice = l.unitPriceTTC * (1 - l.discountPercent / 100);
    return acc + discountedUnitPrice * l.quantity;
  }, 0);

  const totalHT = totalTTC / 1.2;
  const totalTVA = totalTTC - totalHT;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      alert('Veuillez ajouter au moins une pièce à la facture.');
      return;
    }

    const items: CartItem[] = lines.map((l) => {
      const discountedUnitPrice = l.unitPriceTTC * (1 - l.discountPercent / 100);
      return {
        product: l.product,
        quantity: l.quantity,
        totalMAD: discountedUnitPrice * l.quantity,
      };
    });

    const itemsDetail: InvoiceItemDetail[] = lines.map((l) => {
      const discountedUnitPrice = l.unitPriceTTC * (1 - l.discountPercent / 100);
      return {
        ref: l.product.ref,
        designation: `${l.product.title} (${l.product.brand})`,
        quantity: l.quantity,
        unitPriceTTC: l.unitPriceTTC,
        discountPercent: l.discountPercent,
        totalTTC: discountedUnitPrice * l.quantity,
      };
    });

    onCreateInvoice({
      clientName: clientName.trim() || 'Client Comptoir Tanger',
      clientPhone: clientPhone.trim() || undefined,
      clientVehicle: clientVehicle.trim() || undefined,
      clientICE: clientICE.trim() || undefined,
      paymentMethod,
      paymentCondition,
      commercial,
      transporteur,
      items,
      itemsDetail,
      totalHT,
      totalTVA,
      totalTTC,
    });

    onClose();
    setLines([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#001f3f] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e52e2d] flex items-center justify-center text-white">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">
                Créer une Nouvelle Facture / Vente Comptoir
              </h2>
              <p className="text-[11px] text-slate-300">
                Garage Auto El Haji · Tanger (Maroc)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Quick Client Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Raccourcis Client :</span>
            <button
              type="button"
              onClick={() => {
                setClientName('Client Comptoir Tanger');
                setClientVehicle('Passage Atelier');
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer border border-slate-200"
            >
              Comptoir (Passage)
            </button>
            <button
              type="button"
              onClick={() => {
                setClientName('Chauffeur Grand Taxi Tanger');
                setClientVehicle('Dacia Lodgy 1.5 dCi - 39211-A-40');
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer border border-slate-200"
            >
              Taxi Tanger
            </button>
            <button
              type="button"
              onClick={() => {
                setClientName('Société Transport Détroit SARL');
                setClientVehicle('Fourgon Renault Master');
                setClientICE('002981023000012');
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer border border-slate-200"
            >
              Entreprise (ICE)
            </button>
          </div>

          {/* Client Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Nom du Client / Société *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="ex: Mohamed B. / Taxi Tanger"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:border-[#e52e2d] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Véhicule & Immatriculation
              </label>
              <input
                type="text"
                value={clientVehicle}
                onChange={(e) => setClientVehicle(e.target.value)}
                placeholder="ex: Dacia Logan 48120-A-40"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 focus:border-[#e52e2d] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Téléphone Client
              </label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="06 XX XX XX XX"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-slate-800 focus:border-[#e52e2d] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                ICE Client (si société)
              </label>
              <input
                type="text"
                value={clientICE}
                onChange={(e) => setClientICE(e.target.value)}
                placeholder="003720270000090"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-slate-800 focus:border-[#e52e2d] focus:outline-none"
              />
            </div>
          </div>

          {/* Payment & Commercial info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mode de Règlement</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-semibold text-slate-800 focus:border-[#e52e2d] focus:outline-none"
              >
                <option value="Espèces">Espèces (Comptoir)</option>
                <option value="Carte Bancaire CMI">Carte Bancaire CMI</option>
                <option value="Virement">Virement bancaire</option>
                <option value="Chèque">Chèque</option>
                <option value="À terme (Crédit)">À terme / En attente</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Commercial / Vendeur</label>
              <input
                type="text"
                value={commercial}
                onChange={(e) => setCommercial(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-semibold text-slate-800 focus:border-[#e52e2d] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Condition de paiement</label>
              <input
                type="text"
                value={paymentCondition}
                onChange={(e) => setPaymentCondition(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 focus:border-[#e52e2d] focus:outline-none"
              />
            </div>
          </div>

          {/* Add Item Line to Invoice from Real Inventory */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-800 block text-xs uppercase tracking-wide">
                + Ajouter des pièces depuis le stock ({products.length} références dispo) :
              </span>
              <span className="text-[11px] text-slate-500">
                Déduit directement du stock après validation
              </span>
            </div>

            {/* Live Filter Products */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Filtrer les pièces par nom, référence ou marque (ex: Bosch, 5w30, Filtre...)"
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-slate-800 placeholder-slate-400 focus:border-[#e52e2d] focus:outline-none text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-6">
                <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                  Sélectionner la pièce :
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-[#e52e2d] text-xs font-medium"
                >
                  <option value="">-- Choisir la pièce vendue --</option>
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stockQuantity <= 0}>
                      {p.brand} - {p.title} ({p.ref}) · {p.priceMAD} DH [
                      {p.stockQuantity <= 0 ? 'RUPTURE' : `${p.stockQuantity} en stock`}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Qté :</label>
                <input
                  type="number"
                  min="1"
                  max={currentSelectedProduct ? currentSelectedProduct.stockQuantity : 99}
                  value={pickerQty}
                  onChange={(e) => setPickerQty(parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-2 text-center font-mono font-bold bg-white border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-0.5">P.U TTC (DH) :</label>
                <input
                  type="number"
                  step="0.1"
                  value={pickerCustomPrice}
                  onChange={(e) =>
                    setPickerCustomPrice(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  placeholder="Prix DH"
                  className="w-full px-2 py-2 text-center font-mono font-semibold bg-white border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  disabled={!selectedProductId}
                  onClick={handleAddLine}
                  className={`w-full py-2 rounded font-extrabold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors ${
                    selectedProductId
                      ? 'bg-[#e52e2d] hover:bg-[#c82322] text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {currentSelectedProduct && (
              <div className="text-[11px] text-slate-600 flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                <span className="font-semibold">{currentSelectedProduct.title}</span>
                <span>·</span>
                <span className="font-mono">{currentSelectedProduct.ref}</span>
                <span>·</span>
                <span
                  className={`font-bold px-1.5 py-0.2 rounded ${
                    currentSelectedProduct.stockQuantity > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {currentSelectedProduct.stockQuantity} disponibles en stock
                </span>
              </div>
            )}
          </div>

          {/* Selected Items Table in Invoice */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 block text-xs">
              Pièces incluses dans cette facture ({lines.length}) :
            </span>

            {lines.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-lg text-xs">
                Aucune pièce sélectionnée. Choisissez un article ci-dessus pour composer la facture.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                {lines.map((line) => {
                  const lineTotal = line.quantity * line.unitPriceTTC;
                  return (
                    <div
                      key={line.product.id}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-slate-900 truncate">
                          {line.product.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {line.product.brand} · Réf: <span className="font-bold text-slate-700">{line.product.ref}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        {/* Quantity adjuster */}
                        <div className="flex items-center border border-slate-300 rounded bg-white">
                          <button
                            type="button"
                            onClick={() => handleUpdateLineQty(line.product.id, line.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-600 font-bold"
                          >
                            −
                          </button>
                          <span className="px-2 font-mono font-bold text-slate-900 text-xs">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateLineQty(line.product.id, line.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-600 font-bold"
                          >
                            +
                          </button>
                        </div>

                        {/* Price & Total */}
                        <div className="text-right sm:w-28">
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {line.unitPriceTTC.toFixed(2)} DH/u
                          </span>
                          <span className="font-mono font-black text-slate-900 block tabular-nums text-xs">
                            {lineTotal.toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            DH
                          </span>
                        </div>

                        {/* Delete line */}
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.product.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 cursor-pointer transition-colors"
                          title="Supprimer la ligne"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Financial Breakdown Card */}
          <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-slate-300 text-xs">
              <span>Total Brut HT :</span>
              <span className="font-mono tabular-nums">
                {totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300 text-xs">
              <span>Total TVA (20%) :</span>
              <span className="font-mono tabular-nums">
                {totalTVA.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
              <div>
                <span className="text-xs uppercase font-black text-slate-200 block">
                  Total TTC à Payer :
                </span>
                <span className="text-[10px] text-slate-400">
                  Règlement : {paymentMethod} · {paymentCondition}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-[#e52e2d] tabular-nums">
                {totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-bold text-center cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={lines.length === 0}
              className={`px-5 py-2.5 rounded-lg font-extrabold flex items-center justify-center gap-2 shadow-md transition-all ${
                lines.length > 0
                  ? 'bg-[#e52e2d] hover:bg-[#c82322] active:bg-[#a71d1c] text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="truncate">Valider la Vente & Imprimer Facture</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
