import { createServer } from 'node:http';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'dist');
const dataDir = process.env.LATERBASE_DATA_DIR || process.env.WISHLIST_DATA_DIR || path.join(rootDir, 'data');
const dataFile = path.join(dataDir, 'laterbase.json');
const legacyDataFile = path.join(dataDir, 'wishlist.json');
const authFile = path.join(dataDir, 'auth.json');
const sessionsFile = path.join(dataDir, 'sessions.json');
const port = Number(process.env.PORT || 8080);
const sessionCookie = 'laterbase_session';
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;
const maxBodyBytes = 1024 * 1024;
const secureCookies = process.env.LATERBASE_SECURE_COOKIES === 'true' ||
  process.env.WISHLIST_SECURE_COOKIES === 'true' ||
  process.env.SECURE_COOKIES === 'true';
const loginAttempts = new Map();
const loginWindowMs = 15 * 60 * 1000;
const loginMaxAttempts = 10;

const defaultState = {
  products: [],
  categories: ['Elettronica', 'Casa', 'Abbigliamento', 'Regali'],
  settings: {
    monthlyBudget: 0,
    savingsFund: 0,
    extraInfoEnabled: { total: true, spent: true, count: true },
  },
};

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: http: https:",
    "connect-src 'self'",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
};

const sendJson = (res, status, body) => {
  res.writeHead(status, {
    ...securityHeaders,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
};

const readBody = async (req) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      throw new Error('Request body is too large');
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
};

const timingSafeEqual = (a, b) => {
  const first = Buffer.from(a);
  const second = Buffer.from(b);
  return first.length === second.length && crypto.timingSafeEqual(first, second);
};

const scrypt = (password, salt) => new Promise((resolve, reject) => {
  crypto.scrypt(password, salt, 64, (error, derivedKey) => {
    if (error) reject(error);
    else resolve(derivedKey.toString('hex'));
  });
});

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return {
    algorithm: 'scrypt',
    salt,
    hash: await scrypt(password, salt),
  };
};

const verifyPassword = async (password, passwordRecord) => {
  if (!passwordRecord?.salt || !passwordRecord?.hash) return false;
  const hash = await scrypt(password, passwordRecord.salt);
  return timingSafeEqual(hash, passwordRecord.hash);
};

const readJsonFile = async (filePath, fallback = null) => {
  try {
    return JSON.parse(await readFile(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
};

const writeJsonFile = async (filePath, data) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmpFile = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmpFile, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
  await rename(tmpFile, filePath);
};

const generatePassword = () => crypto.randomBytes(18).toString('base64url');

const ensureAuthFile = async () => {
  await mkdir(dataDir, { recursive: true });
  const existingAuth = await readJsonFile(authFile);
  if (existingAuth?.admin?.email && existingAuth?.admin?.password) {
    return existingAuth;
  }

  const envEmail = process.env.ADMIN_EMAIL?.trim();
  const envPassword = process.env.ADMIN_PASSWORD;
  const email = envEmail || 'admin@laterbase.local';
  const password = envPassword || generatePassword();
  if (envPassword && envPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters long.');
  }
  const auth = {
    admin: {
      email,
      password: await hashPassword(password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  await writeJsonFile(authFile, auth);

  console.log('Initial admin account created.');
  console.log(`Email: ${email}`);
  if (envPassword) {
    console.log('Password: set from ADMIN_PASSWORD');
  } else {
    console.log(`Generated password: ${password}`);
    console.log('Save it now. You can change it after login from the Account screen.');
  }

  return auth;
};

const readAuth = async () => {
  await ensureAuthFile();
  return readJsonFile(authFile);
};

const writeAuth = async (auth) => writeJsonFile(authFile, auth);

const parseCookies = (req) => {
  const cookieHeader = req.headers.cookie || '';
  return Object.fromEntries(cookieHeader.split(';').map((cookie) => {
    const [name, ...valueParts] = cookie.trim().split('=');
    return [name, decodeURIComponent(valueParts.join('='))];
  }).filter(([name]) => name));
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const readSessions = async () => readJsonFile(sessionsFile, { sessions: [] });

const writeSessions = async (sessions) => writeJsonFile(sessionsFile, sessions);

const pruneSessions = (sessions) => ({
  sessions: (sessions.sessions || []).filter((session) => session.exp > Date.now()),
});

const createSessionToken = async (email) => {
  const token = crypto.randomBytes(32).toString('base64url');
  const sessions = pruneSessions(await readSessions());
  sessions.sessions.push({
    tokenHash: hashToken(token),
    email,
    exp: Date.now() + sessionMaxAgeSeconds * 1000,
    createdAt: new Date().toISOString(),
  });
  await writeSessions(sessions);
  return token;
};

const verifySessionToken = async (token) => {
  if (!token) return null;
  const sessions = pruneSessions(await readSessions());
  const session = sessions.sessions.find((item) => item.tokenHash === hashToken(token));
  if (!session) {
    await writeSessions(sessions);
    return null;
  }
  return session;
};

const getSession = async (req) => {
  const cookies = parseCookies(req);
  const session = await verifySessionToken(cookies[sessionCookie]);
  if (!session) return null;

  const auth = await readAuth();
  if (auth?.admin?.email !== session.email) return null;
  return { email: session.email };
};

const setSessionCookie = (res, token) => {
  const secureFlag = secureCookies ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionMaxAgeSeconds}${secureFlag}`);
};

const clearSessionCookie = (res) => {
  const secureFlag = secureCookies ? '; Secure' : '';
  res.setHeader('Set-Cookie', [
    `${sessionCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureFlag}`,
    `wishlist_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureFlag}`,
    `id=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureFlag}`,
  ]);
};

const destroySession = async (req) => {
  const token = parseCookies(req)[sessionCookie];
  if (!token) return;
  const sessions = pruneSessions(await readSessions());
  const tokenHash = hashToken(token);
  await writeSessions({
    sessions: sessions.sessions.filter((session) => session.tokenHash !== tokenHash),
  });
};

const requireSession = async (req, res) => {
  const session = await getSession(req);
  if (!session) {
    sendJson(res, 401, { error: 'Accesso richiesto' });
    return null;
  }
  return session;
};

const ensureDataFile = async () => {
  await mkdir(dataDir, { recursive: true });
  try {
    await stat(dataFile);
  } catch {
    try {
      await stat(legacyDataFile);
      await rename(legacyDataFile, dataFile);
      console.log(`Migrated legacy data file from ${legacyDataFile} to ${dataFile}`);
    } catch {
      await writeState(defaultState);
    }
  }
};

const normalizePriceHistory = (history) => (
  Array.isArray(history)
    ? history
      .map((entry) => ({
        date: entry?.date || new Date().toISOString(),
        price: Number(entry?.price),
        source: String(entry?.source || 'manual').slice(0, 40),
      }))
      .filter((entry) => Number.isFinite(entry.price) && entry.price >= 0)
      .slice(-80)
    : []
);

const normalizeProduct = (product) => {
  const price = Number(product.price) || 0;
  const createdAt = product.createdAt || new Date().toISOString();
  const priceHistory = normalizePriceHistory(product.priceHistory);

  if (priceHistory.length === 0 && price > 0) {
    priceHistory.push({
      date: createdAt,
      price,
      source: 'initial',
    });
  }

  return {
    id: product.id || crypto.randomUUID(),
    name: String(product.name || '').trim(),
    price,
    initialPrice: Number(product.initialPrice || price) || 0,
    priceHistory,
    category: String(product.category || 'Altro').trim() || 'Altro',
    url: product.url || '',
    imageUrl: product.imageUrl || '',
    targetPrice: product.targetPrice === null || product.targetPrice === '' || product.targetPrice === undefined
      ? null
      : Number(product.targetPrice),
    priority: String(product.priority || '2'),
    notes: product.notes || '',
    publicNote: String(product.publicNote || '').slice(0, 500),
    isGiftIdea: Boolean(product.isGiftIdea),
    isPurchased: Boolean(product.isPurchased),
    isArchived: Boolean(product.isArchived),
    purchaseDate: product.purchaseDate || null,
    createdAt,
    lastChecked: product.lastChecked || null,
  };
};

const normalizeSettings = (settings = {}) => ({
  monthlyBudget: Number(settings.monthlyBudget) || 0,
  savingsFund: Number(settings.savingsFund) || 0,
  extraInfoEnabled: {
    total: settings.extraInfoEnabled?.total !== false,
    spent: settings.extraInfoEnabled?.spent !== false,
    count: settings.extraInfoEnabled?.count !== false,
  },
});

const normalizeState = (state) => {
  const products = Array.isArray(state.products)
    ? state.products.map(normalizeProduct).filter((product) => product.name)
    : [];
  const categorySet = new Set(
    (Array.isArray(state.categories) ? state.categories : defaultState.categories)
      .map((category) => String(category || '').trim())
      .filter(Boolean)
  );

  products.forEach((product) => {
    if (product.category) categorySet.add(product.category);
  });

  return {
    products,
    categories: Array.from(categorySet),
    settings: normalizeSettings(state.settings || defaultState.settings),
    updatedAt: new Date().toISOString(),
  };
};

const isUnsafeMethod = (method) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

const getTargetOrigin = (req) => {
  const protocol = (req.headers['x-forwarded-proto'] || 'http').toString().split(',')[0].trim();
  return `${protocol}://${req.headers.host || 'localhost'}`;
};

const hasValidOrigin = (req) => {
  if (!isUnsafeMethod(req.method)) return true;
  const source = req.headers.origin || req.headers.referer;
  if (!source) return true;

  try {
    const sourceUrl = new URL(source);
    const targetUrl = new URL(getTargetOrigin(req));
    return sourceUrl.protocol === targetUrl.protocol && sourceUrl.host === targetUrl.host;
  } catch {
    return false;
  }
};

const registerFailedLogin = (key) => {
  const now = Date.now();
  const current = loginAttempts.get(key) || [];
  const attempts = current.filter((timestamp) => timestamp > now - loginWindowMs);
  attempts.push(now);
  loginAttempts.set(key, attempts);
};

const isLoginRateLimited = (key) => {
  const now = Date.now();
  const attempts = (loginAttempts.get(key) || []).filter((timestamp) => timestamp > now - loginWindowMs);
  loginAttempts.set(key, attempts);
  return attempts.length >= loginMaxAttempts;
};

const clearLoginAttempts = (key) => {
  loginAttempts.delete(key);
};

const productPreviewMaxBytes = 1_500_000;
const productPreviewTimeoutMs = 9000;
const wishlistImportMaxItems = 60;

const decodeHtmlEntities = (value = '') => String(value)
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&apos;/g, "'")
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&#(x?[0-9a-f]+);/gi, (_, code) => {
    const radix = code.toLowerCase().startsWith('x') ? 16 : 10;
    const number = parseInt(code.replace(/^x/i, ''), radix);
    return Number.isFinite(number) ? String.fromCodePoint(number) : _;
  });

const stripTags = (value = '') => decodeHtmlEntities(String(value).replace(/<[^>]*>/g, ' '));

const normalizeText = (value = '') => stripTags(value)
  .replace(/\s+/g, ' ')
  .replace(/\s+([,.;:!?])/g, '$1')
  .trim();

const parseAttributes = (tag = '') => {
  const attributes = {};
  const attrRegex = /([^\s=/"'>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let match;
  while ((match = attrRegex.exec(tag))) {
    attributes[match[1].toLowerCase()] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
};

const getMetaContent = (html, keys) => {
  const wanted = new Set(keys.map((key) => key.toLowerCase()));
  const metaRegex = /<meta\b[^>]*>/gi;
  let match;
  while ((match = metaRegex.exec(html))) {
    const attrs = parseAttributes(match[0]);
    const key = (attrs.property || attrs.name || attrs.itemprop || '').toLowerCase();
    if (wanted.has(key) && attrs.content) return normalizeText(attrs.content);
  }
  return '';
};

const getElementTextById = (html, id) => {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`<[^>]+id=["']${escapedId}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i');
  const match = html.match(regex);
  return match ? normalizeText(match[1]) : '';
};

const collectJsonLdProducts = (node, products = []) => {
  if (!node) return products;
  if (Array.isArray(node)) {
    node.forEach((item) => collectJsonLdProducts(item, products));
    return products;
  }
  if (typeof node !== 'object') return products;

  const rawType = node['@type'];
  const types = Array.isArray(rawType) ? rawType : [rawType];
  if (types.some((type) => String(type || '').toLowerCase() === 'product')) {
    products.push(node);
  }

  if (node['@graph']) collectJsonLdProducts(node['@graph'], products);
  return products;
};

const parseJsonLdProducts = (html) => {
  const products = [];
  const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html))) {
    try {
      const json = JSON.parse(decodeHtmlEntities(match[1]).trim());
      collectJsonLdProducts(json, products);
    } catch {
      // Ignore invalid embedded JSON-LD and continue with other fallbacks.
    }
  }
  return products;
};

const firstString = (...values) => values
  .flat(Infinity)
  .map((value) => {
    if (typeof value === 'string') return normalizeText(value);
    if (value && typeof value === 'object') return normalizeText(value.url || value.contentUrl || value.name || '');
    return '';
  })
  .find(Boolean) || '';

const pickOffer = (offers) => {
  const list = Array.isArray(offers) ? offers : [offers];
  return list.find(Boolean) || {};
};

const parsePrice = (rawValue) => {
  if (rawValue === undefined || rawValue === null || rawValue === '') return null;
  if (typeof rawValue === 'number') return Number.isFinite(rawValue) ? rawValue : null;

  const raw = String(rawValue).replace(/\s/g, '');
  const numeric = raw.replace(/[^\d.,-]/g, '');
  if (!numeric) return null;

  const lastComma = numeric.lastIndexOf(',');
  const lastDot = numeric.lastIndexOf('.');
  let normalized = numeric;

  if (lastComma > -1 && lastDot > -1) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = numeric
      .replaceAll(thousandsSeparator, '')
      .replace(decimalSeparator, '.');
  } else if (lastComma > -1) {
    const decimals = numeric.length - lastComma - 1;
    normalized = decimals > 0 && decimals <= 2 ? numeric.replace(',', '.') : numeric.replaceAll(',', '');
  } else if (lastDot > -1) {
    const decimals = numeric.length - lastDot - 1;
    normalized = decimals > 0 && decimals <= 2 ? numeric : numeric.replaceAll('.', '');
  }

  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
};

const absoluteUrl = (value, baseUrl) => {
  if (!value) return '';
  try {
    return new URL(decodeHtmlEntities(value), baseUrl).toString();
  } catch {
    return '';
  }
};

const inferCategory = (title = '', rawCategory = '') => {
  const text = `${title} ${rawCategory}`.toLowerCase();
  if (/(iphone|ipad|macbook|apple|smartphone|telefono|phone|tablet|laptop|pc|computer|monitor|tv|headphone|cuffie|auricolari|camera|fotocamera|console|playstation|xbox|steam deck|kindle)/i.test(text)) {
    return 'Elettronica';
  }
  if (/(casa|home|kitchen|cucina|garden|giardino|lamp|lampada|chair|sedia|table|tavolo|desk|scrivania|sofa|divano|bed|letto|mattress|materasso|vacuum|aspirapolvere|furniture|arredo)/i.test(text)) {
    return 'Casa';
  }
  if (/(shirt|t-shirt|maglia|felpa|hoodie|dress|vestito|pants|pantaloni|jeans|scarpe|shoes|sneaker|jacket|giacca|coat|cappotto|abbigliamento|clothing|fashion)/i.test(text)) {
    return 'Abbigliamento';
  }
  if (/(gift|regalo|birthday|compleanno|christmas|natale)/i.test(text)) {
    return 'Regali';
  }
  return 'Altro';
};

const isPrivateAddress = (address) => {
  if (!address) return true;

  if (address.includes(':')) {
    const normalized = address.toLowerCase();
    const mappedIpv4 = normalized.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
    if (mappedIpv4) return isPrivateAddress(mappedIpv4);

    return normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:');
  }

  const parts = address.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = parts;
  return a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224;
};

const validateExternalProductUrl = async (rawUrl) => {
  if (typeof rawUrl !== 'string' || rawUrl.length > 2048) {
    throw new Error('Link prodotto non valido');
  }

  const url = new URL(rawUrl.trim());
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Sono supportati solo link http o https');
  }
  if (url.username || url.password) {
    throw new Error('Link prodotto non valido');
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || (isIP(hostname) && isPrivateAddress(hostname))) {
    throw new Error('Questo link punta a una rete privata e non puo essere letto');
  }

  const records = isIP(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true, verbatim: true });
  if (records.length === 0 || records.some((record) => isPrivateAddress(record.address))) {
    throw new Error('Questo link punta a una rete privata e non puo essere letto');
  }

  return url;
};

const cleanStoredProductUrl = (url) => {
  const cleanUrl = new URL(url.toString());
  if (/amazon\./i.test(cleanUrl.hostname)) {
    const asinMatch = cleanUrl.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (asinMatch) {
      cleanUrl.pathname = `/dp/${asinMatch[1]}`;
      cleanUrl.search = '';
      cleanUrl.hash = '';
      return cleanUrl.toString();
    }
  }
  cleanUrl.hash = '';
  return cleanUrl.toString();
};

const isAmazonHost = (hostname = '') => /^(?:www\.|smile\.)?amazon\.[a-z]{2,3}(?:\.[a-z]{2})?$/i.test(hostname);

const validateAmazonWishlistUrl = async (rawUrl) => {
  const url = await validateExternalProductUrl(rawUrl);
  if (!isAmazonHost(url.hostname)) {
    throw new Error('Only public Amazon wishlist links are supported right now');
  }
  if (!/^\/hz\/wishlist\/ls\//i.test(url.pathname)) {
    throw new Error('Paste a public Amazon wishlist sharing link');
  }
  return url;
};

const readLimitedText = async (response) => {
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > productPreviewMaxBytes) {
    throw new Error('Pagina prodotto troppo grande');
  }

  let size = 0;
  let text = '';
  const decoder = new TextDecoder('utf-8');

  for await (const chunk of response.body) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > productPreviewMaxBytes) {
      throw new Error('Pagina prodotto troppo grande');
    }
    text += decoder.decode(buffer, { stream: true });
  }
  text += decoder.decode();
  return text;
};

const fetchProductHtml = async (initialUrl, redirects = 0) => {
  if (redirects > 3) throw new Error('Troppi redirect sul link prodotto');
  const url = await validateExternalProductUrl(initialUrl.toString());

  const response = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(productPreviewTimeoutMs),
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36 LaterbaseSelfHosted/1.0',
    },
  });

  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get('location');
    if (!location) throw new Error('Redirect prodotto non valido');
    return fetchProductHtml(new URL(location, url), redirects + 1);
  }

  if (!response.ok) {
    throw new Error('Non riesco a leggere la pagina prodotto');
  }

  return {
    finalUrl: url,
    html: await readLimitedText(response),
  };
};

const extractProductPreview = (html, finalUrl) => {
  const products = parseJsonLdProducts(html);
  const product = products[0] || {};
  const offer = pickOffer(product.offers);
  const title = firstString(
    product.name,
    getMetaContent(html, ['og:title', 'twitter:title']),
    getElementTextById(html, 'productTitle'),
    html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1],
    html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1],
  ).replace(/\s*[:|-]\s*Amazon\..*$/i, '');

  const rawImage = firstString(
    product.image,
    getMetaContent(html, ['og:image', 'twitter:image', 'image']),
    html.match(/id=["']landingImage["'][^>]+(?:data-old-hires|src)=["']([^"']+)["']/i)?.[1],
  );

  const rawCategory = firstString(
    product.category,
    getMetaContent(html, ['product:category']),
    html.match(/id=["']wayfinding-breadcrumbs_container["'][^>]*>([\s\S]*?)<\/[^>]+>/i)?.[1],
  );

  const priceSource = offer.price ??
    (
      getMetaContent(html, ['product:price:amount', 'og:price:amount']) ||
      html.match(/class=["'][^"']*a-offscreen[^"']*["'][^>]*>([^<]*(?:€|\$|£|¥)[^<]*)</i)?.[1] ||
      getElementTextById(html, 'priceblock_ourprice') ||
      getElementTextById(html, 'priceblock_dealprice') ||
      getElementTextById(html, 'priceblock_saleprice')
    );
  const price = parsePrice(priceSource);

  const preview = {
    name: title,
    price,
    category: inferCategory(title, rawCategory),
    imageUrl: absoluteUrl(rawImage, finalUrl),
    url: cleanStoredProductUrl(finalUrl),
  };

  if (!preview.name && preview.price === null && !preview.imageUrl) {
    throw new Error('Non ho trovato dati prodotto leggibili in questa pagina');
  }

  return preview;
};

const getElementTextByPattern = (html, pattern) => {
  const match = html.match(pattern);
  return match ? normalizeText(match[1]) : '';
};

const getAttributeByPattern = (html, pattern, attributeName) => {
  const match = html.match(pattern);
  if (!match) return '';
  const attrs = parseAttributes(match[0]);
  return attrs[attributeName.toLowerCase()] || '';
};

const splitAmazonWishlistItems = (html) => {
  const items = [];
  const itemRegex = /<li\b[^>]*class=["'][^"']*g-item-sortable[^"']*["'][^>]*>[\s\S]*?(?=<li\b[^>]*class=["'][^"']*g-item-sortable|<\/ul>)/gi;
  let match;
  while ((match = itemRegex.exec(html)) && items.length < wishlistImportMaxItems) {
    items.push(match[0]);
  }
  return items;
};

const extractAmazonWishlistProduct = (block, baseUrl) => {
  const asin = firstString(
    block.match(/ASIN:([A-Z0-9]{10})/i)?.[1],
    block.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1],
    block.match(/data-csa-c-item-id=["']([A-Z0-9]{10})["']/i)?.[1],
  ).toUpperCase();

  const nameAnchorPattern = /<a\b[^>]*(?:id=["']itemName_[^"']+["'][^>]*|title=["'][^"']+["'][^>]*)href=["'][^"']*\/(?:dp|gp\/product)\/[A-Z0-9]{10}[^"']*["'][^>]*>[\s\S]*?<\/a>/i;
  const imageTagPattern = /<img\b[^>]+src=["']https?:\/\/(?:m\.media-amazon|images-na\.ssl-images-amazon)\.com\/images\/I\/[^"']+["'][^>]*>/i;
  const imageTag = block.match(imageTagPattern)?.[0] || '';
  const imageAttrs = parseAttributes(imageTag);
  const name = firstString(
    getElementTextByPattern(block, /<a\b[^>]*id=["']itemName_[^"']+["'][^>]*>([\s\S]*?)<\/a>/i),
    getAttributeByPattern(block, nameAnchorPattern, 'title'),
    imageAttrs.alt,
  );

  const href = firstString(
    getAttributeByPattern(block, nameAnchorPattern, 'href'),
    block.match(/href=["']([^"']*\/(?:dp|gp\/product)\/[A-Z0-9]{10}[^"']*)["']/i)?.[1],
  );

  const imageUrl = absoluteUrl(imageAttrs.src || '', baseUrl);
  const byline = getElementTextByPattern(block, /<span\b[^>]*id=["']item-byline-[^"']+["'][^>]*>([\s\S]*?)<\/span>/i);
  const rawCategory = firstString(
    byline.match(/\(([^)]+)\)/)?.[1],
    block.match(/data-category=["']([^"']+)["']/i)?.[1],
  );
  const dataPrice = parseAttributes(block.match(/<li\b[^>]*class=["'][^"']*g-item-sortable[^"']*["'][^>]*>/i)?.[0] || '')['data-price'];
  const priceText = firstString(
    dataPrice,
    block.match(/id=["']itemPrice_[^"']+["'][^>]*>[\s\S]*?<span\b[^>]*class=["'][^"']*a-offscreen[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1],
    block.match(/<span\b[^>]*class=["'][^"']*a-offscreen[^"']*["'][^>]*>([^<]*(?:€|\$|£|¥)[^<]*)<\/span>/i)?.[1],
  );
  const price = parsePrice(priceText);

  if (!name || (!asin && !href && !imageUrl)) return null;

  const productUrl = href ? cleanStoredProductUrl(new URL(decodeHtmlEntities(href), baseUrl)) : '';
  return {
    source: 'amazon-wishlist',
    externalId: asin || productUrl || name,
    name,
    price,
    category: inferCategory(name, rawCategory || byline),
    url: productUrl,
    imageUrl,
    priority: '2',
    notes: '',
    publicNote: '',
  };
};

const extractAmazonWishlistProducts = (html, finalUrl) => {
  const products = splitAmazonWishlistItems(html)
    .map((block) => extractAmazonWishlistProduct(block, finalUrl))
    .filter(Boolean);
  const seen = new Set();
  const uniqueProducts = products.filter((product) => {
    const key = product.externalId || product.url || product.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (!uniqueProducts.length) {
    throw new Error('No readable products found in this Amazon wishlist');
  }

  return {
    source: 'amazon-wishlist',
    count: uniqueProducts.length,
    products: uniqueProducts,
  };
};

const readState = async () => {
  await ensureDataFile();
  const raw = await readFile(dataFile, 'utf-8');
  return normalizeState(JSON.parse(raw));
};

async function writeState(state) {
  await mkdir(dataDir, { recursive: true });
  const normalized = normalizeState(state);
  const tmpFile = `${dataFile}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmpFile, `${JSON.stringify(normalized, null, 2)}\n`, 'utf-8');
  await rename(tmpFile, dataFile);
  return normalized;
}

const handleApi = async (req, res) => {
  if (req.url?.startsWith('/api/') && !hasValidOrigin(req)) {
    sendJson(res, 403, { error: 'Origine richiesta non valida' });
    return true;
  }

  if (req.url === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (req.url === '/api/auth/me' && req.method === 'GET') {
    const session = await getSession(req);
    sendJson(res, 200, {
      authenticated: Boolean(session),
      user: session ? { email: session.email } : null,
    });
    return true;
  }

  if (req.url === '/api/auth/login' && req.method === 'POST') {
    const { email, password } = await readBody(req);
    const auth = await readAuth();
    const emailInput = String(email || '').trim().toLowerCase();
    const passwordInput = String(password || '');
    const loginKey = `${req.socket.remoteAddress || 'local'}:${emailInput}`;

    if (isLoginRateLimited(loginKey)) {
      sendJson(res, 429, { error: 'Troppi tentativi. Riprova tra qualche minuto.' });
      return true;
    }

    const emailMatches = emailInput === auth.admin.email.toLowerCase();
    const passwordMatches = await verifyPassword(passwordInput, auth.admin.password);

    if (!emailMatches || !passwordMatches) {
      registerFailedLogin(loginKey);
      sendJson(res, 401, { error: 'Email o password non valide' });
      return true;
    }

    clearLoginAttempts(loginKey);
    const token = await createSessionToken(auth.admin.email);
    setSessionCookie(res, token);
    sendJson(res, 200, { user: { email: auth.admin.email } });
    return true;
  }

  if (req.url === '/api/auth/logout' && req.method === 'POST') {
    await destroySession(req);
    clearSessionCookie(res);
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (req.url === '/api/auth/account' && req.method === 'PUT') {
    const session = await requireSession(req, res);
    if (!session) return true;

    const { email, currentPassword, newPassword } = await readBody(req);
    const auth = await readAuth();

    if (!(await verifyPassword(String(currentPassword || ''), auth.admin.password))) {
      sendJson(res, 400, { error: 'Current password is not valid' });
      return true;
    }

    const nextEmail = String(email || auth.admin.email).trim();
    if (!nextEmail || !nextEmail.includes('@')) {
      sendJson(res, 400, { error: 'Enter a valid email address' });
      return true;
    }

    auth.admin.email = nextEmail;
    if (newPassword) {
      if (String(newPassword).length < 12) {
        sendJson(res, 400, { error: 'The new password must be at least 12 characters long' });
        return true;
      }
      auth.admin.password = await hashPassword(String(newPassword));
    }
    auth.admin.updatedAt = new Date().toISOString();
    await writeAuth(auth);

    const token = await createSessionToken(auth.admin.email);
    setSessionCookie(res, token);
    sendJson(res, 200, { user: { email: auth.admin.email } });
    return true;
  }

  if (req.url === '/api/state' && req.method === 'GET') {
    if (!(await requireSession(req, res))) return true;
    sendJson(res, 200, await readState());
    return true;
  }

  if (req.url === '/api/state' && req.method === 'PUT') {
    if (!(await requireSession(req, res))) return true;
    const body = await readBody(req);
    sendJson(res, 200, await writeState(body));
    return true;
  }

  if (req.url === '/api/product-preview' && req.method === 'POST') {
    if (!(await requireSession(req, res))) return true;
    const { url } = await readBody(req);
    try {
      const safeUrl = await validateExternalProductUrl(url);
      const { html, finalUrl } = await fetchProductHtml(safeUrl);
      sendJson(res, 200, extractProductPreview(html, finalUrl));
    } catch (error) {
      sendJson(res, 400, { error: error.message || 'Unable to autofill the product from this link' });
    }
    return true;
  }

  if (req.url === '/api/import/amazon-wishlist' && req.method === 'POST') {
    if (!(await requireSession(req, res))) return true;
    const { url } = await readBody(req);
    try {
      const safeUrl = await validateAmazonWishlistUrl(url);
      const { html, finalUrl } = await fetchProductHtml(safeUrl);
      sendJson(res, 200, extractAmazonWishlistProducts(html, finalUrl));
    } catch (error) {
      sendJson(res, 400, { error: error.message || 'Unable to import this wishlist' });
    }
    return true;
  }

  if (req.url?.startsWith('/api/')) {
    sendJson(res, 404, { error: 'Endpoint not found' });
    return true;
  }

  return false;
};

const serveStatic = async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const safePath = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const requestedPath = path.normalize(path.join(publicDir, safePath));
  const relativePath = path.relative(publicDir, requestedPath);
  const filePath = relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
    ? requestedPath
    : path.join(publicDir, 'index.html');

  try {
    const fileStat = await stat(filePath);
    const finalPath = fileStat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    const ext = path.extname(finalPath).toLowerCase();
    res.writeHead(200, {
      ...securityHeaders,
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=31536000, immutable',
    });
    createReadStream(finalPath).pipe(res);
  } catch {
    res.writeHead(200, {
      ...securityHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    createReadStream(path.join(publicDir, 'index.html')).pipe(res);
  }
};

const server = createServer(async (req, res) => {
  try {
    if (await handleApi(req, res)) return;
    await serveStatic(req, res);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: 'Internal server error' });
  }
});

server.listen(port, '0.0.0.0', () => {
  ensureAuthFile().catch((error) => console.error('Auth initialization error:', error));
  console.log(`Laterbase self-hosted started at http://0.0.0.0:${port}`);
  console.log(`Data saved in ${dataFile}`);
});
