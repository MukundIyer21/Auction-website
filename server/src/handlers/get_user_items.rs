use crate::{
    mongo::{Item, MongoClient},
    redis::RedisClient,
    types::BlockchainAPIURI,
};
use actix_web::{get, web, HttpResponse, Responder};
use futures::TryStreamExt;
use mongodb::bson::doc;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
struct BlockchainResponse {
    status: String,
    items: Option<Vec<String>>,
    message: Option<String>,
}

#[get("/api/v1/userItems/{user_id}")]
pub async fn get_user_items_handler(
    user_id: web::Path<String>,
    redis_client: web::Data<RedisClient>,
    mongo_client: web::Data<MongoClient>,
    blockchain_api_base_uri: web::Data<BlockchainAPIURI>,
) -> impl Responder {
    let user_id = user_id.into_inner();
    let blockchain_api_base_uri = &blockchain_api_base_uri.uri;

    let blockchain_response = match reqwest::Client::new()
        .get(&format!(
            "{}/userItems/{}",
            blockchain_api_base_uri, user_id
        ))
        .send()
        .await
    {
        Ok(response) => match response.json::<BlockchainResponse>().await {
            Ok(body) => body,
            Err(e) => {
                return HttpResponse::InternalServerError().json(serde_json::json!({
                    "status": "error",
                    "message": format!("Failed to parse blockchain response: {}", e),
                }));
            }
        },
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "status": "error",
                "message": format!("Blockchain API submission failed: {}", e),
            }));
        }
    };

    match blockchain_response.status.as_str() {
        "success" => {
            let item_ids = match &blockchain_response.items {
                Some(item_ids) => item_ids,
                None => {
                    return HttpResponse::InternalServerError().json(serde_json::json!({
                        "status" : "error",
                        "message" : "Blockchain response error"
                    }))
                }
            };

            let all_items_details: Vec<Item> = redis_client
                .get_items_details_json(item_ids.clone())
                .await
                .unwrap_or_default()
                .into_iter()
                .flatten()
                .collect();

            let mut final_items = all_items_details;

            if let Some(blockchain_items) = &blockchain_response.items {
                if final_items.len() < blockchain_items.len() {
                    let collection = mongo_client.get_db().collection::<Item>("items");
                    let missing_ids: Vec<String> = blockchain_items
                        .iter()
                        .filter(|id| {
                            !final_items.iter().any(|item| {
                                item.id.clone().map_or(false, |i| i.to_string() == **id)
                            })
                        })
                        .cloned()
                        .collect();

                    if !missing_ids.is_empty() {
                        match collection
                            .find(doc! {"_id": {"$in": missing_ids}}, None)
                            .await
                        {
                            Ok(cursor) => {
                                let additional_items: Vec<Item> =
                                    cursor.try_collect().await.unwrap_or_default();

                                for item in &additional_items {
                                    if let Some(id) = &item.id {
                                        redis_client
                                            .set_value(
                                                "item_details",
                                                &id.to_string(),
                                                item,
                                                Some(3600),
                                            )
                                            .await
                                            .ok();
                                    }
                                }

                                final_items.extend(additional_items);
                            }
                            Err(e) => {
                                return HttpResponse::InternalServerError().json(
                                    serde_json::json!({
                                        "status": "error",
                                        "message": format!("MongoDB query failed: {}", e),
                                    }),
                                );
                            }
                        }
                    }
                }
            }

            HttpResponse::Ok().json(serde_json::json!({
                "status": "success",
                "items": final_items
            }))
        }
        "error" => {
            let message = blockchain_response
                .message
                .unwrap_or_else(|| "Unknown error".to_string());
            HttpResponse::BadRequest().json(serde_json::json!({
                "status": "error",
                "message": message,
            }))
        }
        _ => HttpResponse::InternalServerError().json(serde_json::json!({
            "status": "error",
            "message": "Unexpected status in blockchain response",
        })),
    }
}
