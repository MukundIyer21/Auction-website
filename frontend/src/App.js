import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Landing from './components/Landing';
import AuctionList from './components/AuctionList';
import ItemDetail from './components/ItemDetail';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auctions" element={<AuctionList />} />
        <Route path="/auction/:id" element={<ItemDetail/>} />
      </Routes>
    </Router>
  );
}

export default App;
