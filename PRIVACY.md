# Privacy

Wishlist is designed as a private, self-hosted wishlist and shopping tracker.

The core promise is simple: your data belongs to the instance you run.

## What Wishlist Stores

Wishlist stores app data in the configured Docker data directory, normally `/data`.

Typical files include:

- `wishlist.json` for products, categories, budgets, dashboard state, purchases, archives, gift flags, and export preferences;
- `auth.json` for the local account and password hash;
- `sessions.json` for hashed session tokens.

Backups and exported JSON files contain personal data. Treat them as private files.

## What Wishlist Does Not Include

Wishlist does not include:

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

Wishlist can still contact external websites in user-controlled cases:

- when you open a product link;
- when you enable external product images;
- when you use product autofill;
- when you refresh prices from product URLs.

Autofill and price refresh are best-effort. Wishlist does not bypass bot protection, CAPTCHA, paywalls, private APIs, or access restrictions.

## External Images

External product images are disabled by default. When enabled, your browser may request image URLs from the original product sites. Those sites may receive normal browser request metadata such as your IP address and user agent.

Keep external images disabled if you want the quietest privacy mode.

## Local Network Protection

Wishlist blocks autofill requests to localhost, private networks, and link-local targets to reduce SSRF risk.

## Your Responsibilities

If you expose Wishlist outside your own machine or private network:

- use HTTPS;
- enable secure cookies;
- choose a strong password;
- keep Docker and the host system updated;
- keep backups private.

Wishlist is private by design, but deployment choices still matter.
