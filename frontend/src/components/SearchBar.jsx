import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../utils/methods";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (query.trim()) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        const [success, response] = await apiService.autocompleteSearch(query, 5);
        if (success) {
          setResults(response.results);
          setShowDropdown(true);
        } else {
          setResults([]);
        }
      }, 300);
    } else {
      setResults([]);
      setShowDropdown(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const handleSearch = async () => {
    if (query.trim()) {
      const [success] = await apiService.searchItems(query, 10);
      if (success) {
        navigate(`/search-results?query=${encodeURIComponent(query)}`);
      }
      setShowDropdown(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="flex">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for items..."
          className="w-full px-4 py-2 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <button onClick={handleSearch} className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Search
        </button>
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg">
          {results.map((result) => (
            <div
              key={result.item_id}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                setShowDropdown(false);
                navigate(`/auction/${result.item_id}`);
              }}
            >
              <div className="font-medium">
                {result.item_name}
                {result.matched_field === "category" && <span className="text-gray-500 text-sm ml-2">Category Match</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
