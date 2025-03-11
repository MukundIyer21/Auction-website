import pandas as pd
import numpy as np
import re
import nltk
import json
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
nltk.download('stopwords')
nltk.download('wordnet')
from sklearn.feature_extraction.text import TfidfVectorizer
import faiss
import random
from pymongo import MongoClient

def preprocess_text(text):
    stop_words = set(stopwords.words('english'))
    lemmatizer = WordNetLemmatizer()

    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s.]', ' ', text)
    text = re.sub(r'\boz\b', 'ounce', text)
    # text = re.sub(r'@/-')
    text = re.sub(r'\$(\d+)', r'dollar \1', text)  # Convert dollar amounts
    words = text.split()
    words = [lemmatizer.lemmatize(word) for word in words if word not in stop_words]
    
    return " ".join(words)

def give_recommendations(id):

    mongo_uri = "mongodb+srv://user:chaitu1234@auction.q6ops.mongodb.net/?retryWrites=true&w=majority&appName=Auction"
    client = MongoClient(mongo_uri)
    db = client["Auction"]
    collection = db["Auction_items"]
    data = list(collection.find())
    df = pd.DataFrame(data)

    item = df[df["id"]==23422056662]
    item = item.iloc[0].id

    df["combined"] = df["title"]+" "+df["description"]+" "+df["category"]
    if len(df[df["id"]==23422056662])<0:
        print("not found")
        return [-1]
    
    df["combined"]=df["combined"].apply(preprocess_text)

    corpus = df["combined"]
    vectorizer = TfidfVectorizer(min_df=0.07)
    tfidf_matrix = vectorizer.fit_transform(corpus)

    tfidf_dense = tfidf_matrix.toarray().astype('float32')
    index = faiss.IndexFlatL2(tfidf_dense.shape[1])  
    index.add(tfidf_dense)

    try:
        query_idx = df[df['id'] == item].index[0]
        query_vector = tfidf_dense[query_idx].reshape(1, -1)
        distances, indices = index.search(query_vector, 16 + 1)  
        similar_indices = indices.flatten()[1:]  
        recommendations = df.iloc[similar_indices]
        return recommendations['id'].to_list()
    except:
        return [-1]
if __name__=="__main__":
    print(give_recommendations(23422056662))
