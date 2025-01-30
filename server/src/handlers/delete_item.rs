use actix_web::{delete, web, HttpResponse, Responder};
use bson::doc;
use serde::{Deserialize, Serialize};

use crate::{
    mongo::{Item, MongoClient},
    redis::RedisClient,
    types::BlockchainAPIURI,
};

#[derive(Deserialize)]
struct DeleteItemRequest {
    seller: String,
}

#[derive(Deserialize, Serialize)]
struct DeleteItemResponse {
    status: String,
    operation_id: Option<String>,
    message: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct BlockchainDeleteRequest {
    seller: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct BlockchainDeleteResponse {
    status: String,
    operation_id: Option<String>,
    message: String,
}

#[delete("/api/v1/item/{item_id}")]
pub async fn delete_item_handler(
    item_id: web::Path<String>,
    req_body: web::Json<DeleteItemRequest>,
    mongo_client: web::Data<MongoClient>,
    redis_client: web::Data<RedisClient>,
    blockchain_api_base_uri: web::Data<BlockchainAPIURI>,
) -> impl Responder {
    let item_id = item_id.into_inner();
    let seller = req_body.seller.clone();
    let blockchain_api_base_uri = &blockchain_api_base_uri.uri;

    let delete_req = BlockchainDeleteRequest { seller };

    let blockchain_response = match reqwest::Client::new()
        .delete(&format!("{}/item/{}", blockchain_api_base_uri, item_id))
        .json(&delete_req)
        .send()
        .await
    {
        Ok(response) => match response.json::<BlockchainDeleteResponse>().await {
            Ok(body) => body,
            Err(_) => {
                return HttpResponse::InternalServerError().json(DeleteItemResponse {
                    status: "error".to_string(),
                    operation_id: None,
                    message: "Failed to parse blockchain response".to_string(),
                })
            }
        },
        Err(_) => {
            return HttpResponse::InternalServerError().json(DeleteItemResponse {
                status: "error".to_string(),
                operation_id: None,
                message: "Failed to connect to blockchain API".to_string(),
            })
        }
    };

    match blockchain_response.status.as_str() {
        "pending" => {
            let operation_id = blockchain_response.operation_id.clone();

            let similar_items = match redis_client.get_similar_items(&item_id).await {
                Ok(Some(items)) => items,
                Ok(None) => vec![],
                Err(err) => {
                    eprintln!(
                        "Failed to fetch similar items for item_id: {}. Error: {:?}",
                        item_id, err
                    );
                    return HttpResponse::InternalServerError().json(DeleteItemResponse {
                        status: "error".to_string(),
                        operation_id: None,
                        message: "Failed to clean up similar items cache".to_string(),
                    });
                }
            };

            for similar_item_id in similar_items {
                match redis_client.get_similar_items(&similar_item_id).await {
                    Ok(Some(mut refs)) => {
                        refs.retain(|id| id != &item_id);

                        if refs.is_empty() {
                            let _ = redis_client
                                .delete_key(&format!("similar_items:{}", similar_item_id))
                                .await.map_err(|err| eprintln!("Failed to delete similar items for item id : {}. Error : {:?}",similar_item_id,err));
                        } else {
                            let _ = redis_client
                                .set_similar_items(&similar_item_id, &refs)
                                .await
                                .map_err(|err| eprintln!("Failed to set similar items for item id : {}. Error : {:?}",similar_item_id,err));
                        }
                    }
                    Ok(None) => {}
                    Err(err) => {
                        eprintln!(
                            "Failed to fetch reverse references for similar_item_id: {}. Error: {:?}",
                            similar_item_id, err
                        );
                    }
                }
            }

            let _ = redis_client
                .delete_key(&format!("similar_items:{}", item_id))
                .await
                .map_err(|err| {
                    eprintln!(
                        "Failed to delete similar items for item id: {}. Error : {:?}",
                        item_id, err
                    )
                });
            let _ = redis_client
                .delete_key(&format!("item_details:{}", item_id))
                .await
                .map_err(|err| {
                    let error = format!(
                        "Failed to delete item details for item id: {}. Error : {:?}",
                        item_id, err
                    );

                    eprintln!("{}", error);
                    return HttpResponse::InternalServerError().json(DeleteItemResponse {
                        status: "error".to_string(),
                        operation_id: None,
                        message: error,
                    });
                });

            let collection = mongo_client.get_db().collection::<Item>("items");
            match collection.delete_one(doc! {"_id": item_id}, None).await {
                Ok(_) => HttpResponse::Ok().json(DeleteItemResponse {
                    status: "success".to_string(),
                    operation_id,
                    message: "Item Will Be Deleted Shortly".to_string(),
                }),
                Err(_) => HttpResponse::InternalServerError().json(DeleteItemResponse {
                    status: "error".to_string(),
                    operation_id: None,
                    message: "Failed to delete item from database".to_string(),
                }),
            }
        }
        "error" => HttpResponse::BadRequest().json(DeleteItemResponse {
            status: "error".to_string(),
            operation_id: None,
            message: blockchain_response.message,
        }),
        _ => HttpResponse::InternalServerError().json(DeleteItemResponse {
            status: "error".to_string(),
            operation_id: None,
            message: "Unexpected blockchain response".to_string(),
        }),
    }
}
