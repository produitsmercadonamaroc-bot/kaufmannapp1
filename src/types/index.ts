export type StockStatus = 'in_stock' | 'out_of_stock' | 'low_stock';

export interface AutoProduct {
  id: string;
  brand: string;
  title: string;
  ref: string;
  oemRef: string;
  barcode?: string;
  priceMAD: number; // Prix de vente client final (TTC)
  initialPriceMAD?: number; // Prix brut de départ (catalogue fournisseur / tarif de base)
  discountPercent?: number; // Taux de remise d'achat (%) ex: 35%, 42%
  costPriceMAD?: number; // Prix d'achat net payé (après remise)
  stockQuantity: number;
  status: StockStatus;
  family: string;
  categoryGroup: string;
  substitutes?: string;
  imageType: string;
  imageUrl?: string;
  specs?: string;
  compatibleVehicles: string[];
  suggested?: boolean;
}

export interface CartItem {
  product: AutoProduct;
  quantity: number;
  totalMAD: number;
}

export interface InvoiceItemDetail {
  ref: string;
  designation: string;
  quantity: number;
  unitPriceTTC: number;
  discountPercent: number;
  totalTTC: number;
}

export interface InvoiceDocument {
  id: string;
  invoiceNumber: string; // VFE26-07258
  date: string;
  type: 'FACTURE' | 'BON_COMMANDE' | 'DEVIS';
  categoryType: 'PIÈCE' | 'SERVICE';
  clientName: string;
  clientCode?: string; // CLT707012
  clientICE?: string; // 003720270000090
  clientPhone?: string;
  clientVehicle?: string; // ex: Dacia Logan 48120-A-40
  notes?: string;
  itemsSummary: string;
  totalHT_MAD?: number;
  totalTVA_MAD?: number;
  totalTTC_MAD: number;
  items?: CartItem[];
  itemsDetail?: InvoiceItemDetail[];
  commercial?: string; // Morad Fouder
  transporteur?: string; // LIVRAISON GARAGE / CTM MESSAGERIE
  paymentMethod?: string; // ESPECES / VIREMENT / CMI
  paymentCondition?: string; // 0J
  status: 'PAYÉ' | 'EN_ATTENTE';
}

export interface VehicleSelection {
  make: string;
  model: string;
  engine: string;
  tabLabel: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'staff' | 'manager';
  phone?: string;
  city?: string;
  garageName?: string;
  lastLoginAt?: string;
  createdAt?: string;
  isFirebaseSynced?: boolean;
}
