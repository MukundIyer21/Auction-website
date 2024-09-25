import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Landing from './components/Landing';
import AuctionList from './components/AuctionList';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auctions" element={<AuctionList />} />
      </Routes>
    </Router>
  );
}

export default App;
