# Security Policy

Wishlist is a self-hosted app. The maintainer cannot inspect your private instance, your Docker volume, your browser session, or your local wishlist data.

## Supported Versions

Security fixes are expected to target the latest published release.

| Version | Supported |
| --- | --- |
| `1.x` | Yes |
| `< 1.0.0` | No |

## Reporting a Vulnerability

Please report security issues privately before opening a public issue.

Use one of these channels:

- GitHub private vulnerability reporting, if enabled on the repository.
- A direct private message to the repository owner.

Please include:

- a clear description of the issue;
- steps to reproduce;
- affected version or commit;
- whether the instance was running behind HTTPS or only on localhost;
- relevant logs with secrets removed.

Do not include real passwords, session cookies, backup files, or private wishlist data in a report.

## Scope

Security reports are welcome for:

- authentication and session handling;
- password hashing and account changes;
- backup and import behavior;
- server-side request handling;
- autofill URL validation and SSRF protections;
- cross-site scripting risks;
- Docker image and runtime configuration;
- accidental telemetry or unexpected external requests.

Out of scope:

- attacks requiring full access to the host machine;
- issues caused by exposing an instance publicly without HTTPS;
- websites blocking autofill or price refresh requests;
- vulnerabilities in unsupported forks or modified deployments;
- brute-force attempts against weak user-chosen passwords.

## Security Model

Wishlist uses local authentication, hashed passwords, hashed session tokens, `HttpOnly` cookies, `SameSite=Strict`, origin checks for unsafe API requests, security headers, and SSRF-oriented checks for autofill and price refresh requests.

Self-hosting still requires operational care. Keep Docker updated, use HTTPS when exposing Wishlist outside `localhost`, choose a strong password, and back up your Docker volume.

## Disclosure

Please allow reasonable time for a fix before public disclosure. Coordinated disclosure keeps users safer and gives maintainers time to publish a patch.
