"use client";

import React, { useState, useEffect } from "react";
import {
  Grid,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FolderTree,
  X,
  AlertCircle,
} from "lucide-react";
import { api, CategoryItem } from "@/lib/api";

export default function CategoriesView() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setCategoryToEdit(null);
    setFormName("");
    setFormDescription("");
    setFormActive(true);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setCategoryToEdit(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || "");
    setFormActive(cat.isActive);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg("Category name is required");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      if (categoryToEdit) {
        await api.updateCategory(categoryToEdit.id, {
          name: formName.trim(),
          description: formDescription.trim(),
          isActive: formActive,
        });
      } else {
        await api.createCategory({
          name: formName.trim(),
          description: formDescription.trim(),
        });
      }
      setIsModalOpen(false);
      await loadCategories();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (
      !confirm(
        `Are you sure you want to delete category "${cat.name}"? Products must be reassigned first.`
      )
    ) {
      return;
    }

    try {
      await api.deleteCategory(cat.id);
      await loadCategories();
    } catch (err: any) {
      alert(err.message || "Could not delete category");
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Categories</h1>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {categories.length} total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Organize medicines into categories</p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        <button
          onClick={loadCategories}
          className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition"
          title="Refresh category list"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[800px] whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3 py-2 w-12 text-center text-slate-400">#</th>
                <th className="px-3 py-2 min-w-[200px]">Category Name</th>
                <th className="px-3 py-2 min-w-[250px]">Description</th>
                <th className="px-3 py-2 text-center min-w-[100px]">Medicines</th>
                <th className="px-3 py-2 text-center min-w-[100px]">Status</th>
                <th className="px-3 py-2 text-right min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                    <FolderTree className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition group">
                    <td className="px-3 py-2 text-slate-400 font-mono font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          <Grid className="h-4 w-4" />
                        </div>
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-600 max-w-md truncate text-[11px]">
                      {cat.description || "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="inline-block px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                        {cat.productCount} items
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {cat.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px] border border-slate-200">
                          <XCircle className="h-3 w-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                {categoryToEdit ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Antibiotics, Analgesic, Vitamins"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional notes or classification details..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="categoryActive"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="categoryActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Active Category
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-950/20 transition flex items-center gap-1 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : categoryToEdit ? (
                    "Update Category"
                  ) : (
                    "Create Category"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
