import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Marquee from "react-fast-marquee";
import apiService from "../utils/methods";
import { toast } from "react-hot-toast";

const Landing = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopCategories = async () => {
      setLoading(true);
      const [success, response] = await apiService.getTopCategories(10);

      if (success) {
        setCategories(response.categories);
      } else {
        toast.error(`Failed to fetch categories: ${response}`);
        setCategories(["cooking utensils", "storage boxes", "antiques", "electronics", "furniture"]);
      }
      setLoading(false);
    };

    fetchTopCategories();
  }, []);

  return (
    <>
      <div className="bg-white text-black min-h-screen flex flex-col items-center">
        <motion.section
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center justify-center flex-grow text-center mt-10 px-4 md:px-0"
        >
          <h1 className="text-3xl md:text-6xl font-bold mb-4">
            Welcome to <span className="text-blue-600">Smartbid</span>
          </h1>
          <p className="text-md md:text-xl text-gray-600 mb-6 max-w-3xl">The ultimate place to buy and sell goods online through bidding.</p>
          <div className="mx-10 mb-10 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.1 }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-lg mt-4 mb-4 mx-3 md:mt-6"
              onClick={() => navigate("/auctions")}
            >
              Explore Auctions
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-lg mt-4 mb-4 mx-3 md:mt-6"
              onClick={() => navigate("/add-item")}
            >
              Add your product
            </motion.button>
          </div>
        </motion.section>

        <motion.section className="w-full py-8 bg-white mt-16">
          <div className="mx-10 px-8">
            <h2 className="text-3xl font-bold text-center mb-8">
              Shop by <span className="text-blue-600">Category</span>
            </h2>
            {loading ? (
              <p className="text-center text-gray-600">Loading categories...</p>
            ) : (
              <Marquee gradient={false} speed={50}>
                {categories.map((category, index) => (
                  <motion.div
                    key={index}
                    className="bg-gray-200 text-center p-4 mx-4 rounded-lg cursor-pointer"
                    onClick={() => navigate(`/category/${typeof category === "string" ? category.toLowerCase().replace(/ /g, "-") : category}`)}
                  >
                    <h3 className="text-xl font-semibold text-blue-600 capitalize">{typeof category === "string" ? category : category}</h3>
                  </motion.div>
                ))}
              </Marquee>
            )}
          </div>
        </motion.section>

        <footer className="w-full bg-gray-100 py-6 mt-8 text-center">
          <p className="text-gray-600">© 2025 E-Auction. All rights reserved. | Designed with ❤️</p>
        </footer>
      </div>
    </>
  );
};

export default Landing;
