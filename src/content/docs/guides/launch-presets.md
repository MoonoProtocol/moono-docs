---
title: Launch Presets
description: How to create and manage reusable token launch templates in Moono Protocol.
---

A **Launch Preset** is a reusable on-chain account that holds everything needed to launch a token — token metadata, mint address, supply, decimals, and bundle wallet configuration. Once a preset is saved, you can launch from it any number of times (one loan at a time) without re-entering the data.

Presets live at `/presets`, with one preset per row. Open one to view, edit, fund, or launch.

## Why Use Presets

- **Re-use a vanity mint** — the mint keypair is generated or imported once and stays attached to the preset; the encrypted private key is stored locally in your browser
- **Separate metadata from launch parameters** — token name, symbol, supply, and decimals are fixed per preset; loan size and duration are picked at launch time
- **Pre-configure bundle wallets** — bundle wallet count, distribution, and ALT are part of the preset, so the bundle is ready before you click Launch
- **Sequential reuse** — when a launched loan closes (repay or liquidate), the preset unlocks and is ready for the next launch

You can also launch **without** a preset from `/launch/:address`, filling token fields inline. Use that path for one-off launches; use presets when you plan to launch the same token concept more than once or want bundle wallets.

## Preset Fields

### Common

- **Launch Configuration** — selects the platform/quote-asset combination (mainnet today: pump.fun + WSOL). Each launch configuration has its own min/max loan, duration limits, and fees.

### Token

- **Base Mint** — the SPL Token-2022 mint address for your token. Three options:
  - **Generate** — creates a fresh keypair and stores the encrypted private key locally
  - **Import** — paste an existing encrypted key file (e.g., a vanity mint generated offline)
  - Paste address — for a mint you control off-app; the app shows a "no private key" indicator
- **Base Name** — token name (UTF-8, up to 128 bytes)
- **Base Symbol** — token ticker (UTF-8, up to 128 bytes)
- **Base URI** — link to the metadata JSON; click **Construct** to open the [metadata modal](#construct-metadata-modal) and build it inline
- **Base Supply** — total token supply, in raw units (must match your platform's expected total)
- **Base Decimals** — token decimals, up to 9

### Bundle

- **Bundle Addresses Count** — how many bundle wallets the preset uses (0 disables bundle entirely)
- **Bundle Distribution Type** — how the loan amount is split across bundle wallets. Currently the only option is **Equal**.
- **Bundle ALT** — the Address Lookup Table holding the bundle wallet addresses. The app provides:
  - **Check ALT** — verifies the ALT contains exactly the expected bundle wallet PDAs
  - **Recreate ALT** — destroys and rebuilds the ALT (needed when changing the bundle count)
  - **Amend ALT** — adds missing addresses without destroying the table

See [Bundle Wallets](/guides/bundle-wallets/) for the full bundle workflow.

## Construct Metadata Modal

The Construct modal builds the token's metadata JSON and uploads it (along with the image) to IPFS, returning the URI. Fields:

- **Name**, **Symbol**, **Description**
- **Image** — paste a URL or upload a file. With **Copy image to IPFS** enabled, an external URL is re-uploaded to IPFS so the metadata is fully decentralized
- **Twitter**, **External URL** — optional links

Click **Generate Using AI** at the top of the modal to have the app produce the entire metadata draft (name, symbol, description, image) automatically. The image is uploaded to IPFS and the form is filled in for you to review and adjust before saving.

## Active Loan Lock

Each preset has an **Active Loan** field. While set (not the default `1111…1111` pubkey), the preset is locked — you cannot edit or delete it, and you cannot start another launch from it. The lock is released automatically when the active loan closes (repaid or liquidated).

## Editing and Deleting

- **Edit** — change any field in place (Save commits a transaction). You cannot edit a preset with an active loan.
- **Delete** — removes the preset and reclaims its rent. Cannot delete a preset with an active loan.

If you change **Bundle Addresses Count**, you'll need to **Recreate ALT** to match the new count.

## Mint Key Storage

Base mint private keys are encrypted and stored in your browser's localStorage. They never leave the browser unsigned and never reach the protocol or any backend. Manage them at `/mints`:

- View which mints have keys stored locally
- Delete keys you no longer need
- Export keys to encrypted files for backup

If you generate a vanity mint and save the preset on one device, you can move the encrypted key to another device by exporting from `/mints`, then importing on the new device's preset page.

## Tips

- **Generate the mint first** — having a fresh mint before clicking Save makes the preset launch-ready
- **Construct metadata before bundle setup** — the URI is part of the preset, so finalize it before recreating the ALT
- **Pre-fund bundle wallets** — a separately fundable step on the preset page; without funding the bundle wallets, the launch can't pay for their ATAs
- **Re-use across launches** — the same preset can power multiple sequential launches; just wait for each loan to close before starting the next one
