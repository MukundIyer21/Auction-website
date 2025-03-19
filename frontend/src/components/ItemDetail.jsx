import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "./Navbar";

const ItemDetail = () => {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/items/${id}`) // Replace with your backend API URL
      .then((res) => res.json())
      .then((data) => setAuction(data))
      .catch((err) => console.error("Error fetching auction details:", err));
  }, [id]);

  if (!auction) {
    return <p className="text-center text-black">Loading auction details...</p>;
  }

  return (
    <>
    <Navbar/>
    <div className="bg-white text-black min-h-screen px-10 py-20 flex flex-col lg:flex-row justify-evenly">
      {/* Left Section: Images */}
      <div className="flex flex-col items-center lg:items-start lg:w-1/2 space-y-4">
        {/* Main Image */}
        <img
          src={auction.images[0]}
          alt="Main Auction Item"
          className="w-96 h-80 object-cover rounded-lg shadow-lg border border-gray-300"
        />

        {/* Small Images */}
        <div className="flex space-x-2">
          {auction.images.slice(1).map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Auction ${index + 1}`}
              className="w-24 h-20 object-cover rounded-lg shadow-md border border-gray-300"
            />
          ))}
        </div>
      </div>

      {/* Right Section: Bid Info */}
      <div className="lg:w-1/3 flex flex-col items-center lg:items-start space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">{auction.title}</h1>
        <p className="text-gray-600 text-lg">
          Current Price: <span className="text-green-600 font-semibold">$ {auction.price}</span>
        </p>
        <button className="bg-blue-500 hover:bg-blue-600 hover:scale-105 text-white px-6 py-3 rounded-lg font-semibold text-lg w-full transition-all">
          Place a Bid
        </button>
        <p className="text-gray-600">Auction ends on: {auction.auction_end}</p>
      </div>
    </div>
    </>
  );
};

export default ItemDetail;
