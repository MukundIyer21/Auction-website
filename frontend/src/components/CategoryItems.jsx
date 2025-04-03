import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import apiService from "../utils/methods";
import LoadingSpinner from "./Loading";

const CategoryItems = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const convertRatingToNumber = (rating) => {
    const ratingMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    return ratingMap[rating] || 0;
  };

  const truncateString = (str, maxLength) => {
    return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
  };

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const [success, response] = await apiService.getItemsByCategory(categoryName);

      if (success) {
        setItems(response.items);
      } else {
        toast.error(`Error: ${response}`);
        navigate("/auctions");
      }
      setLoading(false);
    };

    fetchItems();
  }, [categoryName, navigate]);

  if (loading) {
    return (
      <div className="m-20">
        <LoadingSpinner message="Loading Category Items" size="large" />
      </div>
    );
  }

  return (
    <div className="m-8">
      <button className="mb-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg" onClick={() => navigate("/")}>
        Back to Categories
      </button>
      <h2 className="text-2xl font-bold mb-4 text-gray-800 capitalize">{categoryName.replace(/-/g, " ")}</h2>
      {items.length === 0 ? (
        <p className="text-center text-gray-600">No items found in this category.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {items.map((item) => (
            <div key={item._id} className="bg-white p-5 rounded-lg shadow-lg border border-gray-200">
              <img src={item.images.length > 0 ? item.images[0] : "placeholder.jpg"} alt={item.title} className="w-full h-40 object-contain rounded-md" />
              <h2 className="text-xl font-bold mt-2 text-gray-800 capitalize">{item.title}</h2>
              <p className="text-gray-600 mb-2 capitalize">{truncateString(item.description, 32)}</p>
              <p className="text-lg font-semibold mb-4 text-gray-700">Rating: ⭐ {convertRatingToNumber(item.rating)}</p>
              <button className="bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white px-4 py-2 rounded w-full transition-all" onClick={() => navigate(`/auction/${item._id}`)}>
                More Info
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryItems;
