import CreatePage from "@/app/(dashboard)/situation-reports/new/page";
import { CreateRouteDialog } from "@/components/dialogs/create-route-dialog";

export default function CreateDialogPage() {
  return <CreateRouteDialog title="New situation report"><CreatePage /></CreateRouteDialog>;
}
