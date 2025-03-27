import React,{useState} from 'react'
import { FaBars, FaTimes } from "react-icons/fa";
import logo from "./logo1.jpg"; 
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';

const Navbar = () => {

const navigate=useNavigate();

const [navOpen, setNavOpen] = useState(false);

const handleToggle = () => {
      setNavOpen(!navOpen);
};

  return (
    <motion.section className="bg-gray-100 text-black px-6 py-2 flex justify-between items-center shadow-lg" >
      <div className="flex items-center cursor-pointer">
        <img src={logo} alt="Smartbid Logo" className="h-[65px]  " />
      </div>

      {/* Menu Icon for Mobile View */}
      <div className="md:hidden text-3xl cursor-pointer" onClick={handleToggle}>
        {navOpen ? <FaTimes /> : <FaBars />}
      </div>

      {/* Menu Items */}
      <ul className={`md:flex md:space-x-6 absolute md:static bg-gray-100 w-full md:w-auto transition-all duration-300 ease-in-out ${navOpen ? "top-16 left-0" : "top-[-100%]"}`}>
        <li className="text-lg my-2 md:my-0">
          <a href="#home" className="block py-2 px-4 hover:text-yellow-500 transition-colors">Home</a>
        </li>
        <li className="text-lg my-2 md:my-0">
          <a href="#about" className="block py-2 px-4 hover:text-yellow-500 transition-colors">About</a>
        </li>
        <li className="text-lg my-2 md:my-0">
          <a href="#auctions" className="block py-2 px-4 hover:text-yellow-500 transition-colors" onClick={() => navigate("/auctions")}>Auctions</a>
        </li>
        <li className="text-lg my-2 md:my-0">
          <a href="#contact" className="block py-2 px-4 hover:text-yellow-500 transition-colors">Contact</a>
        </li>
      </ul>
    </motion.section>
  )
}

export default Navbar
