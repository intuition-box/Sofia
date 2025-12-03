import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SofiaFeeProxy, MockMultiVault } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SofiaFeeProxy", function () {
  // Constants
  const GNOSIS_SAFE = "0x68c72d6c3d81B20D8F81e4E41BA2F373973141eD";
  const CREATION_FEE = ethers.parseEther("0.1"); // 0.1 TRUST
  const DEPOSIT_FEE = ethers.parseEther("0.1"); // 0.1 TRUST
  const DEPOSIT_PERCENTAGE = 200n; // 2%
  const FEE_DENOMINATOR = 10000n;

  // Fixture to deploy contracts
  async function deployFixture() {
    const [owner, admin1, admin2, admin3, user, nonAdmin] = await ethers.getSigners();

    // Deploy MockMultiVault
    const MockMultiVaultFactory = await ethers.getContractFactory("MockMultiVault");
    const mockMultiVault = await MockMultiVaultFactory.deploy();
    await mockMultiVault.waitForDeployment();

    // Deploy SofiaFeeProxy
    const SofiaFeeProxyFactory = await ethers.getContractFactory("SofiaFeeProxy");
    const proxy = await SofiaFeeProxyFactory.deploy(
      await mockMultiVault.getAddress(),
      GNOSIS_SAFE,
      CREATION_FEE,
      DEPOSIT_FEE,
      DEPOSIT_PERCENTAGE,
      [admin1.address, admin2.address, admin3.address]
    );
    await proxy.waitForDeployment();

    return { proxy, mockMultiVault, owner, admin1, admin2, admin3, user, nonAdmin };
  }

  describe("Initialization", function () {
    it("Should set correct MultiVault address", async function () {
      const { proxy, mockMultiVault } = await loadFixture(deployFixture);
      expect(await proxy.ethMultiVault()).to.equal(await mockMultiVault.getAddress());
    });

    it("Should set correct fee recipient", async function () {
      const { proxy } = await loadFixture(deployFixture);
      expect(await proxy.feeRecipient()).to.equal(GNOSIS_SAFE);
    });

    it("Should set correct creation fee", async function () {
      const { proxy } = await loadFixture(deployFixture);
      expect(await proxy.creationFixedFee()).to.equal(CREATION_FEE);
    });

    it("Should set correct deposit fees", async function () {
      const { proxy } = await loadFixture(deployFixture);
      expect(await proxy.depositFixedFee()).to.equal(DEPOSIT_FEE);
      expect(await proxy.depositPercentageFee()).to.equal(DEPOSIT_PERCENTAGE);
    });

    it("Should whitelist initial admins", async function () {
      const { proxy, admin1, admin2, admin3 } = await loadFixture(deployFixture);
      expect(await proxy.whitelistedAdmins(admin1.address)).to.be.true;
      expect(await proxy.whitelistedAdmins(admin2.address)).to.be.true;
      expect(await proxy.whitelistedAdmins(admin3.address)).to.be.true;
    });

    it("Should not whitelist non-admins", async function () {
      const { proxy, nonAdmin } = await loadFixture(deployFixture);
      expect(await proxy.whitelistedAdmins(nonAdmin.address)).to.be.false;
    });

    it("Should revert on zero MultiVault address", async function () {
      const [admin] = await ethers.getSigners();
      const SofiaFeeProxyFactory = await ethers.getContractFactory("SofiaFeeProxy");

      await expect(
        SofiaFeeProxyFactory.deploy(
          ethers.ZeroAddress,
          GNOSIS_SAFE,
          CREATION_FEE,
          DEPOSIT_FEE,
          DEPOSIT_PERCENTAGE,
          [admin.address]
        )
      ).to.be.revertedWithCustomError(SofiaFeeProxyFactory, "SofiaFeeProxy_InvalidMultiVaultAddress");
    });

    it("Should revert on zero fee recipient address", async function () {
      const { mockMultiVault } = await loadFixture(deployFixture);
      const [admin] = await ethers.getSigners();
      const SofiaFeeProxyFactory = await ethers.getContractFactory("SofiaFeeProxy");

      await expect(
        SofiaFeeProxyFactory.deploy(
          await mockMultiVault.getAddress(),
          ethers.ZeroAddress,
          CREATION_FEE,
          DEPOSIT_FEE,
          DEPOSIT_PERCENTAGE,
          [admin.address]
        )
      ).to.be.revertedWithCustomError(SofiaFeeProxyFactory, "SofiaFeeProxy_InvalidMultisigAddress");
    });
  });

  describe("Fee Calculations", function () {
    it("Should calculate deposit fee correctly", async function () {
      const { proxy } = await loadFixture(deployFixture);
      const depositAmount = ethers.parseEther("10");

      // Fee = 0.1 + (10 * 2%) = 0.1 + 0.2 = 0.3 TRUST
      const expectedFee = DEPOSIT_FEE + (depositAmount * DEPOSIT_PERCENTAGE / FEE_DENOMINATOR);
      expect(await proxy.calculateDepositFee(depositAmount)).to.equal(expectedFee);
      expect(expectedFee).to.equal(ethers.parseEther("0.3"));
    });

    it("Should calculate creation fee correctly", async function () {
      const { proxy } = await loadFixture(deployFixture);
      const count = 5n;

      // Fee = 0.1 * 5 = 0.5 TRUST
      const expectedFee = CREATION_FEE * count;
      expect(await proxy.calculateCreationFee(count)).to.equal(expectedFee);
      expect(expectedFee).to.equal(ethers.parseEther("0.5"));
    });

    it("Should calculate total deposit cost correctly", async function () {
      const { proxy } = await loadFixture(deployFixture);
      const depositAmount = ethers.parseEther("10");

      const fee = await proxy.calculateDepositFee(depositAmount);
      const totalCost = await proxy.getTotalDepositCost(depositAmount);
      expect(totalCost).to.equal(depositAmount + fee);
    });

    it("Should calculate total creation cost correctly", async function () {
      const { proxy } = await loadFixture(deployFixture);
      const count = 3n;
      const multiVaultCost = ethers.parseEther("1");

      const fee = await proxy.calculateCreationFee(count);
      const totalCost = await proxy.getTotalCreationCost(count, multiVaultCost);
      expect(totalCost).to.equal(multiVaultCost + fee);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to set creation fee", async function () {
      const { proxy, admin1 } = await loadFixture(deployFixture);
      const newFee = ethers.parseEther("0.2");

      await expect(proxy.connect(admin1).setCreationFixedFee(newFee))
        .to.emit(proxy, "CreationFixedFeeUpdated")
        .withArgs(CREATION_FEE, newFee);

      expect(await proxy.creationFixedFee()).to.equal(newFee);
    });

    it("Should allow admin to set deposit fee", async function () {
      const { proxy, admin2 } = await loadFixture(deployFixture);
      const newFee = ethers.parseEther("0.05");

      await expect(proxy.connect(admin2).setDepositFixedFee(newFee))
        .to.emit(proxy, "DepositFixedFeeUpdated")
        .withArgs(DEPOSIT_FEE, newFee);

      expect(await proxy.depositFixedFee()).to.equal(newFee);
    });

    it("Should allow admin to set deposit percentage", async function () {
      const { proxy, admin3 } = await loadFixture(deployFixture);
      const newPercentage = 500n; // 5%

      await expect(proxy.connect(admin3).setDepositPercentageFee(newPercentage))
        .to.emit(proxy, "DepositPercentageFeeUpdated")
        .withArgs(DEPOSIT_PERCENTAGE, newPercentage);

      expect(await proxy.depositPercentageFee()).to.equal(newPercentage);
    });

    it("Should allow admin to set fee recipient", async function () {
      const { proxy, admin1, user } = await loadFixture(deployFixture);

      await expect(proxy.connect(admin1).setFeeRecipient(user.address))
        .to.emit(proxy, "FeeRecipientUpdated")
        .withArgs(GNOSIS_SAFE, user.address);

      expect(await proxy.feeRecipient()).to.equal(user.address);
    });

    it("Should allow admin to whitelist new admin", async function () {
      const { proxy, admin1, nonAdmin } = await loadFixture(deployFixture);

      await expect(proxy.connect(admin1).setWhitelistedAdmin(nonAdmin.address, true))
        .to.emit(proxy, "AdminWhitelistUpdated")
        .withArgs(nonAdmin.address, true);

      expect(await proxy.whitelistedAdmins(nonAdmin.address)).to.be.true;
    });

    it("Should allow admin to remove admin", async function () {
      const { proxy, admin1, admin2 } = await loadFixture(deployFixture);

      await proxy.connect(admin1).setWhitelistedAdmin(admin2.address, false);
      expect(await proxy.whitelistedAdmins(admin2.address)).to.be.false;
    });

    it("Should revert when non-admin tries to set fees", async function () {
      const { proxy, nonAdmin } = await loadFixture(deployFixture);

      await expect(proxy.connect(nonAdmin).setCreationFixedFee(ethers.parseEther("0.5")))
        .to.be.revertedWithCustomError(proxy, "SofiaFeeProxy_NotWhitelistedAdmin");
    });

    it("Should revert when setting fee recipient to zero address", async function () {
      const { proxy, admin1 } = await loadFixture(deployFixture);

      await expect(proxy.connect(admin1).setFeeRecipient(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(proxy, "SofiaFeeProxy_ZeroAddress");
    });

    it("Should revert when percentage fee is too high", async function () {
      const { proxy, admin1 } = await loadFixture(deployFixture);

      await expect(proxy.connect(admin1).setDepositPercentageFee(10001n))
        .to.be.revertedWithCustomError(proxy, "SofiaFeeProxy_FeePercentageTooHigh");
    });
  });

  describe("Proxy Functions - createAtoms", function () {
    it("Should collect fees on createAtoms", async function () {
      const { proxy, user } = await loadFixture(deployFixture);

      const data = [ethers.toUtf8Bytes("ipfs://atom1"), ethers.toUtf8Bytes("ipfs://atom2")];
      const assets = [ethers.parseEther("0.01"), ethers.parseEther("0.01")];

      const sofiaFee = await proxy.calculateCreationFee(2n);
      const multiVaultCost = ethers.parseEther("0.02");
      const totalRequired = sofiaFee + multiVaultCost;

      const initialBalance = await ethers.provider.getBalance(GNOSIS_SAFE);

      await expect(proxy.connect(user).createAtoms(data, assets, { value: totalRequired }))
        .to.emit(proxy, "FeesCollected")
        .withArgs(user.address, sofiaFee, "createAtoms");

      const finalBalance = await ethers.provider.getBalance(GNOSIS_SAFE);
      expect(finalBalance - initialBalance).to.equal(sofiaFee);
    });

    it("Should revert on insufficient value for createAtoms", async function () {
      const { proxy, user } = await loadFixture(deployFixture);

      const data = [ethers.toUtf8Bytes("ipfs://atom1")];
      const assets = [ethers.parseEther("0.01")];

      await expect(
        proxy.connect(user).createAtoms(data, assets, { value: ethers.parseEther("0.01") })
      ).to.be.revertedWithCustomError(proxy, "SofiaFeeProxy_InsufficientValue");
    });
  });

  describe("Proxy Functions - createTriples", function () {
    it("Should collect fees on createTriples", async function () {
      const { proxy, user } = await loadFixture(deployFixture);

      const subjectIds = [ethers.zeroPadValue("0x01", 32)];
      const predicateIds = [ethers.zeroPadValue("0x02", 32)];
      const objectIds = [ethers.zeroPadValue("0x03", 32)];
      const assets = [ethers.parseEther("0.01")];

      const sofiaFee = await proxy.calculateCreationFee(1n);
      const multiVaultCost = ethers.parseEther("0.01");
      const totalRequired = sofiaFee + multiVaultCost;

      const initialBalance = await ethers.provider.getBalance(GNOSIS_SAFE);

      await expect(proxy.connect(user).createTriples(subjectIds, predicateIds, objectIds, assets, { value: totalRequired }))
        .to.emit(proxy, "FeesCollected")
        .withArgs(user.address, sofiaFee, "createTriples");

      const finalBalance = await ethers.provider.getBalance(GNOSIS_SAFE);
      expect(finalBalance - initialBalance).to.equal(sofiaFee);
    });

    it("Should revert on wrong array lengths", async function () {
      const { proxy, user } = await loadFixture(deployFixture);

      const subjectIds = [ethers.zeroPadValue("0x01", 32), ethers.zeroPadValue("0x04", 32)];
      const predicateIds = [ethers.zeroPadValue("0x02", 32)]; // Wrong length
      const objectIds = [ethers.zeroPadValue("0x03", 32), ethers.zeroPadValue("0x05", 32)];
      const assets = [ethers.parseEther("0.01"), ethers.parseEther("0.01")];

      await expect(
        proxy.connect(user).createTriples(subjectIds, predicateIds, objectIds, assets, { value: ethers.parseEther("10") })
      ).to.be.revertedWithCustomError(proxy, "SofiaFeeProxy_WrongArrayLengths");
    });
  });

  describe("Proxy Functions - deposit", function () {
    it("Should collect fees on deposit", async function () {
      const { proxy, user } = await loadFixture(deployFixture);

      const depositAmount = ethers.parseEther("10");
      const sofiaFee = await proxy.calculateDepositFee(depositAmount);
      const totalRequired = depositAmount + sofiaFee;

      const initialBalance = await ethers.provider.getBalance(GNOSIS_SAFE);

      const termId = ethers.zeroPadValue("0x01", 32);

      await expect(proxy.connect(user).deposit(user.address, termId, 1n, 0n, depositAmount, { value: totalRequired }))
        .to.emit(proxy, "FeesCollected")
        .withArgs(user.address, sofiaFee, "deposit");

      const finalBalance = await ethers.provider.getBalance(GNOSIS_SAFE);
      expect(finalBalance - initialBalance).to.equal(sofiaFee);
    });

    it("Should revert on insufficient value for deposit", async function () {
      const { proxy, user } = await loadFixture(deployFixture);

      const depositAmount = ethers.parseEther("10");
      const termId = ethers.zeroPadValue("0x01", 32);

      // Send only depositAmount without fees
      await expect(
        proxy.connect(user).deposit(user.address, termId, 1n, 0n, depositAmount, { value: depositAmount })
      ).to.be.revertedWithCustomError(proxy, "SofiaFeeProxy_InsufficientValue");
    });
  });

  describe("Proxy Functions - depositBatch", function () {
    it("Should collect fees on depositBatch", async function () {
      const { proxy, user } = await loadFixture(deployFixture);

      const termIds = [ethers.zeroPadValue("0x01", 32), ethers.zeroPadValue("0x02", 32)];
      const curveIds = [1n, 1n];
      const assets = [ethers.parseEther("5"), ethers.parseEther("5")];
      const minShares = [0n, 0n];

      const totalDeposit = ethers.parseEther("10");
      // Fee: 2 * 0.1 + 10 * 2% = 0.2 + 0.2 = 0.4 TRUST
      const sofiaFee = (DEPOSIT_FEE * 2n) + ((totalDeposit * DEPOSIT_PERCENTAGE) / FEE_DENOMINATOR);
      const totalRequired = totalDeposit + sofiaFee;

      const initialBalance = await ethers.provider.getBalance(GNOSIS_SAFE);

      await expect(proxy.connect(user).depositBatch(user.address, termIds, curveIds, assets, minShares, { value: totalRequired }))
        .to.emit(proxy, "FeesCollected")
        .withArgs(user.address, sofiaFee, "depositBatch");

      const finalBalance = await ethers.provider.getBalance(GNOSIS_SAFE);
      expect(finalBalance - initialBalance).to.equal(sofiaFee);
    });

    it("Should revert on wrong array lengths in depositBatch", async function () {
      const { proxy, user } = await loadFixture(deployFixture);

      const termIds = [ethers.zeroPadValue("0x01", 32), ethers.zeroPadValue("0x02", 32)];
      const curveIds = [1n]; // Wrong length
      const assets = [ethers.parseEther("5"), ethers.parseEther("5")];
      const minShares = [0n, 0n];

      await expect(
        proxy.connect(user).depositBatch(user.address, termIds, curveIds, assets, minShares, { value: ethers.parseEther("20") })
      ).to.be.revertedWithCustomError(proxy, "SofiaFeeProxy_WrongArrayLengths");
    });
  });

  describe("View Functions (Passthrough)", function () {
    it("Should return atom cost from MultiVault", async function () {
      const { proxy, mockMultiVault } = await loadFixture(deployFixture);
      expect(await proxy.getAtomCost()).to.equal(await mockMultiVault.getAtomCost());
    });

    it("Should return triple cost from MultiVault", async function () {
      const { proxy, mockMultiVault } = await loadFixture(deployFixture);
      expect(await proxy.getTripleCost()).to.equal(await mockMultiVault.getTripleCost());
    });

    it("Should return isTermCreated from MultiVault", async function () {
      const { proxy, mockMultiVault } = await loadFixture(deployFixture);
      const termId = ethers.zeroPadValue("0x01", 32);
      // Set the term as created in the mock
      await mockMultiVault.setTermCreated(termId, true);
      expect(await proxy.isTermCreated(termId)).to.be.true;
    });

    it("Should return shares from MultiVault", async function () {
      const { proxy, mockMultiVault, user } = await loadFixture(deployFixture);
      const termId = ethers.zeroPadValue("0x01", 32);
      // Set shares in the mock
      await mockMultiVault.setShares(user.address, termId, 1n, 1000n);
      expect(await proxy.getShares(user.address, termId, 1n)).to.equal(1000n);
    });
  });
});
