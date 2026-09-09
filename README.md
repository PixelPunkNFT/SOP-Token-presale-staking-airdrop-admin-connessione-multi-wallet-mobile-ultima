SOP DeFi Platform
Overview

SOP is a comprehensive DeFi platform offering various features for managing and using the SOP token on the Binance Smart Chain. It is a fully decentralized application that does not use traditional databases: all data is stored exclusively on the blockchain, ensuring maximum security and resilience against any type of system failure.

Compatibility and Accessibility
Multi-platform support:
Web browsers (Chrome, Firefox, Safari, Edge)
iOS (iPhone, iPad)
Android (smartphones and tablets)
Multi-wallet integration:
MetaMask
Trust Wallet
WalletConnect
Coinbase Wallet
Binance Wallet
Ledger
Trezor
Rainbow
Argent
Responsive and adaptive interface for all devices
No installation required for the web version
Main Components
1. SOP Token (Token.sol)
Standard ERC20 token with advanced features
Total supply: 1 billion tokens
Token locking system:
Partial 30% unlock at the predefined date
Full unlock of the remaining 70% at the final date
Taxation system:
2% tax on every transaction allocated to staking
2% tax on every transaction allocated to the airdrop
Owner-configurable taxes (max 10%)
Exemptions for special contracts and the owner
maxWalletPercentage control:
Configurable limit for the maximum amount of tokens per wallet
Protection against excessive token accumulation
Burn function:
Ability to burn tokens
Permanent reduction of the total supply
View functions for the frontend:
getLockedTokens: displays locked tokens
getUserLockInfo: specific lock details
getUserLocksCount: number of locks per user
Permission management through an ownership system
2. Presale System (Presale.sol)
Initial price calculated to provide 24,151 tokens per 1 BNB
Price increase mechanism:
1% increase every 12 hours
Incentivizes early participation
Price configurable by the owner
Security system:
EmergencyStop for emergency pauses
Refund system after 120 days
Maximum contribution limit per wallet
Automated liquidity management:
30% of the tokens allocated to PancakeSwap
Automatic liquidity addition at the end of the presale
Dedicated vault for secure management of liquidity tokens
Management of remaining tokens:
Automatic staking of unsold tokens
Direct integration with the staking contract
View functions for the frontend:
getCurrentPrice: current token price
getTokensForBNB: calculates the number of tokens obtainable
3. Staking System (Staking.sol)
Flexible staking of SOP tokens
Dynamic APR system:
Maximum APR: 150%
Minimum APR: 3%
Calculation based on contract liquidity
Minimum liquidity threshold: 5%
Maximum APR threshold: 200M tokens
Advanced features:
Configurable minimum staking period
Maximum staking cap (initially 5M tokens)
Emergency pause system
Total staked amount tracking
Reward management:
Automatic time-based reward calculation
Non-claimable reward system
Protection against reward calculation overflow
Main functions:
Stake: locks tokens
Withdraw: withdraws tokens (after the minimum staking period)
Claim: claims rewards
Burn: burns excess tokens
View functions:
getCurrentAPR: current APR
calculateRewards: calculates pending rewards
getStakeInfo: complete staking information
4. Airdrop System (Airdrop.sol)
Automatic token distribution to eligible users
Multi-level verification system:
NFT ownership verification
Minimum balance verification
Wallet age verification
Whitelist management for special distributions
Anti-bot and anti-spam protection
Tracking of completed distributions
Maximum token limit per address
5. LiquidityVault (LiquidityVault.sol)
Secure vault for managing tokens allocated to liquidity
One-time approval for the presale contract
Protection against unauthorized modifications
Secure management of liquidity additions to PancakeSwap
6. Tokenomics

Total token distribution:

35% Presale
30% Liquidity
20% Staking
5% Airdrop
10% Team/Staff
Frontend (dapp/)
Pages

Home

General dashboard
Key statistics
Quick access to platform features

Admin

Administrative panel
Contract parameter management
Owner-only functions
Protected access restricted to the contract owner
Automatic verification of the owner address
Automatic hiding of the Admin link from unauthorized users
Security checks implemented in both the navigation menu and footer

Staking

Staking interface
Reward display
Stake/unstake management

Airdrop

Token distribution system
Automatic requirement verification
Distribution tracking
Whitelist management
Real-time statistics
NFT integration
Technologies Used
Smart Contracts
Language: Solidity 0.8.19
Framework: Hardhat
Libraries: OpenZeppelin
Security:
ReentrancyGuard
Ownable
Pause mechanisms
Frontend
Framework: React
Build tool: Vite
Web3: ethers.js, wagmi
UI: Tailwind CSS
Progressive Web App (PWA) for installation on mobile devices
Universal wallet connection system
Automatic multi-chain connection management
Deep linking and wallet linking support
Decentralized caching of blockchain data
Blockchain
Network: Binance Smart Chain
Environment: Testnet/Mainnet
DEX: PancakeSwap V2
Decentralized storage:
All data stored on-chain
No centralized database
Maximum transparency and verifiability
Resilience against failures and censorship
Setup and Installation
Clone the repository
git clone [repository-url]

Install dependencies
# Root directory (contracts)
npm install

# Frontend
cd dapp
npm install

Configure the .env file
# Copy the example file
cp .env.example .env
# Modify the required variables

Compile the contracts
npx hardhat compile

Deploy the contracts
npx hardhat run scripts/deploy.ts --network bscTestnet

Start the frontend
cd dapp
npm run dev

Testing
# Contract tests
npx hardhat test

# Coverage report
npx hardhat coverage

Security
Contracts verified on BSCScan
Security audit completed
OpenZeppelin best practices implemented
Granular permission system
Advanced access controls for administrative features
Real-time contract owner verification
Administrative route protection
Secure navigation system with dynamic access controls
Secure wallet connection management:
Signature verification
Phishing protection
Secure private key management
Hardware wallet support
Fully decentralized architecture:
No single point of failure
Data always accessible through the blockchain
Protection against DDoS attacks
System resilience guaranteed by the network
Changelog
Christmas 2024

During Christmas Eve, the team implemented important security updates:

Implementation of the owner verification system for admin access
Added security checks to the navigation menu
Improved protection of administrative routes
Implementation of dynamic visibility controls in the footer
Optimization of the address verification system
Integration of real-time access controls for admin features
