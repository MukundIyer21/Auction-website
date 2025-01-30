use crate::types::HomePageAPIURI;
use actix_web::{get, web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
struct HomePageResponse {
    status: String,
    items: Option<Vec<serde_json::Value>>,
    message: Option<String>,
}

#[get("/api/v1/home")]
pub async fn get_home_page_handler(
    home_page_base_api_uri: web::Data<HomePageAPIURI>,
) -> impl Responder {
    let home_page_api_base_uri = &home_page_base_api_uri.uri;

    let home_page_response = match reqwest::Client::new()
        .get(&format!("{}/home", home_page_api_base_uri))
        .send()
        .await
    {
        Ok(response) => match response.json::<HomePageResponse>().await {
            Ok(body) => body,
            Err(_) => {
                return HttpResponse::InternalServerError().json(serde_json::json!({
                    "status": "error".to_string(),
                    "message": "Failed to parse home page service response".to_string(),
                }));
            }
        },
        Err(_) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "status": "error".to_string(),
                "message": "Homepage API submission failed".to_string(),
            }));
        }
    };

    match home_page_response.status.as_str() {
        "success" => HttpResponse::Ok().json(serde_json::json!({
            "status": "success".to_string(),
            "items": home_page_response.items,
        })),
        "error" => {
            let message = home_page_response
                .message
                .unwrap_or_else(|| "Unknown error".to_string());
            HttpResponse::BadRequest().json(serde_json::json!({
                "status": "error".to_string(),
                "message": message,
            }))
        }
        _ => HttpResponse::InternalServerError().json(serde_json::json!({
            "status": "error".to_string(),
            "message": "Unexpected status in blockchain response".to_string(),
        })),
    }
}
