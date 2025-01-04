os.environ['AWS_ACCESS_KEY'] = "aws_access_key"
os.environ['AWS_SECRET_KEY'] = "aws_secret_key"

!pip install boto3 pandas requests

import os
import pandas as pd
import ast
import requests
import boto3
from concurrent.futures import ThreadPoolExecutor

# Configure AWS credentials from environment variables
AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_KEY')
S3_BUCKET_NAME = "auction-bucket-major-project-2025"
S3_REGION = "ap-south-1"

# Initialize S3 Client
s3 = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=S3_REGION,
)

def upload_to_s3(file_path, bucket_name, s3_key):
    try:
        s3.upload_file(
            file_path,
            bucket_name,
            s3_key
        )
        print(f"Uploaded {s3_key} to S3. Public URL: https://{bucket_name}.s3.{S3_REGION}.amazonaws.com/{s3_key}")
    except Exception as e:
        print(f"Failed to upload {file_path} to S3: {e}")

def process_chunk(chunk, output_dir):
    for _, row in chunk.iterrows():
        item_id = row["item_id"]
        image_urls = ast.literal_eval(row["image_url"])

        for i, image_url in enumerate(image_urls):
            try:

                response = requests.get(image_url, stream=True)
                response.raise_for_status()


                file_name = f"{item_id}_{i+1}.jpg"
                local_file_path = os.path.join(output_dir, file_name)
                with open(local_file_path, 'wb') as file:
                    for chunk in response.iter_content(1024):
                        file.write(chunk)


                s3_key = f"{item_id}/{file_name}"
                upload_to_s3(local_file_path, S3_BUCKET_NAME, s3_key)


                os.remove(local_file_path)

            except Exception as e:
                print(f"Error processing URL {image_url}: {e}")

def process_csv_file_multithreaded(csv_path, output_dir, num_threads=10):
    df = pd.read_csv(csv_path)
    chunk_size = len(df) // num_threads
    chunks = [df.iloc[i:i + chunk_size] for i in range(0, len(df), chunk_size)]

    with ThreadPoolExecutor(max_workers=num_threads) as executor:
        executor.map(lambda chunk: process_chunk(chunk, output_dir), chunks)

def process_csv_folder(folder_path, output_dir, num_threads=10):
    os.makedirs(output_dir, exist_ok=True)
    for file_name in os.listdir(folder_path):
        if file_name.endswith(".csv"):
            csv_path = os.path.join(folder_path, file_name)
            print(f"Processing file: {csv_path}")
            process_csv_file_multithreaded(csv_path, output_dir, num_threads)

folder_path = "/datasets"
output_dir = "/temp_images"

process_csv_folder(folder_path, output_dir, num_threads=10)
