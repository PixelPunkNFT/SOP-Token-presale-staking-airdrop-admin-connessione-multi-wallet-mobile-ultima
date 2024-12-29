import React from 'react';
import './TransactionFeedback.css';

export function TransactionFeedback({ status, error, txHash }) {
  if (!status && !error) return null;

  return (
    <div className={`transaction-feedback ${status}`}>
      <div className="content">
        {status === 'pending' && (
          <>
            <div className="spinner"></div>
            <p>Transaction in progress...</p>
            <p className="subtitle">Please wait for confirmation in your wallet.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="success-icon">✓</div>
            <p>Transaction completed!</p>
            {txHash && (
              <a 
                href={`https://etherscan.io/tx/${txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="tx-link"
              >
                View on Etherscan
              </a>
            )}
          </>
        )}

        {error && (
          <>
            <div className="error-icon">⚠</div>
            <p className="error-message">{error}</p>
            <p className="subtitle">Try again later or contact support if the problem persists.</p>
          </>
        )}
      </div>

    </div>
  );
}
