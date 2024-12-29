import { ethers } from "hardhat";

async function main() {
  const tokenAddress = process.env.VITE_TOKEN_ADDRESS;
  const presaleAddress = process.env.VITE_PRESALE_ADDRESS;
  const liquidityVaultAddress = process.env.VITE_LIQUIDITY_VAULT_ADDRESS;

  if (!tokenAddress || !presaleAddress || !liquidityVaultAddress) {
    throw new Error("Missing contract addresses in environment variables");
  }

  // Get signer
  const signer = (await ethers.getSigners())[0];

  // Get contracts
  const tokenAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function transferFrom(address,address,uint256) returns (bool)"
  ];
  const token = new ethers.Contract(tokenAddress, tokenAbi, signer);
  
  const LiquidityVault = await ethers.getContractFactory("LiquidityVault");
  const liquidityVault = await LiquidityVault.attach(liquidityVaultAddress);
  
  const Presale = await ethers.getContractFactory("Presale");
  const presale = await Presale.attach(presaleAddress);

  console.log("Starting automatic liquidity addition process...");

  // 1. Trasferisci i token dal LiquidityVault al contratto Presale
  const tokensForLiquidity = await token.balanceOf(liquidityVaultAddress);
  console.log("Tokens for liquidity:", ethers.formatEther(tokensForLiquidity));

  // Verifica l'allowance per il signer
  const allowance = await token.allowance(liquidityVaultAddress, signer.address);
  console.log("Current allowance for signer:", ethers.formatEther(allowance));

  // Approva il signer a spendere i token dal LiquidityVault
  console.log("Approving signer to spend tokens...");
  const approveTx = await liquidityVault.setPresaleContract(signer.address);
  await approveTx.wait();
  const approveTx2 = await liquidityVault.approvePresale();
  await approveTx2.wait();
  console.log("Approval successful");

  // 2. Trasferisci i token
  console.log("Transferring tokens to Presale contract...");
  const transferTx = await token.transferFrom(liquidityVaultAddress, presaleAddress, tokensForLiquidity);
  await transferTx.wait();
  console.log("Transfer successful");

  // 3. Ripristina il contratto Presale come spender
  console.log("Resetting Presale contract as spender...");
  const resetTx = await liquidityVault.setPresaleContract(presaleAddress);
  await resetTx.wait();
  const resetApproveTx = await liquidityVault.approvePresale();
  await resetApproveTx.wait();
  console.log("Reset successful");

  // 3. Verifica il bilancio del contratto Presale
  const presaleBalance = await token.balanceOf(presaleAddress);
  console.log("Presale contract balance:", ethers.formatEther(presaleBalance));

  // 4. Ottieni il totalRaised dal contratto Presale
  const totalRaised = await presale.totalRaised();
  console.log("Total BNB raised:", ethers.formatEther(totalRaised));

  // 5. Ottieni il router PancakeSwap
  const routerAddress = await presale.pancakeRouter();
  const routerAbi = [
    "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
  ];
  const router = new ethers.Contract(routerAddress, routerAbi, signer);

  // 6. Approva il router
  console.log("Approving PancakeSwap router...");
  const approveRouterTx = await token.approve(routerAddress, presaleBalance);
  await approveRouterTx.wait();
  console.log("Router approval successful");

  // 7. Aggiungi liquidità automaticamente
  console.log("Adding liquidity to PancakeSwap...");
  const addLiquidityTx = await router.addLiquidityETH(
    tokenAddress,
    presaleBalance,
    0, // slippage configurato a 100% per semplicità
    0, // slippage configurato a 100% per semplicità
    signer.address, // invia LP token all'owner
    Math.floor(Date.now() / 1000) + 300, // deadline 5 minuti
    { value: totalRaised }
  );
  await addLiquidityTx.wait();
  console.log("Liquidity added successfully");

  // 7. Verifica finale
  const finalPresaleBalance = await token.balanceOf(presaleAddress);
  console.log("\nFinal balances:");
  console.log("Presale contract tokens:", ethers.formatEther(finalPresaleBalance));
  console.log("Liquidity addition complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
