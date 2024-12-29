import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton } from './WalletConnect';
import { useAccount, useContractRead } from 'wagmi';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-800/80 backdrop-blur-md border-b border-gray-700">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            SOP
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex space-x-6 items-center">
              <Link to="/" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 px-3 py-2">Home</Link>
              <Link to="/presale" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 px-3 py-2">Presale</Link>
              <Link to="/staking" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 px-3 py-2">Staking</Link>
              <Link to="/airdrop" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 px-3 py-2">Airdrop</Link>
              <Link to="/dao" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 px-3 py-2">Dao</Link>
              <Link to="/info" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 px-3 py-2">Info</Link>
              {isOwner && (
                <Link to="/admin" className="text-gray-300 hover:text-blue-400 transition-colors duration-300 px-3 py-2">Admin</Link>
              )}
            </div>
            <ConnectButton />
          </div>

          {/* Mobile Connect Button and Menu */}
          <div className="md:hidden flex items-center">
            <ConnectButton />
            {/* Mobile Menu Button */}
            <button 
              className="flex flex-col justify-center items-center w-8 h-8 space-y-1.5 ml-4"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`w-6 h-0.5 bg-white transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-6 h-0.5 bg-white transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-6 h-0.5 bg-white transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} pt-2 pb-4`}>
          <div className="flex flex-col space-y-2">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-blue-400 transition-colors duration-300 px-3 py-2">Home</Link>
            <Link to="/presale" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-blue-400 transition-colors duration-300 px-3 py-2">Presale</Link>
            <Link to="/staking" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-blue-400 transition-colors duration-300 px-3 py-2">Staking</Link>
            <Link to="/airdrop" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-blue-400 transition-colors duration-300 px-3 py-2">Airdrop</Link>
            <Link to="/dao" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-blue-400 transition-colors duration-300 px-3 py-2">Dao</Link>
            <Link to="/info" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-blue-400 transition-colors duration-300 px-3 py-2">Info</Link>
            {isOwner && (
              <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-gray-300 hover:text-blue-400 transition-colors duration-300 px-3 py-2">Admin</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
