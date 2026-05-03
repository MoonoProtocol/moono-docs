---
title: Introduction
description: What is Moono Protocol and how does it work.
---

Moono Protocol is a decentralized lending protocol on Solana designed specifically for token launches on pump.fun.

## Application

The protocol is deployed and available at:

- **Main app** — [app.moono.me](https://app.moono.me)
- **IPFS mirror** — [IPNS link](https://k51qzi5uqu5dkcd1cjf1nkei8zjdugoy2ynd7zyqfsb5bf0wmubjseuy98fw96.ipns.dweb.link)

All releases are published to IPFS. If the main app is unavailable for any reason, you can always access the protocol through the IPFS mirror.

## The Problem

Launching a token on pump.fun requires SOL for the initial liquidity — you need to fund the bonding curve with a buy. If you don't have enough SOL on hand, you can't launch. There's also the risk of locking up your own capital in a volatile new token.

## The Solution

Moono Protocol lets you **borrow SOL** to launch and seed your token on pump.fun, while **liquidity providers earn interest** by supplying the SOL that borrowers use.

### For Borrowers

1. Create a reusable [**Launch Preset**](/guides/launch-presets/) with your token metadata, supply, and decimals — or generate everything with the built-in AI generator
2. Optionally configure [**bundle wallets**](/guides/bundle-wallets/) — protocol-controlled PDAs that distribute the initial buy across multiple wallets in the same transaction
3. Choose how much SOL to borrow (0.1–10 SOL) and for how long (1–24 hours)
4. Moono creates your token on pump.fun, executes the initial buy, runs the bundle buys, and optionally lets you co-buy in the same atomic transaction
5. The purchased tokens (initial buy + bundle holdings) serve as collateral for your loan
6. Repay the loan to recover your tokens, or self-liquidate to settle in SOL

### For Liquidity Providers

1. Deposit SOL into the protocol's liquidity pool
2. Choose a **tick** (risk tier) that determines the interest rate you earn
3. Lower ticks = lower interest rate, but your liquidity is used first (more utilization)
4. Higher ticks = higher interest rate, used only when lower ticks are depleted
5. Interest accrues to your position via a cumulative-index model — visible as growing share value
6. **Claim** accrued interest at any time, or roll it into a withdrawal/close

## Key Features

- **Single-transaction launches** — borrowing, token creation, initial buy, bundle buys, and an optional user co-buy all happen atomically
- **Launch presets** — reusable launch templates with custom mint, name, symbol, supply, decimals, metadata URI, and bundle wallet configuration
- **Bundle wallets** — up to dozens of protocol-derived PDAs that perform additional buys on the same launch, distributing the initial fill across many addresses
- **AI-assisted metadata** — generate token name, symbol, description, and image with one click; upload images to IPFS directly from the app
- **Tiered liquidity** — 1,024 risk tiers allow LPs to choose their risk/reward profile
- **Cumulative-index LP interest** — interest accrues precisely per share at borrow time and is claimable independently from withdrawal
- **On-chain economics** — all fees, interest, and liquidation logic are computed transparently on-chain
- **Self-liquidation** — borrowers can liquidate their own loans (any time) and receive any excess proceeds; a combined **Sell & Liquidate** action also unwinds bundle wallet holdings in one flow
- **Jito bundle support** — opt-in Jito submission for higher landing rate on launches and user buys
- **Non-custodial** — the protocol is a Solana program; no one can access your funds except through the program logic

## Supported Platforms

Moono Protocol is designed to support **multiple launch platforms**. The first integrated platform is:

- **pump.fun** — the leading memecoin launchpad on Solana

More platforms will be added in the future. The protocol architecture natively supports multiple launch platforms and quote assets — each platform gets its own launch configuration with independent parameters and a `paused` flag for granular control. The current mainnet deployment is configured for pump.fun with WSOL (wrapped SOL) as the quote asset.
