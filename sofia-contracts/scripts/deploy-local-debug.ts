import { ethers } from "hardhat";
import { formatEther, parseEther } from "ethers";

/**
 * Deploy script for local testing with detailed logging
 * Deploys MockMultiVault + SofiaFeeProxy and listens for events
 */
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 SOFIA FEE PROXY - LOCAL DEPLOYMENT WITH DEBUG");
  console.log("=".repeat(60) + "\n");

  const [deployer, user1, user2] = await ethers.getSigners();

  console.log("📋 ACCOUNTS:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance:  ${formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  if (user1) console.log(`   User1:    ${user1.address}`);
  if (user2) console.log(`   User2:    ${user2.address}`);

  // Deploy MockMultiVault
  console.log("\n📦 DEPLOYING MockMultiVault...");
  const MockMultiVault = await ethers.getContractFactory("MockMultiVault");
  const mockVault = await MockMultiVault.deploy();
  await mockVault.waitForDeployment();
  const mockVaultAddress = await mockVault.getAddress();
  console.log(`   ✅ MockMultiVault deployed at: ${mockVaultAddress}`);

  // Fee configuration
  const CREATION_FEE = parseEther("0.1");      // 0.1 ETH
  const DEPOSIT_FEE = parseEther("0.1");       // 0.1 ETH
  const DEPOSIT_PERCENTAGE = 200n;             // 2%

  console.log("\n📦 DEPLOYING SofiaFeeProxy...");
  const SofiaFeeProxy = await ethers.getContractFactory("SofiaFeeProxy");
  const proxy = await SofiaFeeProxy.deploy(
    mockVaultAddress,
    deployer.address,  // Fee recipient = deployer for local testing
    CREATION_FEE,
    DEPOSIT_FEE,
    DEPOSIT_PERCENTAGE,
    [deployer.address] // Admin = deployer
  );
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log(`   ✅ SofiaFeeProxy deployed at: ${proxyAddress}`);

  // Display configuration
  console.log("\n" + "=".repeat(60));
  console.log("⚙️  CONFIGURATION");
  console.log("=".repeat(60));
  console.log(`   MultiVault Address:     ${mockVaultAddress}`);
  console.log(`   Proxy Address:          ${proxyAddress}`);
  console.log(`   Fee Recipient:          ${deployer.address}`);
  console.log(`   Creation Fee:           ${formatEther(CREATION_FEE)} ETH`);
  console.log(`   Deposit Fixed Fee:      ${formatEther(DEPOSIT_FEE)} ETH`);
  console.log(`   Deposit Percentage:     ${Number(DEPOSIT_PERCENTAGE) / 100}%`);
  console.log(`   Admin:                  ${deployer.address}`);

  // Get costs from contracts
  const atomCost = await proxy.getAtomCost();
  const tripleCost = await proxy.getTripleCost();
  console.log(`\n   Atom Cost (MultiVault): ${formatEther(atomCost)} ETH`);
  console.log(`   Triple Cost (MultiVault): ${formatEther(tripleCost)} ETH`);

  // Listen for events
  console.log("\n" + "=".repeat(60));
  console.log("📡 LISTENING FOR EVENTS...");
  console.log("=".repeat(60));

  proxy.on("FeesCollected", (user, amount, operation) => {
    console.log(`\n💰 FEES COLLECTED:`);
    console.log(`   User:      ${user}`);
    console.log(`   Amount:    ${formatEther(amount)} ETH`);
    console.log(`   Operation: ${operation}`);
  });

  proxy.on("TransactionForwarded", (operation, user, sofiaFee, multiVaultValue, totalReceived) => {
    console.log(`\n📤 TRANSACTION FORWARDED:`);
    console.log(`   Operation:       ${operation}`);
    console.log(`   User:            ${user}`);
    console.log(`   Sofia Fee:       ${formatEther(sofiaFee)} ETH`);
    console.log(`   MultiVault Value: ${formatEther(multiVaultValue)} ETH`);
    console.log(`   Total Received:  ${formatEther(totalReceived)} ETH`);
  });

  proxy.on("MultiVaultSuccess", (operation, resultCount) => {
    console.log(`\n✅ MULTIVAULT SUCCESS:`);
    console.log(`   Operation:     ${operation}`);
    console.log(`   Result Count:  ${resultCount}`);
  });

  // Export addresses for extension config
  console.log("\n" + "=".repeat(60));
  console.log("📋 COPY THESE TO YOUR EXTENSION CONFIG:");
  console.log("=".repeat(60));
  console.log(`\nexport const MULTIVAULT_CONTRACT_ADDRESS = "${mockVaultAddress}";`);
  console.log(`export const SOFIA_PROXY_ADDRESS = "${proxyAddress}";`);

  // Run a test transaction
  console.log("\n" + "=".repeat(60));
  console.log("🧪 RUNNING TEST TRANSACTION...");
  console.log("=".repeat(60));

  const testData = ethers.hexlify(ethers.toUtf8Bytes("ipfs://QmTest123"));
  const totalCost = atomCost + CREATION_FEE;

  console.log(`\n   Creating atom with data: ${testData}`);
  console.log(`   Atom cost: ${formatEther(atomCost)} ETH`);
  console.log(`   Sofia fee: ${formatEther(CREATION_FEE)} ETH`);
  console.log(`   Total:     ${formatEther(totalCost)} ETH`);

  const balanceBefore = await ethers.provider.getBalance(deployer.address);

  const tx = await proxy.createAtoms([testData], [atomCost], { value: totalCost });
  const receipt = await tx.wait();

  const balanceAfter = await ethers.provider.getBalance(deployer.address);

  console.log(`\n   ✅ Transaction hash: ${receipt?.hash}`);
  console.log(`   Gas used: ${receipt?.gasUsed}`);
  console.log(`   Fee recipient balance change: ${formatEther(balanceAfter - balanceBefore)} ETH`);

  // Keep alive for event listening
  console.log("\n" + "=".repeat(60));
  console.log("⏳ DEPLOYMENT COMPLETE - KEEPING ALIVE FOR EVENTS");
  console.log("   Press Ctrl+C to stop");
  console.log("=".repeat(60) + "\n");

  // Keep the script running
  await new Promise(() => {});
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
