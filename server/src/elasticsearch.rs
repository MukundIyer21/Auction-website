use elasticsearch::{
    http::transport::Transport,
    indices::{IndicesCreateParts, IndicesPutMappingParts},
    params::Refresh,
    Elasticsearch, Error, IndexParts, SearchParts,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

pub struct ElasticSearchClient {
    client: Elasticsearch,
    index_name: String,
}

impl ElasticSearchClient {
    pub async fn new(url: &str, index_name: &str) -> Result<Self, Error> {
        let transport = Transport::single_node(url)?;
        let client = Elasticsearch::new(transport);

        let elastic_client = ElasticSearchClient {
            client,
            index_name: index_name.to_string(),
        };

        elastic_client.create_index_if_not_exists().await?;

        Ok(elastic_client)
    }

    async fn create_index_if_not_exists(&self) -> Result<(), Error> {
        let indices = self.client.indices();

        let response = indices
            .exists(elasticsearch::indices::IndicesExistsParts::Index(&[
                &self.index_name
            ]))
            .send()
            .await?;

        if response.status_code() == 404 {
            indices
                .create(IndicesCreateParts::Index(&self.index_name))
                .body(json!({
                    "settings": {
                        "number_of_shards": 1,
                        "number_of_replicas": 0,
                        "analysis": {
                            "analyzer": {
                                "autocomplete": {
                                    "tokenizer": "standard",
                                    "filter": ["lowercase", "edge_ngram"]
                                },
                                "autocomplete_search": {
                                    "tokenizer": "standard",
                                    "filter": ["lowercase"]
                                }
                            },
                            "filter": {
                                "edge_ngram": {
                                    "type": "edge_ngram",
                                    "min_gram": 1,
                                    "max_gram": 20
                                }
                            }
                        }
                    }
                }))
                .send()
                .await?;

            indices
                .put_mapping(IndicesPutMappingParts::Index(&[&self.index_name]))
                .body(json!({
                    "properties": {
                        "item_name": {
                            "type": "text",
                            "analyzer": "autocomplete",
                            "search_analyzer": "autocomplete_search",
                            "fields": {
                                "keyword": {
                                    "type": "keyword"
                                }
                            }
                        },
                        "category": {
                            "type": "text",
                            "analyzer": "autocomplete",
                            "search_analyzer": "autocomplete_search",
                            "fields": {
                                "keyword": {
                                    "type": "keyword"
                                }
                            }
                        },
                        "item_id": {
                            "type": "keyword"
                        }
                    }
                }))
                .send()
                .await?;
        }

        Ok(())
    }

    pub async fn index_item(
        &self,
        item_id: &str,
        item_name: &str,
        category: &str,
    ) -> Result<(), Error> {
        self.client
            .index(IndexParts::Index(&self.index_name))
            .body(json!({
                "item_id": item_id,
                "item_name": item_name,
                "category": category,
            }))
            .refresh(Refresh::True)
            .send()
            .await?;

        Ok(())
    }

    pub async fn search_items(
        &self,
        query: &str,
        limit: usize,
    ) -> Result<Vec<SearchResult>, Error> {
        let response = self
            .client
            .search(SearchParts::Index(&[&self.index_name]))
            .body(json!({
                "size": limit,
                "query": {
                    "multi_match": {
                        "query": query,
                        "fields": [
                            "item_name^2",
                            "item_name.keyword^3",
                            "category",
                            "category.keyword^2"
                        ],
                        "type": "best_fields",
                        "fuzziness": "AUTO"
                    }
                },
                "highlight": {
                    "fields": {
                        "item_name": {},
                        "category": {}
                    }
                },
                "_source": ["item_id", "item_name", "category"]
            }))
            .send()
            .await?;

        let response_body = response.json::<Value>().await?;

        let mut results = Vec::new();

        if let Some(hits) = response_body["hits"]["hits"].as_array() {
            for hit in hits {
                let item_id = hit["_source"]["item_id"]
                    .as_str()
                    .unwrap_or_default()
                    .to_string();
                let item_name = hit["_source"]["item_name"]
                    .as_str()
                    .unwrap_or_default()
                    .to_string();
                let category = hit["_source"]["category"]
                    .as_str()
                    .unwrap_or_default()
                    .to_string();
                let score = hit["_score"].as_f64().unwrap_or_default();

                results.push(SearchResult {
                    item_id,
                    item_name,
                    category,
                    score,
                    matched_field: if hit["highlight"]["category"].is_array() {
                        "category".to_string()
                    } else {
                        "name".to_string()
                    },
                });
            }
        }

        Ok(results)
    }

    pub async fn autocomplete(
        &self,
        prefix: &str,
        limit: usize,
    ) -> Result<Vec<SearchResult>, Error> {
        let response = self
            .client
            .search(SearchParts::Index(&[&self.index_name]))
            .body(json!({
                "size": limit,
                "query": {
                    "bool": {
                        "should": [
                            {
                                "match_phrase_prefix": {
                                    "item_name": {
                                        "query": prefix,
                                        "max_expansions": 10,
                                        "boost": 2.0
                                    }
                                }
                            },
                            {
                                "prefix": {
                                    "item_name.keyword": {
                                        "value": prefix,
                                        "boost": 3.0
                                    }
                                }
                            },
                            {
                                "match_phrase_prefix": {
                                    "category": {
                                        "query": prefix,
                                        "max_expansions": 10
                                    }
                                }
                            },
                            {
                                "prefix": {
                                    "category.keyword": {
                                        "value": prefix,
                                        "boost": 1.5
                                    }
                                }
                            }
                        ]
                    }
                },
                "highlight": {
                    "fields": {
                        "item_name": {},
                        "category": {}
                    }
                },
                "_source": ["item_id", "item_name", "category"]
            }))
            .send()
            .await?;

        let response_body = response.json::<Value>().await?;

        let mut results = Vec::new();

        if let Some(hits) = response_body["hits"]["hits"].as_array() {
            for hit in hits {
                let item_id = hit["_source"]["item_id"]
                    .as_str()
                    .unwrap_or_default()
                    .to_string();
                let item_name = hit["_source"]["item_name"]
                    .as_str()
                    .unwrap_or_default()
                    .to_string();
                let category = hit["_source"]["category"]
                    .as_str()
                    .unwrap_or_default()
                    .to_string();
                let score = hit["_score"].as_f64().unwrap_or_default();

                results.push(SearchResult {
                    item_id,
                    item_name,
                    category,
                    score,
                    matched_field: if hit["highlight"]["category"].is_array() {
                        "category".to_string()
                    } else {
                        "name".to_string()
                    },
                });
            }
        }

        Ok(results)
    }

    pub async fn remove_item(&self, item_id: &str) -> Result<(), Error> {
        self.client
            .delete(elasticsearch::DeleteParts::IndexId(
                &self.index_name,
                item_id,
            ))
            .refresh(Refresh::True)
            .send()
            .await?;

        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub item_id: String,
    pub item_name: String,
    pub category: String,
    pub score: f64,
    pub matched_field: String,
}
