import { ethers } from "hardhat";

async function main() {
  console.log("Deploying test token...");
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.waitForDeployment();
  
  const tokenAddress = await token.getAddress();
  console.log("Token deployed to:", tokenAddress);
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  try {
    const totalSupply = await token.totalSupply();
    console.log("Total supply:", ethers.formatEther(totalSupply), "tokens");
    
    const deployerBalance = await token.balanceOf(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(deployerBalance), "tokens");
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
