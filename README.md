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
