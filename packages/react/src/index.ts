/**
 * @treza/react - React components for TREZA SDK
 * 
 * Privacy-first DeFi UI components with zero-knowledge compliance
 */

// Component exports
export {
  ComplianceProvider,
  ComplianceVerification,
  ComplianceStatusDisplay,
  GovernanceEligibility,
  useComplianceContext
} from './components/react-components';

// Style exports
export { complianceStyles } from './components/react-components';

// Service exports
export {
  ComplianceService,
  getComplianceService,
  resetComplianceService,
  WalletService,
  getWalletService,
  resetWalletService
} from './services';

// Hook exports
export {
  useWallet,
  useCompliance,
  useTreza,
  useVerificationFlow
} from './services';

// Service type exports
export type {
  ComplianceServiceConfig,
  WalletConnectionResult,
  WalletInfo,
  UseWalletResult,
  UseComplianceResult,
  UseTrezaResult,
  UseVerificationFlowResult
} from './services';

// Re-export core types for convenience
export type {
  TrezaComplianceConfig,
  ComplianceRequirements,
  ComplianceStatus,
  VerificationResult
} from '@treza/sdk';

// Version
export const VERSION = '1.0.0';
