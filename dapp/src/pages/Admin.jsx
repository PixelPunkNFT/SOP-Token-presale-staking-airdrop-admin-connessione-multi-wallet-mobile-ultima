import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { getContract, getContractWithSigner } from '../utils/contracts';
import { useAccount, useEnsName } from 'wagmi';
import { useMaintenance } from '../contexts/MaintenanceContext';

const Admin = () => {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { maintenanceStatus, setPageMaintenance } = useMaintenance();
  
  const [presaleInfo, setPresaleInfo] = useState({
    currentPrice: '0',
    totalRaised: '0',
    presaleFinalized: false,
    contractBalance: '0',
    emergencyStop: false,
    maxContribution: '0'
  });
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newMaxContribution, setNewMaxContribution] = useState('');

  // Form states for contract interactions
  const [newPresaleAddress, setNewPresaleAddress] = useState('');
  const [newStakingAddress, setNewStakingAddress] = useState('');
  const [newLiquidityVaultAddress, setNewLiquidityVaultAddress] = useState('');
  const [newAirdropAddress, setNewAirdropAddress] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [newStakingPeriod, setNewStakingPeriod] = useState('');
  const [airdropTokenAmount, setAirdropTokenAmount] = useState('');
  const [referrerReward, setReferrerReward] = useState('');
  const [refereeReward, setRefereeReward] = useState('');
  const [requiredStakeAmount, setRequiredStakeAmount] = useState('');
  // New form states
  const [tokenImageUrl, setTokenImageUrl] = useState('');
  const [tokenURI, setTokenURI] = useState('');
  const [maxWalletPercentage, setMaxWalletPercentage] = useState('');
  const [stakingTax, setStakingTax] = useState('');
  const [airdropTax, setAirdropTax] = useState('');
  const [partialUnlockTime, setPartialUnlockTime] = useState('');
  const [fullUnlockTime, setFullUnlockTime] = useState('');
  const [initialPrice, setInitialPrice] = useState('');
  const [airdropBurnAmount, setAirdropBurnAmount] = useState('');
  const [stakingBurnAmount, setStakingBurnAmount] = useState('');
  const [newMaxStakingCap, setNewMaxStakingCap] = useState('');
  const [isStakingPaused, setIsStakingPaused] = useState(false);

  // Funzione per controllare lo stato dello staking
  const checkStakingStatus = async () => {
    try {
      const stakingContract = await getContract('Staking');
      const paused = await stakingContract.stakingPaused();
      setIsStakingPaused(paused);
    } catch (error) {
      console.error('Errore nel controllo dello stato dello staking:', error);
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      await checkStakingStatus();
      if (!isConnected || !address) {
        setError('Connetti il wallet per accedere alla pagina admin');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      try {
        setLoading(true);
        const presaleContract = await getContract('Presale');
        const owner = await presaleContract.owner();
        
        if (owner.toLowerCase() !== address.toLowerCase()) {
          setError('Solo il proprietario può accedere a questa pagina');
          setTimeout(() => navigate('/'), 3000);
          return;
        }
        
        setIsOwner(true);
        await loadPresaleInfo();
        
        // Aggiorna il prezzo ogni minuto
        const interval = setInterval(loadPresaleInfo, 60000);
        return () => clearInterval(interval);
      } catch (error) {
        console.error('Errore nel controllo accesso:', error);
        setError(`Errore nel controllo dei permessi: ${error.message}`);
        setTimeout(() => navigate('/'), 3000);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [isConnected, address, navigate]);

  const loadPresaleInfo = async () => {
    try {
      const presaleContract = await getContract('Presale');
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const [
        currentPrice,
        totalRaised,
        presaleFinalized,
        contractBalance,
        emergencyStop,
        maxContribution
      ] = await Promise.all([
        presaleContract.getCurrentPrice(),
        presaleContract.totalRaised(),
        presaleContract.presaleFinalized(),
        provider.getBalance(presaleContract.address),
        presaleContract.emergencyStop(),
        presaleContract.maxContribution()
      ]);

      setPresaleInfo({
        currentPrice: ethers.utils.formatEther(currentPrice),
        totalRaised: ethers.utils.formatEther(totalRaised),
        presaleFinalized,
        contractBalance: ethers.utils.formatEther(contractBalance),
        emergencyStop,
        maxContribution: maxContribution || ethers.constants.Zero // Gestisce il caso undefined
      });
    } catch (error) {
      console.error('Errore nel caricamento info presale:', error);
      setError('Errore nel caricamento delle informazioni della presale');
    }
  };

  // Token Contract Functions
  const setPresaleContract = async () => {
    try {
      setLoading(true);
      setError('');
      const tokenContract = await getContractWithSigner('Token');
      const tx = await tokenContract.setPresaleContract(newPresaleAddress);
      await tx.wait();
      setNewPresaleAddress('');
      console.log('Presale contract address updated successfully');
    } catch (error) {
      console.error('Error setting presale contract:', error);
      setError(`Error setting presale contract: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setStakingContract = async () => {
    try {
      setLoading(true);
      setError('');
      const tokenContract = await getContractWithSigner('Token');
      const tx = await tokenContract.setStakingContract(newStakingAddress);
      await tx.wait();
      setNewStakingAddress('');
      console.log('Staking contract address updated successfully');
    } catch (error) {
      console.error('Error setting staking contract:', error);
      setError(`Error setting staking contract: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setLiquidityVaultContract = async () => {
    try {
      setLoading(true);
      setError('');
      const tokenContract = await getContractWithSigner('Token');
      const tx = await tokenContract.setLiquidityVaultContract(newLiquidityVaultAddress);
      await tx.wait();
      setNewLiquidityVaultAddress('');
      console.log('LiquidityVault contract address updated successfully');
    } catch (error) {
      console.error('Error setting liquidity vault contract:', error);
      setError(`Error setting liquidity vault contract: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setAirdropContract = async () => {
    try {
      setLoading(true);
      setError('');
      const tokenContract = await getContractWithSigner('Token');
      const tx = await tokenContract.setAirdropContract(newAirdropAddress);
      await tx.wait();
      setNewAirdropAddress('');
      console.log('Airdrop contract address updated successfully');
    } catch (error) {
      console.error('Error setting airdrop contract:', error);
      setError(`Error setting airdrop contract: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const burnTokens = async () => {
    try {
      setLoading(true);
      setError('');
      const tokenContract = await getContractWithSigner('Token');
      const amount = ethers.utils.parseEther(burnAmount);
      const tx = await tokenContract.burn(amount);
      await tx.wait();
      setBurnAmount('');
      console.log('Tokens burned successfully');
    } catch (error) {
      console.error('Error burning tokens:', error);
      setError(`Error burning tokens: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Staking Contract Functions
  const updateMinimumStakingPeriod = async () => {
    try {
      setLoading(true);
      setError('');
      const stakingContract = await getContractWithSigner('Staking');
      const tx = await stakingContract.updateMinimumStakingPeriod(newStakingPeriod);
      await tx.wait();
      setNewStakingPeriod('');
      console.log('Minimum staking period updated successfully');
    } catch (error) {
      console.error('Error updating minimum staking period:', error);
      setError(`Error updating minimum staking period: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Airdrop Contract Functions
  const addAirdropTokens = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get token and airdrop contracts
      const tokenContract = await getContractWithSigner('Token');
      const airdropContract = await getContractWithSigner('Airdrop');
      
      const amount = ethers.utils.parseEther(airdropTokenAmount);
      
      // First approve tokens
      console.log('Approving tokens...');
      const approveTx = await tokenContract.approve(airdropContract.address, amount);
      await approveTx.wait();
      console.log('Tokens approved');
      
      // Then add tokens to airdrop
      console.log('Adding tokens to airdrop...');
      const tx = await airdropContract.addTokens(amount);
      await tx.wait();
      setAirdropTokenAmount('');
      console.log('Tokens added to airdrop successfully');
    } catch (error) {
      console.error('Error adding tokens to airdrop:', error);
      setError(`Error adding tokens to airdrop: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateReferrerReward = async () => {
    try {
      setLoading(true);
      setError('');
      const airdropContract = await getContractWithSigner('Airdrop');
      const amount = ethers.utils.parseEther(referrerReward);
      const tx = await airdropContract.updateReferrerReward(amount);
      await tx.wait();
      setReferrerReward('');
      console.log('Referrer reward updated successfully');
    } catch (error) {
      console.error('Error updating referrer reward:', error);
      setError(`Error updating referrer reward: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateRefereeReward = async () => {
    try {
      setLoading(true);
      setError('');
      const airdropContract = await getContractWithSigner('Airdrop');
      const amount = ethers.utils.parseEther(refereeReward);
      const tx = await airdropContract.updateRefereeReward(amount);
      await tx.wait();
      setRefereeReward('');
      console.log('Referee reward updated successfully');
    } catch (error) {
      console.error('Error updating referee reward:', error);
      setError(`Error updating referee reward: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateRequiredStakeAmount = async () => {
    try {
      setLoading(true);
      setError('');
      const airdropContract = await getContractWithSigner('Airdrop');
      const amount = ethers.utils.parseEther(requiredStakeAmount);
      const tx = await airdropContract.updateRequiredStakeAmount(amount);
      await tx.wait();
      setRequiredStakeAmount('');
      console.log('Required stake amount updated successfully');
    } catch (error) {
      console.error('Error updating required stake amount:', error);
      setError(`Error updating required stake amount: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const emergencyWithdraw = async () => {
    try {
      setLoading(true);
      setError('');
      const airdropContract = await getContractWithSigner('Airdrop');
      const tx = await airdropContract.emergencyWithdraw();
      await tx.wait();
      console.log('Emergency withdrawal completed successfully');
    } catch (error) {
      console.error('Error in emergency withdrawal:', error);
      setError(`Error in emergency withdrawal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // New Token Functions
  const updateMaxWalletPercentage = async () => {
    try {
      setLoading(true);
      setError('');
      const tokenContract = await getContractWithSigner('Token');
      const tx = await tokenContract.setMaxWalletPercentage(maxWalletPercentage);
      await tx.wait();
      setMaxWalletPercentage('');
      console.log('Max wallet percentage updated successfully');
    } catch (error) {
      console.error('Error setting max wallet percentage:', error);
      setError(`Error setting max wallet percentage: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateStakingTax = async () => {
    try {
      setLoading(true);
      setError('');
      const tokenContract = await getContractWithSigner('Token');
      const tx = await tokenContract.setStakingTax(stakingTax);
      await tx.wait();
      setStakingTax('');
      console.log('Staking tax updated successfully');
    } catch (error) {
      console.error('Error setting staking tax:', error);
      setError(`Error setting staking tax: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateAirdropTax = async () => {
    try {
      setLoading(true);
      setError('');
      const tokenContract = await getContractWithSigner('Token');
      const tx = await tokenContract.setAirdropTax(airdropTax);
      await tx.wait();
      setAirdropTax('');
      console.log('Airdrop tax updated successfully');
    } catch (error) {
      console.error('Error setting airdrop tax:', error);
      setError(`Error setting airdrop tax: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultUnlockTimes = async () => {
    try {
      setLoading(true);
      setError('');
      const tokenContract = await getContractWithSigner('Token');
      const tx = await tokenContract.setDefaultUnlockTimes(partialUnlockTime, fullUnlockTime);
      await tx.wait();
      setPartialUnlockTime('');
      setFullUnlockTime('');
      console.log('Default unlock times updated successfully');
    } catch (error) {
      console.error('Error setting default unlock times:', error);
      setError(`Error setting default unlock times: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // New Presale Functions
  const updateInitialPrice = async () => {
    try {
      setLoading(true);
      setError('');
      const presaleContract = await getContractWithSigner('Presale');
      const tx = await presaleContract.setInitialPrice(ethers.utils.parseEther(initialPrice));
      await tx.wait();
      setInitialPrice('');
      console.log('Initial price updated successfully');
    } catch (error) {
      console.error('Error setting initial price:', error);
      setError(`Error setting initial price: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // New Burn Functions
  const burnAirdropTokens = async () => {
    try {
      setLoading(true);
      setError('');
      const airdropContract = await getContractWithSigner('Airdrop');
      const tx = await airdropContract.burn(ethers.utils.parseEther(airdropBurnAmount));
      await tx.wait();
      setAirdropBurnAmount('');
      console.log('Airdrop tokens burned successfully');
    } catch (error) {
      console.error('Error burning airdrop tokens:', error);
      setError(`Error burning airdrop tokens: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const burnStakingTokens = async () => {
    try {
      setLoading(true);
      setError('');
      const stakingContract = await getContractWithSigner('Staking');
      const tx = await stakingContract.burn(ethers.utils.parseEther(stakingBurnAmount));
      await tx.wait();
      setStakingBurnAmount('');
      console.log('Staking tokens burned successfully');
    } catch (error) {
      console.error('Error burning staking tokens:', error);
      setError(`Error burning staking tokens: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const finalizePresale = async () => {
    try {
      setLoading(true);
      setError('');

      const presaleContract = await getContractWithSigner('Presale');
      
      console.log('Finalizzazione presale...');
      const tx = await presaleContract.finalize();
      await tx.wait();
      
      await loadPresaleInfo();
      console.log('Presale finalizzato con successo');
    } catch (error) {
      console.error('Errore nella finalizzazione:', error);
      setError(`Errore nella finalizzazione: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-8 max-w-md w-full mx-4 animate-pulse">
          <div className="text-red-100 text-center">
            {error}
          </div>
          <div className="text-center text-gray-400 mt-4">
            Reindirizzamento alla home page tra pochi secondi...
          </div>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  const buttonClasses = "w-full py-3 px-4 rounded-lg font-semibold text-white shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 transform hover:scale-105 transition-transform duration-300">
          Pannello di Amministrazione
        </h1>
        
        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-4 mb-6 text-red-100 animate-pulse">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Presale Card */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 hover:border-blue-500">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Informazioni Presale</h2>
            
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors duration-300">
              <p className="text-gray-400 text-sm">Prezzo Corrente</p>
              <p className="text-xl font-bold text-blue-400">{presaleInfo.currentPrice} ETH</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors duration-300">
              <p className="text-gray-400 text-sm">Totale Raccolto</p>
              <p className="text-xl font-bold text-green-400">{presaleInfo.totalRaised} ETH</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors duration-300">
              <p className="text-gray-400 text-sm">Stato Presale</p>
              <p className="text-xl font-bold text-purple-400">
                {presaleInfo.presaleFinalized ? 'Finalizzata' : 'Attiva'}
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors duration-300">
              <p className="text-gray-400 text-sm">Bilancio Contratto</p>
              <p className="text-xl font-bold text-yellow-400">{presaleInfo.contractBalance} ETH</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors duration-300">
              <p className="text-gray-400 text-sm">Stato Emergenza</p>
              <p className="text-xl font-bold text-red-400">
                {presaleInfo.emergencyStop ? 'Attivo' : 'Non Attivo'}
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors duration-300">
              <p className="text-gray-400 text-sm">Contributo Massimo</p>
              <p className="text-xl font-bold text-blue-400">{presaleInfo.maxContribution ? ethers.utils.formatEther(presaleInfo.maxContribution) : '0'} ETH</p>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  const presaleContract = await getContractWithSigner('Presale');
                  const tx = await presaleContract.toggleEmergencyStop();
                  await tx.wait();
                  await loadPresaleInfo();
                } catch (error) {
                  setError(`Errore nel toggle emergency stop: ${error.message}`);
                } finally {
                  setLoading(false);
                }
              }}
              className={`${buttonClasses} ${
                presaleInfo.emergencyStop 
                  ? 'bg-gradient-to-r from-green-500 to-green-700' 
                  : 'bg-gradient-to-r from-red-500 to-red-700'
              }`}
            >
              {presaleInfo.emergencyStop ? 'Disattiva Emergenza' : 'Attiva Emergenza'}
            </button>

            <div>
              <label className="block text-sm font-medium text-blue-300 mb-2">Modifica Contributo Massimo</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newMaxContribution}
                  onChange={(e) => setNewMaxContribution(e.target.value)}
                  placeholder="Nuovo contributo massimo in ETH"
                  className="flex-1 rounded-lg bg-gray-700 border-gray-600 text-white"
                />
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const presaleContract = await getContractWithSigner('Presale');
                      const tx = await presaleContract.setMaxContribution(ethers.utils.parseEther(newMaxContribution));
                      await tx.wait();
                      await loadPresaleInfo();
                      setNewMaxContribution('');
                    } catch (error) {
                      setError(`Errore nell'aggiornamento del contributo massimo: ${error.message}`);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className={`${buttonClasses} bg-blue-500 hover:bg-blue-600 px-4`}
                >
                  Aggiorna
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-300 mb-2">Ritira ETH Accumulato</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Quantità di ETH da ritirare"
                  className="flex-1 rounded-lg bg-gray-700 border-gray-600 text-white"
                />
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const presaleContract = await getContractWithSigner('Presale');
                      const tx = await presaleContract.withdrawAccumulatedEth(ethers.utils.parseEther(withdrawAmount));
                      await tx.wait();
                      await loadPresaleInfo();
                      setWithdrawAmount('');
                    } catch (error) {
                      setError(`Errore nel ritiro di ETH: ${error.message}`);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className={`${buttonClasses} bg-yellow-500 hover:bg-yellow-600 px-4`}
                >
                  Ritira
                </button>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  const presaleContract = await getContractWithSigner('Presale');
                  const tx = await presaleContract.claimRefund();
                  await tx.wait();
                  await loadPresaleInfo();
                } catch (error) {
                  setError(`Errore nel rimborso: ${error.message}`);
                } finally {
                  setLoading(false);
                }
              }}
              className={`${buttonClasses} bg-gradient-to-r from-purple-500 to-purple-700`}
            >
              Richiedi Rimborso (dopo 120 giorni)
            </button>
          </div>

          <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-blue-300">Prezzo Iniziale Token</label>
                <input
                  type="number"
                  value={initialPrice}
                  onChange={(e) => setInitialPrice(e.target.value)}
                  placeholder="Nuovo prezzo iniziale"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  onClick={updateInitialPrice}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-blue-500 to-blue-700`}
                >
                  Aggiorna Prezzo Iniziale
                </button>
              </div>
            </div>
            
            {!presaleInfo.presaleFinalized && (
              <button
                onClick={finalizePresale}
                disabled={loading}
                className={`${buttonClasses} bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800`}
              >
                {loading ? 'Finalizzazione in corso...' : 'Finalizza Presale'}
              </button>
            )}
          </div>

          {/* Token Management Card */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 hover:border-purple-500">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">Gestione Token</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-purple-300">Imposta Contratto Presale</label>
                <input
                  type="text"
                  value={newPresaleAddress}
                  onChange={(e) => setNewPresaleAddress(e.target.value)}
                  placeholder="Indirizzo del contratto"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-colors duration-300"
                />
                <button
                  onClick={setPresaleContract}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800`}
                >
                  Aggiorna Indirizzo Presale
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300">Imposta Contratto Staking</label>
                <input
                  type="text"
                  value={newStakingAddress}
                  onChange={(e) => setNewStakingAddress(e.target.value)}
                  placeholder="Indirizzo del contratto"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-colors duration-300"
                />
                <button
                  onClick={setStakingContract}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800`}
                >
                  Aggiorna Indirizzo Staking
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300">Imposta Contratto LiquidityVault</label>
                <input
                  type="text"
                  value={newLiquidityVaultAddress}
                  onChange={(e) => setNewLiquidityVaultAddress(e.target.value)}
                  placeholder="Indirizzo del contratto"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-colors duration-300"
                />
                <button
                  onClick={setLiquidityVaultContract}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800`}
                >
                  Aggiorna Indirizzo LiquidityVault
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300">Imposta Contratto Airdrop</label>
                <input
                  type="text"
                  value={newAirdropAddress}
                  onChange={(e) => setNewAirdropAddress(e.target.value)}
                  placeholder="Indirizzo del contratto"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-colors duration-300"
                />
                <button
                  onClick={setAirdropContract}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800`}
                >
                  Aggiorna Indirizzo Airdrop
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300">Percentuale Massima che puo detenere ogni Wallet</label>
                <input
                  type="number"
                  value={maxWalletPercentage}
                  onChange={(e) => setMaxWalletPercentage(e.target.value)}
                  placeholder="Percentuale massima (1-100)"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                />
                <button
                  onClick={updateMaxWalletPercentage}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-purple-500 to-purple-700`}
                >
                  Aggiorna Percentuale Massima
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300">Tassa Staking fees (%)</label>
                <input
                  type="number"
                  value={stakingTax}
                  onChange={(e) => setStakingTax(e.target.value)}
                  placeholder="Nuova tassa staking"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                />
                <button
                  onClick={updateStakingTax}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-purple-500 to-purple-700`}
                >
                  Aggiorna Tassa Staking
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300">Tassa Airdrop fees (%)</label>
                <input
                  type="number"
                  value={airdropTax}
                  onChange={(e) => setAirdropTax(e.target.value)}
                  placeholder="Nuova tassa airdrop"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                />
                <button
                  onClick={updateAirdropTax}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-purple-500 to-purple-700`}
                >
                  Aggiorna Tassa Airdrop
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300">Tempi di Sblocco vendite (secondi)</label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={partialUnlockTime}
                    onChange={(e) => setPartialUnlockTime(e.target.value)}
                    placeholder="Tempo sblocco 30%"
                    className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    value={fullUnlockTime}
                    onChange={(e) => setFullUnlockTime(e.target.value)}
                    placeholder="Tempo sblocco 70%"
                    className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={setDefaultUnlockTimes}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-purple-500 to-purple-700`}
                >
                  Aggiorna Tempi di Sblocco
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300">Brucia Token dal wallet owner</label>
                <input
                  type="number"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  placeholder="Quantità di token da bruciare"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 transition-colors duration-300"
                />
                <button
                  onClick={burnTokens}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800`}
                >
                  Brucia Token
                </button>
              </div>
            </div>
          </div>

          {/* Staking Management Card */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 hover:border-green-500">
            <h2 className="text-2xl font-semibold mb-4 text-green-400">Gestione Staking</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-green-300">Cap Massimo di Staking (in token)</label>
                <input
                  type="number"
                  value={newMaxStakingCap}
                  onChange={(e) => setNewMaxStakingCap(e.target.value)}
                  placeholder="Nuovo cap massimo di staking"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500"
                />
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError('');
                      const stakingContract = await getContractWithSigner('Staking');
                      const tx = await stakingContract.setMaxStakingCap(ethers.utils.parseEther(newMaxStakingCap));
                      await tx.wait();
                      setNewMaxStakingCap('');
                      console.log('Cap massimo di staking aggiornato con successo');
                    } catch (error) {
                      console.error('Errore nell\'aggiornamento del cap massimo:', error);
                      setError(`Errore nell'aggiornamento del cap massimo: ${error.message}`);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-green-500 to-green-700`}
                >
                  Aggiorna Cap Massimo
                </button>
              </div>

              <div>
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError('');
                      const stakingContract = await getContractWithSigner('Staking');
                      const tx = await stakingContract.pauseStaking();
                      await tx.wait();
                      await checkStakingStatus();
                      console.log('Stato dello staking modificato con successo');
                    } catch (error) {
                      console.error('Errore nella modifica dello stato dello staking:', error);
                      setError(`Errore nella modifica dello stato dello staking: ${error.message}`);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className={`${buttonClasses} ${
                    isStakingPaused 
                      ? 'bg-gradient-to-r from-green-500 to-green-700' 
                      : 'bg-gradient-to-r from-red-500 to-red-700'
                  }`}
                >
                  {isStakingPaused ? 'Riattiva Staking' : 'Metti in Pausa Staking'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-300">Brucia Token Staking</label>
                <input
                  type="number"
                  value={stakingBurnAmount}
                  onChange={(e) => setStakingBurnAmount(e.target.value)}
                  placeholder="Quantità di token da bruciare"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500"
                />
                <button
                  onClick={burnStakingTokens}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-red-500 to-red-700`}
                >
                  Brucia Token Staking
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-300">Periodo Minimo di Staking</label>
                <input
                  type="number"
                  value={newStakingPeriod}
                  onChange={(e) => setNewStakingPeriod(e.target.value)}
                  placeholder="Nuovo periodo minimo (in secondi)"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500 transition-colors duration-300"
                />
                <button
                  onClick={updateMinimumStakingPeriod}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800`}
                >
                  Aggiorna Periodo Minimo
                </button>
              </div>
            </div>
          </div>

          {/* Airdrop Management Card */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 hover:border-yellow-500">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400">Gestione Airdrop</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-yellow-300">Brucia Token Airdrop</label>
                <input
                  type="number"
                  value={airdropBurnAmount}
                  onChange={(e) => setAirdropBurnAmount(e.target.value)}
                  placeholder="Quantità di token da bruciare"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500"
                />
                <button
                  onClick={burnAirdropTokens}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-red-500 to-red-700`}
                >
                  Brucia Token Airdrop
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-300">Aggiungi Token all'Airdrop contract-pool</label>
                <input
                  type="number"
                  value={airdropTokenAmount}
                  onChange={(e) => setAirdropTokenAmount(e.target.value)}
                  placeholder="Quantità di token da aggiungere"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 transition-colors duration-300"
                />
                <button
                  onClick={addAirdropTokens}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800`}
                >
                  Aggiungi Token
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-300">Ricompensa Referrer 'colui che invita'</label>
                <input
                  type="number"
                  value={referrerReward}
                  onChange={(e) => setReferrerReward(e.target.value)}
                  placeholder="Nuova ricompensa per il referrer"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 transition-colors duration-300"
                />
                <button
                  onClick={updateReferrerReward}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800`}
                >
                  Aggiorna Ricompensa Referrer
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-300">Ricompensa Referee 'coloro che ricevono invito'</label>
                <input
                  type="number"
                  value={refereeReward}
                  onChange={(e) => setRefereeReward(e.target.value)}
                  placeholder="Nuova ricompensa per il referee"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 transition-colors duration-300"
                />
                <button
                  onClick={updateRefereeReward}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800`}
                >
                  Aggiorna Ricompensa Referee
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-300">Importo Minimo Stake per ricevere ricompensa</label>
                <input
                  type="number"
                  value={requiredStakeAmount}
                  onChange={(e) => setRequiredStakeAmount(e.target.value)}
                  placeholder="Nuovo importo minimo di stake"
                  className="mt-1 block w-full rounded-lg bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 transition-colors duration-300"
                />
                <button
                  onClick={updateRequiredStakeAmount}
                  disabled={loading}
                  className={`${buttonClasses} mt-2 bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800`}
                >
                  Aggiorna Importo Minimo Stake 
                </button>
              </div>

              <button
                onClick={emergencyWithdraw}
                disabled={loading}
                className={`${buttonClasses} bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600`}
              >
                Emergency Withdraw
              </button>
            </div>
          </div>

         

          {/* Maintenance Management Card */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 hover:border-red-500">
            <h2 className="text-2xl font-semibold mb-4 text-red-400">Gestione Manutenzione</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {/* Presale Maintenance */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                      <span className="text-white text-lg">Presale</span>
                      <button
                        onClick={() => {
                          const currentStatus = maintenanceStatus.presale?.active || false;
                          const currentMessage = maintenanceStatus.presale?.message || '';
                          const currentHours = maintenanceStatus.presale?.estimatedCompletion ? 
                            Math.ceil((new Date(maintenanceStatus.presale.estimatedCompletion) - new Date()) / 3600000) : 0;
                          setPageMaintenance('presale', !currentStatus, currentMessage, currentHours);
                        }}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold text-white ${
                          maintenanceStatus.presale?.active 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-green-500 hover:bg-green-600'
                        } transition-colors duration-300`}
                      >
                        {maintenanceStatus.presale?.active ? 'In Manutenzione' : 'Attivo'}
                      </button>
                    </div>
                    {maintenanceStatus.presale?.active && (
                      <>
                        <input
                          type="text"
                          placeholder="Messaggio di manutenzione"
                          value={maintenanceStatus.presale?.message || ''}
                          onChange={(e) => setPageMaintenance('presale', true, e.target.value, 
                            maintenanceStatus.presale?.estimatedCompletion ? 
                              Math.ceil((new Date(maintenanceStatus.presale.estimatedCompletion) - new Date()) / 3600000) : 0
                          )}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white placeholder-gray-400"
                        />
                        <input
                          type="number"
                          placeholder="Ore stimate per completamento"
                          value={maintenanceStatus.presale?.estimatedCompletion ? 
                            Math.ceil((new Date(maintenanceStatus.presale.estimatedCompletion) - new Date()) / 3600000) : ''}
                          onChange={(e) => setPageMaintenance('presale', true, 
                            maintenanceStatus.presale?.message || '', 
                            parseInt(e.target.value) || 0
                          )}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white placeholder-gray-400"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Staking Maintenance */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                      <span className="text-white text-lg">Staking</span>
                      <button
                        onClick={() => {
                          const currentStatus = maintenanceStatus.staking?.active || false;
                          const currentMessage = maintenanceStatus.staking?.message || '';
                          const currentHours = maintenanceStatus.staking?.estimatedCompletion ? 
                            Math.ceil((new Date(maintenanceStatus.staking.estimatedCompletion) - new Date()) / 3600000) : 0;
                          setPageMaintenance('staking', !currentStatus, currentMessage, currentHours);
                        }}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold text-white ${
                          maintenanceStatus.staking?.active 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-green-500 hover:bg-green-600'
                        } transition-colors duration-300`}
                      >
                        {maintenanceStatus.staking?.active ? 'In Manutenzione' : 'Attivo'}
                      </button>
                    </div>
                    {maintenanceStatus.staking?.active && (
                      <>
                        <input
                          type="text"
                          placeholder="Messaggio di manutenzione"
                          value={maintenanceStatus.staking?.message || ''}
                          onChange={(e) => setPageMaintenance('staking', true, e.target.value, 
                            maintenanceStatus.staking?.estimatedCompletion ? 
                              Math.ceil((new Date(maintenanceStatus.staking.estimatedCompletion) - new Date()) / 3600000) : 0
                          )}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white placeholder-gray-400"
                        />
                        <input
                          type="number"
                          placeholder="Ore stimate per completamento"
                          value={maintenanceStatus.staking?.estimatedCompletion ? 
                            Math.ceil((new Date(maintenanceStatus.staking.estimatedCompletion) - new Date()) / 3600000) : ''}
                          onChange={(e) => setPageMaintenance('staking', true, 
                            maintenanceStatus.staking?.message || '', 
                            parseInt(e.target.value) || 0
                          )}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white placeholder-gray-400"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Airdrop Maintenance */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                      <span className="text-white text-lg">Airdrop</span>
                      <button
                        onClick={() => {
                          const currentStatus = maintenanceStatus.airdrop?.active || false;
                          const currentMessage = maintenanceStatus.airdrop?.message || '';
                          const currentHours = maintenanceStatus.airdrop?.estimatedCompletion ? 
                            Math.ceil((new Date(maintenanceStatus.airdrop.estimatedCompletion) - new Date()) / 3600000) : 0;
                          setPageMaintenance('airdrop', !currentStatus, currentMessage, currentHours);
                        }}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold text-white ${
                          maintenanceStatus.airdrop?.active 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-green-500 hover:bg-green-600'
                        } transition-colors duration-300`}
                      >
                        {maintenanceStatus.airdrop?.active ? 'In Manutenzione' : 'Attivo'}
                      </button>
                    </div>
                    {maintenanceStatus.airdrop?.active && (
                      <>
                        <input
                          type="text"
                          placeholder="Messaggio di manutenzione"
                          value={maintenanceStatus.airdrop?.message || ''}
                          onChange={(e) => setPageMaintenance('airdrop', true, e.target.value, 
                            maintenanceStatus.airdrop?.estimatedCompletion ? 
                              Math.ceil((new Date(maintenanceStatus.airdrop.estimatedCompletion) - new Date()) / 3600000) : 0
                          )}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white placeholder-gray-400"
                        />
                        <input
                          type="number"
                          placeholder="Ore stimate per completamento"
                          value={maintenanceStatus.airdrop?.estimatedCompletion ? 
                            Math.ceil((new Date(maintenanceStatus.airdrop.estimatedCompletion) - new Date()) / 3600000) : ''}
                          onChange={(e) => setPageMaintenance('airdrop', true, 
                            maintenanceStatus.airdrop?.message || '', 
                            parseInt(e.target.value) || 0
                          )}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white placeholder-gray-400"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* DAO Maintenance */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                      <span className="text-white text-lg">DAO</span>
                      <button
                        onClick={() => {
                          const currentStatus = maintenanceStatus.dao?.active || false;
                          const currentMessage = maintenanceStatus.dao?.message || '';
                          const currentHours = maintenanceStatus.dao?.estimatedCompletion ? 
                            Math.ceil((new Date(maintenanceStatus.dao.estimatedCompletion) - new Date()) / 3600000) : 0;
                          setPageMaintenance('dao', !currentStatus, currentMessage, currentHours);
                        }}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold text-white ${
                          maintenanceStatus.dao?.active 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-green-500 hover:bg-green-600'
                        } transition-colors duration-300`}
                      >
                        {maintenanceStatus.dao?.active ? 'In Manutenzione' : 'Attivo'}
                      </button>
                    </div>
                    {maintenanceStatus.dao?.active && (
                      <>
                        <input
                          type="text"
                          placeholder="Messaggio di manutenzione"
                          value={maintenanceStatus.dao?.message || ''}
                          onChange={(e) => setPageMaintenance('dao', true, e.target.value, 
                            maintenanceStatus.dao?.estimatedCompletion ? 
                              Math.ceil((new Date(maintenanceStatus.dao.estimatedCompletion) - new Date()) / 3600000) : 0
                          )}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white placeholder-gray-400"
                        />
                        <input
                          type="number"
                          placeholder="Ore stimate per completamento"
                          value={maintenanceStatus.dao?.estimatedCompletion ? 
                            Math.ceil((new Date(maintenanceStatus.dao.estimatedCompletion) - new Date()) / 3600000) : ''}
                          onChange={(e) => setPageMaintenance('dao', true, 
                            maintenanceStatus.dao?.message || '', 
                            parseInt(e.target.value) || 0
                          )}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white placeholder-gray-400"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Swap Maintenance */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                      <span className="text-white text-lg">Swap</span>
                      <button
                        onClick={() => {
                          const currentStatus = maintenanceStatus.swap?.active || false;
                          const currentMessage = maintenanceStatus.swap?.message || '';
                          const currentHours = maintenanceStatus.swap?.estimatedCompletion ? 
                            Math.ceil((new Date(maintenanceStatus.swap.estimatedCompletion) - new Date()) / 3600000) : 0;
                          setPageMaintenance('swap', !currentStatus, currentMessage, currentHours);
                        }}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold text-white ${
                          maintenanceStatus.swap?.active 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-green-500 hover:bg-green-600'
                        } transition-colors duration-300`}
                      >
                        {maintenanceStatus.swap?.active ? 'In Manutenzione' : 'Attivo'}
                      </button>
                    </div>
                    {maintenanceStatus.swap?.active && (
                      <>
                        <input
                          type="text"
                          placeholder="Messaggio di manutenzione"
                          value={maintenanceStatus.swap?.message || ''}
                          onChange={(e) => setPageMaintenance('swap', true, e.target.value, 
                            maintenanceStatus.swap?.estimatedCompletion ? 
                              Math.ceil((new Date(maintenanceStatus.swap.estimatedCompletion) - new Date()) / 3600000) : 0
                          )}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white placeholder-gray-400"
                        />
                        <input
                          type="number"
                          placeholder="Ore stimate per completamento"
                          value={maintenanceStatus.swap?.estimatedCompletion ? 
                            Math.ceil((new Date(maintenanceStatus.swap.estimatedCompletion) - new Date()) / 3600000) : ''}
                          onChange={(e) => setPageMaintenance('swap', true, 
                            maintenanceStatus.swap?.message || '', 
                            parseInt(e.target.value) || 0
                          )}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white placeholder-gray-400"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Admin;
