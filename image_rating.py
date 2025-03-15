import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import redis
import pymongo
import io
import os

# Initialize Redis queue
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

# Initialize MongoDB client
MONGO_URI = os.getenv("MONGO_URI")
print("uri",MONGO_URI)
db_client = pymongo.MongoClient(MONGO_URI)
db = db_client["Auction"]
items_collection = db["Auction_items"]

# Load pre-trained ResNet-50 model
model = models.resnet50()
num_classes = 9  
model.fc = nn.Linear(model.fc.in_features, num_classes)


# Load trained weights
model.load_state_dict(torch.load("resnet50_damage_detection_20_epoch.pth", map_location=torch.device('cpu')))

# Move model to GPU if available
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)
model.eval()

# Define image transformations
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def process_item():
    while True:
        # Pop item_id from Redis queue
        item_id = redis_client.lpop("item_queue")
        if not item_id:
            continue
        
        item_id = item_id.decode("utf-8")
        print(f"Processing item_id: {item_id}")

        # Fetch item images from MongoDB
        item = items_collection.find_one({"_id": item_id})
        if not item or "images" not in item:
            print(f"No images found for item {item_id}")
            continue

        ratings = []
        # Box : Scratch , Chip , Hole , Metal : Scratch , hole , dent , Paper: Tear , Water, defect  
        weights = torch.tensor([0.8, 1.5, 4.0, 0.8, 4.0 , 1.5, 2.0, 1.5, 0.7 ])

        for img_data in item["images"]:
            image = Image.open(io.BytesIO(img_data)).convert("RGB")
            image = transform(image).unsqueeze(0).to(device)
            
            with torch.no_grad():
                output = model(image)
                probabilities = torch.sigmoid(output).cpu().numpy().tolist()[0]

                rating = (probabilities * weights).sum().item() 
                ratings.append(rating)
        
        avg_rating = sum(ratings) / len(ratings)
        
        # Update database with rating and set status as ACTIVE
        items_collection.update_one(
            {"_id": item_id},
            {"$set": {"rating": avg_rating, "status": "ACTIVE"}}
        )
        
        print(f"Updated item {item_id} with rating {avg_rating} and status ACTIVE")

if __name__ == "__main__":
    process_item()
