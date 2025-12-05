// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/// @title IEthMultiVault
/// @notice Interface for the Intuition MultiVault contract (subset of functions used by Sofia)
interface IEthMultiVault {
    // ============ Enums ============

    /// @notice Approval types for deposit/redemption delegation
    enum ApprovalTypes {
        NONE,       // 0 - No approval
        DEPOSIT,    // 1 - Can deposit on behalf
        REDEMPTION, // 2 - Can redeem on behalf
        BOTH        // 3 - Can deposit and redeem
    }

    // ============ Write Functions ============

    /// @notice Approve another address to deposit/redeem on your behalf
    /// @param sender Address to approve (e.g., SofiaFeeProxy)
    /// @param approvalType Type of approval to grant
    function approve(address sender, ApprovalTypes approvalType) external;

    /// @notice Create multiple atoms in a single transaction
    /// @param data Array of atom data (IPFS URIs as bytes)
    /// @param assets Array of asset values for each atom
    /// @return Array of created atom IDs
    function createAtoms(bytes[] calldata data, uint256[] calldata assets)
        external payable returns (bytes32[] memory);

    /// @notice Create multiple triples in a single transaction
    /// @param subjectIds Array of subject atom IDs
    /// @param predicateIds Array of predicate atom IDs
    /// @param objectIds Array of object atom IDs
    /// @param assets Array of asset values for each triple
    /// @return Array of created triple IDs
    function createTriples(
        bytes32[] calldata subjectIds,
        bytes32[] calldata predicateIds,
        bytes32[] calldata objectIds,
        uint256[] calldata assets
    ) external payable returns (bytes32[] memory);

    /// @notice Deposit assets into a vault
    /// @param receiver Address to receive the shares
    /// @param termId Vault ID (atom or triple)
    /// @param curveId Bonding curve ID (1 for voting, 2 for shares)
    /// @param minShares Minimum shares expected (slippage protection)
    /// @return shares Amount of shares minted
    function deposit(
        address receiver,
        bytes32 termId,
        uint256 curveId,
        uint256 minShares
    ) external payable returns (uint256 shares);

    /// @notice Batch deposit into multiple vaults
    /// @param receiver Address to receive the shares
    /// @param termIds Array of vault IDs
    /// @param curveIds Array of curve IDs
    /// @param assets Array of asset amounts
    /// @param minShares Array of minimum shares expected
    /// @return shares Array of shares minted
    function depositBatch(
        address receiver,
        bytes32[] calldata termIds,
        uint256[] calldata curveIds,
        uint256[] calldata assets,
        uint256[] calldata minShares
    ) external payable returns (uint256[] memory shares);

    // ============ View Functions ============

    /// @notice Get the cost to create an atom
    /// @return Cost in wei
    function getAtomCost() external view returns (uint256);

    /// @notice Get the cost to create a triple
    /// @return Cost in wei
    function getTripleCost() external view returns (uint256);

    /// @notice Calculate the atom ID from its data
    /// @param data Atom data (IPFS URI as bytes)
    /// @return id Calculated atom ID
    function calculateAtomId(bytes calldata data) external pure returns (bytes32 id);

    /// @notice Calculate the triple ID from its components
    /// @param subjectId Subject atom ID
    /// @param predicateId Predicate atom ID
    /// @param objectId Object atom ID
    /// @return Triple ID
    function calculateTripleId(
        bytes32 subjectId,
        bytes32 predicateId,
        bytes32 objectId
    ) external pure returns (bytes32);

    /// @notice Get triple components
    /// @param tripleId Triple ID
    /// @return subjectId Subject atom ID
    /// @return predicateId Predicate atom ID
    /// @return objectId Object atom ID
    function getTriple(bytes32 tripleId)
        external view returns (bytes32 subjectId, bytes32 predicateId, bytes32 objectId);

    /// @notice Get user's shares in a vault
    /// @param account User address
    /// @param termId Vault ID
    /// @param curveId Curve ID
    /// @return shares Amount of shares
    function getShares(
        address account,
        bytes32 termId,
        uint256 curveId
    ) external view returns (uint256 shares);

    /// @notice Check if a term (atom or triple) exists
    /// @param id Term ID
    /// @return exists True if exists
    function isTermCreated(bytes32 id) external view returns (bool exists);

    /// @notice Preview deposit result
    /// @param termId Vault ID
    /// @param curveId Curve ID
    /// @param assets Amount of assets to deposit
    /// @return shares Expected shares
    /// @return assetsAfterFees Assets after fees
    function previewDeposit(
        bytes32 termId,
        uint256 curveId,
        uint256 assets
    ) external view returns (uint256 shares, uint256 assetsAfterFees);
}
