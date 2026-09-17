import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Loading, EmptyState } from "@/components/silentcx/primitives";
import ReportRenderer from "@/components/silentcx/ReportRenderer";
import { ArrowLeft } from "lucide-react";

export default function AdminReportView() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  useEffect(() => { api.report(id).then(setD).catch(() => setD(false)); }, [id]);
  if (d === null) return <Loading label="Loading report…" />;
  if (!d) return <EmptyState title="Report not available" body="This project has no report yet." action={<Link to="/admin/reports" className="sx-btn-secondary">Back to Reports</Link>} />;
  return (
    <div className="sx-fade-up" data-testid="admin-report-view">
      <Link to="/admin/reports" className="sx-btn-ghost mb-4 -ml-2" data-testid="admin-report-back"><ArrowLeft className="w-4 h-4" /> Reports</Link>
      <ReportRenderer report={d.report} project={d.project} />
    </div>
  );
}
