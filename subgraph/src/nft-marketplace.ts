import {
  ListingCanceled,
  ListingsCreated,
  ListingPurchased,
  ListingUpdated,
} from "../generated/NFTMarketplace/NFTMarketplace";
import {store} from "@graphprotocol/graph-ts";
import {ListingEntity} from "../generated/schema";

export function handleListingsCreated(event: ListingsCreated): void {
  // Create a unique ID that refers to the listing
  // The NFT contract address + Token ID + seller address can be used to uniquely refer
  // to a specific listing
  const id = 
  event.params.nftAddress.toHex() +
  "-" +
  event.params.tokenId.toString() +
  "-" +
  event.params.seller.toHex();

  // Create a new entity and assign its ID 
  let listing = new ListingEntity(id);

  // Set the properties of the listing as defined in the schema
  // based on the events
  listing.seller = event.params.seller;
  listing.nftAddress = event.params.nftAddress;
  listing.tokenId = event.params.tokenId;
  listing.price = event.params.price;

  // save the listing 
  listing.save();
}
export function handleListingCanceled(event: ListingCanceled): void {
  // Recreate teh ID that refers to the listing 
  // Since the listing is being updated, the datastore must already have an entity with that ID 
  // from whent eh listing was first created

  const id = 
    event.params.nftAddress.toHex() +
    "-" +
    event.params.tokenId.toString() +
    "-" +
    event.params.seller.toHex();

    // Load the ID to see if it exists
    let listing = ListingEntity.load(id);

    // if it does
    if (listing) {
      // remove it from the store
      store.remove("ListingEntity", id)
    }
}
export function handleListingPurchased(event: ListingPurchased): void {
  // Recreate the ID that refers to the listing 
  // since the listing is being updated it must already exist in the datastore
  // from when the first listing was created
  const id = 
    event.params.nftAddress.toHex() +
    "-" +
    event.params.tokenId.toString() + 
    "-" +
    event.params.seller.toHex()

    // attempt to load a pre-existing entity instead of creating a new one
    let listing = ListingEntity.load(id)

    // if exist 
    if (listing) {
      // set the buyer
      listing.buyer = event.params.buyer;

      // save changes
      listing.save();
    }
}
export function handleListingUpdated(event: ListingUpdated): void {
  // Recreate teh ID that refers to teh listing
  // Since the listing is being updated
  // teh datastore must already have an entity with this ID
  // from when the listing was first created
  const id = 
    event.params.nftAddress.toHex() +
    "-" +
    event.params.tokenId.toString() + 
    "-" +
    event.params.seller.toHex();

    // Attempt to load a pre-existing entity instead of creating a new one
    let listing = ListingEntity.load(id);

    // if it exists
    if (listing) {
      // Update teh price
      listing.price = event.params.newPrice;

      // save teh changes
      listing.save();
    }
}