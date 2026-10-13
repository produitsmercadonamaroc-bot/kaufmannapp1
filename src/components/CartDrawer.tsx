import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  FileText,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { CartItem } from '../types';
import { ProductThumb } from './ProductThumb';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateCartQty: (productId: string, newQty: number) => void;
  onRemoveCartItem: (productId: string) => void;
  onCheckout: (clientName: string, paymentMethod: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateCartQty,
  onRemoveCartItem,
  onCheckout,
}) => {
  const [clientName, setClientName] = useState('Client Comptoir Tanger');
  const [paymentMethod, setPaymentMethod] = useState('Espèces');

  if (!isOpen) return null;

  const totalAmount = cart.reduce((acc, item) => acc + item.totalMAD, 0);

  const handleConfirmOrder = () => {
    if (cart.length === 0) return;
    onCheckout(clientName.trim() || 'Client Comptoir', paymentMethod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#e52e2d]" />
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Panier de Commande ({cart.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <ShoppingBag className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Votre panier est vide</p>
                <p className="text-xs">Ajoutez des pièces depuis le catalogue pour commander.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white shadow-2xs"
                >
                  <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded flex items-center justify-center shrink-0">
                    <ProductThumb imageType={item.product.imageType} brand={item.product.brand} imageUrl={item.product.imageUrl} className="w-12 h-12" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">{item.product.brand}</div>
                    <div className="text-xs font-bold text-slate-900 truncate">{item.product.title}</div>
                    <div className="text-[11px] font-mono text-[#e52e2d] font-semibold">{item.product.ref}</div>
                    <div className="text-xs font-black text-slate-900 font-mono mt-0.5">
                      {item.product.priceMAD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                    </div>
                  </div>

                  {/* Quantity Control & Remove */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1 border border-slate-200 rounded px-1 py-0.5 bg-slate-50">
                      <button
                        onClick={() => onUpdateCartQty(item.product.id, item.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateCartQty(item.product.id, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded text-xs font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveCartItem(item.product.id)}
                      className="text-slate-400 hover:text-red-600 p-0.5"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              {/* Client & Payment Info */}
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Client / Facturé à :
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nom du client / Immatriculation..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#e52e2d]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Mode de paiement :
                  </label>
                  <div className="grid grid-cols-3 gap-1 text-[11px]">
                    {['Espèces', 'Carte CMI', 'Chèque'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-1 rounded text-center font-semibold border ${
                          paymentMethod === m
                            ? 'bg-[#e52e2d] text-white border-[#e52e2d]'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total Row */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">TOTAL TTC :</span>
                <span className="text-xl font-black font-mono text-[#e52e2d] tabular-nums">
                  {totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD
                </span>
              </div>

              {/* Red Submit Button */}
              <button
                onClick={handleConfirmOrder}
                className="w-full py-2.5 px-4 bg-[#e52e2d] hover:bg-[#c82322] active:bg-[#a71d1c] text-white font-extrabold text-xs rounded-md shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Valider la commande & Générer Facture</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
