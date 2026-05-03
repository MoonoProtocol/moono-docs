---
title: Earning Strategies
description: Possible scenarios for borrowers to earn from token launches through Moono Protocol.
---

:::caution[Disclaimer]
This page describes **hypothetical scenarios** of how the protocol mechanics work. It is **not financial advice** and **not a call to action**. Token markets are highly volatile — any participant can incur financial losses. You are solely responsible for your decisions. Always do your own research and understand the risks before interacting with any DeFi protocol.
:::

This page explains possible economic scenarios where a borrower may earn from launching a token through Moono Protocol.

## How It Works

When you take a loan and launch a token, Moono Protocol creates the token on pump.fun and makes the initial buy from the bonding curve. The purchased tokens are held as collateral. You have two ways to close the loan, and both can potentially result in profit.

## Scenario 1: Repay and Sell

1. **Launch** — borrow SOL and launch your token
2. **Build** — grow the token community, attract holders, create engagement
3. **Repay** — repay the loan before it expires; the collateral tokens are returned to your wallet
4. **Sell** — sell the tokens on the open market at the current price

**When it's profitable:** if the token price has risen since launch, the tokens you receive back are worth more than the total loan cost (borrowed amount + fees + interest).

### Example

- You borrow 1 SOL to launch a token, total cost ~0.11 SOL in fees and interest
- The protocol buys tokens on the bonding curve with your 1 SOL
- The token gains traction, the price rises significantly
- You repay the loan (~1 SOL goes back to the liquidity pool)
- You receive the collateral tokens, now worth 3 SOL on the market
- You sell for 3 SOL — your profit is 3 - 0.11 = **~2.89 SOL**

## Scenario 2: Self-Liquidation

As a borrower, you can call **liquidate** on your own loan **at any time** (no expiry check). The protocol will sell the initial-buy collateral on the bonding curve, repay the liquidity pool, and **return any excess SOL to you**.

1. **Launch** — borrow SOL and launch your token
2. **Build** — grow the token community, attract holders
3. **Liquidate** — call liquidate on your own loan; the protocol sells the collateral and settles

**When it's profitable:** if the SOL proceeds from selling the collateral exceed the borrowed amount, the difference is refunded to you.

### Example

- You borrow 1 SOL, total cost ~0.11 SOL
- The token price rises, the collateral is now worth 2.5 SOL on the bonding curve
- You call liquidate — the protocol sells the tokens for 2.5 SOL
- 1 SOL goes back to the liquidity pool (repaying the loan)
- The remaining ~1.5 SOL is refunded to your wallet
- Net result: you spent 0.11 SOL in fees and received ~1.5 SOL back — profit of **~1.39 SOL**

## Scenario 3: Sell & Liquidate (Bundle Wallets)

If you launched the loan from a [Launch Preset](/guides/launch-presets/) with [bundle wallets](/guides/bundle-wallets/), the bundle wallets each hold a slice of the token they bought during the launch. Liquidate on its own only sells the **initial buy** collateral — bundle holdings stay in the bundle wallets and need to be unwound separately.

The loan page exposes a one-click **Sell & Liquidate** action that:

1. Sells all base-token balances held by the bundle wallets via the bundle sell instruction
2. Routes the SOL proceeds back to the protocol
3. Liquidates the loan in the same flow, applying both the initial-buy and bundle-buy proceeds against the borrowed amount
4. Refunds any excess SOL to your wallet

You can also do these steps individually — **Sell Selected** and **Collect SOL** on the preset page operate on a chosen subset of bundle wallets, and **Liquidate** on the loan page closes the position once collateral is unwound.

**When it's useful:** any time you want a clean SOL exit on a launch that used bundle wallets. Without this flow you'd have to manually sell each bundle wallet's holdings and then collect remaining SOL.

### Repay vs Self-Liquidation vs Sell & Liquidate

| | Repay | Self-Liquidation | Sell & Liquidate |
|---|---|---|---|
| You receive | Initial-buy collateral tokens | Excess SOL after initial-buy sell | Excess SOL after initial-buy + bundle sell |
| Requires | SOL to repay the loan | Nothing extra — collateral covers it | Nothing extra — collateral + bundle holdings cover it |
| Best when | You want to keep some tokens or sell on a specific DEX | Simple SOL exit, no bundle wallets used | One-click full unwind for a bundle launch |
| Bundle holdings | Stay in bundle wallets — sell/collect separately | Stay in bundle wallets — sell/collect separately | Sold automatically as part of the action |

## What Drives Profitability

The key to any earning scenario is **token demand**. The protocol handles the mechanics — the loan, the launch, the settlement. But the token's market value depends on:

- **Community** — building genuine interest and engagement around the token
- **Visibility** — getting attention through social media, communities, and other channels
- **Utility or narrative** — giving people a reason to hold the token

The protocol enables a low-cost launch. What happens after launch depends on the effort put into the project.

## Earning as a Liquidity Provider

You don't have to be a borrower to earn on Moono Protocol. Liquidity providers earn interest from every loan taken:

- **Deposit SOL** into the liquidity pool and choose your risk tier (tick)
- **Earn interest** every time a borrower takes a loan funded by your tick
- **Interest accrues automatically** — the value of your LP shares grows as loans are repaid with interest

Your effective yield depends on two factors: the interest rate of your tick and how often your liquidity is utilized. Lower ticks earn less per loan but are borrowed more frequently; higher ticks earn more per loan but may sit idle. See the [Liquidity Provider Guide](/guides/liquidity-provider/) for details.

## Earning from Token Price Growth

Beyond lending mechanics, you can also earn simply by holding tokens launched through Moono Protocol. If you believe in a project launched on the platform, you can buy its tokens on pump.fun like any other market participant. If the token grows in value, you profit from the price appreciation.

This is standard token trading and is not specific to Moono Protocol — the same risks and opportunities apply as with any token purchase.

## Risks

:::danger[Important]
These scenarios describe potential outcomes, not guaranteed results. The majority of token launches may not result in profit. Possible losses include:

- **Full loss of fees and interest** — if the token price drops, you lose the upfront costs paid for the loan
- **Collateral devaluation** — if the token price falls below the loan amount, self-liquidation returns less than what was borrowed; fees are still lost
- **Market impact** — selling large amounts of tokens can significantly move the price down, especially on bonding curves with low liquidity
- **Time pressure** — loans have a fixed duration (current min/max in [Economics](/getting-started/economics/)); if you don't act before expiration, the protocol admin may liquidate your loan

Any activity involving token launches and trading carries significant financial risk. Other market participants may incur losses as a result of token price movements. This documentation describes protocol mechanics only and does not constitute an endorsement or recommendation of any particular strategy.
:::
