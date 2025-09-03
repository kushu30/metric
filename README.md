\<div align="center"\>
\<img width="200" height="200" alt="logo" src="[https://github.com/user-attachments/assets/169f5ff2-05cb-4269-8390-042b425e174e](https://github.com/user-attachments/assets/169f5ff2-05cb-4269-8390-042b425e174e)" /\>

# Metric

**Decentralized Fair Lending Platform**

Built with Next.js, TypeScript, TailwindCSS, NextAuth.js, and MongoDB

\</div\>

-----

## Overview

**Metric** is a private credit network designed for principled borrowers and discerning lenders. It leverages machine-evaluated risk, community-backed insurance, and radical transparency to create a fair and efficient lending ecosystem.

## Key Features

### **For Borrowers**

  - **ML-Powered Risk Scoring**: Get a fair credit score based on your on-chain and off-chain activity.
  - **Request Loans**: Easily request loans with flexible amounts and durations.
  - **Transparent Repayments**: Manage your active loans and view your repayment history.
  - **Profile Verification**: Strengthen your profile and unlock better terms through various verification methods.

### **For Lenders**

  - **Lender Dashboard**: Get a comprehensive overview of your lending activities.
  - **Loan Marketplace**: Browse and fund pending loan requests from a diverse pool of borrowers.
  - **Portfolio Management**: Track your funded loans and potential returns.
  - **Insurance Pool**: Protect your capital with a community-backed insurance pool.

### **Core Functionality**

  - **Secure Authentication**: Sign in with Google or your Ethereum wallet.
  - **Decentralized Identity**: Link your Web3 wallet to your account for a unified identity.
  - **Role-Based Access**: Choose your role as a borrower, lender, or both.

## Tech Stack

```
Frontend      Next.js + TypeScript
UI/UX         TailwindCSS + shadcn/ui + Framer Motion
Backend       Next.js API Routes
Database      MongoDB
Authentication NextAuth.js
```

## Quick Start

### Prerequisites

  - Node.js (\>= 18)
  - MongoDB URI
  - Google Client ID and Secret
  - NextAuth.js Secret

### Installation

```bash
git clone https://github.com/kushu30/metric.git
cd metric
npm install
```

### Environment Setup

Create a `.env.local` file in the root of your project and add the following variables:

```env
MONGODB_URI=your_mongodb_uri
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser to see the result.

### Production Build

```bash
npm run build
```

## Learn More

To learn more about Next.js, take a look at the following resources:

  - [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
  - [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome\!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
