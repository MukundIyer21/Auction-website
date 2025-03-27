import React, { useState } from "react";
import Navbar from "./Navbar";
import { motion } from "framer-motion";

const AddProduct = () => {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState(Array(6).fill(null));

  const handleImageChange = (index, event) => {
    const files = event.target.files;
    if (files.length > 0) {
      const newImages = [...images];
      newImages[index] = URL.createObjectURL(files[0]);
      setImages(newImages);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    alert("Product added successfully! (Integrate with backend)");
  };

  return (
    <>
      <Navbar />
      <div className="bg-white text-black  flex flex-col items-center">
        <motion.section
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center justify-center flex-grow text-center mt-10 px-4 md:px-0"
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-blue-600">
            Add Your Product
          </h1>
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl bg-gray-100 p-6 rounded-lg shadow-md"
          >
            <div className="mb-4">
              <label className="block text-left text-gray-700 font-semibold mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-left text-gray-700 font-semibold mb-2">
                Product Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                rows="4"
                required
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="block text-left text-gray-700 font-semibold mb-2">
                Upload 6 Images
              </label>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                {images.map((img, index) => (
                  <div key={index} className="flex flex-col items-center">
                    {img && (
                      <img
                        src={img}
                        alt={`Preview ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-md border border-gray-300 mb-2"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(index, e)}
                      className="text-sm"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.1 }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-lg mt-4"
            >
              Submit Product
            </motion.button>
          </form>
        </motion.section>
      </div>
    </>
  );
};

export default AddProduct;
