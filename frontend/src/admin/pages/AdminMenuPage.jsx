import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Star,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Upload,
  Loader2,
  FolderPlus,
  Tag,
  Flame,
  Soup,
  Wheat,
  Coffee,
  Cake,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { DataTable } from '../components/DataTable';
import { SearchInput } from '../components/SearchInput';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatCurrency } from '../../utils/currency';
import { PlanUpgradeModal } from '../components/PlanUpgradeModal';
import { getPlanLimits } from '../utils/planLimits';
import { API_BASE_URL } from '../../services/apiConfig';

// Official Indian Food Veg/Non-Veg Badges
const VegBadge = ({ className = 'w-4 h-4' }) => (
  <span
    className={`inline-flex items-center justify-center p-0.5 border-2 border-emerald-600 rounded-sm bg-white shrink-0 shadow-2xs ${className}`}
    title="100% Vegetarian"
  >
    <span className="w-2 h-2 rounded-full bg-emerald-600" />
  </span>
);

const NonVegBadge = ({ className = 'w-4 h-4' }) => (
  <span
    className={`inline-flex items-center justify-center p-0.5 border-2 border-rose-600 rounded-sm bg-white shrink-0 shadow-2xs ${className}`}
    title="Non-Vegetarian"
  >
    <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-rose-600" />
  </span>
);

// Curated high-res food photo presets for instant 1-click selection
const QUICK_FOOD_PRESETS = [
  { label: 'Paneer Tikka', url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80' },
  { label: 'Biryani Feast', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
  { label: 'Crispy Snack', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Pasta Bowl', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cool Mocktail', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Sweet Dessert', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' },
];

export const AdminMenuPage = () => {
  const {
    menuItems,
    categories: contextCategories,
    addCategory,
    deleteCategory,
    toggleMenuItemAvailability,
    saveMenuItem,
    deleteMenuItem,
    settings,
  } = useAdminData();

  const limits = useMemo(() => getPlanLimits(settings), [settings]);

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null); // Item object or 'NEW'
  const [deletingId, setDeletingId] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Utensils');
  const [categoryError, setCategoryError] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null); // { id, name, count }

  // Form state for add/edit dish modal
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    categoryId: 'starters',
    price: '',
    description: '',
    image: '',
    isVeg: true,
    isAvailable: true,
    preparationTime: '15 mins',
  });

  const categories = useMemo(() => {
    const list =
      contextCategories && contextCategories.length > 0
        ? contextCategories
        : [
          { id: 'starters', name: 'Starters' },
          { id: 'main-course', name: 'Main Course' },
          { id: 'chinese', name: 'Chinese' },
          { id: 'breads', name: 'Breads' },
          { id: 'rice', name: 'Rice & Biryani' },
          { id: 'beverages', name: 'Beverages' },
          { id: 'desserts', name: 'Desserts' },
        ];
    return [{ id: 'ALL', name: 'All Dishes' }, ...list.filter((c) => c.id !== 'all' && c.id !== 'ALL')];
  }, [contextCategories]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategory !== 'ALL' && item.categoryId !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (item.name || '').toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setIsUploadingImage(true);
    setUploadError('');

    try {
      const uploadData = new FormData();
      uploadData.append('image', file);

      const res = await fetch(`${API_BASE_URL}/upload/dish-image`, {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Image upload failed');
      }

      setFormData((prev) => ({
        ...prev,
        image: data.url,
      }));
    } catch (err) {
      setUploadError(err.message || 'Failed to upload image. Please try again or paste a photo URL.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setCategoryError('Category name is required');
      return;
    }

    const slug = newCategoryName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const alreadyExists = categories.some(
      (c) => c.id.toLowerCase() === slug || c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    if (alreadyExists) {
      setCategoryError('A category with this name or ID already exists.');
      return;
    }

    setIsSavingCategory(true);
    setCategoryError('');
    try {
      await addCategory({
        name: newCategoryName.trim(),
        id: slug,
        icon: newCategoryIcon,
      });
      setIsCategoryModalOpen(false);
      setNewCategoryName('');
      setSelectedCategory(slug);
    } catch (err) {
      setCategoryError(err.message || 'Failed to create category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory(deletingCategory.id);
      if (selectedCategory === deletingCategory.id) {
        setSelectedCategory('ALL');
      }
    } finally {
      setDeletingCategory(null);
    }
  };

  const openAddModal = () => {
    if (menuItems.length >= limits.maxDishes) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setUploadError('');
    const firstCat = categories.find((c) => c.id !== 'ALL')?.id || 'starters';
    setFormData({
      id: '',
      name: '',
      categoryId: selectedCategory !== 'ALL' ? selectedCategory : firstCat,
      price: '',
      description: '',
      image: '',
      isVeg: true,
      isRecommended: false,
      isAddon: false,
      isAvailable: true,
      preparationTime: '15 mins',
      hasVariants: false,
      variantFullPrice: '',
      variantHalfPrice: '',
      variantQuarterPrice: '',
      variantPiecePrice: '',
    });
    setEditingItem('NEW');
  };

  const openEditModal = (item) => {
    setUploadError('');
    const vList = item.variants || [];
    const hasV = vList.length > 0;
    const fullP = vList.find((v) => v.name?.toLowerCase() === 'full')?.price || (hasV ? '' : item.price);
    const halfP = vList.find((v) => v.name?.toLowerCase() === 'half')?.price || '';
    const quarterP = vList.find((v) => v.name?.toLowerCase() === 'quarter')?.price || '';
    const pieceP = vList.find((v) => v.name?.toLowerCase().includes('piece'))?.price || '';

    setFormData({
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      price: item.price,
      description: item.description,
      image: item.image,
      isVeg: item.isVeg,
      isRecommended: item.isRecommended || false,
      isAddon: item.isAddon || false,
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime || '15 mins',
      hasVariants: hasV,
      variantFullPrice: fullP,
      variantHalfPrice: halfP,
      variantQuarterPrice: quarterP,
      variantPiecePrice: pieceP,
    });
    setEditingItem(item);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const variants = [];
    if (formData.hasVariants) {
      if (formData.variantFullPrice) variants.push({ name: 'Full', price: Number(formData.variantFullPrice) });
      if (formData.variantHalfPrice) variants.push({ name: 'Half', price: Number(formData.variantHalfPrice) });
      if (formData.variantQuarterPrice) variants.push({ name: 'Quarter', price: Number(formData.variantQuarterPrice) });
      if (formData.variantPiecePrice) variants.push({ name: 'Piece', price: Number(formData.variantPiecePrice) });
    }

    const basePrice = variants.length > 0 
      ? variants[0].price 
      : Number(formData.price || 0);

    const submissionData = {
      ...formData,
      price: basePrice,
      variants,
    };

    await saveMenuItem(submissionData);
    setEditingItem(null);
  };

  const columns = [
    {
      header: 'Dish',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
            <img
              src={row.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
              alt={row.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {row.isVeg ? <VegBadge className="w-3.5 h-3.5" /> : <NonVegBadge className="w-3.5 h-3.5" />}
              <span className="font-bold text-slate-900 truncate">{row.name}</span>
              {row.isRecommended && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                  ⭐ Chef's Special
                </span>
              )}
              {row.isAddon && (
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300">
                  ⚡ Cart Add-on
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'categoryId',
      render: (row) => (
        <span className="capitalize font-semibold text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
          {row.categoryId?.replace('-', ' ')}
        </span>
      ),
    },
    {
      header: 'Price',
      accessor: 'price',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-extrabold text-slate-900 text-sm">
            {formatCurrency(row.price)}
          </span>
          {row.variants && row.variants.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {row.variants.map((v) => (
                <span key={v.name} className="text-[10px] font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200">
                  {v.name}: ₹{v.price}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Prep Time',
      accessor: 'preparationTime',
      render: (row) => (
        <span className="text-xs text-slate-600 flex items-center gap-1 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.preparationTime || '15m'}</span>
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isAvailable',
      render: (row) => (
        <button
          type="button"
          onClick={() => toggleMenuItemAvailability(row.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs ${row.isAvailable
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
            }`}
          title="Click to toggle live availability"
        >
          {row.isAvailable ? (
            <>
              <ToggleRight className="w-4 h-4 text-emerald-600" />
              <span>Available</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-4 h-4 text-slate-400" />
              <span>Unavailable</span>
            </>
          )}
        </button>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-amber-800 hover:bg-amber-50 hover:border-amber-300 transition-all cursor-pointer shadow-2xs"
            title="Edit dish details"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingId(row.id)}
            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer shadow-2xs"
            title="Delete dish"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <AdminPageHeader
        title="Menu Catalog & Stock"
        subtitle={`Configure dish pricing & stock. Usage: ${menuItems.length} / ${limits.maxDishes} dishes (${limits.planName}).`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
              menuItems.length >= limits.maxDishes
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {menuItems.length >= limits.maxDishes && <Lock className="w-3.5 h-3.5 text-amber-600" />}
              <span>{menuItems.length} / {limits.maxDishes} Dishes</span>
            </span>

            <button
              type="button"
              onClick={() => {
                setCategoryError('');
                setNewCategoryName('');
                setIsCategoryModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <FolderPlus className="w-4 h-4 text-amber-700" />
              <span>Manage Categories ({categories.filter((c) => c.id !== 'ALL').length})</span>
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg shadow-slate-900/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add New Dish</span>
            </button>
          </div>
        }
      />

      {/* Categories Horizontal Tabs */}
      <div className="overflow-x-auto no-scrollbar flex items-center gap-2 border-b border-slate-200/80 pb-3 pt-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count =
            cat.id === 'ALL'
              ? menuItems.length
              : menuItems.filter((i) => i.categoryId === cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${isSelected
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90 shadow-2xs'
                }`}
            >
              <span>{cat.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            setCategoryError('');
            setNewCategoryName('');
            setIsCategoryModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border border-dashed border-amber-400 bg-amber-50/60 hover:bg-amber-100/80 text-amber-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          title="Add or manage categories"
        >
          <Plus className="w-3.5 h-3.5 text-amber-700" />
          <span>Category</span>
        </button>
      </div>

      {/* Search & Counter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search dish name or description..."
          />
        </div>

        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
          Showing {filteredItems.length} dishes
        </span>
      </div>

      {/* Menu Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        keyField="id"
        emptyMessage="No dishes found matching your query."
      />

      {/* Add / Edit Menu Dish Modal (Executive 2-Column Studio) */}
      {editingItem &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
              onClick={() => setEditingItem(null)}
            />

            {/* Modal Dialog Container */}
            <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 animate-fade-in flex flex-col overflow-hidden my-auto max-h-[92vh]">
              {/* Top Studio Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                    <UtensilsCrossed className="w-5 h-5 text-white stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                        {editingItem === 'NEW' ? 'Add New Menu Dish' : `Edit Dish: ${formData.name || 'Details'}`}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                        Dish Studio
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure dish ingredients, live pricing, photo & customer card preview
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="w-9 h-9 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body - 2 Columns */}
              <form id="dish-form" onSubmit={handleFormSubmit} className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Form Controls (7 cols) */}
                  <div className="lg:col-span-7 space-y-4 text-xs">
                    {/* Dish Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Dish Name *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <UtensilsCrossed className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Paneer Tikka Angara, Dal Makhani..."
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-slate-50/60 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Category & Price */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Category *
                        </label>
                        <select
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                          className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-slate-50/60 cursor-pointer"
                        >
                          {categories
                            .filter((c) => c.id !== 'ALL')
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Base Price (₹) {!formData.hasVariants && '*'}
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, hasVariants: !formData.hasVariants })}
                            className="text-[11px] font-extrabold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                          >
                            {formData.hasVariants ? '← Standard Price' : '⚡ Enable Portions (Half/Full)'}
                          </button>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                            ₹
                          </span>
                          <input
                            type="number"
                            required={!formData.hasVariants}
                            disabled={formData.hasVariants}
                            min={0}
                            placeholder="240"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className={`w-full h-11 pl-8 pr-3.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all ${
                              formData.hasVariants
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-50/60 border-slate-200 text-slate-900 focus:border-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Portion / Variant Pricing Box (Half, Full, Quarter, Piece) */}
                    {formData.hasVariants && (
                      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-amber-600" />
                            Portion & Variant Prices (Enter applicable portions)
                          </span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            Multiple Portions Active
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                              Full Plate (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 320"
                              value={formData.variantFullPrice}
                              onChange={(e) => setFormData({ ...formData, variantFullPrice: e.target.value })}
                              className="w-full h-9 px-2.5 rounded-lg border border-amber-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                              Half Plate (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 180"
                              value={formData.variantHalfPrice}
                              onChange={(e) => setFormData({ ...formData, variantHalfPrice: e.target.value })}
                              className="w-full h-9 px-2.5 rounded-lg border border-amber-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                              Quarter (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 100"
                              value={formData.variantQuarterPrice}
                              onChange={(e) => setFormData({ ...formData, variantQuarterPrice: e.target.value })}
                              className="w-full h-9 px-2.5 rounded-lg border border-amber-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                              Per Piece (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 40"
                              value={formData.variantPiecePrice}
                              onChange={(e) => setFormData({ ...formData, variantPiecePrice: e.target.value })}
                              className="w-full h-9 px-2.5 rounded-lg border border-amber-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dietary Classification (Veg / Non-Veg) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Dietary Preference *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isVeg: true })}
                          className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${formData.isVeg
                              ? 'border-emerald-500 bg-emerald-50/90 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          <VegBadge className="w-4 h-4" />
                          <span>100% Vegetarian</span>
                          {formData.isVeg && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isVeg: false })}
                          className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${!formData.isVeg
                              ? 'border-rose-500 bg-rose-50/90 text-rose-800 ring-2 ring-rose-500/20 shadow-xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          <NonVegBadge className="w-4 h-4" />
                          <span>Non-Vegetarian</span>
                          {!formData.isVeg && <Check className="w-3.5 h-3.5 ml-auto text-rose-600" />}
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Description & Ingredients
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Delicious ingredients, preparation style, or serving notes..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-slate-50/60 resize-none placeholder:text-slate-400"
                      />
                    </div>

                    {/* Preparation Time & Live Stock Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Avg Prep Time
                        </label>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {['10 mins', '15 mins', '20 mins', '30 mins'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setFormData({ ...formData, preparationTime: t })}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${formData.preparationTime === t
                                  ? 'border-amber-500 bg-amber-100 text-amber-900 font-extrabold'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                              {t.replace(' mins', 'm')}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={formData.preparationTime}
                          onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-slate-50/60"
                          placeholder="e.g. 15 mins"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Live Ordering Status
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                          className={`w-full h-[62px] rounded-xl border p-2 flex flex-col justify-center items-center gap-0.5 transition-all cursor-pointer ${formData.isAvailable
                              ? 'border-emerald-300 bg-emerald-50/80 text-emerald-800'
                              : 'border-slate-200 bg-slate-100 text-slate-500'
                            }`}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            {formData.isAvailable ? (
                              <>
                                <ToggleRight className="w-4 h-4 text-emerald-600" />
                                <span>In Stock (Available)</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-4 h-4 text-slate-400" />
                                <span>Sold Out (Unavailable)</span>
                              </>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {formData.isAvailable
                              ? 'Customers can order immediately'
                              : 'Hidden from QR ordering'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Chef's Recommendation / Speciality Toggle */}
                    <div className="pt-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        ⭐ Chef's Speciality / Recommendation
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isRecommended: !formData.isRecommended })}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${formData.isRecommended
                            ? 'border-emerald-500 bg-emerald-50/90 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${formData.isRecommended ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <Star className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <div className="font-extrabold text-slate-900 text-xs">
                              {formData.isRecommended ? '⭐ Chef Speciality Dish' : 'Standard Menu Dish'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              Highlight in top "Chef's Recommendations" carousel on customer QR menu
                            </div>
                          </div>
                        </div>
                        {formData.isRecommended ? (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold shadow-2xs">
                            RECOMMENDED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                            OFF
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Quick Add-on Toggle for Cart Page */}
                    <div className="pt-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Cart Checkout Suggestion (Quick Add-on)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isAddon: !formData.isAddon })}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${formData.isAddon
                            ? 'border-amber-500 bg-amber-50/90 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${formData.isAddon ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <div className="font-extrabold text-slate-900 text-xs">
                              {formData.isAddon ? '⚡ Active Quick Add-on Item' : 'Standard Menu Item'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              Show as 1-tap add-on suggestion on customer cart checkout page (Water, Butter, Pickle, etc.)
                            </div>
                          </div>
                        </div>
                        {formData.isAddon ? (
                          <span className="px-2.5 py-1 rounded-md bg-amber-500 text-white text-[10px] font-extrabold shadow-2xs">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                            OFF
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Visual Studio & Live QR Menu Preview (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col gap-4 bg-slate-50/90 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                          Dish Photo
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">PNG, JPG, WebP</span>
                      </div>

                      {/* Photo Dropzone or Preview */}
                      {formData.image ? (
                        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 group bg-slate-900 shadow-sm">
                          <img
                            src={formData.image}
                            alt="Dish Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src =
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="px-3 py-1.5 rounded-lg bg-white text-xs font-bold text-slate-900 cursor-pointer hover:bg-slate-100 shadow-md">
                              <span>Change Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageFileUpload}
                                disabled={isUploadingImage}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, image: '' })}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 shadow-md cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          className={`w-full h-28 border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${isUploadingImage
                              ? 'border-amber-400 bg-amber-50/50'
                              : 'border-slate-300 hover:border-amber-500 hover:bg-amber-50/40 bg-white'
                            }`}
                        >
                          {isUploadingImage ? (
                            <>
                              <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                              <span className="text-xs font-bold text-slate-700">Uploading photo...</span>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                                <Upload className="w-4 h-4 text-amber-700" />
                              </div>
                              <span className="text-xs font-bold text-slate-800">Upload Dish Photo</span>
                              <span className="text-[10px] text-slate-400">Tap to browse files</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageFileUpload}
                            disabled={isUploadingImage}
                          />
                        </label>
                      )}

                      {uploadError && (
                        <p className="text-xs text-rose-600 font-semibold mt-1.5">{uploadError}</p>
                      )}

                      {/* 1-Click Curated Presets */}
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Or pick curated photo preset:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {QUICK_FOOD_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setFormData({ ...formData, image: preset.url })}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition-colors cursor-pointer"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <input
                          type="url"
                          placeholder="Or paste external image URL..."
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          className="w-full h-8 px-3 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Live Customer Menu Preview Card */}
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Customer QR Preview</span>
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          Live Card
                        </span>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                          {formData.image ? (
                            <img
                              src={formData.image}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src =
                                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <UtensilsCrossed className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {formData.isVeg ? (
                              <VegBadge className="w-3.5 h-3.5" />
                            ) : (
                              <NonVegBadge className="w-3.5 h-3.5" />
                            )}
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {formData.name || 'Dish Name'}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {formData.description || 'Delicious dish freshly prepared...'}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs font-extrabold text-slate-900">
                              ₹{formData.price || '0'}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              + ADD
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              {/* Fixed Sticky Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  ⚡ Updates sync in real-time across QR menus & Kitchen Display
                </span>

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="dish-form"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md hover:shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{editingItem === 'NEW' ? 'Save Dish' : 'Update Dish'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Add / Manage Categories Modal */}
      {isCategoryModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
              onClick={() => setIsCategoryModalOpen(false)}
            />

            <div className="relative z-10 bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-fade-in flex flex-col my-auto max-h-[92vh]">
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                    <FolderPlus className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                      Manage Menu Categories
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Create new sections or delete existing categories
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body (Scrollable) */}
              <form
                id="category-form"
                onSubmit={handleCreateCategory}
                className="p-6 space-y-4 overflow-y-auto flex-1 text-xs"
              >
                {categoryError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{categoryError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Mocktails & Coolers, Tandoori Specials..."
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      if (categoryError) setCategoryError('');
                    }}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-slate-50/50"
                  />
                  {newCategoryName.trim() && (
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">
                      Category ID:{' '}
                      <span className="text-amber-700 font-bold">
                        {newCategoryName
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '')}
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Icon Symbol
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { icon: Flame, name: 'Flame', label: 'Tandoor' },
                      { icon: UtensilsCrossed, name: 'Utensils', label: 'Mains' },
                      { icon: Soup, name: 'Soup', label: 'Soups' },
                      { icon: Wheat, name: 'Wheat', label: 'Breads' },
                      { icon: Coffee, name: 'Coffee', label: 'Drinks' },
                      { icon: Cake, name: 'Cake', label: 'Desserts' },
                      { icon: Sparkles, name: 'Sparkles', label: 'Special' },
                      { icon: Tag, name: 'Tag', label: 'Custom' },
                    ].map((item) => {
                      const IconComp = item.icon;
                      const isSelected = newCategoryIcon === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setNewCategoryIcon(item.name)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${isSelected
                              ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/30 font-bold'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                            }`}
                        >
                          <IconComp className="w-4 h-4" />
                          <span className="text-[10px]">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Manage & Delete Existing Categories Section */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Existing Categories ({categories.filter((c) => c.id !== 'ALL').length})</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Click Delete to remove
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-1">
                    {categories
                      .filter((c) => c.id !== 'ALL')
                      .map((c) => {
                        const dishCount = menuItems.filter((i) => i.categoryId === c.id).length;
                        return (
                          <div
                            key={c.id}
                            className="flex items-center justify-between py-2 px-3 hover:bg-white rounded-xl transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0">
                                {c.name.charAt(0)}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  {dishCount} {dishCount === 1 ? 'dish' : 'dishes'} in menu
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setDeletingCategory({
                                  id: c.id,
                                  name: c.name,
                                  count: dishCount,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 shrink-0"
                              title={`Delete ${c.name} category`}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </form>

              {/* Fixed Sticky Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  form="category-form"
                  disabled={isSavingCategory || !newCategoryName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  {isSavingCategory ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Create Category</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Menu Dish?"
        message="This dish will be permanently removed from both the admin inventory and customer QR menu."
        confirmLabel="Delete Item"
        isDestructive={true}
        onConfirm={async () => {
          await deleteMenuItem(deletingId);
          setDeletingId(null);
        }}
        onCancel={() => setDeletingId(null)}
      />

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingCategory)}
        title={`Delete Category "${deletingCategory?.name}"?`}
        message={
          deletingCategory?.count > 0
            ? `Category "${deletingCategory?.name}" currently has ${deletingCategory.count} dishes. Deleting will remove this category tab from the menu. (Dishes will be preserved in database). Do you want to proceed?`
            : `Are you sure you want to permanently delete the "${deletingCategory?.name}" category?`
        }
        confirmLabel="Yes, Delete Category"
        isDestructive={true}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setDeletingCategory(null)}
      />

      {/* Plan Limit Upgrade Popup Alert */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Menu Dish Limit Reached"
        featureName="Menu Catalog Dishes"
        currentPlan={limits.planName}
        limitText={`Your current ${limits.planName} plan limit is ${limits.maxDishes} menu dishes.`}
        message="Please purchase this plan to perform this action."
      />
    </div>
  );
};
