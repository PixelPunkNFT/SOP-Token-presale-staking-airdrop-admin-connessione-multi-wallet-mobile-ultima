import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { WagmiConfig } from 'wagmi'
import { mainnet, sepolia, polygon, arbitrum, optimism, avalanche, bsc, base } from 'wagmi/chains'
import { useAccount, useDisconnect, useNetwork } from 'wagmi'
import { useEffect, useState } from 'react'

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID

const metadata = {
  name: 'SOP Token',
  description: 'SOP Token Staking Platform',
  url: 'https://sop-token.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Configurazione della chain Polygon con RPC multipli per fallback
const polygonChain = {
  ...polygon,
  rpcUrls: {
    ...polygon.rpcUrls,
    default: {
      ...polygon.rpcUrls.default,
      http: [
        'https://polygon-rpc.com',
        'https://rpc-mainnet.matic.network',
        'https://matic-mainnet.chainstacklabs.com',
        'https://rpc-mainnet.maticvigil.com',
        'https://rpc-mainnet.matic.quiknode.pro',
        'https://matic-mainnet-full-rpc.bwarelabs.com'
      ]
    }
  }
}

const chains = [polygonChain]

const wagmiConfig = defaultWagmiConfig({ 
  chains, 
  projectId, 
  metadata,
  rpc: {
    retryCount: 5,
    retryDelay: 3000,
    timeout: 15000,
    batchInterval: 500,
    batchMax: 5
  },
  transports: {
    [polygon.id]: ['https://polygon-rpc.com', 'https://rpc-mainnet.matic.network']
  },
  enableCaching: true,
  cacheTime: 10000,
  disableProviderPing: false,
  stallTimeout: 10000
})

// Configurazione Web3Modal ottimizzata per connessioni locali
createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  defaultChain: polygon,
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0' // Trust Wallet
  ],
  termsOfServiceUrl: '',
  privacyPolicyUrl: '',
  excludeWalletIds: [
    'ledger', 'taho', 'zerion', 'dawn', 'talisman'
  ],
  themeMode: 'dark',
  themeVariables: {
    '--w3m-z-index': '9999',
    '--w3m-overlay-backdrop-filter': 'blur(6px)',
    '--w3m-accent-color': '#6366f1',
    '--w3m-background-color': 'rgba(0,0,0,0.8)'
  },
  
  desktopWallets: [
    'metamask',
    'walletconnect',
    'coinbase'
  ],
  onError: (error) => {
    console.error('WalletConnect Error:', error);
    const errorToast = document.createElement('div');
    errorToast.textContent = `Errore di connessione: ${error.message}`;
    errorToast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #ff4d4d;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 9999;
    `;
    document.body.appendChild(errorToast);
    setTimeout(() => errorToast.remove(), 5000);
  }
})

function WalletState() {
  const { address, isConnected } = useAccount()
  const { chain } = useNetwork()
  const { disconnect } = useDisconnect()
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleConnection = async () => {
      try {
        if (isConnected) {
          console.log('Wallet connesso:', address)
          console.log('Chain:', chain?.name)
          setConnectionAttempts(0)
          setError(null)
          
          // Verifica che la chain sia Polygon
          if (chain?.id !== polygon.id) {
            console.error(`Chain errata. Attuale: ${chain?.id}, Richiesta: Polygon (${polygon.id})`)
            setError('Per favore, passa alla rete Polygon per continuare.')
            
            // Tentativo automatico di switch alla rete Polygon
            try {
              await window.ethereum?.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${polygon.id.toString(16)}` }],
              });
            } catch (switchError) {
              // Se la rete non esiste, prova ad aggiungerla
              if (switchError.code === 4902) {
                try {
                  await window.ethereum?.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                      {
                        chainId: `0x${polygon.id.toString(16)}`,
                        chainName: 'Polygon',
                        nativeCurrency: {
                          name: 'MATIC',
                          symbol: 'MATIC',
                          decimals: 18
                        },
                        rpcUrls: polygonChain.rpcUrls.default.http,
                        blockExplorerUrls: ['https://polygonscan.com/']
                      },
                    ],
                  });
                } catch (addError) {
                  console.error('Errore nell\'aggiunta della rete:', addError);
                  setError('Impossibile aggiungere la rete Polygon. Aggiungila manualmente al tuo wallet.');
                }
              }
            }
            return;
          }
        } else {
          console.log('Wallet disconnesso')
          
          if (connectionAttempts < 5) { // Aumentato il numero di tentativi
            const timeout = Math.min(Math.pow(1.5, connectionAttempts) * 1000, 10000) // Exponential backoff con max 10s
            const timer = setTimeout(() => {
              setConnectionAttempts(prev => prev + 1)
            }, timeout)
            
            return () => clearTimeout(timer)
          } else {
            setError('Impossibile connettersi al wallet. Verifica la tua connessione e riprova.')
          }
        }
      } catch (err) {
        console.error('Errore di connessione:', err)
        let errorMessage = 'Si è verificato un errore durante la connessione.'
        
        // Gestione errori specifici
        if (err.code === 4001) {
          errorMessage = 'Connessione rifiutata. Per favore approva la connessione nel tuo wallet.'
        } else if (err.code === -32002) {
          errorMessage = 'Richiesta di connessione già in corso. Controlla il tuo wallet.'
        } else if (err.code === 4902) {
          errorMessage = 'Rete non configurata. Aggiungi la rete al tuo wallet.'
        }
        
        setError(errorMessage)
      }
    }

    handleConnection()
  }, [isConnected, address, chain, connectionAttempts])

  // Pulizia degli stati quando il componente viene smontato
  useEffect(() => {
    return () => {
      setConnectionAttempts(0)
      setError(null)
    }
  }, [])

  return null
}

export function WalletProvider({ children }) {
  const [retryCount, setRetryCount] = useState(0);
  const [isConfigReady, setIsConfigReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const maxRetries = 3;
  const retryDelay = 2000;

  useEffect(() => {
    let mounted = true;

    const initializeConfig = async () => {
      try {
        // Verifica della configurazione
        if (!wagmiConfig) {
          throw new Error('Configurazione wagmi non trovata');
        }

        // Verifica del projectId
        if (!projectId) {
          throw new Error('ProjectId non trovato. Verifica che VITE_WALLET_CONNECT_PROJECT_ID sia impostato nelle variabili d\'ambiente');
        }

        // Verifica delle chains
        if (!chains || chains.length === 0) {
          throw new Error('Nessuna chain configurata');
        }

        // Verifica della chain Polygon
        const hasPolygon = chains.some(chain => chain.id === polygon.id);
        if (!hasPolygon) {
          throw new Error('Chain Polygon non configurata correttamente');
        }

        // Verifica della configurazione RPC
        const polygonConfig = chains.find(chain => chain.id === polygon.id);
        if (!polygonConfig?.rpcUrls?.default?.http?.length) {
          throw new Error('RPC URLs per Polygon non configurati correttamente');
        }

        if (mounted) {
          setIsConfigReady(true);
          setInitError(null);
        }
      } catch (error) {
        console.error('Errore durante l\'inizializzazione della configurazione wagmi:', error);
        if (mounted) {
          setInitError(error.message);
          setIsConfigReady(false);
        }
      }
    };

    initializeConfig();

    return () => {
      mounted = false;
    };
  }, []);

  if (initError) {
    return (
      <div className="text-red-500 p-4 bg-red-100 rounded">
        Errore di inizializzazione: {initError}
        <button 
          onClick={() => window.location.reload()}
          className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (!isConfigReady) {
    return (
      <div className="text-blue-500 p-4 bg-blue-100 rounded flex items-center justify-center">
        <div className="animate-spin mr-2 h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        Inizializzazione del wallet in corso...
      </div>
    );
  }

  return (
    <WagmiConfig config={wagmiConfig}>
      <WalletStateProvider 
        retryCount={retryCount} 
        setRetryCount={setRetryCount} 
        maxRetries={maxRetries} 
        retryDelay={retryDelay}
      >
        {children}
      </WalletStateProvider>
    </WagmiConfig>
  );
}

function WalletStateProvider({ retryCount, setRetryCount, maxRetries, retryDelay, children }) {
  const { isConnected } = useAccount();
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    let timeoutId;
    let errorTimeoutId;
    
    const handleRetry = async () => {
      if (!isConnected && retryCount < maxRetries) {
        timeoutId = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          if (window.ethereum) {
            window.ethereum.request({ method: 'eth_requestAccounts' })
              .catch(error => {
                console.error('Errore di connessione:', error);
                if (error.code !== 4001) { // Ignora l'errore se l'utente ha rifiutato la connessione
                  let errorMessage = 'Errore di connessione al wallet';
                  
                  if (error.code === -32002) {
                    errorMessage = 'Richiesta di connessione già in corso. Controlla il tuo wallet.';
                  } else if (error.code === 4902) {
                    errorMessage = 'Rete non configurata. Aggiungi la rete Polygon al tuo wallet.';
                  }
                  
                  setConnectionError(errorMessage);
                  errorTimeoutId = setTimeout(() => setConnectionError(null), 5000);
                }
              });
          } else {
            setConnectionError('MetaMask non trovato. Installa MetaMask per continuare.');
            errorTimeoutId = setTimeout(() => setConnectionError(null), 5000);
          }
        }, retryDelay * Math.pow(2, retryCount)); // Backoff esponenziale
      } else if (retryCount >= maxRetries) {
        setConnectionError('Numero massimo di tentativi raggiunto. Ricarica la pagina per riprovare.');
        errorTimeoutId = setTimeout(() => setConnectionError(null), 5000);
      }
    };

    handleRetry();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (errorTimeoutId) clearTimeout(errorTimeoutId);
      setConnectionError(null);
    };
  }, [isConnected, retryCount, maxRetries, retryDelay, setRetryCount]);

  // Reset del contatore dei tentativi quando la connessione ha successo
  useEffect(() => {
    if (isConnected) {
      setRetryCount(0);
      setConnectionError(null);
    }
  }, [isConnected, setRetryCount]);

  return (
    <>
      {connectionError && (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg z-50">
          <div className="flex items-center">
            <div className="py-1">
              <svg className="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>{connectionError}</div>
          </div>
        </div>
      )}
      <WalletState />
      {children}
    </>
  );
}

export function ConnectButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected } = useAccount();
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(false);
  }, [isConnected]);

  useEffect(() => {
    const handleError = (err) => {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    };

    window.ethereum?.on('error', handleError);
    return () => {
      window.ethereum?.removeListener('error', handleError);
    };
  }, []);

  return (
    <div className="w-auto relative">
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 51,
        }}>
          <div className="loading-spinner"></div>
        </div>
      )}
      {error && (
        <div className="error-message absolute top-full left-0 right-0 mt-2">
          {error}
        </div>
      )}
      <style>
        {`
          w3m-button {
            display: block !important;
            margin: 0 !important;
            transition: all 0.3s ease;
            transform-origin: right;
          }
          @media (max-width: 768px) {
            w3m-button {
              width: 100% !important;
              height: 40px !important;
              font-size: 14px !important;
              border-radius: 8px !important;
              transform-origin: center;
            }
          }
          .loading-spinner {
            width: 24px;
            height: 24px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .error-message {
            color: #ff4d4d;
            text-align: center;
            margin-top: 8px;
            font-size: 14px;
            background: rgba(255, 77, 77, 0.1);
            padding: 8px;
            border-radius: 4px;
            backdrop-filter: blur(4px);
          }
          @media (max-width: 768px) {
            .error-message {
              font-size: 12px;
              margin: 6px 12px;
            }
          }
        `}
      </style>
      <w3m-button />
    </div>
  );
}
