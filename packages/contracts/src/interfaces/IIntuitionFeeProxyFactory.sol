// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IIntuitionFeeProxyFactory
 * @notice Minimal interface for the permissionless factory that deploys
 *         per-Circle fee proxies on Intuition.
 * @dev    External contract from the intuition-fee-proxy-template repo.
 *         Sofia does NOT modify or own this factory — it only calls
 *         createProxy from CirclesFactory.
 *
 *         The factory is permissionless: anyone (including non-Sofia users)
 *         can call createProxy directly to deploy a proxy without going
 *         through Sofia.
 *
 *         Source: intuition-fee-proxy-template/packages/contracts/src/
 *         IntuitionFeeProxyFactory.sol
 */
interface IIntuitionFeeProxyFactory {
    /// @notice Channel of the proxy logic implementation.
    ///         Standard: regular fee proxy.
    ///         Sponsored: sponsor pool for subsidized deposits.
    enum ProxyChannel {
        Standard,
        Sponsored
    }

    /// @notice Emitted when a new proxy is deployed by the factory.
    event ProxyCreated(
        address indexed proxy,
        ProxyChannel indexed channel,
        bytes32 indexed version,
        address proxyAdmin,
        bytes32 name
    );

    /**
     * @notice Deploys a new fee proxy.
     * @param channel Standard or Sponsored logic channel.
     * @param initialAdmins List of admin addresses. The first non-zero entry
     *                      becomes the proxyAdmin; all entries are whitelisted
     *                      on the logic impl.
     * @param name Optional human-readable label (bytes32(0) for none).
     * @return proxy The address of the newly deployed proxy.
     */
    function createProxy(
        ProxyChannel channel,
        address[] calldata initialAdmins,
        bytes32 name
    ) external payable returns (address proxy);
}
