import { Settings } from "lucide-react";
import { EmptyModule, PageHeader } from "../../components/app-shell";

export default function SettingsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        description="Account, workspace, and platform options will connect here once authentication and permissions exist."
      />
      <EmptyModule
        icon={<Settings size={28} />}
        title="Settings placeholder"
        description="The UI is present so navigation, profile actions, and future account controls have a stable destination."
      />
    </div>
  );
}
