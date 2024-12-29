import { ethers } from "hardhat";
import { Token__factory, Presale__factory } from "../typechain-types";

async function main() {
    // Get contract addresses from deployment
    const tokenAddress = process.env.VITE_TOKEN_ADDRESS;
    const presaleAddress = process.env.VITE_PRESALE_ADDRESS;

    if (!tokenAddress || !presaleAddress) {
        throw new Error("Please set VITE_TOKEN_ADDRESS and VITE_PRESALE_ADDRESS in .env file");
    }

    console.log("Token address:", tokenAddress);
    console.log("Presale address:", presaleAddress);

    // Get contracts
    const presale = Presale__factory.connect(presaleAddress, ethers.provider);
    const token = Token__factory.connect(tokenAddress, ethers.provider);
    
    // Get LIQUIDITY_WALLET address
    const liquidityWallet = await presale.LIQUIDITY_WALLET();
    console.log("\nLIQUIDITY_WALLET address:", liquidityWallet);
    
    // Check token balance
    const balance = await token.balanceOf(liquidityWallet);
    console.log("Token balance:", ethers.formatEther(balance));
    
    // Check allowance
    const allowance = await token.allowance(liquidityWallet, presaleAddress);
    console.log("Current allowance for Presale contract:", ethers.formatEther(allowance));
    
    // Get total supply to calculate required amount (30%)
    const totalSupply = await token.totalSupply();
    const requiredAmount = (totalSupply * 30n) / 100n;
    console.log("\nRequired tokens for liquidity (30% of total supply):", ethers.formatEther(requiredAmount));
    
    if (balance < requiredAmount) {
        console.log("\n⚠️ WARNING: LIQUIDITY_WALLET does not have enough tokens!");
        console.log("Missing:", ethers.formatEther(requiredAmount - balance), "tokens");
    } else {
        console.log("\n✅ LIQUIDITY_WALLET has sufficient tokens");
    }
    
    if (allowance < requiredAmount) {
        console.log("\n⚠️ WARNING: Insufficient allowance for Presale contract!");
        console.log("Missing allowance:", ethers.formatEther(requiredAmount - allowance), "tokens");
    } else {
        console.log("\n✅ Presale contract has sufficient allowance");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
