import { Client, errors } from "@elastic/elasticsearch";
import { elasticSearchConfig } from "./config";

const client = new Client({
  node: elasticSearchConfig.baseUrl,
});

const indexName = elasticSearchConfig.index;

export async function removeItemFromElasticsearch(itemId: string): Promise<boolean> {
  try {
    await client.deleteByQuery({
      index: indexName,
      refresh: true,
      body: {
        query: {
          term: {
            item_id: itemId,
          },
        },
      },
    });

    return true;
  } catch (error: unknown) {
    if (error instanceof errors.ResponseError) {
      console.error(`Failed to remove item ${itemId} from Elasticsearch: ${error.message}`);
    } else {
      console.error(`Error removing item ${itemId} from Elasticsearch:`, error);
    }
    throw error;
  }
}
