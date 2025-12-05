import { ethers, network } from "hardhat";

// ============ MultiVault Addresses ============
const MULTIVAULT_INTUITION = "0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e"; // Intuition Mainnet
const MULTIVAULT_BASE = "0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e";
const MULTIVAULT_BASE_SEPOLIA = "0x2Ece8D4dEdcB9918A398528f3fa4688b1d2CAB91";

// ============ Fee Recipient ============
const GNOSIS_SAFE = "0x68c72d6c3d81B20D8F81e4E41BA2F373973141eD";

// ============ Initial Fee Configuration ============
const INITIAL_CREATION_FEE = ethers.parseEther("0.1"); // 0.1 TRUST
const INITIAL_DEPOSIT_FEE = ethers.parseEther("0"); // No fixed deposit fee
const INITIAL_DEPOSIT_PERCENTAGE = 500n; // 5%

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Get admin addresses from environment
  const admin1 = process.env.ADMIN_1;
  const admin2 = process.env.ADMIN_2;

  if (!admin1 || !admin2) {
    throw new Error("Missing ADMIN_1 or ADMIN_2 environment variables");
  }

  const admins = [admin1, admin2];

  // Select MultiVault address based on network
  let multiVault: string;
  const chainId = (await ethers.provider.getNetwork()).chainId;

  if (chainId === 1155n) {
    // Intuition Mainnet
    multiVault = MULTIVAULT_INTUITION;
    console.log("Deploying to Intuition Mainnet");
  } else if (chainId === 8453n) {
    // Base Mainnet
    multiVault = MULTIVAULT_BASE;
    console.log("Deploying to Base Mainnet");
  } else if (chainId === 84532n) {
    // Base Sepolia
    multiVault = MULTIVAULT_BASE_SEPOLIA;
    console.log("Deploying to Base Sepolia");
  } else if (chainId === 31337n) {
    // Local Hardhat - use Sepolia address for testing
    multiVault = MULTIVAULT_BASE_SEPOLIA;
    console.log("Deploying to local network (using Sepolia MultiVault)");
  } else {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  console.log("\nConfiguration:");
  console.log("- MultiVault address:", multiVault);
  console.log("- Fee recipient (Gnosis Safe):", GNOSIS_SAFE);
  console.log("- Admin 1:", admin1);
  console.log("- Admin 2:", admin2);
  console.log("- Creation fee:", ethers.formatEther(INITIAL_CREATION_FEE), "ETH");
  console.log("- Deposit fixed fee:", ethers.formatEther(INITIAL_DEPOSIT_FEE), "ETH");
  console.log("- Deposit percentage:", Number(INITIAL_DEPOSIT_PERCENTAGE) / 100, "%");

  // Deploy SofiaFeeProxy
  const SofiaFeeProxy = await ethers.getContractFactory("SofiaFeeProxy");
  const proxy = await SofiaFeeProxy.deploy(
    multiVault,
    GNOSIS_SAFE,
    INITIAL_CREATION_FEE,
    INITIAL_DEPOSIT_FEE,
    INITIAL_DEPOSIT_PERCENTAGE,
    admins
  );

  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();

  console.log("\n========================================");
  console.log("SofiaFeeProxy deployed successfully!");
  console.log("Contract address:", proxyAddress);
  console.log("========================================");

  // Verify contract on explorer (if not local)
  if (chainId !== 31337n) {
    console.log("\nWaiting for block confirmations...");
    // Wait for 5 block confirmations
    const deployTx = proxy.deploymentTransaction();
    if (deployTx) {
      await deployTx.wait(5);
    }

    console.log("Verifying contract on Basescan...");
    try {
      const { run } = await import("hardhat");
      await run("verify:verify", {
        address: proxyAddress,
        constructorArguments: [
          multiVault,
          GNOSIS_SAFE,
          INITIAL_CREATION_FEE,
          INITIAL_DEPOSIT_FEE,
          INITIAL_DEPOSIT_PERCENTAGE,
          admins,
        ],
      });
      console.log("Contract verified successfully!");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract already verified");
      } else {
        console.error("Verification failed:", error.message);
      }
    }
  }

  return proxyAddress;
}

main()
  .then((address) => {
    console.log("\nDeployment complete. Contract address:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
