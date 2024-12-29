import { ethers } from "hardhat";

async function main() {
  const tokenAddress = process.env.VITE_TOKEN_ADDRESS;
  const presaleAddress = process.env.VITE_PRESALE_ADDRESS;
  const liquidityVaultAddress = process.env.VITE_LIQUIDITY_VAULT_ADDRESS;

  if (!tokenAddress || !presaleAddress || !liquidityVaultAddress) {
    throw new Error("Missing contract addresses in environment variables");
  }

  // Get contracts
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.attach(tokenAddress);
  
  const LiquidityVault = await ethers.getContractFactory("LiquidityVault");
  const liquidityVault = await LiquidityVault.attach(liquidityVaultAddress);

  // Get owner address
  const [owner] = await ethers.getSigners();

  // Check balances
  const liquidityVaultBalance = await token.balanceOf(liquidityVaultAddress);
  const ownerBalance = await token.balanceOf(owner.address);
  
  // Check allowance
  const allowance = await token.allowance(liquidityVaultAddress, presaleAddress);

  console.log("\nToken Balances:");
  console.log("LiquidityVault:", ethers.formatEther(liquidityVaultBalance), "tokens");
  console.log("Owner:", ethers.formatEther(ownerBalance), "tokens");
  console.log("\nAllowances:");
  console.log("LiquidityVault -> Presale:", ethers.formatEther(allowance), "tokens");
  
  // Check if presale is finalized
  const Presale = await ethers.getContractFactory("Presale");
  const presale = await Presale.attach(presaleAddress);
  const isFinalized = await presale.presaleFinalized();
  console.log("\nPresale Status:");
  console.log("Finalized:", isFinalized);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
