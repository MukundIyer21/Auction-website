use actix_web::{get, HttpResponse, Responder};
use serde_json::json;

#[get("/api/v1/health_check")]
pub async fn health_check_handler() -> impl Responder {
    HttpResponse::Ok().json(json!({
        "status" : "success",
        "message" : "server is healthy!"
    }))
}
