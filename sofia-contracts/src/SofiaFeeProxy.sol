// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {IEthMultiVault} from "./interfaces/IEthMultiVault.sol";
import {Errors} from "./libraries/Errors.sol";

/// @title SofiaFeeProxy
/// @author Sofia Team
/// @notice Proxy contract for Intuition MultiVault with fee collection
/// @dev Collects fees on all transactions and forwards them to a Gnosis Safe multisig
contract SofiaFeeProxy {
    // ============ Constants ============

    /// @notice Fee denominator for percentage calculations (10000 = 100%)
    uint256 public constant FEE_DENOMINATOR = 10000;

    /// @notice Maximum allowed fee percentage (100%)
    uint256 public constant MAX_FEE_PERCENTAGE = 10000;

    // ============ Immutables ============

    /// @notice Reference to the Intuition MultiVault contract
    IEthMultiVault public immutable ethMultiVault;

    // ============ State Variables ============

    /// @notice Address receiving collected fees (Gnosis Safe)
    address public feeRecipient;

    /// @notice Fixed fee for creation operations (atoms/triples) in wei
    /// @dev Default: 0.1 TRUST = 10^17 wei
    uint256 public creationFixedFee;

    /// @notice Fixed fee for deposit operations in wei
    /// @dev Default: 0.1 TRUST = 10^17 wei
    uint256 public depositFixedFee;

    /// @notice Percentage fee for deposits (base 10000)
    /// @dev Default: 200 = 2%
    uint256 public depositPercentageFee;

    /// @notice Mapping of whitelisted admin addresses
    mapping(address => bool) public whitelistedAdmins;

    // ============ Events ============

    /// @notice Emitted when fee recipient is updated
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    /// @notice Emitted when creation fixed fee is updated
    event CreationFixedFeeUpdated(uint256 oldFee, uint256 newFee);

    /// @notice Emitted when deposit fixed fee is updated
    event DepositFixedFeeUpdated(uint256 oldFee, uint256 newFee);

    /// @notice Emitted when deposit percentage fee is updated
    event DepositPercentageFeeUpdated(uint256 oldFee, uint256 newFee);

    /// @notice Emitted when admin whitelist status is updated
    event AdminWhitelistUpdated(address indexed admin, bool status);

    /// @notice Emitted when fees are collected
    event FeesCollected(
        address indexed user,
        uint256 amount,
        string operation
    );

    /// @notice Emitted when a transaction is forwarded to MultiVault (debug)
    event TransactionForwarded(
        string operation,
        address indexed user,
        uint256 sofiaFee,
        uint256 multiVaultValue,
        uint256 totalReceived
    );

    /// @notice Emitted when MultiVault returns results (debug)
    event MultiVaultSuccess(
        string operation,
        uint256 resultCount
    );

    // ============ Modifiers ============

    /// @notice Restricts function to whitelisted admins only
    modifier onlyWhitelistedAdmin() {
        if (!whitelistedAdmins[msg.sender]) {
            revert Errors.SofiaFeeProxy_NotWhitelistedAdmin();
        }
        _;
    }

    // ============ Constructor ============

    /// @notice Initializes the SofiaFeeProxy contract
    /// @param _ethMultiVault Address of the Intuition MultiVault contract
    /// @param _feeRecipient Address to receive collected fees (Gnosis Safe)
    /// @param _creationFixedFee Initial fixed fee for creations (in wei)
    /// @param _depositFixedFee Initial fixed fee for deposits (in wei)
    /// @param _depositPercentageFee Initial percentage fee for deposits (base 10000)
    /// @param _initialAdmins Array of initial admin addresses to whitelist
    constructor(
        address _ethMultiVault,
        address _feeRecipient,
        uint256 _creationFixedFee,
        uint256 _depositFixedFee,
        uint256 _depositPercentageFee,
        address[] memory _initialAdmins
    ) {
        if (_ethMultiVault == address(0)) {
            revert Errors.SofiaFeeProxy_InvalidMultiVaultAddress();
        }
        if (_feeRecipient == address(0)) {
            revert Errors.SofiaFeeProxy_InvalidMultisigAddress();
        }
        if (_depositPercentageFee > MAX_FEE_PERCENTAGE) {
            revert Errors.SofiaFeeProxy_FeePercentageTooHigh();
        }

        ethMultiVault = IEthMultiVault(_ethMultiVault);
        feeRecipient = _feeRecipient;
        creationFixedFee = _creationFixedFee;
        depositFixedFee = _depositFixedFee;
        depositPercentageFee = _depositPercentageFee;

        // Whitelist initial admins
        for (uint256 i = 0; i < _initialAdmins.length; i++) {
            if (_initialAdmins[i] != address(0)) {
                whitelistedAdmins[_initialAdmins[i]] = true;
                emit AdminWhitelistUpdated(_initialAdmins[i], true);
            }
        }
    }

    // ============ Fee Calculation Functions ============

    /// @notice Calculate Sofia fee for a deposit
    /// @param depositAmount Amount to be deposited
    /// @return Total fee (fixed + percentage)
    function calculateDepositFee(uint256 depositAmount) public view returns (uint256) {
        uint256 percentageFee = (depositAmount * depositPercentageFee) / FEE_DENOMINATOR;
        return depositFixedFee + percentageFee;
    }

    /// @notice Calculate Sofia fee for creation operations
    /// @param count Number of items being created
    /// @return Total fee (fixed fee * count)
    function calculateCreationFee(uint256 count) public view returns (uint256) {
        return creationFixedFee * count;
    }

    /// @notice Helper for frontend - get total cost for a deposit
    /// @param depositAmount Amount user wants to deposit
    /// @return Total amount user needs to send (deposit + fees)
    function getTotalDepositCost(uint256 depositAmount) external view returns (uint256) {
        return depositAmount + calculateDepositFee(depositAmount);
    }

    /// @notice Helper for frontend - get total cost for creation
    /// @param count Number of items to create
    /// @param multiVaultCost Total cost required by MultiVault
    /// @return Total amount user needs to send
    function getTotalCreationCost(uint256 count, uint256 multiVaultCost) external view returns (uint256) {
        return multiVaultCost + calculateCreationFee(count);
    }

    // ============ Admin Functions ============

    /// @notice Update the creation fixed fee
    /// @param newFee New fee in wei
    function setCreationFixedFee(uint256 newFee) external onlyWhitelistedAdmin {
        uint256 oldFee = creationFixedFee;
        creationFixedFee = newFee;
        emit CreationFixedFeeUpdated(oldFee, newFee);
    }

    /// @notice Update the deposit fixed fee
    /// @param newFee New fee in wei
    function setDepositFixedFee(uint256 newFee) external onlyWhitelistedAdmin {
        uint256 oldFee = depositFixedFee;
        depositFixedFee = newFee;
        emit DepositFixedFeeUpdated(oldFee, newFee);
    }

    /// @notice Update the deposit percentage fee
    /// @param newFee New fee (base 10000, e.g., 200 = 2%)
    function setDepositPercentageFee(uint256 newFee) external onlyWhitelistedAdmin {
        if (newFee > MAX_FEE_PERCENTAGE) {
            revert Errors.SofiaFeeProxy_FeePercentageTooHigh();
        }
        uint256 oldFee = depositPercentageFee;
        depositPercentageFee = newFee;
        emit DepositPercentageFeeUpdated(oldFee, newFee);
    }

    /// @notice Update the fee recipient address
    /// @param newRecipient New recipient address
    function setFeeRecipient(address newRecipient) external onlyWhitelistedAdmin {
        if (newRecipient == address(0)) {
            revert Errors.SofiaFeeProxy_ZeroAddress();
        }
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    /// @notice Update admin whitelist status
    /// @param admin Address to update
    /// @param status New whitelist status
    function setWhitelistedAdmin(address admin, bool status) external onlyWhitelistedAdmin {
        if (admin == address(0)) {
            revert Errors.SofiaFeeProxy_ZeroAddress();
        }
        whitelistedAdmins[admin] = status;
        emit AdminWhitelistUpdated(admin, status);
    }

    // ============ Proxy Functions (Payable) ============

    /// @notice Create atoms with Sofia fee collection and deposit to receiver
    /// @dev Receiver must have approved this proxy on MultiVault for DEPOSIT
    /// @param receiver Address to receive the shares (the real user)
    /// @param data Array of atom data (IPFS URIs as bytes)
    /// @param assets Array of deposit amounts for each atom (on top of creation cost)
    /// @param curveId Bonding curve ID for deposits (1 = linear, 2 = progressive)
    /// @return atomIds Array of created atom IDs
    function createAtoms(
        address receiver,
        bytes[] calldata data,
        uint256[] calldata assets,
        uint256 curveId
    ) external payable returns (bytes32[] memory atomIds) {
        if (data.length != assets.length) {
            revert Errors.SofiaFeeProxy_WrongArrayLengths();
        }

        uint256 count = data.length;
        uint256 sofiaFee = calculateCreationFee(count);
        uint256 atomCost = ethMultiVault.getAtomCost();
        uint256 totalDeposit = _sumArray(assets);
        uint256 multiVaultCost = (atomCost * count) + totalDeposit;
        uint256 totalRequired = sofiaFee + multiVaultCost;

        if (msg.value < totalRequired) {
            revert Errors.SofiaFeeProxy_InsufficientValue();
        }

        _transferFee(sofiaFee);
        emit FeesCollected(msg.sender, sofiaFee, "createAtoms");
        emit TransactionForwarded("createAtoms", msg.sender, sofiaFee, multiVaultCost, msg.value);

        // Create atoms with minimum cost (just atomCost per atom)
        uint256[] memory minAssets = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            minAssets[i] = atomCost;
        }
        atomIds = ethMultiVault.createAtoms{value: atomCost * count}(data, minAssets);

        // Deposit remaining assets to receiver for each atom
        for (uint256 i = 0; i < count; i++) {
            if (assets[i] > 0) {
                ethMultiVault.deposit{value: assets[i]}(
                    receiver,
                    atomIds[i],
                    curveId,
                    0 // minShares
                );
            }
        }

        emit MultiVaultSuccess("createAtoms", count);
        return atomIds;
    }

    /// @notice Create triples with Sofia fee collection and deposit to receiver
    /// @dev Receiver must have approved this proxy on MultiVault for DEPOSIT
    /// @param receiver Address to receive the shares (the real user)
    /// @param subjectIds Array of subject atom IDs
    /// @param predicateIds Array of predicate atom IDs
    /// @param objectIds Array of object atom IDs
    /// @param assets Array of deposit amounts for each triple (on top of creation cost)
    /// @param curveId Bonding curve ID for deposits (1 = linear, 2 = progressive)
    /// @return tripleIds Array of created triple IDs
    function createTriples(
        address receiver,
        bytes32[] calldata subjectIds,
        bytes32[] calldata predicateIds,
        bytes32[] calldata objectIds,
        uint256[] calldata assets,
        uint256 curveId
    ) external payable returns (bytes32[] memory tripleIds) {
        if (subjectIds.length != predicateIds.length ||
            predicateIds.length != objectIds.length ||
            objectIds.length != assets.length) {
            revert Errors.SofiaFeeProxy_WrongArrayLengths();
        }

        uint256 count = subjectIds.length;
        uint256 sofiaFee = calculateCreationFee(count);
        uint256 tripleCost = ethMultiVault.getTripleCost();
        uint256 totalDeposit = _sumArray(assets);
        uint256 multiVaultCost = (tripleCost * count) + totalDeposit;
        uint256 totalRequired = sofiaFee + multiVaultCost;

        if (msg.value < totalRequired) {
            revert Errors.SofiaFeeProxy_InsufficientValue();
        }

        _transferFee(sofiaFee);
        emit FeesCollected(msg.sender, sofiaFee, "createTriples");
        emit TransactionForwarded("createTriples", msg.sender, sofiaFee, multiVaultCost, msg.value);

        // Create triples with minimum cost (just tripleCost per triple)
        uint256[] memory minAssets = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            minAssets[i] = tripleCost;
        }
        tripleIds = ethMultiVault.createTriples{value: tripleCost * count}(
            subjectIds,
            predicateIds,
            objectIds,
            minAssets
        );

        // Deposit remaining assets to receiver for each triple
        for (uint256 i = 0; i < count; i++) {
            if (assets[i] > 0) {
                ethMultiVault.deposit{value: assets[i]}(
                    receiver,
                    tripleIds[i],
                    curveId,
                    0 // minShares
                );
            }
        }

        emit MultiVaultSuccess("createTriples", count);
        return tripleIds;
    }

    /// @notice Deposit with Sofia fee collection - SAME SIGNATURE AS MULTIVAULT
    /// @dev Fee is calculated from msg.value using inverse formula
    /// @param receiver Address to receive shares
    /// @param termId Vault ID (atom or triple)
    /// @param curveId Bonding curve ID
    /// @param minShares Minimum shares expected
    /// @return shares Amount of shares minted
    function deposit(
        address receiver,
        bytes32 termId,
        uint256 curveId,
        uint256 minShares
    ) external payable returns (uint256 shares) {
        // Must send more than just the fixed fee
        if (msg.value <= depositFixedFee) {
            revert Errors.SofiaFeeProxy_InsufficientValue();
        }

        // Inverse calculation: how much to send to MultiVault
        // Formula: multiVaultAmount = (msg.value - fixedFee) * 10000 / (10000 + percentage)
        uint256 multiVaultAmount = (msg.value - depositFixedFee) * FEE_DENOMINATOR
                                   / (FEE_DENOMINATOR + depositPercentageFee);
        uint256 sofiaFee = msg.value - multiVaultAmount;

        _transferFee(sofiaFee);
        emit FeesCollected(msg.sender, sofiaFee, "deposit");
        emit TransactionForwarded("deposit", msg.sender, sofiaFee, multiVaultAmount, msg.value);

        uint256 result = ethMultiVault.deposit{value: multiVaultAmount}(
            receiver,
            termId,
            curveId,
            minShares
        );
        emit MultiVaultSuccess("deposit", 1);
        return result;
    }

    /// @notice Calculate how much MultiVault will receive for a given msg.value
    /// @param msgValue The value that will be sent with the transaction
    /// @return Amount that will be forwarded to MultiVault
    function getMultiVaultAmountFromValue(uint256 msgValue) public view returns (uint256) {
        if (msgValue <= depositFixedFee) return 0;
        return (msgValue - depositFixedFee) * FEE_DENOMINATOR / (FEE_DENOMINATOR + depositPercentageFee);
    }

    /// @notice Batch deposit with Sofia fee collection
    /// @param receiver Address to receive shares
    /// @param termIds Array of vault IDs
    /// @param curveIds Array of curve IDs
    /// @param assets Array of deposit amounts
    /// @param minShares Array of minimum shares expected
    /// @return shares Array of shares minted
    function depositBatch(
        address receiver,
        bytes32[] calldata termIds,
        uint256[] calldata curveIds,
        uint256[] calldata assets,
        uint256[] calldata minShares
    ) external payable returns (uint256[] memory shares) {
        if (termIds.length != curveIds.length ||
            curveIds.length != assets.length ||
            assets.length != minShares.length) {
            revert Errors.SofiaFeeProxy_WrongArrayLengths();
        }

        uint256 totalDeposit = _sumArray(assets);
        // Fee: fixed fee per deposit + percentage of total
        uint256 sofiaFee = (depositFixedFee * termIds.length) +
            ((totalDeposit * depositPercentageFee) / FEE_DENOMINATOR);
        uint256 totalRequired = totalDeposit + sofiaFee;

        if (msg.value < totalRequired) {
            revert Errors.SofiaFeeProxy_InsufficientValue();
        }

        _transferFee(sofiaFee);
        emit FeesCollected(msg.sender, sofiaFee, "depositBatch");
        emit TransactionForwarded("depositBatch", msg.sender, sofiaFee, totalDeposit, msg.value);

        uint256[] memory result = ethMultiVault.depositBatch{value: totalDeposit}(
            receiver,
            termIds,
            curveIds,
            assets,
            minShares
        );
        emit MultiVaultSuccess("depositBatch", result.length);
        return result;
    }

    // ============ View Functions (Passthrough) ============

    /// @notice Get atom creation cost from MultiVault
    function getAtomCost() external view returns (uint256) {
        return ethMultiVault.getAtomCost();
    }

    /// @notice Get triple creation cost from MultiVault
    function getTripleCost() external view returns (uint256) {
        return ethMultiVault.getTripleCost();
    }

    /// @notice Calculate atom ID (passthrough to MultiVault)
    function calculateAtomId(bytes calldata data) external pure returns (bytes32) {
        return keccak256(data);
    }

    /// @notice Calculate triple ID (passthrough to MultiVault)
    function calculateTripleId(
        bytes32 subjectId,
        bytes32 predicateId,
        bytes32 objectId
    ) external view returns (bytes32) {
        return ethMultiVault.calculateTripleId(subjectId, predicateId, objectId);
    }

    /// @notice Get triple components (passthrough to MultiVault)
    function getTriple(bytes32 tripleId)
        external view returns (bytes32, bytes32, bytes32)
    {
        return ethMultiVault.getTriple(tripleId);
    }

    /// @notice Get user shares (passthrough to MultiVault)
    function getShares(
        address account,
        bytes32 termId,
        uint256 curveId
    ) external view returns (uint256) {
        return ethMultiVault.getShares(account, termId, curveId);
    }

    /// @notice Check if term exists (passthrough to MultiVault)
    function isTermCreated(bytes32 id) external view returns (bool) {
        return ethMultiVault.isTermCreated(id);
    }

    /// @notice Preview deposit (passthrough to MultiVault)
    function previewDeposit(
        bytes32 termId,
        uint256 curveId,
        uint256 assets
    ) external view returns (uint256, uint256) {
        return ethMultiVault.previewDeposit(termId, curveId, assets);
    }

    // ============ Internal Functions ============

    /// @notice Transfer collected fees to recipient
    /// @param amount Amount to transfer
    function _transferFee(uint256 amount) internal {
        if (amount > 0) {
            (bool success, ) = feeRecipient.call{value: amount}("");
            if (!success) {
                revert Errors.SofiaFeeProxy_TransferFailed();
            }
        }
    }

    /// @notice Sum array of uint256 values
    /// @param arr Array to sum
    /// @return sum Total sum
    function _sumArray(uint256[] calldata arr) internal pure returns (uint256 sum) {
        for (uint256 i = 0; i < arr.length; i++) {
            sum += arr[i];
        }
    }

    /// @notice Receive function to accept ETH (for refunds)
    receive() external payable {}
}
