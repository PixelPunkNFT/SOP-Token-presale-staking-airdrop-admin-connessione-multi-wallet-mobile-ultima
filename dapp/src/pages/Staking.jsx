import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { getContract, getContractWithSigner, formatContractError } from '../utils/contracts';
import { useMaintenance } from '../contexts/MaintenanceContext';
import MaintenancePage from '../components/MaintenancePage';
import { TransactionFeedback } from '../components/TransactionFeedback';

export default function Staking() {
  const { isPageUnderMaintenance } = useMaintenance();
  
  if (isPageUnderMaintenance('staking')) {
    return <MaintenancePage />;
  }

  const { address: account, isConnected } = useAccount();
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [transactionError, setTransactionError] = useState(null);
  const [currentTxHash, setCurrentTxHash] = useState(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [stakedBalance, setStakedBalance] = useState('0');
  const [rewards, setRewards] = useState('0');
  const [stakeStartTime, setStakeStartTime] = useState('0');
  const [minimumStakingPeriod, setMinimumStakingPeriod] = useState('0');
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [currentAPR, setCurrentAPR] = useState('0');

  useEffect(() => {
    if (account) {
      loadBalances();
      const interval = setInterval(loadBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [account]);

  const retryWithBackoff = async (fn, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (error.message.includes('429') && i < maxRetries - 1) {
          const waitTime = Math.min(1000 * Math.pow(2, i), 10000);
          console.log(`Retry ${i + 1}/${maxRetries} after ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (error.code === 'TRANSACTION_REPLACED') {
          console.log('Transaction replaced:', error.reason);
          if (!error.cancelled && error.reason === 'repriced') {
            console.log('Transaction completed with new gas price');
            return error.replacement;
          }
        }
        
        throw error;
      }
    }
  };

  const executeTransaction = async (txPromise) => {
    try {
      const tx = await txPromise;
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      return receipt;
    } catch (error) {
      if (error.code === 'TRANSACTION_REPLACED') {
        console.log('Transazione sostituita:', error.reason);
        if (!error.cancelled && error.reason === 'repriced') {
          console.log('Transazione completata con nuovo prezzo del gas');
          return error.replacement.wait();
        }
      }
      throw error;
    }
  };

  const loadBalances = async () => {
    if (!account) return;
    
    try {
      const tokenContract = await getContract('Token');
      const stakingContract = await getContract('Staking');
      
      // Get token balance
      const balance = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.utils.formatEther(balance));

      // Get stake info
      const stakeInfo = await stakingContract.stakes(account);
      const stakedAmount = stakeInfo.amount;
      const startTime = stakeInfo.startTime;
      
      // Get pending rewards
      const pendingRewards = await stakingContract.calculateRewards(account);
      const unclaimableRewards = stakeInfo.unclaimableRewards;
      const totalRewards = pendingRewards.add(unclaimableRewards);

      setStakedBalance(ethers.utils.formatEther(stakedAmount));
      setStakeStartTime(startTime.toString());
      setRewards(ethers.utils.formatEther(totalRewards));

      // Get minimum staking period
      // Get current APR
      const apr = await stakingContract.getCurrentAPR();
      setCurrentAPR(apr.toString());

      const minPeriod = await stakingContract.minimumStakingPeriod();
      setMinimumStakingPeriod(minPeriod.toString());

      // Verifica se è possibile fare withdraw
      const startTimeMs = startTime.toNumber() * 1000;
      const minimumPeriodMs = minPeriod.toNumber() * 1000;
      const now = Date.now();
      setCanWithdraw(now >= startTimeMs + minimumPeriodMs);

      console.log('Stake Info:', {
        tokenBalance: ethers.utils.formatEther(balance),
        stakedAmount: ethers.utils.formatEther(stakedAmount),
        pendingRewards: ethers.utils.formatEther(totalRewards),
        startTime: new Date(startTime.toNumber() * 1000).toLocaleString(),
        minimumStakingPeriod: minPeriod.toString()
      });
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const handleStake = async () => {
    if (!account) {
      setTransactionError('Please connect your wallet before staking');
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setTransactionError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setTransactionStatus('pending');
      setTransactionError(null);
      const tokenContract = await getContractWithSigner('Token');
      const stakingContract = await getContractWithSigner('Staking');
      const stakeAmountWei = ethers.utils.parseEther(stakeAmount);

      // Prima controlla l'allowance esistente
      const currentAllowance = await tokenContract.allowance(account, stakingContract.address);
      console.log('Current allowance:', ethers.utils.formatEther(currentAllowance));
      
      // Se l'allowance è insufficiente, richiedi l'approvazione
      if (currentAllowance.lt(stakeAmountWei)) {
        console.log('Requesting approval for:', stakeAmount, 'tokens');
        const approvalTx = await retryWithBackoff(() => 
          tokenContract.approve(
            stakingContract.address,
            stakeAmountWei
          )
        );
        await executeTransaction(approvalTx);
        setCurrentTxHash(approvalTx.hash);
        console.log('Approval completed');
      } else {
        console.log('Sufficient allowance, proceeding with staking');
      }

      // Procedi con lo staking
      console.log('Starting stake of:', stakeAmount, 'tokens');
      const tx = await retryWithBackoff(() => 
        stakingContract.stake(stakeAmountWei)
      );
      setCurrentTxHash(tx.hash);
      await executeTransaction(tx);
      console.log('Stake completed');
      
      await loadBalances();
      setStakeAmount('');
      setTransactionStatus('success');
    } catch (error) {
      console.error('Error in staking:', error);
      setTransactionError(formatContractError(error));
      setTransactionStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!account) {
      setTransactionError('Please connect your wallet before withdrawing');
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setTransactionError('Inserisci un importo valido');
      return;
    }

    if (parseFloat(withdrawAmount) > parseFloat(stakedBalance)) {
      setTransactionError('You cannot withdraw more tokens than you have staked');
      return;
    }

    if (!canWithdraw) {
      setTransactionError('Cannot withdraw tokens yet. Minimum staking period has not been reached.');
      return;
    }

    try {
      setLoading(true);
      setTransactionStatus('pending');
      setTransactionError(null);
      console.log('Attempting withdrawal of:', withdrawAmount, 'tokens');
      const stakingContract = await getContractWithSigner('Staking');
      const tx = await retryWithBackoff(() => 
        stakingContract.withdraw(ethers.utils.parseEther(withdrawAmount))
      );
      setCurrentTxHash(tx.hash);
      await executeTransaction(tx);
      await loadBalances();
      setWithdrawAmount('');
      setTransactionStatus('success');
    } catch (error) {
      console.error('Error in withdrawal:', error);
      setTransactionError(formatContractError(error));
      setTransactionStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!account) {
      setTransactionError('Please connect your wallet before claiming rewards');
      return;
    }

    try {
      setLoading(true);
      setTransactionStatus('pending');
      setTransactionError(null);
      const stakingContract = await getContractWithSigner('Staking');
      const tx = await retryWithBackoff(() => 
        stakingContract.claimRewards()
      );
      setCurrentTxHash(tx.hash);
      await executeTransaction(tx);
      await loadBalances();
      setTransactionStatus('success');
    } catch (error) {
      console.error('Error in claiming rewards:', error);
      setTransactionError(formatContractError(error));
      setTransactionStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedRewards = (amount) => {
    if (!amount) return { daily: 0, monthly: 0, yearly: 0 };
    const aprPercentage = parseFloat(currentAPR);
    const amountNum = parseFloat(amount);
    const yearly = (amountNum * aprPercentage) / 100; // Diviso 100 perché l'APR è in percentuale
    const monthly = yearly / 12;
    const daily = yearly / 365;
    return { daily, monthly, yearly };
  };

  const estimatedRewards = calculateEstimatedRewards(stakeAmount);

  const getStakingDuration = () => {
    if (stakeStartTime === '0') return 'Not staked yet';
    const start = parseInt(stakeStartTime) * 1000;
    const now = Date.now();
    const diff = now - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const getMinimumStakingPeriodText = () => {
    const seconds = parseInt(minimumStakingPeriod);
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    return `${days} days`;
  };

  const getRemainingLockTime = () => {
    if (stakeStartTime === '0') return 'Not staked yet';
    const start = parseInt(stakeStartTime) * 1000;
    const minimumPeriodMs = parseInt(minimumStakingPeriod) * 1000;
    const unlockTime = start + minimumPeriodMs;
    const now = Date.now();
    
    if (now >= unlockTime) {
      return 'Lock period completed';
    }

    const remaining = unlockTime - now;
    const seconds = Math.floor(remaining / 1000);
    if (seconds < 60) return `${seconds} seconds remaining`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes remaining`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours remaining`;
    const days = Math.floor(hours / 24);
    return `${days} days remaining`;
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl p-4 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 max-w-3xl mx-auto text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 z-0"></div>
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 transform hover:scale-105 transition-transform duration-300">
              SOP Staking
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Stake your SOP tokens and earn rewards. Connect your wallet to start.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto mb-6 sm:mb-8">
              <div className="bg-gray-700 p-4 sm:p-6 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                <h3 className="text-base sm:text-lg font-medium text-blue-300 mb-2">Current APR</h3>
                <p className="text-xl sm:text-2xl font-bold text-blue-400">{currentAPR}%</p>
              </div>
              <div className="bg-gray-700 p-4 sm:p-6 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                <h3 className="text-base sm:text-lg font-medium text-green-300 mb-2">Minimum Period</h3>
                <p className="text-xl sm:text-2xl font-bold text-green-400">{getMinimumStakingPeriodText()}</p>
              </div>
            </div>
            <div className="inline-flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 text-purple-300 bg-purple-500/10 px-4 py-2 rounded-lg text-sm sm:text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Connect your wallet using the button in the top right</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <TransactionFeedback 
        status={transactionStatus}
        error={transactionError}
        txHash={currentTxHash}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-20">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 transform hover:scale-105 transition-transform duration-300">
            SOP  Staking
          </h1>
          <p className="mt-4 sm:mt-6 max-w-3xl mx-auto text-base sm:text-lg md:text-2xl leading-relaxed text-gray-300">
            Stake your SOP tokens and earn rewards. The longer you stake, the more you earn.
          </p>
        </div>

        {/* Staking Stats */}
        <div className="grid grid-cols-2 gap-4 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-8 sm:mb-16">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 hover:border-blue-500">
            <h3 className="text-sm sm:text-lg font-medium text-blue-300">Token Balance</h3>
            <p className="text-lg sm:text-2xl font-bold text-blue-400 mt-2 truncate" title={tokenBalance}>{tokenBalance} SOP</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 hover:border-purple-500">
            <h3 className="text-sm sm:text-lg font-medium text-purple-300">Your Stake</h3>
            <p className="text-lg sm:text-2xl font-bold text-purple-400 mt-2 truncate" title={stakedBalance}>{stakedBalance} SOP</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 hover:border-green-500">
            <h3 className="text-sm sm:text-lg font-medium text-green-300">Current APR</h3>
            <p className="text-lg sm:text-2xl font-bold text-green-400 mt-2">{currentAPR}%</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 hover:border-yellow-500">
            <h3 className="text-sm sm:text-lg font-medium text-yellow-300">Your Rewards</h3>
            <p className="text-lg sm:text-2xl font-bold text-yellow-400 mt-2 truncate" title={rewards}>{rewards} SOP</p>
          </div>
        </div>

        {/* Staking Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-6xl mx-auto">
          {/* Stake Section */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Stake Tokens
            </h2>
            <div className="space-y-8">
              <div>
                <label className="block text-lg font-medium text-purple-300 mb-2">Amount to Stake</label>
                <div className="relative rounded-xl">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-colors duration-300 pr-16"
                    placeholder="0.0"
                    disabled={loading || !account}
                    min="0"
                    step="0.000000000000000001"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-gray-400">SOP</span>
                  </div>
                </div>
                <p className="mt-3 text-lg text-blue-300">
                  Balance: {tokenBalance} SOP
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Minimum staking period: {getMinimumStakingPeriodText()}
                </p>
              </div>
              <button 
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white shadow-lg transform hover:scale-105 transition-all duration-300 
                  ${loading ? 'opacity-50 cursor-not-allowed bg-gray-600' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'}`}
                onClick={handleStake}
                disabled={loading || !account}
              >
                {loading ? 'Processing...' : 'Stake Tokens'}
              </button>
            </div>

            {/* Estimated Rewards */}
            <div className="mt-8 p-6 bg-gray-700/50 rounded-xl border border-gray-600">
              <h3 className="text-xl font-semibold text-blue-300 mb-4">Estimated Rewards</h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-6">
                <div className="text-center">
                  <p className="text-gray-400 mb-2">Daily</p>
                  <p className="text-lg font-semibold text-blue-400">
                    {estimatedRewards.daily.toFixed(6)} SOP
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 mb-2">Monthly</p>
                  <p className="text-lg font-semibold text-purple-400">
                    {estimatedRewards.monthly.toFixed(6)} SOP
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 mb-2">Yearly</p>
                  <p className="text-lg font-semibold text-green-400">
                    {estimatedRewards.yearly.toFixed(6)} SOP
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Withdraw Section */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
              Withdraw Tokens
            </h2>
            <div className="space-y-8">
              <div>
                <label className="block text-lg font-medium text-green-300 mb-2">Amount to Withdraw</label>
                <div className="relative rounded-xl">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500 transition-colors duration-300 pr-16"
                    placeholder="0.0"
                    disabled={loading || !account || !canWithdraw}
                    min="0"
                    max={stakedBalance}
                    step="0.000000000000000001"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-gray-400">SOP</span>
                  </div>
                </div>
                <p className="mt-3 text-lg text-green-300">
                  Staked: {stakedBalance} SOP
                </p>
                <p className={`mt-2 text-sm ${canWithdraw ? 'text-green-400' : 'text-red-400'}`}>
                  {getRemainingLockTime()}
                </p>
              </div>
              <button 
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white shadow-lg transform hover:scale-105 transition-all duration-300 
                  ${loading || !canWithdraw ? 'opacity-50 cursor-not-allowed bg-gray-600' : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'}`}
                onClick={handleUnstake}
                disabled={loading || !account || !canWithdraw}
              >
                {loading ? 'Processing...' : 'Withdraw Tokens'}
              </button>
              <button 
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white shadow-lg transform hover:scale-105 transition-all duration-300 
                  ${loading ? 'opacity-50 cursor-not-allowed bg-gray-600' : 'bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600'}`}
                onClick={handleClaimRewards}
                disabled={loading || !account}
              >
                {loading ? 'Processing...' : 'Claim Rewards'}
              </button>
            </div>

            {/* Staking Info */}
            <div className="mt-4 sm:mt-8 p-4 sm:p-6 bg-gray-700/50 rounded-xl border border-gray-600">
              <h3 className="text-lg sm:text-xl font-semibold text-green-300 mb-4">Your Staking Info</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Total Staked</p>
                  <p className="text-lg font-semibold text-blue-400">{stakedBalance} SOP</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Pending Rewards</p>
                  <p className="text-lg font-semibold text-green-400">{rewards} SOP</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Staking Duration</p>
                  <p className="text-lg font-semibold text-purple-400">{getStakingDuration()}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">APR</p>
                  <p className="text-lg font-semibold text-yellow-400">{currentAPR}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
