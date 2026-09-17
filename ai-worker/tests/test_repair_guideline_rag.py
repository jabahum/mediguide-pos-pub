import pytest

from app.repair_guideline_rag import validate_vectors, validate_version


@pytest.mark.parametrize("status", ["published", "archived", "superseded", "processing"])
def test_repair_rejects_noneditable_versions(status):
    with pytest.raises(ValueError, match="unpublished"):
        validate_version({"status": status})


def test_repair_rejects_stale_projection():
    with pytest.raises(ValueError, match="Regenerate"):
        validate_version({"status": "review_required", "current_markdown_revision_id": "new", "structured_markdown_revision_id": "old"})


def test_repair_accepts_current_unpublished_projection():
    validate_version({"status": "review_required", "current_markdown_revision_id": "same", "structured_markdown_revision_id": "same"})


@pytest.mark.parametrize("vectors,count", [([], 1), ([[]], 1), ([[0, 0]], 1), ([[float("nan")]], 1), ([[float("inf")]], 1)])
def test_repair_rejects_invalid_embeddings(vectors, count):
    with pytest.raises(ValueError):
        validate_vectors(vectors, count)


def test_repair_accepts_valid_embeddings():
    validate_vectors([[0.1, -0.2]], 1)
