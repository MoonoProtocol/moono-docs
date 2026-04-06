---
title: API Reference
description: Complete API reference for Moono Protocol programs and SDK.
---

This section provides detailed technical reference for Moono Protocol's on-chain programs and client SDK.

## Programs

### Core Program

The main program that handles protocol operations.

| Instruction | Description |
|---|---|
| `initialize` | Initialize the protocol state |
| `create_token` | Create a new SPL token |
| `transfer` | Transfer tokens between accounts |

### Admin Program

Administrative functions for protocol governance.

| Instruction | Description |
|---|---|
| `update_config` | Update protocol configuration |
| `pause` | Pause protocol operations |
| `resume` | Resume protocol operations |

## Account Structures

### ProtocolState

```rust
pub struct ProtocolState {
    pub authority: Pubkey,
    pub is_paused: bool,
    pub token_count: u64,
}
```

## Error Codes

| Code | Name | Description |
|---|---|---|
| 6000 | `Unauthorized` | Caller is not authorized |
| 6001 | `ProtocolPaused` | Protocol is currently paused |
| 6002 | `InvalidInput` | Invalid input parameters |
