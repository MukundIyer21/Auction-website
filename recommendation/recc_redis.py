import os
import pandas as pd
import numpy as np
import re
import nltk
import json
import redis
import schedule
import time
from dotenv import load_dotenv
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
import faiss
from pymongo import MongoClient

# Load environment variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = int(os.getenv("REDIS_PORT"))

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
    filtered_words = []
    for word in words:
        if word not in stop_words:
            filtered_words.append(lemmatizer.lemmatize(word))
    return " ".join(filtered_words)


# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client["auction_db"]
collection = db["items"]

# Connect to Redis
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)


def store_recommendations():
    print("Fetching active auction items...")
    data = list(collection.find({"status": "ACTIVE"}))
    df = pd.DataFrame(data)
    len_df = len(df)
    if df.empty:
        print("No active items found.")
        return

    df["combined"] = df["title"] + " " + \
        df["description"] + " " + df["category"]
    df["combined"] = df["combined"].apply(preprocess_text)

    vectorizer = TfidfVectorizer(min_df=0.07)
    tfidf_matrix = vectorizer.fit_transform(df["combined"])
    tfidf_dense = tfidf_matrix.toarray().astype('float32')

    index = faiss.IndexFlatL2(tfidf_dense.shape[1])
    index.add(tfidf_dense)

    for idx, row in df.iterrows():
        item_id = str(row["_id"])
        query_vector = tfidf_dense[idx].reshape(1, -1)
        distances, indices = index.search(query_vector, 16 + 1)
        similar_indices = indices.flatten()[1:]
        recommendations = df.iloc[similar_indices]['_id'].astype(str).tolist()
        if len(recommendations) > len_df:
            recommendations = recommendations[:len_df-1]
        # Store as comma-separated string with new prefix
        redis_client.set(f"similar_items:{item_id}", ",".join(recommendations))

    print("Recommendations updated successfully.")


def schedule_task():
    schedule.every(8).minutes.do(store_recommendations)

    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    store_recommendations()  # Initial run
    schedule_task()
