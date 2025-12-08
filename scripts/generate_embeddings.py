 #!/usr/bin/env python3

import json
from pathlib import Path
from typing import List

import vertexai
from vertexai.preview.language_models import TextEmbeddingModel

PROJECT = "future-of-search"
LOCATION = "us-central1"
EMBEDDING_MODEL = "text-embedding-005"

PRODUCTS_PATH = Path("services/mock-vector-search/products-demo.json")
OUTPUT_DIR = Path("outputs")
JSONL_PATH = OUTPUT_DIR / "kiko-embeddings.jsonl"
INGEST_PATH = OUTPUT_DIR / "kiko-embeddings.json"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def build_embedding_prompt(product: dict) -> str:
    parts = [
        product.get("name", ""),
        product.get("description", ""),
        " ".join(product.get("styleTags", []) or []),
        product.get("category", ""),
        product.get("occasion", ""),
    ]
    return "\n".join(filter(None, parts))


def build_metadata(product: dict) -> List[dict]:
    restricts = []

    def add(namespace: str, value: str):
        if value:
            restricts.append({"namespace": namespace, "allowList": [value]})

    add("category", product.get("category"))
    add("subcategory", product.get("subcategory"))
    add("brand", product.get("brand"))
    add("color", product.get("color"))
    add("occasion", product.get("occasion"))
    add("season", product.get("season"))
    return restricts


def build_numeric_metadata(product: dict) -> List[dict]:
    numeric = []
    if price := product.get("price"):
        numeric.append(
            {
                "namespace": "price",
                "valueDouble": float(price),
            }
        )
    if rating := product.get("rating"):
        numeric.append(
            {
                "namespace": "rating",
                "valueDouble": float(rating),
            }
        )
    return numeric


def main():
    vertexai.init(project=PROJECT, location=LOCATION)
    embedding_model = TextEmbeddingModel.from_pretrained(EMBEDDING_MODEL)

    products = json.loads(PRODUCTS_PATH.read_text())
    with JSONL_PATH.open("w") as jsonl_out, INGEST_PATH.open("w") as ingest_out:
        for product in products:
            prompt = build_embedding_prompt(product)
            embedding = embedding_model.get_embeddings([prompt])[0]

            datapoint = {
                "id": product.get("sku") or product.get("name"),
                "featureVector": embedding.values,
                "restricts": build_metadata(product),
                "numericRestricts": build_numeric_metadata(product),
                "crowdingTag": {"crowdingAttribute": product.get("category", "")},
                "metadata": {
                    "name": product.get("name"),
                    "description": product.get("description"),
                    "price": product.get("price"),
                    "currency": product.get("currency"),
                    "imageUrl": product.get("imageUrl"),
                },
            }

            json_line = json.dumps(datapoint)
            jsonl_out.write(json_line + "\n")
            ingest_out.write(json_line + "\n")

    print(f"Wrote {len(products)} datapoints to {JSONL_PATH} and {INGEST_PATH}")


if __name__ == "__main__":
    main()
