# Contributing

Thanks for wanting to improve Laterbase.

Laterbase aims to stay small, private, self-hosted, and easy to run with Docker. Contributions should protect those goals.

## Before You Start

Good contributions usually fit one of these areas:

- privacy and security improvements;
- Docker/self-hosting improvements;
- accessibility and responsive UI fixes;
- language/translation fixes;
- export, backup, or import reliability;
- product autofill compatibility without bypassing website protections;
- documentation that helps non-technical users.

Avoid changes that add mandatory hosted services, telemetry, analytics, tracking, remote scripts, or cloud accounts.

## Development Setup

Install dependencies:

```powershell
npm install
```

Run the backend:

```powershell
npm run dev:server
```

Run the frontend in another terminal:

```powershell
npm run dev
```

Build:

```powershell
npm run build
```

Lint:

```powershell
npm run lint
```

## Pull Request Checklist

Before opening a pull request:

- run `npm run lint`;
- run `npm run build`;
- update documentation when behavior changes;
- add or update translations for visible UI text;
- do not commit real user data, backups, `.env` files, logs, or screenshots with private information;
- explain privacy or network behavior if the change introduces external requests.

## Translations

Laterbase supports multiple languages. User-facing text should go through the existing translation helpers rather than being hardcoded in a component.

If a feature is not translated yet, prefer adding a clear English string and opening a follow-up issue rather than silently mixing languages across the UI.

## Security

Please do not open a public issue for an unpatched vulnerability. Follow `SECURITY.md`.

## License

By contributing, you agree that your contribution will be licensed under the GNU Affero General Public License v3.0.
