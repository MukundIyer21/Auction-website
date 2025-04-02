import axios from "axios";

const API_BASE = "http://localhost:8080/api/v1";

const apiService = {
    async getItem(item_id) {
        try {
            const response = await axios.get(`${API_BASE}/item`, { params: { item_id } });
            return [true, response.data];
        } catch (error) {
            return [false, error.response?.data?.message || "Failed to fetch item."];
        }
    },

    async createItem(itemDetails, seller, auction_end) {
        try {
            const response = await axios.post(`${API_BASE}/item`, {
                item_details: itemDetails,
                seller,
                auction_end,
            });
            return [true, response.data];
        } catch (error) {
            return [false, error.response?.data?.message || "Failed to create item."];
        }
    },

    async deleteItem(item_id, seller) {
        try {
            const response = await axios.delete(`${API_BASE}/item/${item_id}`, { data: { seller } });
            return [true, response.data];
        } catch (error) {
            return [false, error.response?.data?.message || "Failed to delete item."];
        }
    },

    async placeBid(item_id, incrementation, bidder) {
        try {
            const response = await axios.post(`${API_BASE}/place`, { item_id, incrementation, bidder });
            return [true, response.data];
        } catch (error) {
            return [false, error.response?.data?.message || "Failed to place bid."];
        }
    },

    async getHomePage() {
        try {
            const response = await axios.get(`${API_BASE}/home`);
            return [true, response.data];
        } catch (error) {
            return [false, error.response?.data?.message || "Failed to fetch home page data."];
        }
    },

    async transferItem(item_id, buyer) {
        try {
            const response = await axios.post(`${API_BASE}/transfer`, { item_id, buyer });
            return [true, response.data];
        } catch (error) {
            return [false, error.response?.data?.message || "Failed to transfer item."];
        }
    },

    async getUserItems(user_id) {
        try {
            const response = await axios.get(`${API_BASE}/userItems/${user_id}`);
            return [true, response.data];
        } catch (error) {
            return [false, error.response?.data?.message || "Failed to fetch user items."];
        }
    },

    async getOperationStatus(operation_id) {
        try {
            const response = await axios.get(`${API_BASE}/status/operation/${operation_id}`);
            return [true, response.data];
        } catch (error) {
            return [false, error.response?.data?.message || "Failed to fetch operation status."];
        }
    },

    async getItemsByCategory(category_name) {
        try {
            const response = await axios.get(`${API_BASE}/items/category/${category_name}`);
            return [true, response.data];
        } catch (error) {
            return [false, error.response?.data?.message || "Failed to fetch category items."];
        }
    },

    async getTopCategories(limit) {
        try {
            const response = await axios.get(`${API_BASE}/categories/top`, { params: { limit } });
            return [true, response.data];
        } catch (error) {
            return [false, error.response?.data?.message || "Failed to fetch top categories."];
        }
    },

    async autocompleteSearch(query, limit) {
        try {
            const response = await axios.get(`${API_BASE}/autocomplete`, { params: { query, limit } });
            return [true, response.data];
        } catch (error) {
            return [false, error.response?.data?.message || "Failed to fetch autocomplete results."];
        }
    },

    async searchItems(query, limit) {
        try {
            const response = await axios.get(`${API_BASE}/search`, { params: { query, limit } });
            return [true, response.data];
        } catch (error) {
            return [false, error.response?.data?.message || "Failed to search items."];
        }
    },
};

export default apiService;
