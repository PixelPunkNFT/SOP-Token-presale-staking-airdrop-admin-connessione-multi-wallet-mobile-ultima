import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrendingUp, FiGift, FiUsers, FiDollarSign, FiShield } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { PRESALE_ABI, TOKEN_ABI, STAKING_ABI } from '../utils/contractABIs';

// Contract addresses from environment variables
const PRESALE_ADDRESS = import.meta.env.VITE_PRESALE_ADDRESS;
const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;
const STAKING_ADDRESS = import.meta.env.VITE_STAKING_ADDRESS;

export default function Home() {
  const [currentPrice, setCurrentPrice] = useState(null);
  const [holders, setHolders] = useState(null);
  const [apy, setApy] = useState(null);

  // Default values
  const defaultValues = {
    currentPrice: "24151 SOP",
    holders: "7",
    apy: "77%"
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let provider;
        
        // Check if window.ethereum is available (MetaMask or other web3 wallet)
        if (window.ethereum) {
          provider = new ethers.providers.Web3Provider(window.ethereum);
        } else {
          // Fallback to a default provider if no web3 wallet is available
          provider = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_RPC_URL);
        }
        
        // Get tokens for 1 BNB and price increase timing
        const presaleContract = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, provider);
        const [tokensForOneBNB, startTime] = await Promise.all([
          presaleContract.getCurrentPrice(),
          presaleContract.presaleStartTime()
        ]);

        // Calculate time to next price increase
        const currentTime = Math.floor(Date.now() / 1000);
        const elapsedTime = currentTime - startTime;
        const TWELVE_HOURS = 12 * 60 * 60; // 12 hours in seconds
        const nextIncrease = TWELVE_HOURS - (elapsedTime % TWELVE_HOURS);
        
        // Calculate tokens for 1 BNB
        const tokensPerBNB = ethers.constants.WeiPerEther.mul(ethers.constants.WeiPerEther).div(tokensForOneBNB);
        const formattedTokens = Number(ethers.utils.formatEther(tokensPerBNB)).toFixed(0);
        setCurrentPrice(`${formattedTokens} SOP`);

        // Get holders count from transfer events
        const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
        const filter = tokenContract.filters.Transfer();
        const events = await tokenContract.queryFilter(filter);
        const uniqueAddresses = new Set();
        events.forEach(event => {
          uniqueAddresses.add(event.args.from);
          uniqueAddresses.add(event.args.to);
        });
        setHolders(uniqueAddresses.size.toLocaleString());

        // Get current APY
        const stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider);
        const currentAPR = await stakingContract.getCurrentAPR();
        setApy(`${currentAPR.toString()}%`);

        // Schedule next update at exact 12-hour mark
        setTimeout(() => {
          fetchData();
        }, nextIncrease * 1000);

      } catch (error) {
        console.error("Error fetching data:", error);
        // In case of error, set default values
        setCurrentPrice("24151 SOP");
        setHolders("7");
        setApy("77%");
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds for safety
    
    return () => clearInterval(interval);
  }, []);

  const statsData = [
    { label: 'Tokens for 1 ETH', value: currentPrice || defaultValues.currentPrice, icon: <FiDollarSign /> },
    { label: 'Holders', value: holders || defaultValues.holders, icon: <FiUsers /> },
    { label: 'APY', value: apy || defaultValues.apy, icon: <FiTrendingUp /> }
  ];

  const features = [
    {
      title: 'Advanced Security',
      description: 'Verified smart contracts and completed security audits',
      icon: <FiShield className="w-6 h-6" />
    },
    {
      title: 'High Yields',
      description: 'Competitive APY with progressive staking bonuses',
      icon: <FiTrendingUp className="w-6 h-6" />
    },
    {
      title: 'Innovative Tokenomics',
      description: 'Automatic burning mechanism and rewards for holders',
      icon: <FiDollarSign className="w-6 h-6" />
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-start relative"
      >
        <motion.div 
          className="max-w-[1920px] w-full px-2 sm:px-4 mx-auto pt-16 sm:pt-24"
        >
        <motion.div 
          className="bg-gray-800/60 backdrop-blur-xl rounded-xl p-4 shadow-xl border border-gray-700/50 w-full mx-auto text-center relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 z-0"></div>
        <div className="relative z-10">
          
          <motion.div 
            className="relative mb-4 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Decorative elements */}
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "8rem", opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
            />
            <motion.div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-[1px] bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "4rem", opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.4 }}
            />
            
            {/* Animated background gradients */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5"
              animate={{
                x: ['0%', '100%', '0%'],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-l from-purple-500/5 via-blue-500/5 to-purple-500/5"
              animate={{
                x: ['0%', '-100%', '0%'],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
            
            {/* Tech decorative elements */}
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-32">
              <motion.div
                className="w-[1px] h-full bg-gradient-to-b from-transparent via-blue-400/20 to-transparent"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "100%", opacity: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
              />
            </div>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-32">
              <motion.div
                className="w-[1px] h-full bg-gradient-to-b from-transparent via-purple-400/20 to-transparent"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "100%", opacity: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
              />
            </div>
            {/* <div className="relative">
              <motion.span
                className="absolute -left-4 top-1/2 -translate-y-1/2 text-blue-400/30 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                &lt;/&gt;
              </motion.span>
              <motion.span
                className="absolute -right-4 top-1/2 -translate-y-1/2 text-purple-400/30 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                &lt;/&gt;
              </motion.span>
              <motion.h1
                className="text-3xl sm:text-6xl md:text-7xl font-light tracking-[0.1em] sm:tracking-[0.2em] mb-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                style={{
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(96,165,250,0.2)'
                }}
              >
                SMART OPERATIONS
              </motion.h1>
              <motion.h1
                className="text-4xl sm:text-7xl md:text-8xl font-semibold tracking-wide sm:tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(139,92,246,0.3)',
                  letterSpacing: '0.1em'
                }}
              >
                PLATFORM
              </motion.h1>
              <motion.div
                className="absolute -left-8 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-400/30"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.8, delay: 1 }}
              />
              <motion.div
                className="absolute -right-8 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-400/30"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.8, delay: 1 }}
              />
            </div> */}
            <motion.div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 0.5, width: '12rem' }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </motion.div>
          <motion.h1 
            className="text-3xl sm:text-6xl md:text-7xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", duration: 1 }}
          >
            SMART OPERATIONS PLATFORM
          </motion.h1>
          <motion.p 
            className="text-lg sm:text-2xl md:text-3xl text-gray-300 mb-4 max-w-3xl mx-auto px-2 sm:px-4"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Enter the future of decentralized finance with cutting-edge technology
          </motion.p>

          {/* Stats Section with enhanced styling */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-8 mb-6 sm:mb-16 px-2 sm:px-4"
          >
            {statsData.map((stat, index) => (
              <motion.div
                key={index}
                variants={item}
                className="bg-gray-700/40 backdrop-blur-lg p-3 sm:p-6 rounded-xl border border-gray-600/50 hover:border-blue-500/30 transition-all duration-300"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(55, 65, 81, 0.7)" }}
              >
                <div className="flex items-center justify-center mb-2 sm:mb-4 text-2xl sm:text-3xl text-blue-400">
                  {stat.icon}
                </div>
                <h4 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2 break-words">
                  {stat.value}
                </h4>
                <p className="text-sm sm:text-base text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Features Grid */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 max-w-6xl mx-auto mb-6 sm:mb-12 px-2 sm:px-4"
          >
            <Link to="/presale" className="group">
              <motion.div 
                className="bg-gray-700/40 backdrop-blur-lg p-3 sm:p-8 rounded-xl border border-gray-600/50 hover:border-blue-500/30 transition-all duration-300 h-full"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(55, 65, 81, 0.7)" }}
                variants={item}
              >
                <div className="text-3xl text-blue-400 mb-4">
                  <FiDollarSign className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-blue-300 mb-3">Presale</h3>
                <p className="text-gray-400">Early access to tokens with exclusive bonuses for first investors</p>
              </motion.div>
            </Link>
            
            <Link to="/staking" className="group">
              <motion.div 
                className="bg-gray-700/40 backdrop-blur-lg p-4 sm:p-8 rounded-xl border border-gray-600/50 hover:border-purple-500/30 transition-all duration-300 h-full"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(55, 65, 81, 0.7)" }}
                variants={item}
              >
                <div className="text-3xl text-purple-400 mb-4">
                  <FiTrendingUp className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-purple-300 mb-3">Staking</h3>
                <p className="text-gray-400">Earn passive rewards with competitive APY and loyalty bonuses</p>
              </motion.div>
            </Link>
            
            <Link to="/airdrop" className="group">
              <motion.div 
                className="bg-gray-700/40 backdrop-blur-lg p-4 sm:p-8 rounded-xl border border-gray-600/50 hover:border-green-500/30 transition-all duration-300 h-full"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(55, 65, 81, 0.7)" }}
                variants={item}
              >
                <div className="text-3xl text-green-400 mb-4">
                  <FiGift className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-green-300 mb-3">Airdrop</h3>
                <p className="text-gray-400">Participate in our airdrop campaigns and receive free tokens</p>
              </motion.div>
            </Link>
          </motion.div>

          {/* Additional Features */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8 mb-6 sm:mb-8 px-2 sm:px-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={item}
                className="bg-gray-700/30 backdrop-blur p-6 rounded-xl border border-gray-600"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(55, 65, 81, 0.5)" }}
              >
                <div className="text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Ecosystem Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 sm:mb-16 max-w-4xl mx-auto px-3 sm:px-6"
          >
            <h2 className="text-3xl font-bold text-blue-400 mb-6">Our Ecosystem</h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              SOP is born with the ambition to create a decentralized ecosystem where the community is the true driver of change. 
              Our goal is to develop innovative and accessible web3 applications, usable exclusively through the SOP token, 
              where every important decision is made together with our community.
            </p>
            <p className="text-gray-300 text-lg leading-relaxed mb-12">
              We believe that the future of blockchain technology must be built by everyone, for everyone. For this reason, 
              every aspect of our ecosystem, from governance to application development, will be guided by the active participation 
              of community members.
            </p>

            <h3 className="text-2xl font-semibold text-purple-400 mb-6">Our Roadmap</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <motion.div 
                className="bg-gray-700/30 backdrop-blur p-6 rounded-xl border border-blue-500/30"
                whileHover={{ scale: 1.02 }}
              >
                <h4 className="text-xl font-medium text-blue-300 mb-3">Phase 1</h4>
                <p className="text-gray-400">Creation and distribution of the SOP token, laying the foundations for a sustainable and inclusive ecosystem.</p>
              </motion.div>

              <motion.div 
                className="bg-gray-700/30 backdrop-blur p-6 rounded-xl border border-purple-500/30"
                whileHover={{ scale: 1.02 }}
              >
                <h4 className="text-xl font-medium text-purple-300 mb-3">Phase 2</h4>
                <p className="text-gray-400">Implementation of participatory governance, giving voice to the community in key decisions.</p>
              </motion.div>

              <motion.div 
                className="bg-gray-700/30 backdrop-blur p-6 rounded-xl border border-green-500/30"
                whileHover={{ scale: 1.02 }}
              >
                <h4 className="text-xl font-medium text-green-300 mb-3">Phase 3</h4>
                <p className="text-gray-400">Introducing GITSOP, a groundbreaking Web3 application connecting clients with developers.</p>
              </motion.div>

              <motion.div 
                className="bg-gray-700/30 backdrop-blur p-6 rounded-xl border border-yellow-500/30"
                whileHover={{ scale: 1.02 }}
              >
                <h4 className="text-xl font-medium text-yellow-300 mb-3">Phase 4</h4>
                <p className="text-gray-400">Ecosystem expansion through strategic partnerships and new innovative features.</p>
              </motion.div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-xl text-gray-300 mb-6">
                Join us on this journey towards the future of decentralized finance. 
                Together, we can build an ecosystem that redefines DeFi standards.
              </p>
              <motion.button
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300 text-sm sm:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Join the Community
              </motion.button>
            </div>
          </motion.div>

          
        </div>
      </motion.div>
      </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
