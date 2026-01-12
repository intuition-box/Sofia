/**
 * Script to approve Sofia Proxy on MultiVault
 * Run this ONCE before using the human-attestor workflow
 *
 * Usage: npx ts-node scripts/approve-proxy.ts
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const RPC_ENDPOINT = 'https://rpc.intuition.systems';
const SOFIA_PROXY_ADDRESS = '0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c';
const MULTIVAULT_ADDRESS = '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e';

async function main() {
  const botPrivateKey = process.env.BOT_PRIVATE_KEY;

  if (!botPrivateKey) {
    console.error('❌ BOT_PRIVATE_KEY not set in environment');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_ENDPOINT);
  const botWallet = new ethers.Wallet(botPrivateKey, provider);

  console.log(`🤖 Bot wallet: ${botWallet.address}`);
  console.log(`📍 Sofia Proxy: ${SOFIA_PROXY_ADDRESS}`);
  console.log(`📍 MultiVault: ${MULTIVAULT_ADDRESS}`);

  // Check balance
  const balance = await provider.getBalance(botWallet.address);
  console.log(`💰 Bot balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error('❌ Bot has no ETH for gas');
    process.exit(1);
  }

  // MultiVault ABI for approval
  const multiVaultAbi = [
    'function approve(address sender, uint8 approvalType) external',
  ];

  const multiVault = new ethers.Contract(MULTIVAULT_ADDRESS, multiVaultAbi, botWallet);

  console.log('\n🔐 Approving Sofia Proxy for DEPOSIT operations...');

  try {
    // ApprovalTypes: 0=NONE, 1=DEPOSIT, 2=REDEMPTION, 3=BOTH
    const tx = await multiVault.approve(SOFIA_PROXY_ADDRESS, 1);
    console.log(`📤 TX sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Approved in block ${receipt.blockNumber}`);
    console.log(`🔗 Explorer: https://explorer.intuition.systems/tx/${tx.hash}`);
  } catch (error) {
    console.error('❌ Approval failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
