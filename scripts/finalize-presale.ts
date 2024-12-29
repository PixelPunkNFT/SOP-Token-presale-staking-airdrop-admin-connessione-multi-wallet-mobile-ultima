import { ethers } from "hardhat";

async function main() {
  // Get the deployed contract addresses from environment variables
  const presaleAddress = process.env.VITE_PRESALE_ADDRESS;
  const liquidityVaultAddress = process.env.VITE_LIQUIDITY_VAULT_ADDRESS;

  if (!presaleAddress || !liquidityVaultAddress) {
    throw new Error("Missing contract addresses in environment variables");
  }

  // Get the LiquidityVault contract
  const LiquidityVault = await ethers.getContractFactory("LiquidityVault");
  const liquidityVault = await LiquidityVault.attach(liquidityVaultAddress);

  console.log("Approving Presale contract to spend LiquidityVault tokens...");
  const approveTx = await liquidityVault.approvePresale();
  await approveTx.wait();
  console.log("Approval successful");

  // Get the Presale contract
  const Presale = await ethers.getContractFactory("Presale");
  const presale = await Presale.attach(presaleAddress);

  console.log("Finalizing presale...");
  const finalizeTx = await presale.finalize();
  await finalizeTx.wait();
  console.log("Presale finalized successfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
