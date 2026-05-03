---
title: Bundle Wallets
description: How bundle wallets work in Moono Protocol and how to use them in token launches.
---

A **bundle** is a set of protocol-controlled wallets (PDAs) that perform additional buys on the same launch transaction as the initial buy. Bundles distribute the launch's purchase pressure across many wallets in one atomic operation, then let the borrower sell those holdings and collect the SOL when unwinding the loan.

Bundles are configured per [Launch Preset](/guides/launch-presets/) and sit dormant until you launch from the preset.

## What Bundle Wallets Are

Each bundle wallet is a **Program Derived Address** (PDA) derived from:

- the seed `"bundle"`
- the preset's address
- the wallet index (0, 1, 2, …)

Because the addresses are deterministic, the protocol can sign for them in CPI calls without holding any private keys. There is no individual wallet you control — the protocol does. Your role is to configure how many wallets the bundle uses, fund them with SOL for rent and fees, and trigger sell/collect when you're done.

The number of bundle wallets is set by **Bundle Addresses Count** on the preset (max is enforced by the program). The actual addresses are stored in a per-preset **Address Lookup Table (Bundle ALT)** so the launch transaction can fit them within Solana's account limits.

## Why Use Bundle Wallets

- **Distributed initial fill** — instead of one wallet buying everything, the buy pressure is spread across N wallets in a single atomic transaction. Useful for launch dynamics where having many holders right after launch matters.
- **Anti-snipe** — combined with Moono's curve checkpoint and Jito support, bundle buys give you a tightly atomic sequence that snipers can't easily wedge into.
- **Single-action unwind** — bundle holdings can be sold and SOL collected in a few transactions from the preset and loan pages, rather than tracking dozens of wallets manually.

If you don't need any of these properties, you can launch with `bundle_addresses_count = 0` (or without a preset entirely) and the bundle layer is skipped.

## Lifecycle

### 1. Create the Bundle ALT

On the preset page (or during preset creation), set **Bundle Addresses Count** and click **Recreate ALT**. The app derives all bundle wallet PDAs and writes them into a new Address Lookup Table owned by your wallet. The ALT address goes into the preset.

You can later **Amend ALT** to add wallets without rebuilding from scratch — useful when increasing the count.

### 2. Fund the Bundle Wallets

Before the first launch, each bundle wallet needs SOL to:

- Pay rent on the per-launch token ATAs they create
- Cover transaction fees on bundle sell / collect operations

The preset page shows a **Bundle Wallets** table with each wallet's index, address, ATA, volume accumulator, and SOL balance. Click **Fund Wallets** to top them up to the recommended baseline. Wallets below the threshold are highlighted.

The funding transaction is separate from the launch and pays from your wallet.

### 3. Launch

When you launch from a preset, the protocol uses the **Initial Buy Amount** slider to split the loan: a portion goes to the protocol's execution wallet for the initial buy, and the rest is distributed across the bundle wallets per the **Bundle Distribution Type** (currently **Equal**). The bundle buys happen in the same atomic transaction (or Jito bundle) as the initial buy.

Bundle base-token holdings are tracked in `loan.bundled_base_amount` separately from the initial-buy collateral.

### 4. Sell and Collect

When you want to unwind, you have three paths:

- **Sell & Liquidate** (loan page) — one click; sells all bundle base balances, then liquidates the loan
- **Sell Selected** (preset → Bundle Wallets) — selects specific bundle wallets and sells their base via `bundle_sell_all_market_0`
- **Collect SOL** (preset → Bundle Wallets) — sweeps remaining SOL out of bundle wallets back to your wallet via `bundle_collect_all`

The sell/collect actions accept arbitrary subsets of wallet indexes, so the operation can be chunked across multiple transactions if needed (Solana's per-tx account limit).

## SPL Display

The Bundle Wallets table can show the SPL balance for any mint you choose (default: the launch's base mint). Click **SPL token** above the table to switch the displayed mint — useful when checking pre-launch funding or post-launch balances on a different token.

## Loan-side Helper

If you reach the preset later with no active loan reference but bundle wallets still hold tokens, click **Try to Find Loan** to have the app search for a recent loan that used this preset and pre-fill the loan address for sell/collect routing.

## Distribution Types

| Type | Behavior |
|---|---|
| **Equal** (0) | The protocol divides the bundle portion of the loan amount into N equal slices, one per bundle wallet |

More distribution types may be added in the future.

## Tips

- **Recreate ALT after changing count** — the ALT must contain exactly the bundle wallet PDAs the program expects
- **Fund before every launch** — funding survives across launches but is consumed by sell/collect fees and ATA rent
- **Use Jito for atomicity** — without Jito, the bundle and your user buy may land in different slots
- **Sell before collecting** — bundle wallets first need to convert base tokens back to SOL before there's anything to collect; **Sell Selected** does the sell, **Collect SOL** sweeps the proceeds
