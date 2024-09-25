// AuctionList.js
import React from "react";
import { useNavigate } from "react-router-dom";

const auctions = [
  {
    id: 1,
    title: "Vintage Car",
    description: "A rare vintage car from 1920s.",
    price: "$50,000",
  },
  {
    id: 2,
    title: "Antique Watch",
    description: "Classic Rolex from 1950s.",
    price: "$10,000",
  },
  {
    id: 3,
    title: "Painting by Picasso",
    description: "A famous Picasso painting from his blue period.",
    price: "$100,000",
  },
];

const AuctionList = () => {
  const navigate = useNavigate();

  const handleMoreInfo = (id) => {
    // Handle navigation to a specific auction detail page or show more info
    console.log("More info about auction:", id);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <header className="bg-gray-800 text-yellow-400 px-6 py-4 text-2xl font-bold">
        Auctions
      </header>

      <section className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {auctions.map((auction) => (
            <div key={auction.id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-2 text-yellow-400">
                {auction.title}
              </h2>
              <p className="text-gray-300 mb-4">{auction.description}</p>
              <p className="text-lg font-semibold mb-4">{auction.price}</p>
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                onClick={() => handleMoreInfo(auction.id)} // Handle More Info button
              >
                More Info
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* <footer className="w-full bg-gray-800 py-6 text-center">
        <p className="text-gray-400">© 2024 E-Auction. All rights reserved.</p>
      </footer> */}
    </div>
  );
};

export default AuctionList;
