# Stylus Contract Management Frontend

This repository contains the frontend application for the Stylus Contract Management system, a web application for managing and interacting with Stylus contracts on Arbitrum.

## Project Overview

The Stylus Contract Management Frontend is built with:

- Next.js 15+
- React 19
- TailwindCSS
- Radix UI Components
- RainbowKit for wallet connection
- Wagmi and Viem for Ethereum interactions

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm
- [Stylus CM Backend](https://github.com/your-org/stylus-cm-backend) running locally or accessible via network

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/stylus-cm-frontend.git
cd stylus-cm-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file based on the provided `.env.example`:

```bash
cp .env.example .env
```

Edit the `.env` file to configure your environment variables:

```
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3000  # URL to your Stylus CM Backend
```

### 4. Start the development server

```bash
npm run dev
```

This will start the frontend application on [http://localhost:5000](http://localhost:5000).

### 5. Build for production

```bash
npm run build
npm run start
```

## Backend Dependency

This frontend application requires the Stylus CM Backend service to be running. The backend service should be accessible at the URL specified in the `NEXT_PUBLIC_API_URL` environment variable.

### Setting up the Backend

1. Clone and set up the Stylus CM Backend repository
2. Start the backend service on port 3000 (default)
3. Ensure the frontend can connect to the backend (check CORS settings if needed)

## Features

- Explore Stylus contracts
- Manage your contracts
- Configure alerts and automations
- Real-time contract monitoring
- Bidding functionality
- Wallet integration

## Sentry monitoring

Error monitoring covers the browser, React's root error boundary, Node.js requests, and Edge requests.
Each runtime stays disabled without its DSN. No demo routes or test buttons ship with the application.

Configure these variables separately for Vercel Production, Preview, and the custom staging environment:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser DSN, available during `next build`. |
| `SENTRY_DSN` | Optional server/Edge DSN override; defaults to the public DSN. |
| `SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Environment override. Server variable takes precedence during build. |
| `SENTRY_RELEASE` / `NEXT_PUBLIC_SENTRY_RELEASE` | Release override. Server variable takes precedence during build. |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | Browser trace rate from 0 to 1; defaults to 0. |
| `SENTRY_TRACES_SAMPLE_RATE` | Server/Edge rate override; defaults to the public rate, then 0. |
| `SENTRY_AUTH_TOKEN` | Private build token for source-map uploads. Never use a public prefix. |
| `SENTRY_ORG` | Upload organization: `cobuilders`. |
| `SENTRY_PROJECT` | Upload project: `stylus-cm-frontend`. |

Without overrides, environment follows `VERCEL_TARGET_ENV`, then `VERCEL_ENV`, then `NODE_ENV`.
This distinguishes custom staging deployments from ordinary previews.
Release defaults to `VERCEL_GIT_COMMIT_SHA`.
The build explicitly embeds environment and release in browser bundles, matching the upload release.
Keep server and public overrides consistent. Redeploy after changing public variables; they are fixed at build time.
Enable Vercel's system environment variables when using its automatic environment and commit identity.

Uploads require all three private build variables: token, organization, and project.
Builds without them succeed without uploads. Configured upload failures fail the build.
Client source maps are deleted after upload. Verify readable stacks in the deployed project before enabling sampling.

Privacy defaults disable PII, logs, metrics, replay, browser sessions, breadcrumbs, and outgoing trace propagation.
An event allowlist removes request data, cookies, headers, wallet data, arbitrary context, and attachments.
It also removes error messages, function names, and source snippets, which can contain authentication or RPC data.
A fixed `0.0.0.0` IP placeholder prevents Sentry from inferring location from the ingestion connection.
Standard error types, code locations, line numbers, and source-map debug IDs remain available for diagnosis.
Tracing defaults to zero. When enabled, it retains root timings and known page routes, but discards child spans.
This deliberately limits diagnostic detail to protect wallet and authentication data.

Run `npm test`, `npm run typecheck`, and `npm run build` before deployment.
The monitoring tests cover disabled runtimes, Vercel identities, configuration fallbacks, and real SDK envelope privacy.
