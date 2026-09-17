"""Dry-run-first repair of derived RAG data; never approves or publishes content."""
import argparse
import json
import math
import uuid

from app.core.db import db_conn
from app.document_processing.chunker import chunk_blocks
from app.document_processing.types import ExtractedContentBlock
from app.embeddings.factory import get_embedding_provider, to_pgvector


def validate_version(version):
    if not version or version["status"] not in {"draft", "review_required"}:
        raise ValueError("Repair requires an editable, unpublished version")
    if version.get("current_markdown_revision_id") != version.get("structured_markdown_revision_id"):
        raise ValueError("Regenerate the current Markdown before repairing RAG")


def validate_vectors(vectors, count):
    if len(vectors) != count or any(
        not vector or not any(vector) or not all(math.isfinite(value) for value in vector)
        for vector in vectors
    ):
        raise ValueError("Embedding provider returned incomplete or invalid vectors")


def repair(version_id, execute=False):
    with db_conn() as conn, conn.cursor() as cur:
        cur.execute("""SELECT gv.*, gd.language AS document_language,
            gd.program_area, gd.source_org, gd.title AS document_title
            FROM guideline_versions gv JOIN guideline_documents gd ON gd.id=gv.document_id
            WHERE gv.id=%s AND gv.deleted_at IS NULL""", (version_id,))
        version = cur.fetchone()
        validate_version(version)
        cur.execute("""
            SELECT b.* FROM guideline_content_blocks b
            WHERE b.version_id=%s AND b.deleted_at IS NULL AND b.review_status='reviewed'
              AND (NOT EXISTS (SELECT 1 FROM guideline_chunks c WHERE c.block_id=b.id AND c.deleted_at IS NULL)
                OR EXISTS (SELECT 1 FROM guideline_chunks c WHERE c.block_id=b.id AND c.deleted_at IS NULL AND c.embedding IS NULL))
            ORDER BY b.sort_order, b.id
        """, (version_id,))
        blocks = cur.fetchall()
    print(json.dumps({"version_id": version_id, "execute": execute, "candidate_blocks": len(blocks)}))
    embedder = get_embedding_provider() if execute else None
    for block in blocks:
        # Serialize derived data and persist under the same locks: concurrent edits
        # cannot cause old text to be embedded into a newer block or projection.
        with db_conn() as conn, conn.cursor() as cur:
            cur.execute("SELECT * FROM guideline_versions WHERE id=%s AND deleted_at IS NULL FOR UPDATE", (version_id,))
            current = cur.fetchone()
            validate_version(current)
            for key in ("current_markdown_revision_id", "structured_markdown_revision_id"):
                if current[key] != version[key]:
                    raise ValueError("Source changed during repair; rerun dry-run")
            cur.execute("SELECT * FROM guideline_content_blocks WHERE id=%s AND deleted_at IS NULL FOR UPDATE", (block["id"],))
            current_block = cur.fetchone()
            if not current_block or current_block["review_status"] != "reviewed" or current_block["content_json"] != block["content_json"]:
                raise ValueError("Block changed during repair; rerun dry-run")
            cur.execute("SELECT * FROM guideline_chunks WHERE block_id=%s AND deleted_at IS NULL FOR UPDATE", (block["id"],))
            existing = cur.fetchall()
            missing = [chunk for chunk in existing if chunk["embedding"] is None]
            generated = [] if existing else chunk_blocks([ExtractedContentBlock(
                type=block["type"], sort_order=block["sort_order"],
                content=block["content_json"], source_fingerprint="",
                page_start=block.get("page_start"), page_end=block.get("page_end"),
            )])
            texts = [chunk["content"] for chunk in missing] + [chunk.content for chunk in generated]
            print(json.dumps({"block_id": str(block["id"]), "type": block["type"], "new_chunks": len(generated), "missing_embeddings": len(missing), "unindexable": not existing and not generated}))
            if not execute or not texts:
                continue
            vectors = embedder.embed(texts)
            validate_vectors(vectors, len(texts))
            for chunk, vector in zip(missing, vectors):
                cur.execute("UPDATE guideline_chunks SET embedding=%s::vector, embedding_text=%s WHERE id=%s AND embedding IS NULL", (to_pgvector(vector), chunk["content"], chunk["id"]))
            for chunk, vector in zip(generated, vectors[len(missing):]):
                cur.execute("""
                    INSERT INTO guideline_chunks
                    (id, document_id, version_id, section_id, block_id, title, content, html,
                     page_start, page_end, language, program_area, source_name, source_version,
                     review_status, embedding_text, embedding)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'draft',%s,%s::vector)
                """, (uuid.uuid4(), version["document_id"], version_id, block["section_id"],
                      block["id"], chunk.title, chunk.content, chunk.html,
                      chunk.page_start, chunk.page_end, version.get("document_language") or "en",
                      version.get("program_area"), version.get("source_org") or version.get("document_title"),
                      version.get("version"), chunk.content, to_pgvector(vector)))
            conn.commit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version-id", required=True, type=uuid.UUID)
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    repair(str(args.version_id), args.execute)
