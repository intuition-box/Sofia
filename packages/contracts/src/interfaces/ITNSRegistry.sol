// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ITNSRegistry
 * @notice Minimal interface for the TNS Registry — equivalent to ENSRegistry.
 *         Used by CirclesFactory to mint subdomains under circles.trust.
 * @dev    Sofia consumes this interface only — no modifications to the TNS
 *         protocol. The actual TNSRegistry contract is owned by the TNS team.
 */
interface ITNSRegistry {
    /// @notice Emitted when the owner of a node is changed.
    event Transfer(bytes32 indexed node, address owner);

    /// @notice Emitted when a subnode owner is set.
    event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner);

    /// @notice Emitted when the resolver of a node is changed.
    event NewResolver(bytes32 indexed node, address resolver);

    /// @notice Emitted when an operator is approved for all nodes of an owner.
    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    /**
     * @notice Transfers ownership of a node to a new address.
     * @param node The node to transfer ownership of.
     * @param owner The address of the new owner.
     */
    function setOwner(bytes32 node, address owner) external;

    /**
     * @notice Transfers ownership of a subnode (label.node) to a new address.
     *         Authorized to the owner of the parent node or an approved operator.
     * @param node The parent node.
     * @param label The keccak256 hash of the label.
     * @param owner The address of the new owner of the subnode.
     * @return subnode The namehash of the subnode (keccak256(node, label)).
     */
    function setSubnodeOwner(
        bytes32 node,
        bytes32 label,
        address owner
    ) external returns (bytes32 subnode);

    /**
     * @notice Sets the resolver address for a node.
     * @param node The node to update.
     * @param resolver The address of the resolver.
     */
    function setResolver(bytes32 node, address resolver) external;

    /**
     * @notice Approves or revokes an operator to manage all nodes owned by msg.sender.
     * @param operator The operator to approve/revoke.
     * @param approved True to approve, false to revoke.
     */
    function setApprovalForAll(address operator, bool approved) external;

    /// @notice Returns the owner of a node.
    function owner(bytes32 node) external view returns (address);

    /// @notice Returns the resolver address for a node.
    function resolver(bytes32 node) external view returns (address);

    /// @notice Returns true if `operator` is approved to manage all nodes of `owner`.
    function isApprovedForAll(
        address owner,
        address operator
    ) external view returns (bool);

    /// @notice Returns true if a record exists for a node.
    function recordExists(bytes32 node) external view returns (bool);
}
