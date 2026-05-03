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

## PDA протокола (синглтоны)

Эти аккаунты являются **Program Derived Addresses** (PDA) — детерминированные адреса, производные от ID программы и определённых сидов. Они создаются один раз при инициализации протокола.

| Аккаунт | Сид | Описание |
|---|---|---|
| **Config** | `"config"` | Глобальная конфигурация (комиссии, ставки, состояние паузы, authority) |
| **Quote Vaults Registry** | `"quote_vaults_registry"` | Реестр созданных хранилищ котировочных активов |
| **Launch Configurations Registry** | `"launch_configurations_registry"` | Реестр всех созданных конфигураций запуска |

## Хранилище WSOL

Хранилище WSOL (wrapped SOL) — основной пул ликвидности. На каждое хранилище — один комплект тиковых аккаунтов.

| Аккаунт | Сид | Описание |
|---|---|---|
| **Quote Vault** | `"quote_vault" + WSOL_MINT` | Состояние хранилища WSOL (балансы, комиссии, заёмные суммы, флаг паузы) |
| **Quote Vault Token Account** | `"quote_vault_token" + WSOL_MINT` | SPL токен-аккаунт с фактическим WSOL |
| **Ticks Balances** | `"ticks_balances" + quote_vault` | Доступная ликвидность по тикам (1 024 тика) |
| **Ticks Shares** | `"ticks_shares" + quote_vault` | LP-доли по тикам |
| **Ticks Borrowed** | `"ticks_borrowed" + quote_vault` | Заёмные суммы по тикам |
| **Ticks LP Interest** | `"ticks_lp_interest" + quote_vault` | Пул LP-процентов по тикам (источник settle) |
| **Ticks LP Interest Index** | `"ticks_lp_interest_index" + quote_vault` | Кумулятивный индекс LP-процентов по тикам (модель Synthetix) |

## PDA пользователя

Производятся для каждого Solana-кошелька, взаимодействующего с протоколом.

| Аккаунт | Сид | Описание |
|---|---|---|
| **User Profile** | `"user_profile" + user` | Метаданные пользователя (id займа, id пресета, LP-битмап, service-кошелёк) |
| **LP Quote Vault Information** | `"lp_quote_vault_information" + user + quote_vault` | Per-user-per-vault битмап активных тиков |
| **LP Position** | `"lp_position" + user + quote_vault + tick_index_le_bytes` | Per-user-per-tick доли + interest checkpoint |
| **Launch Preset** | `"launch_preset" + user + preset_id_le_bytes` | Пользовательский многоразовый шаблон запуска |
| **Loan** | `"loan" + user + loan_id_le_bytes` | Состояние займа (залог, заёмы по тикам, статус) |
| **Loan Execution Wallet** | `"loan_execution_wallet" + loan` | System-owned PDA как execution-кошелёк займа |
| **Bundle Wallet (i)** | `"bundle" + launch_preset + index_le_bytes` | PDA bundle-кошелька (один на слот, индексация с 0) |

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
| **Fee Recipient v2** | `5YxQFdt3Tr9zJLvkFccqXVUwhdTWJQc1fFg2YPbxvxeD` |
| **Global Volume Accumulator** | `Hq2wp8uJ9jCPsYgNHex8RtqdvMPfVGoYwjvF1ATiwn2Y` |
| **Fee Config** | `8Wf5TiAheLUqBrKXeYg2JtAFFMWtKdG2BSFgqUcPVwTt` |
| **Global Params** | `13ec7XdrjF3h3YcqBTFDSReRcUFwbCnJaAQspM4j6DDJ` |
| **SOL Vault** | `BwWK17cbHxwWBKZkUYvzxLcNQ1YVyaFezduWbtm2de6s` |

Адрес **Fee Recipient v2** появился с апгрейдом pump.fun 2026-04-28; Moono передаёт оба — v1 и v2 — в каждом CPI к pump.

### Токен-программы Solana

| Программа | Адрес |
|---|---|
| **SPL Token** | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` |
| **Token-2022** | `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` |
| **Associated Token** | `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL` |
