import React, { useState, useEffect } from 'react';
import { Plus, Search, History, Package, Moon, Sun, Share2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import CategoryBar from './components/CategoryBar';
import ProductCard from './components/ProductCard';
import ProductForm from './components/ProductForm';

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
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem('wishlist_dark_mode', isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
    return matchesCategory && matchesStatus && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
    if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'priority') return Number(b.priority || '2') - Number(a.priority || '2');
    if (sortBy === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
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

        <Dashboard products={products} isDarkMode={isDarkMode} />

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
            <h2 className="text-xl font-bold group flex items-center gap-2">
              {showHistory ? 'Storico Acquisti' : selectedCategory === 'Tutti' ? 'Wishlist Attiva' : `Categoria: ${selectedCategory}`}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-slate-100 text-slate-500'}`}>{filteredProducts.length}</span>
            </h2>

            {!showHistory && (
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
            )}
          </div>

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
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isDarkMode ? 'bg-zinc-900 text-zinc-700' : 'bg-slate-100 text-slate-400'}`}>
                  <Search size={24} />
                </div>
                <div className="max-w-xs mx-auto">
                  <h3 className="font-semibold">Nessun risultato</h3>
                  <p className={`${isDarkMode ? 'text-zinc-500' : 'text-slate-500'} text-sm mt-1`}>Prova a cambiare filtri o cerca un termine diverso.</p>
                </div>
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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${isDarkMode ? 'bg-zinc-900/90 text-white border-zinc-800' : 'bg-white/90 text-slate-900 border-slate-100'
            }`}>
            <div className="bg-emerald-500 rounded-full p-1">
              <Plus size={14} className="text-white rotate-45" />
            </div>
            <span className="text-sm font-semibold">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
