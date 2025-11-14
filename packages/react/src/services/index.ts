/**
 * TREZA React Services
 * 
 * Service layer for React applications using TREZA SDK
 */

// Compliance Service
export {
    ComplianceService,
    getComplianceService,
    resetComplianceService,
    type ComplianceServiceConfig
} from './compliance-service';

// Wallet Service
export {
    WalletService,
    getWalletService,
    resetWalletService,
    type WalletConnectionResult,
    type WalletInfo
} from './wallet-service';

// React Hooks
export {
    useWallet,
    useCompliance,
    useTreza,
    useVerificationFlow
} from './hooks';

// Hook types
export type {
    UseWalletResult,
    UseComplianceResult,
    UseTrezaResult,
    UseVerificationFlowResult
} from './hooks';

// Re-export core types for convenience
export type {
    TrezaComplianceConfig,
    ComplianceRequirements,
    ComplianceStatus,
    VerificationResult
} from '@treza/sdk';
