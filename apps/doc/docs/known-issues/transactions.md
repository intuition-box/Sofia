---
sidebar_position: 1
title: Transaction Issues
description: Transaction failures and workarounds
---

# Transaction Issues

## Transaction Failed After Refresh

**Problem**: If you refresh the extension and then try to make a transaction from a tab that was already open, the transaction will fail.

**Solution**: Close the tab and open a new one. Make your certification from the freshly opened tab.

```
❌ Refresh extension → Use existing tab → TX Failed
✓  Refresh extension → Open NEW tab → TX Success
```

---

## Transaction Failed — Wrong Network

**Problem**: Transactions fail with no clear error message.

**Cause**: Your wallet is not connected to the **Intuition Mainnet**. Sofia requires all transactions to be sent on the correct network.

**Solution**: Make sure your wallet (e.g. MetaMask) is switched to the Intuition Mainnet before performing any certification, vote, or staking action.
