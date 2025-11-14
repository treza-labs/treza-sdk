import React, { useState } from 'react';
import {
  useTreza,
  useVerificationFlow,
  ComplianceProvider,
  ComplianceVerification
} from '@treza/react';

/**
 * Example showing how to use TREZA React services and hooks
 */

// Example 1: Using the combined useTreza hook
function TrezaIntegrationExample() {
  const { wallet, compliance, isReady } = useTreza();
  const [userAddress, setUserAddress] = useState('');

  const handleConnect = async () => {
    await wallet.connect();
  };

  const handleCheckCompliance = async () => {
    if (wallet.address) {
      const status = await compliance.checkCompliance(wallet.address);
      console.log('Compliance status:', status);
    }
  };

  return (
    <div className="treza-integration">
      <h2>TREZA Integration Example</h2>
      
      {/* Wallet Connection */}
      <div className="wallet-section">
        <h3>Wallet</h3>
        {!wallet.isConnected ? (
          <button onClick={handleConnect} disabled={wallet.isConnecting}>
            {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div>
            <p>Connected: {wallet.address}</p>
            <p>Balance: {wallet.walletInfo?.balance} ETH</p>
            <button onClick={wallet.disconnect}>Disconnect</button>
          </div>
        )}
        {wallet.error && <p className="error">Error: {wallet.error}</p>}
      </div>

      {/* Compliance Section */}
      <div className="compliance-section">
        <h3>Compliance</h3>
        {isReady ? (
          <div>
            <p>✅ Ready for compliance operations</p>
            <button onClick={handleCheckCompliance}>
              Check Compliance Status
            </button>
          </div>
        ) : (
          <p>Connect wallet to enable compliance features</p>
        )}
        {compliance.error && <p className="error">Error: {compliance.error}</p>}
      </div>
    </div>
  );
}

// Example 2: Using the verification flow hook
function VerificationFlowExample() {
  const { wallet } = useTreza();
  const verificationFlow = useVerificationFlow(wallet.provider || undefined, wallet.signer || undefined);

  const handleStartVerification = async () => {
    if (wallet.address) {
      await verificationFlow.startVerification(wallet.address, {
        minAge: 18,
        allowedCountries: ['US', 'CA', 'GB']
      });
    }
  };

  const handleProcessResult = async () => {
    // This would normally come from ZKPassport callback
    const mockZKPassportResult = {
      verified: true,
      uniqueIdentifier: 'mock-id',
      result: { age: 25, nationality: 'US' },
      proof: 'mock-proof',
      timestamp: Date.now()
    };

    await verificationFlow.processResult(mockZKPassportResult);
  };

  return (
    <div className="verification-flow">
      <h2>Verification Flow Example</h2>
      
      <div className="status">
        <p>Status: <strong>{verificationFlow.status}</strong></p>
      </div>

      {verificationFlow.status === 'idle' && wallet.address && (
        <button onClick={handleStartVerification}>
          Start Verification
        </button>
      )}

      {verificationFlow.status === 'waiting' && verificationFlow.qrCode && (
        <div className="qr-section">
          <p>Scan this QR code with ZKPassport:</p>
          <img src={verificationFlow.qrCode} alt="Verification QR Code" />
          <p>URL: {verificationFlow.verificationUrl}</p>
          <button onClick={handleProcessResult}>
            Simulate ZKPassport Result
          </button>
        </div>
      )}

      {verificationFlow.status === 'processing' && (
        <p>Processing verification result...</p>
      )}

      {verificationFlow.status === 'completed' && verificationFlow.result && (
        <div className="result">
          <h3>✅ Verification Complete!</h3>
          <p>Success: {verificationFlow.result.success ? 'Yes' : 'No'}</p>
          <p>User: {verificationFlow.result.userAddress}</p>
          <p>Compliant: {verificationFlow.result.complianceStatus.isCompliant ? 'Yes' : 'No'}</p>
          {verificationFlow.result.transactionHash && (
            <p>Transaction: {verificationFlow.result.transactionHash}</p>
          )}
        </div>
      )}

      {verificationFlow.status === 'error' && (
        <div className="error">
          <p>❌ Error: {verificationFlow.error}</p>
          <button onClick={verificationFlow.reset}>Try Again</button>
        </div>
      )}

      {verificationFlow.status !== 'idle' && (
        <button onClick={verificationFlow.reset}>Reset</button>
      )}
    </div>
  );
}

// Example 3: Using React components with provider
function ComponentExample() {
  const { wallet } = useTreza();

  if (!wallet.isConnected) {
    return (
      <div>
        <p>Please connect your wallet first</p>
        <button onClick={wallet.connect}>Connect Wallet</button>
      </div>
    );
  }

  return (
    <ComplianceProvider provider={wallet.provider!} signer={wallet.signer || undefined}>
      <div className="component-example">
        <h2>Component Example</h2>
        
        <ComplianceVerification
          userAddress={wallet.address!}
          requirements={{
            minAge: 21,
            allowedCountries: ['US', 'CA']
          }}
          onVerificationComplete={(result) => {
            console.log('Verification completed:', result);
            alert(`Verification ${result.success ? 'successful' : 'failed'}!`);
          }}
          onError={(error) => {
            console.error('Verification error:', error);
            alert(`Error: ${error}`);
          }}
        />
      </div>
    </ComplianceProvider>
  );
}

// Main App component
export default function App() {
  const [activeExample, setActiveExample] = useState<'integration' | 'flow' | 'components'>('integration');

  return (
    <div className="app">
      <header>
        <h1>TREZA React Services Examples</h1>
        <nav>
          <button 
            onClick={() => setActiveExample('integration')}
            className={activeExample === 'integration' ? 'active' : ''}
          >
            Integration Hook
          </button>
          <button 
            onClick={() => setActiveExample('flow')}
            className={activeExample === 'flow' ? 'active' : ''}
          >
            Verification Flow
          </button>
          <button 
            onClick={() => setActiveExample('components')}
            className={activeExample === 'components' ? 'active' : ''}
          >
            React Components
          </button>
        </nav>
      </header>

      <main>
        {activeExample === 'integration' && <TrezaIntegrationExample />}
        {activeExample === 'flow' && <VerificationFlowExample />}
        {activeExample === 'components' && <ComponentExample />}
      </main>

      <style jsx>{`
        .app {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        nav {
          margin: 20px 0;
        }

        nav button {
          margin-right: 10px;
          padding: 10px 20px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          border-radius: 4px;
        }

        nav button.active {
          background: #007bff;
          color: white;
        }

        .wallet-section, .compliance-section, .verification-flow, .component-example {
          margin: 20px 0;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .error {
          color: red;
          font-weight: bold;
        }

        .result {
          background: #d4edda;
          padding: 15px;
          border-radius: 4px;
          border: 1px solid #c3e6cb;
        }

        .qr-section {
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        button {
          padding: 10px 15px;
          margin: 5px;
          border: 1px solid #007bff;
          background: #007bff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        }

        button:hover {
          background: #0056b3;
        }

        button:disabled {
          background: #6c757d;
          border-color: #6c757d;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
