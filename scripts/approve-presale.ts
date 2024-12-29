import { ethers } from "hardhat";
import { Token__factory, Presale__factory } from "../typechain-types";

async function main() {
    // Get contract addresses from deployment
    const tokenAddress = process.env.TOKEN_ADDRESS;
    const presaleAddress = process.env.PRESALE_ADDRESS;

    if (!tokenAddress || !presaleAddress) {
        throw new Error("Please set TOKEN_ADDRESS and PRESALE_ADDRESS in .env file");
    }

    // Get Presale contract to get LIQUIDITY_WALLET address
    const presale = Presale__factory.connect(presaleAddress, ethers.provider);
    const liquidityWallet = await presale.LIQUIDITY_WALLET();
    
    console.log("LIQUIDITY_WALLET address:", liquidityWallet);

    // Get Token contract instance
    const token = Token__factory.connect(tokenAddress, ethers.provider);

    // Get total supply to calculate liquidity amount (30%)
    const totalSupply = await token.totalSupply();
    const liquidityAmount = (totalSupply * 30n) / 100n;

    // Impersonate LIQUIDITY_WALLET account
    await ethers.provider.send("hardhat_impersonateAccount", [liquidityWallet]);
    const liquidityWalletSigner = await ethers.provider.getSigner(liquidityWallet);
    
    console.log(`\nApproving Presale contract (${presaleAddress}) to spend ${ethers.formatEther(liquidityAmount)} tokens from LIQUIDITY_WALLET...`);
    
    // Approve Presale contract to spend tokens
    const tokenWithSigner = token.connect(liquidityWalletSigner);
    const tx = await tokenWithSigner.approve(presaleAddress, liquidityAmount);
    await tx.wait();
    
    console.log("Approval successful!");
    
    // Verify approval
    const allowance = await token.allowance(liquidityWallet, presaleAddress);
    console.log(`\nCurrent allowance: ${ethers.formatEther(allowance)} tokens`);

    // Stop impersonating
    await ethers.provider.send("hardhat_stopImpersonatingAccount", [liquidityWallet]);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
