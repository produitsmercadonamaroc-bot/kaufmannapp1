import React, { useState } from 'react';
import { X, Plus, PackagePlus, ArrowDownToLine, Save } from 'lucide-react';
import { AutoProduct } from '../types';

interface StockArrivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: AutoProduct[];
  onAddStockQuantity: (productId: string, quantityToAdd: number) => void;
}

export const StockArrivalModal: React.FC<StockArrivalModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddStockQuantity,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [qtyToAdd, setQtyToAdd] = useState<number>(5);

  if (!isOpen) return null;

  const selectedProd = products.find((p) => p.id === selectedProductId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || qtyToAdd <= 0) return;
    onAddStockQuantity(selectedProductId, qtyToAdd);
    onClose();
    setQtyToAdd(5);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-5 py-4 bg-[#001f3f] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-emerald-400" />
            <span className="font-extrabold text-sm uppercase">Entrée de Stock / Arrivage</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Choisir la pièce à approvisionner :
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded font-medium text-slate-800 focus:border-[#e52e2d] focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} - {p.title} ({p.ref}) [Stock actuel: {p.stockQuantity}]
                </option>
              ))}
            </select>
          </div>

          {selectedProd && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-700 space-y-1">
              <div>
                <span className="text-slate-500">Référence :</span>{' '}
                <strong className="font-mono text-slate-900">{selectedProd.ref}</strong>
              </div>
              <div>
                <span className="text-slate-500">Stock actuel en magasin :</span>{' '}
                <strong className={`font-mono ${selectedProd.stockQuantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {selectedProd.stockQuantity} unités
                </strong>
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Quantité reçue à ajouter au stock :
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                required
                value={qtyToAdd}
                onChange={(e) => setQtyToAdd(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold text-base text-emerald-700 focus:border-emerald-600 focus:outline-none"
              />
              <span className="text-slate-500 font-semibold shrink-0">unités</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Valider l'Entrée (+{qtyToAdd})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
