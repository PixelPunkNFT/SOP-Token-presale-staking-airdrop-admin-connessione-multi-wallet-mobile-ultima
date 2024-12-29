import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { getContract, getContractWithSigner, formatContractError } from '../utils/contracts';
import { parseEther, formatEther } from 'viem';
import { ethers } from 'ethers';
import { useMaintenance } from '../contexts/MaintenanceContext';
import MaintenancePage from '../components/MaintenancePage';
import { TransactionFeedback } from '../components/TransactionFeedback';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export default function Airdrop() {
  const { isPageUnderMaintenance } = useMaintenance();
  
  if (isPageUnderMaintenance('airdrop')) {
    return <MaintenancePage />;
  }

  const { address: account, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [referralLink, setReferralLink] = useState('');
  const [inputReferralCode, setInputReferralCode] = useState('');
  const [pendingReferrals, setPendingReferrals] = useState([]); // [{address, hasStaked, stakedAmount}]
  const [confirmedReferrals, setConfirmedReferrals] = useState([]); // [{address, stakedAmount}]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('');
  const [transactionHash, setTransactionHash] = useState('');

  useEffect(() => {
    if (account) {
      loadReferralData(account);
      // Ricarica i dati ogni 30 secondi per aggiornare lo stato di staking
      const interval = setInterval(() => {
        loadReferralData(account);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [account]);

  const retryOperation = async (operation, retries = MAX_RETRIES) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (err) {
        if (i === retries - 1) throw err;
        
        // Handle "transaction replaced" error
        if (err.code === "TRANSACTION_REPLACED") {
          if (err.cancelled) {
            // Transaction was cancelled, retry
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            continue;
          } else {
            // Transaction was replaced by a successful one
            return;
          }
        }
        
        // Handle other RPC errors
        if (err.code === -32603) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        }
        
        throw err;
      }
    }
  };

  const loadReferralData = async (currentAccount) => {
    try {
      await retryOperation(async () => {
        const contract = await getContract('Airdrop', true);
        
        const stakingContract = await getContract('Staking', true);
        
        // Get all referral events
        const fromBlock = 0;
        const toBlock = 'latest';
        
        // Get our referral code
        const myCode = await contract.getMyReferralCode();
        console.log("My referral code:", myCode);
        
        if (myCode === ethers.constants.HashZero) {
          console.log("No referral code found");
          setPendingReferrals([]);
          return;
        }
        
        // Get all referral events
        const referralEvents = await contract.queryFilter(contract.filters.ReferralRewardClaimed(currentAccount));
        const claimedAddresses = new Set(referralEvents.map(event => event.args.referee.toLowerCase()));
        
        // Get all referral registration events
        const registerEvents = await contract.queryFilter(contract.filters.ReferralCodeGenerated());
        const allAddresses = registerEvents.map(event => event.args.user);
        
        const pendingRefs = [];
        
        // Per ogni indirizzo, verifica se è un nostro referral pendente
        for (const userAddress of allAddresses) {
          try {
            const isPending = await contract.pendingReferrals(currentAccount, userAddress);
            if (isPending && !claimedAddresses.has(userAddress.toLowerCase())) {
              // Controlla lo stato di staking
              const [stakedAmount,,] = await stakingContract.getStakeInfo(userAddress);
              const formattedAmount = ethers.utils.formatEther(stakedAmount);
              const hasStaked = stakedAmount.gte(ethers.utils.parseEther("1000"));
              
              pendingRefs.push({
                address: userAddress,
                hasStaked,
                stakedAmount: formattedAmount
              });
            }
          } catch (err) {
            console.error('Error checking referral status for address:', userAddress, err);
          }
        }
        
        console.log("Pending referrals found:", pendingRefs.length);
        setPendingReferrals(pendingRefs);
        
        const [code, count] = await Promise.all([
          contract.getMyReferralCode(),
          contract.getMyReferralCount()
        ]);
        
        console.log("Referral code received:", code);
        if (code !== ethers.constants.HashZero) {
          setReferralCode(code);
          const link = `${window.location.origin}/airdrop?ref=${code}`;
          console.log("Setting referral link:", link);
          setReferralLink(link);
        } else {
          console.log("No referral code found (HashZero)");
          setReferralCode('');
          setReferralLink('');
        }
        
        setReferralCount(count.toNumber());
      });
    } catch (err) {
      console.error('Error loading referral data:', err);
      const errorMessage = formatContractError(err);
      if (errorMessage.includes("Referral code already generated")) {
      setError("You have already generated a referral code. Reload the page to view it.");
        // Ricarica i dati per assicurarci di avere il codice
        await loadReferralData(account);
      } else {
        setError(errorMessage);
      }
    }
  };

  const generateReferralCode = async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    if (referralCode) {
      setError('You already have an active referral code. You cannot generate another one.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setTransactionStatus('pending');

      const contract = await getContract('Airdrop', true);
      // Prima controlliamo se esiste già un codice
      const existingCode = await contract.getMyReferralCode();
      
      if (existingCode !== ethers.constants.HashZero) {
        // Se esiste già un codice, lo recuperiamo
        await loadReferralData(account);
        setSuccess('Referral code successfully retrieved!');
      } else {
        // Se non esiste, ne generiamo uno nuovo
        await retryOperation(async () => {
          const contractWithSigner = await getContractWithSigner('Airdrop');
        const tx = await contractWithSigner.generateReferralCode();
        setTransactionHash(tx.hash);
        await tx.wait();
        setTransactionStatus('success');
        });

        await loadReferralData(account);
        setSuccess('Referral code successfully generated! You can share it with your friends.');
      }
    } catch (err) {
      console.error('Error generating/retrieving referral code:', err);
      const errorMessage = formatContractError(err);
      if (errorMessage.includes("Referral code already generated")) {
        // Se il codice esiste già, proviamo a recuperarlo
        await loadReferralData(account);
        setSuccess('Referral code successfully retrieved!');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const registerReferral = async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await retryOperation(async () => {
        const contract = await getContractWithSigner('Airdrop');
        
        // Verifichiamo il formato del codice
        if (!inputReferralCode.startsWith('0x')) {
          setError('The referral code must start with 0x');
          return;
        }

        if (inputReferralCode.length !== 66) {
          setError('Invalid referral code: wrong length');
          return;
        }

        // Verifichiamo che non stiamo usando il nostro codice
        const myCode = await contract.getMyReferralCode();
        console.log("My code:", myCode);
        if (inputReferralCode === myCode) {
          setError('You cannot use your own referral code');
          return;
        }

        // Verifichiamo che non abbiamo già partecipato
        const hasParticipated = await contract.hasParticipated(account);
        if (hasParticipated) {
          setError('You have already participated in the referral program');
          return;
        }

        console.log("Registering referral with code:", inputReferralCode);
        const tx = await contract.registerReferral(inputReferralCode);
        setTransactionHash(tx.hash);
        await tx.wait();
        setTransactionStatus('success');
      });

      setSuccess('Referral successfully registered! Your status is pending. When you stake 1000 tokens, both you and your referrer will be able to withdraw 200 tokens each.');
      await loadReferralData(account);
    } catch (err) {
      console.error('Error claiming reward:', err);
      setError(formatContractError(err));
    } finally {
      setLoading(false);
    }
  };

  const claimReferralReward = async (referee) => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await retryOperation(async () => {
        const contract = await getContractWithSigner('Airdrop');
        const tx = await contract.claimReferralReward(referee);
        setTransactionHash(tx.hash);
        await tx.wait();
        setTransactionStatus('success');
      });

      setSuccess('Reward successfully claimed! You received 200 tokens.');
      await loadReferralData(account);
    } catch (err) {
      console.error('Error claiming reward:', err);
      setError(formatContractError(err));
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setSuccess('Link copied to clipboard!');
    } catch (err) {
      setError('Error copying the link');
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setInputReferralCode(refCode);
    }
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-3 py-6 sm:px-4 sm:py-16">
        <TransactionFeedback
          status={transactionStatus}
          error={error}
          txHash={transactionHash}
        />
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 transform hover:scale-105 transition-transform duration-300">
          Airdrop Referral Program
        </h1>
        
        {!account ? (
          <div className="bg-gray-800 rounded-xl p-6 sm:p-12 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 text-center">
            <p className="text-gray-300 text-lg sm:text-xl">Connect your wallet to participate in the referral program</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-xl p-4 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Your Referrals
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-gray-700 p-4 sm:p-6 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                  <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Wallet</p>
                  <p className="text-base sm:text-xl font-bold text-blue-400">
                    {`${account.substring(0, 6)}...${account.substring(38)}`}
                  </p>
                </div>
                <div className="bg-gray-700 p-4 sm:p-6 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                  <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Completed Referrals</p>
                  <p className="text-base sm:text-xl font-bold text-purple-400">{referralCount}</p>
                </div>
                <div className="bg-gray-700 p-4 sm:p-6 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                  <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Tokens Earned</p>
                  <p className="text-base sm:text-xl font-bold text-green-400">{referralCount * 200}</p>
                </div>
              </div>
              
              {!referralCode ? (
                <div className="space-y-4">
                  <button
                    onClick={generateReferralCode}
                    disabled={loading}
                    className={`w-full py-4 px-4 rounded-lg font-semibold text-white shadow-lg transform hover:scale-105 transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed bg-gray-600' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'}`}
                  >
                    {loading ? 'Generating...' : 'Generate Referral Code'}
                  </button>
                  {error && error.includes("Referral code already generated") && (
                    <button
                      onClick={() => loadReferralData(account)}
                      className="w-full py-4 px-4 rounded-lg font-semibold text-white shadow-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      Retrieve Existing Referral Code
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-300 mb-2">Your referral code:</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <p className="flex-1 text-xs sm:text-sm font-mono bg-gray-700 p-2 rounded break-all">{referralCode}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(referralCode);
                          setSuccess('Codice copiato negli appunti!');
                        }}
                        className="w-full sm:w-auto px-4 py-3 rounded-lg font-semibold text-white shadow-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-300 mb-2">Link to invite friends:</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="flex-1 rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-colors duration-300 py-3"
                      />
                      <button
                        onClick={copyReferralLink}
                        className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white shadow-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Referrals Stats */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Referral Statistics
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                <div className="bg-gray-700 p-4 sm:p-6 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                  <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Total Referrals</p>
                  <p className="text-base sm:text-xl font-bold text-blue-400">{pendingReferrals.length}</p>
                </div>
                <div className="bg-gray-700 p-4 sm:p-6 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                  <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Waiting for Stake</p>
                  <p className="text-base sm:text-xl font-bold text-yellow-400">
                    {pendingReferrals.filter(r => !r.hasStaked).length}
                  </p>
                </div>
                <div className="bg-gray-700 p-4 sm:p-6 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                  <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Ready to Claim</p>
                  <p className="text-base sm:text-xl font-bold text-green-400">
                    {pendingReferrals.filter(r => r.hasStaked).length}
                  </p>
                </div>
                <div className="bg-gray-700 p-4 sm:p-6 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                  <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Tokens Available</p>
                  <p className="text-base sm:text-xl font-bold text-purple-400">
                    {pendingReferrals.filter(r => r.hasStaked).length * 200}
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Referrals Section */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                Referrals Waiting for Stake
              </h2>
              {pendingReferrals.filter(r => !r.hasStaked).length > 0 ? (
                <div className="space-y-4">
                  {pendingReferrals.filter(r => !r.hasStaked).map((referee, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg">
                      <div>
                        <span className="text-gray-300 text-sm sm:text-base">{`${referee.address.substring(0, 6)}...${referee.address.substring(38)}`}</span>
                        <div className="mt-3">
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(parseFloat(referee.stakedAmount) / 1000) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-400 mt-2">
                            Stake: {parseFloat(referee.stakedAmount).toFixed(2)}/1000 TOKE
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center text-sm sm:text-base">No referrals waiting for stake</p>
              )}
            </div>

            {/* Claimable Referrals Section */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
                Referrals Ready to Claim
              </h2>
              {pendingReferrals.filter(r => r.hasStaked).length > 0 ? (
                <div className="space-y-4">
                  {pendingReferrals.filter(r => r.hasStaked).map((referee, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="w-full sm:w-auto">
                        <span className="text-gray-300 text-sm sm:text-base">{`${referee.address.substring(0, 6)}...${referee.address.substring(38)}`}</span>
                        <div className="mt-2">
                          <span className="text-xs sm:text-sm text-gray-400">
                            Stake: {parseFloat(referee.stakedAmount).toFixed(2)} TOKE
                          </span>
                          <span className="ml-3 px-2 py-1 rounded text-xs sm:text-sm bg-green-500">
                            Ready to claim
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => claimReferralReward(referee.address)}
                        disabled={loading}
                        className="w-full sm:w-auto px-4 py-3 rounded-lg font-semibold text-white shadow-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        Claim 200 TOKE
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center text-sm sm:text-base">No referrals ready to claim</p>
              )}
            </div>

            {/* Use Referral Code Section */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                Use a Referral Code
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={inputReferralCode}
                  onChange={(e) => setInputReferralCode(e.target.value)}
                  placeholder="Enter referral code"
                  className="w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500 transition-colors duration-300 py-3"
                />
                <button
                  onClick={registerReferral}
                  disabled={loading || !inputReferralCode}
                  className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white shadow-lg transform hover:scale-105 transition-all duration-300 
                    ${loading || !inputReferralCode ? 'opacity-50 cursor-not-allowed bg-gray-600' : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'}`}
                >
                  {loading ? 'Processing...' : 'Register Referral'}
                </button>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="mt-4 sm:mt-6 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 text-red-100 animate-pulse text-center text-sm sm:text-base">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mt-4 sm:mt-6 bg-green-500 bg-opacity-20 border border-green-500 rounded-lg p-4 text-green-100 text-center text-sm sm:text-base">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
