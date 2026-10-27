import CreatePage from "@/app/(dashboard)/support/faqs/tags/create/page";
import { CreateRouteDialog } from "@/components/dialogs/create-route-dialog";

export default function CreateDialogPage() {
  return <CreateRouteDialog title="Create FAQ tag"><CreatePage /></CreateRouteDialog>;
}
