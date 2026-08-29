import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Download, Share2, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useReports } from "@/hooks/use-reports";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Intelligence Reports — OpenSource Pulse" },
      { name: "description", content: "Weekly AI-generated intelligence reports on the open source market." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { data: reports, isLoading } = useReports();

  if (isLoading) {
    return (
      <>
        <PageHeader title="Reports Archive" description="Loading..." />
        <div className="p-8 text-center text-muted-foreground text-sm font-mono">Loading reports...</div>
      </>
    );
  }

  const reportList = reports ?? [];

  return (
    <>
      <PageHeader
        eyebrow="PULSE INTELLIGENCE"
        title="Reports Archive"
        description="Premium weekly intelligence on the open source market — written by Pulse AI, structured like an analyst note."
      />

      <div className="px-4 md:px-8 py-6 space-y-6">
        {reportList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm font-mono">
            No reports available yet. Weekly reports are generated automatically every Monday.
          </div>
        ) : (
          <>
            {/* Featured */}
            <Link
              to="/reports/$id"
              params={{ id: String(reportList[0].id) }}
              className="block rounded-sm border border-border bg-card overflow-hidden relative group hover:border-accent/50"
            >
              <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
              <div className="absolute -top-32 -right-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" aria-hidden />
              <div className="relative grid grid-cols-12 gap-6 p-6 md:p-8">
                <div className="col-span-12 lg:col-span-8">
                  <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-accent">
                    LATEST · {new Date(reportList[0].generated_at).toLocaleDateString()}
                  </div>
                  <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight leading-tight max-w-2xl">
                    {reportList[0].title}
                  </h2>
                  <div className="mt-5 inline-flex items-center gap-1.5 rounded-sm bg-accent px-3 py-2 text-xs font-medium text-accent-foreground font-mono uppercase tracking-wider">
                    Read Brief <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Archive table */}
            <div className="rounded-sm border border-border bg-card">
              <div className="flex items-center justify-between px-4 h-9 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-accent">ARCHIVE</span>
                  <h3 className="text-[11px] font-mono uppercase tracking-[0.16em]">Past Briefs</h3>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{reportList.length} reports</span>
              </div>

              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="text-left px-4 py-2 font-medium">Issue</th>
                    <th className="text-left px-2 py-2 font-medium">Date</th>
                    <th className="text-right px-4 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportList.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-background/40">
                      <td className="px-4 py-3">
                        <Link to="/reports/$id" params={{ id: String(r.id) }} className="group inline-flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-accent" />
                          <span className="font-medium group-hover:text-accent">{r.title}</span>
                        </Link>
                      </td>
                      <td className="px-2 py-3 font-mono text-muted-foreground">{new Date(r.generated_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button className="h-7 w-7 inline-flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-accent/40" aria-label="Export">
                            <Download className="h-3 w-3" />
                          </button>
                          <button className="h-7 w-7 inline-flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-accent/40" aria-label="Share">
                            <Share2 className="h-3 w-3" />
                          </button>
                          <Link
                            to="/reports/$id" params={{ id: String(r.id) }}
                            className="h-7 inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-accent hover:border-accent/40"
                          >
                            Open <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
