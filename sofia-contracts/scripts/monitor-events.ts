import { ethers } from "hardhat";
import { formatEther } from "ethers";

/**
 * Monitor events from SofiaFeeProxy in real-time
 * Run this after deploying contracts with deploy-local-debug.ts
 *
 * Usage: npx hardhat run scripts/monitor-events.ts --network localhost
 */

// Update these addresses after deployment
const PROXY_ADDRESS = process.env.PROXY_ADDRESS || "0x0000000000000000000000000000000000000000";

async function main() {
  if (PROXY_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.log("⚠️  Please set PROXY_ADDRESS environment variable");
    console.log("   Example: PROXY_ADDRESS=0x... npx hardhat run scripts/monitor-events.ts --network localhost");
    console.log("\n   Or update the PROXY_ADDRESS constant in this file.");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));
  console.log("📡 SOFIA FEE PROXY - EVENT MONITOR");
  console.log("=".repeat(60));
  console.log(`\nMonitoring contract: ${PROXY_ADDRESS}`);
  console.log("Waiting for events...\n");

  const proxy = await ethers.getContractAt("SofiaFeeProxy", PROXY_ADDRESS);

  // Fee collected event
  proxy.on("FeesCollected", (user, amount, operation, event) => {
    console.log("\n" + "─".repeat(50));
    console.log("💰 FEES COLLECTED");
    console.log("─".repeat(50));
    console.log(`   Timestamp:  ${new Date().toISOString()}`);
    console.log(`   Block:      ${event.log.blockNumber}`);
    console.log(`   User:       ${user}`);
    console.log(`   Amount:     ${formatEther(amount)} ETH`);
    console.log(`   Operation:  ${operation}`);
    console.log(`   Tx Hash:    ${event.log.transactionHash}`);
  });

  // Transaction forwarded event
  proxy.on("TransactionForwarded", (operation, user, sofiaFee, multiVaultValue, totalReceived, event) => {
    console.log("\n" + "─".repeat(50));
    console.log("📤 TRANSACTION FORWARDED TO MULTIVAULT");
    console.log("─".repeat(50));
    console.log(`   Timestamp:       ${new Date().toISOString()}`);
    console.log(`   Block:           ${event.log.blockNumber}`);
    console.log(`   Operation:       ${operation}`);
    console.log(`   User:            ${user}`);
    console.log(`   Sofia Fee:       ${formatEther(sofiaFee)} ETH`);
    console.log(`   MultiVault Value: ${formatEther(multiVaultValue)} ETH`);
    console.log(`   Total Received:  ${formatEther(totalReceived)} ETH`);
    console.log(`   Tx Hash:         ${event.log.transactionHash}`);
  });

  // MultiVault success event
  proxy.on("MultiVaultSuccess", (operation, resultCount, event) => {
    console.log("\n" + "─".repeat(50));
    console.log("✅ MULTIVAULT OPERATION SUCCESS");
    console.log("─".repeat(50));
    console.log(`   Timestamp:     ${new Date().toISOString()}`);
    console.log(`   Block:         ${event.log.blockNumber}`);
    console.log(`   Operation:     ${operation}`);
    console.log(`   Result Count:  ${resultCount}`);
    console.log(`   Tx Hash:       ${event.log.transactionHash}`);
  });

  // Admin events
  proxy.on("AdminWhitelistUpdated", (admin, status, event) => {
    console.log("\n" + "─".repeat(50));
    console.log("👤 ADMIN WHITELIST UPDATED");
    console.log("─".repeat(50));
    console.log(`   Admin:   ${admin}`);
    console.log(`   Status:  ${status ? "Added" : "Removed"}`);
    console.log(`   Tx Hash: ${event.log.transactionHash}`);
  });

  proxy.on("FeeRecipientUpdated", (oldRecipient, newRecipient, event) => {
    console.log("\n" + "─".repeat(50));
    console.log("💳 FEE RECIPIENT UPDATED");
    console.log("─".repeat(50));
    console.log(`   Old: ${oldRecipient}`);
    console.log(`   New: ${newRecipient}`);
    console.log(`   Tx Hash: ${event.log.transactionHash}`);
  });

  proxy.on("CreationFixedFeeUpdated", (oldFee, newFee, event) => {
    console.log("\n" + "─".repeat(50));
    console.log("📝 CREATION FEE UPDATED");
    console.log("─".repeat(50));
    console.log(`   Old: ${formatEther(oldFee)} ETH`);
    console.log(`   New: ${formatEther(newFee)} ETH`);
    console.log(`   Tx Hash: ${event.log.transactionHash}`);
  });

  proxy.on("DepositFixedFeeUpdated", (oldFee, newFee, event) => {
    console.log("\n" + "─".repeat(50));
    console.log("📝 DEPOSIT FIXED FEE UPDATED");
    console.log("─".repeat(50));
    console.log(`   Old: ${formatEther(oldFee)} ETH`);
    console.log(`   New: ${formatEther(newFee)} ETH`);
    console.log(`   Tx Hash: ${event.log.transactionHash}`);
  });

  proxy.on("DepositPercentageFeeUpdated", (oldFee, newFee, event) => {
    console.log("\n" + "─".repeat(50));
    console.log("📝 DEPOSIT PERCENTAGE FEE UPDATED");
    console.log("─".repeat(50));
    console.log(`   Old: ${Number(oldFee) / 100}%`);
    console.log(`   New: ${Number(newFee) / 100}%`);
    console.log(`   Tx Hash: ${event.log.transactionHash}`);
  });

  console.log("Press Ctrl+C to stop monitoring.\n");

  // Keep the script running
  await new Promise(() => {});
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
