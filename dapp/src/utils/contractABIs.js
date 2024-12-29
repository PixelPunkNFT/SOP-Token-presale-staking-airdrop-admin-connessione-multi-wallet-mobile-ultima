export const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function getLockedTokens(address account) view returns (uint256)",
  "function setPresaleContract(address _presale)",
  "function setStakingContract(address _staking)",
  "function setLiquidityVaultContract(address _liquidityVault)",
  "function setAirdropContract(address _airdrop)",
  "function burn(uint256 amount)",
  "function owner() view returns (address)",
  "function setMaxWalletPercentage(uint256 _percentage)",
  "function setStakingTax(uint256 _newTax)",
  "function setAirdropTax(uint256 _newTax)",
  "function setDefaultUnlockTimes(uint256 _partialUnlockTime, uint256 _fullUnlockTime)",
  "function getUserLockInfo(address account, uint256 index) view returns (uint256 amount, uint256 partialUnlockTime, uint256 lockEndTime)",
  "function getUserLocksCount(address account) view returns (uint256)",
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const PRESALE_ABI = [
  "function owner() view returns (address)",
  "function participate() payable",
  "function getCurrentPrice() view returns (uint256)",
  "function getTokensForBNB(uint256 bnbAmount) view returns (uint256)",
  "function presaleFinalized() view returns (bool)",
  "function presaleStartTime() view returns (uint256)",
  "function PRICE_INCREASE_INTERVAL() view returns (uint256)",
  "function PRICE_INCREASE_PERCENTAGE() view returns (uint256)",
  "function finalize()",
  "function setInitialPrice(uint256 _newPrice)",
  "function toggleEmergencyStop()",
  "function maxContribution() view returns (uint256)",
  "function setMaxContribution(uint256 _newMax)",
  "function withdrawAccumulatedEth(uint256 _amount)",
  "function claimRefund()",
  // State Variables
  "function totalRaised() view returns (uint256)",
  "function contributions(address) view returns (uint256)",
  "function emergencyStop() view returns (bool)",
  // Events
  "event EmergencyToggled(bool stopped)",
  "event MaxContributionUpdated(uint256 newMax)",
  "event EthWithdrawn(uint256 amount)",
  "event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount)",
  "event PresaleFinalized(uint256 ethAmount, uint256 tokenAmount)",
  "event RemainingTokensStaked(uint256 amount)"
];

export const STAKING_ABI = [
  "function stake(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function claimRewards()",
  "function maxStakingCap() view returns (uint256)",
  "function stakingPaused() view returns (bool)",
  "function setMaxStakingCap(uint256 _newCap)",
  "function pauseStaking()",
  "function getStakeInfo(address) view returns (uint256 amount, uint256 startTime, uint256 pendingRewards)",
  "function minimumStakingPeriod() view returns (uint256)",
  "function stakes(address) view returns (uint256 amount, uint256 startTime, uint256 lastClaimTime, uint256 unclaimableRewards)",
  "function calculateRewards(address) view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function getCurrentAPR() view returns (uint256)",
  "function updateMinimumStakingPeriod(uint256 _newPeriod)",
  "function owner() view returns (address)",
  "function burn(uint256 amount)",
  // Events
  "event Staked(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 reward)",
  // Referral functions
  "function setReferrer(address referrer)",
  "function getReferralInfo(address) view returns (address referrer, uint256 referredCount, bool isCompleted)",
  "function getReferredUsers(address) view returns (address[])",
  "function referrers(address) view returns (address)",
  "function completedReferrals(address) view returns (bool)",
  // Referral events
  "event ReferralPending(address indexed referrer, address indexed referred)",
  "event ReferralCompleted(address indexed referrer, address indexed referred)",
  "event ReferralRewardPaid(address indexed referrer, uint256 amount)"
];

export const AIRDROP_ABI = [
  "function generateReferralCode()",
  "function registerReferral(bytes32 referralCode)",
  "function claimReferralReward(address referee)",
  "function getReferralCode(address user) view returns (bytes32)",
  "function getMyReferralCode() view returns (bytes32)",
  "function getMyReferralCount() view returns (uint256)",
  "function hasParticipated(address) view returns (bool)",
  "function referralCount(address) view returns (uint256)",
  "function pendingReferrals(address,address) view returns (bool)",
  "function codeToReferrer(bytes32) view returns (address)",
  "function addTokens(uint256 amount)",
  "function updateReferrerReward(uint256 _newAmount)",
  "function updateRefereeReward(uint256 _newAmount)",
  "function updateRequiredStakeAmount(uint256 _newAmount)",
  "function emergencyWithdraw()",
  "function owner() view returns (address)",
  "function burn(uint256 amount)",
  "event ReferralCodeGenerated(address indexed user, bytes32 code)",
  "event ReferralRewardClaimed(address indexed referrer, address indexed referee)"
];
