# Changelog

All notable changes to Laterbase will be documented in this file.

The format follows a simple human-readable style.

## [1.0.0] - 2026-07-06

### Added

- Self-hosted Docker runtime with local JSON storage.
- Local account login with hashed passwords and session cookies.
- Laterbase dashboard with products, categories, budget, archive, purchase tracking, and insights.
- Product autofill from public product pages.
- Best-effort price refresh.
- Gift idea mode and shareable read-only exports.
- PNG image export and printable PDF export.
- Multi-language interface with locale-aware currency formatting.
- Privacy controls for external product images.
- Account tools for backup, restore, quick add, password changes, and local settings.
- First-run onboarding and privacy/data explanation modal.
- GitHub community files, security policy, privacy policy, and CI workflow.

### Changed

- Removed hosted database requirements.
- Removed public localhost share links in favor of static exports.

### Security

- Added local password hashing with `scrypt`.
- Added hashed session token storage.
- Added security headers, origin checks, and SSRF-oriented autofill protections.
