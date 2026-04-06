---
title: Working with WSOL
description: How Moono Protocol handles SOL and WSOL, and how to optimize costs for multiple launches.
---

Some launch configurations on Moono Protocol use **WSOL (Wrapped SOL)** as the quote currency — for example, the pump.fun configuration. This page explains what WSOL is, how the protocol handles it, and how to optimize your workflow.

## What is WSOL?

WSOL is an SPL token representation of native SOL. On Solana, native SOL cannot be used directly in token swap or DeFi transactions — it must first be "wrapped" into an SPL token called WSOL. The process is reversible:

- **Wrap** — convert native SOL into WSOL (creates a WSOL token account and deposits SOL)
- **Unwrap** — convert WSOL back into native SOL (closes the token account and returns SOL)

WSOL is always 1:1 with SOL. There is no exchange rate or price difference. The only cost is the Solana transaction fee and a small amount for token account rent (~0.002 SOL).

## Two Approaches

### Approach 1: Automatic — For Occasional Use

If you are making a single launch or interact with the protocol infrequently, you don't need to prepare anything. The Moono app handles everything automatically:

1. You initiate a launch or other action requiring WSOL
2. The app detects that you don't have enough WSOL
3. It automatically **wraps** the required amount of SOL into WSOL before executing the transaction
4. After the action completes (repay, liquidation), any remaining WSOL can be **unwrapped** back to SOL

This is the simplest approach — just make sure you have enough native SOL in your wallet and the app does the rest.

**Trade-off:** each automatic wrap/unwrap adds a small overhead — the Solana transaction fee plus ~0.002 SOL for the temporary WSOL token account rent. For a single launch this is negligible, but it adds up over many launches.

### Approach 2: Manual Pre-Wrap — For Frequent Use

If you plan to make multiple launches, provide liquidity, or interact with the protocol regularly, it's more cost-efficient to **wrap SOL in advance**:

1. Go to the **Profile** section in the Moono app
2. Wrap a larger amount of SOL into WSOL (enough for several launches plus fees)
3. Your WSOL balance is now ready — all subsequent launches will use it directly without additional wrap transactions
4. When you're done, unwrap your remaining WSOL back to SOL in the Profile section

**Benefits:**
- **Lower costs** — you pay the wrap/unwrap overhead only once instead of on every launch
- **Faster transactions** — launches don't need the extra wrap step, so transactions are simpler
- **Better control** — you always see your WSOL balance and know exactly how much is available

**Recommendation:** if you plan more than 2-3 launches, pre-wrapping is worth it. Wrap enough for your planned launches plus fees and interest with some buffer.

## Cost of Wrap/Unwrap

Each wrap or unwrap operation requires:

| Operation | Cost |
|---|---|
| **Wrap (SOL → WSOL)** | Solana transaction fee (~0.000005 SOL) + token account rent (~0.002 SOL) |
| **Unwrap (WSOL → SOL)** | Solana transaction fee (~0.000005 SOL); rent is refunded |

The token account rent (~0.002 SOL) is charged when creating a WSOL token account and **refunded** when the account is closed (unwrap). So the net cost of a full wrap → unwrap cycle is just the transaction fees.

## Which Launch Configurations Use WSOL?

Currently, the **pump.fun** launch configuration uses WSOL as the quote currency. Future launch configurations may use different quote assets — each configuration specifies its own quote currency independently.

You can check which quote currency a launch configuration uses in the app before initiating a launch.
