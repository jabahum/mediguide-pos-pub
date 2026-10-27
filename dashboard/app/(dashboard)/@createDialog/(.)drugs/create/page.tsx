import CreatePage from "@/app/(dashboard)/drugs/create/page";
import { CreateRouteDialog } from "@/components/dialogs/create-route-dialog";

export default function CreateDialogPage() {
  return <CreateRouteDialog title="Add drug"><CreatePage /></CreateRouteDialog>;
}
