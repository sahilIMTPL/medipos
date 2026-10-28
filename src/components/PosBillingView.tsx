"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ShoppingCart,
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  PauseCircle,
  RefreshCw,
  CreditCard,
  DollarSign,
  User,
  X,
  QrCode,
  ShieldAlert,
  Camera,
  Bookmark,
  ArrowRight,
  LayoutGrid,
  List,
  Stethoscope,
  Pill,
  Phone,
  Check,
  Zap,
  WifiOff,
  ChevronDown,
  Clock,
  Receipt,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import {
  api,
  ProductItem,
  CategoryItem,
  CustomerItem,
} from "@/lib/api";
import SalesInvoiceModal from "./SalesInvoiceModal";
import CameraBarcodeScannerModal from "./CameraBarcodeScannerModal";
import GenericSubstituteModal from "./GenericSubstituteModal";
import { useStore } from "@/context/StoreContext";
import { doctorApi, PendingQueueRxItem } from "@/lib/api/doctor.api";

export interface CartItem {
  product: ProductItem;
  selectedBatch: {
    id: string;
    batchNumber: string;
    expiryDate: string;
    availableQty: number;
    mrp: number;
    purchasePrice: number;
  };
  quantity: number;
  saleUnit: string;
  isBaseUnitSale: boolean; // true if selling loose tabs, false if full pack/strip
  conversionFactor: number;
  unitPrice: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  gstRate: number;
}

export interface HeldBill {
  id: string;
  holdTime: string;
  customerId?: string;
  customerName: string;
  doctorName?: string;
  items: CartItem[];
  grandTotal: number;
}

/**
 * Clean, modern medication visual indicator badge
 */
const MedicineBadge = React.memo(function MedicineBadge({
  dosageForm,
  name,
}: {
  dosageForm?: string;
  name?: string;
}) {
  const form = (dosageForm || "").toLowerCase();
  const title = (name || "").toLowerCase();

  let bg = "bg-indigo-50 text-indigo-700 border-indigo-100";
  let label = "TAB";

  if (form.includes("syrup") || title.includes("syrup") || title.includes("susp")) {
    bg = "bg-amber-50 text-amber-700 border-amber-100";
    label = "SYR";
  } else if (form.includes("inj") || title.includes("inj")) {
    bg = "bg-rose-50 text-rose-700 border-rose-100";
    label = "INJ";
  } else if (form.includes("capsule") || title.includes("cap")) {
    bg = "bg-purple-50 text-purple-700 border-purple-100";
    label = "CAP";
  } else if (form.includes("drop") || title.includes("drop")) {
    bg = "bg-sky-50 text-sky-700 border-sky-100";
    label = "DRP";
  } else if (form.includes("cream") || form.includes("gel") || form.includes("oint")) {
    bg = "bg-teal-50 text-teal-700 border-teal-100";
    label = "GEL";
  }

  return (
    <div
      className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center flex-shrink-0 font-bold transition shadow-xs ${bg}`}
    >
      <Pill className="w-4 h-4 mb-1" />
      <span className="text-[9px] font-black tracking-wider leading-none">{label}</span>
    </div>
  );
});

export default function PosBillingView() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState("Walk-in");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [showRxDetails, setShowRxDetails] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [rxNotes, setRxNotes] = useState("");

  // Refs for customer dropdown & hardware barcode scanner
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const newCustNameInputRef = useRef<HTMLInputElement>(null);
  const newCustPhoneInputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  // Quick Customer Add Modal
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");

  // Held Bills State
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);

  // Payment Checkout Modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD" | "SPLIT">("CASH");
  const [tenderedAmount, setTenderedAmount] = useState<number>(0);
  const [paymentRef, setPaymentRef] = useState("");
  const [processingSale, setProcessingSale] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Store context
  const { currentStore } = useStore();

  // Generic Salt Substitute Finder Modal
  const [selectedProductForSubstitutes, setSelectedProductForSubstitutes] = useState<ProductItem | null>(null);
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);

  // Offline Billing & Auto-sync state
  const [isOnline, setIsOnline] = useState(true);
  const [offlineSalesCount, setOfflineSalesCount] = useState(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  // Printed Invoice Modal
  const [completedInvoiceId, setCompletedInvoiceId] = useState<string | null>(null);

  // Camera Barcode Scanner Modal
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Doctor OPD Prescription Queue State
  const [pendingDoctorRxs, setPendingDoctorRxs] = useState<PendingQueueRxItem[]>([]);
  const [isDoctorRxModalOpen, setIsDoctorRxModalOpen] = useState(false);
  const [activePrescriptionId, setActivePrescriptionId] = useState<string | null>(null);

  const getStoredOfflineSales = (): any[] => {
    try {
      const raw = localStorage.getItem("medipos_offline_sales");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const setStoredOfflineSales = (sales: any[]) => {
    try {
      localStorage.setItem("medipos_offline_sales", JSON.stringify(sales));
      setOfflineSalesCount(sales.length);
    } catch { }
  };

  const syncOfflineSales = async () => {
    const queued = getStoredOfflineSales();
    if (queued.length === 0 || isSyncingOffline) return;

    setIsSyncingOffline(true);
    const remaining: any[] = [];
    let syncedCount = 0;

    for (const sale of queued) {
      try {
        await api.createSale(sale, sale.id);
        syncedCount++;
      } catch (err) {
        console.error("Failed to sync offline sale:", err);
        remaining.push(sale);
      }
    }

    setStoredOfflineSales(remaining);
    setIsSyncingOffline(false);
    if (syncedCount > 0) {
      loadData();
    }
  };

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, cData, custData] = await Promise.all([
        api.getProducts({ status: "ACTIVE", storeId: currentStore?.id }),
        api.getCategories(),
        api.getCustomers({ storeId: currentStore?.id }),
      ]);

      if (pData.products) setProducts(pData.products);
      if (cData.categories) setCategories(cData.categories);
      if (custData.customers) setCustomers(custData.customers);
      fetchDoctorRxQueue();
    } catch (err) {
      console.error("Failed to load POS catalog", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorRxQueue = async () => {
    try {
      const res = await doctorApi.getPendingDoctorRxQueue({ storeId: currentStore?.id });
      if (res.success) {
        setPendingDoctorRxs(res.pendingRxList);
      }
    } catch (err) {
      console.error("Failed to load doctor Rx queue", err);
    }
  };

  // 1-Click Load Doctor Prescription into POS Cart
  const handleLoadPrescriptionToCart = (rx: PendingQueueRxItem) => {
    setSelectedCustomerId(rx.customerId || null);
    setSelectedCustomer(rx.patientName);
    setCustomerPhone(rx.patientPhone || "");
    setCustomerSearchInput(rx.patientName);
    setDoctorName(rx.doctorName);
    setDoctorRegNo(rx.doctorRegNo !== "N/A" ? rx.doctorRegNo : "");
    setRxNotes(`Diagnosis: ${rx.diagnosis} | Ref: ${rx.rxNumber}`);
    setActivePrescriptionId(rx.id);
    setShowRxDetails(true);

    const addedList: string[] = [];
    const skippedList: string[] = [];

    for (const item of rx.items) {
      if (item.isAvailable && item.matchedProductId) {
        const prod = products.find((p) => p.id === item.matchedProductId);
        if (prod && prod.batches && prod.batches.length > 0) {
          const batchIdToUse = item.feffoBatch?.id || prod.batches[0].id;
          handleAddToCart(prod, batchIdToUse);
          addedList.push(item.productName);
        } else {
          skippedList.push(item.productName);
        }
      } else {
        skippedList.push(item.productName);
      }
    }

    setIsDoctorRxModalOpen(false);

    if (skippedList.length > 0) {
      alert(
        `Prescription ${rx.rxNumber} loaded into POS Cart!\n\n` +
        `Added to Cart (${addedList.length}): ${addedList.join(", ")}\n` +
        `Skipped Out-of-Stock (${skippedList.length}): ${skippedList.join(", ")}`
      );
    }
  };

  // Re-load POS inventory catalog whenever current store branch changes
  useEffect(() => {
    loadData();
  }, [currentStore?.id]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("medipos_held_bills");
      if (stored) setHeldBills(JSON.parse(stored));
      const off = getStoredOfflineSales();
      setOfflineSalesCount(off.length);
    } catch { }

    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        syncOfflineSales();
      };
      const handleOffline = () => {
        setIsOnline(false);
      };
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Autofocus appropriate field when Quick Add Customer modal opens
  useEffect(() => {
    if (isAddCustomerOpen) {
      const timer = setTimeout(() => {
        if (newCustPhone && !newCustName) {
          newCustNameInputRef.current?.focus();
        } else if (newCustName && !newCustPhone) {
          newCustPhoneInputRef.current?.focus();
        } else {
          newCustNameInputRef.current?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isAddCustomerOpen, newCustName, newCustPhone]);

  // Sync held bills to localStorage
  const saveHeldBills = (newHeld: HeldBill[]) => {
    setHeldBills(newHeld);
    try {
      localStorage.setItem("medipos_held_bills", JSON.stringify(newHeld));
    } catch { }
  };

  // Add Product to Cart with Intelligent FEFO Batch Selection
  const handleAddToCart = (product: ProductItem, forceBatchId?: string) => {
    if (!product.batches || product.batches.length === 0) {
      alert(`No active batches available for "${product.name}".`);
      return;
    }

    const factor =
      product.conversions && product.conversions.length > 0
        ? Number(product.conversions[0].factor || (product.conversions[0] as any).conversionFactor) || 10
        : (product as any).factor || 10;

    let targetBatch: any = null;
    let isBaseUnitSale = false;

    if (forceBatchId) {
      targetBatch = product.batches.find((b) => b.id === forceBatchId) || product.batches[0];
    } else {
      targetBatch = product.batches.find((b) => Number(b.availableQty) >= factor);
      if (!targetBatch) {
        targetBatch = product.batches.find((b) => Number(b.availableQty) > 0);
        if (targetBatch) {
          isBaseUnitSale = true;
        }
      }
    }

    if (!targetBatch || Number(targetBatch.availableQty) <= 0) {
      alert(`"${product.name}" is completely out of stock across all batches.`);
      return;
    }

    if (!isBaseUnitSale && Number(targetBatch.availableQty) < factor) {
      isBaseUnitSale = true;
    }

    const saleUnit = isBaseUnitSale ? product.baseUnit : product.saleUnit;
    const unitPrice = isBaseUnitSale
      ? Number((product.mrp / factor).toFixed(2))
      : Number(product.mrp || 0);

    const maxAllowed = isBaseUnitSale
      ? Number(targetBatch.availableQty)
      : Math.floor(Number(targetBatch.availableQty) / factor);

    const existingIndex = cart.findIndex(
      (c) =>
        c.product.id === product.id &&
        c.selectedBatch.id === targetBatch.id &&
        c.isBaseUnitSale === isBaseUnitSale
    );

    if (existingIndex >= 0) {
      if (cart[existingIndex].quantity >= maxAllowed) {
        alert(
          `Maximum stock reached for batch ${targetBatch.batchNumber} (${maxAllowed} ${saleUnit}s).`
        );
        return;
      }
      setCart((prev) => {
        const copy = [...prev];
        copy[existingIndex].quantity += 1;
        return copy;
      });
    } else {
      setCart((prev) => [
        ...prev,
        {
          product,
          selectedBatch: targetBatch,
          quantity: 1,
          saleUnit,
          isBaseUnitSale,
          conversionFactor: factor,
          unitPrice,
          discountType: "PERCENTAGE",
          discountValue: 0,
          gstRate: Number(product.gstRate || 12),
        },
      ]);
    }

    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  };

  // Beep on Successful Barcode Scan
  const playScanBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1850, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) { }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(80);
      } catch (e) { }
    }
  };

  // Instant Barcode Resolver & Cart Adder
  const handleBarcodeScanned = async (scannedCode: string) => {
    const clean = scannedCode.trim();
    if (!clean) return;

    const candidates = new Set<string>();
    [clean, clean.replace(/[\s-_]/g, "")].forEach((tok) => {
      if (!tok) return;
      const t = tok.toLowerCase();
      candidates.add(t);

      if (t.length === 13 && t.startsWith("890")) {
        candidates.add(t.slice(1));
        candidates.add("99" + t.slice(3));
        candidates.add(t.slice(3));
      }
      if (t.length === 13 && t.startsWith("0")) {
        candidates.add(t.slice(1));
      }
      if (t.length === 12) {
        candidates.add("0" + t);
        if (t.startsWith("90")) {
          candidates.add("8" + t);
          candidates.add("99" + t.slice(2));
          candidates.add(t.slice(2));
        }
      }
      if (t.length === 11) {
        candidates.add("89" + t);
        candidates.add("890" + t.slice(1));
      }
      if (t.length === 10) {
        candidates.add("890" + t);
        candidates.add("90" + t);
        candidates.add("0" + t);
      }
    });

    // 1. Local Lookup
    const localMatch = products.find((p) => {
      const pBarcode = (p.barcode || "").toLowerCase();
      const pSku = (p.sku || "").toLowerCase();
      const pName = (p.name || "").toLowerCase();
      for (const cand of candidates) {
        if (pBarcode === cand || pSku === cand || pName === cand) return true;
      }
      return false;
    });

    if (localMatch) {
      playScanBeep();
      handleAddToCart(localMatch);
      setSearchQuery("");
      return;
    }

    // 2. High-speed Database Lookup
    try {
      const res = await api.lookupBarcode(clean);
      if (res.success && res.product) {
        playScanBeep();
        setProducts((prev) => {
          if (!prev.some((p) => p.id === res.product.id)) {
            return [res.product, ...prev];
          }
          return prev;
        });
        handleAddToCart(res.product);
        setSearchQuery("");
      } else {
        alert(`No medicine found for barcode: "${clean}"`);
      }
    } catch (err: any) {
      alert(`No medicine found for barcode: "${clean}"`);
    }
  };

  // Enter in search bar
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = e.currentTarget.value.trim() || searchQuery.trim();
      if (val) {
        handleBarcodeScanned(val);
      }
    }
  };

  // Hardware Scanner & Shortcuts Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        isCameraScannerOpen ||
        completedInvoiceId ||
        isHeldModalOpen ||
        isPaymentOpen ||
        isAddCustomerOpen ||
        isDoctorRxModalOpen
      ) {
        return;
      }

      if (e.key === "F9") {
        e.preventDefault();
        if (cart.length > 0) {
          const t = calculateTotals();
          setTenderedAmount(t.grandTotal);
          setIsPaymentOpen(true);
        }
        return;
      } else if (e.key === "F2") {
        e.preventDefault();
        if (barcodeInputRef.current) barcodeInputRef.current.focus();
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable);

      if (isInput) return;

      const currentTime = Date.now();
      const timeSinceLastKey = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      if (timeSinceLastKey > 250) {
        barcodeBufferRef.current = "";
      }

      if (e.key === "Enter") {
        if (barcodeBufferRef.current.length >= 3) {
          e.preventDefault();
          const scannedCode = barcodeBufferRef.current;
          barcodeBufferRef.current = "";
          handleBarcodeScanned(scannedCode);
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    cart,
    isCameraScannerOpen,
    completedInvoiceId,
    isHeldModalOpen,
    isPaymentOpen,
    isAddCustomerOpen,
    isDoctorRxModalOpen,
    products,
  ]);

  // Update item quantity
  const handleUpdateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const it = copy[index];
      const factor = it.isBaseUnitSale ? 1 : (it.conversionFactor || 1);
      const maxAllowed = it.isBaseUnitSale
        ? Number(it.selectedBatch.availableQty)
        : Math.floor(Number(it.selectedBatch.availableQty) / factor);

      const newQty = it.quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, idx) => idx !== index);
      }
      if (maxAllowed > 0 && newQty > maxAllowed) {
        return copy;
      }
      copy[index].quantity = newQty;
      return copy;
    });
  };

  // Toggle unit: Pack/Strip vs Loose Tablet
  const handleToggleUnit = (index: number, forceUnit?: "STRIP" | "BASE") => {
    setCart((prev) => {
      const copy = [...prev];
      const it = copy[index];
      const factor = it.conversionFactor || 1;
      const targetIsBase =
        forceUnit !== undefined ? forceUnit === "BASE" : !it.isBaseUnitSale;

      if (!targetIsBase) {
        if (Number(it.selectedBatch.availableQty) < factor) {
          const batchWithFullStrip = it.product.batches.find(
            (b) => Number(b.availableQty) >= factor
          );
          if (batchWithFullStrip) {
            const maxPacks = Math.floor(Number(batchWithFullStrip.availableQty) / factor);
            copy[index] = {
              ...it,
              selectedBatch: batchWithFullStrip,
              isBaseUnitSale: false,
              saleUnit: it.product.saleUnit,
              unitPrice: Number(it.product.mrp),
              quantity: Math.min(Math.max(1, it.quantity), maxPacks),
            };
            return copy;
          } else {
            alert(
              `Cannot sell full ${it.product.saleUnit}. No batch has ${factor} ${it.product.baseUnit}s available.`
            );
            return copy;
          }
        }

        const maxPacks = Math.floor(Number(it.selectedBatch.availableQty) / factor);
        copy[index] = {
          ...it,
          isBaseUnitSale: false,
          saleUnit: it.product.saleUnit,
          unitPrice: Number(it.product.mrp),
          quantity: Math.min(Math.max(1, it.quantity), maxPacks),
        };
      } else {
        const maxTabs = Number(it.selectedBatch.availableQty);
        copy[index] = {
          ...it,
          isBaseUnitSale: true,
          saleUnit: it.product.baseUnit,
          unitPrice: Number((it.product.mrp / factor).toFixed(2)),
          quantity: Math.min(Math.max(1, it.quantity), maxTabs),
        };
      }
      return copy;
    });
  };

  // Update Discount
  const handleUpdateDiscount = (
    index: number,
    type: "PERCENTAGE" | "FIXED",
    value: number
  ) => {
    setCart((prev) => {
      const copy = [...prev];
      copy[index].discountType = type;
      copy[index].discountValue = Math.max(0, value);
      return copy;
    });
  };

  // Statutory Indian Pharma MRP-Inclusive Tax Formula
  const calculateTotals = useCallback(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let taxTotal = 0;

    for (const it of cart) {
      const lineGross = it.quantity * it.unitPrice;
      let disc = 0;
      if (it.discountType === "PERCENTAGE") {
        disc = (lineGross * it.discountValue) / 100;
      } else {
        disc = it.discountValue;
      }
      disc = Math.min(lineGross, disc);

      const linePayable = Math.max(0, lineGross - disc);
      const gstRate = Number(it.gstRate || 0);
      const taxable = gstRate > 0 ? linePayable / (1 + gstRate / 100) : linePayable;
      const tax = linePayable - taxable;

      subtotal += lineGross;
      totalDiscount += disc;
      taxTotal += tax;
    }

    const net = subtotal - totalDiscount;
    const rounded = Math.round(net);
    const roundOff = rounded - net;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      roundOff: Number(roundOff.toFixed(2)),
      grandTotal: rounded,
    };
  }, [cart]);

  const totals = useMemo(() => calculateTotals(), [calculateTotals]);

  // Check if cart contains Rx items
  const hasRxItem = useMemo(() => cart.some((c) => c.product.isPrescriptionRequired), [cart]);

  // Hold Bill
  const handleHoldBill = () => {
    if (cart.length === 0) return;

    const newBill: HeldBill = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      holdTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomer,
      doctorName: doctorName || undefined,
      items: cart,
      grandTotal: totals.grandTotal,
    };

    saveHeldBills([newBill, ...heldBills]);
    setCart([]);
    setSelectedCustomerId(null);
    setSelectedCustomer("Walk-in");
    setCustomerPhone("");
    setCustomerSearchInput("");
    setDoctorName("");
    setDoctorRegNo("");
    setShowRxDetails(false);
  };

  // Resume Bill
  const handleResumeBill = (held: HeldBill) => {
    setCart(held.items);
    setSelectedCustomerId(held.customerId || null);
    setSelectedCustomer(held.customerName);
    setCustomerSearchInput(held.customerName === "Walk-in" ? "" : held.customerName);
    const existing = customers.find((c) => (held.customerId && c.id === held.customerId) || c.name === held.customerName);
    setCustomerPhone(existing?.phone || "");
    if (held.doctorName) {
      setDoctorName(held.doctorName);
      setShowRxDetails(true);
    }
    saveHeldBills(heldBills.filter((b) => b.id !== held.id));
    setIsHeldModalOpen(false);
  };

  // Quick Add Customer
  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || isSavingCustomer) return;

    setIsSavingCustomer(true);
    try {
      const res = await api.createCustomer({
        name: newCustName.trim(),
        phone: newCustPhone.trim() || undefined,
      });

      if (res.customer) {
        setCustomers((prev) => {
          if (prev.some((c) => c.id === res.customer.id)) return prev;
          return [res.customer, ...prev];
        });
        setSelectedCustomerId(res.customer.id);
        setSelectedCustomer(res.customer.name);
        setCustomerPhone(res.customer.phone || "");
        setCustomerSearchInput(res.customer.name);
      }
      setIsAddCustomerOpen(false);
      setNewCustName("");
      setNewCustPhone("");
    } catch (err: any) {
      alert(err.message || "Failed to create customer");
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Process Checkout Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    if (hasRxItem) {
      if (!doctorName.trim()) {
        setCheckoutError("Doctor Name is required because Schedule H prescription medicines are in the cart.");
        setShowRxDetails(true);
        return;
      }
      if (!doctorRegNo.trim()) {
        setCheckoutError("Doctor Registration Number is required by pharmacy regulations.");
        setShowRxDetails(true);
        return;
      }
    }

    if (processingSale) return;
    setProcessingSale(true);
    setCheckoutError("");
    const checkoutIdempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `pos-${Date.now()}`;

    try {
      const payload = {
        storeId: currentStore?.id || undefined,
        customerId: selectedCustomerId || undefined,
        customerName: selectedCustomer,
        customerPhone: customerPhone || undefined,
        doctorName: doctorName.trim() || undefined,
        doctorRegNo: doctorRegNo.trim() || undefined,
        clinicName: rxNotes.trim() || undefined,
        prescriptionId: activePrescriptionId || undefined,
        paymentMethod,
        paymentRef: paymentRef.trim() || undefined,
        paidAmount: paymentMethod === "CASH" ? Number(tenderedAmount || totals.grandTotal) : totals.grandTotal,
        changeAmount:
          paymentMethod === "CASH" && tenderedAmount > totals.grandTotal
            ? tenderedAmount - totals.grandTotal
            : 0,
        items: cart.map((it) => ({
          productId: it.product.id,
          batchId: it.selectedBatch.id,
          saleUnitId: it.isBaseUnitSale ? it.product.baseUnitId : it.product.saleUnitId,
          quantity: it.quantity,
          conversionFactor: it.isBaseUnitSale ? 1 : it.conversionFactor,
          unitPrice: it.unitPrice,
          discountType: it.discountType,
          discountValue: it.discountValue,
          gstRate: it.gstRate,
        })),
      };

      if (typeof window !== "undefined" && !navigator.onLine) {
        const offlineId = `OFF-${Date.now().toString().slice(-6)}`;
        const offlineSale = {
          ...payload,
          id: offlineId,
          offlineTimestamp: new Date().toISOString(),
          totals,
        };

        const existing = getStoredOfflineSales();
        setStoredOfflineSales([offlineSale, ...existing]);

        setCart([]);
        setSelectedCustomerId(null);
        setSelectedCustomer("Walk-in");
        setCustomerPhone("");
        setCustomerSearchInput("");
        setDoctorName("");
        setDoctorRegNo("");
        setRxNotes("");
        setShowRxDetails(false);
        setIsPaymentOpen(false);

        alert(`Sale saved in offline queue (#${offlineId}). Will auto-sync when connected.`);
        return;
      }

      const result = await api.createSale(payload, checkoutIdempotencyKey);

      setCart([]);
      setSelectedCustomerId(null);
      setSelectedCustomer("Walk-in");
      setCustomerPhone("");
      setCustomerSearchInput("");
      setDoctorName("");
      setDoctorRegNo("");
      setRxNotes("");
      setShowRxDetails(false);
      setActivePrescriptionId(null);
      setIsPaymentOpen(false);
      setCompletedInvoiceId(result.invoiceId);

      loadData();
      fetchDoctorRxQueue();
    } catch (err: any) {
      setCheckoutError(err.message || "An error occurred during checkout");
    } finally {
      setProcessingSale(false);
    }
  };

  // Filtered Products for Catalog
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "ALL" || p.categoryId === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;

      return (
        p.name.toLowerCase().includes(q) ||
        (p.genericName && p.genericName.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    });
  }, [products, selectedCategory, searchQuery]);

  // Customer Autocomplete List
  const custQuery = customerSearchInput.trim().toLowerCase();
  const isDigitsQuery = /^[0-9+\-\s]{3,}$/.test(customerSearchInput.trim());
  const matchingCustomers = useMemo(() => {
    if (!custQuery) return customers;
    return customers.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(custQuery);
      const phoneMatch = c.phone ? c.phone.toLowerCase().includes(custQuery) : false;
      return nameMatch || phoneMatch;
    });
  }, [customers, custQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-3 sm:p-5 flex flex-col gap-4">
      {/* Sleek Top Navigation & Quick Actions Bar */}
      <header className="bg-white rounded-2xl border border-slate-200 shadow-xs px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search & Barcode Input */}
        <div className="relative flex-1 w-full max-w-2xl">
          <Barcode className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Scan barcode or search medicine (Press F2 to focus)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-9 pr-24 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
              F2 Focus
            </span>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* Doctor Rx Queue Button */}
          <button
            type="button"
            onClick={() => setIsDoctorRxModalOpen(true)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-2 cursor-pointer shadow-xs ${
              pendingDoctorRxs.length > 0
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Stethoscope className={`w-4 h-4 ${pendingDoctorRxs.length > 0 ? "text-indigo-600 animate-pulse" : "text-slate-400"}`} />
            <span>Doctor Rx</span>
            {pendingDoctorRxs.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingDoctorRxs.length}
              </span>
            )}
          </button>

          {/* Camera Scanner Button */}
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer"
            title="Scan Barcode via Camera"
          >
            <Camera className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Camera</span>
          </button>

          {/* Held Bills Button */}
          <button
            type="button"
            onClick={() => setIsHeldModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <PauseCircle className="w-4 h-4 text-amber-500" />
            <span>Held ({heldBills.length})</span>
          </button>

          {/* Offline Sync Pill (Only if offline or pending sales) */}
          {(!isOnline || offlineSalesCount > 0) && (
            <button
              type="button"
              onClick={syncOfflineSales}
              disabled={!isOnline || isSyncingOffline}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 shadow-xs cursor-pointer ${
                !isOnline
                  ? "bg-amber-500 text-white border-amber-600"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <WifiOff className="w-4 h-4" />
              <span>{offlineSalesCount} Offline</span>
              {isOnline && <RefreshCw className={`w-3 h-3 ${isSyncingOffline ? "animate-spin" : ""}`} />}
            </button>
          )}

          {/* Refresh Catalog */}
          <button
            type="button"
            onClick={loadData}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition shadow-xs cursor-pointer"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Main 2-Pane POS Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start flex-1">
        {/* Left Pane (Catalog & Categories) - 7 Columns */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Category Chips & View Switcher */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                  selectedCategory === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                All Medicines ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                    selectedCategory === c.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {c.name} ({c.productCount})
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs flex-shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("GRID")}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  viewMode === "GRID" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-700"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("LIST")}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  viewMode === "LIST" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-700"
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Medicines Display */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-600">Loading medicine catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
              <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No medicines found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching with another salt name or scan barcode.
              </p>
            </div>
          ) : viewMode === "GRID" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.totalBaseStock <= 0;
                const inCart = cart.some((c) => c.product.id === p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && handleAddToCart(p)}
                    className={`bg-white rounded-2xl border p-3 shadow-xs transition flex flex-col justify-between gap-3 cursor-pointer group ${
                      isOutOfStock
                        ? "opacity-60 bg-slate-50/50 border-slate-200 cursor-not-allowed"
                        : inCart
                        ? "border-indigo-400 ring-2 ring-indigo-50 hover:border-indigo-500"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {/* Header: Badge + Info */}
                    <div className="flex items-start gap-3">
                      <MedicineBadge dosageForm={p.dosageForm} name={p.name} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-600 transition">
                            {p.name}
                          </h3>
                          {p.isPrescriptionRequired && (
                            <span className="text-[9px] font-bold px-1 py-1 rounded bg-rose-50 text-rose-600 border border-rose-200 flex-shrink-0">
                              Rx
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 truncate mt-1">
                          {p.genericName || p.dosageForm || "General Form"}
                        </p>

                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 truncate">
                          <span>{p.saleUnit}</span>
                          <span>•</span>
                          <span>{p.manufacturer || "Generic"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Pricing & Action */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">
                          ₹{p.mrp.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          GST {p.gstRate}%
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isOutOfStock ? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                            Out of Stock
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(p);
                            }}
                            className="px-3 py-1 bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Minimalist List View */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.totalBaseStock <= 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && handleAddToCart(p)}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MedicineBadge dosageForm={p.dosageForm} name={p.name} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">{p.name}</span>
                          {p.isPrescriptionRequired && (
                            <span className="text-[9px] font-bold px-1 py-1 rounded bg-rose-50 text-rose-600 border border-rose-200">
                              Rx
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-1">
                          {p.genericName} • {p.saleUnit} • {p.manufacturer || "Generic"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">₹{p.mrp.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">Stock: {p.totalBaseStock}</div>
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(p);
                        }}
                        className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white text-xs font-bold transition disabled:opacity-40"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Pane (Cart & Register Checkout) - 5 Columns */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden sticky top-4">
          {/* Cart Header: Customer Selection */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-500" />
                <h2 className="font-bold text-sm text-slate-900">Current Order</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-200 text-slate-700">
                {cart.length} {cart.length === 1 ? "Item" : "Items"}
              </span>
            </div>

            {/* Customer Pill / Quick Selector */}
            <div className="relative" ref={customerDropdownRef}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={customerSearchInput}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomerSearchInput(val);
                      setIsCustomerDropdownOpen(true);
                      if (!val.trim()) {
                        setSelectedCustomerId(null);
                        setSelectedCustomer("Walk-in");
                        setCustomerPhone("");
                      }
                    }}
                    placeholder={
                      selectedCustomer === "Walk-in"
                        ? "Walk-in Customer (click to search / add)"
                        : `${selectedCustomer}${customerPhone ? ` (${customerPhone})` : ""}`
                    }
                    className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-700 cursor-pointer"
                  />
                  {(customerSearchInput || selectedCustomer !== "Walk-in") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(null);
                        setCustomerSearchInput("");
                        setSelectedCustomer("Walk-in");
                        setCustomerPhone("");
                        setIsCustomerDropdownOpen(false);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {/* Customer Autocomplete Dropdown */}
                  {isCustomerDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-64 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(null);
                          setSelectedCustomer("Walk-in");
                          setCustomerPhone("");
                          setCustomerSearchInput("");
                          setIsCustomerDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 transition border-b border-slate-100 cursor-pointer"
                      >
                        <span className="font-semibold text-slate-800">Walk-in Customer</span>
                        <span className="text-[10px] text-slate-400">Default</span>
                      </button>

                      {matchingCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setSelectedCustomer(c.name);
                            setCustomerPhone(c.phone || "");
                            setCustomerSearchInput(c.name);
                            setIsCustomerDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-indigo-50/60 transition cursor-pointer"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 block">{c.name}</span>
                            {c.phone && <span className="text-[10px] text-slate-400">{c.phone}</span>}
                          </div>
                          {selectedCustomer === c.name && <Check className="w-4 h-4 text-indigo-600" />}
                        </button>
                      ))}

                      {customerSearchInput.trim() && (
                        <div className="p-2 border-t border-slate-100 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => {
                              if (isDigitsQuery) {
                                setNewCustPhone(customerSearchInput.trim());
                                setNewCustName("");
                              } else {
                                setNewCustName(customerSearchInput.trim());
                                setNewCustPhone("");
                              }
                              setIsCustomerDropdownOpen(false);
                              setIsAddCustomerOpen(true);
                            }}
                            className="w-full text-left p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                          >
                            <span>+ Register &quot;{customerSearchInput.trim()}&quot;</span>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(true)}
                  className="px-3 py-2 border border-slate-200 hover:bg-white text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  title="Add New Customer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
              </div>

              {/* Collapsible Doctor & Rx Details (Triggered or if Rx items in cart) */}
              {(hasRxItem || showRxDetails) && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Prescription Required
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRxDetails(!showRxDetails)}
                      className="text-[10px] text-indigo-600 hover:underline font-semibold"
                    >
                      {showRxDetails ? "Hide Doctor Info" : "+ Edit Doctor Details"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Doctor Name (Dr. ...)"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Doctor Reg. No."
                      value={doctorRegNo}
                      onChange={(e) => setDoctorRegNo(e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cart Line Items */}
          <div className="flex-1 overflow-y-auto max-h-[380px] p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="py-14 text-center text-slate-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-500">Cart is empty</p>
                <p className="text-[11px] text-slate-400 mt-1">Scan or click a medicine to begin.</p>
              </div>
            ) : (
              cart.map((item, idx) => {
                const factor = item.conversionFactor || 1;
                const availableInBatch = Number(item.selectedBatch.availableQty || 0);
                const maxAllowed = item.isBaseUnitSale
                  ? availableInBatch
                  : Math.floor(availableInBatch / factor);

                const lineGross = item.quantity * item.unitPrice;
                let disc = 0;
                if (item.discountType === "PERCENTAGE") {
                  disc = (lineGross * item.discountValue) / 100;
                } else {
                  disc = item.discountValue;
                }
                disc = Math.min(lineGross, disc);
                const lineTotal = lineGross - disc;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2 transition hover:border-slate-300"
                  >
                    {/* Item Top: Name, Unit Toggle, Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {item.product.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.product.genericName || item.product.packDescription}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Strip vs Loose Toggle */}
                        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
                          <button
                            type="button"
                            onClick={() => handleToggleUnit(idx, "STRIP")}
                            className={`px-2 py-1 rounded text-[9px] font-bold transition cursor-pointer ${
                              !item.isBaseUnitSale
                                ? "bg-white text-indigo-600 shadow-xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Strip
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleUnit(idx, "BASE")}
                            className={`px-2 py-1 rounded text-[9px] font-bold transition cursor-pointer ${
                              item.isBaseUnitSale
                                ? "bg-white text-indigo-600 shadow-xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Loose
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => setCart((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Batch & Expiry Selector Row */}
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <select
                        value={item.selectedBatch.id}
                        onChange={(e) => {
                          const b = item.product.batches.find((x) => x.id === e.target.value);
                          if (b) {
                            setCart((prev) => {
                              const copy = [...prev];
                              const f = copy[idx].conversionFactor || 1;
                              let isBase = copy[idx].isBaseUnitSale;
                              let saleUnit = copy[idx].saleUnit;
                              let unitPrice = copy[idx].unitPrice;

                              if (!isBase && Number(b.availableQty) < f) {
                                isBase = true;
                                saleUnit = copy[idx].product.baseUnit;
                                unitPrice = Number((copy[idx].product.mrp / f).toFixed(2));
                              }

                              const limit = isBase ? Number(b.availableQty) : Math.floor(Number(b.availableQty) / f);
                              const newQty = Math.max(1, Math.min(copy[idx].quantity || 1, limit > 0 ? limit : 1));

                              copy[idx] = {
                                ...copy[idx],
                                selectedBatch: b,
                                isBaseUnitSale: isBase,
                                saleUnit,
                                unitPrice,
                                quantity: newQty,
                              };
                              return copy;
                            });
                          }
                        }}
                        className="px-2 py-1 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-[10px] font-mono focus:outline-none"
                      >
                        {item.product.batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            Batch: {b.batchNumber} (Exp: {b.expiryDate})
                          </option>
                        ))}
                      </select>

                      <span className="text-[10px] text-slate-500 font-medium">
                        Stock: {availableInBatch}
                      </span>
                    </div>

                    {/* Item Bottom: Quantity Stepper, Discount, Line Total */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, -1)}
                          disabled={item.quantity <= 1}
                          className="px-2 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={maxAllowed}
                          value={item.quantity === 0 ? "" : item.quantity}
                          onChange={(e) => {
                            const str = e.target.value;
                            if (str === "") {
                              setCart((prev) => {
                                const copy = [...prev];
                                copy[idx].quantity = 0;
                                return copy;
                              });
                              return;
                            }
                            const parsed = parseInt(str, 10);
                            const val = isNaN(parsed) ? 1 : Math.max(1, Math.min(maxAllowed > 0 ? maxAllowed : 9999, parsed));
                            setCart((prev) => {
                              const copy = [...prev];
                              copy[idx].quantity = val;
                              return copy;
                            });
                          }}
                          className="w-8 text-center font-bold text-xs border-none focus:outline-none text-slate-900 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, 1)}
                          disabled={item.quantity >= maxAllowed}
                          className="px-2 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Discount Input */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="Disc"
                          value={item.discountValue || ""}
                          onChange={(e) =>
                            handleUpdateDiscount(idx, item.discountType, Number(e.target.value))
                          }
                          className="w-12 px-2 py-1 border border-slate-200 rounded-lg text-center text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateDiscount(
                              idx,
                              item.discountType === "PERCENTAGE" ? "FIXED" : "PERCENTAGE",
                              item.discountValue
                            )
                          }
                          className="px-2 py-1 text-[10px] font-bold border border-slate-200 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          {item.discountType === "PERCENTAGE" ? "%" : "₹"}
                        </button>
                      </div>

                      {/* Total */}
                      <div className="text-right">
                        <div className="font-extrabold text-xs text-slate-900">
                          ₹{lineTotal.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ₹{item.unitPrice.toFixed(2)}/{item.saleUnit}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer: Summary & Checkout CTA */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            {/* Quick Actions (Clear & Hold) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCart([])}
                disabled={cart.length === 0}
                className="py-1 px-3 border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>Clear</span>
              </button>

              <button
                type="button"
                onClick={handleHoldBill}
                disabled={cart.length === 0}
                className="py-1 px-3 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Bookmark className="w-3 h-3 text-slate-500" />
                <span>Hold (Pause)</span>
              </button>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-xs pt-1">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({cart.length} items)</span>
                <span className="font-medium text-slate-800">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-semibold">- ₹{totals.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>GST (Inclusive)</span>
                <span className="font-medium text-slate-800">₹{totals.taxTotal.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-sm">Payable Amount</span>
                <span className="font-black text-2xl text-slate-900 tracking-tight">
                  ₹{totals.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Main Checkout Button */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => {
                setTenderedAmount(totals.grandTotal);
                setIsPaymentOpen(true);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4" />
              <span>Charge ₹{totals.grandTotal.toFixed(2)} (F9)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Checkout Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Complete Payment</h3>
                <p className="text-xs text-slate-500">Customer: {selectedCustomer}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {checkoutError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Total Banner */}
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-900">Total Payable</span>
                <span className="text-2xl font-black text-indigo-700">₹{totals.grandTotal.toFixed(2)}</span>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["CASH", "UPI", "CARD", "SPLIT"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        paymentMethod === m
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Controls */}
              {paymentMethod === "CASH" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Cash Tendered</label>
                    <input
                      type="number"
                      value={tenderedAmount || ""}
                      onChange={(e) => setTenderedAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-base font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Cash Presets */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {[totals.grandTotal, 100, 200, 500, 2000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTenderedAmount(val)}
                        className="px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                      >
                        {val === totals.grandTotal ? "Exact" : `₹${val}`}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculator */}
                  {tenderedAmount > totals.grandTotal && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800">
                      <span className="font-semibold">Change to Return</span>
                      <span className="font-black text-base">₹{(tenderedAmount - totals.grandTotal).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* UPI QR Display */}
              {paymentMethod === "UPI" && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                  <QrCode className="w-16 h-16 mx-auto text-slate-800" />
                  <p className="font-semibold text-slate-700">Scan QR Code using PhonePe, GPay, or Paytm</p>
                  <input
                    type="text"
                    placeholder="UPI Ref / UTR (Optional)"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none"
                  />
                </div>
              )}

              {/* Card Reference */}
              {paymentMethod === "CARD" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Card Auth / Approval Code</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-89324"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={processingSale}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {processingSale ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Print Bill</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Held Bills Modal */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Held Bills ({heldBills.length})</h3>
              <button
                type="button"
                onClick={() => setIsHeldModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {heldBills.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <PauseCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No held bills.
                </div>
              ) : (
                heldBills.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{b.customerName}</div>
                      <div className="text-[10px] text-slate-400">
                        {b.holdTime} • {b.items.length} items • ₹{b.grandTotal.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResumeBill(b)}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => saveHeldBills(heldBills.filter((x) => x.id !== b.id))}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        title="Delete bill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setIsHeldModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Register New Customer</h3>
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer Name *</label>
                <input
                  ref={newCustNameInputRef}
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  ref={newCustPhoneInputRef}
                  type="tel"
                  placeholder="10-digit mobile"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCustomer || !newCustName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {isSavingCustomer ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Prescriptions Queue Modal */}
      {isDoctorRxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in duration-150 max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Doctor Prescriptions Queue</h3>
                  <p className="text-xs text-slate-500">
                    {pendingDoctorRxs.length} electronic prescription(s) pending dispense
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDoctorRxModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {pendingDoctorRxs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Stethoscope className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  No pending doctor prescriptions in queue.
                </div>
              ) : (
                pendingDoctorRxs.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col gap-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md">
                            {rx.rxNumber}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900">{rx.patientName}</h4>
                          {rx.patientPhone && <span className="text-xs text-slate-400">({rx.patientPhone})</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Prescribed by <strong className="text-slate-700">{rx.doctorName}</strong> ({rx.doctorRegNo}) • {rx.timeAgo}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLoadPrescriptionToCart(rx)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Load into Cart</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex items-center gap-4 text-slate-700">
                      <div>
                        <span className="text-slate-400">Diagnosis: </span>
                        <strong className="text-slate-900">{rx.diagnosis}</strong>
                      </div>
                      {rx.vitals?.bp && (
                        <div>
                          <span className="text-slate-400">BP: </span>
                          <span className="font-mono font-bold">{rx.vitals.bp}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-slate-500 font-semibold">Prescribed Medicines ({rx.totalItems}):</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {rx.items.map((it, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                              it.isAvailable ? "bg-white border-slate-200" : "bg-rose-50/60 border-rose-200"
                            }`}
                          >
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{it.productName}</p>
                              <p className="text-[10px] text-slate-500">
                                {it.dosage} • {it.frequency} • Qty: {it.quantity}
                              </p>
                            </div>
                            {it.isAvailable ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                                In Stock
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setIsDoctorRxModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Close Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant Print Invoice Modal */}
      {completedInvoiceId && (
        <SalesInvoiceModal
          invoiceId={completedInvoiceId}
          onClose={() => setCompletedInvoiceId(null)}
        />
      )}

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={(code: string) => {
          setIsCameraScannerOpen(false);
          handleBarcodeScanned(code);
        }}
      />

      {/* Generic Salt Substitute Modal */}
      <GenericSubstituteModal
        isOpen={isSubstituteModalOpen}
        onClose={() => {
          setIsSubstituteModalOpen(false);
          setSelectedProductForSubstitutes(null);
        }}
        targetProduct={selectedProductForSubstitutes}
        onSelectSubstitute={(subProduct: any) => {
          setIsSubstituteModalOpen(false);
          setSelectedProductForSubstitutes(null);
          handleAddToCart(subProduct);
        }}
      />
    </div>
  );
}
