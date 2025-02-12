use actix_web::{
    get,
    web::{self},
    HttpResponse, Responder,
};
use futures::StreamExt;
use mongodb::bson::doc;
use serde_json::json;
use std::collections::HashMap;

use crate::{
    mongo::{Item, MongoClient},
    redis::RedisClient,
    types::CurrentBid,
};

#[get("/api/v1/item")]
pub async fn get_item_handler(
    web::Query(params): web::Query<HashMap<String, String>>,
    redis_client: web::Data<RedisClient>,
    mongo_client: web::Data<MongoClient>,
) -> impl Responder {
    let item_id = match params.get("item_id") {
        Some(id) => id,
        None => {
            return HttpResponse::BadRequest().json(json!({
                "status": "error",
                "message": "Missing item_id parameter"
            }))
        }
    };

    let item_details: Option<Item> = match redis_client.get_value("item_details", &item_id).await {
        Ok(details) => details,
        Err(_) => None,
    };

    let item_details = match item_details {
        Some(details) => details,
        None => {
            let collection = mongo_client.get_db().collection::<Item>("items");
            match collection.find_one(doc! {"_id": item_id}, None).await {
                Ok(Some(item)) => {
                    redis_client
                        .set_value("item_details", &item_id, &item, Some(3600))
                        .await
                        .ok();
                    item
                }
                _ => {
                    return HttpResponse::NotFound().json(json!({
                        "status": "error",
                        "message": "Item not found"
                    }))
                }
            }
        }
    };

    let item_current_bid: Option<CurrentBid> =
        match redis_client.get_value("current_bid", &item_id).await {
            Ok(current_bid) => current_bid,
            Err(_) => None,
        };

    let item_current_bid_price = match item_current_bid {
        Some(current_bid) => current_bid.bid_price,
        None => -1.0,
    };

    let similar_item_ids: Vec<String> = match redis_client.get_similar_items(&item_id).await {
        Ok(Some(ids)) => ids,
        _ => vec![],
    };

    let similar_items_details: Vec<Item> = redis_client
        .get_items_details_json(similar_item_ids.clone())
        .await
        .unwrap_or_default()
        .into_iter()
        .flatten()
        .collect();

    let mut final_similar_items = similar_items_details;
    if final_similar_items.len() < similar_item_ids.len() {
        let collection = mongo_client.get_db().collection::<Item>("items");
        let missing_ids: Vec<String> = similar_item_ids
            .iter()
            .filter(|id| {
                !final_similar_items
                    .iter()
                    .any(|item| item.id.clone().map_or(false, |i| i.to_string() == **id))
            })
            .cloned()
            .collect();

        if !missing_ids.is_empty() {
            let cursor = collection
                .find(doc! {"_id": {"$in": missing_ids}}, None)
                .await
                .unwrap();
            let additional_items: Vec<Item> = cursor
                .filter_map(|item| async { item.ok() })
                .collect()
                .await;

            for item in &additional_items {
                if let Some(id) = &item.id {
                    redis_client
                        .set_value("item_details", &id.to_string(), item, Some(3600))
                        .await
                        .ok();
                }
            }

            final_similar_items.extend(additional_items);
        }
    }

    HttpResponse::Ok().json(json!({
        "status": "success",
        "item_details": item_details,
        "current_bid_price" : item_current_bid_price,
        "similar_items_details": final_similar_items
    }))
}
