import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import apiService from "../utils/methods";
import { SignalingManager } from "../utils/SignalingManager";

const ItemDetail = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [currentBidPrice, setCurrentBidPrice] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [similarItems, setSimilarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  const signalingManagerRef = useRef(null);

  const convertRatingToNumber = (rating) => {
    const ratingMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    return ratingMap[rating] || 0;
  };

  const handleBidUpdate = (newPrice) => {
    const numericPrice = Number(newPrice);
    setCurrentBidPrice(numericPrice);

    if (!isNaN(numericPrice)) {
      setBidAmount((numericPrice + 1.0).toFixed(2));
    } else {
      setBidAmount("0.00");
    }

    toast.success(`Bid updated! New price: $${newPrice}`);
  };

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const fetchItemDetails = async () => {
      setLoading(true);
      const [success, data] = await apiService.getItem(id);

      if (success) {
        setItem(data.item_details);

        const numericBidPrice = Number(data.current_bid_price);
        setCurrentBidPrice(numericBidPrice);
        setSimilarItems(data.similar_items_details || []);

        if (!isNaN(numericBidPrice) && numericBidPrice !== -1) {
          setBidAmount((numericBidPrice + 1.0).toFixed(2));
        }

        if (data.item_details && data.item_details.auction_end) {
          startTimer(data.item_details.auction_end);
        }
      } else {
        toast.error(`Error: ${data}`);
        navigate("/auctions");
      }
      setLoading(false);
    };

    const startTimer = (auctionEndTime) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      let endTimeMs;
      try {
        if (auctionEndTime && auctionEndTime.$date && auctionEndTime.$date.$numberLong) {
          endTimeMs = parseInt(auctionEndTime.$date.$numberLong);
        } else if (typeof auctionEndTime === "string" || typeof auctionEndTime === "number") {
          endTimeMs = new Date(auctionEndTime).getTime();
        } else {
          console.error("Invalid auction end time format:", auctionEndTime);
          setTimeLeft("Invalid end time");
          return;
        }

        if (isNaN(endTimeMs)) {
          console.error("Parsed time is NaN:", auctionEndTime);
          setTimeLeft("Invalid end time");
          return;
        }

        const calculateTimeLeft = () => {
          const now = new Date().getTime();
          const difference = endTimeMs - now;

          if (difference <= 0) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setTimeLeft("Auction Ended");
          } else {
            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
          }
        };

        calculateTimeLeft();

        intervalRef.current = setInterval(calculateTimeLeft, 1000);
      } catch (error) {
        console.error("Error in timer setup:", error);
        setTimeLeft("Timer error");
      }
    };

    fetchItemDetails();

    const userAddress = localStorage.getItem("smartbid-address");
    if (userAddress) {
      signalingManagerRef.current = new SignalingManager(userAddress);

      signalingManagerRef.current.sendMessage({
        method: "SUBSCRIBE",
        params: [id],
      });

      signalingManagerRef.current.registerCallback("BIDUPDATE", handleBidUpdate, `item-${id}-bid-update`);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (signalingManagerRef.current) {
        signalingManagerRef.current.sendMessage({
          method: "UNSUBSCRIBE",
          params: [id],
        });

        signalingManagerRef.current.deRegisterCallback("BIDUPDATE", `item-${id}-bid-update`);
      }
    };
  }, [id, navigate]);

  const handleBidSubmit = async () => {
    const userAddress = localStorage.getItem("smartbid-address");

    if (!userAddress) {
      toast.error("Please login to place a bid");
      return;
    }

    let incrementation;

    if (currentBidPrice === -1) {
      incrementation = 50.0;
    } else {
      if (!bidAmount) {
        toast.error("Please enter a bid amount");
        return;
      }

      const numericBidAmount = parseFloat(bidAmount);
      const numericCurrentBidPrice = Number(currentBidPrice);

      if (isNaN(numericBidAmount) || isNaN(numericCurrentBidPrice)) {
        toast.error("Invalid bid amount or current price");
        return;
      }

      incrementation = numericBidAmount - numericCurrentBidPrice;

      if (incrementation <= 0) {
        toast.error("Your bid must be higher than the current price!");
        return;
      }
    }

    const [success, response] = await apiService.placeBid(id, incrementation, userAddress);

    if (success) {
      toast.success("Bid placed successfully!");
      const [itemSuccess, itemData] = await apiService.getItem(id);
      if (itemSuccess) {
        setItem(itemData.item_details);

        const numericBidPrice = Number(itemData.current_bid_price);
        setCurrentBidPrice(numericBidPrice);

        if (!isNaN(numericBidPrice) && numericBidPrice !== -1) {
          setBidAmount((numericBidPrice + 1.0).toFixed(2));
        }
      }
    } else {
      toast.error(`Failed to place bid: ${response}`);
    }
  };

  if (loading) {
    return <p className="text-center text-black">Loading item details...</p>;
  }

  if (!item) {
    return <p className="text-center text-black">Item not found</p>;
  }

  const getMinimumBidValue = () => {
    const numericCurrentBidPrice = Number(currentBidPrice);
    if (isNaN(numericCurrentBidPrice) || numericCurrentBidPrice === -1) {
      return "0.01";
    }
    return (numericCurrentBidPrice + 0.01).toFixed(2);
  };

  return (
    <>
      <div className="bg-white text-black px-20 py-10 flex flex-col lg:flex-row justify-evenly">
        <div className="flex flex-col items-center lg:items-start lg:w-1/2 space-y-4">
          <img src={item.images?.[0] || "placeholder.jpg"} alt="Main Item" className="w-96 h-80 object-cover rounded-lg shadow-lg border border-gray-300" />
          <div className="flex space-x-2">
            {item.images?.slice(1).map((img, index) => (
              <img key={index} src={img} alt={`Item ${index + 1}`} className="w-24 h-20 object-cover rounded-lg shadow-md border border-gray-300" />
            ))}
          </div>
        </div>

        <div className="lg:w-1/3 flex flex-col items-center lg:items-start space-y-4">
          <h1 className="text-4xl font-bold text-gray-800 capitalize">{item.title}</h1>
          <p className="text-gray-700 text-lg capitalize">{item.description}</p>
          <p className="text-gray-600 text-lg capitalize">
            <span className="font-semibold">Category:</span> {item.category}
          </p>
          <p className="text-lg font-semibold text-gray-800">
            Base Price: <span className="text-gray-700">$ {item.base_price}</span>
          </p>
          <p className="text-lg font-semibold text-gray-800">
            Current Price: <span className="text-green-600">{currentBidPrice !== -1 ? `$ ${currentBidPrice}` : "No bids yet"}</span>
          </p>
          <p className="text-lg font-semibold text-gray-700">Rating: ⭐ {convertRatingToNumber(item.rating)}</p>
          <p className="text-lg font-semibold text-gray-700">
            Status: <span className={item.status === "ACTIVE" ? "text-green-600" : "text-red-600"}>{item.status}</span>
          </p>
          <p className="text-lg font-semibold text-red-600">Auction will end in: {timeLeft}</p>

          {item.status === "ACTIVE" && (
            <>
              {currentBidPrice === -1 ? (
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg w-full transition-all" onClick={handleBidSubmit}>
                  Place First Bid (${item.base_price})
                </button>
              ) : (
                <>
                  <input
                    type="number"
                    className="border border-gray-400 p-2 rounded-lg w-full"
                    placeholder="Enter your bid amount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    step="0.01"
                    min={getMinimumBidValue()}
                  />
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg w-full transition-all" onClick={handleBidSubmit}>
                    Place a Bid
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {similarItems.length > 0 && (
        <div className="bg-white py-5 px-8">
          <h2 className="text-3xl font-bold text-center mb-6">Similar Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarItems.map((item) => (
              <div key={item._id} className="bg-gray-100 p-5 rounded-lg shadow-lg border border-gray-300">
                <img src={item.images?.[0] || "placeholder.jpg"} alt={item.title} className="w-full h-40 object-contain rounded-md" />
                <h2 className="text-xl font-bold mt-2 text-gray-800 capitalize">{item.title}</h2>
                <p className="text-gray-600 mb-2 truncate capitalize">{item.description}</p>
                <p className="text-lg font-semibold mb-2 text-gray-700">Price: ${item.base_price}</p>
                <p className="text-lg font-semibold mb-4 text-gray-700">Status: {item.status}</p>
                <button className="bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white px-4 py-2 rounded w-full transition-all" onClick={() => navigate(`/auction/${item._id}`)}>
                  View Item
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ItemDetail;
