// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "../interfaces/IEthMultiVault.sol";

/**
 * @title MockMultiVault
 * @notice Mock contract for testing SofiaFeeProxy
 */
contract MockMultiVault is IEthMultiVault {
    uint256 public atomCost = 0.0001 ether;
    uint256 public tripleCost = 0.0002 ether;

    // Track calls for testing
    uint256 public lastDepositAmount;
    address public lastDepositReceiver;
    bytes32 public lastDepositTermId;
    uint256 public lastDepositCurveId;

    uint256 public createAtomsCallCount;
    uint256 public createTriplesCallCount;
    uint256 public depositCallCount;
    uint256 public depositBatchCallCount;

    // Storage for mock data
    mapping(bytes32 => bool) public termCreated;
    mapping(bytes32 => bytes32) public tripleSubjects;
    mapping(bytes32 => bytes32) public triplePredicates;
    mapping(bytes32 => bytes32) public tripleObjects;
    mapping(address => mapping(bytes32 => mapping(uint256 => uint256))) public shares;
    mapping(address => mapping(address => ApprovalTypes)) public approvals;

    // ============ Write Functions ============

    function approve(address sender, ApprovalTypes approvalType) external override {
        approvals[msg.sender][sender] = approvalType;
    }

    function createAtoms(
        bytes[] calldata data,
        uint256[] calldata assets
    ) external payable override returns (bytes32[] memory atomIds) {
        createAtomsCallCount++;
        atomIds = new bytes32[](data.length);

        for (uint256 i = 0; i < data.length; i++) {
            atomIds[i] = keccak256(abi.encodePacked(data[i], block.timestamp, i));
            termCreated[atomIds[i]] = true;
        }

        return atomIds;
    }

    function createTriples(
        bytes32[] calldata subjectIds,
        bytes32[] calldata predicateIds,
        bytes32[] calldata objectIds,
        uint256[] calldata assets
    ) external payable override returns (bytes32[] memory tripleIds) {
        createTriplesCallCount++;
        tripleIds = new bytes32[](subjectIds.length);

        for (uint256 i = 0; i < subjectIds.length; i++) {
            tripleIds[i] = keccak256(abi.encodePacked(subjectIds[i], predicateIds[i], objectIds[i]));
            termCreated[tripleIds[i]] = true;
            tripleSubjects[tripleIds[i]] = subjectIds[i];
            triplePredicates[tripleIds[i]] = predicateIds[i];
            tripleObjects[tripleIds[i]] = objectIds[i];
        }

        return tripleIds;
    }

    function deposit(
        address receiver,
        bytes32 termId,
        uint256 curveId,
        uint256 minShares
    ) external payable override returns (uint256 sharesOut) {
        depositCallCount++;
        lastDepositAmount = msg.value;
        lastDepositReceiver = receiver;
        lastDepositTermId = termId;
        lastDepositCurveId = curveId;

        // Mock shares calculation: 1:1 ratio
        sharesOut = msg.value;
        shares[receiver][termId][curveId] += sharesOut;

        return sharesOut;
    }

    function depositBatch(
        address receiver,
        bytes32[] calldata termIds,
        uint256[] calldata curveIds,
        uint256[] calldata assets,
        uint256[] calldata minShares
    ) external payable override returns (uint256[] memory sharesOut) {
        depositBatchCallCount++;
        sharesOut = new uint256[](termIds.length);

        for (uint256 i = 0; i < termIds.length; i++) {
            sharesOut[i] = assets[i]; // 1:1 ratio
            shares[receiver][termIds[i]][curveIds[i]] += sharesOut[i];
        }

        return sharesOut;
    }

    // ============ View Functions ============

    function getAtomCost() external view override returns (uint256) {
        return atomCost;
    }

    function getTripleCost() external view override returns (uint256) {
        return tripleCost;
    }

    function calculateAtomId(bytes calldata data) external pure override returns (bytes32) {
        return keccak256(data);
    }

    function calculateTripleId(
        bytes32 subjectId,
        bytes32 predicateId,
        bytes32 objectId
    ) external pure override returns (bytes32) {
        return keccak256(abi.encodePacked(subjectId, predicateId, objectId));
    }

    function getTriple(bytes32 tripleId) external view override returns (
        bytes32 subjectId,
        bytes32 predicateId,
        bytes32 objectId
    ) {
        return (
            tripleSubjects[tripleId],
            triplePredicates[tripleId],
            tripleObjects[tripleId]
        );
    }

    function getShares(
        address account,
        bytes32 termId,
        uint256 curveId
    ) external view override returns (uint256) {
        return shares[account][termId][curveId];
    }

    function isTermCreated(bytes32 id) external view override returns (bool) {
        return termCreated[id];
    }

    function previewDeposit(
        bytes32 termId,
        uint256 curveId,
        uint256 assets
    ) external pure override returns (uint256, uint256) {
        // Mock: 1:1 ratio, no fees
        return (assets, assets);
    }

    // ============ Test Helpers ============

    function setAtomCost(uint256 _cost) external {
        atomCost = _cost;
    }

    function setTripleCost(uint256 _cost) external {
        tripleCost = _cost;
    }

    function setTermCreated(bytes32 termId, bool created) external {
        termCreated[termId] = created;
    }

    function setShares(address account, bytes32 termId, uint256 curveId, uint256 amount) external {
        shares[account][termId][curveId] = amount;
    }

    // Allow receiving ETH
    receive() external payable {}
}
