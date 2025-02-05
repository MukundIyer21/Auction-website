import React from "react";
import Navbar from "./Navbar";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";


const Landing = () => {
  const navigate = useNavigate(); 

  const handleExploreClick = () => {
    navigate("/auctions"); 
  };

  return (
    <>
    <Navbar/>
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center">
      <motion.section
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center justify-center flex-grow text-center mt-10 px-4 md:px-0"
      >
        <h1 className="text-3xl md:text-6xl font-bold mb-4">
          Welcome to <span className="text-yellow-400">Smartbid</span>
        </h1>
        <p className="text-md md:text-xl text-gray-300 mb-6 max-w-3xl">
          The ultimate place to buy and sell goods online through bidding.
        </p>
        <motion.button
          whileHover={{ scale: 1.1 }}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold text-lg mt-4 mb-3 md:mt-6"
          onClick={handleExploreClick}
        >
          Explore Auctions
        </motion.button>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="w-full py-16 bg-gray-800"
      >
        <div className="container mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            Why Choose <span className="text-yellow-400">Smartbid?</span>
          </h2>
          <div className="flex flex-col md:flex-row justify-around items-center">
  
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gray-700 text-center p-6 m-4 rounded-lg w-full md:w-1/3"
            >
              <h3 className="text-2xl font-semibold mb-2 text-yellow-400">
                Secure Payments
              </h3>
              <p className="text-gray-300">
                We offer secure and fast payment methods for hassle-free bidding.
              </p>
            </motion.div>


            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gray-700 text-center p-6 m-4 rounded-lg w-full md:w-1/3"
            >
              <h3 className="text-2xl font-semibold mb-2 text-yellow-400">
                Global Reach
              </h3>
              <p className="text-gray-300">
                Buy and sell from anywhere in the world with ease.
              </p>
            </motion.div>


            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gray-700 text-center p-6 m-4 rounded-lg w-full md:w-1/3"
            >
              <h3 className="text-2xl font-semibold mb-2 text-yellow-400">
                24/7 Support
              </h3>
              <p className="text-gray-300">
                Our support team is available round the clock to assist you.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>


      <footer className="w-full bg-gray-800 py-6 mt-8 text-center">
        <p className="text-gray-400">
          © 2024 E-Auction. All rights reserved. | Designed with ❤️
        </p>
      </footer>
    </div>
    </>
  )
}

export default Landing
