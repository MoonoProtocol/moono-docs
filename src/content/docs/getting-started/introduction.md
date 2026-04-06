---
title: Introduction
description: What is Moono Protocol and how does it work.
---

Moono Protocol is a decentralized lending protocol on Solana designed specifically for token launches on pump.fun.

## The Problem

Launching a token on pump.fun requires SOL for the initial liquidity — you need to fund the bonding curve with a buy. If you don't have enough SOL on hand, you can't launch. There's also the risk of locking up your own capital in a volatile new token.

## The Solution

Moono Protocol lets you **borrow SOL** to launch and seed your token on pump.fun, while **liquidity providers earn interest** by supplying the SOL that borrowers use.

### For Borrowers

1. Choose how much SOL to borrow (0.1–10 SOL) and for how long (1–24 hours)
2. Moono creates your token on pump.fun and makes the initial buy — all in one transaction
3. The purchased tokens serve as collateral for your loan
4. Repay the loan before expiration to get your tokens back, or let it be liquidated

### For Liquidity Providers

1. Deposit SOL into the protocol's liquidity pool
2. Choose a **tick** (risk tier) that determines the interest rate you earn
3. Lower ticks = lower interest rate, but your liquidity is used first (more utilization)
4. Higher ticks = higher interest rate, used only when lower ticks are depleted
5. Withdraw your SOL plus earned interest at any time (subject to liquidity availability)

## Key Features

- **Single-transaction launches** — borrowing, token creation, and initial buy happen atomically
- **Tiered liquidity** — 1,024 risk tiers allow LPs to choose their risk/reward profile
- **On-chain economics** — all fees, interest, and liquidation logic are computed transparently on-chain
- **Permissionless liquidation** — anyone can liquidate expired loans and earn a reward
- **Non-custodial** — the protocol is a Solana program; no one can access your funds except through the program logic

## Supported Platforms

Moono Protocol is designed to support **multiple launch platforms**. The first integrated platform is:

- **pump.fun** — the leading memecoin launchpad on Solana

More platforms will be added in the future. The protocol architecture natively supports multiple launch platforms and quote assets — each platform gets its own launch configuration with independent parameters. The current mainnet deployment is configured for pump.fun with WSOL (wrapped SOL) as the quote asset.
