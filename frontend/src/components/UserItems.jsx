import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import apiService from "../utils/methods.js";
import { toast } from "react-hot-toast";
import LoadingSpinner from "./Loading.jsx";

const UserItems = () => {
  const [userItems, setUserItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState({});
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  const convertRatingToNumber = (rating) => {
    const ratingMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    return ratingMap[rating] || 0;
  };

  const truncateString = (str, maxLength) => {
    return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
  };

  const getUserAddress = () => {
    return localStorage.getItem("smartbid-address");
  };

  useEffect(() => {
    const fetchUserItems = async () => {
      setLoading(true);
      const userAddress = getUserAddress();

      if (!userAddress) {
        toast.error("Please connect your wallet to view your items");
        navigate("/");
        return;
      }

      const [success, response] = await apiService.getUserItems(userAddress);

      if (success) {
        setUserItems(response.items);
      } else {
        toast.error(`Failed to fetch your items: ${response}`);
      }
      setLoading(false);
    };

    fetchUserItems();
  }, [navigate]);

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setShowConfirmation(true);
  };

  const cancelDelete = () => {
    setItemToDelete(null);
    setShowConfirmation(false);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    const itemId = itemToDelete._id;
    const userAddress = getUserAddress();

    if (!userAddress) {
      toast.error("Please connect your wallet");
      return;
    }

    setDeleting((prev) => ({ ...prev, [itemId]: true }));
    setShowConfirmation(false);

    try {
      const [success, response] = await apiService.deleteItem(itemId, userAddress);

      if (success) {
        toast.success("Item deletion initiated");

        if (response && response.operation_id) {
          toast.custom(
            (t) => (
              <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex`}>
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">Operation ID: {response.operation_id}</p>
                      <p className="text-sm text-gray-500">Track the status of your deletion</p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(response.operation_id);
                      toast.success("Operation ID copied!");
                      toast.dismiss(t.id);
                    }}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ),
            { duration: 7000 }
          );

          navigate("/operations");
        }
      } else {
        toast.error(`Failed to delete item: ${response}`);
      }
    } catch (error) {
      toast.error("An error occurred while deleting the item");
      console.error("Error deleting item:", error);
    } finally {
      setDeleting((prev) => ({ ...prev, [itemId]: false }));
      setItemToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="m-20">
        <LoadingSpinner message="Loading Your Items" size="large" />
      </div>
    );
  }

  if (userItems.length === 0) {
    return (
      <div className="bg-gray-100 text-black min-h-screen p-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">My Items</h1>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
          <svg className="w-20 h-20 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            ></path>
          </svg>
          <h2 className="text-xl font-semibold mt-4 mb-2">No Items Found</h2>
          <p className="text-gray-600 mb-6">You don't have any items listed for auction yet.</p>
          <motion.button whileHover={{ scale: 1.05 }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold" onClick={() => navigate("/add-item")}>
            Add Your First Item
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 text-black min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Items</h1>
          <motion.button whileHover={{ scale: 1.05 }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold" onClick={() => navigate("/add-item")}>
            Add New Item
          </motion.button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {userItems.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col overflow-hidden"
            >
              <div className="relative pb-[56.25%] overflow-hidden">
                <img src={item.images.length > 0 ? item.images[0] : "/placeholder.jpg"} alt={item.title} className="absolute top-0 left-0 w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-white p-1 rounded-full shadow">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : item.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : item.status === "SOLD"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <h2 className="text-lg font-bold text-gray-800 capitalize truncate">{item.title}</h2>
                <p className="text-gray-600 text-sm mb-2 overflow-hidden line-clamp-2">{truncateString(item.description, 80)}</p>

                <div className="mt-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Base Price</span>
                    <span className="font-semibold">${item.base_price.toFixed(2)}</span>
                  </div>

                  {item.current_bid_price && item.current_bid_price > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Current Bid</span>
                      <span className="font-semibold text-blue-600">${item.current_bid_price.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rating</span>
                    <span className="font-medium">⭐ {convertRatingToNumber(item.rating)}</span>
                  </div>

                  <div className="flex pt-3 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex-1 transition-all"
                      onClick={() => navigate(`/auction/${item._id}`)}
                    >
                      View
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className={`bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded transition-all ${deleting[item._id] || item.status === "SOLD" ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => confirmDelete(item)}
                      disabled={deleting[item._id] || item.status === "SOLD"}
                    >
                      {deleting[item._id] ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Deleting...
                        </div>
                      ) : (
                        "Delete"
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">{itemToDelete?.title}</span>? This action cannot be undone.
              </p>

              {itemToDelete?.current_bid_price > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">This item already has bids. Deleting it may affect your seller rating.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 justify-end">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium" onClick={cancelDelete}>
                  Cancel
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium" onClick={handleDeleteItem}>
                  Delete Item
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserItems;
