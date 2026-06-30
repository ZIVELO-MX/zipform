import { PageSubHeader, SegmentedControl } from "@zipform/ui";
import { TlozHeader } from "./tloz-header";

type TlozPageShellProps = {
  title: string;
  description?: string;
  currentView?: string;
  children: React.ReactNode;
  detailLabel?: string;
  showSearch?: boolean;
  showHeader?: boolean;
  fullWidth?: boolean;
};

export function TlozPageShell({
  title,
  description,
  currentView,
  detailLabel,
  showSearch = true,
  showHeader = true,
  fullWidth = false,
  children
}: TlozPageShellProps) {
  return (
    <div className={fullWidth ? "tloz-page-full" : "page-stack tloz-page"}>
      <TlozHeader
        title={title}
        currentView={currentView}
        detailLabel={detailLabel}
        showSearch={showSearch}
        showHeader={showHeader}
      />

      {children}
    </div>
  );
}

export function TlozSubpageHeader({ title, description }: { title: string; description: string }) {
  return <PageSubHeader title={title} description={description} />;
}

export function TlozViewHeader({
  title,
  description,
  children,
  showAudienceToggle = false
}: {
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
  showAudienceToggle?: boolean;
}) {
  return (
    <PageSubHeader
      title={title}
      description={description}
      actions={
        <>
          {showAudienceToggle ? (
            <SegmentedControl
              aria-label="Filtrar por audiencia"
              value="team"
              options={[
                { label: "Todo el equipo", value: "team" },
                { label: "Solo yo", value: "me" },
              ]}
            />
          ) : null}
          {children}
        </>
      }
    />
  );
}
