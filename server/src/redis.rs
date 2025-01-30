use core::fmt;

use bb8_redis::redis::{cmd, AsyncCommands};
use bb8_redis::{bb8, RedisConnectionManager};
use serde::{de::DeserializeOwned, Serialize};

use crate::types::{MessageToEnqueue, MessageToPublish};

pub type RedisPool = bb8::Pool<RedisConnectionManager>;

#[derive(Clone)]
pub struct RedisClient {
    pool: RedisPool,
}

pub enum RedisClientError {
    SerializationError,
    OperationError(bb8_redis::redis::RedisError),
    PoolError(bb8::RunError<bb8_redis::redis::RedisError>),
}

impl fmt::Debug for RedisClientError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RedisClientError::SerializationError => write!(f, "Redis Serialization Error"),
            RedisClientError::PoolError(err) => write!(f, "Redis Pool Error: {}", err),
            RedisClientError::OperationError(err) => write!(f, "Redis Operation Error: {}", err),
        }
    }
}

impl RedisClient {
    pub async fn new(
        redis_url: &str,
        max_connections: u32,
    ) -> Result<Self, bb8_redis::redis::RedisError> {
        let manager = RedisConnectionManager::new(redis_url)?;
        let pool = bb8::Pool::builder()
            .max_size(max_connections)
            .build(manager)
            .await
            .map_err(|_| {
                bb8_redis::redis::RedisError::from((
                    bb8_redis::redis::ErrorKind::IoError,
                    "Pool creation failed",
                ))
            })?;

        Ok(Self { pool })
    }

    pub async fn enqueue<'a>(
        &self,
        queue_name: &str,
        message: MessageToEnqueue<'a>,
    ) -> Result<(), RedisClientError> {
        let serialized_message =
            serde_json::to_string(&message).map_err(|_| RedisClientError::SerializationError)?;

        let mut conn = self.pool.get().await.map_err(RedisClientError::PoolError)?;

        conn.rpush::<_, _, i64>(queue_name, serialized_message)
            .await
            .map(|_| ())
            .map_err(RedisClientError::OperationError)
    }

    pub async fn publish<'a>(
        &self,
        message: MessageToPublish<'a>,
        channel: &str,
    ) -> Result<(), RedisClientError> {
        let serialized_message =
            serde_json::to_string(&message).map_err(|_| RedisClientError::SerializationError)?;

        let mut conn = self.pool.get().await.map_err(RedisClientError::PoolError)?;

        conn.publish::<_, _, i64>(channel, serialized_message.as_str())
            .await
            .map(|_| ())
            .map_err(RedisClientError::OperationError)
    }

    async fn get_items_details(
        &self,
        item_ids: Vec<String>,
    ) -> Result<Vec<Option<String>>, RedisClientError> {
        if item_ids.is_empty() {
            return Ok(vec![]);
        }

        let keys: Vec<String> = item_ids
            .into_iter()
            .map(|id| format!("item_details:{}", id))
            .collect();

        let mut conn = self.pool.get().await.map_err(RedisClientError::PoolError)?;

        let values: Vec<Option<String>> = cmd("MGET")
            .arg(&keys)
            .query_async::<_, Vec<Option<String>>>(&mut *conn)
            .await
            .map_err(RedisClientError::OperationError)?;

        Ok(values)
    }

    pub async fn get_items_details_json<T: DeserializeOwned>(
        &self,
        item_ids: Vec<String>,
    ) -> Result<Vec<Option<T>>, RedisClientError> {
        if item_ids.is_empty() {
            return Ok(vec![]);
        }

        let values = self.get_items_details(item_ids).await?;

        let deserialized: Vec<Option<T>> = values
            .into_iter()
            .map(|opt_str| {
                opt_str.and_then(|str_val| {
                    serde_json::from_str(&str_val)
                        .map_err(|_| RedisClientError::SerializationError)
                        .ok()
                })
            })
            .collect();

        Ok(deserialized)
    }

    fn create_prefixed_key(prefix: &str, key: &str) -> String {
        format!("{}:{}", prefix, key)
    }

    pub async fn get_value<T: DeserializeOwned>(
        &self,
        prefix: &str,
        key: &str,
    ) -> Result<Option<T>, RedisClientError> {
        let prefixed_key = Self::create_prefixed_key(prefix, key);
        let mut conn = self.pool.get().await.map_err(RedisClientError::PoolError)?;

        let value: Option<String> = conn
            .get(prefixed_key)
            .await
            .map_err(RedisClientError::OperationError)?;

        value
            .map(|str_val| {
                serde_json::from_str(&str_val).map_err(|_| RedisClientError::SerializationError)
            })
            .transpose()
    }

    pub async fn set_value<T: Serialize>(
        &self,
        prefix: &str,
        key: &str,
        value: &T,
        ttl_seconds: Option<u64>,
    ) -> Result<(), RedisClientError> {
        let prefixed_key = Self::create_prefixed_key(prefix, key);
        let serialized_value =
            serde_json::to_string(value).map_err(|_| RedisClientError::SerializationError)?;

        let mut conn = self.pool.get().await.map_err(RedisClientError::PoolError)?;

        match ttl_seconds {
            Some(ttl) => {
                conn.set_ex::<_, _, String>(prefixed_key, serialized_value, ttl as usize)
                    .await
                    .map_err(RedisClientError::OperationError)?;
            }
            None => {
                conn.set::<_, _, String>(prefixed_key, serialized_value)
                    .await
                    .map_err(RedisClientError::OperationError)?;
            }
        }

        Ok(())
    }

    pub async fn delete_key(&self, key: &str) -> Result<(), RedisClientError> {
        let mut conn = self.pool.get().await.map_err(RedisClientError::PoolError)?;

        conn.del(key)
            .await
            .map_err(RedisClientError::OperationError)
    }

    pub async fn set_similar_items(
        &self,
        item_id: &str,
        similar_items: &[String],
    ) -> Result<(), RedisClientError> {
        if similar_items.is_empty() {
            return self.delete_key(&format!("similar_items:{}", item_id)).await;
        }

        let key = format!("similar_items:{}", item_id);
        let serialized_items = similar_items.join(",");

        let mut conn = self.pool.get().await.map_err(RedisClientError::PoolError)?;

        conn.set::<_, _, String>(key, serialized_items)
            .await
            .map_err(RedisClientError::OperationError)?;
        Ok(())
    }

    pub async fn get_similar_items(
        &self,
        item_id: &str,
    ) -> Result<Option<Vec<String>>, RedisClientError> {
        let key = format!("similar_items:{}", item_id);
        let mut conn = self.pool.get().await.map_err(RedisClientError::PoolError)?;

        match conn.get::<_, Option<String>>(key).await {
            Ok(Some(similar_items)) => Ok(Some(
                similar_items
                    .split(',')
                    .filter(|s| !s.is_empty())
                    .map(ToString::to_string)
                    .collect(),
            )),
            Ok(None) => Ok(None),
            Err(err) => Err(RedisClientError::OperationError(err)),
        }
    }

    pub async fn get_all_items_for_user<T: DeserializeOwned>(
        &self,
        user_id: &str,
    ) -> Result<Vec<T>, RedisClientError> {
        let key = format!("transferring_items:{}", user_id);
        let mut conn = self.pool.get().await.map_err(RedisClientError::PoolError)?;

        let items: Vec<String> = conn
            .lrange(&key, 0, -1)
            .await
            .map_err(RedisClientError::OperationError)?;

        items
            .into_iter()
            .map(|item_string| {
                serde_json::from_str(&item_string).map_err(|_| RedisClientError::SerializationError)
            })
            .collect()
    }

    pub async fn remove_items_with_id_from_user_list(
        &self,
        user_id: &str,
        item_id: &str,
    ) -> Result<(), RedisClientError> {
        let key = format!("transferring_items:{}", user_id);
        let mut conn = self.pool.get().await.map_err(RedisClientError::PoolError)?;

        let items: Vec<String> = conn
            .lrange(&key, 0, -1)
            .await
            .map_err(RedisClientError::OperationError)?;

        for item_str in items {
            if let Ok(item) = serde_json::from_str::<serde_json::Value>(&item_str) {
                if let Some(current_item_id) = item.get("item_id").and_then(|v| v.as_str()) {
                    if current_item_id == item_id {
                        conn.lrem::<_, _, i64>(&key, 1, item_str)
                            .await
                            .map_err(RedisClientError::OperationError)?;
                    }
                }
            }
        }

        Ok(())
    }
}
