import { expect } from "chai";
import { ethers } from "hardhat";
import type { Token, Presale, Staking } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Token Ecosystem", function () {
  let token: Token;
  let presale: Presale;
  let staking: Staking;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let signers: SignerWithAddress[];
  let uniswapRouter: string;
  let startTime: number;

  const INITIAL_SUPPLY = "1000000000"; // 1 billion tokens
  const REWARD_RATE = "100";
  const MIN_STAKING_PERIOD = "86400"; // 1 day

  beforeEach(async function () {
    signers = await ethers.getSigners();
    [owner, addr1, addr2, addr3] = signers;
    
    // Deploy mock Uniswap router
    const MockRouter = await ethers.getContractFactory("MockUniswapV2Router02");
    const mockRouter = await MockRouter.deploy();
    uniswapRouter = await mockRouter.getAddress();

    // Get current timestamp
    const latestBlock = await ethers.provider.getBlock('latest');
    startTime = latestBlock!.timestamp;

    // Deploy Token
    const TokenFactory = await ethers.getContractFactory("Token");
    token = await (await TokenFactory.deploy()).connect(owner) as Token;
    await token.waitForDeployment();

    // Deploy Staking
    const StakingFactory = await ethers.getContractFactory("Staking");
    staking = await (await StakingFactory.deploy(
      await token.getAddress(),
      REWARD_RATE,
      MIN_STAKING_PERIOD
    )).connect(owner) as Staking;
    await staking.waitForDeployment();

    // Deploy Presale
    const PresaleFactory = await ethers.getContractFactory("Presale");
    presale = await (await PresaleFactory.deploy(
      await token.getAddress(),
      uniswapRouter,
      await staking.getAddress()
    )).connect(owner) as Presale;
    await presale.waitForDeployment();

    // Transfer tokens according to distribution
    const presaleAmount = ethers.parseEther(INITIAL_SUPPLY) * 35n / 100n; // 35%
    const stakingAmount = ethers.parseEther(INITIAL_SUPPLY) * 20n / 100n; // 20%
    await token.transfer(await presale.getAddress(), presaleAmount);
    await token.transfer(await staking.getAddress(), stakingAmount);
  });

  describe("Token", function () {
    it("Should have correct name and symbol", async function () {
      expect(await token.name()).to.equal("SOP");
      expect(await token.symbol()).to.equal("SOP");
    });

    it("Should have correct total supply and distribution", async function () {
      const totalSupply = await token.totalSupply();
      const presaleBalance = await token.balanceOf(await presale.getAddress());
      const stakingBalance = await token.balanceOf(await staking.getAddress());

      expect(totalSupply).to.equal(ethers.parseEther(INITIAL_SUPPLY));
      expect(presaleBalance).to.equal(ethers.parseEther(INITIAL_SUPPLY) * 35n / 100n); // 35%
      expect(stakingBalance).to.equal(ethers.parseEther(INITIAL_SUPPLY) * 20n / 100n); // 20%
    });
  });

  describe("Presale", function () {
    it("Should allow participation and track contributions", async function () {
      const contribution = ethers.parseEther("1");
      await presale.connect(addr1).participate({ value: contribution });
      
      const addr1Contribution = await presale.contributions(addr1.address);
      expect(addr1Contribution).to.equal(contribution);
    });

    it("Should calculate correct token amount based on current price", async function () {
      const bnbAmount = ethers.parseEther("1");
      const currentPrice = await presale.getCurrentPrice();
      const expectedTokens = (bnbAmount * ethers.parseEther("1")) / currentPrice;
      
      // Participate with 1 BNB
      const balanceBefore = await token.balanceOf(addr1.address);
      await presale.connect(addr1).participate({ value: bnbAmount });
      const balanceAfter = await token.balanceOf(addr1.address);
      
      // Verify received tokens are close to expected (allowing for small price variations)
      const receivedTokens = balanceAfter - balanceBefore;
      const difference = expectedTokens > receivedTokens ? 
        expectedTokens - receivedTokens : 
        receivedTokens - expectedTokens;
      
      expect(difference).to.be.lt(ethers.parseEther("0.1")); // Allow 0.1 token difference due to timing
    });

    it("Should increase price over time", async function () {
      const initialPrice = await presale.getCurrentPrice();
      
      // Advance time by price increase interval
      await time.increase(12 * 3600); // 12 hours
      
      const newPrice = await presale.getCurrentPrice();
      expect(newPrice).to.be.gt(initialPrice);
    });

    it("Should finalize presale correctly", async function () {
      // Make some contributions first
      const contribution = ethers.parseEther("1");
      await presale.connect(addr1).participate({ value: contribution });
      
      // Finalize presale
      await presale.finalize();
      
      expect(await presale.presaleFinalized()).to.be.true;
    });
  });

  describe("Staking", function () {
    it("Should allow staking tokens", async function () {
      const stakeAmount = ethers.parseEther("1000");
      
      await token.transfer(addr1.address, stakeAmount);
      await token.connect(addr1).approve(await staking.getAddress(), stakeAmount);
      
      await staking.connect(addr1).stake(stakeAmount);
      const stakeInfo = await staking.getStakeInfo(addr1.address);
      expect(stakeInfo[0]).to.equal(stakeAmount);
    });

    it("Should handle multiple stakers correctly", async function () {
      const stakeAmount = ethers.parseEther("1000");
      
      // Setup stakers
      for (const staker of [addr1, addr2]) {
        await token.transfer(staker.address, stakeAmount);
        await token.connect(staker).approve(await staking.getAddress(), stakeAmount);
        await staking.connect(staker).stake(stakeAmount);
      }
      
      // Advance time
      await time.increase(86400); // 1 day
      
      // Check rewards for both stakers
      for (const staker of [addr1, addr2]) {
        const rewards = await staking.calculateRewards(staker.address);
        expect(rewards).to.be.gt(0);
      }
    });

    it("Should not allow withdrawal before minimum staking period", async function () {
      const stakeAmount = ethers.parseEther("1000");
      
      await token.transfer(addr1.address, stakeAmount);
      await token.connect(addr1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(addr1).stake(stakeAmount);
      
      await expect(
        staking.connect(addr1).withdraw(stakeAmount)
      ).to.be.revertedWith("Minimum staking period not met");
    });

    it("Should calculate and distribute rewards correctly", async function () {
      const stakeAmount = ethers.parseEther("1000");
      
      await token.transfer(addr1.address, stakeAmount);
      await token.connect(addr1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(addr1).stake(stakeAmount);
      
      // Advance time
      await time.increase(86400); // 1 day
      
      const rewards = await staking.calculateRewards(addr1.address);
      expect(rewards).to.be.gt(0);
      
      const balanceBefore = await token.balanceOf(addr1.address);
      await staking.connect(addr1).claimRewards();
      const balanceAfter = await token.balanceOf(addr1.address);
      
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should allow withdrawal after minimum staking period", async function () {
      const stakeAmount = ethers.parseEther("1000");
      
      await token.transfer(addr1.address, stakeAmount);
      await token.connect(addr1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(addr1).stake(stakeAmount);
      
      // Advance time past minimum staking period
      await time.increase(86401); // 1 day + 1 second
      
      await staking.connect(addr1).withdraw(stakeAmount);
      const stakeInfo = await staking.getStakeInfo(addr1.address);
      expect(stakeInfo[0]).to.equal(0);
    });

    it("Should handle partial withdrawals correctly", async function () {
      const stakeAmount = ethers.parseEther("1000");
      const withdrawAmount = ethers.parseEther("400");
      
      await token.transfer(addr1.address, stakeAmount);
      await token.connect(addr1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(addr1).stake(stakeAmount);
      
      // Advance time past minimum staking period
      await time.increase(86401);
      
      await staking.connect(addr1).withdraw(withdrawAmount);
      const stakeInfo = await staking.getStakeInfo(addr1.address);
      expect(stakeInfo[0]).to.equal(stakeAmount - withdrawAmount);
    });
  });
});
