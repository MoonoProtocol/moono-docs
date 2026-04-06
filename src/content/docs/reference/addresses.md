---
title: Protocol Addresses
description: Key on-chain addresses for Moono Protocol on Solana mainnet.
---

All addresses listed below are for **Solana mainnet**.

## Moono Program

| | Address |
|---|---|
| **Program ID** | `moono1nEzk6NWAHzgFjeeSYn3WVtr3N2ZVArwsxrhFX` |

This is the main Moono Protocol program deployed on Solana. All protocol interactions go through this program.

## Protocol PDAs

These accounts are **Program Derived Addresses** (PDAs) — deterministic addresses derived from the program ID and specific seeds. They are created during protocol initialization.

| Account | Seed | Description |
|---|---|---|
| **Config** | `"config"` | Global protocol configuration (fees, rates, pause state) |
| **Quote Vaults Registry** | `"quote_vaults_registry"` | Registry of all supported quote assets |
| **Launch Configurations Registry** | `"launch_configurations_registry"` | Registry of all launch platform configurations |

## WSOL Quote Vault

The WSOL (wrapped SOL) vault is the primary liquidity pool.

| Account | Seed | Description |
|---|---|---|
| **Quote Vault** | `"quote_vault" + WSOL_MINT` | WSOL vault state (balances, fees, borrowed amounts) |
| **Quote Vault Token Account** | `"quote_vault_token" + WSOL_MINT` | SPL token account holding the actual WSOL |
| **Ticks Balances** | `"ticks_balances" + quote_vault` | Available liquidity per tick (1,024 ticks) |
| **Ticks Shares** | `"ticks_shares" + quote_vault` | LP shares per tick |
| **Ticks Borrowed** | `"ticks_borrowed" + quote_vault` | Borrowed amounts per tick |
| **Ticks LP Interest** | `"ticks_lp_interest" + quote_vault` | Accrued LP interest per tick |

## Token Mints

| Token | Address |
|---|---|
| **WSOL (Wrapped SOL)** | `So11111111111111111111111111111111111111112` |

## External Programs

Moono Protocol interacts with the following external programs:

### Pump.fun

| | Address |
|---|---|
| **Pump Program** | `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P` |
| **Pump Mayhem Program** | `MAyhSmzXzV1pTf7LsNkrNwkWKTo4ougAJ1PPg47MD4e` |
| **Pump Fee Program** | `pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ` |

### Pump.fun Accounts

| Account | Address |
|---|---|
| **Global** | `4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf` |
| **Mint Authority** | `TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM` |
| **Event Authority** | `Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1` |
| **Fee Recipient** | `62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV` |
| **Global Volume Accumulator** | `Hq2wp8uJ9jCPsYgNHex8RtqdvMPfVGoYwjvF1ATiwn2Y` |
| **Fee Config** | `8Wf5TiAheLUqBrKXeYg2JtAFFMWtKdG2BSFgqUcPVwTt` |
| **Global Params** | `13ec7XdrjF3h3YcqBTFDSReRcUFwbCnJaAQspM4j6DDJ` |
| **SOL Vault** | `BwWK17cbHxwWBKZkUYvzxLcNQ1YVyaFezduWbtm2de6s` |

### Solana Token Programs

| Program | Address |
|---|---|
| **SPL Token** | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` |
| **Token-2022** | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` |
| **Associated Token** | `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL` |
