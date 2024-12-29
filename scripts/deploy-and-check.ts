import { ethers } from "hardhat";
import { formatEther } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy Token
  console.log("\nDeploying Token...");
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("Token deployed to:", tokenAddress);

  // Total supply calculation (1 billion tokens)
  const totalSupply = await token.totalSupply();
  console.log("Total Supply:", formatEther(totalSupply), "tokens");

  // Calculate token amounts based on percentages
  const presaleAmount = (totalSupply * 35n) / 100n;    // 35% = 350,000,000 tokens
  const liquidityAmount = (totalSupply * 30n) / 100n;  // 30% = 300,000,000 tokens
  const stakingAmount = (totalSupply * 20n) / 100n;    // 20% = 200,000,000 tokens
  const airdropAmount = (totalSupply * 5n) / 100n;     // 5% = 50,000,000 tokens
  const staffAmount = (totalSupply * 10n) / 100n;      // 10% = 100,000,000 tokens

  // Deploy Staking
  console.log("\nDeploying Staking...");
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(tokenAddress, "100", "86400");
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("Staking deployed to:", stakingAddress);

  // Deploy LiquidityVault
  console.log("\nDeploying LiquidityVault...");
  const LiquidityVault = await ethers.getContractFactory("LiquidityVault");
  const liquidityVault = await LiquidityVault.deploy(tokenAddress);
  await liquidityVault.waitForDeployment();
  const liquidityVaultAddress = await liquidityVault.getAddress();
  console.log("LiquidityVault deployed to:", liquidityVaultAddress);

  // Deploy Presale
  console.log("\nDeploying Presale...");
  const Presale = await ethers.getContractFactory("Presale");
  const presale = await Presale.deploy(
    tokenAddress,
    process.env.UNISWAP_ROUTER || "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
    stakingAddress,
    liquidityVaultAddress
  );
  await presale.waitForDeployment();
  const presaleAddress = await presale.getAddress();
  console.log("Presale deployed to:", presaleAddress);

  // Deploy Airdrop
  console.log("\nDeploying Airdrop...");
  const Airdrop = await ethers.getContractFactory("Airdrop");
  const airdrop = await Airdrop.deploy(tokenAddress);
  await airdrop.waitForDeployment();
  const airdropAddress = await airdrop.getAddress();
  console.log("Airdrop deployed to:", airdropAddress);

  // Transfer tokens according to percentages
  console.log("\nDistributing tokens...");
  
  // Transfer to Presale (35%)
  await token.transfer(presaleAddress, presaleAmount);
  console.log(`Transferred ${formatEther(presaleAmount)} tokens (35%) to Presale`);
  
  // Transfer tokens to LiquidityVault (30%)
  await token.transfer(liquidityVaultAddress, liquidityAmount);
  console.log(`Transferred ${formatEther(liquidityAmount)} tokens (30%) to LiquidityVault`);
  
  // Configure LiquidityVault
  await liquidityVault.setPresaleContract(presaleAddress);
  await liquidityVault.approvePresale();
  console.log("LiquidityVault configured and approved Presale");
  
  // Transfer to Staking (20%)
  await token.transfer(stakingAddress, stakingAmount);
  console.log(`Transferred ${formatEther(stakingAmount)} tokens (20%) to Staking`);
  
  // Transfer to Airdrop (5%)
  await token.transfer(airdropAddress, airdropAmount);
  console.log(`Transferred ${formatEther(airdropAmount)} tokens (5%) to Airdrop`);
  
  // Transfer to Staff wallet (10%)
  const staffWallet = process.env.STAFF_WALLET || deployer.address;
  await token.transfer(staffWallet, staffAmount);
  console.log(`Transferred ${formatEther(staffAmount)} tokens (10%) to Staff wallet`);

  // Set contract addresses
  await token.setPresaleContract(presaleAddress);
  await token.setStakingContract(stakingAddress);

  // Check final balances
  console.log("\nChecking final balances:");
  const presaleBalance = await token.balanceOf(presaleAddress);
  console.log("Presale balance:", formatEther(presaleBalance), "tokens");
  
  const liquidityVaultBalance = await token.balanceOf(liquidityVaultAddress);
  console.log("LiquidityVault balance:", formatEther(liquidityVaultBalance), "tokens");
  
  const stakingBalance = await token.balanceOf(stakingAddress);
  console.log("Staking balance:", formatEther(stakingBalance), "tokens");
  
  const airdropBalance = await token.balanceOf(airdropAddress);
  console.log("Airdrop balance:", formatEther(airdropBalance), "tokens");
  
  const staffBalance = await token.balanceOf(staffWallet);
  console.log("Staff wallet balance:", formatEther(staffBalance), "tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
