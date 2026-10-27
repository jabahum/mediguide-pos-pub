import CreatePage from "@/app/(dashboard)/generic-pages/[pageKey]/content/create/page";
import { CreateRouteDialog } from "@/components/dialogs/create-route-dialog";

export default function CreateDialogPage({ params }: { params: Promise<{ pageKey: string }> }) {
  return <CreateRouteDialog title="Create page content"><CreatePage params={params} /></CreateRouteDialog>;
}
