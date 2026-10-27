import CreatePage from "@/app/(dashboard)/decision-tools/create/page";
import { CreateRouteDialog } from "@/components/dialogs/create-route-dialog";

export default function CreateDialogPage() {
  return <CreateRouteDialog title="Create decision tool"><CreatePage /></CreateRouteDialog>;
}
