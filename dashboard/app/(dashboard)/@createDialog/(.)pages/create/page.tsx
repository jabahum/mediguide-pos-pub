import CreatePage from "@/app/(dashboard)/pages/create/page";
import { CreateRouteDialog } from "@/components/dialogs/create-route-dialog";

export default function CreateDialogPage() {
  return <CreateRouteDialog title="Create page"><CreatePage /></CreateRouteDialog>;
}
