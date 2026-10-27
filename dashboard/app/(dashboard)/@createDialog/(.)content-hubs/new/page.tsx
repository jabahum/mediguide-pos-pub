import CreatePage from "@/app/(dashboard)/content-hubs/new/page";
import { CreateRouteDialog } from "@/components/dialogs/create-route-dialog";

export default function CreateDialogPage() {
  return <CreateRouteDialog title="New content hub"><CreatePage /></CreateRouteDialog>;
}
