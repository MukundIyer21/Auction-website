use actix_web::{
    get,
    web::{Data, Query},
    HttpResponse, Responder,
};
use serde_json::json;
use std::collections::HashMap;

use crate::{
    elasticsearch::ElasticSearchClient,
    mongo::{Item, MongoClient},
    redis::RedisClient,
};

#[get("/api/v1/search")]
pub async fn search_item_handler(
    Query(params): Query<HashMap<String, String>>,
    elasticsearch_client: Data<ElasticSearchClient>,
    redis_client: Data<RedisClient>,
    mongo_client: Data<MongoClient>,
) -> impl Responder {
    let query = match params.get("query") {
        Some(q) if !q.trim().is_empty() => q,
        _ => {
            return HttpResponse::BadRequest().json(json!({
                "status": "error",
                "message": "Missing or empty query parameter"
            }));
        }
    };

    let limit = params
        .get("limit")
        .and_then(|l| l.parse::<usize>().ok())
        .unwrap_or(10);

    match elasticsearch_client.search_items(query, limit).await {
        Ok(search_results) => {
            let mut items_with_details = Vec::new();

            for result in search_results {
                let item_id = &result.item_id;

                let item_details: Option<Item> =
                    match redis_client.get_value("item_details", item_id).await {
                        Ok(details) => details,
                        Err(_) => None,
                    };

                let item_details = match item_details {
                    Some(details) => details,
                    None => {
                        let collection = mongo_client.get_db().collection::<Item>("items");
                        match collection
                            .find_one(mongodb::bson::doc! {"_id": item_id}, None)
                            .await
                        {
                            Ok(Some(item)) => {
                                redis_client
                                    .set_value("item_details", item_id, &item, Some(3600))
                                    .await
                                    .ok();
                                item
                            }
                            _ => continue,
                        }
                    }
                };

                items_with_details.push((item_details, result.score));
            }

            items_with_details
                .sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

            let sorted_items: Vec<Item> = items_with_details
                .into_iter()
                .map(|(item, _)| item)
                .collect();

            HttpResponse::Ok().json(json!({
                "status": "success",
                "results": sorted_items
            }))
        }
        Err(e) => {
            eprintln!("Search error: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "message": "Failed to perform search"
            }))
        }
    }
}
