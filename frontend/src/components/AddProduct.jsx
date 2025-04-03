import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import apiService from "../utils/methods";
import { toast } from "react-hot-toast";

const AddProduct = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [auctionDuration, setAuctionDuration] = useState("");
  const [images, setImages] = useState(Array(6).fill(null));
  const [imageFiles, setImageFiles] = useState(Array(6).fill(null));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (index, event) => {
    const files = event.target.files;
    if (files.length > 0) {
      const file = files[0];
      const newImageFiles = [...imageFiles];
      newImageFiles[index] = file;
      setImageFiles(newImageFiles);

      const newImages = [...images];
      newImages[index] = URL.createObjectURL(file);
      setImages(newImages);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success("Operation ID copied to clipboard!", { duration: 2000 });
      },
      (err) => {
        toast.error("Failed to copy operation ID", { duration: 2000 });
        console.error("Failed to copy: ", err);
      }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    const sellerAddress = localStorage.getItem("smartbid-address");

    if (!sellerAddress) {
      toast.error("Please connect your wallet to add a product");
      setIsSubmitting(false);
      return;
    }

    const auctionEndSeconds = parseInt(auctionDuration) * 3600;

    try {
      const validImageFiles = imageFiles.filter((file) => file !== null);

      if (validImageFiles.length === 0) {
        toast.error("At least one image is required");
        setIsSubmitting(false);
        return;
      }

      const base64Images = await Promise.all(validImageFiles.map((file) => fileToBase64(file)));

      const itemDetails = {
        title,
        description,
        images: base64Images,
        category,
        base_price: parseFloat(basePrice),
      };

      const [success, response] = await apiService.createItem(itemDetails, sellerAddress, auctionEndSeconds);

      if (success) {
        toast.success("Your item will be up for auction soon!", { duration: 3000 });

        if (response && response.operation_id) {
          toast.custom(
            (t) => (
              <div className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex`}>
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">Operation ID: {response.operation_id}</p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
                  <button
                    onClick={() => {
                      copyToClipboard(response.operation_id);
                      toast.dismiss(t.id);
                    }}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ),
            { duration: 120000 }
          );
        }

        navigate(`/auction/${response.item_id}`);
      } else {
        toast.error(`Failed to add product: ${response}`);
      }
    } catch (error) {
      toast.error("An error occurred while adding your product");
      console.error("Error adding product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white text-black flex flex-col items-center">
        <motion.section
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center justify-center flex-grow text-center mt-10 px-4 md:px-0 mb-10"
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-blue-600">Add Your Product</h1>
          <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-gray-100 p-6 rounded-lg shadow-md">
            <div className="mb-4">
              <label className="block text-left text-gray-700 font-semibold mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-4">
              <label className="block text-left text-gray-700 font-semibold mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                rows="4"
                required
                disabled={isSubmitting}
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-left text-gray-700 font-semibold mb-2">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-4">
              <label className="block text-left text-gray-700 font-semibold mb-2">Base Price</label>
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                required
                min="0.01"
                step="0.01"
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-4">
              <label className="block text-left text-gray-700 font-semibold mb-2">Auction Duration (hours)</label>
              <input
                type="number"
                value={auctionDuration}
                onChange={(e) => setAuctionDuration(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                required
                min="1"
                max="336"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-1 text-left">Enter the number of hours your auction should run (max 336 hours / 2 weeks)</p>
            </div>

            <div className="mb-4">
              <label className="block text-left text-gray-700 font-semibold mb-2">Upload Images (up to 6)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((img, index) => (
                  <div key={index} className="flex flex-col items-center">
                    {img ? (
                      <img src={img} alt={`Preview ${index + 1}`} className="w-24 h-24 object-cover rounded-md border border-gray-300 mb-2" />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded-md border border-gray-300 mb-2 flex items-center justify-center">
                        <span className="text-gray-400">Image {index + 1}</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(index, e)} className="text-sm" disabled={isSubmitting} />
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1 text-left">At least one image is required</p>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              className={`${isSubmitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"} text-white px-6 py-3 rounded-lg font-semibold text-lg mt-4 w-full`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Product"}
            </motion.button>
          </form>
        </motion.section>
      </div>
    </>
  );
};

export default AddProduct;
