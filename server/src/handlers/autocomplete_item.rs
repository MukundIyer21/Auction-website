use actix_web::{
    get,
    web::{Data, Query},
    HttpResponse, Responder,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;

use crate::elasticsearch::ElasticSearchClient;

#[derive(Debug, Serialize, Deserialize)]
pub struct AutocompleteResponse {
    pub item_id: String,
    pub item_name: String,
    pub matched_field: String,
}

#[get("/api/v1/autocomplete")]
pub async fn autocomplete_item_handler(
    Query(params): Query<HashMap<String, String>>,
    elasticsearch_client: Data<ElasticSearchClient>,
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

    match elasticsearch_client.autocomplete(query, limit).await {
        Ok(search_results) => {
            let autocomplete_results: Vec<AutocompleteResponse> = search_results
                .into_iter()
                .map(|result| AutocompleteResponse {
                    item_id: result.item_id,
                    item_name: result.item_name,
                    matched_field: result.matched_field,
                })
                .collect();

            HttpResponse::Ok().json(json!({
                "status": "success",
                "results": autocomplete_results
            }))
        }
        Err(e) => {
            eprintln!("Autocomplete error: {:?}", e);
            HttpResponse::InternalServerError().json(json!({
                "status": "error",
                "message": "Failed to perform autocomplete"
            }))
        }
    }
}
