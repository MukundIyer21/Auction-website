import React from "react";

const LoadingSpinner = ({ message = "Loading...", size = "medium" }) => {
  const sizeClasses = {
    small: "w-4 h-4 border-2",
    medium: "w-8 h-8 border-3",
    large: "w-12 h-12 border-4",
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`${spinnerSize} border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin`}></div>
      <p className="mt-3 text-gray-700">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
