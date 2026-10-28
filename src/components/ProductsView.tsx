"use client";

import React, { useState, useEffect } from "react";
import {
  Pill,
  Search,
  Plus,
  Eye,
  Edit,
  Barcode,
  Trash2,
  RefreshCw,
  Package,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react";
import { api, ProductItem, CategoryItem } from "@/lib/api";
import ProductDetailsModal from "./ProductDetailsModal";
import AddEditProductModal from "./AddEditProductModal";
import BarcodeLabelsModal from "./BarcodeLabelsModal";
import DrugCentralCatalogModal from "./DrugCentralCatalogModal";
import { TableSkeleton, EmptyState } from "./common";
import { useStore } from "@/context/StoreContext";

interface ProductsViewProps {
  onNavigateToUnits?: () => void;
}

export default function ProductsView({ onNavigateToUnits }: ProductsViewProps) {
  const { currentStore } = useStore();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [viewProduct, setViewProduct] = useState<ProductItem | null>(null);
  const [editProduct, setEditProduct] = useState<ProductItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDrugCentralModalOpen, setIsDrugCentralModalOpen] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<ProductItem | null>(null);

  // Fetch data
  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsData, catsData, mfgData] = await Promise.all([
        api.getProducts({
          q: searchQuery || undefined,
          categoryId: selectedCategory !== "ALL" ? selectedCategory : undefined,
          status: selectedStatus !== "ALL" ? selectedStatus : undefined,
          storeId: currentStore?.id || undefined,
        }),
        api.getCategories(),
        api.getManufacturers(),
      ]);

      if (prodsData.products) setProducts(prodsData.products);
      if (catsData.categories) setCategories(catsData.categories);
      if (mfgData.manufacturers) setManufacturers(mfgData.manufacturers);
    } catch (err) {
      console.error("Failed to load medicines", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedStatus, currentStore?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  const handleDeleteProduct = async (product: ProductItem) => {
    if (!confirm(`Are you sure you want to deactivate "${product.name}"?`)) {
      return;
    }

    try {
      await api.deleteProduct(product.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Could not deactivate product");
    }
  };

  // Pagination calculations
  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = products.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products</h1>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
              {totalItems} items
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your medicines, prices, and stock
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsDrugCentralModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            title="Browse 150,000+ verified clinical formulations"
          >
            <Database className="h-4 w-4" />
            <span>DrugCentral Catalog</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("ALL");
              setSelectedStatus("ALL");
              loadData();
            }}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition cursor-pointer"
            title="Reset Filters"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[1080px] whitespace-nowrap">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 min-w-[260px]">Medicine / Product</th>
                <th className="py-3 px-4 min-w-[140px]">Category</th>
                <th className="py-3 px-4 min-w-[130px]">Packaging</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Price (MRP)</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Total Stock</th>
                <th className="py-3 px-4 text-center min-w-[120px]">Status</th>
                <th className="py-3 px-4 text-center min-w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton columns={7} rows={6} />
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8">
                    <EmptyState
                      icon={Package}
                      title="No Products Found"
                      description="No pharmacy medicine inventory matches the current search or category filter."
                    />
                  </td>
                </tr>
              ) : (
                currentItems.map((product) => {
                  const isOut = product.totalBaseStock <= 0;
                  const isLow = product.isLowStock;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/60 transition group"
                    >
                      {/* Name */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                            <Pill className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">
                                {product.name}
                              </span>
                              {product.isPrescriptionRequired && (
                                <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-1 rounded border border-rose-200">
                                  Rx
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {product.brandName || product.genericName || product.dosageForm || "Medicine"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-2 text-slate-600 font-medium">
                        {product.categoryName || "General"}
                      </td>

                      {/* Pack */}
                      <td className="px-3 py-2 text-slate-600">
                        {product.packDescription || "1 Pack"}
                      </td>

                      {/* Price */}
                      <td className="px-3 py-2 text-right">
                        <div className="font-bold text-slate-900">
                          ₹{product.mrp.toFixed(2)}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-3 py-2 text-center">
                        {isOut ? (
                          <span className="inline-block px-2 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-block px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-[11px] border border-amber-200">
                            Low ({product.totalPacks} {product.saleUnit}s)
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                            {product.totalPacks} {product.saleUnit}s
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2 text-center">
                        {product.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewProduct(product)}
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditProduct(product)}
                            className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setBarcodeProduct(product)}
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            title="Barcode"
                          >
                            <Barcode className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {totalItems === 0 ? 0 : startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-800">
              {Math.min(startIndex + itemsPerPage, totalItems)}
            </span>{" "}
            of <span className="font-semibold text-slate-800">{totalItems}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 py-1 text-slate-700 font-semibold">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {viewProduct && (
        <ProductDetailsModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          onEdit={(p) => {
            setViewProduct(null);
            setEditProduct(p);
          }}
          onPrintBarcode={(p) => {
            setViewProduct(null);
            setBarcodeProduct(p);
          }}
        />
      )}

      {(isAddModalOpen || editProduct) && (
        <AddEditProductModal
          productToEdit={editProduct}
          categories={categories}
          manufacturers={manufacturers}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditProduct(null);
          }}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {barcodeProduct && (
        <BarcodeLabelsModal
          product={barcodeProduct}
          onClose={() => setBarcodeProduct(null)}
        />
      )}

      {isDrugCentralModalOpen && (
        <DrugCentralCatalogModal
          isOpen={isDrugCentralModalOpen}
          onClose={() => setIsDrugCentralModalOpen(false)}
          onImportSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
