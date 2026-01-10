import React, { useState, useEffect } from 'react';
import { Plus, Search, History, Package, Moon, Sun, Share2, Download, Upload, ChevronDown, ChevronUp, Eye, EyeOff, Check, GripVertical } from 'lucide-react';
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

const App = () => {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('wishlist_products');
    return saved ? JSON.parse(saved) : [];
  });

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
  const [toast, setToast] = useState(null);

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
    const list = products
      .filter(p => !p.isPurchased)
      .map(p => `- ${p.name}: €${Number(p.price).toFixed(2)}`)
      .join('\n');

    const text = `La mia Wishlist:\n\n${list || 'La lista è vuota.'}`;
    navigator.clipboard.writeText(text);
    showToast('Lista copiata negli appunti!');
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
        // Optional: Highlight effect
        element.classList.add('ring-2', 'ring-indigo-500');
        setTimeout(() => element.classList.remove('ring-2', 'ring-indigo-500'), 2000);
      }
    }, 100);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    localStorage.setItem('wishlist_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('wishlist_categories', JSON.stringify(categories));
  }, [categories]);

  const addProduct = (product) => {
    const newProduct = {
      ...product,
      id: crypto.randomUUID(),
      initialPrice: parseFloat(product.price),
      isPurchased: false,
      createdAt: new Date().toISOString(),
    };
    setProducts([newProduct, ...products]);
    if (!categories.includes(product.category)) {
      setCategories([...categories, product.category]);
    }
  };

  const updateProduct = (updatedProduct) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    if (!categories.includes(updatedProduct.category)) {
      setCategories([...categories, updatedProduct.category]);
    }
    setEditingProduct(null);
  };

  const togglePurchased = (id) => {
    setProducts(products.map(p =>
      p.id === id ? { ...p, isPurchased: !p.isPurchased, purchaseDate: !p.isPurchased ? new Date().toISOString() : null } : p
    ));
  };

  const deleteProduct = (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo prodotto?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Tutti' || p.category === selectedCategory;
    const matchesStatus = showHistory ? p.isPurchased : !p.isPurchased;
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
    .filter(p => (selectedCategory === 'Tutti' || p.category === selectedCategory) && !p.isPurchased)
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

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-[#F9FAFB] text-slate-900'} font-sans selection:bg-slate-200 dark:selection:bg-zinc-800`}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Wishlist & Shopping</h1>
              <p className={`${isDarkMode ? 'text-zinc-500' : 'text-slate-500'} mt-1`}>Gestisci i tuoi desideri e acquisti in modo smart.</p>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`md:hidden p-3 rounded-2xl transition-all ${isDarkMode ? 'bg-zinc-900 text-yellow-400' : 'bg-white shadow-sm text-slate-400'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <div className="flex items-center gap-3">
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
            <button
              onClick={() => setShowForm(true)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 shadow-sm active:scale-95 whitespace-nowrap ${isDarkMode ? 'bg-white text-zinc-950 hover:bg-zinc-100' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Nuovo Prodotto</span>
            </button>
          </div>
        </header>

        <Dashboard
          products={products}
          isDarkMode={isDarkMode}
          onSpentClick={() => setAnalysisMode('spent')}
          onWishlistClick={() => setAnalysisMode('wishlist')}
          onCountClick={() => setShowWishlistRecap(true)}
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

            <div className="flex items-center gap-2 px-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`border-none text-xs font-bold uppercase tracking-wider py-2 pl-3 pr-8 rounded-lg focus:ring-0 cursor-pointer transition-colors appearance-none ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${isDarkMode ? 'white' : 'black'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }}
              >
                <option value="recent">Ultimi Aggiunti</option>
                <option value="best_deal">🎯 Miglior Affare</option>
                <option value="priority">Ordina per Priorità</option>
                <option value="price-asc">Prezzo (Crescente)</option>
                <option value="price-desc">Prezzo (Decrescente)</option>
              </select>

              <div className={`w-px h-6 mx-2 hidden md:block ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`}></div>

              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showHistory
                  ? (isDarkMode ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'bg-slate-900 text-white shadow-sm')
                  : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100')
                  } whitespace-nowrap`}
              >
                {showHistory ? <Package size={16} /> : <History size={16} />}
                {showHistory ? 'Esci dallo Storico' : 'Vedi Storico'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold group flex items-center gap-2">
                {showHistory ? 'Storico Acquisti' : selectedCategory === 'Tutti' ? 'Wishlist Attiva' : `Categoria: ${selectedCategory}`}
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
              <div className="flex items-center gap-4">
                <button
                  onClick={copyWishlist}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isDarkMode ? 'text-zinc-500 hover:text-white hover:bg-zinc-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  title="Copia l'intera lista"
                >
                  <Share2 size={14} />
                  <span>Copia Lista</span>
                </button>
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
                        onDelete={deleteProduct}
                        onEdit={(p) => setEditingProduct(p)}
                        onShowToast={showToast}
                        isDarkMode={isDarkMode}
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
