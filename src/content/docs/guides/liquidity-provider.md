---
title: Liquidity Provider Guide
description: Step-by-step guide for providing liquidity to Moono Protocol and earning interest.
---

This guide walks you through supplying SOL to Moono Protocol's liquidity pool and earning interest from borrowers who launch tokens on pump.fun.

## Prerequisites

- A Solana wallet (Phantom, Solflare, or any compatible wallet)
- SOL you want to deposit as liquidity

## How LP Earnings Work

When borrowers take loans to launch tokens, they pay interest. That interest goes to the liquidity providers whose deposits funded the loan. Your earnings depend on:

1. **Which tick you deposit into** — higher ticks earn higher interest per hour
2. **How often your liquidity is utilized** — you only earn when your SOL is actively lent out
3. **Loan durations** — longer loans mean more interest per loan

See [Economics](/getting-started/economics/) for the full interest model.

## Step 1: Register Your Profile

If you haven't already, create a User Profile (same for borrowers and LPs):

- Connect your wallet to the Moono app
- Click **Register**
- Approve the transaction (registration fee + rent — exact amount in [Economics](/getting-started/economics/))

## Step 2: Choose Your Tick

The most important decision as an LP is **which tick to deposit into**. The protocol has 1,024 ticks (numbered 0–1,023), each with a different interest rate:

```
tick_hourly_rate_ppm = min(2048, 2 + tick_index × 2)
```

### Tick Selection Strategy

| Tick Range | Hourly Rate | Trade-off |
|---|---|---|
| **0–50** (low) | 0.0002%–0.0102% | Low rates, but your liquidity is borrowed first |
| **50–250** (mid) | 0.0102%–0.0502% | Balanced rate and utilization |
| **250–500** (high) | 0.0502%–0.1002% | Higher rates, but only used when lower ticks are depleted |
| **500–1023** (max) | 0.1002%–0.2048% | Highest rates, but rarely utilized unless demand is very high |

:::tip
Loans are filled from the lowest tick upward. If you deposit in tick 0, your liquidity will be the first to be borrowed — you'll earn less per loan, but your SOL is utilized more frequently. Higher ticks earn more per loan but may sit idle longer.
:::

### Shared Interest Bonus

In addition to the per-tick rate, every loan pays a **shared interest surcharge** that is distributed proportionally across all participating ticks. This significantly boosts the effective yield, especially for lower ticks. See [Economics — Shared Interest](/getting-started/economics/#shared-interest-protocol-surcharge) for details.

## Step 3: Open a Position

1. Select the tick you want to deposit into
2. Enter the amount of SOL to deposit
3. Click **Deposit** and approve the transaction

Your SOL is transferred to the protocol's quote vault, and you receive **LP shares** representing your position in that tick.

### Initial Share Price

When a tick has no existing deposits, you receive shares at a 1:1 ratio (1 SOL = 1 share). When depositing into a tick that already has deposits and earned interest, your shares are calculated at the current share price:

```
your_shares = deposit_amount × tick_total_shares / (tick_balance + tick_borrowed)
```

This means you're buying in at the current value, including any accumulated interest — you don't dilute existing LPs and they don't dilute you.

## Step 4: Monitor Your Position

Once deposited, your SOL may be:

- **Available** — sitting in the tick, not currently lent out
- **Borrowed** — actively lent to a borrower, earning interest

You can track:
- Your share count and current share value
- How much of your tick's liquidity is currently borrowed
- Accrued interest claimable independently of withdrawal

### How Interest Accrues

Interest is paid by the borrower **upfront** when a loan is created, and accrues to your tick at that exact moment via a cumulative-index model. There are two ways your earnings are visible:

1. **Per-share index** — each tick has a global cumulative interest index. When a loan is taken, the index advances by `interest_amount / current_shares`, locking in your share of that loan's interest immediately. Your position snapshots the index on every state-mutating action (open / deposit / withdraw / claim) and the difference is moved into your `unclaimed_interest`.
2. **Share value** — interest sitting in your position can also be claimed at withdrawal or close, at which point the protocol pays it from the tick's interest pool.

Practically, you don't have to think about this — the app shows your **claimable interest** directly. The key takeaway is that you earn at the moment of borrow, not at repayment, and you don't need to keep the position open until the loan closes to keep your share of that loan's interest.

## Step 5: Claim Accrued Interest

You can claim accrued interest at any time without touching your principal:

1. Open the position on the pool page
2. Click **Claim Fees**
3. Approve the transaction

Your position keeps the same share count; only the `unclaimed_interest` is transferred to your wallet. This is useful if you want to compound earnings into a different tick, or simply realize gains while your principal stays at work.

Accrued interest is also automatically paid out on **Withdraw** and **Close Position**.

## Step 6: Add More Liquidity

You can deposit additional SOL into your existing position at any time:

1. Navigate to your open position
2. Enter the additional amount
3. Approve the transaction

New shares are minted at the current share price, so your total share count increases.

## Step 7: Withdraw

When you want to withdraw some or all of your liquidity:

1. Navigate to your position
2. Enter the number of shares to redeem (or select max)
3. Click **Withdraw** and approve the transaction

Your shares are burned, and you receive SOL at the current share price:

```
withdrawal_amount = your_shares × (tick_balance + tick_borrowed) / tick_total_shares
```

### Withdrawal Limitations

You can only withdraw SOL that is **not currently lent out**:

```
max_withdrawable = your_shares × tick_balance / (tick_balance + tick_borrowed)
```

If a large portion of your tick's liquidity is currently borrowed, you may not be able to withdraw the full amount immediately. Wait for loans to be repaid or liquidated.

:::note
This is not a lock-up — it's a natural constraint of the lending model. Your SOL is earning interest while it's borrowed. Once the loan is repaid or liquidated, the liquidity becomes available for withdrawal.
:::

## Step 8: Close Position

When you've withdrawn all your shares and want to clean up:

1. Ensure your share balance is 0
2. Click **Close Position**
3. Approve the transaction

This reclaims the Solana rent from the position account.

## Risks

### Liquidation Risk

If a borrower's token crashes in price and the collateral + migration reserve don't cover the full loan, the tick takes a loss. This means your shares may be worth less SOL than you deposited.

The migration reserve (up to ~14.1% of loan amount) provides a buffer, but extreme price drops can still result in partial losses.

### Utilization Risk

If you deposit in a very high tick that is never utilized, your SOL earns nothing. Meanwhile, it's locked in the protocol (though you can withdraw at any time since it's not borrowed).

### Smart Contract Risk

As with any DeFi protocol, there are inherent smart contract risks. While the protocol is designed with safety in mind, no smart contract is guaranteed to be bug-free.

### Pause Risk

Each quote vault has a per-vault `paused` flag, and there is also a protocol-wide pause. While paused, deposits, withdraws, claims, and new launches against that vault are blocked until the admin unpauses. Existing positions and accrued interest remain intact across a pause.

## Tips

- **Diversify across ticks** — consider splitting your deposit across several ticks for a balance of utilization and rate
- **Monitor utilization** — if your tick is rarely borrowed, consider moving to a lower tick
- **Compound earnings** — periodically withdraw and re-deposit to compound your interest earnings
- **Start with popular ticks** — check which ticks are actively being borrowed to gauge demand
