const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const items = [
  {
    id: "1",
    title: "Vintage Watch",
    description: "A classic vintage watch in mint condition.",
    images: ["https://m.media-amazon.com/images/I/51TE-f-k9XL.jpg", "https://m.media-amazon.com/images/I/41uYTl3d-ML._SS100_.jpg","https://m.media-amazon.com/images/I/412-dKV9zyL._SS100_.jpg","https://m.media-amazon.com/images/I/51xzU+kHDZL._SS100_.jpg"],
    category: ["Watches", "Vintage"],
    auction_end: "2025-02-15T12:00:00Z",
    price: 500,
    rating: 4.5,
    status: "active",
  },
  {
    id: "2",
    title: "Antique Vase",
    description: "Beautifully crafted antique vase.",
    images: ["https://m.media-amazon.com/images/I/61su8yynVEL._SX679_.jpg","https://m.media-amazon.com/images/I/41oGOSIjk3L._SS100_.jpg","https://m.media-amazon.com/images/I/51sBGrG8azL._SS100_.jpg"],
    category: ["Home Decor"],
    auction_end: "2025-02-20T15:00:00Z",
    price: "650",
    rating: 4.8,
    status: "active",
  },
];


app.get("/api/items", (req, res) => {
  res.json(items);
});

// Get single item by ID
app.get("/api/items/:id", (req, res) => {
  const item = items.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }
  res.json(item);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
