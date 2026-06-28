# Privacy

Laterbase is designed as a private, self-hosted product and shopping tracker.

The core promise is simple: your data belongs to the instance you run.

## What Laterbase Stores

Laterbase stores app data in the configured Docker data directory, normally `/data`.

Typical files include:

- `laterbase.json` for products, categories, budgets, dashboard state, purchases, archives, gift flags, and export preferences;
- `auth.json` for the local account and password hash;
- `sessions.json` for hashed session tokens.

Backups and exported JSON files contain personal data. Treat them as private files.

## What Laterbase Does Not Include

Laterbase does not include:

- analytics;
- telemetry;
- tracking pixels;
- advertising scripts;
- remote JavaScript CDNs;
- remote font CDNs;
- a hosted database controlled by the maintainer;
- a cloud account system controlled by the maintainer.

The maintainer cannot see your products, prices, notes, account email, password, budget, exports, or usage statistics.

## When External Requests Can Happen

Laterbase can still contact external websites in user-controlled cases:

- when you open a product link;
- when you enable external product images;
- when you use product autofill;
- when you import a public Amazon wishlist link;
- when you refresh prices from product URLs.

Autofill, Amazon wishlist import, and price refresh are best-effort. Laterbase does not bypass bot protection, CAPTCHA, paywalls, private APIs, or access restrictions.

## External Images

External product images are disabled by default. When enabled, your browser may request image URLs from the original product sites. Those sites may receive normal browser request metadata such as your IP address and user agent.

Keep external images disabled if you want the quietest privacy mode.

## Local Network Protection

Laterbase blocks autofill, price refresh, and wishlist import requests to localhost, private networks, and link-local targets to reduce SSRF risk.

Amazon wishlist import is additionally limited to public Amazon wishlist sharing URLs. The import review stores product image URLs, but those images are not loaded by the browser unless you enable external images.

## Your Responsibilities

If you expose Laterbase outside your own machine or private network:

- use HTTPS;
- enable secure cookies;
- choose a strong password;
- keep Docker and the host system updated;
- keep backups private.

Laterbase is private by design, but deployment choices still matter.
