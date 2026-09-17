import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Loading, EmptyState } from "@/components/silentcx/primitives";
import ReportRenderer from "@/components/silentcx/ReportRenderer";
import { ArrowLeft } from "lucide-react";

export default function ReportView() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  useEffect(() => { api.report(id).then(setD).catch(() => setD(false)); }, [id]);
  if (d === null) return <Loading label="Loading report…" />;
  if (!d) return <EmptyState title="Report not available" body="This report may not be published yet." action={<Link to="/app/reports" className="sx-btn-secondary">Back to Reports</Link>} />;
  return (
    <div className="sx-fade-up" data-testid="report-view">
      <Link to="/app/reports" className="sx-btn-ghost mb-4" data-testid="report-back"><ArrowLeft className="w-4 h-4" /> Reports</Link>
      <ReportRenderer report={d.report} project={d.project} />
    </div>
  );
}
