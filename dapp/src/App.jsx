import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Staking from './pages/Staking';
import Airdrop from './pages/Airdrop';
import Presale from './pages/Presale';
import Info from './pages/Info';
import Dao from './pages/Dao';
import Swap from './pages/Swap';
import { validateContractAddresses, getContractWithSigner } from './utils/contracts';
import { useEffect, useState } from 'react';
import { WalletProvider } from './components/WalletConnect';
import Navigation from './components/Navigation';
import { MaintenanceProvider } from './contexts/MaintenanceContext';
import { useAccount, useContractRead } from 'wagmi';

function FooterLinks() {
  const { address } = useAccount();
  const { data: owner } = useContractRead({
    address: import.meta.env.VITE_TOKEN_ADDRESS,
    abi: [{
      name: 'owner',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ type: 'address' }]
    }],
    functionName: 'owner',
    watch: true
  });

  const isOwner = address && owner && owner.toLowerCase() === address.toLowerCase();

  return (
    <div className="flex space-x-6">
      <Link to="/" className="text-gray-400 hover:text-blue-400 transition-colors duration-300">Home</Link>
      <Link to="/staking" className="text-gray-400 hover:text-blue-400 transition-colors duration-300">Staking</Link>
      <Link to="/airdrop" className="text-gray-400 hover:text-blue-400 transition-colors duration-300">Airdrop</Link>
      <Link to="/presale" className="text-gray-400 hover:text-blue-400 transition-colors duration-300">Presale</Link>
      <Link to="/dao" className="text-gray-400 hover:text-blue-400 transition-colors duration-300">Dao</Link>
      <Link to="/swap" className="text-gray-400 hover:text-blue-400 transition-colors duration-300">Swap</Link>
      <Link to="/info" className="text-gray-400 hover:text-blue-400 transition-colors duration-300">Info</Link>
    </div>
  );
}

function App() {
  const [contractsValid, setContractsValid] = useState(true);
  
  useEffect(() => {
    setContractsValid(validateContractAddresses());
  }, []);

  return (
    <WalletProvider>
      <MaintenanceProvider>
        <Router>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-gray-800">
          <Navigation />

          {/* Contract Configuration Warning */}
          {!contractsValid && (
            <div className="mt-20 mx-4 bg-yellow-900/50 border border-yellow-700 rounded-lg p-4 text-yellow-200">
              <p className="font-bold">Warning</p>
              <p>Some contract addresses are not properly configured. Please check your environment variables.</p>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-grow pt-0">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/staking" element={<Staking />} />
              <Route path="/airdrop" element={<Airdrop />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/presale" element={<Presale />} />
              <Route path="/info" element={<Info />} />
              <Route path="/dao" element={<Dao />} />
              <Route path="/swap" element={<Swap />} />
            </Routes>
          </div>

          {/* Footer */}
          <footer className="bg-gray-800/80 backdrop-blur-md border-t border-gray-700 mt-auto">
            <div className="max-w-6xl mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-bold text-xl">
                  SOP Token
                </div>
                <FooterLinks />
                <div className="text-gray-400 text-sm">
                  © 2024 SOP Token
                </div>
              </div>
            </div>
          </footer>
        </div>
        </Router>
      </MaintenanceProvider>
    </WalletProvider>
  );
}

export default App;
