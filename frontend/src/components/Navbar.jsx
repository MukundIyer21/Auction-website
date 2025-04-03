import React, { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import logo from "./logo1.jpg";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";

const Navbar = () => {
  const navigate = useNavigate();

  const [navOpen, setNavOpen] = useState(false);

  const handleToggle = () => {
    setNavOpen(!navOpen);
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <motion.section className="bg-gray-100 text-black px-6 py-2 flex flex-wrap justify-between items-center shadow-lg">
      <div className="flex items-center cursor-pointer">
        <img src={logo} alt="Smartbid Logo" className="h-[65px]" onClick={handleLogoClick} />
      </div>

      <div className="order-3 md:order-2 w-full md:w-auto mt-4 md:mt-0 md:mx-4 md:flex-1 md:max-w-md">
        <SearchBar />
      </div>

      <div className="md:hidden text-3xl cursor-pointer order-2 md:order-3" onClick={handleToggle}>
        {navOpen ? <FaTimes /> : <FaBars />}
      </div>

      <ul className={`md:flex md:space-x-6 absolute md:static bg-gray-100 w-full md:w-auto transition-all duration-300 ease-in-out order-4 ${navOpen ? "top-16 left-0" : "top-[-100%]"}`}>
        <li className="text-lg my-2 md:my-0">
          <p className="cursor-pointer block py-2 px-4 hover:text-yellow-500 transition-colors" onClick={() => navigate("/")}>
            Home
          </p>
        </li>
        <li className="text-lg my-2 md:my-0">
          <p className="cursor-pointer block py-2 px-4 hover:text-yellow-500 transition-colors" onClick={() => navigate("/operation")}>
            Operation Status
          </p>
        </li>
        <li className="text-lg my-2 md:my-0">
          <p className="cursor-pointer block py-2 px-4 hover:text-yellow-500 transition-colors" onClick={() => navigate("/auctions")}>
            Auctions
          </p>
        </li>
        <li className="text-lg my-2 md:my-0">
          <p className="cursor-pointer block py-2 px-4 hover:text-yellow-500 transition-colors" onClick={() => navigate("/user/items")}>
            My Items
          </p>
        </li>
      </ul>
    </motion.section>
  );
};

export default Navbar;
