import React from 'react';
import { motion } from 'framer-motion';

const Info = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white py-6 sm:py-12">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-16"
        >
          <h1 className="text-3xl sm:text-5xl font-bold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Discover the Future of DeFi
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 px-2">
            An innovative platform combining Presale, Staking, and Airdrop in a unique ecosystem
          </p>
        </motion.div>

        {/* Tokenomics Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10 sm:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-blue-400">Tokenomics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
            {[
              { title: "Presale", percentage: "35%", color: "blue" },
              { title: "Liquidity", percentage: "30%", color: "green" },
              { title: "Staking", percentage: "20%", color: "purple" },
              { title: "Airdrop", percentage: "5%", color: "yellow" },
              { title: "Team", percentage: "5%", color: "red" }
      
            ].map((item, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-4 sm:p-6 text-center transform hover:scale-105 transition-transform duration-300">
                <div className={`text-${item.color}-400 text-3xl sm:text-4xl font-bold mb-2`}>
                  {item.percentage}
                </div>
                <div className="text-gray-300 text-sm sm:text-base">{item.title}</div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Presale Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-10 sm:mb-20 bg-gray-800 rounded-2xl p-4 sm:p-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-blue-400">Innovative Presale</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-purple-400">How It Works?</h3>
              <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Advantageous initial price that gradually increases</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Anti-whale system for fair distribution</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Liquidity automatically locked at the end of presale</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-700 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-yellow-400">Benefits</h3>
              <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">★</span>
                  <span>Early access at advantageous prices</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">★</span>
                  <span>Protection against price manipulation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">★</span>
                  <span>Guaranteed liquidity for future trading</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Staking Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-10 sm:mb-20 bg-gray-800 rounded-2xl p-4 sm:p-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-purple-400">Dynamic Staking</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-blue-400">Unique Features</h3>
              <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Dynamic APR up to 150% based on liquidity</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Immediate and transparent rewards</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Minimum staking period for stability</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-700 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-green-400">Benefits</h3>
              <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">★</span>
                  <span>Guaranteed passive income</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">★</span>
                  <span>Higher APR for early adopters</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">★</span>
                  <span>Long-term holding incentives</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Airdrop Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-10 sm:mb-20 bg-gray-800 rounded-2xl p-4 sm:p-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-yellow-400">Referral Airdrop System</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-blue-400">How to Participate</h3>
              <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">1.</span>
                  <span>Connect your wallet and generate your unique referral code</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">2.</span>
                  <span>Invite friends using your code</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">3.</span>
                  <span>Earn tokens for each completed referral</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-700 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-purple-400">Rewards</h3>
              <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">★</span>
                  <span>Free tokens for you and your referrals</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">★</span>
                  <span>Extra bonus for active stakers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">★</span>
                  <span>Two-tier reward system</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Security Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mb-10 sm:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-red-400">Security and Transparency</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-blue-400">Verified Smart Contracts</h3>
              <p className="text-gray-300 text-sm sm:text-base">
                All our smart contracts are verified and publicly accessible on the blockchain
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-green-400">Locked Liquidity</h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Liquidity is automatically locked at the end of presale to ensure stability
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-purple-400">Security Audit</h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Contracts undergo thorough audits to ensure maximum security
              </p>
            </div>
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Don't Miss This Opportunity!</h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8">
              Join the presale now to access the best prices and start earning with staking immediately
            </p>
            <button className="bg-white text-blue-600 px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-bold text-base sm:text-lg transform hover:scale-105 transition-transform duration-300">
              Join Now
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Info;
