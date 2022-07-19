const { ethers } = require("hardhat");

async function main() {
  // Load NFT contract
  const CeloNFTFactory = await ethers.getContractFactory("CeloNFT");

  // Deploy the contracts
  const celoNftContract = await CeloNFTFactory.deploy()
  await celoNftContract.deployed()

  // princt the address of the NFT contract 
  console.log("Celo NFT deployed to: ", celoNftContract.address);

  // load market place 
  const NFTMarketplaceFactory = await ethers.getContractFactory(
    "NFTMarketplace"
  );

  // deploy 
  const nftMarketplaceContract = await NFTMarketplaceFactory.deploy()

  await nftMarketplaceContract.deployed()
  console.log("NFT Marketplace deployed to: ", nftMarketplaceContract.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1)
  })
