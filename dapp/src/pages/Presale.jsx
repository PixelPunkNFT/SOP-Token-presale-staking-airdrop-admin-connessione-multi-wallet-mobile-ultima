import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { getContract, getContractWithSigner } from '../utils/contracts';
import { useMaintenance } from '../contexts/MaintenanceContext';
import MaintenancePage from '../components/MaintenancePage';
import { TransactionFeedback } from '../components/TransactionFeedback';

export default function Presale() {
  const { isPageUnderMaintenance } = useMaintenance();
  
  if (isPageUnderMaintenance('presale')) {
    return <MaintenancePage />;
  }

  const { address: account, isConnected } = useAccount();
  const [contribution, setContribution] = useState('');
  const [presaleData, setPresaleData] = useState({
    isActive: false,
    statusMessage: '',
    rate: '0',
    totalSold: '0',
    userContribution: '0',
    totalRaisedUsd: '0',
    isFinalized: false,
    startTime: 0,
    canClaim: false
  });
  const [loading, setLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [error, setError] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [estimatedGas, setEstimatedGas] = useState(null);
  const [currentPrice, setCurrentPrice] = useState('0');
  const [timeToIncrease, setTimeToIncrease] = useState(null);
  const [ethPrice, setEthPrice] = useState(null);

  useEffect(() => {
    getEthPrice();
    const priceInterval = setInterval(getEthPrice, 60000);
    return () => clearInterval(priceInterval);
  }, []);

  useEffect(() => {
    if (account && ethPrice) {
      loadPresaleData();
      loadPriceData();
      const interval = setInterval(() => {
        loadPresaleData();
        loadPriceData();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [account, ethPrice]);

  useEffect(() => {
    if (account) {
      loadTokenBalance();
    }
  }, [account]);

  const getEthPrice = async () => {
    try {
      const response = await fetch(import.meta.env.VITE_COINGECKO_API_URL);
      const data = await response.json();
      setEthPrice(data.ethereum.usd);
    } catch (error) {
      console.error('Error loading ETH price:', error);
    }
  };

  const loadPriceData = async () => {
    if (!ethPrice) return;

    try {
      const presaleContract = await getContract('Presale');
      const price = await presaleContract.getCurrentPrice();
      const priceInEth = ethers.utils.formatEther(price);
      const priceInUsd = parseFloat(priceInEth) * ethPrice;
      setCurrentPrice(priceInUsd.toFixed(2));
      
      const startTime = await presaleContract.presaleStartTime();
      const currentTime = Math.floor(Date.now() / 1000);
      const elapsedTime = currentTime - startTime;
      const PRICE_INCREASE_INTERVAL = 12 * 60 * 60; // 12 hours in seconds
      const nextIncrease = PRICE_INCREASE_INTERVAL - (elapsedTime % PRICE_INCREASE_INTERVAL);
      setTimeToIncrease(nextIncrease);
    } catch (error) {
      console.error('Error loading price data:', error);
    }
  };

  const formatTimeRemaining = (seconds) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const loadPresaleData = async () => {
    if (!account || !ethPrice) return;
    
    try {
      const presaleContract = await getContract('Presale');
      const tokenContract = await getContract('Token');
      
      const [
        price, 
        totalRaised, 
        userContribution, 
        isFinalized,
        startTime
      ] = await Promise.all([
        presaleContract.getCurrentPrice(),
        presaleContract.totalRaised(),
        presaleContract.contributions(account),
        presaleContract.presaleFinalized(),
        presaleContract.presaleStartTime()
      ]);

      const currentTime = Math.floor(Date.now() / 1000);
      const daysPassed = (currentTime - startTime) / (60 * 60 * 24);
      const canClaim = !isFinalized && daysPassed >= 120 && userContribution.gt(0);

      const totalRaisedUsd = parseFloat(ethers.utils.formatEther(totalRaised)) * ethPrice;

      setPresaleData({
        isActive: true,
        rate: price.toString(),
        totalSold: totalRaised.toString(),
        userContribution: userContribution.toString(),
        totalRaisedUsd: totalRaisedUsd.toString(),
        isFinalized,
        startTime: startTime.toString(),
        canClaim
      });
      setError('');
    } catch (error) {
      console.error('Error loading presale data:', error);
      setError(error.message || 'Error loading presale data');
      setPresaleData(prev => ({
        ...prev,
        isActive: false,
        statusMessage: 'Error loading data'
      }));
    }
  };

  const loadTokenBalance = async () => {
    if (!account) return;

    try {
      const tokenContract = await getContract('Token');
      const balance = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('Error loading balance:', error);
      setTokenBalance('0');
    }
  };

  const handleContributionChange = async (e) => {
    const value = e.target.value;
    setError('');
    setEstimatedGas(null);
    
    if (value === '' || /^\d*\.?\d{0,18}$/.test(value)) {
      setContribution(value);
      await validateContribution(value);
    }
  };

  const validateContribution = async (value) => {
    if (!value) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(account);
      const amountWei = ethers.utils.parseEther(value);
      
      try {
        const presaleContract = await getContractWithSigner('Presale');
        let gasEstimate;
        let gasPrice;
        
        try {
          gasEstimate = await presaleContract.estimateGas.participate({ value: amountWei });
          gasPrice = await provider.getGasPrice();
        } catch (gasError) {
          console.warn('Gas estimation failed, using fallback values:', gasError);
          // Fallback values if gas estimation fails
          gasEstimate = ethers.BigNumber.from('300000'); // Safe fallback value
          gasPrice = ethers.utils.parseUnits('50', 'gwei'); // 50 gwei as fallback
        }

        const estimatedGasCost = gasEstimate.mul(gasPrice);
        const totalCost = amountWei.add(estimatedGasCost);
        
        setEstimatedGas({
          gas: gasEstimate.toString(),
          gasCost: ethers.utils.formatEther(estimatedGasCost),
          total: ethers.utils.formatEther(totalCost)
        });

        if (balance.lt(totalCost)) {
          setError(`Insufficient ETH balance. Required: ${ethers.utils.formatEther(totalCost)} ETH (including estimated gas: ${ethers.utils.formatEther(estimatedGasCost)} ETH)`);
          return false;
        }

        return true;
      } catch (error) {
        console.error('Contract interaction error:', error);
        if (error.message.includes('gas required exceeds')) {
          setError('The transaction would require too much gas. Try with a smaller amount.');
          return false;
        }
        // Allow transaction to proceed with fallback gas values
        return true;
      }
    } catch (error) {
      console.error('Validation error:', error);
      console.warn('Proceeding with transaction despite validation error');
      // Allow transaction to proceed even if validation fails
      return true;
    }
  };

  const handleContribute = async () => {
    if (!account) {
      setError('Please connect your wallet before contributing');
      return;
    }

    if (!contribution || parseFloat(contribution) <= 0) {
      setError('Enter a valid amount');
      return;
    }

    const isValid = await validateContribution(contribution);
    if (!isValid) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setTransactionStatus('pending');
      
      const presaleContract = await getContractWithSigner('Presale');
      const tx = await presaleContract.participate({
        value: ethers.utils.parseEther(contribution)
      });
      
      setTransactionHash(tx.hash);
      await tx.wait();
      
      await loadPresaleData();
      await loadTokenBalance();
      setContribution('');
      setEstimatedGas(null);
      setTransactionStatus('success');
    } catch (error) {
      console.error('Token purchase error:', error);
      if (error.message.includes('user rejected')) {
        setError('Transaction rejected by user');
      } else if (error.message.includes('insufficient funds')) {
        setError('Insufficient ETH balance to complete the transaction');
      } else if (error.message.includes('gas required exceeds')) {
        setError('Gas required too high. Try again with a smaller amount');
      } else if (error.message.includes('Internal JSON-RPC error')) {
        setError('Transaction error. Check if you have enough ETH for gas and try again');
      } else if (error.message.includes('Would exceed 1% of total tokens')) {
        setError('You cannot purchase more than 1% of total tokens');
      } else {
        setError(error.message || 'Error during token purchase');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTokens = () => {
    if (!contribution || !presaleData.rate) return '0';
    try {
      const amount = ethers.utils.parseEther(contribution || '0');
      const tokens = amount.mul(ethers.constants.WeiPerEther).div(ethers.BigNumber.from(presaleData.rate));
      return ethers.utils.formatEther(tokens);
    } catch (error) {
      console.error('Token calculation error:', error);
      return '0';
    }
  };

  const tokensSold = presaleData.totalSold !== '0' && presaleData.rate !== '0'
    ? ethers.utils.formatEther(
        ethers.BigNumber.from(presaleData.totalSold)
          .mul(ethers.constants.WeiPerEther)
          .div(ethers.BigNumber.from(presaleData.rate))
      )
    : '0';

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 max-w-3xl min-w-[280px] mx-auto text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 z-0"></div>
          <div className="relative z-10">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 transform hover:scale-105 transition-transform duration-300">
              Welcome to SOP Token Presale
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Participate in our presale and become one of the first SOP token holders.
              Connect your wallet to get started.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
              <div className="bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                <h3 className="text-lg font-medium text-blue-300 mb-2">Token Price</h3>
                <p className="text-2xl font-bold text-blue-400">${currentPrice}</p>
              </div>
              <div className="bg-gray-700 p-6 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                <h3 className="text-lg font-medium text-green-300 mb-2">Total Raised</h3>
                <p className="text-2xl font-bold text-green-400">
                  ${Number(presaleData.totalRaisedUsd || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              </div>
            </div>
            <div className="inline-flex items-center justify-center space-x-2 text-purple-300 bg-purple-500/10 px-4 py-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Connect wallet using the button in the top right</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-16 px-4">
      <main className="max-w-7xl mx-auto">
        <TransactionFeedback
          status={transactionStatus}
          error={error}
          txHash={transactionHash}
        />
        {error && (
          <div className="bg-red-500/10 backdrop-blur-sm border-2 border-red-500/50 rounded-xl p-6 mb-8 text-center shadow-lg">
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-100 font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 hover:border-blue-500">
            <h3 className="text-lg font-medium text-blue-300 mb-2">Your Balance</h3>
            <p className="text-2xl font-bold text-blue-400">{tokenBalance} SOP</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 hover:border-purple-500">
            <h3 className="text-lg font-medium text-purple-300 mb-2">Token Price</h3>
            <p className="text-2xl font-bold text-purple-400">${currentPrice}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 hover:border-green-500">
            <h3 className="text-lg font-medium text-green-300 mb-2">Tokens Sold</h3>
            <p className="text-2xl font-bold text-green-400">{tokensSold} SOP</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 hover:border-yellow-500">
            <h3 className="text-lg font-medium text-yellow-300 mb-2">Your Contribution</h3>
            <p className="text-2xl font-bold text-yellow-400">{ethers.utils.formatEther(presaleData.userContribution)} ETH</p>
          </div>
        </div>

        {estimatedGas && !error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-green-500/30 hover:border-green-500/50 transition-all duration-300">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-xl font-semibold text-green-400">Transaction Estimate</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-green-200">
                  <span>Estimated Gas Units:</span>
                  <span className="font-mono">{estimatedGas.gas}</span>
                </div>
                <div className="flex justify-between items-center text-green-200">
                  <span>Gas Cost:</span>
                  <span className="font-mono">{estimatedGas.gasCost} ETH</span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold text-green-300 pt-2 border-t border-green-500/20">
                  <span>Total Cost:</span>
                  <span className="font-mono">{estimatedGas.total} ETH</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700">
            <h2 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Participate in Presale
            </h2>
            <div className="space-y-8">
              <div>
                <label className="block text-lg font-medium text-purple-300 mb-2">
                  Your Contribution
                </label>
                <p className="text-sm text-gray-400 mb-4">
                  Each address can hold a maximum of 1% of total tokens
                </p>
                <div className="relative rounded-xl">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    value={contribution}
                    onChange={handleContributionChange}
                    className="w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-colors duration-300 pr-16"
                    placeholder="0.0"
                    disabled={!presaleData.isActive || loading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-gray-400">ETH</span>
                  </div>
                </div>
                <p className="mt-3 text-lg text-blue-300">
                  You will receive: {calculateTokens()} SOP Tokens
                </p>
              </div>
              <button 
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white shadow-lg transform hover:scale-105 transition-all duration-300 
                  ${loading ? 'opacity-50 cursor-not-allowed bg-gray-600' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'}`}
                onClick={handleContribute}
                disabled={!presaleData.isActive || loading || !account || !!error}
              >
                {loading ? 'Processing...' : 'Contribute to Presale'}
              </button>

              <div className="bg-gray-700/50 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-purple-300">Current Price:</span>
                  <span className="text-purple-200 font-semibold">${currentPrice}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-300">Next Increase (1%):</span>
                  <span className="text-blue-200 font-semibold">{formatTimeRemaining(timeToIncrease)}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 space-y-4">
              <div className="flex justify-between text-lg font-medium">
                <span className="text-green-300">Total Raised</span>
                <span className="text-green-400">
                  ${Number(presaleData.totalRaisedUsd || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
              <div className="text-center text-lg text-blue-400">
                {ethers.utils.formatEther(presaleData.totalSold)} ETH
              </div>
            </div>
          </div>
        </div>

        {/* Sezione Emergency Claim */}
        {presaleData.userContribution !== '0' && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-gray-800 rounded-xl p-8 shadow-lg border-2 border-red-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-red-400">Emergency Claim</h3>
                <div className="relative group">
                  <button className="text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute bottom-full mb-2 w-64 bg-gray-900 text-sm text-gray-300 rounded-lg p-4 shadow-xl hidden group-hover:block">
                    La funzione di Emergency Claim diventa disponibile solo dopo 120 giorni dall'inizio del presale e solo se il presale non è stato finalizzato. Questo meccanismo permette agli investitori di recuperare i loro fondi in caso di emergenza.
                  </div>
                </div>
              </div>

              <button 
                onClick={async () => {
                  try {
                    setLoading(true);
                    setError('');
                    setTransactionStatus('pending');
                    
                    const presaleContract = await getContractWithSigner('Presale');
                    const tx = await presaleContract.claimRefund();
                    
                    setTransactionHash(tx.hash);
                    await tx.wait();
                    
                    await loadPresaleData();
                    setTransactionStatus('success');
                  } catch (error) {
                    console.error('Claim error:', error);
                    setError(error.message || 'Errore durante il claim');
                    setTransactionStatus('error');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={!presaleData.canClaim || loading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white shadow-lg transition-all duration-300 
                  ${!presaleData.canClaim || loading
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-red-500 hover:bg-red-600 transform hover:scale-105'
                  }`}
              >
                {loading ? 'Processing...' : 'Emergency Claim'}
              </button>

              <div className="mt-4 text-sm text-gray-400">
                {!presaleData.canClaim && presaleData.userContribution !== '0' && (
                  <p>
                    {presaleData.isFinalized 
                      ? "Il presale è stato finalizzato, il claim non è più disponibile." 
                      : `Il claim sarà disponibile dopo 120 giorni dall'inizio del presale se non viene finalizzato.`
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
