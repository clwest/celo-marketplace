import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Listing from "../components/Listing"
import {createClient} from "urql";
import styles from "../styles/Home.module.css";
import Link from "next/link";
import { SUBGRAPH_URL } from "../constants";
import { useAccount } from "wagmi";

export default function Home() {
  // Set state vars 
  const [listings, setListings] = useState();
  const [loading, setLoading] = useState(false);
  const { isConnected } = useAccount();

  // Function to fetch listings from the subgraph
  async function fetchListings() {
    setLoading(true);
    // The graphql query to run 
    const listingQuery = `
    query ListingQuery{
      listingEntities{
        id
        nftAddress
        tokenId
        price
        seller
        buyer
      }
    }
    `;

    // create a urql client
    const urqlClient = createClient({
      url: SUBGRAPH_URL,
    });

    // Send the query to the subgraph GraphQL api and get the response
    const response = await urqlClient.query(listingQuery).toPromise();
    const listingEntities = response.data.listingEntities;

    // Filter out active lsitings 
    // Is that an L or an I?
    const activeListings = listingEntities.filter((l) => l.buyer === null);

    // Update state vars
    setListings(activeListings);
    setLoading(false);
  }

  useEffect(() => {
    // Fecth listings on page load once wallet is connected
    if (isConnected) {
      fetchListings();
    }
  }, []);

  return (
    <>
    {/*Add navbar */}
    <Navbar />

    {/* Show loading status if query hasnt responded*/}
    {loading && isConnected && <span>Loading...</span>}

    {/* render listings*/}
    <div className={styles.container}>
      {!loading && listings && listings.map((listing) => {
        return (
          <Link
          key={listing.id}
          href={`/${listing.nftAddress}/${listing.tokenId}`}
          >
            <a>
              <Listing 
              nftAddress={listing.nftAddress}
              tokenId={listing.tokenId}
              price={listing.price}
              seller={listing.seller}
              />
            </a>
          </Link>
        );
      })}
    </div>
    {!loading && listings && listings.length === 0 && (
      <span>No Listings found </span>
    )}

    </>
  )
}