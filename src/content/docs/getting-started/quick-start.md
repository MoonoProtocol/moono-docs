---
title: Quick Start
description: Get up and running with Moono Protocol in minutes.
---

This guide will help you set up your development environment and start working with Moono Protocol.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://rustup.rs/) (latest stable)
- [Solana CLI](https://docs.solanalabs.com/cli/install) v1.17+
- [Anchor Framework](https://www.anchor-lang.com/) v0.29+

## Installation

1. Clone the repository:

```bash
git clone https://github.com/moono-protocol/moono-solana2.git
cd moono-solana2
```

2. Install dependencies:

```bash
npm install
```

3. Build the programs:

```bash
anchor build
```

4. Run tests:

```bash
anchor test
```

## Local Development

Start a local Solana validator:

```bash
solana-test-validator
```

Deploy programs to localnet:

```bash
anchor deploy
```

## What's Next?

- Read the [Guides](/moono-docs/guides/example/) for in-depth tutorials
- Explore the [API Reference](/moono-docs/reference/example/) for detailed specifications
