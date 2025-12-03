// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/// @title Errors
/// @notice Custom errors for SofiaFeeProxy contract
library Errors {
    /// @notice Caller is not a whitelisted admin
    error SofiaFeeProxy_NotWhitelistedAdmin();

    /// @notice Insufficient ETH value sent with transaction
    error SofiaFeeProxy_InsufficientValue();

    /// @notice Invalid multisig address (zero address)
    error SofiaFeeProxy_InvalidMultisigAddress();

    /// @notice Invalid MultiVault address (zero address)
    error SofiaFeeProxy_InvalidMultiVaultAddress();

    /// @notice ETH transfer to fee recipient failed
    error SofiaFeeProxy_TransferFailed();

    /// @notice Array lengths do not match
    error SofiaFeeProxy_WrongArrayLengths();

    /// @notice Zero address provided where not allowed
    error SofiaFeeProxy_ZeroAddress();

    /// @notice Fee percentage exceeds maximum allowed (100%)
    error SofiaFeeProxy_FeePercentageTooHigh();
}
