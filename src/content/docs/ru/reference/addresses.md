---
title: Адреса протокола
description: Ключевые on-chain адреса Moono Protocol в сети Solana mainnet.
---

Все адреса, перечисленные ниже, относятся к **Solana mainnet**.

## Программа Moono

| | Адрес |
|---|---|
| **Program ID** | `moono1nEzk6NWAHzgFjeeSYn3WVtr3N2ZVArwsxrhFX` |

Это основная программа Moono Protocol, развёрнутая в сети Solana. Все взаимодействия с протоколом проходят через эту программу.

## PDA протокола

Эти аккаунты являются **Program Derived Addresses** (PDA) — детерминированные адреса, производные от ID программы и определённых сидов. Они создаются при инициализации протокола.

| Аккаунт | Сид | Описание |
|---|---|---|
| **Config** | `"config"` | Глобальная конфигурация протокола (комиссии, ставки, состояние паузы) |
| **Quote Vaults Registry** | `"quote_vaults_registry"` | Реестр всех поддерживаемых котировочных активов |
| **Launch Configurations Registry** | `"launch_configurations_registry"` | Реестр всех конфигураций платформ запуска |

## Хранилище WSOL

Хранилище WSOL (wrapped SOL) — основной пул ликвидности.

| Аккаунт | Сид | Описание |
|---|---|---|
| **Quote Vault** | `"quote_vault" + WSOL_MINT` | Состояние хранилища WSOL (балансы, комиссии, заёмные суммы) |
| **Quote Vault Token Account** | `"quote_vault_token" + WSOL_MINT` | SPL-токен аккаунт, содержащий фактические WSOL |
| **Ticks Balances** | `"ticks_balances" + quote_vault` | Доступная ликвидность по тикам (1 024 тика) |
| **Ticks Shares** | `"ticks_shares" + quote_vault` | LP-доли по тикам |
| **Ticks Borrowed** | `"ticks_borrowed" + quote_vault` | Заёмные суммы по тикам |
| **Ticks LP Interest** | `"ticks_lp_interest" + quote_vault` | Накопленные LP-проценты по тикам |

## Минты токенов

| Токен | Адрес |
|---|---|
| **WSOL (Wrapped SOL)** | `So11111111111111111111111111111111111111112` |

## Внешние программы

Moono Protocol взаимодействует со следующими внешними программами:

### Pump.fun

| | Адрес |
|---|---|
| **Pump Program** | `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P` |
| **Pump Mayhem Program** | `MAyhSmzXzV1pTf7LsNkrNwkWKTo4ougAJ1PPg47MD4e` |
| **Pump Fee Program** | `pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ` |

### Аккаунты Pump.fun

| Аккаунт | Адрес |
|---|---|
| **Global** | `4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf` |
| **Mint Authority** | `TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM` |
| **Event Authority** | `Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1` |
| **Fee Recipient** | `62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV` |
| **Global Volume Accumulator** | `Hq2wp8uJ9jCPsYgNHex8RtqdvMPfVGoYwjvF1ATiwn2Y` |
| **Fee Config** | `8Wf5TiAheLUqBrKXeYg2JtAFFMWtKdG2BSFgqUcPVwTt` |
| **Global Params** | `13ec7XdrjF3h3YcqBTFDSReRcUFwbCnJaAQspM4j6DDJ` |
| **SOL Vault** | `BwWK17cbHxwWBKZkUYvzxLcNQ1YVyaFezduWbtm2de6s` |

### Токен-программы Solana

| Программа | Адрес |
|---|---|
| **SPL Token** | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` |
| **Token-2022** | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` |
| **Associated Token** | `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL` |
