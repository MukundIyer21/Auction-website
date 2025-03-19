import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import redis
import requests
import pymongo
import time
import io
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT"))
print(REDIS_PORT, type(REDIS_PORT))

# Initialize Redis queue
redis_client = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=0)

# Initialize MongoDB client
MONGO_URI = os.getenv("MONGO_URI")
print(MONGO_URI)
db_client = pymongo.MongoClient(MONGO_URI)
db = db_client["auction_db"]
items_collection = db["items"]
# Dict to convert interger ratings into String
rating_dict = {
    1: "ONE",
    2: "TWO",
    3: "THREE",
    4: "FOUR",
    5: "FIVE",
}

# Load pre-trained ResNet-50 model
model = models.resnet50()
num_classes = 9
model.fc = nn.Linear(model.fc.in_features, num_classes)


# Load trained weights
model.load_state_dict(torch.load(
    "model.pth", map_location=torch.device('cpu')))

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

# Downloading image from db and converting into Bytes


def download_image(image_url):
    try:
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content)).convert("RGB")
    except requests.exceptions.RequestException as e:
        print(f"Failed to download {image_url}: {e}")
        return None


def process_item():
    while True:
        # Pop item_id from Redis queue
        item_id = redis_client.lpop("rate")
        if not item_id:
            time.sleep(2)
            continue

        item_id = item_id.decode("utf-8")
        print(f"Processing item_id: {item_id}")

        # Fetch item images from MongoDB
        item = items_collection.find_one({"_id": item_id})
        print(item)
        if not item or "images" not in item:
            print(f"No images found for item {item_id}")
            continue

        ratings = []
        # Box : Scratch , Chip , Hole , Metal : Scratch , hole , dent , Paper: Tear , Water, defect
        weights = torch.tensor([0.8, 1.5, 4.0, 0.8, 4.0, 1.5, 2.0, 1.5, 0.7])

        for image_url in item["images"]:
            image = download_image(image_url)
            if image is None:
                continue

            image = transform(image).unsqueeze(0).to(device)

            with torch.no_grad():
                output = model(image)
                probabilities = torch.sigmoid(output).cpu().numpy().tolist()[0]

                rating = (torch.tensor(probabilities) * weights).sum().item()
                ratings.append(rating)

        avg_rating = sum(ratings) / len(ratings)
        # Ensure rating is between 1 and 5
        rounded_rating = max(1, min(5, round(avg_rating)))
        rating_str = rating_dict.get(rounded_rating, "UNKNOWN")

        # Update database with rating and set status as ACTIVE
        items_collection.update_one(
            {"_id": item_id},
            {"$set": {"rating": rating_str, "status": "ACTIVE"}}
        )

        print(
            f"Updated item {item_id} with rating {avg_rating} and status ACTIVE")


if __name__ == "__main__":
    process_item()
