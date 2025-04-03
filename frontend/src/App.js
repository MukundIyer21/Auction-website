import { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Landing from "./components/Landing";
import AuctionList from "./components/AuctionList";
import ItemDetail from "./components/ItemDetail";
import AddProduct from "./components/AddProduct";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import CategoryItems from "./components/CategoryItems";
import Navbar from "./components/Navbar";
import { SignalingManager } from "./utils/SignalingManager";
import apiService from "./utils/methods";
import { ethers } from "ethers";
import SearchResults from "./components/SearchResult";

const POLYGON_AMOY_PARAMS = {
  chainId: "0x13882",
  chainName: "Polygon Amoy",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: ["https://rpc-amoy.polygon.technology"],
  blockExplorerUrls: ["https://www.oklink.com/amoy"],
};

function App() {
  useEffect(() => {
    async function connectWallet() {
      if (!window.ethereum) {
        console.error("MetaMask or a compatible wallet is required.");
        return;
      }

      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts.length > 0) {
          await switchToPolygonAmoy();
          localStorage.setItem("smartbid-address", accounts[0]);

          const userAddress = accounts[0];
          const signalingManager = new SignalingManager(userAddress);

          signalingManager.registerCallback(
            "TRANSFER",
            handleTransferEvent,
            "app-transfer-handler"
          );
        }
      } catch (err) {
        console.error("Failed to connect wallet:", err.message);
      }
    }

    async function switchToPolygonAmoy() {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: POLYGON_AMOY_PARAMS.chainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [POLYGON_AMOY_PARAMS],
            });
          } catch (addError) {
            console.error("Failed to add Polygon Amoy network:", addError.message);
          }
        } else {
          console.error("Failed to switch network:", switchError.message);
        }
      }
    }

    async function handleTransferEvent(itemName, itemId, price, seller) {
      toast.success(`Congratulations! You've won the bid for ${itemName} (ID: ${itemId})`, {
        duration: 5000,
      });

      const paymentPromise = new Promise((resolve, reject) => {
        toast.custom(
          (t) => (
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
              <h3 className="font-bold">Complete Your Payment</h3>
              <p className="my-2">
                Please pay {price} MATIC to seller {seller.substring(0, 6)}...{seller.substring(seller.length - 4)}
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded"
                  onClick={() => {
                    toast.dismiss(t.id);
                    reject("Payment cancelled");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 bg-green-500 text-white rounded"
                  onClick={() => {
                    toast.dismiss(t.id);
                    processPayment(itemId, price, seller).then(resolve).catch(reject);
                  }}
                >
                  Pay Now
                </button>
              </div>
            </div>
          ),
          { duration: Infinity }
        );
      });

      paymentPromise
        .then(() => processTransfer(itemId))
        .catch((error) => {
          toast.error(`Payment failed: ${error}`);
        });
    }

    async function processPayment(itemId, price, seller) {
      try {
        const buyerAddress = localStorage.getItem("smartbid-address");
        if (!buyerAddress) throw new Error("Wallet not connected");

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const transaction = await signer.sendTransaction({
          to: seller,
          value: ethers.parseEther(price.toString()),
        });

        await transaction.wait();

        toast.success("Payment successful!");
        return true;
      } catch (error) {
        console.error("Payment error:", error);
        throw new Error(error.message || "Payment failed");
      }
    }

    async function processTransfer(itemId) {
      const buyerAddress = localStorage.getItem("smartbid-address");

      toast.loading("Processing transfer...", { id: "transfer" });

      const [success, data] = await apiService.transferItem(itemId, buyerAddress);

      if (success) {
        toast.success("Item will be shortly transferred to you", { id: "transfer" });
      } else {
        toast.error(`Transfer failed: ${data.message}`, { id: "transfer" });
      }
    }

    connectWallet();

    return () => {
      const userAddress = localStorage.getItem("smartbid-address");
      if (userAddress) {
        const signalingManager = new SignalingManager(userAddress);
        signalingManager.deRegisterCallback("TRANSFER", "app-transfer-handler");
      }
    };
  }, []);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auctions" element={<AuctionList />} />
          <Route path="/category/:categoryName" element={<CategoryItems />} />
          <Route path="/auction/:id" element={<ItemDetail />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/search-results" element={<SearchResults />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;