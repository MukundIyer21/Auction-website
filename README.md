# SmartBid – Machine Learning Powered Auction on the Blockchain  

SmartBid is a next-generation online auction platform that integrates **Computer Vision**, **Blockchain**, and **AI-powered Recommendations** to make digital auctions secure, transparent, and user-centric.  

The system leverages **deep learning (ResNet-50)** for automated damage detection on auction items, **blockchain smart contracts** for tamper-proof ownership transfer, and a **hybrid recommendation engine** (TF-IDF + FAISS) for personalized item discovery.  

---

## 🚀 Features  

- **AI-powered Damage Detection**  
  - Uses ResNet-50 CNN to analyze item images.  
  - Generates a **damage score (1–5)** for better decision-making.  
  - Provides visual explanations using Grad-CAM heatmaps.  

- **Blockchain-backed Security**  
  - Built on **Polygon Amoy Testnet (Ethereum compatible)**.  
  - Smart contracts ensure **transparent, immutable, and tamper-proof** auction records.  
  - Secure ownership transfers.  

- **Real-time Bidding System**  
  - Powered by **WebSockets + Redis Pub/Sub**.  
  - Live updates for bids, auction timers, and status changes.  

- **Personalized Recommendations**  
  - Content-based hybrid engine using **TF-IDF + FAISS**.  
  - Suggests similar and relevant auction items in real-time.  

- **Scalable Microservices Architecture**  
  - **Rust (Actix-web)** for high-performance endpoints.  
  - **Node.js + Express.js** for orchestration & business logic.  
  - **Python** for AI-based services (damage detection & recommendation).  

---

## 🛠️ Tech Stack  

**Frontend:** React.js, Axios, WebSockets  
**Backend:** Rust (Actix-web), Node.js (Express.js), Redis, BullMQ  
**AI/ML:** Python, PyTorch, TensorFlow, ResNet-50, TF-IDF, FAISS  
**Database:** MongoDB, Elasticsearch  
**Blockchain:** Solidity, Hardhat, Ethers.js, Polygon Amoy Testnet  
**Storage & DevOps:** Amazon S3, Docker, Kubernetes  

---

## 📊 Results  

- **ResNet-50 achieved the best performance** with an F1-score of **0.86** at 30 epochs (LR = 0.001).  
- Compared against **GoogleNet** and **YOLOv8**, ResNet-50 provided superior precision/recall for damage detection.  


---

## Future Scope

- **Mobile app for on-the-go bidding.**
- **On-chain escrow & payment verification.**
- **Multilingual support & localization.**
- **Advanced user analytics & personalization.**
- **In-app chat for buyers and sellers.**

## Authors
**Noel Lawrence**
**Chaitanya Mandale**
**Mukund Iyer**
**Darshan Mahajan**
