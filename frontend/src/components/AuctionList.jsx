import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../utils/methods.js";
import { toast } from "react-hot-toast";

const AuctionList = () => {
  const [homeData, setHomeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const convertRatingToNumber = (rating) => {
    const ratingMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    return ratingMap[rating] || 0;
  };

  const truncateString = (str, maxLength) => {
    return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      const [success, response] = await apiService.getHomePage();

      if (success) {
        setHomeData(response.home);
      } else {
        toast.error(`Failed to fetch home page data: ${response}`);
      }
      setLoading(false);
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-600 p-8">Loading auction items...</p>;
  }

  return (
    <div className="bg-gray-100 text-black min-h-screen">
      <section className="p-8">
        {homeData.map((categoryData) => (
          <div key={categoryData.category} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 capitalize">{categoryData.category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {categoryData.items.map((item) => (
                <div key={item._id} className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col h-80">
                  <div className="p-4 h-40 flex items-center justify-center">
                    <img src={item.images.length > 0 ? item.images[0] : "placeholder.jpg"} alt={item.title} className="max-h-full max-w-full object-contain rounded-md" />
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h2 className="text-lg font-bold text-gray-800 capitalize truncate">{item.title}</h2>
                    <p className="text-gray-600 text-sm mb-2 overflow-hidden line-clamp-2">{truncateString(item.description, 32)}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-auto">Rating : ⭐ {convertRatingToNumber(item.rating)} </p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full mt-2 transition-all" onClick={() => navigate(`/auction/${item._id}`)}>
                      More Info
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg" onClick={() => navigate(`/category/${categoryData.category}`)}>
              View All in <span className="capitalize">{categoryData.category}</span>
            </button>
          </div>
        ))}
      </section>
    </div>
  );
};

export default AuctionList;
