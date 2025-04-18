use actix_web::{post, web, HttpResponse, Responder};
use base64::{self, Engine};
use bson::DateTime;
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::path::Path;
use uuid::Uuid;

use crate::{
    awss3::AWSClient,
    elasticsearch::ElasticSearchClient,
    mongo::{Item, ItemStatus, MongoClient},
    redis::RedisClient,
    types::{BlockchainAPIURI, MessageToEnqueue, TransferSchedulerURI},
};

#[derive(Deserialize, Debug)]
pub struct CreateItemRequest {
    item_details: ItemDetails,
    seller: String,
    auction_end: i64,
}

#[derive(Deserialize, Debug)]
struct ItemDetails {
    title: String,
    description: String,
    images: Vec<String>,
    category: String,
    base_price: f64,
}

#[derive(Deserialize)]
struct BlockchainPostResponse {
    status: String,
    operation_id: Option<String>,
    message: String,
}

#[derive(Serialize)]
struct CreateItemResponse {
    status: String,
    item_id: String,
    operation_id: Option<String>,
    message: String,
}

async fn upload_images(
    s3_client: &AWSClient,
    image_inputs: &[String],
    item_id: &str,
) -> Result<Vec<String>, String> {
    let mut upload_futures = Vec::new();

    for (index, input) in image_inputs.iter().enumerate() {
        let s3_client = s3_client.clone();
        let input = input.clone();
        let item_id = item_id.to_string();

        let future = async move {
            if input.starts_with("data:image") {
                let base64_parts: Vec<&str> = input.split(",").collect();
                if base64_parts.len() != 2 {
                    return Err(("Invalid base64 image format".to_string(), index));
                }

                let decoded = base64::engine::general_purpose::STANDARD
                    .decode(base64_parts[1])
                    .map_err(|e| (format!("Failed to decode base64 image: {}", e), index))?;

                let temp_path = std::env::temp_dir().join(format!(
                    "{}_{}_{}.jpg",
                    item_id,
                    index + 1,
                    Uuid::new_v4()
                ));
                std::fs::write(&temp_path, &decoded)
                    .map_err(|e| (format!("Temp file write error: {}", e), index))?;

                let url = s3_client
                    .upload_image(&item_id, index + 1, Path::new(&temp_path))
                    .await
                    .map_err(|e| (e.to_string(), index))?;

                std::fs::remove_file(&temp_path).ok();

                Ok((url, index))
            } else if input.starts_with("http://") || input.starts_with("https://") {
                let response = reqwest::get(&input)
                    .await
                    .map_err(|e| (format!("Failed to download image from URL: {}", e), index))?;

                let image_bytes = response
                    .bytes()
                    .await
                    .map_err(|e| (format!("Failed to read image bytes: {}", e), index))?;

                let temp_path = std::env::temp_dir().join(format!(
                    "{}_{}_{}.jpg",
                    item_id,
                    index + 1,
                    Uuid::new_v4()
                ));

                std::fs::write(&temp_path, &image_bytes)
                    .map_err(|e| (format!("Temp file write error: {}", e), index))?;

                let url = s3_client
                    .upload_image(&item_id, index + 1, Path::new(&temp_path))
                    .await
                    .map_err(|e| (e.to_string(), index))?;

                std::fs::remove_file(&temp_path).ok();

                Ok((url, index))
            } else {
                s3_client
                    .upload_image(&item_id, index + 1, Path::new(&input))
                    .await
                    .map_err(|e| (e.to_string(), index))
                    .map(|url| (url, index))
            }
        };

        upload_futures.push(future);
    }

    let results = futures::future::join_all(upload_futures).await;

    let mut urls = vec![String::new(); image_inputs.len()];

    for result in results {
        match result {
            Ok((url, index)) => {
                urls[index] = url;
            }
            Err((error_msg, _)) => {
                return Err(error_msg);
            }
        }
    }

    Ok(urls)
}

#[post("/api/v1/item")]
pub async fn post_item_handler(
    req: web::Json<CreateItemRequest>,
    mongo_client: web::Data<MongoClient>,
    redis_client: web::Data<RedisClient>,
    s3_client: web::Data<AWSClient>,
    elasticsearch_client: web::Data<ElasticSearchClient>,
    blockchain_api_base_uri: web::Data<BlockchainAPIURI>,
    transfer_scheduler_uri: web::Data<TransferSchedulerURI>,
) -> impl Responder {
    let item_id = Uuid::new_v4().to_string()[..16].to_string();

    let chrono_dt = Utc::now() + Duration::seconds(req.auction_end);
    let auction_end = DateTime::from_chrono(chrono_dt);

    let image_urls = match upload_images(&s3_client, &req.item_details.images, &item_id).await {
        Ok(urls) => urls,
        Err(e) => {
            return HttpResponse::InternalServerError().json(CreateItemResponse {
                status: "error".to_string(),
                item_id,
                operation_id: None,
                message: format!("Image upload failed: {}", e),
            });
        }
    };

    let blockchain_payload = json!({
        "item_id": item_id,
        "seller": req.seller
    });

    let blockchain_response = match reqwest::Client::new()
        .post(&format!("{}/item", blockchain_api_base_uri.uri))
        .json(&blockchain_payload)
        .send()
        .await
    {
        Ok(response) => match response.json::<BlockchainPostResponse>().await {
            Ok(body) => body,
            Err(_) => {
                return HttpResponse::InternalServerError().json(CreateItemResponse {
                    status: "error".to_string(),
                    item_id,
                    operation_id: None,
                    message: "Failed to parse blockchain response".to_string(),
                });
            }
        },
        Err(_) => {
            return HttpResponse::InternalServerError().json(CreateItemResponse {
                status: "error".to_string(),
                item_id,
                operation_id: None,
                message: "Blockchain API submission failed".to_string(),
            });
        }
    };

    match blockchain_response.status.as_str() {
        "error" => {
            return HttpResponse::BadRequest().json(CreateItemResponse {
                status: "error".to_string(),
                item_id,
                operation_id: None,
                message: blockchain_response.message,
            });
        }
        "pending" => {
            let item = Item {
                id: Some(item_id.clone()),
                title: req.item_details.title.clone(),
                description: req.item_details.description.clone(),
                images: image_urls,
                category: req.item_details.category.clone().to_lowercase(),
                auction_end,
                rating: -1.0,
                status: ItemStatus::PENDING,
                base_price: req.item_details.base_price,
            };

            let items_collection = mongo_client.get_db().collection::<Item>("items");
            match items_collection.insert_one(item, None).await {
                Ok(_) => {
                    let auction_end_chrono = auction_end.to_chrono();
                    let delay_in_ms = (auction_end_chrono - Utc::now()).num_milliseconds();
                    match reqwest::Client::new()
                        .post(&transfer_scheduler_uri.uri)
                        .json(&json!({
                            "type": 1,
                            "item_id": item_id,
                            "item_name": req.item_details.title,
                            "delay": delay_in_ms,
                            "seller": req.seller
                        }))
                        .send()
                        .await
                    {
                        Ok(_) => {}
                        Err(e) => eprintln!("Failed to push to transfer scheduler: {:?}", e),
                    }

                    match redis_client
                        .enqueue("rate", MessageToEnqueue::new(&item_id))
                        .await
                    {
                        Ok(_) => {}
                        Err(e) => eprintln!("Failed to push to rate queue: {:?}", e),
                    }

                    match elasticsearch_client
                        .index_item(
                            &item_id,
                            &req.item_details.title,
                            &req.item_details.category,
                        )
                        .await
                    {
                        Ok(_) => {}
                        Err(err) => {
                            eprintln!("Failed to index item in Elasticsearch: {:?}", err);
                        }
                    }

                    HttpResponse::Ok().json(CreateItemResponse {
                        status: "success".to_string(),
                        item_id,
                        operation_id: blockchain_response.operation_id,
                        message: "Item successfully submitted, it will shortly be up for auction"
                            .to_string(),
                    })
                }
                Err(e) => HttpResponse::InternalServerError().json(CreateItemResponse {
                    status: "error".to_string(),
                    item_id,
                    operation_id: blockchain_response.operation_id,
                    message: format!("Failed to insert item into database: {:?}", e),
                }),
            }
        }
        _ => HttpResponse::InternalServerError().json(CreateItemResponse {
            status: "error".to_string(),
            item_id,
            operation_id: None,
            message: "Unexpected blockchain response".to_string(),
        }),
    }
}
