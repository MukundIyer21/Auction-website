import React, { useState } from "react";
import { motion } from "framer-motion";
import apiService from "../utils/methods";
import { toast } from "react-hot-toast";

const OperationTracker = () => {
  const [operationId, setOperationId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [operationResult, setOperationResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!operationId.trim()) {
      toast.error("Please enter an operation ID");
      return;
    }

    setIsLoading(true);
    setError(null);
    setOperationResult(null);

    try {
      const [success, response] = await apiService.getOperationStatus(operationId);

      if (success) {
        setOperationResult(response);
        if (response.operation_status === "FAILED") {
          toast.error("Operation failed");
        } else if (response.operation_status === "COMPLETED") {
          toast.success("Operation completed successfully");
        } else {
          toast.info(`Operation status: ${response.operation_status}`);
        }
      } else {
        setError(response || "Failed to fetch operation status");
        toast.error("Failed to fetch operation status");
      }
    } catch (error) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
      console.error("Error fetching operation status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success("Copied to clipboard!", { duration: 2000 });
      },
      (err) => {
        toast.error("Failed to copy text", { duration: 2000 });
        console.error("Failed to copy: ", err);
      }
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600";
      case "FAILED":
        return "text-red-600";
      case "PENDING":
      default:
        return "text-yellow-600";
    }
  };

  const getOperationTypeLabel = (type) => {
    switch (type) {
      case "ADD":
        return "Add Item";
      case "TRANSFER":
        return "Transfer Item";
      case "DELETE":
        return "Delete Item";
      default:
        return type;
    }
  };

  return (
    <div className="bg-white text-black flex flex-col items-center py-10 px-4">
      <motion.section initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-blue-600 text-center">Operation Tracker</h1>

        <form onSubmit={handleSubmit} className="bg-gray-100 p-6 rounded-lg shadow-md mb-6">
          <div className="mb-4">
            <label className="block text-left text-gray-700 font-semibold mb-2">Operation ID</label>
            <div className="flex">
              <input
                type="text"
                value={operationId}
                onChange={(e) => setOperationId(e.target.value)}
                className="flex-grow px-4 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-600 outline-none"
                placeholder="Enter operation ID"
                disabled={isLoading}
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                className={`${isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"} text-white px-6 py-2 rounded-r-lg font-semibold`}
                disabled={isLoading}
              >
                {isLoading ? "Checking..." : "Check Status"}
              </motion.button>
            </div>
            <p className="text-sm text-gray-500 mt-1 text-left">Enter the operation ID you received when submitting a transaction</p>
          </div>
        </form>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </motion.div>
        )}

        {operationResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-blue-600 mb-4">Operation Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Operation ID:</p>
                  <div className="flex items-center mt-1">
                    <p className="font-medium">{operationId}</p>
                    <button onClick={() => copyToClipboard(operationId)} className="ml-2 text-blue-600 hover:text-blue-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Status:</p>
                  <p className={`font-medium mt-1 ${getStatusColor(operationResult.operation_status)}`}>{operationResult.operation_status}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Operation Type:</p>
                  <p className="font-medium mt-1">{getOperationTypeLabel(operationResult.operation)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Item ID:</p>
                  <div className="flex items-center mt-1">
                    <p className="font-medium">{operationResult.item_id}</p>
                    <button onClick={() => copyToClipboard(operationResult.item_id)} className="ml-2 text-blue-600 hover:text-blue-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {operationResult.updated_at && (
                  <div>
                    <p className="text-gray-600 text-sm">Last Updated:</p>
                    <p className="font-medium mt-1">{new Date(operationResult.updated_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {operationResult.transaction_hash && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-600 text-sm mb-1">Transaction Hash:</p>
                <div className="flex items-center">
                  <p className="font-mono bg-gray-100 p-2 rounded text-sm break-all">{operationResult.transaction_hash}</p>
                  <button onClick={() => copyToClipboard(operationResult.transaction_hash)} className="ml-2 text-blue-600 hover:text-blue-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {operationResult.error && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-600 text-sm mb-1">Error Message:</p>
                <p className="text-red-600 bg-red-50 p-3 rounded">{operationResult.error}</p>
              </div>
            )}

            {operationResult.operation_status === "COMPLETED" && operationResult.operation === "ADD" && (
              <div className="mt-6">
                <motion.a href={`/auction/${operationResult.item_id}`} whileHover={{ scale: 1.05 }} className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                  View Item
                </motion.a>
              </div>
            )}
          </motion.div>
        )}
      </motion.section>
    </div>
  );
};

export default OperationTracker;
