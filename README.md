# LawFirmApp

LawFirmApp is a **desktop case management system for law firms**, built with **Electron, React, and SQLite**.
It provides a lightweight offline-first tool for managing clients, cases, appointments, and documents in a single interface.

The goal of the project is to provide a **fast, simple, and self-hosted desktop solution** without requiring cloud infrastructure.

---

## Features

* Client management
* Case tracking
* Appointment scheduling
* Document storage
* Search and filtering
* Local database storage
* Cross-platform desktop app
* Auto-updates via GitHub releases

The system is designed for **small law firms or individual advocates** who need a straightforward case management tool.

---

## Tech Stack

**Frontend**

* React
* TailwindCSS
* shadcn/ui
* TanStack Table

**Desktop Runtime**

* Electron

**Backend (Local)**

* SQLite
* better-sqlite3

**Tooling**

* Vite
* Electron Builder
* GitHub Actions (CI/CD)

---

## Project Structure

```
dist/                → frontend build output
dist-electron/       → electron main process build
src/                 → react frontend source
electron/            → electron main process
build/               → application icons and build assets
release/             → packaged installers
```

---

## Development Setup

### Requirements

* Node.js 18+
* npm

### Install dependencies

```
npm install
```

### Run development environment

```
npm run dev
```

This starts:

* Vite development server
* Electron desktop shell

---

## Building the Application

Build for the current platform:

```
npx electron-builder
```

Build Windows **32-bit installer**:

```
npx electron-builder --win --ia32
```

Output files are generated inside:

```
release/<version>/
```

---

## Auto Updates

The app uses **electron-updater with GitHub releases**.

When a new release is published:

1. The application checks GitHub.
2. Downloads the update.
3. Installs it automatically.

Releases are created via **GitHub Actions CI pipeline**.

---

## Continuous Integration

GitHub Actions automatically:

* Installs dependencies
* Builds the application
* Publishes releases

Workflow file:

```
.github/workflows/windows-build.yml
```

---

## Database

The application uses **SQLite** stored locally on the user’s machine.

Advantages:

* No external server required
* Works fully offline
* Fast read/write operations

---

## License

MIT License

---

## Notes

This project is designed to be:

* Lightweight
* Offline-first
* Easy to deploy
* Simple for non-technical users
