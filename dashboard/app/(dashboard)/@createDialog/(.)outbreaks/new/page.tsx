import CreatePage from "@/app/(dashboard)/outbreaks/new/page";
import { CreateRouteDialog } from "@/components/dialogs/create-route-dialog";

export default function CreateDialogPage() {
  return <CreateRouteDialog title="New outbreak"><CreatePage /></CreateRouteDialog>;
}
