import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const AuctionList = () => {
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetch("http://localhost:5000/api/items")
      .then((res) => res.json())
      .then((data) => {
        setAuctions(data);
        const grouped = data.reduce((acc, item) => {
          item.category.forEach((cat) => {
            if (!acc[cat]) acc[cat] = [];
            if (acc[cat].length < 6) acc[cat].push(item);
          });
          return acc;
        }, {});
        setCategories(grouped);
      })
      .catch((err) => console.error("Error fetching auctions:", err));
  }, []);

  return (
    <div className="bg-gray-100 text-black min-h-screen">
      <Navbar />
      <section className="p-8">
        {!selectedCategory ? (
          Object.keys(categories).map((category) => (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {categories[category].map((auction) => (
                  <div
                    key={auction.id}
                    className="bg-white p-5 rounded-lg shadow-lg border border-gray-200"
                  >
                    <img
                      src={auction.images[0] || "placeholder.jpg"}
                      alt={auction.title}
                      className="w-full h-40 object-contain rounded-md"
                    />
                    <h2 className="text-xl font-bold mt-2 text-gray-800">
                      {auction.title}
                    </h2>
                    <p className="text-gray-600 mb-2">{auction.description}</p>
                    <p className="text-lg font-semibold mb-4 text-gray-700">
                      Rating: {auction.rating}
                    </p>
                    <button
                      className="bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white px-4 py-2 rounded w-full transition-all"
                      onClick={() => navigate(`/auction/${auction.id}`)}
                    >
                      More Info
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="mt-4 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
                onClick={() => setSelectedCategory(category)}
              >
                View All in {category}
              </button>
            </div>
          ))
        ) : (
          <div>
            <button
              className="mb-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              onClick={() => setSelectedCategory(null)}
            >
              Back to Categories
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{selectedCategory}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {auctions.filter((item) => item.category.includes(selectedCategory)).map((auction) => (
                <div key={auction.id} className="bg-white p-5 rounded-lg shadow-lg border border-gray-200">
                  <img
                    src={auction.images[0] || "placeholder.jpg"}
                    alt={auction.title}
                    className="w-full h-40 object-contain rounded-md"
                  />
                  <h2 className="text-xl font-bold mt-2 text-gray-800">{auction.title}</h2>
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
          </div>
        )}
      </section>
    </div>
  );
};

export default AuctionList;
