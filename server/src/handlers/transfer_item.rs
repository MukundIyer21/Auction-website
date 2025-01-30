use actix_web::{post, web, HttpResponse, Responder};
use bson::{doc, Bson};
use serde::{Deserialize, Serialize};

use crate::{
    mongo::{Item, MongoClient},
    redis::RedisClient,
    types::BlockchainAPIURI,
};

#[derive(Serialize, Deserialize)]
struct TransferItemRequest {
    item_id: String,
    buyer: String,
}

#[derive(Serialize, Deserialize)]
struct TransferItemResponse {
    status: String,
    operation_id: Option<String>,
    message: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct BlockchainTransferRequest {
    item_id: String,
    buyer: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct BlockchainTransferResponse {
    status: String,
    operation_id: Option<String>,
    message: String,
}

#[derive(Serialize, Deserialize)]
struct ItemDetails {
    item_id: String,
    item_name: String,
    price: String,
    seller: String,
}

#[post("/api/v1/transfer")]
pub async fn transfer_item_handler(
    req_body: web::Json<TransferItemRequest>,
    mongo_client: web::Data<MongoClient>,
    redis_client: web::Data<RedisClient>,
    blockchain_api_base_uri: web::Data<BlockchainAPIURI>,
) -> impl Responder {
    let item_id = req_body.item_id.clone();
    let buyer = req_body.buyer.clone();
    let blockchain_api_base_uri = &blockchain_api_base_uri.uri;

    let transferring_items = match redis_client
        .get_all_items_for_user::<ItemDetails>(&buyer)
        .await
    {
        Ok(items) => {
            if items.is_empty() {
                return HttpResponse::BadRequest().json(TransferItemResponse {
                    status: "error".to_string(),
                    operation_id: None,
                    message: "Item Not Available For Transfer".to_string(),
                });
            }
            items
        }
        Err(_) => {
            return HttpResponse::InternalServerError().json(TransferItemResponse {
                status: "error".to_string(),
                operation_id: None,
                message: "Failed to check item availability".to_string(),
            });
        }
    };

    if !transferring_items
        .iter()
        .any(|item| item.item_id == item_id)
    {
        return HttpResponse::BadRequest().json(TransferItemResponse {
            status: "error".to_string(),
            operation_id: None,
            message: "Item Not Available For Transfer For User".to_string(),
        });
    }

    let transfer_req = BlockchainTransferRequest {
        item_id: item_id.clone(),
        buyer: buyer.clone(),
    };

    let blockchain_response = match reqwest::Client::new()
        .post(&format!("{}/transfer", blockchain_api_base_uri))
        .json(&transfer_req)
        .send()
        .await
    {
        Ok(response) => match response.json::<BlockchainTransferResponse>().await {
            Ok(body) => body,
            Err(_) => {
                return HttpResponse::InternalServerError().json(TransferItemResponse {
                    status: "error".to_string(),
                    operation_id: None,
                    message: "Failed to parse blockchain response".to_string(),
                })
            }
        },
        Err(_) => {
            return HttpResponse::InternalServerError().json(TransferItemResponse {
                status: "error".to_string(),
                operation_id: None,
                message: "Failed to connect to blockchain API".to_string(),
            })
        }
    };

    match blockchain_response.status.as_str() {
        "pending" => {
            let operation_id = blockchain_response.operation_id.clone();

            if let Err(err) = redis_client
                .remove_items_with_id_from_user_list(&buyer, &item_id)
                .await
            {
                eprintln!(
                    "Failed to update transferring items for buyer: {}. Error: {:?}",
                    buyer, err
                );
            }

            let collection = mongo_client.get_db().collection::<Item>("items");
            match collection
                .update_one(
                    doc! {"_id": &item_id},
                    doc! {"$set": {"status": Bson::String("SOLD".to_string())}},
                    None,
                )
                .await
            {
                Ok(_) => {
                    let similar_items = match redis_client.get_similar_items(&item_id).await {
                        Ok(Some(items)) => items,
                        Ok(None) => vec![],
                        Err(err) => {
                            eprintln!(
                                "Failed to fetch similar items for item_id: {}. Error: {:?}",
                                item_id, err
                            );
                            vec![]
                        }
                    };

                    for similar_item_id in similar_items {
                        match redis_client.get_similar_items(&similar_item_id).await {
                            Ok(Some(mut refs)) => {
                                refs.retain(|id| id != &item_id);

                                if refs.is_empty() {
                                    let _ = redis_client
                                        .delete_key(&format!("similar_items:{}", similar_item_id))
                                        .await;
                                } else {
                                    let _ = redis_client
                                        .set_similar_items(&similar_item_id, &refs)
                                        .await;
                                }
                            }
                            _ => {}
                        }
                    }

                    let _ = redis_client
                        .delete_key(&format!("similar_items:{}", item_id))
                        .await;
                    let _ = redis_client
                        .delete_key(&format!("item_details:{}", item_id))
                        .await;

                    HttpResponse::Ok().json(TransferItemResponse {
                        status: "success".to_string(),
                        operation_id,
                        message: "Item Transfer Initiated".to_string(),
                    })
                }
                Err(_) => HttpResponse::InternalServerError().json(TransferItemResponse {
                    status: "error".to_string(),
                    operation_id: None,
                    message: "Failed to update item status".to_string(),
                }),
            }
        }
        "error" => HttpResponse::BadRequest().json(TransferItemResponse {
            status: "error".to_string(),
            operation_id: None,
            message: blockchain_response.message,
        }),
        _ => HttpResponse::InternalServerError().json(TransferItemResponse {
            status: "error".to_string(),
            operation_id: None,
            message: "Unexpected blockchain response".to_string(),
        }),
    }
}
