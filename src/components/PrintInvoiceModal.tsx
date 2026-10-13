import React from 'react';
import { X, Printer, Check, Building2, Phone, Mail, Globe, MapPin } from 'lucide-react';
import { InvoiceDocument } from '../types';
import { numberToFrenchWordsMAD } from '../utils/numberToWords';

interface PrintInvoiceModalProps {
  invoice: InvoiceDocument | null;
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  invoice,
  onClose,
}) => {
  if (!invoice) return null;

  const totalTTC = invoice.totalTTC_MAD;
  const totalHT = invoice.totalHT_MAD || totalTTC / 1.2;
  const totalTVA = invoice.totalTVA_MAD || totalTTC - totalHT;

  // Format date DD/MM/YYYY
  const invoiceDate = (() => {
    try {
      const d = new Date(invoice.date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '10/10/2026';
    }
  })();

  // Items to display
  const items =
    invoice.itemsDetail && invoice.itemsDetail.length > 0
      ? invoice.itemsDetail
      : (invoice.items || []).map((it) => {
          const unitPriceTTC = it.product.priceMAD;
          const qty = it.quantity;
          const totalLineTTC = it.totalMAD;
          return {
            ref: it.product.ref,
            designation: `${it.product.title} - ${it.product.brand}`,
            quantity: qty,
            unitPriceTTC,
            discountPercent: 0,
            totalTTC: totalLineTTC,
          };
        });

  const amountInWords = numberToFrenchWordsMAD(totalTTC);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto no-print-bg">
      <div className="bg-white rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl my-4 flex flex-col max-h-[96vh]">
        {/* Top actions bar (Hidden on paper print) */}
        <div className="px-4 py-3 bg-slate-900 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 no-print shrink-0 border-b border-slate-800">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="font-black text-[#e52e2d] tracking-wide text-sm sm:text-base">
              GARAGE AUTO EL HAJI
            </span>
            <span className="text-[11px] text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              N° {invoice.invoiceNumber}
            </span>
            <button
              onClick={onClose}
              className="sm:hidden p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-4 py-2 bg-[#e52e2d] hover:bg-[#c82322] active:bg-[#a71d1c] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="hidden sm:block p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Document - 100% Matching Morad's Authentic Moroccan Automotive Invoice */}
        <div className="p-3 sm:p-8 overflow-y-auto flex-1 bg-slate-100 print:p-0 print:bg-white print:overflow-visible">
          <div className="bg-white p-4 sm:p-10 rounded-lg shadow-md border border-slate-200 font-sans text-xs text-slate-900 max-w-3xl mx-auto print:border-none print:shadow-none print:p-2 print:max-w-none">
            {/* Top row: Title and Invoice number */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b-2 border-slate-900 pb-3 mb-5 gap-1">
              <div className="text-sm sm:text-base font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
                <span>FACTURE PIÈCE DÉTACHÉE & SERVICE</span>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200 uppercase">
                  ORIGINALE
                </span>
              </div>
              <div className="text-sm sm:text-base font-black font-mono text-slate-900">
                N° {invoice.invoiceNumber}
              </div>
            </div>

            {/* Brand Logo & Company Info (Left) + Client Info (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-4 items-start mb-6">
              {/* Left: GARAGE AUTO EL HAJI info */}
              <div className="col-span-1 md:col-span-7 print:col-span-7 space-y-1">
                <div className="text-xl sm:text-2xl font-black text-[#e52e2d] tracking-tight leading-none uppercase">
                  GARAGE AUTO EL HAJI
                </div>
                <div className="text-[11px] text-slate-700 font-bold">
                  Entretien Mécanique & Vente de Pièces de Rechange Automobiles
                </div>
                <div className="text-[10px] text-slate-600 font-mono flex items-center gap-1.5 pt-0.5 flex-wrap">
                  <span className="font-bold text-slate-800">Site Web :</span>
                  <span className="text-[#e52e2d] font-semibold">www.elhajiauto.com</span>
                  <span>·</span>
                  <span className="font-bold text-slate-800">Gérant :</span>
                  <span>Morad Fouder</span>
                </div>
                <div className="text-[10px] text-slate-600 pt-1 leading-relaxed">
                  <div>Route de Tétouan, Km 3.5, Quartier Moghogha, Tanger 90000 - Maroc</div>
                  <div>Tél : 05 39 35 12 88 / 06 61 48 92 10 · Email : contact@elhajiauto.com</div>
                  <div className="font-semibold text-slate-800 pt-0.5">
                    ICE: 002984123000045 · IF: 45892103 · RC Tanger: 94812 · Patente: 50412389
                  </div>
                </div>
              </div>

              {/* Right: Client Box */}
              <div className="col-span-1 md:col-span-5 print:col-span-5 bg-slate-50 border border-slate-300 rounded p-3 text-left leading-snug">
                <div className="text-[10px] font-black uppercase text-slate-500 mb-1 border-b border-slate-200 pb-0.5">
                  Informations Client
                </div>
                <div className="font-black text-slate-900 text-sm uppercase">
                  {invoice.clientName}
                </div>
                {invoice.clientVehicle && (
                  <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                    Véhicule : <span className="font-bold text-slate-900">{invoice.clientVehicle}</span>
                  </div>
                )}
                {invoice.clientPhone && (
                  <div className="text-[11px] text-slate-700 font-mono">
                    Tél : {invoice.clientPhone}
                  </div>
                )}
                <div className="text-[10px] text-slate-600 font-mono mt-1 pt-1 border-t border-slate-200">
                  <div>Code Client : {invoice.clientCode || 'CLT-TNG9012'}</div>
                  <div>ICE Client : {invoice.clientICE || '003720270000090'}</div>
                  <div>Date Facture : <strong className="text-slate-900">{invoiceDate}</strong></div>
                </div>
              </div>
            </div>

            {/* Table of items exactly matching the Moroccan wholesale reference */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] min-w-[500px]">
                <thead>
                  <tr className="border border-slate-300 bg-slate-100 text-slate-900 font-black">
                    <th className="py-2 px-2.5 border-r border-slate-300 w-28">Réf.</th>
                    <th className="py-2 px-2.5 border-r border-slate-300">Désignation</th>
                    <th className="py-2 px-2 border-r border-slate-300 text-center w-12">Qté</th>
                    <th className="py-2 px-2.5 border-r border-slate-300 text-right w-20">P.U. HT</th>
                    <th className="py-2 px-2.5 border-r border-slate-300 text-right w-22">P.U. TTC</th>
                    <th className="py-2 px-2.5 border-r border-slate-300 text-right w-16">Remise</th>
                    <th className="py-2 px-2.5 text-right w-24">Total TTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 border-x border-b border-slate-300">
                  {items.map((item, idx) => {
                    const linePUHT = item.unitPriceTTC / 1.2;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-2.5 border-r border-slate-300 font-mono font-bold text-slate-900">
                          {item.ref}
                        </td>
                        <td className="py-1.5 px-2.5 border-r border-slate-300 text-slate-800 font-medium">
                          {item.designation}
                        </td>
                        <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono font-bold">
                          {item.quantity}
                        </td>
                        <td className="py-1.5 px-2.5 border-r border-slate-300 text-right font-mono text-slate-600 tabular-nums">
                          {linePUHT.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-1.5 px-2.5 border-r border-slate-300 text-right font-mono font-semibold tabular-nums">
                          {item.unitPriceTTC.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-1.5 px-2.5 border-r border-slate-300 text-right font-mono text-slate-600 tabular-nums">
                          {item.discountPercent > 0 ? `${item.discountPercent}%` : '0%'}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {item.totalTTC.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Metadata & Totals Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-5 items-start mb-6">
              {/* Left Metadata & Stamp Box */}
              <div className="col-span-1 md:col-span-6 print:col-span-6 space-y-4">
                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-1 px-2.5 font-bold text-slate-800 border-r border-slate-200 bg-slate-50 w-36">
                          Commercial
                        </td>
                        <td className="py-1 px-2.5 font-semibold text-slate-800">
                          {invoice.commercial || 'Morad Fouder (Gérant)'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2.5 font-bold text-slate-800 border-r border-slate-200 bg-slate-50">
                          Mode de règlement
                        </td>
                        <td className="py-1 px-2.5 font-semibold text-slate-800">
                          {invoice.paymentMethod || 'Espèces'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2.5 font-bold text-slate-800 border-r border-slate-200 bg-slate-50">
                          Condition de paiement
                        </td>
                        <td className="py-1 px-2.5 font-semibold text-slate-800">
                          {invoice.paymentCondition || 'Comptant (0J)'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2.5 font-bold text-slate-800 border-r border-slate-200 bg-slate-50">
                          Livraison / Retrait
                        </td>
                        <td className="py-1 px-2.5 font-semibold text-slate-800">
                          {invoice.transporteur || 'Comptoir Garage Auto El Haji Tanger'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Stamp & Signature Section */}
                <div className="border border-dashed border-slate-400 rounded p-3 text-center bg-slate-50/60 min-h-[90px] flex flex-col justify-between">
                  <div className="text-[10px] font-bold text-slate-600 uppercase">
                    Cachet & Signature de l'Établissement
                  </div>
                  <div className="my-1">
                    <div className="inline-block border-2 border-red-700/60 text-red-800 px-3 py-1 rounded font-black tracking-wider text-[11px] uppercase transform -rotate-2">
                      GARAGE AUTO EL HAJI · TANGER
                      <div className="text-[9px] font-bold text-slate-600 normal-case tracking-normal">
                        Morad Fouder - Gérant
                      </div>
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-400 italic">
                    Pour acquit et réception conforme
                  </div>
                </div>
              </div>

              {/* Right Totals Box */}
              <div className="col-span-1 md:col-span-6 print:col-span-6 border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-right text-[11px] border-collapse">
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-1.5 px-3 font-bold text-slate-700 bg-slate-50 text-left">
                        Total Brut HT
                      </td>
                      <td className="py-1.5 px-3 font-mono font-bold text-slate-800 tabular-nums">
                        {totalHT.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        DH
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-bold text-slate-700 bg-slate-50 text-left">
                        Total TVA (20%)
                      </td>
                      <td className="py-1.5 px-3 font-mono font-bold text-slate-800 tabular-nums">
                        {totalTVA.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        DH
                      </td>
                    </tr>
                    <tr className="border-t-2 border-slate-900 bg-red-50/40">
                      <td className="py-2.5 px-3 font-black text-[#e52e2d] text-left text-xs uppercase">
                        TOTAL TTC (MAD / DH)
                      </td>
                      <td className="py-2.5 px-3 font-black font-mono text-[#e52e2d] text-base tabular-nums">
                        {totalTTC.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        DH
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sum in Words Box */}
            <div className="pt-2.5 border-t-2 border-slate-300 mb-5">
              <div className="text-[10px] font-black uppercase text-slate-700">
                ARRÊTÉE LA PRÉSENTE FACTURE À LA SOMME DE :
              </div>
              <div className="text-[11px] font-black text-slate-900 mt-0.5 tracking-wide bg-slate-50 p-2 rounded border border-slate-200 font-mono">
                **** {amountInWords} ****
              </div>
            </div>

            {/* Footer with Moroccan Legal & Bank details */}
            <div className="text-center text-[10px] text-slate-500 pt-3 border-t border-slate-200 space-y-0.5">
              <div className="font-bold text-slate-700">
                GARAGE AUTO EL HAJI SARL · Route de Tétouan Km 3.5, Quartier Moghogha, Tanger (Maroc)
              </div>
              <div>
                ICE: 002984123000045 · RC Tanger: 94812 · IF: 45892103 · Patente: 50412389 · CNSS: 8192045
              </div>
              <div className="text-[9px] font-mono text-slate-600">
                Banque : Attijariwafa Bank Tanger Agence Moghogha · RIB : 007 640 0001234567890123 45 · www.elhajiauto.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
