import CreatePage from "@/app/(dashboard)/support/documentation/create/page";
import { CreateRouteDialog } from "@/components/dialogs/create-route-dialog";

export default function CreateDialogPage() {
  return <CreateRouteDialog title="Create documentation"><CreatePage /></CreateRouteDialog>;
}
