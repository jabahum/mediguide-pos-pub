import CreatePage from "@/app/(dashboard)/guidelines/create/page";
import { CreateRouteDialog } from "@/components/dialogs/create-route-dialog";

export default function CreateDialogPage() {
  return <CreateRouteDialog title="Create guideline"><CreatePage /></CreateRouteDialog>;
}
