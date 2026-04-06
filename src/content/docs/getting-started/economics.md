---
title: Economics
description: Detailed breakdown of Moono Protocol fees, interest rates, and economic model with calculation examples.
---

This page explains how Moono Protocol's economic model works, including all fees, interest rates, and how costs are calculated for borrowers and earnings for liquidity providers.

All values described here are based on the current mainnet configuration.

## Overview of Costs

When a borrower takes a loan, the total cost consists of several components:

| Component | Description |
|---|---|
| **LP Interest** | Interest paid to liquidity providers, determined by tick rates and loan duration |
| **Shared Interest** | Additional protocol-wide interest surcharge distributed to all participating ticks |
| **Protocol Fee** | Fixed fee charged by the protocol for each launch |
| **Migration Reserve** | SOL reserved for potential Raydium migration, proportional to loan size |
| **Launch Overhead** | Refundable overhead to cover transaction costs |

## Loan Parameters

| Parameter | Value |
|---|---|
| Minimum loan amount | 0.1 SOL |
| Maximum loan amount | 10 SOL |
| Minimum loan duration | 1 hour |
| Maximum loan duration | 24 hours |

## Protocol Fee

A fixed fee is charged on every loan:

```
Protocol Fee = 0.05 SOL
```

This fee goes to the protocol treasury and does not depend on the loan amount or duration.

## Migration Reserve

A portion of the loan is reserved to cover the cost of potential token migration to Raydium (when the bonding curve completes on pump.fun). The reserve is proportional to the loan size:

```
Migration Reserve = (min(loan_amount, 85 SOL) × 12 SOL) / 85 SOL
```

Since the maximum loan amount is 10 SOL, in practice:

```
Migration Reserve = (loan_amount × 12) / 85
```

### Migration Reserve Examples

| Loan Amount | Migration Reserve |
|---|---|
| 0.1 SOL | ~0.0141 SOL |
| 0.5 SOL | ~0.0706 SOL |
| 1 SOL | ~0.1412 SOL |
| 5 SOL | ~0.7059 SOL |
| 10 SOL | ~1.4118 SOL |

The migration reserve is used to provide liquidity on Raydium if the token's bonding curve completes. If the loan is repaid before migration happens, the reserve is returned as part of the settlement.

## Launch Overhead (Refundable)

A small refundable overhead is charged to cover Solana transaction fees and rent:

```
Launch Overhead = 0.01 SOL
```

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

```
tick_hourly_rate_ppm = min(2048, 2 + tick_index × 2)
```

| Tick Index | Hourly Rate (ppm) | Hourly Rate (%) | Rate for 1 SOL per hour |
|---|---|---|---|
| 0 | 2 | 0.0002% | 0.000002 SOL |
| 10 | 22 | 0.0022% | 0.000022 SOL |
| 50 | 102 | 0.0102% | 0.000102 SOL |
| 100 | 202 | 0.0202% | 0.000202 SOL |
| 250 | 502 | 0.0502% | 0.000502 SOL |
| 500 | 1002 | 0.1002% | 0.001002 SOL |
| 1023 (max) | 2048 | 0.2048% | 0.002048 SOL |

### Per-Tick LP Interest Calculation

For each tick that contributes to funding a loan:

```
tick_lp_interest = (tick_borrow_amount × tick_hourly_rate_ppm × loan_duration_hours) / 1,000,000
```

**Example:** A loan borrows 0.5 SOL from tick 100 for 12 hours:

```
tick_lp_interest = (0.5 × 202 × 12) / 1,000,000
                 = 1,212 / 1,000,000
                 = 0.001212 SOL
```

### Shared Interest (Protocol Surcharge)

In addition to per-tick LP interest, there is a **shared interest** component — a global surcharge that is distributed proportionally across all ticks participating in the loan. The formula uses a linear interpolation:

```
shared_ppm = hpppm_min × interval + (fpppm_min - hpppm_min × interval_min) × (interval_max - interval) / (interval_max - interval_min)
```

With current mainnet parameters:

```
hpppm_min = 2
fpppm_min = 50,000
interval_min = 1 hour
interval_max = 720 hours

shared_ppm = 2 × interval + (50,000 - 2 × 1) × (720 - interval) / (720 - 1)
           = 2 × interval + 49,998 × (720 - interval) / 719
```

Then:

```
shared_interest = (loan_amount × shared_ppm) / 1,000,000
```

### Shared Interest by Duration

| Duration | shared_ppm | Shared Interest (per 1 SOL) |
|---|---|---|
| 1 hour | 49,998 | 0.0500 SOL |
| 2 hours | 49,928 | 0.0499 SOL |
| 6 hours | 49,583 | 0.0496 SOL |
| 12 hours | 48,749 | 0.0487 SOL |
| 24 hours | 47,049 | 0.0470 SOL |

:::note
The shared interest decreases slightly with longer durations because the linear interpolation formula is designed so that shorter loans pay a higher flat-rate surcharge. This is intentional — short-duration loans benefit more from the instant liquidity, so they carry a higher shared cost.
:::

### Total Interest

The total interest for a loan is the sum of all per-tick LP interest plus the shared interest:

```
total_interest = Σ(tick_lp_interest for each tick) + shared_interest
```

The shared interest is distributed to each participating tick proportionally to how much it contributed:

```
tick_shared_part = shared_interest × (tick_borrow_amount / total_loan_amount)
tick_total_interest = tick_lp_interest + tick_shared_part
```

## Complete Cost Examples

### Example 1: Small Loan — 0.5 SOL for 6 hours

Assuming the loan is fully funded from tick 0:

| Component | Calculation | Amount |
|---|---|---|
| Protocol Fee | Fixed | 0.0500 SOL |
| Migration Reserve | 0.5 × 12 / 85 | 0.0706 SOL |
| Launch Overhead | Fixed (refundable) | 0.0100 SOL |
| LP Interest (tick 0) | 0.5 × 2 × 6 / 1,000,000 | 0.0000 SOL |
| Shared Interest | 0.5 × 49,583 / 1,000,000 | 0.0248 SOL |
| **Total Cost** | | **0.1554 SOL** |
| **Non-refundable Cost** | | **0.1454 SOL** |

### Example 2: Medium Loan — 2 SOL for 12 hours

Assuming the loan is funded from ticks 0–50 evenly:

| Component | Calculation | Amount |
|---|---|---|
| Protocol Fee | Fixed | 0.0500 SOL |
| Migration Reserve | 2 × 12 / 85 | 0.2824 SOL |
| Launch Overhead | Fixed (refundable) | 0.0100 SOL |
| LP Interest (avg tick ~25) | 2 × 52 × 12 / 1,000,000 | 0.0012 SOL |
| Shared Interest | 2 × 48,749 / 1,000,000 | 0.0975 SOL |
| **Total Cost** | | **0.4411 SOL** |
| **Non-refundable Cost** | | **0.4311 SOL** |

### Example 3: Maximum Loan — 10 SOL for 24 hours

Assuming the loan is funded from ticks 0–200:

| Component | Calculation | Amount |
|---|---|---|
| Protocol Fee | Fixed | 0.0500 SOL |
| Migration Reserve | 10 × 12 / 85 | 1.4118 SOL |
| Launch Overhead | Fixed (refundable) | 0.0100 SOL |
| LP Interest (avg tick ~100) | 10 × 202 × 24 / 1,000,000 | 0.0485 SOL |
| Shared Interest | 10 × 47,049 / 1,000,000 | 0.4705 SOL |
| **Total Cost** | | **1.9908 SOL** |
| **Non-refundable Cost** | | **1.9808 SOL** |

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
The migration reserve (up to ~14.1% of the loan amount) acts as a buffer to protect LPs from moderate price declines in the launched token.
:::

## LP Earnings Model

LP earnings come from two sources:

1. **Direct LP interest** — earned based on the tick rate and loan duration
2. **Shared interest** — the protocol surcharge, distributed proportionally

### Share Valuation

When you open an LP position, your deposit is converted to **shares** at the current share price:

```
shares = deposit_amount × tick_total_shares / (tick_balance + tick_borrowed)
```

When you withdraw, your shares are converted back to SOL:

```
withdrawal_amount = shares × (tick_balance + tick_borrowed) / tick_total_shares
```

As interest accrues from repaid loans, the ratio `(tick_balance + tick_borrowed) / tick_total_shares` increases, meaning each share is worth more SOL. This is how LPs earn — the value of their shares grows over time as borrowers repay with interest.

### LP Withdrawal Constraints

You can only withdraw SOL that is **not currently lent out**:

```
max_withdrawable_shares = (your_shares × tick_balance) / (tick_balance + tick_borrowed)
```

If all liquidity in your tick is currently borrowed, you must wait until some loans are repaid or liquidated before you can withdraw.

## Configuration Parameters Reference

### Global Protocol Config

| Parameter | Value | Description |
|---|---|---|
| `hpppm_min` | 2 | Minimum hourly rate in ppm per tick |
| `hpppm_max` | 2048 | Maximum hourly rate in ppm (rate cap) |
| `hpppm_step` | 2 | Rate increment per tick index |
| `fpppm_min` | 50,000 | Minimum fixed ppm for shared interest calculation |
| `fpppm_max` | 70,000 | Maximum fixed ppm (reserved for future use) |
| `interval_min` | 1 | Minimum loan duration in hours |
| `interval_max` | 720 | Maximum loan duration in hours (used in formula) |
| `registration_fee` | 0.01 SOL | One-time user profile registration fee |

### Pump.fun + WSOL Launch Configuration

| Parameter | Value | Description |
|---|---|---|
| `quote_amount_min` | 0.1 SOL | Minimum loan amount |
| `quote_amount_max` | 10 SOL | Maximum loan amount |
| `loan_interval_min` | 1 hour | Minimum loan duration |
| `loan_interval_max` | 24 hours | Maximum loan duration |
| `quote_launch_fixed_cost` | 0.05 SOL | Protocol fee per launch |
| `quote_launch_fixed_overhead_refundable` | 0.01 SOL | Refundable launch overhead |
| `quote_migration_fixed_cost` | 12 SOL | Migration cost basis (for reserve calculation) |
| `quote_migration_threshold` | 85 SOL | Migration threshold (for reserve calculation) |
