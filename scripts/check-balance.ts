import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import TokenArtifact from "../artifacts/contracts/Token.sol/Token.json";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Get Token contract with ABI
  const tokenAddress = process.env.VITE_TOKEN_ADDRESS || "";
  const token = new ethers.Contract(tokenAddress, TokenArtifact.abi, deployer);

  // Array of contracts to check
  const contracts = [
    { name: "Presale", address: process.env.VITE_PRESALE_ADDRESS },
    { name: "LiquidityVault", address: process.env.VITE_LIQUIDITY_VAULT_ADDRESS },
    { name: "Staking", address: process.env.VITE_STAKING_ADDRESS },
    { name: "Airdrop", address: process.env.VITE_AIRDROP_ADDRESS }
  ];

  console.log("\nChecking token balances...");
  
  // Check balances
  for (const contract of contracts) {
    if (contract.address) {
      try {
        const balance = await token.balanceOf(contract.address);
        console.log(`${contract.name} contract token balance:`, ethers.formatEther(balance), "tokens");
      } catch (error: any) {
        console.error(`Error checking ${contract.name} balance:`, error.message);
      }
    }
  }

  // Check deployer balance
  try {
    const deployerBalance = await token.balanceOf(deployer.address);
    console.log("Deployer token balance:", ethers.formatEther(deployerBalance), "tokens");
  } catch (error: any) {
    console.error("Error checking deployer balance:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
