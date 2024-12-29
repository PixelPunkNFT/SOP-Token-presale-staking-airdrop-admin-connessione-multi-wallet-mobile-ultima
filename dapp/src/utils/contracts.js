import { ethers } from 'ethers';
import { getPublicClient, getWalletClient } from '@wagmi/core';
import { TOKEN_ABI, PRESALE_ABI, STAKING_ABI, AIRDROP_ABI } from './contractABIs';

// Contract addresses - these will be set after deployment
export const CONTRACT_ADDRESSES = {
  Token: import.meta.env.VITE_TOKEN_ADDRESS || '',
  Presale: import.meta.env.VITE_PRESALE_ADDRESS || '',
  Staking: import.meta.env.VITE_STAKING_ADDRESS || '',
  Airdrop: import.meta.env.VITE_AIRDROP_ADDRESS || ''
};

// Contract ABIs mapping
const CONTRACT_ABIS = {
  Token: TOKEN_ABI,
  Presale: PRESALE_ABI,
  Staking: STAKING_ABI,
  Airdrop: AIRDROP_ABI
};

// Function to get signer/provider using Wagmi with mobile optimizations
export async function getSignerOrProvider(needSigner = false) {
  const MAX_RETRIES = 3;
  const INITIAL_TIMEOUT = 5000; // 5 seconds initial timeout
  
  const attempt = async (retryCount = 0) => {
    try {
      if (needSigner) {
        const walletClient = await Promise.race([
          getWalletClient(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 
            INITIAL_TIMEOUT * Math.pow(2, retryCount))
          )
        ]);
        
        if (!walletClient) {
          throw new Error('No wallet connected! Please connect your wallet.');
        }
        return new ethers.providers.Web3Provider(walletClient.transport).getSigner();
      }
      
      const publicClient = getPublicClient();
      if (!publicClient) {
        throw new Error('No provider available!');
      }
      return new ethers.providers.Web3Provider(publicClient.transport);
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        console.log(`Retry attempt ${retryCount + 1} of ${MAX_RETRIES}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        return attempt(retryCount + 1);
      }
      console.error('Provider/Signer error:', error);
      throw new Error(
        'Connessione al wallet non riuscita. ' +
        'Verifica la tua connessione internet e riprova. ' +
        'Se il problema persiste, riavvia il tuo wallet.'
      );
    }
  };
  
  return attempt();
}

// Function to get contract instance with enhanced error handling and mobile optimizations
export async function getContract(contractName, needSigner = false) {
  const address = CONTRACT_ADDRESSES[contractName];
  const abi = CONTRACT_ABIS[contractName];

  if (!address || !abi) {
    throw new Error(`Contract ${contractName} not configured`);
  }

  const MAX_RETRIES = 3;
  const TIMEOUT = 15000; // 15 seconds timeout for mobile

  const attempt = async (retryCount = 0) => {
    try {
      const signerOrProvider = await getSignerOrProvider(needSigner);
      const contract = new ethers.Contract(address, abi, signerOrProvider);
      
      // Verify contract connection with timeout
      await Promise.race([
        contract.deployed(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Contract connection timeout')), TIMEOUT)
        )
      ]);
      
      return contract;
    } catch (error) {
      if (retryCount < MAX_RETRIES && 
          (error.message.includes('timeout') || error.message.includes('network') || error.code === 'NETWORK_ERROR')) {
        console.log(`Retry attempt ${retryCount + 1} of ${MAX_RETRIES} for ${contractName}`);
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
        return attempt(retryCount + 1);
      }
      throw new Error(
        `Errore di connessione al contratto ${contractName}. ` +
        'Verifica la tua connessione e riprova. ' +
        `Dettagli: ${formatContractError(error)}`
      );
    }
  };

  return attempt();
}

// Function to get contract with signer
export async function getContractWithSigner(contractName) {
  return getContract(contractName, true);
}

// Function to get contract address
export function getContractAddress(contractName) {
  return CONTRACT_ADDRESSES[contractName];
}

// Function to check if all required contracts are configured
export function areContractsConfigured() {
  return Object.values(CONTRACT_ADDRESSES).every(address => 
    address && ethers.utils.isAddress(address)
  );
}

// Function to validate contract addresses
export function validateContractAddresses() {
  const invalidContracts = [];
  
  Object.entries(CONTRACT_ADDRESSES).forEach(([name, address]) => {
    if (!address || !ethers.utils.isAddress(address)) {
      invalidContracts.push(name);
    }
  });
  
  if (invalidContracts.length > 0) {
    console.warn('Invalid contract addresses:', invalidContracts);
    return false;
  }
  
  return true;
}

// Enhanced error formatting function
export function formatContractError(error) {
  // Handle MetaMask RPC errors
  if (error.code === -32603) {
    if (error.data?.message) return error.data.message;
    return 'MetaMask RPC error. Please check your network connection and try again.';
  }

  // Handle user rejected errors
  if (error.code === 4001) {
    return 'Transaction rejected by user';
  }

  // Handle chain/network errors
  if (error.code === -32002) {
    return 'Please unlock MetaMask and try again';
  }

  if (error.reason) return error.reason;
  if (error.message) {
    // Clean up common MetaMask error messages
    if (error.message.includes('execution reverted')) {
      const revertMessage = error.message.match(/execution reverted:(.+)/);
      if (revertMessage) return revertMessage[1].trim();
    }
    return error.message;
  }
  
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

// Helper function to get contract events with enhanced mobile retry logic
export async function getContractEvents(contractName, eventName, filter = {}, fromBlock = 0, retries = 3) {
  const TIMEOUT = 20000; // 20 seconds timeout for event queries
  
  for (let i = 0; i < retries; i++) {
    try {
      const contract = await getContract(contractName);
      return await Promise.race([
        contract.queryFilter(
          contract.filters[eventName](...Object.values(filter)),
          fromBlock
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Event query timeout')), TIMEOUT)
        )
      ]);
    } catch (error) {
      if (i === retries - 1) {
        throw new Error(
          'Impossibile recuperare gli eventi del contratto. ' +
          'La connessione potrebbe essere instabile. ' +
          `Dettagli: ${formatContractError(error)}`
        );
      }
      // Exponential backoff for retries
      await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, i)));
    }
  }
}

// Helper function to estimate gas for contract transactions with retry
export async function estimateGas(contractName, methodName, args = [], value = 0, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const contract = await getContractWithSigner(contractName);
      const gasEstimate = await contract.estimateGas[methodName](...args, {
        value: ethers.utils.parseEther(value.toString())
      });
      // Add 20% buffer for safety
      return gasEstimate.mul(120).div(100);
    } catch (error) {
      if (i === retries - 1) {
        throw new Error(`Gas estimation failed: ${formatContractError(error)}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Export contract configuration for easy access
export const ContractConfig = {
  addresses: CONTRACT_ADDRESSES,
  abis: CONTRACT_ABIS
};

// Export specific contract addresses for direct access
export const TOKEN_ADDRESS = CONTRACT_ADDRESSES.Token;
export const PRESALE_ADDRESS = CONTRACT_ADDRESSES.Presale;
export const STAKING_ADDRESS = CONTRACT_ADDRESSES.Staking;
export const AIRDROP_ADDRESS = CONTRACT_ADDRESSES.Airdrop;

// These functions are now handled by Wagmi hooks in the components
export function setupWalletListeners() {
  // Not needed anymore as Wagmi handles this internally
  console.log('Wallet listeners are handled by Wagmi hooks');
}

export async function ensureCorrectNetwork() {
  // Network switching is handled by Wagmi's chain configuration
  console.log('Network switching is handled by Wagmi configuration');
  return true;
}
