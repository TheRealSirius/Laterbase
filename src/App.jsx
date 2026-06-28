import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Plus, Search, History, Package, Moon, Sun, Download, ChevronDown, ChevronUp, Check, Server, UserCircle, X, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';
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
import LaterbaseRecapModal from './components/LaterbaseRecapModal';
import PriceUpdateModal from './components/PriceUpdateModal';
import ArchiveModal from './components/ArchiveModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import SelfHostedLogin from './components/SelfHostedLogin';
import AccountModal from './components/AccountModal';
import ExportModal from './components/ExportModal';
import ImportWishlistModal from './components/ImportWishlistModal';
import AboutPrivacyModal from './components/AboutPrivacyModal';
import OnboardingModal from './components/OnboardingModal';
import * as productService from './lib/productService';
import LanguageSelector from './components/LanguageSelector';
import { createMoneyFormatter, createTranslator, getCurrencyMeta, getInitialLanguage } from './lib/i18n';
import { getPriceStats, getWishScore, normalizePriceHistory } from './lib/laterbaseInsights';

const STORAGE_KEY = 'wishlist_products';
const CATEGORIES_KEY = 'wishlist_categories';
const ONBOARDING_KEY = 'wishlist_onboarding_seen_v1';
const DASHBOARD_SETTINGS_KEYS = ['wishlist_monthly_budget', 'wishlist_savings_fund', 'wishlist_stats_extra_info'];
const DEFAULT_CATEGORIES = ['Elettronica', 'Casa', 'Abbigliamento', 'Regali'];
const OTHER_CATEGORY = 'Altro';
const CATEGORY_TRANSLATION_KEYS = {
  Elettronica: 'category.electronics',
  Casa: 'category.home',
  Abbigliamento: 'category.clothing',
  Regali: 'category.gifts',
  Altro: 'category.other',
};
const SYSTEM_CATEGORIES = [...DEFAULT_CATEGORIES, OTHER_CATEGORY];
const DEFAULT_SETTINGS = {
  monthlyBudget: 0,
  savingsFund: 0,
  extraInfoEnabled: { total: true, spent: true, count: true },
};

const buildQuickAddBookmarklet = (baseUrl) => {
  const laterbaseUrl = JSON.stringify(baseUrl);
  return `javascript:(()=>{const c=s=>(s||'').replace(/\\s+/g,' ').trim(),u=s=>{try{return new URL(s,location.href).href}catch{return''}},m=n=>document.querySelector('meta[property="'+n+'"],meta[name="'+n+'"]')?.content||'',flat=x=>Array.isArray(x)?x.flatMap(flat):x&&typeof x==='object'&&Array.isArray(x['@graph'])?flat(x['@graph']):[x],json=()=>{try{return[...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(s=>flat(JSON.parse(s.textContent||'{}'))).find(x=>x&&/Product/i.test(Array.isArray(x['@type'])?x['@type'].join(' '):x['@type']||''))||{}}catch{return{}}},price=t=>{const x=c(t).match(/([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})|[0-9]+)/);if(!x)return'';const r=x[1];return r.lastIndexOf(',')>r.lastIndexOf('.')?r.replace(/\\./g,'').replace(',','.'):r.replace(/,/g,'')},first=o=>Array.isArray(o)?o[0]:o||{},o=json(),offer=first(o.offers),image=first(o.image),data={name:c(o.name||m('og:title')||m('twitter:title')||document.querySelector('#productTitle,h1')?.textContent||document.title).replace(/\\s*[:|-]\\s*Amazon\\..*$/i,''),price:price(offer.price||m('product:price:amount')||m('og:price:amount')||document.querySelector('#corePrice_feature_div .a-offscreen,.a-price .a-offscreen,[itemprop="price"],.price,[class*="price"]')?.textContent),url:location.href,imageUrl:u(image||m('og:image')||m('twitter:image')||document.querySelector('#landingImage,#imgTagWrapperId img,[itemprop="image"],img[src*="media"],img[src*="images"]')?.src),category:c(o.category||m('product:category')||document.querySelector('#wayfinding-breadcrumbs_container,.breadcrumb,[class*="breadcrumb"]')?.textContent)},target=${laterbaseUrl}+'#quickAdd='+encodeURIComponent(JSON.stringify(data)),w=window.open(target,'_blank');if(w)w.opener=null;else location.assign(target);})();`;
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const drawRoundRect = (ctx, x, y, width, height, radius) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
};

const wrapCanvasText = (ctx, text, maxWidth) => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth || !currentLine) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [''];
};

const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) => {
  const lines = wrapCanvasText(ctx, text, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => ctx.fillText(line, x, y + (index * lineHeight)));
  return lines.length * lineHeight;
};

const App = () => {
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [showHistory, setShowHistory] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [draftProduct, setDraftProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('wishlist_dark_mode') === 'true');
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(() => localStorage.getItem('wishlist_history_collapsed') === 'true');
  const [allowExternalImages, setAllowExternalImages] = useState(() => localStorage.getItem('wishlist_allow_external_images') === 'true');
  const [language, setLanguage] = useState(getInitialLanguage);
  const [historyTimeFilter, setHistoryTimeFilter] = useState('month'); // 'month', '3months', 'all'
  const [analysisMode, setAnalysisMode] = useState(null); // null, 'spent', 'wishlist'
  const [showLaterbaseRecap, setShowLaterbaseRecap] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [activeProductForPriceUpdate, setActiveProductForPriceUpdate] = useState(null);
  const [toast, setToast] = useState(null);
  const isPublicView = false;
  const [storageError, setStorageError] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [purchasingProductId, setPurchasingProductId] = useState(null);
  const [isBulkRefreshingPrices, setIsBulkRefreshingPrices] = useState(false);
  const categoryDeleteResolverRef = useRef(null);
  const t = useMemo(() => createTranslator(language), [language]);
  const formatCurrency = useMemo(() => createMoneyFormatter(language), [language]);
  const currencyMeta = useMemo(() => getCurrencyMeta(language), [language]);
  const getCategoryLabel = useCallback((category) => {
    if (category === 'Tutti') return t('all');
    const key = CATEGORY_TRANSLATION_KEYS[category];
    return key ? t(key) : category;
  }, [t]);
  const canonicalizeCategoryName = useCallback((name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return '';
    const normalized = trimmed.toLocaleLowerCase();
    const matchingSystemCategory = SYSTEM_CATEGORIES.find((category) => (
      category.toLocaleLowerCase() === normalized ||
      getCategoryLabel(category).toLocaleLowerCase() === normalized
    ));
    return matchingSystemCategory || trimmed;
  }, [getCategoryLabel]);

  const inferQuickAddCategory = useCallback((payload) => {
    const rawCategory = canonicalizeCategoryName(payload?.category || '');
    if (SYSTEM_CATEGORIES.includes(rawCategory)) return rawCategory;

    const text = `${payload?.name || ''} ${payload?.category || ''}`.toLocaleLowerCase();
    if (/(camera|computer|console|monitor|phone|smartphone|tablet|laptop|gaming|pc|usb|audio|cuffie|elettronica|electronics|elektronik|électronique|electrónica|電子|电器|전자)/i.test(text)) {
      return 'Elettronica';
    }
    if (/(home|house|kitchen|cucina|casa|garden|office|desk|sedia|table|scrivania|maison|hogar|家庭|家居|홈)/i.test(text)) {
      return 'Casa';
    }
    if (/(shirt|shoe|dress|clothing|fashion|abbigliamento|scarpe|moda|kleidung|vêtement|ropa|服|衣類|의류)/i.test(text)) {
      return 'Abbigliamento';
    }
    if (/(gift|regalo|cadeau|geschenk|prezent|present|선물|ギフト|礼物)/i.test(text)) {
      return 'Regali';
    }
    return OTHER_CATEGORY;
  }, [canonicalizeCategoryName]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2200);
  }, []);

  const persistState = async (nextProducts, nextCategories = categories, nextSettings = settings) => {
    if (isPublicView) return;

    try {
      const saved = await productService.saveState({
        products: nextProducts,
        categories: nextCategories,
        settings: nextSettings,
      });
      setStorageError(null);
      setProducts(saved.products);
      setCategories(saved.categories);
      setSettings(saved.settings || DEFAULT_SETTINGS);
    } catch (err) {
      console.error('Self-hosted save error:', err);
      setStorageError(err.message);
      showToast(t('toast.localSaveError'));
    }
  };

  const loadLocalState = useCallback(async () => {
    const state = await productService.fetchState();
    let nextProducts = state.products || [];
    let nextCategories = state.categories?.length ? state.categories : DEFAULT_CATEGORIES;
    let nextSettings = state.settings || DEFAULT_SETTINGS;

    const oldProducts = localStorage.getItem(STORAGE_KEY);
    const oldCategories = localStorage.getItem(CATEGORIES_KEY);
    if (nextProducts.length === 0 && oldProducts) {
      const parsedProducts = JSON.parse(oldProducts);
      const parsedCategories = oldCategories ? JSON.parse(oldCategories) : nextCategories;
      if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
        const imported = await productService.saveState({
          products: parsedProducts,
          categories: Array.isArray(parsedCategories) ? parsedCategories : nextCategories,
          settings: nextSettings,
        });
        nextProducts = imported.products;
        nextCategories = imported.categories;
        nextSettings = imported.settings || nextSettings;
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CATEGORIES_KEY);
        showToast(t('toast.oldLaterbaseImported'));
      }
    }

    const oldMonthlyBudget = localStorage.getItem('wishlist_monthly_budget');
    const oldSavingsFund = localStorage.getItem('wishlist_savings_fund');
    const oldExtraInfo = localStorage.getItem('wishlist_stats_extra_info');
    if (oldMonthlyBudget || oldSavingsFund || oldExtraInfo) {
      let parsedExtraInfo = nextSettings.extraInfoEnabled;
      try {
        parsedExtraInfo = oldExtraInfo ? JSON.parse(oldExtraInfo) : parsedExtraInfo;
      } catch {
        parsedExtraInfo = nextSettings.extraInfoEnabled;
      }
      nextSettings = {
        ...nextSettings,
        monthlyBudget: oldMonthlyBudget ? parseFloat(oldMonthlyBudget) || 0 : nextSettings.monthlyBudget,
        savingsFund: oldSavingsFund ? parseFloat(oldSavingsFund) || 0 : nextSettings.savingsFund,
        extraInfoEnabled: parsedExtraInfo,
      };
      const imported = await productService.saveState({
        products: nextProducts,
        categories: nextCategories,
        settings: nextSettings,
      });
      nextSettings = imported.settings || nextSettings;
      DASHBOARD_SETTINGS_KEYS.forEach((key) => localStorage.removeItem(key));
    }

    setProducts(nextProducts);
    setCategories(nextCategories);
    setSettings(nextSettings);
    setStorageError(null);
  }, [showToast, t]);

  // Check local auth and then load self-hosted data from the backend.
  useEffect(() => {
    const boot = async () => {
      try {
        const session = await productService.getCurrentUser();
        if (session.authenticated) {
          setAuthUser(session.user);
          await loadLocalState();
          if (localStorage.getItem(ONBOARDING_KEY) !== 'true') {
            setShowOnboardingModal(true);
          }
        }
      } catch (err) {
        console.error('App initialization error:', err);
        setStorageError(err.message);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    boot();
  }, [loadLocalState]);

  const handleLogin = async (credentials) => {
    const result = await productService.login(credentials);
    setAuthUser(result.user);
    setIsLoadingProducts(true);
    await loadLocalState();
    setIsLoadingProducts(false);
    if (localStorage.getItem(ONBOARDING_KEY) !== 'true') {
      setShowOnboardingModal(true);
    }
  };

  const handleLogout = async () => {
    await productService.logout();
    setAuthUser(null);
    setProducts([]);
    setShowAccountModal(false);
  };

  const handleAccountSave = async (accountData) => {
    const result = await productService.updateAccount(accountData);
    setAuthUser(result.user);
  };

  const exportDataBackup = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      products,
      categories,
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateSlug = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `laterbase-backup-${dateSlug}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(t('toast.dataExported'));
  };

  const importDataBackup = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const nextProducts = Array.isArray(payload.products) ? payload.products : [];
      const nextCategories = Array.isArray(payload.categories) && payload.categories.length ? payload.categories : DEFAULT_CATEGORIES;
      const nextSettings = payload.settings && typeof payload.settings === 'object' ? payload.settings : DEFAULT_SETTINGS;
      setProducts(nextProducts);
      setCategories(nextCategories);
      setSettings(nextSettings);
      await persistState(nextProducts, nextCategories, nextSettings);
      showToast(t('toast.dataImported'));
    } catch {
      showToast(t('toast.dataImportFailed'), 'error');
    }
  };

  const copyQuickAddBookmarklet = async () => {
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const script = buildQuickAddBookmarklet(baseUrl);
    try {
      await navigator.clipboard.writeText(script);
      showToast(t('toast.quickAddCopied'));
      return { script, copied: true };
    } catch {
      showToast(t('toast.quickAddCopyFailed'), 'error');
      return { script, copied: false };
    }
  };

  const handleSettingsChange = async (nextSettings) => {
    setSettings(nextSettings);
    await persistState(products, categories, nextSettings);
  };

  const closeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboardingModal(false);
  };

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

  useEffect(() => {
    localStorage.setItem('wishlist_allow_external_images', allowExternalImages);
  }, [allowExternalImages]);

  useEffect(() => {
    localStorage.setItem('wishlist_language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    if (!authUser || isPublicView) return undefined;

    const openQuickAddDraft = () => {
      const quickAddMatch = window.location.hash.match(/^#quickAdd=(.+)$/);
      if (!quickAddMatch) return false;
      try {
        const payload = JSON.parse(decodeURIComponent(quickAddMatch[1]));
        setDraftProduct({
          name: String(payload.name || '').trim(),
          price: payload.price == null ? '' : String(payload.price).trim(),
          url: String(payload.url || '').trim(),
          imageUrl: String(payload.imageUrl || '').trim(),
          category: inferQuickAddCategory(payload),
          priority: '2',
        });
        setShowForm(true);
        window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
        return true;
      } catch {
        showToast(t('toast.quickAddFailed'), 'error');
        window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
        return true;
      }
    };

    const onHashChange = () => {
      openQuickAddDraft();
    };

    window.addEventListener('hashchange', onHashChange);

    if (openQuickAddDraft()) {
      return () => window.removeEventListener('hashchange', onHashChange);
    }

    const params = new URLSearchParams(window.location.search);
    const addUrl = params.get('addUrl');

    if (!addUrl) return () => window.removeEventListener('hashchange', onHashChange);

    setDraftProduct({ url: addUrl });
    setShowForm(true);
    params.delete('addUrl');
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
    window.history.replaceState({}, '', nextUrl);

    return () => window.removeEventListener('hashchange', onHashChange);
  }, [authUser, inferQuickAddCategory, isPublicView, showToast, t]);

  const downloadLaterbaseImage = (activeProducts, exportOptions, total, exportedAt, categoriesSummary) => {
    const isGiftTheme = exportOptions.theme === 'gift';
    const scale = 2;
    const width = isGiftTheme ? 1080 : 1280;
    const padding = isGiftTheme ? 64 : 56;
    const contentWidth = width - (padding * 2);
    const cardGap = isGiftTheme ? 20 : 12;

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    const itemLayouts = activeProducts.map((product) => {
      const titleWidth = isGiftTheme ? contentWidth - 72 : contentWidth - 320;
      const titleLineHeight = isGiftTheme ? 39 : 29;
      const titleMaxLines = isGiftTheme ? 3 : 2;
      measureCtx.font = isGiftTheme ? '700 34px Georgia' : '800 24px Arial';
      const titleLines = wrapCanvasText(measureCtx, product.name, titleWidth).slice(0, titleMaxLines);
      measureCtx.font = '600 18px Arial';
      const noteLines = product.publicNote
        ? wrapCanvasText(measureCtx, product.publicNote, titleWidth).slice(0, 3)
        : [];
      const categoryHeight = 18;
      const titleHeight = Math.max(titleLineHeight, titleLines.length * titleLineHeight);
      const noteHeight = noteLines.length ? 8 + (noteLines.length * 24) : 0;
      const giftPriceHeight = exportOptions.includePrices && isGiftTheme
        ? 72 + (Number(product.targetPrice || 0) > 0 ? 22 : 0)
        : 0;
      const compactPriceHeight = exportOptions.includePrices && !isGiftTheme ? 70 : 0;
      const verticalChrome = isGiftTheme ? 70 : 58;
      const textHeight = categoryHeight + (isGiftTheme ? 42 : 34) + titleHeight + noteHeight + giftPriceHeight;
      const height = Math.max(isGiftTheme ? 190 : 118, verticalChrome + textHeight, compactPriceHeight + 54);
      return {
        height,
        titleWidth,
        titleLineHeight,
        titleMaxLines,
      };
    });
    const itemHeights = itemLayouts.map(layout => layout.height);

    const itemsHeight = itemHeights.reduce((sum, height) => sum + height, 0) + Math.max(0, activeProducts.length - 1) * cardGap;
    const height = Math.max(isGiftTheme ? 900 : 760, padding + 250 + itemsHeight + 110);
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    const bg = ctx.createLinearGradient(0, 0, width, height);
    if (isGiftTheme) {
      bg.addColorStop(0, '#fff4ef');
      bg.addColorStop(0.52, '#ffffff');
      bg.addColorStop(1, '#f8fbf7');
    } else {
      bg.addColorStop(0, '#f6f8fb');
      bg.addColorStop(1, '#eef4f8');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    if (isGiftTheme) {
      const glow = ctx.createRadialGradient(140, 100, 20, 140, 100, 340);
      glow.addColorStop(0, 'rgba(232,93,117,0.24)');
      glow.addColorStop(1, 'rgba(232,93,117,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.shadowColor = isGiftTheme ? 'rgba(129,57,75,0.16)' : 'rgba(16,35,63,0.10)';
    ctx.shadowBlur = isGiftTheme ? 50 : 34;
    ctx.shadowOffsetY = isGiftTheme ? 24 : 16;
    drawRoundRect(ctx, padding / 2, padding / 2, width - padding, height - padding, isGiftTheme ? 34 : 22);
    ctx.fillStyle = isGiftTheme ? 'rgba(255,255,255,0.90)' : '#ffffff';
    ctx.fill();
    ctx.shadowColor = 'transparent';

    let y = padding + 20;
    const markSize = 52;
    drawRoundRect(ctx, padding, y, markSize, markSize, 16);
    ctx.fillStyle = isGiftTheme ? '#e85d75' : '#10233f';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♡', padding + markSize / 2, y + markSize / 2 + 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#10233f';
    ctx.font = '900 24px Arial';
    ctx.fillText('Laterbase', padding + markSize + 16, y + 34);

    const title = isGiftTheme ? t('exportHtml.giftHeading') : t('exportHtml.heading');
    const subtitle = isGiftTheme ? t('exportHtml.giftSubtitle') : t('exportHtml.subtitle');
    y += 92;

    ctx.fillStyle = isGiftTheme ? '#321326' : '#10233f';
    ctx.font = isGiftTheme ? '700 70px Georgia' : '900 54px Arial';
    drawWrappedText(ctx, title, padding, y, contentWidth - 250, isGiftTheme ? 78 : 62, 2);

    ctx.fillStyle = '#66748a';
    ctx.font = '700 22px Arial';
    y += isGiftTheme ? 95 : 72;
    drawWrappedText(ctx, subtitle, padding, y, contentWidth - 80, 30, 2);

    const totalLabel = exportOptions.includePrices ? formatCurrency(total) : t('exportHtml.hiddenPrices');
    const totalBoxWidth = isGiftTheme ? 270 : 250;
    const totalBoxX = width - padding - totalBoxWidth;
    drawRoundRect(ctx, totalBoxX, padding + 24, totalBoxWidth, 92, isGiftTheme ? 999 : 18);
    ctx.fillStyle = isGiftTheme ? '#fff0ec' : '#f8fafc';
    ctx.fill();
    ctx.fillStyle = isGiftTheme ? '#c74261' : '#66748a';
    ctx.font = '900 14px Arial';
    ctx.fillText(t('exportHtml.total').toUpperCase(), totalBoxX + 24, padding + 59);
    ctx.fillStyle = isGiftTheme ? '#321326' : '#10233f';
    ctx.font = '900 30px Arial';
    ctx.fillText(totalLabel, totalBoxX + 24, padding + 94);

    y += 58;
    const metaItems = [
      [t('exportHtml.items'), String(activeProducts.length)],
      [t('exportHtml.exportedOn'), exportedAt],
      [t('exportHtml.categories'), categoriesSummary || t('exportHtml.none')],
    ];
    const metaGap = 14;
    const metaWidth = (contentWidth - metaGap * 2) / 3;
    metaItems.forEach(([label, value], index) => {
      const x = padding + index * (metaWidth + metaGap);
      drawRoundRect(ctx, x, y, metaWidth, 82, isGiftTheme ? 999 : 16);
      ctx.fillStyle = isGiftTheme ? 'rgba(255,255,255,0.76)' : '#f4f6f8';
      ctx.fill();
      ctx.fillStyle = isGiftTheme ? '#b56a7d' : '#66748a';
      ctx.font = '900 13px Arial';
      ctx.fillText(label.toUpperCase(), x + 20, y + 30);
      ctx.fillStyle = isGiftTheme ? '#321326' : '#10233f';
      ctx.font = '900 20px Arial';
      drawWrappedText(ctx, value, x + 20, y + 58, metaWidth - 40, 22, 1);
    });

    y += 112;
    if (!activeProducts.length) {
      drawRoundRect(ctx, padding, y, contentWidth, 110, 22);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.fillStyle = '#66748a';
      ctx.font = '800 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(t('exportHtml.empty'), width / 2, y + 64);
      ctx.textAlign = 'left';
    }

    activeProducts.forEach((product, index) => {
      const layout = itemLayouts[index];
      const itemHeight = layout.height;
      const x = padding;
      const price = Number(product.price || 0);
      const targetPrice = Number(product.targetPrice || 0);
      const decision = getWishScore(product, settings).decision;
      const isTargetReached = targetPrice > 0 && price <= targetPrice;

      ctx.shadowColor = isGiftTheme ? 'rgba(129,57,75,0.10)' : 'rgba(16,35,63,0.06)';
      ctx.shadowBlur = isGiftTheme ? 22 : 8;
      ctx.shadowOffsetY = isGiftTheme ? 10 : 4;
      drawRoundRect(ctx, x, y, contentWidth, itemHeight, isGiftTheme ? 26 : 16);
      ctx.fillStyle = isGiftTheme ? '#fff8f6' : '#ffffff';
      ctx.fill();
      ctx.shadowColor = 'transparent';

      if (isGiftTheme) {
        const stripe = ctx.createLinearGradient(x, y, x, y + itemHeight);
        stripe.addColorStop(0, '#e85d75');
        stripe.addColorStop(1, '#ffb199');
        drawRoundRect(ctx, x, y + 16, 6, itemHeight - 32, 999);
        ctx.fillStyle = stripe;
        ctx.fill();
      }

      const textX = x + (isGiftTheme ? 34 : 22);
      let itemY = y + (isGiftTheme ? 36 : 30);
      ctx.fillStyle = isGiftTheme ? '#c74261' : '#4d9b8a';
      ctx.font = '900 14px Arial';
      ctx.fillText(getCategoryLabel(product.category).toUpperCase(), textX, itemY);

      itemY += isGiftTheme ? 42 : 34;
      ctx.fillStyle = isGiftTheme ? '#321326' : '#10233f';
      ctx.font = isGiftTheme ? '700 34px Georgia' : '900 24px Arial';
      const titleWidth = layout.titleWidth;
      itemY += drawWrappedText(ctx, product.name, textX, itemY, titleWidth, layout.titleLineHeight, layout.titleMaxLines);

      if (product.publicNote) {
        ctx.fillStyle = isGiftTheme ? '#8a6370' : '#66748a';
        ctx.font = '600 18px Arial';
        itemY += 4;
        itemY += drawWrappedText(ctx, product.publicNote, textX, itemY, titleWidth, 24, 3);
      }

      if (exportOptions.includePrices) {
        const priceX = isGiftTheme ? textX : x + contentWidth - 250;
        const priceY = isGiftTheme ? itemY + 48 : y + 58;
        ctx.fillStyle = isGiftTheme ? '#e85d75' : '#4d9b8a';
        ctx.font = '900 14px Arial';
        ctx.fillText(t(`wishScore.${decision}`).toUpperCase(), priceX, priceY - 30);
        ctx.fillStyle = isGiftTheme ? '#321326' : '#10233f';
        ctx.font = '900 30px Arial';
        ctx.fillText(formatCurrency(price), priceX, priceY);

        if (targetPrice > 0 || isTargetReached) {
          ctx.fillStyle = '#66748a';
          ctx.font = '700 14px Arial';
          const targetText = targetPrice > 0 ? `${t('exportHtml.target')}: ${formatCurrency(targetPrice)}` : '';
          ctx.fillText(targetText, priceX, priceY + 24);
        }
      }

      y += itemHeight + cardGap;
    });

    ctx.fillStyle = '#66748a';
    ctx.font = '700 16px Arial';
    ctx.fillText(t('exportHtml.readOnly'), padding, height - padding - 10);

    const dateSlug = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.download = `laterbase-${exportOptions.theme}-${dateSlug}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const exportReadOnlyLaterbase = (options = {}) => {
    const exportOptions = {
      theme: options.theme || 'compact',
      format: options.format || 'image',
      includePrices: options.includePrices !== false,
      onlyGiftIdeas: Boolean(options.onlyGiftIdeas),
    };
    const activeProducts = products.filter(p => (
      !p.isPurchased && !p.isArchived && (!exportOptions.onlyGiftIdeas || p.isGiftIdea)
    ));
    const total = activeProducts.reduce((sum, product) => sum + Number(product.price || 0), 0);
    const exportedAt = new Intl.DateTimeFormat(currencyMeta.locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date());
    const categoriesSummary = [...new Set(activeProducts.map(product => getCategoryLabel(product.category)))]
      .filter(Boolean)
      .join(' · ');

    if (exportOptions.format === 'image') {
      downloadLaterbaseImage(activeProducts, exportOptions, total, exportedAt, categoriesSummary);
      showToast(t('toast.exportImageReady'));
      return;
    }

    const rows = activeProducts.map((product) => {
      const price = Number(product.price || 0);
      const targetPrice = Number(product.targetPrice || 0);
      const hasTarget = targetPrice > 0;
      const isTargetReached = hasTarget && price <= targetPrice;
      const productUrl = product.url ? escapeHtml(product.url) : '';
      const stats = getPriceStats(product);
      const decision = getWishScore(product, settings).decision;
      const publicNote = product.publicNote ? `<p class="note">${escapeHtml(product.publicNote)}</p>` : '';
      const giftBadge = exportOptions.theme === 'gift' && product.isGiftIdea
        ? `<span class="gift-badge">${escapeHtml(t('product.giftIdea'))}</span>`
        : '';

      return `
        <article class="item ${product.isGiftIdea ? 'gift' : ''}">
          <div class="item-main">
            <p class="category">${escapeHtml(getCategoryLabel(product.category))}</p>
            <h2>${escapeHtml(product.name)}${giftBadge}</h2>
            ${publicNote}
            ${productUrl ? `<a href="${productUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('exportHtml.openLink'))}</a>` : ''}
          </div>
          <div class="price-box ${exportOptions.includePrices ? '' : 'hidden-price'}">
            <small>${escapeHtml(t(`wishScore.${decision}`))}</small>
            <strong>${escapeHtml(formatCurrency(price))}</strong>
            ${hasTarget ? `<span>${escapeHtml(t('exportHtml.target'))}: ${escapeHtml(formatCurrency(targetPrice))}</span>` : ''}
            ${stats.isBestPrice && stats.history.length > 1 ? `<em>${escapeHtml(t('product.bestPrice'))}</em>` : ''}
            ${isTargetReached ? `<em>${escapeHtml(t('exportHtml.targetReached'))}</em>` : ''}
          </div>
        </article>
      `;
    }).join('');

    const html = `<!doctype html>
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(t('exportHtml.title'))}</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #10233f;
      --muted: #66748a;
      --line: #e5eaf1;
      --paper: #fbfaf7;
      --card: #ffffff;
      --mint: #4d9b8a;
      --coral: #ff735c;
      --soft: #f4f1ea;
      --accent: ${exportOptions.theme === 'gift' ? '#e85d75' : '#4d9b8a'};
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at 12% 4%, rgba(121,199,181,.18), transparent 28%), var(--paper);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.45;
    }
    main {
      width: min(920px, calc(100% - 32px));
      margin: 28px auto;
      padding: 28px;
      border: 1px solid rgba(255,255,255,.9);
      border-radius: 28px;
      background: rgba(255,255,255,.72);
      box-shadow: 0 24px 70px rgba(16,35,63,.12);
      backdrop-filter: blur(12px);
    }
    header {
      display: grid;
      gap: 24px;
      grid-template-columns: 1fr auto;
      align-items: start;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--line);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
      font-weight: 900;
      font-size: 18px;
    }
    .mark {
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      border-radius: 16px;
      background: var(--ink);
      color: white;
      font-size: 22px;
    }
    h1 {
      margin: 0;
      max-width: 680px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(34px, 6vw, 64px);
      line-height: .98;
      letter-spacing: 0;
    }
    .subtitle {
      max-width: 620px;
      margin: 14px 0 0;
      color: var(--muted);
      font-weight: 650;
    }
    .summary {
      min-width: 230px;
      padding: 18px;
      border: 1px solid var(--line);
      border-radius: 22px;
      background: var(--card);
    }
    .summary span, .meta span {
      display: block;
      color: var(--muted);
      font-size: 11px;
      font-weight: 900;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    .summary strong {
      display: block;
      margin-top: 6px;
      font-size: 26px;
      font-weight: 950;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin: 18px 0 24px;
    }
    .meta div {
      padding: 14px;
      border-radius: 18px;
      background: var(--soft);
    }
    .meta strong {
      display: block;
      margin-top: 5px;
      font-size: 18px;
      font-weight: 950;
    }
    .list {
      display: grid;
      gap: 10px;
    }
    .item {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 16px;
      align-items: center;
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 20px;
      background: var(--card);
    }
    .category {
      margin: 0 0 4px;
      color: var(--mint);
      font-size: 11px;
      font-weight: 950;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    .note {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 13px;
      font-weight: 650;
    }
    .gift {
      border-color: rgba(232,93,117,.22);
      background: linear-gradient(90deg, rgba(232,93,117,.08), var(--card) 38%);
    }
    h2 {
      margin: 0;
      font-size: 18px;
      line-height: 1.2;
    }
    a {
      display: inline-block;
      margin-top: 8px;
      color: var(--ink);
      font-size: 12px;
      font-weight: 850;
      text-decoration-color: rgba(16,35,63,.25);
    }
    .price-box {
      min-width: 170px;
      text-align: right;
    }
    .price-box strong {
      display: block;
      font-size: 22px;
      font-weight: 950;
      white-space: nowrap;
    }
    .price-box small {
      display: inline-block;
      margin-bottom: 6px;
      color: var(--accent);
      font-size: 10px;
      font-weight: 950;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .hidden-price strong,
    .hidden-price span {
      display: none;
    }
    .price-box span {
      display: block;
      margin-top: 3px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 750;
      white-space: nowrap;
    }
    .price-box em {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 9px;
      border-radius: 999px;
      background: rgba(121,199,181,.16);
      color: #277568;
      font-size: 11px;
      font-style: normal;
      font-weight: 950;
    }
    .empty {
      padding: 34px;
      border: 1px dashed var(--line);
      border-radius: 22px;
      color: var(--muted);
      text-align: center;
      font-weight: 800;
      background: rgba(255,255,255,.45);
    }
    footer {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid var(--line);
      color: var(--muted);
      font-size: 12px;
      font-weight: 750;
    }
    .gift-badge {
      display: inline-flex;
      align-items: center;
      margin-left: 10px;
      padding: 4px 9px;
      border-radius: 999px;
      background: rgba(232,93,117,.12);
      color: #c74261;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      font-size: 10px;
      font-weight: 950;
      letter-spacing: .08em;
      text-transform: uppercase;
      vertical-align: middle;
    }
    .theme-compact {
      background: #f6f8fb;
    }
    .theme-compact main {
      width: min(1040px, calc(100% - 32px));
      border-radius: 18px;
      background: #ffffff;
      box-shadow: 0 18px 44px rgba(16,35,63,.08);
    }
    .theme-compact header {
      grid-template-columns: minmax(0, 1fr) 210px;
      align-items: center;
    }
    .theme-compact h1 {
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      font-size: clamp(30px, 4vw, 48px);
      line-height: 1.05;
    }
    .theme-compact .subtitle {
      max-width: 760px;
    }
    .theme-compact .meta {
      grid-template-columns: repeat(3, 1fr);
      margin: 16px 0 18px;
    }
    .theme-compact .meta div {
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #f8fafc;
    }
    .theme-compact .list {
      gap: 8px;
    }
    .theme-compact .item {
      border-radius: 14px;
      box-shadow: none;
      background: #ffffff;
    }
    .theme-compact .item:hover {
      border-color: #cbd5e1;
    }
    .theme-compact h2 {
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      font-size: 17px;
    }
    .theme-compact .price-box strong {
      font-size: 20px;
    }
    .theme-gift {
      min-height: 100vh;
      background:
        radial-gradient(circle at 18% 12%, rgba(255,190,178,.35), transparent 28%),
        radial-gradient(circle at 82% 0%, rgba(232,93,117,.18), transparent 24%),
        linear-gradient(135deg, #fff9f5 0%, #fff 48%, #f7fbf8 100%);
    }
    .theme-gift main {
      width: min(820px, calc(100% - 32px));
      margin: 34px auto;
      padding: 34px;
      border: 1px solid rgba(232,93,117,.16);
      border-radius: 34px;
      background: rgba(255,255,255,.86);
      box-shadow: 0 30px 90px rgba(129,57,75,.16);
    }
    .theme-gift header {
      display: block;
      text-align: center;
      padding-bottom: 28px;
      border-bottom: 0;
    }
    .theme-gift .brand {
      justify-content: center;
      margin-bottom: 16px;
      color: #c74261;
    }
    .theme-gift .mark {
      background: linear-gradient(135deg, #e85d75, #ff9a76);
      box-shadow: 0 12px 24px rgba(232,93,117,.22);
    }
    .theme-gift h1 {
      max-width: none;
      color: #321326;
      font-size: clamp(42px, 7vw, 72px);
    }
    .theme-gift .subtitle {
      margin-left: auto;
      margin-right: auto;
      color: #8a6370;
    }
    .theme-gift .summary {
      display: inline-block;
      min-width: 0;
      margin-top: 20px;
      padding: 12px 18px;
      border-color: rgba(232,93,117,.18);
      border-radius: 999px;
      background: rgba(255,238,232,.8);
    }
    .theme-gift .summary span {
      display: inline;
      margin-right: 10px;
      color: #c74261;
    }
    .theme-gift .summary strong {
      display: inline;
      font-size: 18px;
      color: #321326;
    }
    .theme-gift .meta {
      grid-template-columns: repeat(3, 1fr);
      margin: 8px 0 26px;
    }
    .theme-gift .meta div {
      text-align: center;
      border: 1px solid rgba(232,93,117,.12);
      border-radius: 999px;
      background: rgba(255,255,255,.74);
    }
    .theme-gift .meta span {
      color: #b56a7d;
    }
    .theme-gift .meta strong {
      color: #321326;
      font-size: 15px;
    }
    .theme-gift .list {
      gap: 14px;
    }
    .theme-gift .item {
      position: relative;
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 22px;
      border-color: rgba(232,93,117,.18);
      border-radius: 26px;
      background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(255,244,240,.9));
      box-shadow: 0 16px 36px rgba(129,57,75,.08);
    }
    .theme-gift .item::before {
      content: "";
      position: absolute;
      inset: 14px auto 14px 0;
      width: 5px;
      border-radius: 999px;
      background: linear-gradient(#e85d75, #ffb199);
    }
    .theme-gift .category {
      color: #c74261;
    }
    .theme-gift h2 {
      color: #321326;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 25px;
      line-height: 1.12;
    }
    .theme-gift a {
      color: #c74261;
      text-decoration-color: rgba(199,66,97,.28);
    }
    .theme-gift .note {
      max-width: 620px;
      color: #8a6370;
      font-size: 14px;
    }
    .theme-gift .price-box {
      min-width: 0;
      text-align: left;
    }
    .theme-gift .price-box small {
      color: #e85d75;
    }
    .theme-gift .price-box strong {
      display: inline-block;
      margin-right: 10px;
      color: #321326;
      font-size: 24px;
    }
    .theme-gift .price-box span,
    .theme-gift .price-box em {
      display: inline-block;
      margin-right: 8px;
    }
    .theme-gift footer {
      border-top-color: rgba(232,93,117,.14);
      color: #8a6370;
      text-align: center;
    }
    @media (max-width: 720px) {
      main { padding: 20px; border-radius: 22px; }
      header, .item { grid-template-columns: 1fr; }
      .summary, .price-box { min-width: 0; text-align: left; }
      .meta { grid-template-columns: 1fr; }
      .price-box strong { font-size: 20px; }
      .theme-gift header { text-align: left; }
      .theme-gift .brand { justify-content: flex-start; }
      .theme-gift .meta { grid-template-columns: 1fr; }
      .theme-gift .summary { border-radius: 20px; }
    }
    @media print {
      body { background: white; }
      main { width: 100%; margin: 0; box-shadow: none; border: 0; }
      a { color: inherit; }
    }
  </style>
</head>
<body class="theme-${escapeHtml(exportOptions.theme)}">
  <main>
    <header>
      <div>
        <div class="brand"><span class="mark">♡</span><span>Laterbase</span></div>
        <h1>${escapeHtml(exportOptions.theme === 'gift' ? t('exportHtml.giftHeading') : t('exportHtml.heading'))}</h1>
        <p class="subtitle">${escapeHtml(exportOptions.theme === 'gift' ? t('exportHtml.giftSubtitle') : t('exportHtml.subtitle'))}</p>
      </div>
      <aside class="summary">
        <span>${escapeHtml(t('exportHtml.total'))}</span>
        <strong>${escapeHtml(exportOptions.includePrices ? formatCurrency(total) : t('exportHtml.hiddenPrices'))}</strong>
      </aside>
    </header>
    <section class="meta" aria-label="${escapeHtml(t('exportHtml.summary'))}">
      <div><span>${escapeHtml(t('exportHtml.items'))}</span><strong>${activeProducts.length}</strong></div>
      <div><span>${escapeHtml(t('exportHtml.exportedOn'))}</span><strong>${escapeHtml(exportedAt)}</strong></div>
      <div><span>${escapeHtml(t('exportHtml.categories'))}</span><strong>${escapeHtml(categoriesSummary || t('exportHtml.none'))}</strong></div>
    </section>
    <section class="list">
      ${rows || `<div class="empty">${escapeHtml(t('exportHtml.empty'))}</div>`}
    </section>
    <footer>${escapeHtml(t('exportHtml.readOnly'))}</footer>
  </main>
</body>
</html>`;

    const printableHtml = html.replace(
      '</body>',
      `<script>
        window.addEventListener('load', () => {
          window.setTimeout(() => window.print(), 350);
        });
      </script></body>`
    );
    const printBlob = new Blob([printableHtml], { type: 'text/html;charset=utf-8' });
    const printUrl = URL.createObjectURL(printBlob);
    const printWindow = window.open(printUrl, '_blank');
    if (!printWindow) {
      URL.revokeObjectURL(printUrl);
      showToast(t('toast.exportPopupBlocked'), 'error');
      return;
    }

    window.setTimeout(() => URL.revokeObjectURL(printUrl), 60000);

    showToast(t('toast.exportPdfReady'));
  };

  const handleScrollToProduct = (id) => {
    setShowLaterbaseRecap(false);
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

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (isPublicView || showHistory || !active || !over || active.id === over.id) return;

    const visibleIds = filteredProducts.map((item) => item.id);
    const oldIndex = visibleIds.indexOf(active.id);
    const newIndex = visibleIds.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedVisibleProducts = arrayMove(filteredProducts, oldIndex, newIndex);
    const reorderedQueue = [...reorderedVisibleProducts];
    const visibleIdSet = new Set(visibleIds);
    const newOrder = products.map((product) => (
      visibleIdSet.has(product.id) ? reorderedQueue.shift() : product
    ));

    setSortBy('manual');
    setProducts(newOrder);
    await persistState(newOrder);
  };

  const addProduct = async (product) => {
    const price = parseFloat(product.price);
    const createdAt = new Date().toISOString();
    const newProduct = {
      ...product,
      id: crypto.randomUUID(),
      price,
      initialPrice: price,
      priceHistory: [{ price, date: createdAt, source: 'initial' }],
      isPurchased: false,
      isArchived: false,
      createdAt,
    };

    const nextProducts = [newProduct, ...products];
    const nextCategories = categories.includes(product.category) ? categories : [...categories, product.category];
    setProducts(nextProducts);
    setCategories(nextCategories);
    await persistState(nextProducts, nextCategories);
  };

  const addImportedProducts = async (importedProducts) => {
    const createdAt = new Date().toISOString();
    const normalizedImportedProducts = importedProducts
      .map((product, index) => {
        const price = Number(product.price);
        if (!product.name || !Number.isFinite(price)) return null;
        return {
          ...product,
          id: crypto.randomUUID(),
          price,
          initialPrice: price,
          priceHistory: [{ price, date: createdAt, source: 'import' }],
          priority: product.priority || '2',
          targetPrice: product.targetPrice || null,
          notes: product.notes || '',
          publicNote: product.publicNote || '',
          isGiftIdea: Boolean(product.isGiftIdea),
          isPurchased: false,
          isArchived: false,
          purchaseDate: null,
          createdAt: new Date(Date.now() + index).toISOString(),
          lastChecked: null,
        };
      })
      .filter(Boolean);

    if (!normalizedImportedProducts.length) return;

    const nextProducts = [...normalizedImportedProducts, ...products];
    const nextCategories = Array.from(new Set([
      ...categories,
      ...normalizedImportedProducts.map((product) => product.category).filter(Boolean),
    ]));
    setProducts(nextProducts);
    setCategories(nextCategories);
    await persistState(nextProducts, nextCategories);
    showToast(t('toast.importedProducts').replace('{count}', String(normalizedImportedProducts.length)));
  };

  const updateProduct = async (updatedProduct) => {
    const nextProducts = products.map(p => {
      if (p.id !== updatedProduct.id) return p;
      const oldPrice = Number(p.price);
      const nextPrice = Number(updatedProduct.price);
      const priceHistory = normalizePriceHistory(p);
      const shouldTrackPrice = Number.isFinite(nextPrice) && nextPrice >= 0 && oldPrice !== nextPrice;
      return {
        ...updatedProduct,
        initialPrice: p.initialPrice || oldPrice || nextPrice,
        priceHistory: shouldTrackPrice
          ? [...priceHistory, { price: nextPrice, date: new Date().toISOString(), source: 'edit' }]
          : priceHistory,
      };
    });
    const nextCategories = categories.includes(updatedProduct.category) ? categories : [...categories, updatedProduct.category];
    setProducts(nextProducts);
    setCategories(nextCategories);
    setEditingProduct(null);
    await persistState(nextProducts, nextCategories);
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

    const nextProducts = products.map(p => p.id === id ? updatedProduct : p);
    setProducts(nextProducts);
    await persistState(nextProducts);
  };

  const toggleArchive = async (id) => {
    const targetProduct = products.find(p => p.id === id);
    if (!targetProduct) return;

    const newArchivedState = !targetProduct.isArchived;
    const updatedProduct = {
      ...targetProduct,
      isArchived: newArchivedState
    };

    const nextProducts = products.map(p => p.id === id ? updatedProduct : p);
    setProducts(nextProducts);
    showToast(newArchivedState ? t('toast.movedToArchive') : t('toast.restoredToLaterbase'));
    await persistState(nextProducts);
  };

  const deleteProduct = (id) => {
    const product = products.find(p => p.id === id);
    setProductToDelete(product);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    const id = productToDelete.id;
    setProductToDelete(null);

    const nextProducts = products.filter(p => p.id !== id);
    setProducts(nextProducts);
    await persistState(nextProducts);
  };

  const updateProductPrice = async (id, newPrice) => {
    const numericPrice = parseFloat(newPrice);
    const date = new Date().toISOString();
    const nextProducts = products.map(p => {
      if (p.id !== id) return p;

      const isTargetReachedBefore = p.targetPrice && Number(p.price) <= Number(p.targetPrice);
      const isTargetReachedNow = p.targetPrice && numericPrice <= Number(p.targetPrice);

      if (isTargetReachedNow && !isTargetReachedBefore) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#ffffff']
        });
        showToast(t('toast.targetReached'));
      } else {
        showToast(t('toast.priceUpdated'));
      }

      return {
        ...p,
        price: numericPrice,
        priceHistory: [...normalizePriceHistory(p), { price: numericPrice, date, source: 'manual' }],
        lastChecked: date
      };
    });

    setProducts(nextProducts);

    setActiveProductForPriceUpdate(null);
    await persistState(nextProducts);
  };

  const refreshLaterbasePrices = async () => {
    if (isBulkRefreshingPrices) return;

    const candidates = products.filter((product) => (
      !product.isPurchased &&
      !product.isArchived &&
      product.url &&
      /^https?:\/\//i.test(product.url)
    ));

    if (!candidates.length) {
      showToast(t('toast.noPricesToRefresh'), 'error');
      return;
    }

    setIsBulkRefreshingPrices(true);

    try {
      const date = new Date().toISOString();
      const priceUpdates = new Map();
      let updated = 0;
      let unchanged = 0;
      let failed = 0;

      for (const product of candidates) {
        try {
          const preview = await productService.fetchProductPreview(product.url);
          const nextPrice = Number(preview.price);
          const currentPrice = Number(product.price);

          if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
            failed += 1;
          } else if (nextPrice === currentPrice) {
            unchanged += 1;
            priceUpdates.set(product.id, {
              price: currentPrice,
              lastChecked: date,
              unchanged: true,
            });
          } else {
            updated += 1;
            priceUpdates.set(product.id, {
              price: nextPrice,
              lastChecked: date,
              unchanged: false,
            });
          }
        } catch {
          failed += 1;
        }
      }

      if (priceUpdates.size > 0) {
        const nextProducts = products.map((product) => {
          const update = priceUpdates.get(product.id);
          if (!update) return product;

          const nextProduct = {
            ...product,
            price: update.price,
            lastChecked: update.lastChecked,
          };

          if (!update.unchanged) {
            nextProduct.priceHistory = [
              ...normalizePriceHistory(product),
              { price: update.price, date: update.lastChecked, source: 'bulk-refresh' },
            ];
          }

          return nextProduct;
        });

        setProducts(nextProducts);
        await persistState(nextProducts);
      }

      showToast(
        t('toast.bulkPriceRefreshDone')
          .replace('{updated}', updated)
          .replace('{unchanged}', unchanged)
          .replace('{failed}', failed),
        failed > 0 && updated === 0 ? 'error' : 'success'
      );
    } finally {
      setIsBulkRefreshingPrices(false);
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

  const addCategory = async (name) => {
    const canonicalName = canonicalizeCategoryName(name);
    if (canonicalName && !categories.includes(canonicalName)) {
      const nextCategories = [...categories, canonicalName];
      setCategories(nextCategories);
      await persistState(products, nextCategories);
    }
    return canonicalName;
  };

  const renameCategory = async (oldName, newName) => {
    const canonicalNewName = canonicalizeCategoryName(newName);
    if (!canonicalNewName || oldName === canonicalNewName) return;

    const nextCategories = categories.map(c => c === oldName ? canonicalNewName : c);
    const nextProducts = products.map(p =>
      p.category === oldName ? { ...p, category: canonicalNewName } : p
    );

    setCategories(nextCategories);
    setProducts(nextProducts);

    if (selectedCategory === oldName) {
      setSelectedCategory(canonicalNewName);
    }

    await persistState(nextProducts, nextCategories);
  };

  const resolveCategoryDelete = (result) => {
    categoryDeleteResolverRef.current?.(result);
    categoryDeleteResolverRef.current = null;
    setCategoryToDelete(null);
  };

  const deleteCategory = async (name) => {
    if (!name || !categories.includes(name)) return false;
    return new Promise((resolve) => {
      categoryDeleteResolverRef.current = resolve;
      setCategoryToDelete(name);
    });
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    const newCategories = categories.filter(c => c !== categoryToDelete);
    if (!newCategories.includes(OTHER_CATEGORY)) {
      newCategories.push(OTHER_CATEGORY);
    }
    const nextProducts = products.map(p =>
      p.category === categoryToDelete ? { ...p, category: OTHER_CATEGORY } : p
    );

    setCategories(newCategories);
    setProducts(nextProducts);

    if (selectedCategory === categoryToDelete) {
      setSelectedCategory('Tutti');
    }

    await persistState(nextProducts, newCategories);
    resolveCategoryDelete(true);
  };

  if (isLoadingProducts) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-[#F9FAFB] text-slate-900'}`}>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <Server size={18} />
          {t('loadingLocalLaterbase')}
        </div>
      </div>
    );
  }

  if (!isPublicView && !authUser) {
    return (
      <SelfHostedLogin
        isDarkMode={isDarkMode}
        onLogin={handleLogin}
        language={language}
        onLanguageChange={setLanguage}
        t={t}
        formatCurrency={formatCurrency}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-[#F9FAFB] text-slate-900'} font-sans selection:bg-slate-200 dark:selection:bg-zinc-800`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {isPublicView ? t('publicTitle') : t('appTitle')}
              </h1>
              <p className={`${isDarkMode ? 'text-zinc-500' : 'text-slate-500'} mt-1`}>
                {isPublicView ? t('publicSubtitle') : t('appSubtitle')}
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
                  placeholder={t('search')}
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

              <div
                className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${storageError
                  ? 'bg-rose-500/10 text-rose-500'
                  : isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                  }`}
                title={storageError ? storageError : t('localVolumeTitle')}
              >
                <Server size={14} />
                <span>{storageError ? t('storageOffline') : t('storageOnline')}</span>
              </div>

              <LanguageSelector
                language={language}
                onChange={setLanguage}
                isDarkMode={isDarkMode}
                compact
                label={t('language')}
              />

              <button
                onClick={() => setShowPrivacyModal(true)}
                className={`p-2.5 rounded-full transition-all ${isDarkMode ? 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800' : 'bg-white border border-slate-100 shadow-sm text-slate-500 hover:text-slate-900'}`}
                title={t('privacyModal.title')}
              >
                <ShieldCheck size={20} />
              </button>

              <button
                onClick={() => setShowAccountModal(true)}
                className={`p-2.5 rounded-full transition-all ${isDarkMode ? 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800' : 'bg-white border border-slate-100 shadow-sm text-slate-500 hover:text-slate-900'}`}
                title={authUser?.email || t('account')}
              >
                <UserCircle size={20} />
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className={`px-4 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 shadow-sm active:scale-95 whitespace-nowrap ${isDarkMode ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                title={t('importList.openTitle')}
              >
                <Upload size={18} />
                <span className="hidden sm:inline">{t('importList.open')}</span>
              </button>

              <button
                onClick={() => setShowForm(true)}
                className={`px-5 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 shadow-sm active:scale-95 whitespace-nowrap ${isDarkMode ? 'bg-white text-zinc-950 hover:bg-zinc-100' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
              >
                <Plus size={18} />
                <span className="hidden sm:inline">{t('newProduct')}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = window.location.pathname}
                className={`px-5 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 shadow-sm active:scale-95 whitespace-nowrap ${isDarkMode ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-white border border-slate-100 text-slate-900 hover:bg-slate-50'
                  }`}
              >
                {t('createLaterbase')}
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
          onLaterbaseClick={() => setAnalysisMode('wishlist')}
          onCountClick={() => setShowLaterbaseRecap(true)}
          isPublicView={isPublicView}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          t={t}
          formatCurrency={formatCurrency}
          currencyCode={currencyMeta.code}
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
              readOnly={isPublicView}
              isDarkMode={isDarkMode}
              t={t}
              getCategoryLabel={getCategoryLabel}
            />

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 px-2 shrink-0">
              {!isPublicView && (
                <>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`border-none text-xs font-bold uppercase tracking-wider py-2.5 pl-3 pr-8 rounded-xl focus:ring-0 cursor-pointer transition-colors appearance-none w-full md:w-auto ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${isDarkMode ? 'white' : 'black'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }}
                  >
                    <option value="recent">{t('sort.recent')}</option>
                    <option value="manual">{t('sort.manual')}</option>
                    <option value="best_deal">{t('sort.bestDeal')}</option>
                    <option value="priority">{t('sort.priority')}</option>
                    <option value="price-asc">{t('sort.priceAsc')}</option>
                    <option value="price-desc">{t('sort.priceDesc')}</option>
                  </select>

                  <div className={`w-px h-6 hidden md:block shrink-0 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`}></div>

                  <div className="flex flex-row items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={refreshLaterbasePrices}
                      disabled={isBulkRefreshingPrices}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${isBulkRefreshingPrices
                        ? (isDarkMode ? 'text-zinc-700 bg-zinc-900 cursor-not-allowed' : 'text-slate-300 bg-slate-100 cursor-not-allowed')
                        : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')
                        }`}
                      title={t('bulkPriceRefreshTitle')}
                    >
                      <RefreshCw size={16} className={isBulkRefreshingPrices ? 'animate-spin' : ''} />
                      <span className="hidden sm:inline">{isBulkRefreshingPrices ? t('bulkPriceRefreshing') : t('bulkPriceRefresh')}</span>
                      <span className="sm:hidden">{t('bulkPriceRefreshShort')}</span>
                    </button>

                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${showHistory
                        ? (isDarkMode ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'bg-slate-900 text-white shadow-sm')
                        : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100')
                        }`}
                    >
                      <History size={16} />
                      <span className="hidden sm:inline">{showHistory ? t('history.exit') : t('history.view')}</span>
                      <span className="sm:hidden">{showHistory ? t('history.exitShort') : t('history.short')}</span>
                    </button>

                    <button
                      onClick={() => setShowArchive(true)}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${showArchive
                        ? (isDarkMode ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'bg-slate-900 text-white shadow-sm')
                        : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100')
                        }`}
                    >
                      <Package size={16} />
                      <span className="hidden sm:inline">{t('archive.view')}</span>
                      <span className="sm:hidden">{t('archive.short')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold group flex items-center gap-2">
                {showHistory ? t('history.title') : selectedCategory === 'Tutti' ? t('activeLaterbase') : t('categoryTitle').replace('{category}', getCategoryLabel(selectedCategory))}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-slate-100 text-slate-500'}`}>{filteredProducts.length}</span>
              </h2>
              {showHistory && (
                <button
                  onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
                  className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-slate-100 text-slate-400'}`}
                  title={isHistoryCollapsed ? t('expand') : t('collapse')}
                >
                  {isHistoryCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>
              )}
            </div>

            {!showHistory ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                {!isPublicView && (
                  <button
                    onClick={() => setShowExportModal(true)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isDarkMode ? 'text-zinc-500 hover:text-white hover:bg-zinc-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    title={t('exportReadOnlyTitle')}
                  >
                    <Download size={14} />
                    <span>{t('exportReadOnly')}</span>
                  </button>
                )}
                <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{t('totalLabel').replace('{target}', selectedCategory === 'Tutti' ? t('wishlistName') : getCategoryLabel(selectedCategory))}</span>
                  <span className="text-lg font-bold">{formatCurrency(categoryRecapValue)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest mr-2 ${isDarkMode ? 'text-zinc-600' : 'text-slate-400'}`}>{t('history.filterPeriod')}</span>
                <div className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                  {[
                    { id: 'month', label: t('history.month') },
                    { id: '3months', label: t('history.threeMonths') },
                    { id: 'all', label: t('history.all') }
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
            {!showHistory && !isPublicView ? (
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
                        allowExternalImages={allowExternalImages}
                        t={t}
                        getCategoryLabel={getCategoryLabel}
                        formatCurrency={formatCurrency}
                        settings={settings}
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
                      onToggleArchive={toggleArchive}
                      onDelete={deleteProduct}
                      onEdit={(p) => setEditingProduct(p)}
                      onShowToast={showToast}
                      onCheckPrice={(p) => setActiveProductForPriceUpdate(p)}
                      isDarkMode={isDarkMode}
                      isPublicView={isPublicView}
                      allowExternalImages={allowExternalImages}
                      t={t}
                      getCategoryLabel={getCategoryLabel}
                      formatCurrency={formatCurrency}
                      settings={settings}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isDarkMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-700' : 'bg-slate-100 text-slate-400'}`}>
                      <Package size={24} />
                    </div>
                    <div className="max-w-xs mx-auto">
                      <h3 className="font-semibold">{t('empty.noPurchases')}</h3>
                      <p className={`${isDarkMode ? 'text-zinc-500' : 'text-slate-500'} text-sm mt-1`}>{t('empty.checkFilters')}</p>
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
          draftData={draftProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null); setDraftProduct(null); }}
          onSubmit={(p) => {
            if (editingProduct) {
              updateProduct({ ...editingProduct, ...p });
            } else {
              addProduct(p);
              setShowForm(false);
              setDraftProduct(null);
            }
          }}
          categories={categories}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
          isDarkMode={isDarkMode}
          t={t}
          getCategoryLabel={getCategoryLabel}
          currencyCode={currencyMeta.code}
          formatCurrency={formatCurrency}
          onShowToast={showToast}
        />
      )}

      {analysisMode && (
        <BudgetAnalysisModal
          onClose={() => setAnalysisMode(null)}
          products={products}
          categories={categories}
          isDarkMode={isDarkMode}
          initialMode={analysisMode}
          t={t}
          getCategoryLabel={getCategoryLabel}
          formatCurrency={formatCurrency}
        />
      )}

      {showLaterbaseRecap && (
        <LaterbaseRecapModal
          onClose={() => setShowLaterbaseRecap(false)}
          products={products}
          isDarkMode={isDarkMode}
          onNavigate={handleScrollToProduct}
          t={t}
          getCategoryLabel={getCategoryLabel}
          formatCurrency={formatCurrency}
        />
      )}

      {showArchive && (
        <ArchiveModal
          onClose={() => setShowArchive(false)}
          products={products}
          isDarkMode={isDarkMode}
          onToggleArchive={toggleArchive}
          t={t}
          getCategoryLabel={getCategoryLabel}
          formatCurrency={formatCurrency}
        />
      )}

      {activeProductForPriceUpdate && (
        <PriceUpdateModal
          isOpen={!!activeProductForPriceUpdate}
          onClose={() => setActiveProductForPriceUpdate(null)}
          onSave={updateProductPrice}
          product={activeProductForPriceUpdate}
          isDarkMode={isDarkMode}
          t={t}
          currencyCode={currencyMeta.code}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDeleteProduct}
        productName={productToDelete?.name}
        isDarkMode={isDarkMode}
        t={t}
      />

      <DeleteConfirmModal
        isOpen={!!categoryToDelete}
        onClose={() => resolveCategoryDelete(false)}
        onConfirm={confirmDeleteCategory}
        title={categoryToDelete ? t('deleteCategory').replace('{category}', getCategoryLabel(categoryToDelete)) : ''}
        message={categoryToDelete ? t('categoryDeleteConfirm')
          .replace('{category}', getCategoryLabel(categoryToDelete))
          .replace('{fallback}', getCategoryLabel(OTHER_CATEGORY)) : ''}
        isDarkMode={isDarkMode}
        t={t}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={exportReadOnlyLaterbase}
        isDarkMode={isDarkMode}
        t={t}
      />

      <ImportWishlistModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={addImportedProducts}
        categories={categories}
        existingProducts={products}
        isDarkMode={isDarkMode}
        allowExternalImages={allowExternalImages}
        t={t}
        getCategoryLabel={getCategoryLabel}
        formatCurrency={formatCurrency}
      />

      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onLogout={handleLogout}
        onSave={handleAccountSave}
        user={authUser}
        isDarkMode={isDarkMode}
        allowExternalImages={allowExternalImages}
        onToggleExternalImages={setAllowExternalImages}
        onExportData={exportDataBackup}
        onImportData={importDataBackup}
        onCopyQuickAdd={copyQuickAddBookmarklet}
        onOpenPrivacy={() => {
          setShowAccountModal(false);
          setShowPrivacyModal(true);
        }}
        t={t}
      />

      <AboutPrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        isDarkMode={isDarkMode}
        t={t}
      />

      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={closeOnboarding}
        onOpenAccount={() => setShowAccountModal(true)}
        onOpenPrivacy={() => setShowPrivacyModal(true)}
        isDarkMode={isDarkMode}
        t={t}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${isDarkMode ? 'bg-zinc-900/90 text-white border-zinc-800' : 'bg-white/90 text-slate-900 border-slate-100'
            }`}>
            <div className={`${toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'} rounded-full p-1`}>
              {toast.type === 'error' ? (
                <X size={14} className="text-white" />
              ) : (
                <Check size={14} className="text-white" />
              )}
            </div>
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
