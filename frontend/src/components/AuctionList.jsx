import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const AuctionList = () => {
  const [auctions, setAuctions] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetch("http://localhost:5000/api/items") // 
      .then((res) => res.json())
      .then((data) => setAuctions(data))
      .catch((err) => console.error("Error fetching auctions:", err));
  }, []);

  return (

    <div className="bg-gray-100 text-black min-h-screen">
      <Navbar/>

      <section className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {auctions.map((auction) => (
            <div key={auction.id} className="bg-white p-5 rounded-lg shadow-lg border border-gray-200">
              <img
                src={auction.images[0]} // Display only the first image
                alt={auction.title}
                className="w-full h-40 object-contain rounded-md"
              />
              <h2 className="text-xl font-bold mt-2 text-gray-800">
                {auction.title}
              </h2>
              <p className="text-gray-600 mb-2">{auction.description}</p>
              <p className="text-lg font-semibold mb-4 text-gray-700">Rating: {auction.rating}</p>
              <button
                className="bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white px-4 py-2 rounded w-full transition-all"
                onClick={() => navigate(`/auction/${auction.id}`)}
              >
                More Info
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AuctionList;
