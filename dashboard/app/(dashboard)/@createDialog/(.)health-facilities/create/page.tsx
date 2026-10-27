import CreatePage from "@/app/(dashboard)/health-facilities/create/page";
import { CreateRouteDialog } from "@/components/dialogs/create-route-dialog";

export default function CreateDialogPage() {
  return <CreateRouteDialog title="Add health facility"><CreatePage /></CreateRouteDialog>;
}
