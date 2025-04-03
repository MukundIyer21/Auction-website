import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiService from "../utils/methods";
import LoadingSpinner from "./Loading";
import { toast } from "react-hot-toast";

const SearchResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get("query");

  const convertRatingToNumber = (rating) => {
    const ratingMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    return ratingMap[rating] || 0;
  };

  const truncateString = (str, maxLength) => {
    return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
  };

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      const [success, response] = await apiService.searchItems(query, 20);

      if (success) {
        setResults(response.results);
      } else {
        toast.error(`Search failed: ${response}`);
        setResults([]);
      }
      setLoading(false);
    };

    if (query) {
      fetchSearchResults();
    }
  }, [query]);

  if (loading) {
    return (
      <div className="m-20">
        <LoadingSpinner message={`Searching for "${query}"`} size="large" />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 text-black min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Search Results for "{query}"</h1>

      {results.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-xl font-semibold">No results found</h2>
          <p className="text-gray-600 mt-2">Try different keywords or browse categories</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {results.map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col ">
              <div className="p-4 h-40 flex items-center justify-center">
                <img src={item.images.length > 0 ? item.images[0] : "placeholder.jpg"} alt={item.title} className="max-h-full max-w-full object-contain rounded-md" />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h2 className="text-lg font-bold text-gray-800 capitalize truncate">{item.title}</h2>
                <p className="text-gray-600 text-sm mb-2 overflow-hidden line-clamp-2">{truncateString(item.description, 32)}</p>
                <p className="text-gray-600 text-sm mb-2 overflow-hidden line-clamp-2 capitalize">Category : {truncateString(item.category, 32)}</p>
                <p className="text-sm font-semibold text-gray-700 mt-auto">Rating : ⭐ {convertRatingToNumber(item.rating)}</p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full mt-2 transition-all" onClick={() => navigate(`/auction/${item._id}`)}>
                  More Info
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
