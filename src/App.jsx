import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, History, Package, Moon, Sun, Share2, Download, Upload, ChevronDown, ChevronUp, Eye, EyeOff, Check, GripVertical, RefreshCw, LogIn, LogOut, User, UserCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import LZString from 'lz-string';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import Dashboard from './components/Dashboard';
import CategoryBar from './components/CategoryBar';
import ProductCard from './components/ProductCard';
import ProductForm from './components/ProductForm';
import BudgetAnalysisModal from './components/BudgetAnalysisModal';
import WishlistRecapModal from './components/WishlistRecapModal';
import PriceUpdateModal from './components/PriceUpdateModal';
import ArchiveModal from './components/ArchiveModal';
import LoginModal from './components/LoginModal';
import MigrationModal from './components/MigrationModal';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import ProfileModal from './components/ProfileModal';
import LandingPage from './components/LandingPage';
import { useAuth } from './context/AuthContext';
import * as productService from './lib/productService';
import { supabase } from './lib/supabase';

const STORAGE_KEY = 'wishlist_products';
const CATEGORIES_KEY = 'wishlist_categories';

const KEY_MAP = {
  name: 'n',
  price: 'p',
  category: 'c',
  url: 'u',
  imageUrl: 'i',
  targetPrice: 't',
  priority: 'r',
  isPurchased: 's',
  isArchived: 'a'
};

const REVERSE_KEY_MAP = Object.fromEntries(
  Object.entries(KEY_MAP).map(([key, value]) => [value, key])
);

const shrinkWishlistData = (products) => {
  return products.map(p => {
    const shrunk = {};
    Object.entries(KEY_MAP).forEach(([longKey, shortKey]) => {
      if (p[longKey] !== undefined && p[longKey] !== null && p[longKey] !== '') {
        shrunk[shortKey] = p[longKey];
      }
    });
    return shrunk;
  });
};

const expandWishlistData = (shrunkArray) => {
  return shrunkArray.map((shrunk, index) => {
    const expanded = { id: `pub-${index}-${Date.now()}` };
    Object.entries(shrunk).forEach(([shortKey, value]) => {
      const longKey = REVERSE_KEY_MAP[shortKey];
      if (longKey) {
        expanded[longKey] = value;
      }
    });
    return expanded;
  });
};

const App = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('wishlist_categories');
    return saved ? JSON.parse(saved) : ['Elettronica', 'Casa', 'Abbigliamento', 'Regali'];
  });

  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [showHistory, setShowHistory] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('wishlist_dark_mode') === 'true');
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(() => localStorage.getItem('wishlist_history_collapsed') === 'true');
  const [historyTimeFilter, setHistoryTimeFilter] = useState('month'); // 'month', '3months', 'all'
  const [analysisMode, setAnalysisMode] = useState(null); // null, 'spent', 'wishlist'
  const [showWishlistRecap, setShowWishlistRecap] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [activeProductForPriceUpdate, setActiveProductForPriceUpdate] = useState(null);
  const [toast, setToast] = useState(null);
  const [isPublicView, setIsPublicView] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [purchasingProductId, setPurchasingProductId] = useState(null);
  const [hasCheckedMigration, setHasCheckedMigration] = useState(false);

  // Load products based on auth state
  useEffect(() => {
    const loadProducts = async () => {
      // Skip if it's a public view (shared link)
      const params = new URLSearchParams(window.location.search);
      if (params.get('data')) {
        setIsLoadingProducts(false);
        return;
      }

      if (authLoading) return;

      if (user) {
        // User is logged in - load from Supabase
        try {
          const cloudProducts = await productService.fetchProducts(user.id);
          setProducts(cloudProducts);

          // Check for migration: first login with localStorage data
          if (!hasCheckedMigration) {
            const localData = localStorage.getItem('wishlist_products');
            const localProducts = localData ? JSON.parse(localData) : [];

            // If cloud is empty but localStorage has data, offer migration
            if (cloudProducts.length === 0 && localProducts.length > 0) {
              setShowMigrationModal(true);
            }
            setHasCheckedMigration(true);
          }
        } catch (err) {
          console.error('Error loading products from cloud:', err);
          showToast('Errore nel caricamento dal cloud');
          // Fallback to localStorage
          const saved = localStorage.getItem('wishlist_products');
          setProducts(saved ? JSON.parse(saved) : []);
        }
      } else {
        // User is not logged in - load from localStorage
        const saved = localStorage.getItem('wishlist_products');
        setProducts(saved ? JSON.parse(saved) : []);
      }
      setIsLoadingProducts(false);
    };

    loadProducts();
  }, [user, authLoading]);

  // Handler for migrating localStorage to cloud
  const handleMigrateToCloud = async () => {
    // First verify we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session || !session.user) {
      console.error('Session error:', sessionError);
      showToast('Errore: sessione non valida. Riprova il login.');
      return;
    }

    const userId = session.user.id;
    const localData = localStorage.getItem('wishlist_products');

    if (!localData) {
      showToast('Nessun dato locale da migrare.');
      return;
    }

    let localProducts;
    try {
      localProducts = JSON.parse(localData);
    } catch (parseError) {
      console.error('Error parsing localStorage:', parseError);
      showToast('Errore: dati locali corrotti.');
      return;
    }

    if (!Array.isArray(localProducts) || localProducts.length === 0) {
      showToast('Nessun prodotto da migrare.');
      return;
    }

    try {
      // Upload to Supabase
      await productService.uploadLocalProducts(localProducts, userId);

      // Fetch from database to get the server-assigned data
      const cloudProducts = await productService.fetchProducts(userId);
      setProducts(cloudProducts);

      showToast('Dati migrati nel cloud con successo! (' + localProducts.length + ' prodotti)');
    } catch (err) {
      // DO NOT clear localStorage on error - preserve local data
      console.error('Migration error:', err);
      const errorMessage = err.message || 'Errore sconosciuto';
      showToast('Errore durante il caricamento: ' + errorMessage);

      // Keep showing local products so user doesn't lose their data
      setProducts(localProducts);
    }
  };

  const handleSkipMigration = async () => {
    // User chose to start fresh - reload from cloud (empty)
    if (user) {
      try {
        const cloudProducts = await productService.fetchProducts(user.id);
        setProducts(cloudProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    }
    showToast('Ok, iniziamo da zero!');
  };

  // Handle shared wishlist data from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('data');
    if (sharedData) {
      try {
        let decodedData;

        // Try LZ-String decompression first
        const decompressed = LZString.decompressFromEncodedURIComponent(sharedData);
        if (decompressed) {
          decodedData = JSON.parse(decompressed);
        } else {
          // Fallback to Base64 (legacy Phase 4)
          decodedData = JSON.parse(atob(sharedData));
        }

        if (Array.isArray(decodedData)) {
          // Check if data is shrunk (Phase 8) or full-key (Phase 4/7)
          // We check if the first item has a 'name' key. If not, and it has 'n', it's shrunk.
          const isShrunk = decodedData.length > 0 && !decodedData[0].name && decodedData[0].n;
          const finalData = isShrunk ? expandWishlistData(decodedData) : decodedData;

          setProducts(finalData);
          setIsPublicView(true);
          setIsLoadingProducts(false);
          showToast('Visualizzando wishlist condivisa');
        }
      } catch (e) {
        console.error('Errore decodifica dati condivisi', e);
      }
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    localStorage.setItem('wishlist_dark_mode', isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('wishlist_history_collapsed', isHistoryCollapsed);
  }, [isHistoryCollapsed]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const copyWishlist = () => {
    const activeProducts = products.filter(p => !p.isPurchased);
    const shrunkData = shrinkWishlistData(activeProducts);
    const compressedData = LZString.compressToEncodedURIComponent(JSON.stringify(shrunkData));
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${compressedData}`;

    navigator.clipboard.writeText(shareUrl);
    showToast('Link live ottimizzato copiato!');
  };

  const handleExport = () => {
    const data = {
      products,
      categories,
      version: '2.3',
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `wishlist-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Backup scaricato correttamente!');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (window.confirm('Questa operazione sovrascriverà la tua lista attuale. Vuoi procedere?')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.products && data.categories) {
            setProducts(data.products);
            setCategories(data.categories);
            showToast('Dati ripristinati con successo!');
          } else {
            alert('Formato file non valido.');
          }
        } catch (err) {
          alert('Errore durante il caricamento del file.');
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleScrollToProduct = (id) => {
    setShowWishlistRecap(false);
    setShowHistory(false);
    setSelectedCategory('Tutti');
    setSearchQuery('');

    // Tiny delay to allow state changes to render and filters to reset
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight effect: green left border + subtle background
        element.style.borderLeft = '4px solid #22c55e';
        element.style.borderTopLeftRadius = '4px';
        element.style.borderBottomLeftRadius = '4px';
        element.style.backgroundColor = 'rgba(34, 197, 94, 0.05)';
        element.style.transition = 'all 0.5s ease-out';

        setTimeout(() => {
          element.style.borderLeft = '';
          element.style.borderTopLeftRadius = '';
          element.style.borderBottomLeftRadius = '';
          element.style.backgroundColor = '';
        }, 2000);
      }
    }, 100);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setSortBy('manual'); // Switch to manual sorting on drag
      setProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Immediate persistence
        localStorage.setItem('wishlist_products', JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  useEffect(() => {
    // Only persist to localStorage if not logged in and not public view
    if (!isPublicView && !user && products.length > 0) {
      localStorage.setItem('wishlist_products', JSON.stringify(products));
    }
  }, [products, isPublicView, user]);

  useEffect(() => {
    localStorage.setItem('wishlist_categories', JSON.stringify(categories));
  }, [categories]);

  const addProduct = async (product) => {
    const newProduct = {
      ...product,
      id: crypto.randomUUID(),
      initialPrice: parseFloat(product.price),
      isPurchased: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setProducts([newProduct, ...products]);

    if (!categories.includes(product.category)) {
      setCategories([...categories, product.category]);
    }

    // Sync to cloud if logged in
    if (user) {
      try {
        const cloudProduct = await productService.createProduct(newProduct, user.id);
        // Update with server-assigned ID if different
        setProducts(prev => prev.map(p => p.id === newProduct.id ? cloudProduct : p));
      } catch (err) {
        console.error('Error saving to cloud:', err);
        showToast('Errore nel salvataggio cloud');
      }
    }
  };

  const updateProduct = async (updatedProduct) => {
    // Optimistic update
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));

    if (!categories.includes(updatedProduct.category)) {
      setCategories([...categories, updatedProduct.category]);
    }
    setEditingProduct(null);

    // Sync to cloud if logged in
    if (user) {
      try {
        await productService.updateProduct(updatedProduct);
      } catch (err) {
        console.error('Error updating in cloud:', err);
        showToast('Errore nell\'aggiornamento cloud');
      }
    }
  };

  const togglePurchased = async (id) => {
    const targetProduct = products.find(p => p.id === id);
    if (!targetProduct) return;

    const newPurchasedState = !targetProduct.isPurchased;

    // If marking as purchased, animate first
    if (newPurchasedState) {
      setPurchasingProductId(id);

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 400));
      setPurchasingProductId(null);
    }

    const updatedProduct = {
      ...targetProduct,
      isPurchased: newPurchasedState,
      purchaseDate: newPurchasedState ? new Date().toISOString() : null
    };

    // Optimistic update
    setProducts(products.map(p => p.id === id ? updatedProduct : p));

    // Sync to cloud if logged in
    if (user) {
      try {
        await productService.updateProduct(updatedProduct);
      } catch (err) {
        console.error('Error updating purchase status in cloud:', err);
        showToast('Errore nell\'aggiornamento cloud');
      }
    }
  };

  const toggleArchive = async (id) => {
    const targetProduct = products.find(p => p.id === id);
    if (!targetProduct) return;

    const newArchivedState = !targetProduct.isArchived;
    const updatedProduct = {
      ...targetProduct,
      isArchived: newArchivedState
    };

    // Optimistic update
    setProducts(products.map(p => p.id === id ? updatedProduct : p));
    showToast(newArchivedState ? 'Spostato ne "I Sogni nel Cassetto"' : 'Riportato nella Wishlist');

    // Sync to cloud if logged in
    if (user) {
      try {
        await productService.updateProduct(updatedProduct);
      } catch (err) {
        console.error('Error updating archive status in cloud:', err);
        showToast('Errore nell\'aggiornamento cloud');
      }
    }
  };

  const deleteProduct = (id) => {
    const product = products.find(p => p.id === id);
    setProductToDelete(product);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    const id = productToDelete.id;
    setProductToDelete(null);

    // Optimistic update
    setProducts(products.filter(p => p.id !== id));

    // Sync to cloud if logged in
    if (user) {
      try {
        await productService.deleteProduct(id);
      } catch (err) {
        console.error('Error deleting from cloud:', err);
        showToast('Errore nell\'eliminazione dal cloud');
      }
    }
  };

  const updateProductPrice = async (id, newPrice) => {
    const numericPrice = parseFloat(newPrice);
    const date = new Date().toISOString();
    let updatedProductData = null;

    setProducts(prevProducts => {
      const updatedProducts = prevProducts.map(p => {
        if (p.id === id) {
          const isTargetReachedBefore = p.targetPrice && Number(p.price) <= Number(p.targetPrice);
          const isTargetReachedNow = p.targetPrice && numericPrice <= Number(p.targetPrice);

          if (isTargetReachedNow && !isTargetReachedBefore) {
            // Trigger confetti!
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#10b981', '#34d399', '#6ee7b7', '#ffffff']
            });
            showToast('🎯 Target raggiunto! Ottimo affare!');
          } else {
            showToast('Prezzo aggiornato!');
          }

          updatedProductData = {
            ...p,
            price: numericPrice,
            lastChecked: date
          };
          return updatedProductData;
        }
        return p;
      });
      return updatedProducts;
    });

    setActiveProductForPriceUpdate(null);

    // Sync to cloud if logged in
    if (user && updatedProductData) {
      try {
        await productService.updateProduct(updatedProductData);
      } catch (err) {
        console.error('Error updating price in cloud:', err);
        showToast('Errore nell\'aggiornamento cloud');
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Tutti' || p.category === selectedCategory;
    const matchesStatus = showHistory ? p.isPurchased : (!p.isPurchased && !p.isArchived);
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesTime = true;
    if (showHistory && p.isPurchased && p.purchaseDate) {
      const pDate = new Date(p.purchaseDate);
      const now = new Date();

      if (historyTimeFilter === 'month') {
        matchesTime = pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
      } else if (historyTimeFilter === '3months') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        matchesTime = pDate >= threeMonthsAgo;
      }
    }

    return matchesCategory && matchesStatus && matchesSearch && matchesTime;
  }).sort((a, b) => {
    if (sortBy === 'manual') return 0; // Keep current array order
    if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
    if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'priority') return Number(b.priority || '2') - Number(a.priority || '2');
    if (sortBy === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'best_deal') {
      const getScore = (p) => {
        if (!p.targetPrice) return -1000000;
        // Difference (negative if above target, positive if below or at target)
        return (Number(p.targetPrice) - Number(p.price));
      };
      return getScore(b) - getScore(a);
    }
    return 0;
  });

  const categoryRecapValue = products
    .filter(p => (selectedCategory === 'Tutti' || p.category === selectedCategory) && !p.isPurchased && !p.isArchived)
    .reduce((sum, p) => sum + Number(p.price), 0);

  const addCategory = (name) => {
    if (name && !categories.includes(name)) {
      setCategories([...categories, name]);
    }
  };

  const renameCategory = (oldName, newName) => {
    if (!newName || oldName === newName) return;

    // Update categories list
    setCategories(categories.map(c => c === oldName ? newName : c));

    // Update products
    setProducts(products.map(p =>
      p.category === oldName ? { ...p, category: newName } : p
    ));

    if (selectedCategory === oldName) {
      setSelectedCategory(newName);
    }
  };

  const deleteCategory = (name) => {
    if (window.confirm(`Sei sicuro di voler eliminare la categoria "${name}"? I prodotti verranno spostati in "Altro".`)) {
      // Remove category
      const newCategories = categories.filter(c => c !== name);
      if (!newCategories.includes('Altro')) {
        newCategories.push('Altro');
      }
      setCategories(newCategories);

      // Move products to "Altro"
      setProducts(products.map(p =>
        p.category === name ? { ...p, category: 'Altro' } : p
      ));

      if (selectedCategory === name) {
        setSelectedCategory('Tutti');
      }
    }
  };

  // Show landing page if not logged in (unless public view)
  if (!user && !loading && !isPublicView) {
    return <LandingPage isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-[#F9FAFB] text-slate-900'} font-sans selection:bg-slate-200 dark:selection:bg-zinc-800`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {isPublicView ? 'Ecco la tua Wishlist!' : 'Wishlist & Shopping'}
              </h1>
              <p className={`${isDarkMode ? 'text-zinc-500' : 'text-slate-500'} mt-1`}>
                {isPublicView ? 'Visualizzazione pubblica di sola lettura.' : 'Gestisci i tuoi desideri e acquisti in modo smart.'}
              </p>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`md:hidden p-3 rounded-2xl transition-all ${isDarkMode ? 'bg-zinc-900 text-yellow-400' : 'bg-white shadow-sm text-slate-400'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {!isPublicView ? (
            <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
              <div className="relative group flex-1 md:flex-none">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-zinc-600 group-focus-within:text-white' : 'text-slate-400 group-focus-within:text-slate-900'}`} size={18} />
                <input
                  type="text"
                  placeholder="Cerca prodotti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-4 py-2.5 rounded-full text-sm font-medium focus:ring-2 focus:outline-none transition-all w-full md:w-64 ${isDarkMode
                    ? 'bg-zinc-900 border-zinc-800 focus:ring-zinc-700 placeholder:text-zinc-600'
                    : 'bg-white border-slate-200 focus:ring-slate-900 placeholder:text-slate-300'
                    }`}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className={`p-2.5 rounded-full transition-all ${isDarkMode ? 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800' : 'bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-slate-600'}`}
                  title="Esporta Backup (JSON)"
                >
                  <Download size={18} />
                </button>
                <label className={`p-2.5 rounded-full transition-all cursor-pointer ${isDarkMode ? 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800' : 'bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-slate-600'}`} title="Importa Backup (JSON)">
                  <Upload size={18} />
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`hidden md:flex p-2.5 rounded-full transition-all ${isDarkMode ? 'bg-zinc-900 text-yellow-400 hover:bg-zinc-800' : 'bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-slate-600'}`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Auth Button */}
              {user ? (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="p-2 rounded-full transition-all text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10"
                  title="Profilo"
                >
                  <UserCircle size={24} />
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className={`px-4 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 ${isDarkMode ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-white border border-slate-100 shadow-sm text-slate-700 hover:bg-slate-50'}`}
                >
                  <LogIn size={18} />
                  <span className="hidden sm:inline">Accedi</span>
                </button>
              )}

              <button
                onClick={() => setShowForm(true)}
                className={`px-5 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 shadow-sm active:scale-95 whitespace-nowrap ${isDarkMode ? 'bg-white text-zinc-950 hover:bg-zinc-100' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nuovo Prodotto</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = window.location.pathname}
                className={`px-5 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 shadow-sm active:scale-95 whitespace-nowrap ${isDarkMode ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-white border border-slate-100 text-slate-900 hover:bg-slate-50'
                  }`}
              >
                Crea la tua Wishlist
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2.5 rounded-full transition-all ${isDarkMode ? 'bg-zinc-900 text-yellow-400 hover:bg-zinc-800' : 'bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-slate-600'}`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          )}
        </header>

        <Dashboard
          products={products}
          isDarkMode={isDarkMode}
          onSpentClick={() => setAnalysisMode('spent')}
          onWishlistClick={() => setAnalysisMode('wishlist')}
          onCountClick={() => setShowWishlistRecap(true)}
          isPublicView={isPublicView}
        />

        <div className="mt-12 space-y-8">
          <div className={`p-2 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${isDarkMode ? 'bg-zinc-900 border-zinc-800/50' : 'bg-white border-slate-100/50'
            }`}>
            <CategoryBar
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              onAdd={addCategory}
              onRename={renameCategory}
              onDelete={deleteCategory}
              isDarkMode={isDarkMode}
            />

            <div className="flex flex-wrap md:flex-row md:flex-nowrap items-center gap-2 md:gap-4 px-2 shrink-0">
              {!isPublicView && (
                <>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`border-none text-xs font-bold uppercase tracking-wider py-2 pl-3 pr-8 rounded-lg focus:ring-0 cursor-pointer transition-colors appearance-none shrink-0 ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${isDarkMode ? 'white' : 'black'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }}
                  >
                    <option value="recent">Ultimi Aggiunti</option>
                    <option value="manual">✋ Ordinamento Manuale</option>
                    <option value="best_deal">🎯 Miglior Affare</option>
                    <option value="priority">Ordina per Priorità</option>
                    <option value="price-asc">Prezzo (Crescente)</option>
                    <option value="price-desc">Prezzo (Decrescente)</option>
                  </select>

                  <div className={`w-px h-6 hidden md:block shrink-0 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`}></div>

                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${showHistory
                      ? (isDarkMode ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'bg-slate-900 text-white shadow-sm')
                      : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100')
                      }`}
                  >
                    <History size={16} />
                    <span className="hidden sm:inline">{showHistory ? 'Esci dallo Storico' : 'Vedi Storico'}</span>
                    <span className="sm:hidden">{showHistory ? 'Esci' : 'Storico'}</span>
                  </button>

                  <button
                    onClick={() => setShowArchive(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${showArchive
                      ? (isDarkMode ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'bg-slate-900 text-white shadow-sm')
                      : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100')
                      }`}
                  >
                    <Package size={16} />
                    <span className="hidden sm:inline">Vedi Archivio</span>
                    <span className="sm:hidden">Archivio</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold group flex items-center gap-2">
                {showHistory ? 'Storico Acquisti' : selectedCategory === 'Tutti' ? 'Wishlist Attiva' : 'Categoria: ' + selectedCategory}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-slate-100 text-slate-500'}`}>{filteredProducts.length}</span>
              </h2>
              {showHistory && (
                <button
                  onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
                  className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'}`}
                  title={isHistoryCollapsed ? "Espandi" : "Collassa"}
                >
                  {isHistoryCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              )}
            </div>

            {!showHistory ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                {!isPublicView && (
                  <button
                    onClick={copyWishlist}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isDarkMode ? 'text-zinc-500 hover:text-white hover:bg-zinc-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    title="Copia l'intera lista"
                  >
                    <Share2 size={14} />
                    <span>Copia Lista</span>
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Totale {selectedCategory === 'Tutti' ? 'Wishlist' : selectedCategory}</span>
                  <span className="text-lg font-bold">€ {categoryRecapValue.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest mr-2 ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'}`}>Filtra Periodo:</span>
                <div className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                  {[
                    { id: 'month', label: 'Mese' },
                    { id: '3months', label: '3 Mesi' },
                    { id: 'all', label: 'Tutto' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setHistoryTimeFilter(opt.id)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${historyTimeFilter === opt.id
                        ? (isDarkMode ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                        : (isDarkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-slate-400 hover:text-slate-600')
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showHistory && isHistoryCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'}`}>
            {!showHistory ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredProducts.map(p => p.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onTogglePurchase={togglePurchased}
                        onToggleArchive={toggleArchive}
                        onDelete={deleteProduct}
                        onEdit={(p) => setEditingProduct(p)}
                        onShowToast={showToast}
                        onCheckPrice={(p) => setActiveProductForPriceUpdate(p)}
                        isDarkMode={isDarkMode}
                        isPublicView={isPublicView}
                        isPurchasing={purchasingProductId === product.id}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onTogglePurchase={togglePurchased}
                      onDelete={deleteProduct}
                      onEdit={(p) => setEditingProduct(p)}
                      onShowToast={showToast}
                      onCheckPrice={(p) => setActiveProductForPriceUpdate(p)}
                      isDarkMode={isDarkMode}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isDarkMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-700' : 'bg-slate-100 text-slate-400'}`}>
                      <Package size={24} />
                    </div>
                    <div className="max-w-xs mx-auto">
                      <h3 className="font-semibold">Nessun acquisto trovato</h3>
                      <p className={`${isDarkMode ? 'text-zinc-500' : 'text-slate-500'} text-sm mt-1`}>Prova a ricaricare o controlla i filtri.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {(showForm || editingProduct) && (
        <ProductForm
          initialData={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSubmit={(p) => {
            if (editingProduct) {
              updateProduct({ ...editingProduct, ...p });
            } else {
              addProduct(p);
              setShowForm(false);
            }
          }}
          categories={categories}
          isDarkMode={isDarkMode}
        />
      )}

      {analysisMode && (
        <BudgetAnalysisModal
          onClose={() => setAnalysisMode(null)}
          products={products}
          categories={categories}
          isDarkMode={isDarkMode}
          initialMode={analysisMode}
        />
      )}

      {showWishlistRecap && (
        <WishlistRecapModal
          onClose={() => setShowWishlistRecap(false)}
          products={products}
          isDarkMode={isDarkMode}
          onNavigate={handleScrollToProduct}
        />
      )}

      {showArchive && (
        <ArchiveModal
          onClose={() => setShowArchive(false)}
          products={products}
          isDarkMode={isDarkMode}
          onToggleArchive={toggleArchive}
        />
      )}

      <PriceUpdateModal
        isOpen={!!activeProductForPriceUpdate}
        onClose={() => setActiveProductForPriceUpdate(null)}
        onSave={updateProductPrice}
        product={activeProductForPriceUpdate}
        isDarkMode={isDarkMode}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        isDarkMode={isDarkMode}
      />

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => { signOut(); setShowLogoutModal(false); setShowProfileModal(false); }}
        isDarkMode={isDarkMode}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onLogout={() => { setShowProfileModal(false); setShowLogoutModal(true); }}
        isDarkMode={isDarkMode}
      />

      <DeleteConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDeleteProduct}
        productName={productToDelete?.name}
        isDarkMode={isDarkMode}
      />

      <MigrationModal
        isOpen={showMigrationModal}
        onClose={() => setShowMigrationModal(false)}
        onMigrate={handleMigrateToCloud}
        onSkip={handleSkipMigration}
        localProductCount={(() => {
          const data = localStorage.getItem('wishlist_products');
          return data ? JSON.parse(data).length : 0;
        })()}
        isDarkMode={isDarkMode}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${isDarkMode ? 'bg-zinc-900/90 text-white border-zinc-800' : 'bg-white/90 text-slate-900 border-slate-100'
            }`}>
            <div className="bg-emerald-500 rounded-full p-1">
              <Check size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
