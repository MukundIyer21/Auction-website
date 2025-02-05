import React,{useState} from 'react'
import { FaBars, FaTimes } from "react-icons/fa";



const Navbar = () => {

const [navOpen, setNavOpen] = useState(false);

const handleToggle = () => {
      setNavOpen(!navOpen);
};

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
      <div className="text-2xl font-bold text-yellow-400">
        <h2>Smartbid</h2>
      </div>

      {/* Menu Icon for Mobile View */}
      <div className="md:hidden text-3xl cursor-pointer" onClick={handleToggle}>
        {navOpen ? <FaTimes /> : <FaBars />}
      </div>

      {/* Menu Items */}
      <ul className={`md:flex md:space-x-6 absolute md:static bg-gray-800 w-full md:w-auto transition-all duration-300 ease-in-out ${navOpen ? "top-16 left-0" : "top-[-100%]"}`}>
        <li className="text-lg my-2 md:my-0">
          <a href="#home" className="block py-2 px-4 hover:text-yellow-400">Home</a>
        </li>
        <li className="text-lg my-2 md:my-0">
          <a href="#about" className="block py-2 px-4 hover:text-yellow-400">About</a>
        </li>
        <li className="text-lg my-2 md:my-0">
          <a href="#auctions" className="block py-2 px-4 hover:text-yellow-400">Auctions</a>
        </li>
        <li className="text-lg my-2 md:my-0">
          <a href="#contact" className="block py-2 px-4 hover:text-yellow-400">Contact</a>
        </li>
        {/* <li className="my-2 md:my-0">
          <a href="#login" className="block py-2 px-4 bg-yellow-500 rounded hover:bg-yellow-600 text-white">
            Login
          </a>
        </li> */}
      </ul>
    </nav>
  )
}

export default Navbar
