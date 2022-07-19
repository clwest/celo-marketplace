// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTMarketplace {

    struct Listing {
        uint256 price;
        address seller;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;

    // Requires the msg.sender is the owner of the nft
    modifier isNFTOwner(address nftAddress, uint256 tokenId) {
        require(
            IERC721(nftAddress).ownerOf(tokenId) == msg.sender,
            "MRKT: Not the owner"
        );
        _;
    }

    // Requires that the specified NFT is not already listed for sale
    modifier isNotListed(address nftAddress, uint256 tokenId) {
        require(
            listings[nftAddress][tokenId].price == 0, "MRKT: Already listed"
        );
        _;
    }

    // Requires that the specified NFT is already listed for sale
    modifier isListed(address nftAddress, uint256 tokenId) {
        require(listings[nftAddress][tokenId].price > 0, "MRKT: Not listed");
        _;
    }

    event ListingsCreated(
        address nftAddress,
        uint256 tokenId,
        uint256 price,
        address seller
    );

    event ListingCanceled(
        address nftAddress, 
        uint256 tokenId, 
        address seller
    );

    event ListingUpdated(
        address nftAddress,
        uint256 tokenId, 
        uint256 newPrice,
        address seller
    );

    event ListingPurchased(
        address nftAddress,
        uint256 tokenId, 
        address seller,
        address buyer
    );


    function createListing(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external isNotListed(nftAddress, tokenId) isNFTOwner(nftAddress, tokenId) {
        require(price > 0, "MRKT: Price must be greate than zero");

        // Marketplace must be approved to transfer NFT
        IERC721 nftContract = IERC721(nftAddress);
        require(
            nftContract.isApprovedForAll(msg.sender, address(this)) ||
            nftContract.getApproved(tokenId) == address(this),
            "MRKT: No approval for NFT"
        );

        listings[nftAddress][tokenId] = Listing({
            price: price,
            seller: msg.sender
        });
        emit ListingsCreated(nftAddress, tokenId, price, msg.sender);
    }

    function cancelLisitng(address nftAddress, uint256 tokenId)
        external 
        isListed(nftAddress, tokenId)
        isNFTOwner(nftAddress, tokenId)
    {
        // Delete the listings from the mapping t
        // Freeing up storage saving gas fees
        delete listings[nftAddress][tokenId];

        // Emit Event
        emit ListingCanceled(nftAddress, tokenId, msg.sender);
    }

    function updateLisitng(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    ) external isListed(nftAddress, tokenId) isNFTOwner(nftAddress, tokenId) {
        require(newPrice >= 0, "MRKT: Price must be > 0");
        
        // Update listing Price
        listings[nftAddress][tokenId].price = newPrice;

        // Emit Event
        emit ListingUpdated(nftAddress, tokenId, newPrice, msg.sender);
    }

    function purchaseListing(address nftAddress, uint256 tokenId)
        external
        payable
        isListed(nftAddress, tokenId)
    {
        // Load the listing in a local copy
        Listing memory listing = listings[nftAddress][tokenId];

        // Buyer must have sent enough eth
        require(msg.value == listing.price, "MRKT: Incorrect ETH Supplied");

        // Delete listing from teh storage array
        delete listings[nftAddress][tokenId];

        // Transfer NFT from seller to buyer
        IERC721(nftAddress).safeTransferFrom(
            listing.seller,
            msg.sender, 
            tokenId
        );

        // Transfer eth sent by buyer to seller
        payable(listing.seller).transfer(msg.value);

        // Emit Event
        emit ListingPurchased(nftAddress, tokenId, listing.seller, msg.sender);
    }

}