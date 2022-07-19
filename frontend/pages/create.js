import {Contract} from "ethers";
import {isAddress, parseEther} from "ethers/lib/utils";
import Link from "next/link";
import {useState} from "react"
import {useSigner} from "wagmi";
import ERC721ABI from "../abis/ERC721.json";
import MarketplaceABI from "../abis/NFTMarketplace.json";
import Navbar from "../components/Navbar";
import styles from "../styles/Create.module.css";
import { MARKETPLACE_ADDRESS } from "../constants";

export default function Create() {
    // State vars 
    const [nftAddress, setNftAddress] = useState("");
    const [tokenId, setTokenId] = useState("");
    const [price, setPrice] = useState("");
    const [loading, setLoading] = useState(false);
    const [showListngLink, setShowListingLink] = useState(false);

    // get signer from wagmi
    const { data: signer } = useSigner();

    // Main function fto be called when create button is clicked
    async function handleCreateListing() {
        // set loading status to true
        setLoading(true);

        try {
            // make sure the contract is valid 
            const isValidAddress = isAddress(nftAddress);
            if (!isValidAddress) {
                throw new Error(`invalid contract address`);
            }

            // Request approval over NFT 
            await requestApproval();
            await createListing();

            // start displaying a button to view the NFT details
            setShowListingLink(true);
        } catch (error) {
            console.error(error)
        }

        // Set loading status to false
        setLoading(false)
    }

    // Function to cehck if NFT approal is required
    async function requestApproval() {
        const address = await signer.getAddress()

        // get contrract instance ofr NFT 
        const ERC721Contract = new Contract(nftAddress, ERC721ABI, signer);

        // Make sure user is owner of the NFT 
        const tokenOwner = await ERC721Contract.ownerOf(tokenId);
        if (tokenOwner.toLowerCase() !== address.toLowerCase()) {
            throw new Error(`You don't own this NFT `)
        }

        // check if user already gave approval to marketplace 
        const isApproved = await ERC721Contract.isApprovedForAll(
            address,
            MARKETPLACE_ADDRESS
        );

        // if not approved
        if (!isApproved) {
            console.log("Requesting approval for NFTs... ");

            // send approval 
            const approvalTxn = await ERC721Contract.setApprovalForAll(
                MARKETPLACE_ADDRESS,
                true
            );
            await approvalTxn.wait()
        }
    }

    // Function to call createListing
    async function createListing() {
        // set instance of marketplace 
        const MarketplaceContract = new Contract(
            MARKETPLACE_ADDRESS,
            MarketplaceABI,
            signer
        );

        // send the creaete listings tx 
        const createListingTxn = await MarketplaceContract.createListing(
            nftAddress,
            tokenId,
            parseEther(price)
        );
        
        await createListingTxn.wait()
    }
    return (
        <>
          {/* Show the navigation bar */}
          <Navbar />
    
          {/* Show the input fields for the user to enter contract details */}
          <div className={styles.container}>
            <input
              type="text"
              placeholder="NFT Address 0x..."
              value={nftAddress}
              onChange={(e) => setNftAddress(e.target.value)}
            />
            <input
              type="text"
              placeholder="Token ID"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
            />
            <input
              type="text"
              placeholder="Price (in CELO)"
              value={price}
              onChange={(e) => {
                if (e.target.value === "") {
                  setPrice("0");
                } else {
                  setPrice(e.target.value);
                }
              }}
            />
            {/* Button to create the listing */}
            <button onClick={handleCreateListing} disabled={loading}>
              {loading ? "Loading..." : "Create"}
            </button>
    
            {/* Button to take user to the NFT details page after listing is created */}
            {showListngLink && (
              <Link href={`/${nftAddress}/${tokenId}`}>
                <a>
                  <button>View Listing</button>
                </a>
              </Link>
            )}
          </div>
        </>
      );
}