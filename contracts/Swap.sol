// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Swap is Ownable, ReentrancyGuard {
    IERC20 public sopToken;
    uint256 public ethToSopRate = 1000; // 1 ETH = 1000 SOP (esempio)
    uint256 public sopToEthRate = 1000; // 1000 SOP = 1 ETH

    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);
    event TokensSold(address indexed seller, uint256 tokenAmount, uint256 ethAmount);
    event RatesUpdated(uint256 newEthToSopRate, uint256 newSopToEthRate);

    constructor(address _sopToken) {
        sopToken = IERC20(_sopToken);
    }

    // Funzione per comprare token SOP con ETH
    function buyTokens() external payable nonReentrant {
        require(msg.value > 0, "Must send ETH");
        
        uint256 tokenAmount = (msg.value * ethToSopRate) / 1 ether;
        require(sopToken.balanceOf(address(this)) >= tokenAmount, "Insufficient token balance in contract");

        bool success = sopToken.transfer(msg.sender, tokenAmount);
        require(success, "Token transfer failed");

        emit TokensPurchased(msg.sender, msg.value, tokenAmount);
    }

    // Funzione per vendere token SOP per ETH
    function sellTokens(uint256 tokenAmount) external nonReentrant {
        require(tokenAmount > 0, "Must sell some tokens");
        require(sopToken.balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");

        uint256 ethAmount = (tokenAmount * 1 ether) / sopToEthRate;
        require(address(this).balance >= ethAmount, "Insufficient ETH balance in contract");

        bool success = sopToken.transferFrom(msg.sender, address(this), tokenAmount);
        require(success, "Token transfer failed");

        (bool sent, ) = msg.sender.call{value: ethAmount}("");
        require(sent, "ETH transfer failed");

        emit TokensSold(msg.sender, tokenAmount, ethAmount);
    }

    // Funzione per aggiornare i tassi di cambio (solo owner)
    function updateRates(uint256 newEthToSopRate, uint256 newSopToEthRate) external onlyOwner {
        require(newEthToSopRate > 0 && newSopToEthRate > 0, "Invalid rates");
        ethToSopRate = newEthToSopRate;
        sopToEthRate = newSopToEthRate;
        emit RatesUpdated(newEthToSopRate, newSopToEthRate);
    }

    // Funzione per ritirare ETH (solo owner)
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        
        (bool sent, ) = msg.sender.call{value: balance}("");
        require(sent, "ETH transfer failed");
    }

    // Funzione per ritirare token (solo owner)
    function withdrawTokens(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(sopToken.balanceOf(address(this)) >= amount, "Insufficient token balance");
        
        bool success = sopToken.transfer(msg.sender, amount);
        require(success, "Token transfer failed");
    }

    // Funzione per ottenere la stima dei token in output
    function getEstimatedTokens(uint256 ethAmount) external view returns (uint256) {
        return (ethAmount * ethToSopRate) / 1 ether;
    }

    // Funzione per ottenere la stima di ETH in output
    function getEstimatedEth(uint256 tokenAmount) external view returns (uint256) {
        return (tokenAmount * 1 ether) / sopToEthRate;
    }

    // Funzione per ricevere ETH
    receive() external payable {}
}
