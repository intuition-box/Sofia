// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {ITNSRegistry} from "./interfaces/ITNSRegistry.sol";
import {IIntuitionFeeProxyFactory} from "./interfaces/IIntuitionFeeProxyFactory.sol";
import {IIntuitionVersionedFeeProxy} from "./interfaces/IIntuitionVersionedFeeProxy.sol";

/**
 * @title CirclesFactory
 * @author Sofia
 * @notice Mints subdomains under circles.trust pointing to per-Circle fee
 *         proxies. Consumed by the Sofia Explorer when a user creates a
 *         named Circle.
 * @dev    This contract is NOT upgradeable. To replace it:
 *         1. Multisig pauses this factory.
 *         2. New factory is deployed.
 *         3. Multisig calls TNSRegistry.setApprovalForAll(oldFactory, false)
 *            and TNSRegistry.setApprovalForAll(newFactory, true).
 *         4. Sofia Explorer is repointed.
 *         Names already minted survive — the subdomain owner is the proxy
 *         address, not this factory.
 *
 *         Architecture:
 *         - Sofia multisig owns circles.trust on TNSRegistry
 *         - Multisig calls TNSRegistry.setApprovalForAll(thisFactory, true)
 *         - This factory mints subdomains on behalf of users
 *         - Sofia-specific logic (denylist, mappings, validation) lives here
 *         - The TNS protocol and the IntuitionFeeProxyFactory template are
 *           NOT modified
 *
 *         See core/docs/tns/ for full context and threat model.
 */
contract CirclesFactory is Ownable2Step, Pausable, ReentrancyGuard {
    // ============================================================
    // Errors
    // ============================================================

    error ZeroAddress();
    error CircleAtomZero();
    error InvalidLabel(string label);
    error LabelInDenylist(string label);
    error LabelTaken(bytes32 node);
    error ProxyAlreadyNamed(address proxy);
    error NotProxyAdmin(address proxy, address caller);
    error NotImplemented();

    // ============================================================
    // Events
    // ============================================================

    /// @notice Emitted when a new <label>.circles.trust subdomain is minted.
    event CircleNameRegistered(
        bytes32 indexed node,
        string label,
        uint256 indexed circleAtomId,
        address indexed feeProxyAddress,
        address creator
    );

    /// @notice Emitted when the denylist is updated.
    event DenylistUpdated(string label, bool added);

    /// @notice Emitted when the proxy factory address is updated by the owner.
    event ProxyFactoryUpdated(address oldFactory, address newFactory);

    /// @notice Emitted when the TNS registry address is updated by the owner.
    event TnsRegistryUpdated(address oldRegistry, address newRegistry);

    // ============================================================
    // Storage
    // ============================================================

    /// @notice namehash("circles.trust"). Set in constructor, immutable.
    bytes32 public immutable CIRCLES_NODE;

    /// @notice The permissionless factory that deploys per-Circle fee proxies.
    ///         Updatable by owner for upgrade flexibility.
    IIntuitionFeeProxyFactory public proxyFactory;

    /// @notice The global TNS registry. Updatable by owner.
    ITNSRegistry public tnsRegistry;

    /// @notice node → fee proxy address (1-to-1).
    mapping(bytes32 => address) public proxyOfNode;

    /// @notice fee proxy address → node (1-to-1).
    mapping(address => bytes32) public nodeOfProxy;

    /// @notice node → Intuition atom id of the Circle.
    mapping(bytes32 => uint256) public circleAtomOfNode;

    /// @notice keccak256(label) → blocked. Reserved labels (sofia, admin, ...).
    mapping(bytes32 => bool) public denylist;

    // ============================================================
    // Constructor
    // ============================================================

    /**
     * @param proxyFactory_ Address of IntuitionFeeProxyFactory (external).
     * @param tnsRegistry_ Address of TNSRegistry (external, TNS protocol).
     * @param circlesNode_ namehash("circles.trust").
     * @param initialOwner_ The Safe multisig that will own this factory.
     */
    constructor(
        address proxyFactory_,
        address tnsRegistry_,
        bytes32 circlesNode_,
        address initialOwner_
    ) Ownable(initialOwner_) {
        if (proxyFactory_ == address(0)) revert ZeroAddress();
        if (tnsRegistry_ == address(0)) revert ZeroAddress();
        if (circlesNode_ == bytes32(0)) revert ZeroAddress();
        // Ownable constructor rejects address(0) initialOwner via OZ v5.

        proxyFactory = IIntuitionFeeProxyFactory(proxyFactory_);
        tnsRegistry = ITNSRegistry(tnsRegistry_);
        CIRCLES_NODE = circlesNode_;

        // Seed denylist with reserved labels.
        _seedDenylist();
    }

    // ============================================================
    // External — minting (Phase 2 implementation)
    // ============================================================

    /**
     * @notice Atomically deploys a new fee proxy and mints <label>.circles.trust
     *         pointing to it. The caller becomes the proxy admin.
     * @param label The desired label (e.g. "alice"). Must pass _validateLabel.
     * @param circleAtomId The Intuition atom id of the Circle.
     * @param internalName Optional bytes32 name set on the proxy itself
     *                     (NOT the TNS subdomain — that's `label`).
     * @param channel ProxyChannel.Standard or Sponsored.
     * @return node The namehash of the newly minted subdomain.
     * @return feeProxyAddress The address of the newly deployed fee proxy.
     */
    function createCircleNamed(
        string calldata label,
        uint256 circleAtomId,
        bytes32 internalName,
        IIntuitionFeeProxyFactory.ProxyChannel channel
    )
        external
        payable
        whenNotPaused
        nonReentrant
        returns (bytes32 node, address feeProxyAddress)
    {
        // Phase 2: implement.
        // Silence unused-param warnings while the body is a stub.
        label;
        circleAtomId;
        internalName;
        channel;
        revert NotImplemented();
    }

    /**
     * @notice Mints <label>.circles.trust for an existing fee proxy.
     *         Used for retroactive naming of Circles created before TNS.
     * @dev    msg.sender must be the proxyAdmin of the given proxy.
     * @param label The desired label.
     * @param circleAtomId The Intuition atom id of the Circle.
     * @param feeProxyAddress An existing IntuitionVersionedFeeProxy.
     * @return node The namehash of the newly minted subdomain.
     */
    function nameExistingProxy(
        string calldata label,
        uint256 circleAtomId,
        address feeProxyAddress
    ) external whenNotPaused nonReentrant returns (bytes32 node) {
        // Phase 2: implement.
        label;
        circleAtomId;
        feeProxyAddress;
        revert NotImplemented();
    }

    // ============================================================
    // External views
    // ============================================================

    /// @notice Returns true if `label` is mintable (not taken, not denylisted, valid).
    function isAvailable(string calldata label) external view returns (bool) {
        // Phase 2: implement.
        label;
        return false;
    }

    // ============================================================
    // Governance — onlyOwner (Safe multisig)
    // ============================================================

    /// @notice Pauses createCircleNamed and nameExistingProxy.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses createCircleNamed and nameExistingProxy.
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Adds a label to the denylist.
    function addToDenylist(string calldata label) external onlyOwner {
        bytes32 key = keccak256(bytes(label));
        denylist[key] = true;
        emit DenylistUpdated(label, true);
    }

    /// @notice Removes a label from the denylist.
    function removeFromDenylist(string calldata label) external onlyOwner {
        bytes32 key = keccak256(bytes(label));
        denylist[key] = false;
        emit DenylistUpdated(label, false);
    }

    /// @notice Updates the proxy factory address. Used in case the template
    ///         factory is redeployed or upgraded.
    function setProxyFactory(address newProxyFactory) external onlyOwner {
        if (newProxyFactory == address(0)) revert ZeroAddress();
        address old = address(proxyFactory);
        proxyFactory = IIntuitionFeeProxyFactory(newProxyFactory);
        emit ProxyFactoryUpdated(old, newProxyFactory);
    }

    /// @notice Updates the TNS registry address. Used in case TNS upgrades.
    function setTnsRegistry(address newTnsRegistry) external onlyOwner {
        if (newTnsRegistry == address(0)) revert ZeroAddress();
        address old = address(tnsRegistry);
        tnsRegistry = ITNSRegistry(newTnsRegistry);
        emit TnsRegistryUpdated(old, newTnsRegistry);
    }

    // ============================================================
    // Internal
    // ============================================================

    /// @notice Seeds the initial denylist of reserved labels.
    function _seedDenylist() internal {
        _addToDenylistInternal("sofia");
        _addToDenylistInternal("admin");
        _addToDenylistInternal("circles");
        _addToDenylistInternal("trust");
        _addToDenylistInternal("root");
        _addToDenylistInternal("www");
        _addToDenylistInternal("api");
        _addToDenylistInternal("mail");
        _addToDenylistInternal("support");
        _addToDenylistInternal("help");
        _addToDenylistInternal("team");
        _addToDenylistInternal("official");
        _addToDenylistInternal("system");
        _addToDenylistInternal("null");
        _addToDenylistInternal("void");
        _addToDenylistInternal("test");
    }

    function _addToDenylistInternal(string memory label) internal {
        denylist[keccak256(bytes(label))] = true;
    }

    /// @notice Validates a label against Sofia's rules.
    /// @dev    Phase 2: implement full validation.
    ///         Rules:
    ///         - 3 to 32 characters
    ///         - [a-z0-9-] only
    ///         - no leading or trailing dash
    ///         - no consecutive dashes
    ///         - not in denylist
    function _validateLabel(string calldata label) internal view {
        label;
        // Phase 2: implement.
    }
}
