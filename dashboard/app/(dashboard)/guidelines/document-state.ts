import { getDocumentLatestVersion, type GuidelineVersionRecord, type GuidelineDocumentRecord } from "@/services/guideline-documents.service";

export function isDocumentPublished(document: GuidelineDocumentRecord) {
  return !document.withdrawn_at && Boolean(document.current_version_id)
    && document.versions.some((version) => version.id === document.current_version_id && version.status === "published");
}

export function getGuidelineWorkStatus(version?: GuidelineVersionRecord | null) {
  if (!version || version.status === "published") return version?.status;
  if (version.structured_content_status === "approved") return "content_approved";
  if (version.structured_content_status === "outdated") return "regeneration_needed";
  return version.structured_content_status || version.status;
}

export function documentNeedsReview(document: GuidelineDocumentRecord) {
  return getGuidelineWorkStatus(getDocumentLatestVersion(document)) === "review_required";
}

export function matchesLibraryState(document: GuidelineDocumentRecord, state: string) {
  switch (state) {
    case "published": return isDocumentPublished(document);
    case "unpublished": return !document.withdrawn_at && !isDocumentPublished(document);
    case "review": return documentNeedsReview(document);
    case "withdrawn": return Boolean(document.withdrawn_at);
    default: return true;
  }
}
