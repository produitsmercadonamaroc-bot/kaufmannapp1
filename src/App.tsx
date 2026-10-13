import React, { useState, useEffect } from 'react';
import { AutoProduct, CartItem, InvoiceDocument, VehicleSelection, AppUser } from './types';
import {
  INITIAL_AUTO_PRODUCTS,
  INITIAL_INVOICES,
  INITIAL_VEHICLE,
} from './data/kaufmannData';
import { KaufmannHeader, MainNavView } from './components/KaufmannHeader';
import { ProductCatalog } from './components/ProductCatalog';
import { DocumentsView } from './components/DocumentsView';
import { CartDrawer } from './components/CartDrawer';
import { QuickAddProductModal } from './components/QuickAddProductModal';
import { BulkAddProductsModal } from './components/BulkAddProductsModal';
import { StockArrivalModal } from './components/StockArrivalModal';
import { CreateInvoiceModal, CreateInvoicePayload } from './components/CreateInvoiceModal';
import { PrintInvoiceModal } from './components/PrintInvoiceModal';
import { LoginScreen } from './components/LoginScreen';
import { AccountModal } from './components/AccountModal';
import {
  db,
  PRODUCTS_COLLECTION,
  INVOICES_COLLECTION,
  testFirestoreConnection,
  saveProductToFirestore,
  updateProductStockInFirestore,
  updateProductImageInFirestore,
  deleteProductFromFirestore,
  saveInvoiceToFirestore,
  updateInvoiceStatusInFirestore,
  deleteInvoiceFromFirestore,
  getStoredUserSession,
  logoutUser,
  authenticateUser,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASS,
} from './lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { ShieldAlert, CheckCircle2, AlertTriangle, X } from 'lucide-react';

const STORAGE_KEYS = {
  PRODUCTS: 'kaufmann_elhaji_real_products_v4',
  DELETED_IDS: 'kaufmann_elhaji_deleted_product_ids_v1',
  INVOICES: 'kaufmann_elhaji_real_invoices_v1',
  CART: 'kaufmann_elhaji_cart_v4',
  VEHICLE: 'kaufmann_elhaji_vehicle_v4',
};

export default function App() {
  // Track IDs and references of products explicitly deleted by the user
  const [deletedProductIds, setDeletedProductIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Purge any old virtual products and virtual invoices from previous mock versions in localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('kaufmann_elhaji_products_v3');
      localStorage.removeItem('kaufmann_elhaji_real_products_v1');
      localStorage.removeItem('kaufmann_elhaji_real_products_v2');
      localStorage.removeItem('kaufmann_elhaji_real_products_v3');
      localStorage.removeItem('kaufmann_elhaji_invoices_v5');
      localStorage.removeItem('kaufmann_elhaji_invoices_v4');
      localStorage.removeItem('kaufmann_elhaji_invoices_v3');
      localStorage.removeItem('kaufmann_elhaji_invoices_v2');
      localStorage.removeItem('kaufmann_elhaji_invoices_v1');
    } catch (e) {
      console.warn('Storage cleanup:', e);
    }
  }, []);

  // Products state (Respects user deletions and loads all real Liqui Moly items)
  const [products, setProducts] = useState<AutoProduct[]>(() => {
    try {
      const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
      const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (stored) {
        const parsed: AutoProduct[] = JSON.parse(stored);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          const activeParsed = parsed.filter((p) => !deletedSet.has(p.id) && !deletedSet.has(p.ref));
          const existingRefs = new Set(activeParsed.map((p) => p.ref));
          const missing = INITIAL_AUTO_PRODUCTS.filter(
            (p) => !existingRefs.has(p.ref) && !deletedSet.has(p.id) && !deletedSet.has(p.ref)
          );
          return [...activeParsed, ...missing];
        }
      }
      return INITIAL_AUTO_PRODUCTS.filter((p) => !deletedSet.has(p.id) && !deletedSet.has(p.ref));
    } catch {
      return INITIAL_AUTO_PRODUCTS;
    }
  });

  const [invoices, setInvoices] = useState<InvoiceDocument[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return stored ? JSON.parse(stored) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CART);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [currentVehicle, setCurrentVehicle] = useState<VehicleSelection>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VEHICLE);
      return stored ? JSON.parse(stored) : INITIAL_VEHICLE;
    } catch {
      return INITIAL_VEHICLE;
    }
  });

  // ONLY 2 VIEWS AS REQUESTED BY MORAD: 'catalogue' (Stock & Catalogue) and 'factures' (Mes Factures)
  const [currentView, setCurrentView] = useState<MainNavView>('catalogue');

  // Authentication State (EL HAJI AUTO admin)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getStoredUserSession());
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setIsAccountModalOpen(false);
    showToast('warning', 'Session fermée', 'Vous avez été déconnecté avec succès.');
  };

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('Toutes les familles');

  // Firebase status indicator
  const [firebaseStatus, setFirebaseStatus] = useState<'connected' | 'blocked' | 'checking'>('checking');

  // Toast notification state
  const [toast, setToast] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
    sub?: string;
  } | null>(null);

  const showToast = (type: 'success' | 'warning' | 'error', message: string, sub?: string) => {
    setToast({ type, message, sub });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  };

  // Check connection status on initial mount
  useEffect(() => {
    let active = true;
    testFirestoreConnection().then((res) => {
      if (!active) return;
      if (res.success) {
        setFirebaseStatus('connected');
      } else {
        setFirebaseStatus('blocked');
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [isStockArrivalOpen, setIsStockArrivalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState<InvoiceDocument | null>(null);

  // 1. REAL-TIME FIREBASE SYNC: Products collection
  useEffect(() => {
    try {
      const productsRef = collection(db, PRODUCTS_COLLECTION);
      const unsubscribe = onSnapshot(
        productsRef,
        async (snapshot) => {
          setFirebaseStatus('connected');
          const firebaseItems: AutoProduct[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as AutoProduct;
            firebaseItems.push({
              ...data,
              id: docSnap.id,
            });
          });

          // Get current deleted IDs from storage
          const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
          const currentDeletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

          // Filter out deleted items from firebaseItems
          const validFirebaseItems = firebaseItems.filter(
            (p) => !currentDeletedSet.has(p.id) && !currentDeletedSet.has(p.ref)
          );

          // Check which of user's 8 Liqui Moly items are missing in Firestore (excluding deleted items)
          const existingRefs = new Set(validFirebaseItems.map((p) => p.ref));
          const missingRealProducts = INITIAL_AUTO_PRODUCTS.filter(
            (p) => !existingRefs.has(p.ref) && !currentDeletedSet.has(p.id) && !currentDeletedSet.has(p.ref)
          );

          if (missingRealProducts.length > 0) {
            console.log(`Auto-seeding ${missingRealProducts.length} missing Liqui Moly items to Firestore...`);
            for (const prod of missingRealProducts) {
              saveProductToFirestore(prod).catch((e) => console.warn('Auto-seed Liqui Moly item note:', e));
            }
          }

          // Merge: ensure undeleted INITIAL_AUTO_PRODUCTS are present in the final list
          const combinedMap = new Map<string, AutoProduct>();
          for (const p of INITIAL_AUTO_PRODUCTS) {
            if (!currentDeletedSet.has(p.id) && !currentDeletedSet.has(p.ref)) {
              combinedMap.set(p.ref, p);
            }
          }
          // Overlay or add firebase items
          for (const p of validFirebaseItems) {
            combinedMap.set(p.ref || p.id, p);
          }

          const finalProducts = Array.from(combinedMap.values());
          setProducts(finalProducts);
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(finalProducts));
        },
        (error) => {
          console.warn('Firebase products sync note:', error);
          if (error?.code === 'permission-denied') {
            setFirebaseStatus('blocked');
          }
          // Even if Firestore is blocked by security rules, guarantee undeleted Liqui Moly items remain
          setProducts((current) => {
            const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
            const currentDeletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
            if (current.length === 0) {
              return INITIAL_AUTO_PRODUCTS.filter((p) => !currentDeletedSet.has(p.id) && !currentDeletedSet.has(p.ref));
            }
            const existingRefs = new Set(current.map((p) => p.ref));
            const missing = INITIAL_AUTO_PRODUCTS.filter(
              (p) => !existingRefs.has(p.ref) && !currentDeletedSet.has(p.id) && !currentDeletedSet.has(p.ref)
            );
            return [...current, ...missing];
          });
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase listener error:', e);
    }
  }, []);

  // 2. REAL-TIME FIREBASE SYNC: Invoices collection
  useEffect(() => {
    try {
      const invoicesRef = collection(db, INVOICES_COLLECTION);
      const unsubscribe = onSnapshot(
        invoicesRef,
        (snapshot) => {
          setFirebaseStatus('connected');
          if (!snapshot.empty) {
            const firebaseInvoices: InvoiceDocument[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as InvoiceDocument;
              firebaseInvoices.push({
                ...data,
                id: docSnap.id,
              });
            });
            firebaseInvoices.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setInvoices(firebaseInvoices);
            localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(firebaseInvoices));
          }
        },
        (error) => {
          console.warn('Firebase invoices sync note:', error);
          if (error?.code === 'permission-denied') {
            setFirebaseStatus('blocked');
          }
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase listener error:', e);
    }
  }, []);

  // Synchronize to localStorage as local cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('LocalStorage products cache note:', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    } catch (e) {
      console.warn('LocalStorage invoices cache note:', e);
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.warn('LocalStorage cart cache note:', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VEHICLE, JSON.stringify(currentVehicle));
    } catch (e) {
      console.warn('LocalStorage vehicle cache note:', e);
    }
  }, [currentVehicle]);

  // Cart operations
  const handleAddToCart = (product: AutoProduct, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                totalMAD: (item.quantity + quantity) * product.priceMAD,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity,
          totalMAD: quantity * product.priceMAD,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQty,
              totalMAD: newQty * item.product.priceMAD,
            }
          : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Checkout and Auto-Invoice creation from Cart
  const handleCheckout = async (clientName: string, paymentMethod: string) => {
    if (cart.length === 0) return;

    const totalTTC = cart.reduce((acc, it) => acc + it.totalMAD, 0);
    const invoiceNum = `VFE26-${String(invoices.length + 7261).padStart(5, '0')}`;
    const itemsSummary = cart
      .map((it) => `${it.product.title.slice(0, 16)} (x${it.quantity})`)
      .join('  ');

    const newInvoice: InvoiceDocument = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      date: new Date().toISOString(),
      type: 'FACTURE',
      categoryType: 'PIÈCE',
      clientName,
      clientCode: `CLT-TNG${Math.floor(1000 + Math.random() * 9000)}`,
      clientICE: '003720270000090',
      clientVehicle: currentVehicle
        ? `${currentVehicle.make} ${currentVehicle.model.slice(0, 20)}`
        : 'Client Comptoir',
      itemsSummary,
      totalHT_MAD: totalTTC / 1.2,
      totalTVA_MAD: totalTTC - totalTTC / 1.2,
      totalTTC_MAD: totalTTC,
      items: [...cart],
      itemsDetail: cart.map((it) => ({
        ref: it.product.ref,
        designation: `${it.product.title} (${it.product.brand})`,
        quantity: it.quantity,
        unitPriceTTC: it.product.priceMAD,
        discountPercent: 0,
        totalTTC: it.totalMAD,
      })),
      commercial: 'Morad Fouder (Gérant)',
      transporteur: 'Comptoir Garage Auto El Haji Tanger',
      paymentMethod,
      paymentCondition: 'Comptant (0J)',
      status: 'PAYÉ',
    };

    // 1. Deduct stock quantities in real time locally and in Firebase
    setProducts((prev) =>
      prev.map((prod) => {
        const inCart = cart.find((c) => c.product.id === prod.id);
        if (inCart) {
          const newQty = Math.max(0, prod.stockQuantity - inCart.quantity);
          updateProductStockInFirestore(prod.id, newQty).catch((err) =>
            console.warn('Firebase stock update note:', err)
          );
          return {
            ...prod,
            stockQuantity: newQty,
            status: newQty > 0 ? 'in_stock' : 'out_of_stock',
          };
        }
        return prod;
      })
    );

    // 2. Add invoice to list and save to Firebase
    setInvoices((prev) => [newInvoice, ...prev]);
    saveInvoiceToFirestore(newInvoice)
      .then(() => {
        setFirebaseStatus('connected');
        showToast('success', `Facture ${invoiceNum} enregistrée !`, 'Enregistrée avec succès.');
      })
      .catch((err) => {
        console.warn('Firebase save invoice note:', err);
        if (err?.code === 'permission-denied') setFirebaseStatus('blocked');
      });

    // 3. Clear cart, open print modal, and switch to "Mes Factures"
    setCart([]);
    setInvoiceToPrint(newInvoice);
    setCurrentView('factures');
  };

  // Direct Create Invoice from "Mes Factures"
  const handleCreateInvoice = async (payload: CreateInvoicePayload) => {
    const invoiceNum = `VFE26-${String(invoices.length + 7261).padStart(5, '0')}`;
    const itemsSummary = payload.itemsDetail
      .map((it) => `${it.ref} (x${it.quantity})`)
      .join('  ');

    const newInvoice: InvoiceDocument = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      date: new Date().toISOString(),
      type: 'FACTURE',
      categoryType: 'PIÈCE',
      clientName: payload.clientName,
      clientPhone: payload.clientPhone,
      clientVehicle: payload.clientVehicle,
      clientICE: payload.clientICE,
      clientCode: `CLT-TNG${Math.floor(1000 + Math.random() * 9000)}`,
      itemsSummary,
      totalHT_MAD: payload.totalHT,
      totalTVA_MAD: payload.totalTVA,
      totalTTC_MAD: payload.totalTTC,
      items: payload.items,
      itemsDetail: payload.itemsDetail,
      commercial: payload.commercial,
      transporteur: payload.transporteur,
      paymentMethod: payload.paymentMethod,
      paymentCondition: payload.paymentCondition,
      status:
        payload.paymentMethod.includes('terme') ||
        payload.paymentMethod.includes('attente')
          ? 'EN_ATTENTE'
          : 'PAYÉ',
    };

    // 1. Deduct stock quantities in real time locally and in Firebase
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = payload.items.find((c) => c.product.id === prod.id);
        if (soldItem) {
          const newQty = Math.max(0, prod.stockQuantity - soldItem.quantity);
          updateProductStockInFirestore(prod.id, newQty).catch((err) =>
            console.warn('Firebase stock update note:', err)
          );
          return {
            ...prod,
            stockQuantity: newQty,
            status: newQty > 0 ? 'in_stock' : 'out_of_stock',
          };
        }
        return prod;
      })
    );

    // 2. Add invoice to list and save to Firebase
    setInvoices((prev) => [newInvoice, ...prev]);
    saveInvoiceToFirestore(newInvoice)
      .then(() => {
        setFirebaseStatus('connected');
        showToast('success', `Facture ${invoiceNum} créée !`, 'Enregistrée avec succès.');
      })
      .catch((err) => {
        console.warn('Firebase save invoice note:', err);
        if (err?.code === 'permission-denied') setFirebaseStatus('blocked');
      });

    // 3. Open print modal with Morad's invoice
    setInvoiceToPrint(newInvoice);
    setCurrentView('factures');
  };

  const handleDeleteInvoice = async (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    deleteInvoiceFromFirestore(id).catch((err) => {
      console.warn('Firebase delete invoice note:', err);
      if (err?.code === 'permission-denied') setFirebaseStatus('blocked');
    });
  };

  const handleToggleInvoiceStatus = async (id: string) => {
    const target = invoices.find((inv) => inv.id === id);
    if (!target) return;
    const newStatus: 'PAYÉ' | 'EN_ATTENTE' =
      target.status === 'PAYÉ' ? 'EN_ATTENTE' : 'PAYÉ';

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv))
    );
    updateInvoiceStatusInFirestore(id, newStatus)
      .then(() => setFirebaseStatus('connected'))
      .catch((err) => {
        console.warn('Firebase update status note:', err);
        if (err?.code === 'permission-denied') setFirebaseStatus('blocked');
      });
  };

  // Admin Stock & Price updates
  const handleUpdateProductStock = async (
    productId: string,
    newStock: number,
    newPrice?: number
  ) => {
    const stock = Math.max(0, newStock);
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            stockQuantity: stock,
            status: stock > 0 ? 'in_stock' : 'out_of_stock',
            priceMAD: newPrice !== undefined ? newPrice : p.priceMAD,
          };
        }
        return p;
      })
    );

    updateProductStockInFirestore(productId, stock, newPrice)
      .then(() => setFirebaseStatus('connected'))
      .catch((err) => {
        console.warn('Firebase update product note:', err);
        if (err?.code === 'permission-denied') setFirebaseStatus('blocked');
      });
  };

  // Stock Arrival Quantity
  const handleAddStockQuantity = async (
    productId: string,
    quantityToAdd: number
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const newQty = prod.stockQuantity + quantityToAdd;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            stockQuantity: newQty,
            status: newQty > 0 ? 'in_stock' : 'out_of_stock',
          };
        }
        return p;
      })
    );

    updateProductStockInFirestore(productId, newQty)
      .then(() => {
        setFirebaseStatus('connected');
        showToast('success', `+${quantityToAdd} unités ajoutées à ${prod.title.slice(0, 16)}`, 'Stock mis à jour avec succès.');
      })
      .catch((err) => {
        console.warn('Firebase stock arrival note:', err);
        if (err?.code === 'permission-denied') setFirebaseStatus('blocked');
      });
  };

  const handleDeleteProduct = async (productId: string) => {
    const prodToDelete = products.find((p) => p.id === productId);
    const refToDelete = prodToDelete?.ref;

    // Track as deleted so auto-seed never resurrects it
    const nextDeleted = Array.from(
      new Set([...deletedProductIds, productId, ...(refToDelete ? [refToDelete] : [])])
    );
    setDeletedProductIds(nextDeleted);
    try {
      localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(nextDeleted));
    } catch (e) {
      console.warn('Storage set error:', e);
    }

    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== productId && (!refToDelete || p.ref !== refToDelete));
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(next));
      } catch (e) {
        console.warn('Storage set error:', e);
      }
      return next;
    });

    try {
      await deleteProductFromFirestore(productId);
      setFirebaseStatus('connected');
      showToast(
        'success',
        `Article ${refToDelete || productId} supprimé !`,
        'Supprimé du catalogue avec succès.'
      );
    } catch (err: any) {
      console.warn('Firebase delete product note:', err);
      if (err?.code === 'permission-denied') setFirebaseStatus('blocked');
      showToast('warning', `Article ${refToDelete || productId} supprimé localement`, 'Suppression enregistrée.');
    }
  };

  const handleUpdateProduct = async (updatedProduct: AutoProduct) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(next));
      } catch (e) {
        console.warn('Storage set error:', e);
      }
      return next;
    });

    try {
      await saveProductToFirestore(updatedProduct);
      setFirebaseStatus('connected');
      showToast(
        'success',
        `Article ${updatedProduct.ref} modifié avec succès !`,
        'Modifications enregistrées avec succès.'
      );
    } catch (err: any) {
      console.warn('Firebase update product note:', err);
      if (err?.code === 'permission-denied') {
        setFirebaseStatus('blocked');
      }
      showToast(
        'warning',
        `Article ${updatedProduct.ref} modifié localement`,
        'Enregistré sur cet appareil.'
      );
    }
  };

  const handleAddProduct = async (newProd: AutoProduct) => {
    setProducts((prev) => [newProd, ...prev]);
    try {
      await saveProductToFirestore(newProd);
      setFirebaseStatus('connected');
      showToast('success', `Article ${newProd.ref} ajouté !`, 'Article enregistré dans le catalogue.');
    } catch (err: any) {
      console.warn('Firebase add product note:', err);
      if (err?.code === 'permission-denied') {
        setFirebaseStatus('blocked');
      }
      showToast(
        'warning',
        `Article ${newProd.ref} sauvegardé localement`,
        'Sauvegardé sur cet appareil.'
      );
    }
  };

  const handleAddMultipleProducts = async (newProds: AutoProduct[]) => {
    if (newProds.length === 0) return;

    // 1. Update local state immediately
    setProducts((prev) => {
      // Put new products at the beginning
      const next = [...newProds, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(next));
      } catch (e) {
        console.warn('Storage set error:', e);
      }
      return next;
    });

    // 2. Sync each product to Firestore
    try {
      let savedCount = 0;
      for (const prod of newProds) {
        await saveProductToFirestore(prod);
        savedCount++;
      }
      setFirebaseStatus('connected');
      showToast(
        'success',
        `${newProds.length} pièces ajoutées avec succès !`,
        'Enregistrées dans le catalogue.'
      );
    } catch (err: any) {
      console.warn('Firebase add multiple products note:', err);
      if (err?.code === 'permission-denied') {
        setFirebaseStatus('blocked');
      }
      showToast(
        'warning',
        `${newProds.length} pièces ajoutées localement`,
        'Sauvegardées sur cet appareil.'
      );
    }
  };

  const handleUpdateProductImage = async (productId: string, imageUrl: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, imageUrl } : p))
    );
    try {
      await updateProductImageInFirestore(productId, imageUrl);
      setFirebaseStatus('connected');
      showToast('success', 'Photo mise à jour !', 'Photo enregistrée avec succès.');
    } catch (err: any) {
      console.warn('Firebase image update note:', err);
      if (err?.code === 'permission-denied') setFirebaseStatus('blocked');
    }
  };

  const [isSyncingLiquiMoly, setIsSyncingLiquiMoly] = useState(false);

  const handleForceSyncLiquiMolyToFirebase = async () => {
    setIsSyncingLiquiMoly(true);
    try {
      const initialRefs = new Set(INITIAL_AUTO_PRODUCTS.map((p) => p.ref));
      const initialIds = new Set(INITIAL_AUTO_PRODUCTS.map((p) => p.id));
      const nextDeleted = deletedProductIds.filter((id) => !initialRefs.has(id) && !initialIds.has(id));
      setDeletedProductIds(nextDeleted);
      try {
        localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(nextDeleted));
      } catch (e) {
        console.warn(e);
      }

      setProducts((prev) => {
        const existingRefs = new Set(prev.map((p) => p.ref));
        const missing = INITIAL_AUTO_PRODUCTS.filter((p) => !existingRefs.has(p.ref));
        const merged = [...prev, ...missing];
        try {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(merged));
        } catch (e) {
          console.warn(e);
        }
        return merged;
      });

      let count = 0;
      for (const prod of INITIAL_AUTO_PRODUCTS) {
        await saveProductToFirestore(prod);
        count++;
      }
      setFirebaseStatus('connected');
      showToast(
        'success',
        `Catalogue synchronisé (${count} articles) !`,
        'Toutes les pièces sont à jour.'
      );
    } catch (err: any) {
      console.warn('Sync Liqui Moly error:', err);
      showToast(
        'warning',
        'Synchronisation locale active',
        'Vos pièces sont enregistrées sur cet appareil.'
      );
    } finally {
      setIsSyncingLiquiMoly(false);
    }
  };

  // If not authenticated, render the dedicated EL HAJI AUTO Login Screen
  if (!currentUser) {
    return (
      <>
        <LoginScreen
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            showToast(
              'success',
              `Bienvenue ${user.displayName} !`,
              `Connecté avec ${user.email}`
            );
          }}
        />
        {/* Floating Toast Notification during login */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-slate-200 rounded-xl shadow-2xl p-4 flex items-start gap-3 animate-fade-in no-print">
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {toast.type === 'warning' && <ShieldAlert className="w-5 h-5 text-amber-600" />}
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600" />}
            </div>
            <div className="flex-1 text-xs">
              <div className="font-bold text-slate-900">{toast.message}</div>
              {toast.sub && <p className="text-slate-600 mt-0.5">{toast.sub}</p>}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <KaufmannHeader
        currentView={currentView}
        setCurrentView={setCurrentView}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenStockArrivalModal={() => setIsStockArrivalOpen(true)}
        onOpenNewInvoiceModal={() => setIsNewInvoiceModalOpen(true)}
        selectedFamily={selectedFamily}
        setSelectedFamily={setSelectedFamily}
        totalInvoicesCount={invoices.length}
        currentUser={currentUser}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onLogout={handleLogout}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Content Area: ONLY 2 VIEWS */}
      <main className="flex-1">
        {/* 1. STOCK & CATALOGUE VIEW */}
        {currentView === 'catalogue' && (
          <ProductCatalog
            products={products}
            currentVehicle={currentVehicle}
            onAddToCart={handleAddToCart}
            onUpdateProductStock={handleUpdateProductStock}
            onDeleteProduct={handleDeleteProduct}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenBulkAddModal={() => setIsBulkAddModalOpen(true)}
            onOpenStockArrivalModal={() => setIsStockArrivalOpen(true)}
            searchTerm={searchTerm}
            selectedFamily={selectedFamily}
            setSelectedFamily={setSelectedFamily}
            onUpdateProductImage={handleUpdateProductImage}
            onUpdateProduct={handleUpdateProduct}
            isAdmin={Boolean(currentUser)}
          />
        )}

        {/* 2. MES FACTURES VIEW */}
        {currentView === 'factures' && (
          <DocumentsView
            invoices={invoices}
            onPrintInvoice={(inv) => setInvoiceToPrint(inv)}
            onOpenNewInvoiceModal={() => setIsNewInvoiceModalOpen(true)}
            onDeleteInvoice={handleDeleteInvoice}
            onToggleStatus={handleToggleInvoiceStatus}
          />
        )}
      </main>

      {/* Slide-over Cart / Sale Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateCartQty={handleUpdateCartQty}
        onRemoveCartItem={handleRemoveCartItem}
        onCheckout={handleCheckout}
      />

      {/* Quick Add Product Modal (Single Product) */}
      <QuickAddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddProduct}
      />

      {/* Bulk Add Products Modal (Multi-Produits f deqqa wehda) */}
      <BulkAddProductsModal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        onAddProducts={handleAddMultipleProducts}
      />

      {/* Quick Stock Arrival Modal */}
      <StockArrivalModal
        isOpen={isStockArrivalOpen}
        onClose={() => setIsStockArrivalOpen(false)}
        products={products}
        onAddStockQuantity={handleAddStockQuantity}
      />

      {/* Dedicated Create Invoice Modal (fash nbi3 shihaja) */}
      <CreateInvoiceModal
        isOpen={isNewInvoiceModalOpen}
        onClose={() => setIsNewInvoiceModalOpen(false)}
        products={products}
        onCreateInvoice={handleCreateInvoice}
      />

      {/* Print / View Invoice Modal */}
      <PrintInvoiceModal
        invoice={invoiceToPrint}
        onClose={() => setInvoiceToPrint(null)}
      />

      {/* Account Profile Details Modal */}
      {currentUser && (
        <AccountModal
          user={currentUser}
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          onLogout={handleLogout}
        />
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-3.5 sm:p-4 flex items-start gap-3 animate-fade-in no-print">
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {toast.type === 'warning' && <ShieldAlert className="w-5 h-5 text-amber-600" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600" />}
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-slate-900">{toast.message}</div>
            {toast.sub && <p className="text-slate-600 mt-0.5">{toast.sub}</p>}
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Clean Footer */}
      <footer className="bg-[#001f3f] text-slate-400 py-6 text-xs border-t border-[#001428] no-print mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-extrabold text-[#e52e2d] tracking-wide text-sm">
              EL HAJI AUTO
            </span>
            <span className="hidden sm:inline text-slate-600">·</span>
            <span className="text-slate-300">
              GARAGE AUTO EL HAJI · Route de Tétouan, Km 3.5, Quartier Moghogha, Tanger (Maroc)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
            <span>ICE: 002984123000045</span>
            <span>·</span>
            <span>RC Tanger: 94812</span>
            <span>·</span>
            <span>Tél: 06 58 62 98 41</span>
            <span>·</span>
            <span>elhajiauto.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
