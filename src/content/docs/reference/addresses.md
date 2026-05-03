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

## Protocol PDAs (singletons)

These accounts are **Program Derived Addresses** (PDAs) — deterministic addresses derived from the program ID and specific seeds. They are created once during protocol initialization.

| Account | Seed | Description |
|---|---|---|
| **Config** | `"config"` | Global protocol configuration (fees, rates, pause state, authority) |
| **Quote Vaults Registry** | `"quote_vaults_registry"` | Registry of all created quote vaults |
| **Launch Configurations Registry** | `"launch_configurations_registry"` | Registry of all created launch configurations |

## WSOL Quote Vault

The WSOL (wrapped SOL) vault is the primary liquidity pool. There is one set of tick accounts per vault.

| Account | Seed | Description |
|---|---|---|
| **Quote Vault** | `"quote_vault" + WSOL_MINT` | WSOL vault state (balances, fees, borrowed amounts, paused flag) |
| **Quote Vault Token Account** | `"quote_vault_token" + WSOL_MINT` | SPL token account holding the actual WSOL |
| **Ticks Balances** | `"ticks_balances" + quote_vault` | Available liquidity per tick (1,024 ticks) |
| **Ticks Shares** | `"ticks_shares" + quote_vault` | LP shares per tick |
| **Ticks Borrowed** | `"ticks_borrowed" + quote_vault` | Borrowed amounts per tick |
| **Ticks LP Interest** | `"ticks_lp_interest" + quote_vault` | LP interest pool per tick (settle source) |
| **Ticks LP Interest Index** | `"ticks_lp_interest_index" + quote_vault` | Cumulative LP interest index per tick (Synthetix-style) |

## Per-User PDAs

Derived per Solana wallet that interacts with the protocol.

| Account | Seed | Description |
|---|---|---|
| **User Profile** | `"user_profile" + user` | Per-user protocol metadata (loan id, preset id, LP bitmap, service wallet) |
| **LP Quote Vault Information** | `"lp_quote_vault_information" + user + quote_vault` | Per-user-per-vault active tick bitmap |
| **LP Position** | `"lp_position" + user + quote_vault + tick_index_le_bytes` | Per-user-per-tick LP shares + interest checkpoint |
| **Launch Preset** | `"launch_preset" + user + preset_id_le_bytes` | User-owned reusable launch template |
| **Loan** | `"loan" + user + loan_id_le_bytes` | Per-loan state (collateral, ticks borrowed, status) |
| **Loan Execution Wallet** | `"loan_execution_wallet" + loan` | System-owned PDA used as the execution wallet for the loan |
| **Bundle Wallet (i)** | `"bundle" + launch_preset + index_le_bytes` | Bundle wallet PDA (one per slot, indexed from 0) |

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
| **Fee Recipient v2** | `5YxQFdt3Tr9zJLvkFccqXVUwhdTWJQc1fFg2YPbxvxeD` |
| **Global Volume Accumulator** | `Hq2wp8uJ9jCPsYgNHex8RtqdvMPfVGoYwjvF1ATiwn2Y` |
| **Fee Config** | `8Wf5TiAheLUqBrKXeYg2JtAFFMWtKdG2BSFgqUcPVwTt` |
| **Global Params** | `13ec7XdrjF3h3YcqBTFDSReRcUFwbCnJaAQspM4j6DDJ` |
| **SOL Vault** | `BwWK17cbHxwWBKZkUYvzxLcNQ1YVyaFezduWbtm2de6s` |

The **Fee Recipient v2** address was added with the pump.fun upgrade on 2026-04-28; both v1 and v2 are passed by Moono on every CPI to pump.

### Solana Token Programs

| Program | Address |
|---|---|
| **SPL Token** | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` |
| **Token-2022** | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` |
| **Associated Token** | `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL` |
