import { ethers } from "hardhat";

/**
 * Deploy script for local testing with MockMultiVault
 * This deploys both a mock MultiVault and the SofiaFeeProxy for local development
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy MockMultiVault
  console.log("\nDeploying MockMultiVault...");
  const MockMultiVault = await ethers.getContractFactory("MockMultiVault");
  const mockVault = await MockMultiVault.deploy();
  await mockVault.waitForDeployment();
  const mockVaultAddress = await mockVault.getAddress();
  console.log("MockMultiVault deployed at:", mockVaultAddress);

  // Fee configuration
  const INITIAL_CREATION_FEE = ethers.parseEther("0.1"); // 0.1 TRUST
  const INITIAL_DEPOSIT_FEE = ethers.parseEther("0.1"); // 0.1 TRUST
  const INITIAL_DEPOSIT_PERCENTAGE = 200n; // 2%

  // Use deployer as fee recipient and admin for local testing
  const admins = [deployer.address];

  console.log("\nDeploying SofiaFeeProxy...");
  const SofiaFeeProxy = await ethers.getContractFactory("SofiaFeeProxy");
  const proxy = await SofiaFeeProxy.deploy(
    mockVaultAddress,
    deployer.address, // Fee recipient = deployer for local testing
    INITIAL_CREATION_FEE,
    INITIAL_DEPOSIT_FEE,
    INITIAL_DEPOSIT_PERCENTAGE,
    admins
  );

  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  console.log("\n========================================");
  console.log("Local deployment complete!");
  console.log("========================================");
  console.log("MockMultiVault:", mockVaultAddress);
  console.log("SofiaFeeProxy:", proxyAddress);
  console.log("Fee recipient:", deployer.address);
  console.log("Admin:", deployer.address);
  console.log("========================================");

  return { mockVaultAddress, proxyAddress };
}

main()
  .then(({ mockVaultAddress, proxyAddress }) => {
    console.log("\nDeployment addresses:");
    console.log(`MOCK_MULTIVAULT=${mockVaultAddress}`);
    console.log(`SOFIA_FEE_PROXY=${proxyAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
