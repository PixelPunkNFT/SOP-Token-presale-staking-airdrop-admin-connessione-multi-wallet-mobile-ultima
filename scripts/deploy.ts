import { ethers, network } from "hardhat";
import hre from "hardhat";
import { parseEther, formatEther } from "ethers";

async function main() {
  // Safety checks before deployment
  if (network.name === 'polygonMainnet') {
    console.log("\nPreparing for Polygon Mainnet deployment...");
    console.log("Running pre-deployment checks...");
    
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceInMatic = parseFloat(formatEther(balance));
    
    if (balanceInMatic < 1) {
      throw new Error(`Insufficient MATIC balance (${balanceInMatic}). Need at least 1 MATIC for deployment.`);
    }
    
    // Conferma che stiamo usando il router corretto per Polygon Mainnet
    const routerAddress = process.env.POLYGON_ROUTER;
    if (!routerAddress) {
      throw new Error("POLYGON_ROUTER address not found in environment variables");
    }
    
    console.log("Pre-deployment checks passed ✓");
    console.log("Deployer:", deployer.address);
    console.log("Balance:", balanceInMatic, "MATIC");
    console.log("QuickSwap Router:", routerAddress);
    console.log("\nStarting deployment...");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy Token with confirmation
  console.log("\nDeploying Token...");
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy();
  const tokenReceipt = await token.deploymentTransaction()?.wait(2);
  if (!tokenReceipt) throw new Error("Token deployment failed");
  console.log("Token deployed to:", await token.getAddress());

  // Total supply calculation (1 billion tokens)
  const totalSupply = await token.totalSupply();
  console.log("Total Supply:", formatEther(totalSupply), "tokens");

  // Calculate token amounts based on percentages
  const presaleAmount = (totalSupply * 35n) / 100n;    // 35% = 350,000,000 tokens
  const liquidityAmount = (totalSupply * 30n) / 100n;  // 30% = 300,000,000 tokens
  const stakingAmount = (totalSupply * 20n) / 100n;    // 20% = 200,000,000 tokens
  const airdropAmount = (totalSupply * 5n) / 100n;     // 5% = 50,000,000 tokens
  const staffAmount = (totalSupply * 10n) / 100n;      // 10% = 100,000,000 tokens

  // Deploy Staking with confirmation
  console.log("\nDeploying Staking...");
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(await token.getAddress(), 86400);
  const stakingReceipt = await staking.deploymentTransaction()?.wait(2);
  if (!stakingReceipt) throw new Error("Staking deployment failed");
  console.log("Staking deployed to:", await staking.getAddress());

  // Get router address based on network
  let routerAddress;
  if (network.name === 'polygonMumbai') {
    routerAddress = process.env.MUMBAI_ROUTER;
    console.log("Using QuickSwap Router on Mumbai:", routerAddress);
  } else if (network.name === 'polygonMainnet') {
    routerAddress = process.env.POLYGON_ROUTER;
    console.log("Using QuickSwap Router on Polygon Mainnet:", routerAddress);
  } else if (network.name === 'bscTestnet') {
    routerAddress = process.env.BSC_ROUTER;
    console.log("Using PancakeSwap Router on BSC Testnet:", routerAddress);
  } else {
    routerAddress = process.env.UNISWAP_ROUTER;
    console.log("Using default Router:", routerAddress);
  }

  if (!routerAddress) {
    throw new Error("Router address not found for the current network");
  }

  // Deploy LiquidityVault with confirmation
  console.log("\nDeploying LiquidityVault...");
  const LiquidityVault = await ethers.getContractFactory("LiquidityVault");
  const liquidityVault = await LiquidityVault.deploy(await token.getAddress());
  const liquidityVaultReceipt = await liquidityVault.deploymentTransaction()?.wait(2);
  if (!liquidityVaultReceipt) throw new Error("LiquidityVault deployment failed");
  console.log("LiquidityVault deployed to:", await liquidityVault.getAddress());

  // Deploy Presale with confirmation
  console.log("\nDeploying Presale...");
  const Presale = await ethers.getContractFactory("Presale");
  const presale = await Presale.deploy(
    await token.getAddress(),
    routerAddress,
    await staking.getAddress(),
    await liquidityVault.getAddress()
  );
  const presaleReceipt = await presale.deploymentTransaction()?.wait(2);
  if (!presaleReceipt) throw new Error("Presale deployment failed");
  console.log("Presale deployed to:", await presale.getAddress());

  // Deploy Airdrop with confirmation
  console.log("\nDeploying Airdrop...");
  const Airdrop = await ethers.getContractFactory("Airdrop");
  const airdrop = await Airdrop.deploy(await token.getAddress(), await staking.getAddress());
  const airdropReceipt = await airdrop.deploymentTransaction()?.wait(2);
  if (!airdropReceipt) throw new Error("Airdrop deployment failed");
  console.log("Airdrop deployed to:", await airdrop.getAddress());

  // Transfer tokens according to percentages with confirmations
  console.log("\nDistributing tokens...");
  
  // Transfer to Presale (35% = 350,000,000 tokens)
  const presaleTransfer = await token.transfer(await presale.getAddress(), presaleAmount);
  await presaleTransfer.wait(2);
  console.log(`Transferred ${formatEther(presaleAmount)} tokens (35%) to Presale`);
  
  // Transfer tokens to LiquidityVault (30% = 300,000,000 tokens)
  const liquidityTransfer = await token.transfer(await liquidityVault.getAddress(), liquidityAmount);
  await liquidityTransfer.wait(2);
  console.log(`Transferred ${formatEther(liquidityAmount)} tokens (30%) to LiquidityVault`);
  
  // Configure LiquidityVault with confirmations
  const setPresaleTx = await liquidityVault.setPresaleContract(await presale.getAddress());
  await setPresaleTx.wait(2);
  const approveTx = await liquidityVault.approvePresale();
  await approveTx.wait(2);
  console.log("LiquidityVault configured and approved Presale");
  
  // Transfer to Staking (20% = 200,000,000 tokens)
  const stakingTransfer = await token.transfer(await staking.getAddress(), stakingAmount);
  await stakingTransfer.wait(2);
  console.log(`Transferred ${formatEther(stakingAmount)} tokens (20%) to Staking`);
  
  // Transfer to Airdrop (5% = 50,000,000 tokens)
  const airdropTransfer = await token.transfer(await airdrop.getAddress(), airdropAmount);
  await airdropTransfer.wait(2);
  console.log(`Transferred ${formatEther(airdropAmount)} tokens (5%) to Airdrop`);
  
  // Transfer to Staff wallet (10% = 100,000,000 tokens)
  const staffWallet = process.env.STAFF_WALLET || deployer.address;
  const staffTransfer = await token.transfer(staffWallet, staffAmount);
  await staffTransfer.wait(2);
  console.log(`Transferred ${formatEther(staffAmount)} tokens (10%) to Staff wallet`);

  // Set contract addresses with confirmations
  const setPresaleContractTx = await token.setPresaleContract(await presale.getAddress());
  await setPresaleContractTx.wait(2);
  const setStakingContractTx = await token.setStakingContract(await staking.getAddress());
  await setStakingContractTx.wait(2);
  const setLiquidityVaultContractTx = await token.setLiquidityVaultContract(await liquidityVault.getAddress());
  await setLiquidityVaultContractTx.wait(2);
  const setAirdropContractTx = await token.setAirdropContract(await airdrop.getAddress());
  await setAirdropContractTx.wait(2);

  // Verify contracts on block explorer
  let explorerName, apiKey;
  if (network.name === 'polygonMumbai' || network.name === 'polygonMainnet') {
    explorerName = 'Polygonscan';
    apiKey = process.env.POLYGONSCAN_API_KEY;
  } else if (network.name === 'bscTestnet') {
    explorerName = 'BscScan';
    apiKey = process.env.BSCSCAN_API_KEY;
  }
  
  if (apiKey) {
    console.log(`\nVerifying contracts on ${explorerName}...`);
    // Wait for block confirmations before verifying
    console.log("Waiting for additional block confirmations...");
    const deployTx = token.deploymentTransaction();
    if (!deployTx) {
      throw new Error("Deploy transaction not found");
    }
    console.log("Waiting 5 blocks for confirmation...");
    await deployTx.wait(5);

    try {
      await hre.run("verify:verify", {
        address: await token.getAddress(),
        constructorArguments: [],
      });
      
      await hre.run("verify:verify", {
        address: await liquidityVault.getAddress(),
        constructorArguments: [await token.getAddress()],
      });
      
      await hre.run("verify:verify", {
        address: await presale.getAddress(),
        constructorArguments: [await token.getAddress(), routerAddress, await staking.getAddress(), await liquidityVault.getAddress()],
      });
      
      await hre.run("verify:verify", {
        address: await staking.getAddress(),
        constructorArguments: [await token.getAddress(), 86400],
      });
      
      await hre.run("verify:verify", {
        address: await airdrop.getAddress(),
        constructorArguments: [await token.getAddress(), await staking.getAddress()],
      });
      console.log(`All contracts verified on ${explorerName}`);
    } catch (error) {
      console.error("Error verifying contracts:", error);
    }
  }

  // Print deployment summary
  console.log("\nDeployment Summary");
  console.log("==================");
  console.log("Network:", network.name);
  console.log("Token:", await token.getAddress());
  console.log("Presale:", await presale.getAddress());
  console.log("Staking:", await staking.getAddress());
  console.log("Airdrop:", await airdrop.getAddress());
  console.log("LiquidityVault:", await liquidityVault.getAddress());
  console.log("\nToken Distribution (1 billion total supply):");
  console.log("- Presale: 35% (350,000,000 tokens)");
  console.log("- Liquidity: 30% (300,000,000 tokens)");
  console.log("- Staking: 20% (200,000,000 tokens)");
  console.log("- Airdrop: 5% (50,000,000 tokens)");
  console.log("- Staff: 10% (100,000,000 tokens)");
  
  console.log("\nNext steps:");
  console.log("1. Update contract addresses in frontend (.env)");
  console.log("2. Add liquidity to DEX");
  console.log("3. Test all functionalities");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
