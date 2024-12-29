import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useContractWrite, useContractRead, useNetwork } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useMaintenance } from '../contexts/MaintenanceContext';
import MaintenancePage from '../components/MaintenancePage';
import { TransactionFeedback } from '../components/TransactionFeedback';

const Swap = () => {
  const { isPageUnderMaintenance } = useMaintenance();
  
  if (isPageUnderMaintenance('swap')) {
    return <MaintenancePage />;
  }

  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('SOP');
  const [amount, setAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('0');
  const [slippage, setSlippage] = useState('0.5');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('crypto');
  const [transactionStatus, setTransactionStatus] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: ''
  });

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
    watch: true,
  });

  // Get SOP token balance
  const { data: sopBalance } = useBalance({
    address,
    token: import.meta.env.VITE_TOKEN_ADDRESS,
    watch: true,
  });

  // Simulate swap to get estimated output
  useEffect(() => {
    if (amount && fromToken && toToken) {
      let mockEstimate;
      if (fromToken === 'CARD') {
        // Simulazione tasso di cambio per acquisto con carta
        mockEstimate = parseFloat(amount) * 1200; // 1 USD = 1200 SOP (esempio)
      } else {
        // Tasso di cambio crypto
        const rates = {
          ETH: 1000,  // 1 ETH = 1000 SOP
          USDT: 1,    // 1 USDT = 1 SOP
          USDC: 1     // 1 USDC = 1 SOP
        };
        mockEstimate = parseFloat(amount) * (rates[fromToken] || 1);
      }
      setEstimatedOutput(mockEstimate.toString());
    }
  }, [amount, fromToken, toToken]);

  const handleCardDetailsChange = (field, value) => {
    setCardDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSwap = async () => {
    if (!amount || !fromToken || !toToken) return;
    
    setIsLoading(true);
    setTransactionStatus('pending');
    try {
      if (fromToken === 'CARD') {
        // Logica per l'acquisto con carta tramite Reown
        console.log('Processing card payment through Reown:', {
          cardDetails,
          amount,
          toToken
        });
        
        // Qui integreremo l'API di Reown per il pagamento con carta
        await new Promise(resolve => setTimeout(resolve, 2000));
        setTransactionStatus('success');
        
      } else {
        // Logica per lo swap crypto
        console.log('Processing crypto swap:', {
          from: fromToken,
          to: toToken,
          amount,
          slippage
        });
        
        // Qui implementeremo la logica di swap crypto
        const mockTx = { hash: '0x' + Math.random().toString(16).slice(2) };
        setTransactionHash(mockTx.hash);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setTransactionStatus('success');
      }
    } catch (error) {
      console.error('Transaction failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBalance = (token) => {
    if (token === 'ETH') {
      return ethBalance ? formatEther(ethBalance.value) : '0';
    } else if (token === 'SOP') {
      return sopBalance ? formatEther(sopBalance.value) : '0';
    }
    return '0';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <TransactionFeedback
        status={transactionStatus}
        error={error}
        txHash={transactionHash}
      />
      <div className="max-w-lg mx-auto bg-white/10 backdrop-blur-md rounded-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Swap Tokens</h1>
        
        <div className="space-y-6">
          {/* Payment Method Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Payment Method</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentMethod('crypto')}
                className={`flex-1 py-2 rounded-lg ${
                  paymentMethod === 'crypto'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Crypto
              </button>
              <button
                onClick={() => {
                  setPaymentMethod('card');
                  setFromToken('CARD');
                }}
                className={`flex-1 py-2 rounded-lg ${
                  paymentMethod === 'card'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Card
              </button>
            </div>
          </div>

          {/* From Token */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-white">From</label>
              {paymentMethod === 'crypto' && (
                <span className="text-sm text-gray-400">
                  Balance: {getBalance(fromToken)} {fromToken}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-4">
              {paymentMethod === 'crypto' ? (
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-700"
                >
                  <option value="ETH">ETH</option>
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Card Number"
                    value={cardDetails.number}
                    onChange={(e) => handleCardDetailsChange('number', e.target.value)}
                    className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-700"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) => handleCardDetailsChange('expiry', e.target.value)}
                      className="w-1/2 bg-gray-800 text-white rounded-lg p-3 border border-gray-700"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      value={cardDetails.cvv}
                      onChange={(e) => handleCardDetailsChange('cvv', e.target.value)}
                      className="w-1/2 bg-gray-800 text-white rounded-lg p-3 border border-gray-700"
                    />
                  </div>
                </div>
              )}
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-gray-800 text-white rounded-lg p-3 border border-gray-700"
              />
            </div>
          </div>

          {/* Swap Icon */}
          {paymentMethod === 'crypto' && (
            <div className="flex justify-center">
              <button 
                onClick={() => {
                  const temp = fromToken;
                  setFromToken(toToken);
                  setToToken(temp);
                }}
                className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>
          )}

          {/* To Token */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-white">To</label>
              <span className="text-sm text-gray-400">
                Balance: {getBalance(toToken)} {toToken}
              </span>
            </div>
            <div className="flex gap-4">
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="flex-1 bg-gray-800 text-white rounded-lg p-3 border border-gray-700"
                disabled={paymentMethod === 'card'}
              >
                <option value="SOP">SOP</option>
                {paymentMethod === 'crypto' && <option value="ETH">ETH</option>}
              </select>
              <input
                type="text"
                readOnly
                value={estimatedOutput}
                placeholder="0.0"
                className="flex-1 bg-gray-800 text-white rounded-lg p-3 border border-gray-700"
              />
            </div>
          </div>

          {/* Slippage Settings */}
          {paymentMethod === 'crypto' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Slippage Tolerance</label>
              <div className="flex gap-2">
                {['0.5', '1.0', '2.0'].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-4 py-2 rounded-lg ${
                      slippage === value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            className={`w-full font-bold py-3 px-4 rounded-lg transition-colors ${
              isConnected || paymentMethod === 'card'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleSwap}
            disabled={(!isConnected && paymentMethod === 'crypto') || isLoading}
          >
            {isLoading 
              ? 'Processing...' 
              : paymentMethod === 'card' 
                ? 'Buy with Card' 
                : isConnected 
                  ? 'Swap' 
                  : 'Connect Wallet to Swap'}
          </button>

          {/* Rate Info */}
          <div className="text-sm text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Exchange Rate:</span>
              <span>1 {fromToken} ≈ {amount ? (parseFloat(estimatedOutput) / parseFloat(amount)).toFixed(6) : '0'} {toToken}</span>
            </div>
            {paymentMethod === 'crypto' && (
              <div className="flex justify-between">
                <span>Network Fee:</span>
                <span>~ 0.001 ETH</span>
              </div>
            )}
            {paymentMethod === 'crypto' && (
              <div className="flex justify-between">
                <span>Slippage Tolerance:</span>
                <span>{slippage}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Swap;
