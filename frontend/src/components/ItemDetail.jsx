import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";

const ItemDetail = () => {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [bidAmount, setBidAmount] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let interval;

    const fetchAuctionDetails = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/items/${id}`);
        const data = await res.json();
        setAuction(data);
        startTimer(data.auction_end);
      } catch (err) {
        console.error("Error fetching auction details:", err);
      }
    };

    const fetchRecommendedItems = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/items/recommended?limit=16");
        const data = await res.json();
        setRecommendedItems(data);
      } catch (err) {
        console.error("Error fetching recommended items:", err);
      }
    };

    const startTimer = (auctionEndTime) => {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const endTime = new Date(auctionEndTime).getTime();
        const difference = endTime - now;

        if (difference <= 0) {
          clearInterval(interval);
          setTimeLeft("Auction Ended");
        } else {
          const hours = Math.floor(difference / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
    };

    fetchAuctionDetails();
    fetchRecommendedItems();

    return () => clearInterval(interval);
  }, [id]);

  const handleBidSubmit = () => {
    if (!bidAmount || bidAmount <= auction?.price) {
      alert("Your bid must be higher than the current price!");
      return;
    }
    alert(`Bid placed successfully: $${bidAmount}`);
    // Implement backend API call to place a bid
  };

  if (!auction) {
    return <p className="text-center text-black">Loading auction details...</p>;
  }

  return (
    <>
      <Navbar />
      <div className="bg-white text-black px-20 py-10 flex flex-col lg:flex-row justify-evenly">
        {/* Left Section: Images */}
        <div className="flex flex-col items-center lg:items-start lg:w-1/2 space-y-4">
          <img
            src={auction.images?.[0] || "placeholder.jpg"}
            alt="Main Auction Item"
            className="w-96 h-80 object-cover rounded-lg shadow-lg border border-gray-300"
          />
          <div className="flex space-x-2">
            {auction.images?.slice(1).map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Auction ${index + 1}`}
                className="w-24 h-20 object-cover rounded-lg shadow-md border border-gray-300"
              />
            ))}
          </div>
        </div>

        {/* Right Section: Product Info */}
        <div className="lg:w-1/3 flex flex-col items-center lg:items-start space-y-4">
          <h1 className="text-4xl font-bold text-gray-800">{auction.title}</h1>
          <p className="text-gray-700 text-lg">{auction.description}</p>
          <p className="text-gray-600 text-lg">
            <span className="font-semibold">Category:</span> {auction.category?.join(", ") || "N/A"}
          </p>
          <p className="text-lg font-semibold text-gray-800">
            Base Price: <span className="text-gray-700">$ {auction.base_price}</span>
          </p>
          <p className="text-lg font-semibold text-gray-800">
            Current Price: <span className="text-green-600">$ {auction.price}</span>
          </p>
          <p className="text-lg font-semibold text-gray-700">
            Rating: ⭐ {auction.rating} / 5
          </p>
          <p className="text-lg font-semibold text-red-600">
            Auction will end in: {timeLeft}
          </p>
          <input
            type="number"
            className="border border-gray-400 p-2 rounded-lg w-full"
            placeholder="Enter your bid amount"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg w-full transition-all"
            onClick={handleBidSubmit}
          >
            Place a Bid
          </button>
        </div>
      </div>

      {/* Recommended Items Section */}
      <div className="bg-white py-5 px-8">
        <h2 className="text-3xl font-bold text-center mb-6">Recommended Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedItems.map((item) => (
            <div key={item.id} className="bg-gray-100 p-5 rounded-lg shadow-lg border border-gray-300">
              <img
                src={item.images?.[0] || "placeholder.jpg"}
                alt={item.title}
                className="w-full h-40 object-contain rounded-md"
              />
              <h2 className="text-xl font-bold mt-2 text-gray-800">{item.title}</h2>
              <p className="text-gray-600 mb-2">{item.description}</p>
              <p className="text-lg font-semibold mb-4 text-gray-700">Rating: ⭐ {item.rating}</p>
              <button
                className="bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white px-4 py-2 rounded w-full transition-all"
                onClick={() => navigate(`/auction/${item.id}`)}
              >
                More Info
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ItemDetail;
