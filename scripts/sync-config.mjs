/**
 * Fetches Moono Protocol config and launch configuration from Solana mainnet
 * and generates economics documentation pages with real on-chain values.
 *
 * Usage: node scripts/sync-config.mjs
 * Env:   SOLANA_RPC_URL — Solana RPC endpoint (loaded from .env or environment)
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Load .env ───────────────────────────────────────────────────────────────

function loadDotEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();

const PROGRAM_ID = new PublicKey('moono1nEzk6NWAHzgFjeeSYn3WVtr3N2ZVArwsxrhFX');
const RPC_URL = process.env.SOLANA_RPC_URL;

if (!RPC_URL) {
  console.error('Error: SOLANA_RPC_URL is not set.');
  console.error('Set it in .env (for local dev) or as a GitHub Actions secret (for CI).');
  process.exit(1);
}

// ── PDA derivation ──────────────────────────────────────────────────────────

function findPda(seeds) {
  return PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];
}

const CONFIG_PDA = findPda([Buffer.from('config')]);

// LaunchConfiguration #0
const LC_ID_BYTES = Buffer.alloc(2);
LC_ID_BYTES.writeUInt16LE(0);
const LAUNCH_CONFIG_PDA = findPda([Buffer.from('launch_configuration'), LC_ID_BYTES]);

// ── Account parsers (zero_copy accounts have 8-byte Anchor discriminator) ───

function parseConfig(data) {
  const buf = Buffer.from(data);
  return {
    authority: new PublicKey(buf.subarray(8, 40)).toBase58(),
    registrationFeeLamports: buf.readBigUInt64LE(40),
    hpppmMin: buf.readUInt32LE(48),
    hpppmMax: buf.readUInt32LE(52),
    hpppmStep: buf.readUInt32LE(56),
    fpppmMin: buf.readUInt32LE(60),
    fpppmMax: buf.readUInt32LE(64),
    intervalMin: buf.readUInt32LE(68),
    intervalMax: buf.readUInt32LE(72),
    version: buf.readUInt8(76),
    paused: buf.readUInt8(77),
  };
}

function parseLaunchConfiguration(data) {
  const buf = Buffer.from(data);
  return {
    quoteVault: new PublicKey(buf.subarray(8, 40)).toBase58(),
    lookupTable: new PublicKey(buf.subarray(40, 72)).toBase58(),
    quoteAmountMin: buf.readBigUInt64LE(72),
    quoteAmountMax: buf.readBigUInt64LE(80),
    loanIntervalMin: buf.readBigUInt64LE(88),
    loanIntervalMax: buf.readBigUInt64LE(96),
    quoteLaunchFixedCost: buf.readBigUInt64LE(104),
    quoteLaunchFixedOverheadRefundable: buf.readBigUInt64LE(112),
    quoteMigrationFixedCost: buf.readBigUInt64LE(120),
    quoteMigrationThreshold: buf.readBigUInt64LE(128),
    quoteLaunchPpmOverheadRefundable: buf.readUInt32LE(136),
    quoteLaunchPpmCost: buf.readUInt32LE(140),
    quoteMigrationPpmCost: buf.readUInt32LE(144),
    platform: buf.readUInt8(148),
    paused: buf.readUInt8(149),
    launchConfigurationId: buf.readUInt16LE(150),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const SOL = 1_000_000_000n;
const lamportsToSol = (l) => Number(l) / 1e9;
const fmt = (n, d = 4) => n.toFixed(d);

function computeSharedPpm(interval, cfg) {
  const hMin = BigInt(cfg.hpppmMin);
  const fMin = BigInt(cfg.fpppmMin);
  const iMin = BigInt(cfg.intervalMin);
  const iMax = BigInt(cfg.intervalMax);
  const i = BigInt(interval);
  return Number(
    hMin * i + (fMin - hMin * iMin) * (iMax - i) / (iMax - iMin)
  );
}

function computeMigrationReserve(amountLamports, lc) {
  const capped = amountLamports < lc.quoteMigrationThreshold
    ? amountLamports
    : lc.quoteMigrationThreshold;
  return (
    (capped * lc.quoteMigrationFixedCost) / lc.quoteMigrationThreshold +
    (amountLamports * BigInt(lc.quoteMigrationPpmCost)) / 1_000_000n
  );
}

function computeProtocolFee(amountLamports, lc) {
  return (
    lc.quoteLaunchFixedCost +
    (amountLamports * BigInt(lc.quoteLaunchPpmCost)) / 1_000_000n
  );
}

function computeLaunchOverhead(amountLamports, lc) {
  return (
    lc.quoteLaunchFixedOverheadRefundable +
    (amountLamports * BigInt(lc.quoteLaunchPpmOverheadRefundable)) / 1_000_000n
  );
}

function computeExample(amountSol, intervalHours, avgTickIndex, cfg, lc) {
  const amountLamports = BigInt(Math.round(amountSol * 1e9));
  const protocolFee = computeProtocolFee(amountLamports, lc);
  const migrationReserve = computeMigrationReserve(amountLamports, lc);
  const launchOverhead = computeLaunchOverhead(amountLamports, lc);
  const tickRate = Math.min(cfg.hpppmMax, cfg.hpppmMin + avgTickIndex * cfg.hpppmStep);
  const lpInterest = (Number(amountLamports) * tickRate * intervalHours) / 1_000_000;
  const sharedPpm = computeSharedPpm(intervalHours, cfg);
  const sharedInterest = (Number(amountLamports) * sharedPpm) / 1_000_000;

  const totalLamports =
    Number(protocolFee) +
    Number(migrationReserve) +
    Number(launchOverhead) +
    lpInterest +
    sharedInterest;

  return {
    protocolFee: lamportsToSol(protocolFee),
    migrationReserve: lamportsToSol(migrationReserve),
    launchOverhead: lamportsToSol(launchOverhead),
    lpInterest: lpInterest / 1e9,
    sharedInterest: sharedInterest / 1e9,
    total: totalLamports / 1e9,
    nonRefundable: (totalLamports - Number(launchOverhead)) / 1e9,
  };
}

// ── Markdown generators ─────────────────────────────────────────────────────

function migrationReserveFormula(lc) {
  const fixedSol = lamportsToSol(lc.quoteMigrationFixedCost);
  const ppmPct = Number(lc.quoteMigrationPpmCost) / 10_000;
  if (lc.quoteMigrationPpmCost > 0 && lc.quoteMigrationFixedCost > 0n) {
    return `${fixedSol} SOL + ${ppmPct}% × loan_amount`;
  }
  if (lc.quoteMigrationPpmCost > 0) {
    return `${ppmPct}% × loan_amount`;
  }
  return `(min(loan_amount, ${lamportsToSol(lc.quoteMigrationThreshold)} SOL) × ${fixedSol} SOL) / ${lamportsToSol(lc.quoteMigrationThreshold)} SOL`;
}

function migrationReserveFormulaRu(lc) {
  const fixedSol = lamportsToSol(lc.quoteMigrationFixedCost);
  const ppmPct = Number(lc.quoteMigrationPpmCost) / 10_000;
  if (lc.quoteMigrationPpmCost > 0 && lc.quoteMigrationFixedCost > 0n) {
    return `${fixedSol} SOL + ${ppmPct}% × сумма_займа`;
  }
  if (lc.quoteMigrationPpmCost > 0) {
    return `${ppmPct}% × сумма_займа`;
  }
  return `(min(сумма_займа, ${lamportsToSol(lc.quoteMigrationThreshold)} SOL) × ${fixedSol} SOL) / ${lamportsToSol(lc.quoteMigrationThreshold)} SOL`;
}

function protocolFeeFormula(lc) {
  const fixedSol = lamportsToSol(lc.quoteLaunchFixedCost);
  const ppmPct = Number(lc.quoteLaunchPpmCost) / 10_000;
  if (lc.quoteLaunchPpmCost > 0) {
    return `${fixedSol} SOL + ${ppmPct}% × loan_amount`;
  }
  return `${fixedSol} SOL`;
}

function migrationCalcStr(amountSol, lc) {
  const fixedSol = lamportsToSol(lc.quoteMigrationFixedCost);
  const ppmPct = Number(lc.quoteMigrationPpmCost) / 10_000;
  if (lc.quoteMigrationPpmCost > 0 && lc.quoteMigrationFixedCost > 0n) {
    return `${fixedSol} + ${amountSol} × ${ppmPct}%`;
  }
  if (lc.quoteMigrationPpmCost > 0) {
    return `${amountSol} × ${ppmPct}%`;
  }
  return `${amountSol} × ${fixedSol} / ${lamportsToSol(lc.quoteMigrationThreshold)}`;
}

function generateEconomicsEN(cfg, lc, configLastChanged) {
  const protocolFeeSol = lamportsToSol(lc.quoteLaunchFixedCost);
  const launchOverheadSol = lamportsToSol(lc.quoteLaunchFixedOverheadRefundable);
  const regFeeSol = lamportsToSol(cfg.registrationFeeLamports);
  const minAmount = lamportsToSol(lc.quoteAmountMin);
  const maxAmount = lamportsToSol(lc.quoteAmountMax);
  const minInterval = Number(lc.loanIntervalMin);
  const maxInterval = Number(lc.loanIntervalMax);

  const migReserveExamples = [0.1, 0.5, 1, 5, 10]
    .filter(a => a >= minAmount && a <= maxAmount)
    .map(a => {
      const r = lamportsToSol(computeMigrationReserve(BigInt(Math.round(a * 1e9)), lc));
      return `| ${a} SOL | ${fmt(r)} SOL |`;
    })
    .join('\n');

  const tickTable = [0, 10, 50, 100, 250, 500, 1023].map(t => {
    const rate = Math.min(cfg.hpppmMax, cfg.hpppmMin + t * cfg.hpppmStep);
    return `| ${t}${t === 1023 ? ' (max)' : ''} | ${rate} | ${(rate / 10_000).toFixed(4)}% | ${(rate / 1e9).toFixed(6)} SOL |`;
  }).join('\n');

  const sharedTable = [1, 2, 6, 12, 24].filter(h => h >= minInterval && h <= maxInterval).map(h => {
    const ppm = computeSharedPpm(h, cfg);
    return `| ${h} hour${h > 1 ? 's' : ''} | ${ppm.toLocaleString('en-US')} | ${fmt(ppm / 1e6)} SOL |`;
  }).join('\n');

  const ex1 = computeExample(0.5, 6, 0, cfg, lc);
  const ex2 = computeExample(2, 12, 25, cfg, lc);
  const ex3 = computeExample(10, 24, 100, cfg, lc);

  return `---
title: Economics
description: Detailed breakdown of Moono Protocol fees, interest rates, and economic model with calculation examples.
---

{/* This file is auto-generated by scripts/sync-config.mjs from on-chain mainnet data. Do not edit manually. */}

This page explains how Moono Protocol's economic model works, including all fees, interest rates, and how costs are calculated for borrowers and earnings for liquidity providers.

All values described here are fetched from the current **mainnet** on-chain configuration.

:::tip[Last updated]
Configuration last changed: **${configLastChanged}**. Values are synced automatically from on-chain data at build time.
:::

## Overview of Costs

When a borrower takes a loan, the total cost consists of several components:

| Component | Description |
|---|---|
| **LP Interest** | Interest paid to liquidity providers, determined by tick rates and loan duration |
| **Shared Interest** | Additional protocol-wide interest surcharge distributed to all participating ticks |
| **Protocol Fee** | Fee charged by the protocol for each launch |
| **Migration Reserve** | SOL reserved for potential Raydium migration |
| **Launch Overhead** | Refundable overhead to cover transaction costs |

## Loan Parameters

| Parameter | Value |
|---|---|
| Minimum loan amount | ${minAmount} SOL |
| Maximum loan amount | ${maxAmount} SOL |
| Minimum loan duration | ${minInterval} hour${minInterval > 1 ? 's' : ''} |
| Maximum loan duration | ${maxInterval} hours |

## Protocol Fee

A fee is charged on every loan:

\`\`\`
Protocol Fee = ${protocolFeeFormula(lc)}
\`\`\`

This fee goes to the protocol treasury.

## Migration Reserve

A portion of the loan is reserved to cover the cost of potential token migration to Raydium (when the bonding curve completes on pump.fun):

\`\`\`
Migration Reserve = ${migrationReserveFormula(lc)}
\`\`\`

### Migration Reserve Examples

| Loan Amount | Migration Reserve |
|---|---|
${migReserveExamples}

The migration reserve is used to provide liquidity on Raydium if the token's bonding curve completes. If the loan is repaid before migration happens, the reserve is returned as part of the settlement.

## Launch Overhead (Refundable)

A small refundable overhead is charged to cover Solana transaction fees and rent:

\`\`\`
Launch Overhead = ${launchOverheadSol} SOL
\`\`\`

This amount is returned to the borrower when the loan is closed (repaid or liquidated).

## Interest Model

Moono Protocol uses a **tiered liquidity model** with 1,024 ticks (risk tiers). Each tick has its own interest rate, and loans are filled from the lowest tick upward.

### How Ticks Work

- There are **1,024 ticks**, indexed from 0 to 1,023
- Each tick represents a pool of liquidity at a specific interest rate
- Lower ticks have lower rates; higher ticks have higher rates
- When a loan is taken, liquidity is consumed starting from tick 0 and moving upward
- LPs choose which tick to deposit into based on their desired risk/reward

### Per-Tick Interest Rate

Each tick has an hourly rate expressed in **parts per million (ppm)**:

\`\`\`
tick_hourly_rate_ppm = min(${cfg.hpppmMax}, ${cfg.hpppmMin} + tick_index × ${cfg.hpppmStep})
\`\`\`

| Tick Index | Hourly Rate (ppm) | Hourly Rate (%) | Rate for 1 SOL per hour |
|---|---|---|---|
${tickTable}

### Per-Tick LP Interest Calculation

For each tick that contributes to funding a loan:

\`\`\`
tick_lp_interest = (tick_borrow_amount × tick_hourly_rate_ppm × loan_duration_hours) / 1,000,000
\`\`\`

**Example:** A loan borrows 0.5 SOL from tick 100 for 12 hours:

\`\`\`
tick_lp_interest = (0.5 × ${Math.min(cfg.hpppmMax, cfg.hpppmMin + 100 * cfg.hpppmStep)} × 12) / 1,000,000
                 = ${0.5 * Math.min(cfg.hpppmMax, cfg.hpppmMin + 100 * cfg.hpppmStep) * 12} / 1,000,000
                 = ${fmt(0.5 * Math.min(cfg.hpppmMax, cfg.hpppmMin + 100 * cfg.hpppmStep) * 12 / 1e6, 6)} SOL
\`\`\`

### Shared Interest (Protocol Surcharge)

In addition to per-tick LP interest, there is a **shared interest** component — a global surcharge that is distributed proportionally across all ticks participating in the loan. The formula uses a linear interpolation:

\`\`\`
shared_ppm = hpppm_min × interval + (fpppm_min - hpppm_min × interval_min) × (interval_max - interval) / (interval_max - interval_min)
\`\`\`

With current mainnet parameters:

\`\`\`
hpppm_min = ${cfg.hpppmMin}
fpppm_min = ${cfg.fpppmMin.toLocaleString('en-US')}
interval_min = ${cfg.intervalMin} hour
interval_max = ${cfg.intervalMax} hours

shared_ppm = ${cfg.hpppmMin} × interval + (${cfg.fpppmMin.toLocaleString('en-US')} - ${cfg.hpppmMin} × ${cfg.intervalMin}) × (${cfg.intervalMax} - interval) / (${cfg.intervalMax} - ${cfg.intervalMin})
\`\`\`

Then:

\`\`\`
shared_interest = (loan_amount × shared_ppm) / 1,000,000
\`\`\`

### Shared Interest by Duration

| Duration | shared_ppm | Shared Interest (per 1 SOL) |
|---|---|---|
${sharedTable}

:::note
The shared interest decreases slightly with longer durations because the linear interpolation formula is designed so that shorter loans pay a higher flat-rate surcharge. This is intentional — short-duration loans benefit more from the instant liquidity, so they carry a higher shared cost.
:::

### Total Interest

The total interest for a loan is the sum of all per-tick LP interest plus the shared interest:

\`\`\`
total_interest = Σ(tick_lp_interest for each tick) + shared_interest
\`\`\`

The shared interest is distributed to each participating tick proportionally to how much it contributed:

\`\`\`
tick_shared_part = shared_interest × (tick_borrow_amount / total_loan_amount)
tick_total_interest = tick_lp_interest + tick_shared_part
\`\`\`

## Complete Cost Examples

### Example 1: Small Loan — 0.5 SOL for 6 hours

Assuming the loan is fully funded from tick 0:

| Component | Calculation | Amount |
|---|---|---|
| Protocol Fee | Fixed | ${fmt(ex1.protocolFee)} SOL |
| Migration Reserve | ${migrationCalcStr(0.5, lc)} | ${fmt(ex1.migrationReserve)} SOL |
| Launch Overhead | Fixed (refundable) | ${fmt(ex1.launchOverhead)} SOL |
| LP Interest (tick 0) | 0.5 × ${cfg.hpppmMin} × 6 / 1,000,000 | ${fmt(ex1.lpInterest)} SOL |
| Shared Interest | 0.5 × ${computeSharedPpm(6, cfg).toLocaleString('en-US')} / 1,000,000 | ${fmt(ex1.sharedInterest)} SOL |
| **Total Cost** | | **${fmt(ex1.total)} SOL** |
| **Non-refundable Cost** | | **${fmt(ex1.nonRefundable)} SOL** |

### Example 2: Medium Loan — 2 SOL for 12 hours

Assuming the loan is funded from ticks 0–50 evenly:

| Component | Calculation | Amount |
|---|---|---|
| Protocol Fee | Fixed | ${fmt(ex2.protocolFee)} SOL |
| Migration Reserve | ${migrationCalcStr(2, lc)} | ${fmt(ex2.migrationReserve)} SOL |
| Launch Overhead | Fixed (refundable) | ${fmt(ex2.launchOverhead)} SOL |
| LP Interest (avg tick ~25) | 2 × ${Math.min(cfg.hpppmMax, cfg.hpppmMin + 25 * cfg.hpppmStep)} × 12 / 1,000,000 | ${fmt(ex2.lpInterest)} SOL |
| Shared Interest | 2 × ${computeSharedPpm(12, cfg).toLocaleString('en-US')} / 1,000,000 | ${fmt(ex2.sharedInterest)} SOL |
| **Total Cost** | | **${fmt(ex2.total)} SOL** |
| **Non-refundable Cost** | | **${fmt(ex2.nonRefundable)} SOL** |

### Example 3: Maximum Loan — 10 SOL for 24 hours

Assuming the loan is funded from ticks 0–200:

| Component | Calculation | Amount |
|---|---|---|
| Protocol Fee | Fixed | ${fmt(ex3.protocolFee)} SOL |
| Migration Reserve | ${migrationCalcStr(10, lc)} | ${fmt(ex3.migrationReserve)} SOL |
| Launch Overhead | Fixed (refundable) | ${fmt(ex3.launchOverhead)} SOL |
| LP Interest (avg tick ~100) | 10 × ${Math.min(cfg.hpppmMax, cfg.hpppmMin + 100 * cfg.hpppmStep)} × 24 / 1,000,000 | ${fmt(ex3.lpInterest)} SOL |
| Shared Interest | 10 × ${computeSharedPpm(24, cfg).toLocaleString('en-US')} / 1,000,000 | ${fmt(ex3.sharedInterest)} SOL |
| **Total Cost** | | **${fmt(ex3.total)} SOL** |
| **Non-refundable Cost** | | **${fmt(ex3.nonRefundable)} SOL** |

:::caution
The actual LP interest depends on which ticks have available liquidity at the time of borrowing. If lower ticks are depleted, the loan will be filled from higher ticks with higher interest rates, increasing the cost.
:::

## What Happens to Each Fee Component

| Component | Destination |
|---|---|
| LP Interest | Distributed to the specific LPs whose ticks funded the loan |
| Shared Interest | Distributed proportionally across all participating ticks |
| Protocol Fee | Protocol treasury |
| Migration Reserve | Held in escrow; used for Raydium migration or returned on repayment |
| Launch Overhead | Returned to borrower on loan closure |

## Liquidation Economics

When a loan expires without being repaid, anyone can liquidate it:

1. All collateral tokens (the tokens purchased on pump.fun) are sold on the bonding curve
2. The SOL proceeds are used to repay the borrowed amount to the liquidity pool
3. The migration reserve covers any shortfall if the token price dropped
4. Any excess SOL after full repayment goes to the liquidator as a reward

### Liquidation Scenarios

**Scenario A: Token price increased**
- Collateral is worth more than the borrowed amount
- LP is fully repaid
- Liquidator earns the excess as profit

**Scenario B: Token price decreased, but within reserve**
- Collateral sale doesn't fully cover the loan
- Migration reserve covers the shortfall
- LP is fully repaid
- Liquidator may earn a small reward or break even

**Scenario C: Token price crashed below reserve coverage**
- Collateral + migration reserve don't cover the full loan
- LP receives a partial repayment (loss)
- Liquidator earns nothing

:::note
The migration reserve acts as a buffer to protect LPs from moderate price declines in the launched token.
:::

## LP Earnings Model

LP earnings come from two sources:

1. **Direct LP interest** — earned based on the tick rate and loan duration
2. **Shared interest** — the protocol surcharge, distributed proportionally

### Share Valuation

When you open an LP position, your deposit is converted to **shares** at the current share price:

\`\`\`
shares = deposit_amount × tick_total_shares / (tick_balance + tick_borrowed)
\`\`\`

When you withdraw, your shares are converted back to SOL:

\`\`\`
withdrawal_amount = shares × (tick_balance + tick_borrowed) / tick_total_shares
\`\`\`

As interest accrues from repaid loans, the ratio \`(tick_balance + tick_borrowed) / tick_total_shares\` increases, meaning each share is worth more SOL. This is how LPs earn — the value of their shares grows over time as borrowers repay with interest.

### LP Withdrawal Constraints

You can only withdraw SOL that is **not currently lent out**:

\`\`\`
max_withdrawable_shares = (your_shares × tick_balance) / (tick_balance + tick_borrowed)
\`\`\`

If all liquidity in your tick is currently borrowed, you must wait until some loans are repaid or liquidated before you can withdraw.

## Configuration Parameters Reference

### Global Protocol Config

| Parameter | Value | Description |
|---|---|---|
| \`hpppm_min\` | ${cfg.hpppmMin} | Minimum hourly rate in ppm per tick |
| \`hpppm_max\` | ${cfg.hpppmMax} | Maximum hourly rate in ppm (rate cap) |
| \`hpppm_step\` | ${cfg.hpppmStep} | Rate increment per tick index |
| \`fpppm_min\` | ${cfg.fpppmMin.toLocaleString('en-US')} | Minimum fixed ppm for shared interest calculation |
| \`fpppm_max\` | ${cfg.fpppmMax.toLocaleString('en-US')} | Maximum fixed ppm (reserved for future use) |
| \`interval_min\` | ${cfg.intervalMin} | Minimum loan duration in hours |
| \`interval_max\` | ${cfg.intervalMax} | Maximum loan duration in hours (used in formula) |
| \`registration_fee\` | ${regFeeSol} SOL | One-time user profile registration fee |

### Pump.fun + WSOL Launch Configuration

| Parameter | Value | Description |
|---|---|---|
| \`quote_amount_min\` | ${minAmount} SOL | Minimum loan amount |
| \`quote_amount_max\` | ${maxAmount} SOL | Maximum loan amount |
| \`loan_interval_min\` | ${minInterval} hour${minInterval > 1 ? 's' : ''} | Minimum loan duration |
| \`loan_interval_max\` | ${maxInterval} hours | Maximum loan duration |
| \`quote_launch_fixed_cost\` | ${lamportsToSol(lc.quoteLaunchFixedCost)} SOL | Protocol fee (fixed component) |
| \`quote_launch_ppm_cost\` | ${lc.quoteLaunchPpmCost} | Protocol fee (ppm component) |
| \`quote_launch_fixed_overhead_refundable\` | ${launchOverheadSol} SOL | Refundable launch overhead |
| \`quote_migration_fixed_cost\` | ${lamportsToSol(lc.quoteMigrationFixedCost)} SOL | Migration reserve (fixed component) |
| \`quote_migration_ppm_cost\` | ${lc.quoteMigrationPpmCost} | Migration reserve (ppm component${lc.quoteMigrationPpmCost > 0 ? `, ${Number(lc.quoteMigrationPpmCost) / 10_000}%` : ''}) |
| \`quote_migration_threshold\` | ${lamportsToSol(lc.quoteMigrationThreshold)} SOL | Migration threshold |
`;
}

function generateEconomicsRU(cfg, lc, configLastChanged) {
  const protocolFeeSol = lamportsToSol(lc.quoteLaunchFixedCost);
  const launchOverheadSol = lamportsToSol(lc.quoteLaunchFixedOverheadRefundable);
  const regFeeSol = lamportsToSol(cfg.registrationFeeLamports);
  const minAmount = lamportsToSol(lc.quoteAmountMin);
  const maxAmount = lamportsToSol(lc.quoteAmountMax);
  const minInterval = Number(lc.loanIntervalMin);
  const maxInterval = Number(lc.loanIntervalMax);

  const migReserveExamples = [0.1, 0.5, 1, 5, 10]
    .filter(a => a >= minAmount && a <= maxAmount)
    .map(a => {
      const r = lamportsToSol(computeMigrationReserve(BigInt(Math.round(a * 1e9)), lc));
      return `| ${a} SOL | ${fmt(r)} SOL |`;
    })
    .join('\n');

  const tickTable = [0, 10, 50, 100, 250, 500, 1023].map(t => {
    const rate = Math.min(cfg.hpppmMax, cfg.hpppmMin + t * cfg.hpppmStep);
    return `| ${t}${t === 1023 ? ' (макс.)' : ''} | ${rate} | ${(rate / 10_000).toFixed(4)}% | ${(rate / 1e9).toFixed(6)} SOL |`;
  }).join('\n');

  const hourLabel = (h) => {
    if (h === 1) return '1 час';
    if (h < 5) return `${h} часа`;
    return `${h} часов`;
  };

  const sharedTable = [1, 2, 6, 12, 24].filter(h => h >= minInterval && h <= maxInterval).map(h => {
    const ppm = computeSharedPpm(h, cfg);
    return `| ${hourLabel(h)} | ${ppm.toLocaleString('ru-RU')} | ${fmt(ppm / 1e6)} SOL |`;
  }).join('\n');

  const ex1 = computeExample(0.5, 6, 0, cfg, lc);
  const ex2 = computeExample(2, 12, 25, cfg, lc);
  const ex3 = computeExample(10, 24, 100, cfg, lc);

  const migCalcStrRu = (amountSol) => {
    const fixedSol = lamportsToSol(lc.quoteMigrationFixedCost);
    const ppmPct = Number(lc.quoteMigrationPpmCost) / 10_000;
    if (lc.quoteMigrationPpmCost > 0 && lc.quoteMigrationFixedCost > 0n) {
      return `${fixedSol} + ${amountSol} × ${ppmPct}%`;
    }
    if (lc.quoteMigrationPpmCost > 0) {
      return `${amountSol} × ${ppmPct}%`;
    }
    return `${amountSol} × ${fixedSol} / ${lamportsToSol(lc.quoteMigrationThreshold)}`;
  };

  return `---
title: Экономика
description: Подробное описание комиссий, процентных ставок и экономической модели Moono Protocol с примерами расчётов.
---

{/* Этот файл автоматически сгенерирован скриптом scripts/sync-config.mjs из on-chain данных mainnet. Не редактируйте вручную. */}

На этой странице описана экономическая модель Moono Protocol, включая все комиссии, процентные ставки и порядок расчёта стоимости для заёмщиков и доходности для поставщиков ликвидности.

Все значения получены из текущей конфигурации **mainnet** on-chain.

:::tip[Последнее обновление]
Конфигурация изменена: **${configLastChanged}**. Значения синхронизируются автоматически из on-chain данных при сборке.
:::

## Обзор расходов

При оформлении займа общая стоимость складывается из нескольких компонентов:

| Компонент | Описание |
|---|---|
| **LP-проценты** | Проценты, выплачиваемые поставщикам ликвидности; зависят от ставки тика и срока займа |
| **Общие проценты (shared interest)** | Дополнительная протокольная надбавка, распределяемая между всеми участвующими тиками |
| **Комиссия протокола** | Комиссия за каждый запуск |
| **Резерв на миграцию** | SOL, зарезервированный для возможной миграции на Raydium |
| **Накладные расходы на запуск** | Возвратный депозит на покрытие транзакционных расходов |

## Параметры займа

| Параметр | Значение |
|---|---|
| Минимальная сумма займа | ${minAmount} SOL |
| Максимальная сумма займа | ${maxAmount} SOL |
| Минимальный срок займа | ${hourLabel(minInterval)} |
| Максимальный срок займа | ${hourLabel(maxInterval)} |

## Комиссия протокола

Комиссия взимается с каждого займа:

\`\`\`
Комиссия протокола = ${protocolFeeFormula(lc)}
\`\`\`

Эта комиссия поступает в казну протокола.

## Резерв на миграцию

Часть займа резервируется для покрытия расходов на возможную миграцию токена на Raydium (когда кривая связывания на pump.fun завершается):

\`\`\`
Резерв на миграцию = ${migrationReserveFormulaRu(lc)}
\`\`\`

### Примеры резерва на миграцию

| Сумма займа | Резерв на миграцию |
|---|---|
${migReserveExamples}

Резерв на миграцию используется для обеспечения ликвидности на Raydium, если кривая связывания токена завершится. Если займ погашен до миграции, резерв возвращается в рамках расчёта.

## Накладные расходы на запуск (возвратные)

Небольшой возвратный депозит взимается для покрытия транзакционных комиссий Solana и аренды:

\`\`\`
Накладные расходы = ${launchOverheadSol} SOL
\`\`\`

Эта сумма возвращается заёмщику при закрытии займа (погашение или ликвидация).

## Модель процентных ставок

Moono Protocol использует **многоуровневую модель ликвидности** с 1 024 тиками (уровнями риска). У каждого тика своя процентная ставка, и займы заполняются начиная с самого низкого тика.

### Как работают тики

- В протоколе **1 024 тика**, пронумерованных от 0 до 1 023
- Каждый тик представляет пул ликвидности с определённой процентной ставкой
- Низкие тики имеют низкие ставки; высокие тики — высокие ставки
- При оформлении займа ликвидность берётся начиная с тика 0 и далее вверх
- LP выбирают тик для депозита исходя из желаемого соотношения риск/доходность

### Процентная ставка тика

У каждого тика есть почасовая ставка, выраженная в **частях на миллион (ppm)**:

\`\`\`
почасовая_ставка_тика_ppm = min(${cfg.hpppmMax}, ${cfg.hpppmMin} + индекс_тика × ${cfg.hpppmStep})
\`\`\`

| Индекс тика | Почасовая ставка (ppm) | Почасовая ставка (%) | Ставка для 1 SOL в час |
|---|---|---|---|
${tickTable}

### Расчёт LP-процентов по тику

Для каждого тика, участвующего в финансировании займа:

\`\`\`
lp_проценты_тика = (сумма_займа_из_тика × почасовая_ставка_тика_ppm × срок_займа_часы) / 1 000 000
\`\`\`

**Пример:** Займ берёт 0.5 SOL из тика 100 на 12 часов:

\`\`\`
lp_проценты_тика = (0.5 × ${Math.min(cfg.hpppmMax, cfg.hpppmMin + 100 * cfg.hpppmStep)} × 12) / 1 000 000
                 = ${0.5 * Math.min(cfg.hpppmMax, cfg.hpppmMin + 100 * cfg.hpppmStep) * 12} / 1 000 000
                 = ${fmt(0.5 * Math.min(cfg.hpppmMax, cfg.hpppmMin + 100 * cfg.hpppmStep) * 12 / 1e6, 6)} SOL
\`\`\`

### Общие проценты (протокольная надбавка)

Помимо LP-процентов по тикам, существует компонент **общих процентов** — глобальная надбавка, которая распределяется пропорционально между всеми тиками, участвующими в займе. Формула использует линейную интерполяцию:

\`\`\`
shared_ppm = hpppm_min × interval + (fpppm_min - hpppm_min × interval_min) × (interval_max - interval) / (interval_max - interval_min)
\`\`\`

С текущими параметрами mainnet:

\`\`\`
hpppm_min = ${cfg.hpppmMin}
fpppm_min = ${cfg.fpppmMin.toLocaleString('ru-RU')}
interval_min = ${cfg.intervalMin} час
interval_max = ${cfg.intervalMax} часов

shared_ppm = ${cfg.hpppmMin} × interval + (${cfg.fpppmMin.toLocaleString('ru-RU')} - ${cfg.hpppmMin} × ${cfg.intervalMin}) × (${cfg.intervalMax} - interval) / (${cfg.intervalMax} - ${cfg.intervalMin})
\`\`\`

Затем:

\`\`\`
общие_проценты = (сумма_займа × shared_ppm) / 1 000 000
\`\`\`

### Общие проценты по длительности

| Срок | shared_ppm | Общие проценты (на 1 SOL) |
|---|---|---|
${sharedTable}

:::note
Общие проценты немного снижаются при увеличении срока, поскольку формула линейной интерполяции спроектирована так, что короткие займы платят более высокую фиксированную надбавку. Это сделано намеренно — краткосрочные займы больше выигрывают от мгновенной ликвидности, поэтому несут более высокую общую стоимость.
:::

### Итого проценты

Общая сумма процентов по займу — это сумма LP-процентов по всем тикам плюс общие проценты:

\`\`\`
итого_проценты = Σ(lp_проценты_тика для каждого тика) + общие_проценты
\`\`\`

Общие проценты распределяются по каждому участвующему тику пропорционально его вкладу:

\`\`\`
доля_общих_процентов_тика = общие_проценты × (сумма_займа_из_тика / общая_сумма_займа)
итого_проценты_тика = lp_проценты_тика + доля_общих_процентов_тика
\`\`\`

## Полные примеры расчёта стоимости

### Пример 1: Малый займ — 0.5 SOL на 6 часов

При условии, что займ полностью обеспечен из тика 0:

| Компонент | Расчёт | Сумма |
|---|---|---|
| Комиссия протокола | Фиксированная | ${fmt(ex1.protocolFee)} SOL |
| Резерв на миграцию | ${migCalcStrRu(0.5)} | ${fmt(ex1.migrationReserve)} SOL |
| Накладные расходы | Фиксированные (возвратные) | ${fmt(ex1.launchOverhead)} SOL |
| LP-проценты (тик 0) | 0.5 × ${cfg.hpppmMin} × 6 / 1 000 000 | ${fmt(ex1.lpInterest)} SOL |
| Общие проценты | 0.5 × ${computeSharedPpm(6, cfg).toLocaleString('ru-RU')} / 1 000 000 | ${fmt(ex1.sharedInterest)} SOL |
| **Итого** | | **${fmt(ex1.total)} SOL** |
| **Невозвратная стоимость** | | **${fmt(ex1.nonRefundable)} SOL** |

### Пример 2: Средний займ — 2 SOL на 12 часов

При условии, что займ обеспечен из тиков 0–50 равномерно:

| Компонент | Расчёт | Сумма |
|---|---|---|
| Комиссия протокола | Фиксированная | ${fmt(ex2.protocolFee)} SOL |
| Резерв на миграцию | ${migCalcStrRu(2)} | ${fmt(ex2.migrationReserve)} SOL |
| Накладные расходы | Фиксированные (возвратные) | ${fmt(ex2.launchOverhead)} SOL |
| LP-проценты (средний тик ~25) | 2 × ${Math.min(cfg.hpppmMax, cfg.hpppmMin + 25 * cfg.hpppmStep)} × 12 / 1 000 000 | ${fmt(ex2.lpInterest)} SOL |
| Общие проценты | 2 × ${computeSharedPpm(12, cfg).toLocaleString('ru-RU')} / 1 000 000 | ${fmt(ex2.sharedInterest)} SOL |
| **Итого** | | **${fmt(ex2.total)} SOL** |
| **Невозвратная стоимость** | | **${fmt(ex2.nonRefundable)} SOL** |

### Пример 3: Максимальный займ — 10 SOL на 24 часа

При условии, что займ обеспечен из тиков 0–200:

| Компонент | Расчёт | Сумма |
|---|---|---|
| Комиссия протокола | Фиксированная | ${fmt(ex3.protocolFee)} SOL |
| Резерв на миграцию | ${migCalcStrRu(10)} | ${fmt(ex3.migrationReserve)} SOL |
| Накладные расходы | Фиксированные (возвратные) | ${fmt(ex3.launchOverhead)} SOL |
| LP-проценты (средний тик ~100) | 10 × ${Math.min(cfg.hpppmMax, cfg.hpppmMin + 100 * cfg.hpppmStep)} × 24 / 1 000 000 | ${fmt(ex3.lpInterest)} SOL |
| Общие проценты | 10 × ${computeSharedPpm(24, cfg).toLocaleString('ru-RU')} / 1 000 000 | ${fmt(ex3.sharedInterest)} SOL |
| **Итого** | | **${fmt(ex3.total)} SOL** |
| **Невозвратная стоимость** | | **${fmt(ex3.nonRefundable)} SOL** |

:::caution
Фактические LP-проценты зависят от того, в каких тиках есть свободная ликвидность в момент оформления займа. Если низкие тики исчерпаны, займ будет обеспечен из более высоких тиков с более высокими ставками, что увеличит стоимость.
:::

## Куда направляется каждый компонент

| Компонент | Получатель |
|---|---|
| LP-проценты | Распределяются конкретным LP, чьи тики обеспечили займ |
| Общие проценты | Пропорционально распределяются между всеми участвующими тиками |
| Комиссия протокола | Казна протокола |
| Резерв на миграцию | Удерживается в эскроу; используется для миграции на Raydium или возвращается при погашении |
| Накладные расходы | Возвращаются заёмщику при закрытии займа |

## Экономика ликвидации

Когда срок займа истекает без погашения, любой может его ликвидировать:

1. Все залоговые токены (токены, купленные на pump.fun) продаются на кривой связывания
2. Полученные SOL направляются на погашение заёмной суммы в пул ликвидности
3. Резерв на миграцию покрывает недостачу, если цена токена упала
4. Любой излишек SOL после полного погашения достаётся ликвидатору как вознаграждение

### Сценарии ликвидации

**Сценарий А: Цена токена выросла**
- Залог стоит больше заёмной суммы
- LP получает полное погашение
- Ликвидатор зарабатывает излишек как прибыль

**Сценарий Б: Цена токена снизилась, но в пределах резерва**
- Продажа залога не покрывает полностью займ
- Резерв на миграцию покрывает недостачу
- LP получает полное погашение
- Ликвидатор может получить небольшое вознаграждение или выйти в ноль

**Сценарий В: Цена токена обвалилась ниже покрытия резервом**
- Залог + резерв на миграцию не покрывают полный займ
- LP получает частичное погашение (убыток)
- Ликвидатор ничего не зарабатывает

:::note
Резерв на миграцию выступает буфером для защиты LP от умеренного снижения цены запущенного токена.
:::

## Модель доходности LP

Доход LP складывается из двух источников:

1. **Прямые LP-проценты** — заработок на основе ставки тика и срока займа
2. **Общие проценты** — протокольная надбавка, распределяемая пропорционально

### Оценка доли (share)

При открытии LP-позиции ваш депозит конвертируется в **доли** по текущей цене доли:

\`\`\`
доли = сумма_депозита × всего_долей_тика / (баланс_тика + заёмная_сумма_тика)
\`\`\`

При выводе ваши доли конвертируются обратно в SOL:

\`\`\`
сумма_вывода = доли × (баланс_тика + заёмная_сумма_тика) / всего_долей_тика
\`\`\`

По мере накопления процентов от погашенных займов соотношение \`(баланс_тика + заёмная_сумма_тика) / всего_долей_тика\` растёт, то есть каждая доля стоит больше SOL. Именно так LP зарабатывают — стоимость их долей растёт со временем по мере погашения займов с процентами.

### Ограничения на вывод LP

Вы можете вывести только SOL, который **не находится в активном займе**:

\`\`\`
макс_выводимых_долей = (ваши_доли × баланс_тика) / (баланс_тика + заёмная_сумма_тика)
\`\`\`

Если вся ликвидность в вашем тике в данный момент выдана в займ, вам нужно дождаться погашения или ликвидации займов, прежде чем вы сможете вывести средства.

## Справочник параметров конфигурации

### Глобальная конфигурация протокола

| Параметр | Значение | Описание |
|---|---|---|
| \`hpppm_min\` | ${cfg.hpppmMin} | Минимальная почасовая ставка в ppm на тик |
| \`hpppm_max\` | ${cfg.hpppmMax} | Максимальная почасовая ставка в ppm (потолок) |
| \`hpppm_step\` | ${cfg.hpppmStep} | Приращение ставки на каждый индекс тика |
| \`fpppm_min\` | ${cfg.fpppmMin.toLocaleString('ru-RU')} | Минимальный фиксированный ppm для расчёта общих процентов |
| \`fpppm_max\` | ${cfg.fpppmMax.toLocaleString('ru-RU')} | Максимальный фиксированный ppm (зарезервирован) |
| \`interval_min\` | ${cfg.intervalMin} | Минимальный срок займа в часах |
| \`interval_max\` | ${cfg.intervalMax} | Максимальный срок займа в часах (используется в формуле) |
| \`registration_fee\` | ${regFeeSol} SOL | Единоразовая комиссия за регистрацию профиля |

### Конфигурация запуска Pump.fun + WSOL

| Параметр | Значение | Описание |
|---|---|---|
| \`quote_amount_min\` | ${minAmount} SOL | Минимальная сумма займа |
| \`quote_amount_max\` | ${maxAmount} SOL | Максимальная сумма займа |
| \`loan_interval_min\` | ${hourLabel(minInterval)} | Минимальный срок займа |
| \`loan_interval_max\` | ${hourLabel(maxInterval)} | Максимальный срок займа |
| \`quote_launch_fixed_cost\` | ${lamportsToSol(lc.quoteLaunchFixedCost)} SOL | Комиссия протокола (фиксированная часть) |
| \`quote_launch_ppm_cost\` | ${lc.quoteLaunchPpmCost} | Комиссия протокола (ppm часть) |
| \`quote_launch_fixed_overhead_refundable\` | ${launchOverheadSol} SOL | Возвратные накладные расходы |
| \`quote_migration_fixed_cost\` | ${lamportsToSol(lc.quoteMigrationFixedCost)} SOL | Резерв на миграцию (фиксированная часть) |
| \`quote_migration_ppm_cost\` | ${lc.quoteMigrationPpmCost} | Резерв на миграцию (ppm часть${lc.quoteMigrationPpmCost > 0 ? `, ${Number(lc.quoteMigrationPpmCost) / 10_000}%` : ''}) |
| \`quote_migration_threshold\` | ${lamportsToSol(lc.quoteMigrationThreshold)} SOL | Порог миграции |
`;
}

// ── Config change tracking ──────────────────────────────────────────────────

/** Build a fingerprint of all config values that affect economics calculations. */
function configFingerprint(cfg, lc) {
  return JSON.stringify({
    hpppmMin: cfg.hpppmMin, hpppmMax: cfg.hpppmMax, hpppmStep: cfg.hpppmStep,
    fpppmMin: cfg.fpppmMin, fpppmMax: cfg.fpppmMax,
    intervalMin: cfg.intervalMin, intervalMax: cfg.intervalMax,
    registrationFeeLamports: cfg.registrationFeeLamports.toString(),
    quoteAmountMin: lc.quoteAmountMin.toString(),
    quoteAmountMax: lc.quoteAmountMax.toString(),
    loanIntervalMin: lc.loanIntervalMin.toString(),
    loanIntervalMax: lc.loanIntervalMax.toString(),
    quoteLaunchFixedCost: lc.quoteLaunchFixedCost.toString(),
    quoteLaunchPpmCost: lc.quoteLaunchPpmCost,
    quoteLaunchFixedOverheadRefundable: lc.quoteLaunchFixedOverheadRefundable.toString(),
    quoteMigrationFixedCost: lc.quoteMigrationFixedCost.toString(),
    quoteMigrationThreshold: lc.quoteMigrationThreshold.toString(),
    quoteMigrationPpmCost: lc.quoteMigrationPpmCost,
  });
}

/**
 * Reads previous config JSON and returns the last-changed date.
 * If the fingerprint changed, returns today's date.
 */
function resolveConfigDate(cfg, lc, jsonPath) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const newFingerprint = configFingerprint(cfg, lc);

  if (existsSync(jsonPath)) {
    try {
      const prev = JSON.parse(readFileSync(jsonPath, 'utf8'));
      if (prev._fingerprint === newFingerprint && prev._configLastChanged) {
        return prev._configLastChanged; // unchanged — keep old date
      }
    } catch { /* ignore parse errors, treat as changed */ }
  }

  console.log('  Config values changed — updating last-changed date to', today);
  return today; // changed or first run
}

// ── Also generate a summary JSON for other pages to reference if needed ──────

function generateConfigJson(cfg, lc, configLastChanged) {
  return JSON.stringify({
    _generatedAt: new Date().toISOString(),
    _configLastChanged: configLastChanged,
    _fingerprint: configFingerprint(cfg, lc),
    _source: 'Solana mainnet',
    config: {
      hpppmMin: cfg.hpppmMin,
      hpppmMax: cfg.hpppmMax,
      hpppmStep: cfg.hpppmStep,
      fpppmMin: cfg.fpppmMin,
      fpppmMax: cfg.fpppmMax,
      intervalMin: cfg.intervalMin,
      intervalMax: cfg.intervalMax,
      registrationFeeLamports: cfg.registrationFeeLamports.toString(),
      registrationFeeSol: lamportsToSol(cfg.registrationFeeLamports),
    },
    launchConfiguration: {
      quoteAmountMinLamports: lc.quoteAmountMin.toString(),
      quoteAmountMaxLamports: lc.quoteAmountMax.toString(),
      quoteAmountMinSol: lamportsToSol(lc.quoteAmountMin),
      quoteAmountMaxSol: lamportsToSol(lc.quoteAmountMax),
      loanIntervalMin: Number(lc.loanIntervalMin),
      loanIntervalMax: Number(lc.loanIntervalMax),
      quoteLaunchFixedCostLamports: lc.quoteLaunchFixedCost.toString(),
      quoteLaunchFixedCostSol: lamportsToSol(lc.quoteLaunchFixedCost),
      quoteLaunchPpmCost: lc.quoteLaunchPpmCost,
      quoteLaunchFixedOverheadRefundableLamports: lc.quoteLaunchFixedOverheadRefundable.toString(),
      quoteLaunchFixedOverheadRefundableSol: lamportsToSol(lc.quoteLaunchFixedOverheadRefundable),
      quoteMigrationFixedCostLamports: lc.quoteMigrationFixedCost.toString(),
      quoteMigrationFixedCostSol: lamportsToSol(lc.quoteMigrationFixedCost),
      quoteMigrationThresholdLamports: lc.quoteMigrationThreshold.toString(),
      quoteMigrationThresholdSol: lamportsToSol(lc.quoteMigrationThreshold),
      quoteMigrationPpmCost: lc.quoteMigrationPpmCost,
      platform: lc.platform,
    },
  }, null, 2);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Log RPC host only (no path/credentials)
  const rpcHost = new URL(RPC_URL).host;
  console.log(`Connecting to ${rpcHost}...`);
  const connection = new Connection(RPC_URL, 'confirmed');

  console.log(`Fetching Config (${CONFIG_PDA.toBase58()})...`);
  const configAccount = await connection.getAccountInfo(CONFIG_PDA);
  if (!configAccount) throw new Error('Config account not found on mainnet');
  const cfg = parseConfig(configAccount.data);

  console.log(`Fetching LaunchConfiguration #0 (${LAUNCH_CONFIG_PDA.toBase58()})...`);
  const lcAccount = await connection.getAccountInfo(LAUNCH_CONFIG_PDA);
  if (!lcAccount) throw new Error('LaunchConfiguration account not found on mainnet');
  const lc = parseLaunchConfiguration(lcAccount.data);

  console.log('\nOn-chain Config:');
  console.log(`  hpppm: min=${cfg.hpppmMin} max=${cfg.hpppmMax} step=${cfg.hpppmStep}`);
  console.log(`  fpppm: min=${cfg.fpppmMin} max=${cfg.fpppmMax}`);
  console.log(`  interval: min=${cfg.intervalMin}h max=${cfg.intervalMax}h`);
  console.log(`  registration_fee: ${lamportsToSol(cfg.registrationFeeLamports)} SOL`);
  console.log('\nOn-chain LaunchConfiguration:');
  console.log(`  amount: min=${lamportsToSol(lc.quoteAmountMin)} max=${lamportsToSol(lc.quoteAmountMax)} SOL`);
  console.log(`  interval: min=${lc.loanIntervalMin}h max=${lc.loanIntervalMax}h`);
  console.log(`  launch_fixed_cost: ${lamportsToSol(lc.quoteLaunchFixedCost)} SOL`);
  console.log(`  launch_ppm_cost: ${lc.quoteLaunchPpmCost}`);
  console.log(`  migration_fixed_cost: ${lamportsToSol(lc.quoteMigrationFixedCost)} SOL`);
  console.log(`  migration_ppm_cost: ${lc.quoteMigrationPpmCost}`);
  console.log(`  migration_threshold: ${lamportsToSol(lc.quoteMigrationThreshold)} SOL`);
  console.log(`  overhead_refundable: ${lamportsToSol(lc.quoteLaunchFixedOverheadRefundable)} SOL`);

  // Resolve config change date
  const jsonPath = join(ROOT, 'src', 'data', 'protocol-config.json');
  mkdirSync(dirname(jsonPath), { recursive: true });
  const configLastChanged = resolveConfigDate(cfg, lc, jsonPath);
  console.log(`\nConfig last changed: ${configLastChanged}`);

  // Write JSON
  writeFileSync(jsonPath, generateConfigJson(cfg, lc, configLastChanged) + '\n');
  console.log(`Wrote ${jsonPath}`);

  // Write economics pages (as .mdx to support the comment syntax)
  const enPath = join(ROOT, 'src', 'content', 'docs', 'getting-started', 'economics.mdx');
  writeFileSync(enPath, generateEconomicsEN(cfg, lc, configLastChanged));
  console.log(`Wrote ${enPath}`);

  const ruPath = join(ROOT, 'src', 'content', 'docs', 'ru', 'getting-started', 'economics.mdx');
  writeFileSync(ruPath, generateEconomicsRU(cfg, lc, configLastChanged));
  console.log(`Wrote ${ruPath}`);

  console.log('\nDone! Economics pages generated from mainnet data.');
}

main().catch((err) => {
  console.error('Failed to sync config:', err.message);
  process.exit(1);
});
