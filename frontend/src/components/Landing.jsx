import React from "react";
import Navbar from "./Navbar";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const collections = [
  { title: "Cooking Utensils", image: "cooking.jpg" },
  { title: "Storage Boxes", image: "storage.jpg" },
  { title: "Parrot & Peacock Legs", image: "peacock.jpg" },
  { title: "Refreshment Set", image: "refreshment.jpg" },
  { title: "Oil / Ghee / Milk Containers", image: "oil_ghee.jpg" },
  { title: "Betel Nut Box / Paan Daan", image: "betel.jpg" },
  { title: "Copper Lovers", image: "copper.jpg" },
  { title: "Others", image: "others.jpg" },
  { title: "Kamandal", image: "kamandal.jpg" },
  { title: "Miniatures", image: "miniatures.jpg" },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
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
          <p className="text-md md:text-xl text-gray-600 mb-6 max-w-3xl">
            The ultimate place to buy and sell goods online through bidding.
          </p>
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
              onClick={() => navigate("/add-product")}
            >
              Add your product
            </motion.button>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full py-16 bg-gray-100"
        >
          <div className="container mx-auto px-8">
            <h2 className="text-3xl font-bold text-center mb-8">
              Why Choose <span className="text-blue-600">Smartbid?</span>
            </h2>
            <div className="flex flex-col md:flex-row justify-around items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gray-200 text-center p-6 m-4 rounded-lg w-full md:w-1/3"
              >
                <h3 className="text-2xl font-semibold mb-2 text-blue-600">
                  Secure Payments
                </h3>
                <p className="text-gray-700">
                  We offer secure and fast payment methods for hassle-free bidding.
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gray-200 text-center p-6 m-4 rounded-lg w-full md:w-1/3"
              >
                <h3 className="text-2xl font-semibold mb-2 text-blue-600">
                  Global Reach
                </h3>
                <p className="text-gray-700">
                  Buy and sell from anywhere in the world with ease.
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gray-200 text-center p-6 m-4 rounded-lg w-full md:w-1/3"
              >
                <h3 className="text-2xl font-semibold mb-2 text-blue-600">
                  24/7 Support
                </h3>
                <p className="text-gray-700">
                  Our support team is available round the clock to assist you.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full py-8 bg-white mt-16"
        >
          <div className="mx-10 px-8">
            <h2 className="text-3xl font-bold text-center mb-8">
              Shop by <span className="text-blue-600">Category</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-8">
              {collections.map((collection, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-200 text-center p-4 rounded-lg cursor-pointer justify-center"
                  onClick={() => navigate(`/collection/${collection.title.toLowerCase().replace(/ /g, "-")}`)}
                >
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <h3 className="text-xl font-semibold mt-3 text-blue-600">
                    {collection.title}
                  </h3>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <footer className="w-full bg-gray-100 py-6 mt-8 text-center">
          <p className="text-gray-600">
            © 2024 E-Auction. All rights reserved. | Designed with ❤️
          </p>
        </footer>
      </div>
    </>
  );
};

export default Landing;
