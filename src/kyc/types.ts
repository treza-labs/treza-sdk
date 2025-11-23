/**
 * Types for Treza KYC module
 */

export interface KYCData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  documentNumber: string;
  expiryDate: string;
  nationality: string;
  documentType: string;
}

export interface ProofStatus {
  proofId: string;
  isValid: boolean;
  isExpired: boolean;
  chainVerified: boolean;
  expiresAt?: Date;
}

export interface UserKYCStatus {
  hasKYC: boolean;
  latestProofId?: string;
  verifiedAt?: Date;
  expiresAt?: Date;
  publicClaims?: string[];
}

