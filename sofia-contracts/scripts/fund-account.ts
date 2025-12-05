import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const targetAddress = process.env.TARGET_ADDRESS || "0xc634457ad68b037e2d5aa1c10c3930d7e4e2d551";

  console.log("Sending from:", signer.address);
  console.log("Sending to:", targetAddress);

  const tx = await signer.sendTransaction({
    to: targetAddress,
    value: ethers.parseEther("10")
  });

  await tx.wait();
  console.log("✅ Sent 10 ETH to", targetAddress);
  console.log("TX Hash:", tx.hash);

  const balance = await ethers.provider.getBalance(targetAddress);
  console.log("New balance:", ethers.formatEther(balance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
