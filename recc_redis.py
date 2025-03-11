import os
import pandas as pd
import numpy as np
import re
import nltk
import json
import redis
from dotenv import load_dotenv
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
import faiss
from pymongo import MongoClient

# Load environment variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
print("uri",MONGO_URI)
# Download necessary NLTK resources
nltk.download('stopwords')
nltk.download('wordnet')

def preprocess_text(text):
    stop_words = set(stopwords.words('english'))
    lemmatizer = WordNetLemmatizer()
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s.]', ' ', text)
    text = re.sub(r'\boz\b', 'ounce', text)
    text = re.sub(r'\$(\d+)', r'dollar \1', text)  # Convert dollar amounts
    words = text.split()
    words = [lemmatizer.lemmatize(word) for word in words if word not in stop_words]
    return " ".join(words)

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client["Auction"]
collection = db["Auction_items"]
data = list(collection.find())
df = pd.DataFrame(data)

# Combine text fields for processing
df["combined"] = df["title"] + " " + df["description"] + " " + df["category"]
df["combined"] = df["combined"].apply(preprocess_text)

# Vectorize the combined text
vectorizer = TfidfVectorizer(min_df=0.07)
tfidf_matrix = vectorizer.fit_transform(df["combined"])
tfidf_dense = tfidf_matrix.toarray().astype('float32')

# Create FAISS index
index = faiss.IndexFlatL2(tfidf_dense.shape[1])
index.add(tfidf_dense)

# Connect to Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)

def store_recommendations():
    for idx, row in df.iterrows():
        item_id = row["id"]
        query_vector = tfidf_dense[idx].reshape(1, -1)
        distances, indices = index.search(query_vector, 16 + 1)
        similar_indices = indices.flatten()[1:]
        recommendations = df.iloc[similar_indices]['id'].to_list()
        redis_client.set(f"recommendations:{item_id}", json.dumps(recommendations))
        # print(recommendations)

if __name__ == "__main__":
    store_recommendations()
    print("Recommendations stored in Redis.")
