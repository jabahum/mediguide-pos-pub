import { notFound } from "next/navigation";

// Preserve 404s when the parallel dialog slot matches an unknown URL.
export default function Default() {
  notFound();
}
