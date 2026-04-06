---
title: Borrower Guide
description: Step-by-step guide for borrowing SOL and launching tokens on pump.fun through Moono Protocol.
---

This guide walks you through the process of borrowing SOL from Moono Protocol to launch a token on pump.fun.

## Prerequisites

- A Solana wallet (Phantom, Solflare, or any compatible wallet)
- SOL in your wallet to cover fees and interest (see [Economics](/getting-started/economics/) for exact costs)
- Token metadata ready: name, symbol, and image URI

## Step 1: Register Your Profile

Before your first loan, you need to create a **User Profile** on the protocol. This is a one-time action.

- Connect your wallet to the Moono app
- Click **Register** (or the profile creation action)
- Approve the transaction — this costs **0.01 SOL** (registration fee) plus a small amount for Solana account rent

Your profile tracks your loan history and assigns sequential loan IDs.

## Step 2: Configure Your Loan

Choose your loan parameters:

### Loan Amount

Select how much SOL you want to borrow. This determines how much SOL goes into buying your token on the pump.fun bonding curve.

| | Min | Max |
|---|---|---|
| **Loan Amount** | 0.1 SOL | 10 SOL |

A larger loan means a bigger initial buy on pump.fun, which pushes the token price higher on the bonding curve from the start.

### Loan Duration

Choose how long you need the loan:

| | Min | Max |
|---|---|---|
| **Duration** | 1 hour | 24 hours |

You must repay within this window, or your loan becomes eligible for liquidation.

### Token Details

Provide the metadata for your new token:

- **Name** — the full token name (e.g., "Moono Cat")
- **Symbol** — the token ticker (e.g., "MCAT")
- **URI** — link to the token metadata JSON (image, description, etc.)

## Step 3: Review Costs

Before confirming, review the total cost breakdown:

1. **Protocol Fee** — 0.05 SOL (fixed)
2. **Migration Reserve** — proportional to loan size (see [Economics](/getting-started/economics/#migration-reserve))
3. **Launch Overhead** — 0.01 SOL (refundable)
4. **Interest** — depends on loan amount, duration, and current liquidity utilization

You pay the interest + fees upfront from your wallet. The borrowed SOL goes entirely into the pump.fun token purchase.

:::tip
Check the [Economics](/getting-started/economics/#complete-cost-examples) page for detailed cost examples at different loan sizes and durations.
:::

## Step 4: Launch

Confirm the transaction. In a single atomic transaction, Moono Protocol will:

1. Deduct fees and interest from your wallet
2. Borrow SOL from the liquidity pool (starting from the lowest-cost ticks)
3. Create your token on pump.fun
4. Execute the initial buy on the pump.fun bonding curve
5. Store the purchased tokens as collateral in a program-controlled escrow

After the transaction confirms, your token is live on pump.fun and tradeable by anyone.

## Step 5: Manage Your Loan

Once your token is launched, you have two options:

### Option A: Repay the Loan

Before the loan expires, you can repay to recover your collateral tokens:

1. Ensure your wallet has enough SOL to cover the repayment amount
2. Click **Repay** on your active loan
3. Approve the transaction

On repayment:
- The borrowed SOL is returned to the liquidity pool
- Your collateral tokens (the tokens bought on pump.fun) are transferred to your wallet
- The refundable launch overhead (0.01 SOL) is returned to you
- The loan is marked as **Repaid**

### Option B: Let It Be Liquidated

If you don't repay before the deadline, the loan becomes eligible for liquidation:

- Anyone can trigger the liquidation (it's permissionless)
- The collateral tokens are sold on the pump.fun bonding curve
- Proceeds go to repay the liquidity pool
- You lose the collateral tokens, but you don't owe anything extra

:::caution
Once a loan expires, liquidation can happen at any moment. There is no grace period. If you want to keep your tokens, repay before the deadline.
:::

## Loan Statuses

| Status | Meaning |
|---|---|
| **Open** | Loan is active; you can repay before expiration |
| **Repaid** | You repaid the loan and recovered your tokens |
| **Liquidated by User** | A user (could be anyone) triggered liquidation after expiry |
| **Liquidated by Admin** | Protocol admin triggered liquidation |

## Tips

- **Start small** — try a 0.1 SOL loan first to understand the flow
- **Watch the clock** — set a reminder before your loan expires if you plan to repay
- **Check liquidity** — if lower ticks are depleted, your loan will use higher ticks (more expensive)
- **Factor in all costs** — the interest is just one part; don't forget the protocol fee and migration reserve
