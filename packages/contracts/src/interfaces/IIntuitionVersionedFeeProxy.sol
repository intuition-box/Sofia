// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IIntuitionVersionedFeeProxy
 * @notice Minimal interface for a per-Circle versioned fee proxy deployed
 *         by IntuitionFeeProxyFactory (external template repo).
 * @dev    CirclesFactory reads `proxyAdmin()` to gate the
 *         `nameExistingProxy` flow (anti-squat).
 *
 *         Source: intuition-fee-proxy-template/packages/contracts/src/
 *         IntuitionVersionedFeeProxy.sol
 */
interface IIntuitionVersionedFeeProxy {
    /// @notice Returns the current proxy admin address.
    ///         The proxy admin can register new logic versions, change the
    ///         default version, rename the proxy, and transfer admin.
    function proxyAdmin() external view returns (address);

    /// @notice Returns the optional human-readable name of the proxy.
    ///         Maintained by the proxy admin via setName.
    ///         NOTE: this is unrelated to the TNS subdomain name.
    function name() external view returns (bytes32);
}
