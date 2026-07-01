# 7day Meals Staff Frontend

A minimal Next.js app for the 7day Meals staff interface. The project currently uses the App Router, TypeScript, and the default Next.js asset pipeline.

## Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

Build for production:

```bash
npm run build
```

Run the production server:

```bash
npm run start
```

Run the linter:

```bash
npm run lint
```

## Scripts

These scripts are defined in `package.json`:

- `dev` - start the local Next.js development server
- `build` - create a production build
- `start` - start the production server
- `lint` - run ESLint

## Folder Structure

```text
.
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── app/
│   ├── components/
│   │   └── .gitkeep
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── lib/
│   │   └── .gitkeep
│   ├── pages/
│   │   ├── login/
│   │   │   ├── assets/
│   │   │   │   └── .gitkeep
│   │   │   ├── components/
│   │   │   │   └── .gitkeep
│   │   │   └── LoginPage.tsx
│   │   └── overview/
│   │       └── .gitkeep
│   ├── page.tsx
│   └── utils/
│       └── .gitkeep
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
└── tsconfig.json
```

## Directory Notes

- `app/pages/` groups feature-oriented screens such as login and overview.
- `app/pages/login/` is the login feature folder and contains the page component plus its local assets and components folders.
- `app/components/` is for shared UI components used across multiple features.
- `app/lib/` is for shared domain logic, API helpers, and data access code.
- `app/utils/` is for general utility helpers that do not belong to one feature.
- `public/` stores static assets that can be referenced directly from the app.
- `AGENTS.md` and `CLAUDE.md` document workspace-specific agent guidance.
- `package.json` defines the app scripts and dependency versions.
- `tsconfig.json` and `next.config.ts` hold TypeScript and Next.js configuration.

## `.gitkeep`

Git does not track empty folders, so `.gitkeep` files are used to keep placeholder directories in the repository until real files are added. The sample `.gitkeep` files here are short notes for the intended folder purpose, and you can remove them once the folders contain actual code or assets.

## Feature Folder Pattern

When you add another generated feature or resource, follow the same pattern as `app/pages/login/`:

- create a folder under `app/pages/<feature-name>/`
- keep feature-local components in `components/`
- keep feature-local assets in `assets/`
- add a page entry component such as `FeaturePage.tsx`
- use `app/lib/` or `app/utils/` for shared code that should not live inside one feature

## Notes

- This repository does not document generated output folders such as `node_modules/`, `.next/`, `dist/`, or `build/`.
- The default scaffold text has been replaced with project-specific documentation.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)

## Deploy on Vercel

The easiest way to deploy this app is with the [Vercel Platform](https://vercel.com/new).

## Repository Rules for Staff

### Branching Strategy

- The repository has two primary branches: `main` and `dev`.
- **Development**: All new features, bug fixes, and changes must be implemented by creating a new branch based off the `dev` branch.
- **Merging**: Once your implementation is complete and tested, merge your branch back into the `dev` branch.
- **Deployment**: The `main` branch is strictly reserved for deployment. Merges into `main` are handled only after all features are completed and validated in `dev`.

### Branch Naming Conventions

Please use descriptive branch names that indicate the purpose of the branch. We recommend the following prefixes:
- `feat/` for new features (e.g., `feat/login-page`)
- `fix/` for bug fixes (e.g., `fix/header-styling`)
- `chore/` for maintenance tasks (e.g., `chore/update-dependencies`)
- `docs/` for documentation changes

### Commit Message Conventions

We follow conventional commits to maintain a readable and organized project history. Each commit message should start with a specific type:

- `feat:` A new feature
- `fix:` A bug fix
- `chore:` Changes to the build process or auxiliary tools and libraries (no production code change)
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.)
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `test:` Adding missing tests or correcting existing tests

Example: `feat: add login form validation`
