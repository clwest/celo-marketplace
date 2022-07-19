import {Contract} from "ethers";
import {formatEther, parseEther} from "ethers/lib/utils";
import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import {createClient} from "urql";
import {useContract, useSigner} from "wagmi";
import ERC721ABI from "../../abis/ERC721.json";
import MarketplaceABI from "../../abis/NFTMarketplace.json";
import Navbar from "../../components/Navbar";
import { MARKETPLACE_ADDRESS, SUBGRAPH_URL} from "../../constants";
import styles from "../../styles/Details.module.css";

export default function NFTDetails() {
    // Extract NFT contract address and Token ID from url 
    const router = useRouter();
    const nftAddress = router.query.nftContract;
    const tokenId = router.query.tokenId;

    // State vars to contain nft and listing info 
    const [listing, setListing] = useState();
    const [name, setName] = useState();
    const [imageURI, setImageURI] = useState("");
    const [isOwner, setIsOwner] = useState(false);
    const [isActive, setIsActive] = useState(false);

    // State var to contain new price
    const [newPrice, setNewPrice] = useState("")

    // state vars to contain NFT and listing inofo 
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false)
    const [canceling, setCanceling] = useState(false)
    const [buying, setBuying] = useState(false)

    // Fetch signer from wagmi
    const { data: signer} = useSigner();

    const MarketplaceContract = useContract({
        addressOrName: MARKETPLACE_ADDRESS,
        contractInterface: MarketplaceABI,
        signerOrProvider: signer,
    })

    async function fetchListing() {
        const listingQuery = `
        query ListingQuery{
            listingEntities(where:{
                nftAddress: "${nftAddress}",
                tokenId: "${tokenId}"
            }){
                id
                nftAddress
                tokenId
                price
                seller
                buyer
            }
        }
        `;

        const urqlClient = createClient({ url: SUBGRAPH_URL });

        // send the query to the subgraph GRAPHQL API and get the response
        const response = await urqlClient.query(listingQuery).toPromise();
        const listingEntities = response.data.listingEntities;

        // if no active listing found with given params
        // inform user of error then redirect to homepage
        if (listingEntities.length === 0) {
            window.alert("Listing does not exist or has been canceled by seller")
            return router.push("/")
        }

        // Grab the first listing which should be the only one matching the params
        const listing = listingEntities[0];
        
        // get the signer address
        const address = await signer.getAddress();

        // Update state vars 
        setIsActive(listing.buyer === null);
        setIsOwner(address.toLowerCase() === listing.seller.toLowerCase());
        setListing(listing);
    }

    async function fetchNFTDetails() {
        const ERC721Contract = new Contract(nftAddress, ERC721ABI, signer);
        let tokenURI = await ERC721Contract.tokenURI(tokenId);
        tokenURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");

        const metadata = await fetch(tokenURI)
        const metadataJSON = await metadata.json()

        let image = metadataJSON.imageUrl;
        image = image.replace("ipsf://", "https://ipfs.io/ipfs/")

        setName(metadataJSON.name)
        setImageURI(image)
    }

    async function updateListing() {
        setUpdating(true);
        const updateTxn = await MarketplaceContract.updateLisitng(
            nftAddress,
            tokenId,
            parseEther(newPrice)
        );
        await updateTxn.wait()
        await fetchListing()
        setUpdating(false);
    }

    // Call cancelListing from contract 
    async function cancelListing() {
        setCanceling(true);
        const cancelTxn = await MarketplaceContract.cancelLisitng(
            nftAddress,
            tokenId
        );
        await cancelTxn.wait()
        window.alert("Listing Canceled");
        await router.push("/");
        setCanceling(false);
    }

    // call the buyListing from the contract 
    async function buyListing() {
        setBuying(true);
        const buyTxn = await MarketplaceContract.purchaseListing(
            nftAddress,
            tokenId,
            {
                value: listing.price,
            }
        );
        await buyTxn.wait();
        await fetchListing()
        setBuying(false);
    }

    // Load listing and NFT data on page load
    useEffect(() => {
        if (router.query.nftContract && router.query.tokenId && signer) {
            Promise.all([fetchListing(), fetchNFTDetails()]).finally(() =>
                setLoading(false) 
            )
        }
    }, [router, signer])

    return (
        <>
        <Navbar />
        <div>
            {loading ? (
                <span>Loading..</span>

            ) : (
                <div className={styles.container}>
                    <div className={styles.details}>
                        <img src={imageURI} />
                        <span>
                            <b>
                                {name}-#{tokenId}
                            </b>
                        </span>
                        <span>Price:{formatEther(listing.price)}CELO</span>
                        <span>
                            <a
                                herf={`https://alfajores.celoscan.io/address/${listing.seller}`}
                                target="_blank"
                            >
                                Seller:{" "}
                                {isOwner ? "You" : listing.seller.substring(0, 6) + "..."}
                            </a>
                        </span>
                        <span>Status: {listing.buyer === null ? "Active" : "Sold"}</span>
                    </div>

                    <div className={styles.options}>
                        {!isActive && (
                            <span>
                                Listing has been sold to {" "}
                                <a 
                                herf={`https://alfajores.celoscan.io/address/${listing.buyer}`}
                                target="_blank"
                                >
                                {listing.buyer}
                                </a>
                            </span>
                        )}
                    {isOwner && isActive && (
                        <>
                        <div className={styles.updateListing}>
                            <input
                            type="text"
                            placeholder="New Price (in CELO)"
                            value={newPrice}
                            onChange={(e) => {
                                if(e.target.value===""){
                                    setNewPrice("0");
                                } else {
                                    setNewPrice(e.target.value);
                                }
                            }}
                            ></input>
                            <button disabled={updating} onClick={updateListing}>
                                Update Listing
                            </button>
                        </div>

                        <button
                        className={styles.btn}
                        disabled={canceling}
                        onClick={cancelListing}
                        >
                            Cancel Listing
                        </button>
                    </>
                    )}

                    {!isOwner && isActive && (
                        <button
                        className={styles.btn}
                        disabled={buying}
                        onClick={buyListing}
                        >
                            Buy Listing
                        </button>
                    )}
                </div>
                </div>
            )}
        </div>
        </>
    )
}