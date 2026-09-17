import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const GOLD = [229, 169, 60];
const DARK = [13, 17, 23];
const VOID = [6, 8, 12];
const WHITE = [255, 255, 255];
const GRAY = [100, 116, 139];

function idr(n) {
  if (n == null) return "-";
  return "IDR " + Number(n).toLocaleString("id-ID");
}
function ratingText(s) {
  if (s >= 90) return "Excellent";
  if (s >= 80) return "Good";
  if (s >= 70) return "Needs Attention";
  if (s >= 60) return "Poor";
  return "Critical";
}

export function generateReportPDF(report, project) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const ent = (project && project.entitlements) || [];
  const has = (f) => ent.includes(f);

  // ---------- COVER ----------
  doc.setFillColor(...VOID);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, W, 6, "F");

  // mark
  doc.setFillColor(...GOLD);
  doc.circle(W / 2, 150, 26, "F");
  doc.setFillColor(...VOID);
  doc.circle(W / 2, 150, 11, "F");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.text("SilentCX", W / 2, 240, { align: "center" });
  doc.setTextColor(...GOLD);
  doc.setFontSize(11);
  doc.text("Experience. Evidence. Insight. Improvement.", W / 2, 262, { align: "center" });

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(18);
  doc.text("Customer Experience Audit Report", W / 2, 330, { align: "center" });

  const rows = [
    ["Client", report.client_company || "-"],
    ["Outlet", report.outlet_name || "-"],
    ["Audit ID", report.audit_id || "-"],
    ["Audit Date", report.audit_date ? new Date(report.audit_date).toLocaleDateString("en-GB") : "-"],
    ["Package", report.package_name || "-"],
    ["Overall CX Score", `${report.overall_cx_score}  (${ratingText(report.overall_cx_score)})`],
  ];
  autoTable(doc, {
    startY: 380,
    margin: { left: 140, right: 140 },
    theme: "plain",
    body: rows,
    styles: { fontSize: 11, textColor: 230, cellPadding: 6 },
    columnStyles: { 0: { textColor: GOLD, fontStyle: "bold", cellWidth: 130 }, 1: { textColor: 220 } },
    tableLineColor: [33, 40, 54],
  });
  doc.setTextColor(...GRAY);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleDateString("en-GB")}`, W / 2, H - 40, { align: "center" });

  // helper to start a content page
  const sectionHeader = (title) => {
    if (doc.lastAutoTable) {
      // continue on new page for each major block for clarity
    }
    doc.addPage();
    doc.setFillColor(...VOID);
    doc.rect(0, 0, W, H, "F");
    doc.setFillColor(...GOLD);
    doc.rect(0, 0, W, 4, "F");
    doc.setTextColor(...GOLD);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("SILENTCX AUDIT REPORT", M, 30);
    doc.setTextColor(...WHITE);
    doc.setFontSize(18);
    doc.text(title, M, 64);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1);
    doc.line(M, 74, M + 60, 74);
    return 100;
  };

  const wrapText = (text, y, size = 10, color = [200, 208, 220]) => {
    doc.setTextColor(...color);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text || "-", W - M * 2);
    doc.text(lines, M, y);
    return y + lines.length * (size + 4) + 10;
  };

  // ---------- EXECUTIVE SUMMARY ----------
  let y = sectionHeader("Executive Summary");
  y = wrapText(report.executive_summary, y);
  doc.setFillColor(...DARK);
  doc.roundedRect(M, y, W - M * 2, 70, 6, 6, "F");
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.text(String(report.overall_cx_score), M + 24, y + 48);
  doc.setTextColor(...WHITE);
  doc.setFontSize(12);
  doc.text("Overall CX Score", M + 110, y + 34);
  doc.setTextColor(...GRAY);
  doc.setFontSize(10);
  doc.text(ratingText(report.overall_cx_score), M + 110, y + 52);

  // ---------- CATEGORY SCORES ----------
  sectionHeader("Category Scores");
  autoTable(doc, {
    startY: 100,
    margin: { left: M, right: M },
    head: [["Category", "Weight", "Score", "Rating"]],
    body: (report.category_scores || []).map((c) => [c.name, `${c.weight}%`, c.score, ratingText(c.score)]),
    theme: "grid",
    headStyles: { fillColor: GOLD, textColor: VOID, fontStyle: "bold" },
    bodyStyles: { fillColor: DARK, textColor: 220 },
    alternateRowStyles: { fillColor: [21, 27, 35] },
    styles: { cellPadding: 8, fontSize: 10, lineColor: [33, 40, 54] },
  });

  // ---------- CUSTOMER JOURNEY ----------
  if (has("customer_journey") && report.customer_journey) {
    sectionHeader("Customer Journey");
    autoTable(doc, {
      startY: 100, margin: { left: M, right: M },
      head: [["Stage", "Score", "Sentiment", "Note"]],
      body: report.customer_journey.map((j) => [j.stage, j.score, j.sentiment, j.note]),
      theme: "grid",
      headStyles: { fillColor: GOLD, textColor: VOID, fontStyle: "bold" },
      bodyStyles: { fillColor: DARK, textColor: 220 },
      alternateRowStyles: { fillColor: [21, 27, 35] },
      styles: { cellPadding: 7, fontSize: 9, lineColor: [33, 40, 54] },
    });
  }

  // ---------- SOP COMPLIANCE ----------
  if (has("sop_compliance") && report.sop_compliance) {
    sectionHeader(`SOP Compliance — ${report.sop_compliance.score}%`);
    autoTable(doc, {
      startY: 100, margin: { left: M, right: M },
      head: [["SOP Item", "Status", "Note"]],
      body: report.sop_compliance.items.map((i) => [i.item, i.status.toUpperCase(), i.note]),
      theme: "grid",
      headStyles: { fillColor: GOLD, textColor: VOID, fontStyle: "bold" },
      bodyStyles: { fillColor: DARK, textColor: 220 },
      alternateRowStyles: { fillColor: [21, 27, 35] },
      styles: { cellPadding: 7, fontSize: 9, lineColor: [33, 40, 54] },
    });
  }

  // ---------- KEY FINDINGS ----------
  sectionHeader("Key Findings");
  autoTable(doc, {
    startY: 100, margin: { left: M, right: M },
    head: [["#", "Finding", "Category", "Severity", "Status"]],
    body: (report.findings || []).map((f, i) => [i + 1, f.title, f.category, f.severity.toUpperCase(), f.status]),
    theme: "grid",
    headStyles: { fillColor: GOLD, textColor: VOID, fontStyle: "bold" },
    bodyStyles: { fillColor: DARK, textColor: 220 },
    alternateRowStyles: { fillColor: [21, 27, 35] },
    styles: { cellPadding: 7, fontSize: 9, lineColor: [33, 40, 54] },
    columnStyles: { 0: { cellWidth: 24 } },
  });

  // ---------- RECOMMENDATIONS ----------
  sectionHeader("Recommendations");
  autoTable(doc, {
    startY: 100, margin: { left: M, right: M },
    head: [["Action", "Priority", "Area", "Target"]],
    body: (report.recommendations || []).map((r) => [
      r.title, r.priority, r.responsible_area,
      r.target_date ? new Date(r.target_date).toLocaleDateString("en-GB") : "-",
    ]),
    theme: "grid",
    headStyles: { fillColor: GOLD, textColor: VOID, fontStyle: "bold" },
    bodyStyles: { fillColor: DARK, textColor: 220 },
    alternateRowStyles: { fillColor: [21, 27, 35] },
    styles: { cellPadding: 7, fontSize: 9, lineColor: [33, 40, 54] },
  });

  // ---------- MANAGEMENT SUMMARY ----------
  if (has("management_summary") && report.management_summary) {
    let my = sectionHeader("Management Summary");
    wrapText(report.management_summary, my);
  }

  // ---------- PERFORMANCE: MULTI-OUTLET ----------
  if (has("multi_outlet") && report.outlet_comparison) {
    sectionHeader("Multi-Outlet Comparison & Ranking");
    autoTable(doc, {
      startY: 100, margin: { left: M, right: M },
      head: [["Outlet", "CX Score", "SOP", "Rating"]],
      body: report.outlet_comparison.map((o) => [o.outlet, o.score, `${o.sop}%`, ratingText(o.score)]),
      theme: "grid",
      headStyles: { fillColor: GOLD, textColor: VOID, fontStyle: "bold" },
      bodyStyles: { fillColor: DARK, textColor: 220 },
      alternateRowStyles: { fillColor: [21, 27, 35] },
      styles: { cellPadding: 8, fontSize: 10, lineColor: [33, 40, 54] },
    });
    if (report.critical_outlet) {
      doc.setTextColor(...GOLD);
      doc.setFontSize(11);
      doc.text(`Critical Outlet: ${report.critical_outlet.outlet} (${report.critical_outlet.score})`,
        M, doc.lastAutoTable.finalY + 24);
    }
  }

  // ---------- COMPETITOR BENCHMARK ----------
  if (has("competitor_benchmark") && report.competitor_benchmark) {
    const cb = report.competitor_benchmark;
    sectionHeader(`Competitor Benchmark vs ${cb.competitor_name}`);
    autoTable(doc, {
      startY: 100, margin: { left: M, right: M },
      head: [["Metric", "Your Outlet", "Competitor"]],
      body: cb.metrics.map((m) => [m.metric, m.client, m.competitor]),
      theme: "grid",
      headStyles: { fillColor: GOLD, textColor: VOID, fontStyle: "bold" },
      bodyStyles: { fillColor: DARK, textColor: 220 },
      alternateRowStyles: { fillColor: [21, 27, 35] },
      styles: { cellPadding: 8, fontSize: 10, lineColor: [33, 40, 54] },
    });
  }

  // ---------- RE-AUDIT ----------
  if (has("re_audit_comparison") && report.re_audit) {
    const ra = report.re_audit;
    sectionHeader("Re-Audit Comparison");
    autoTable(doc, {
      startY: 100, margin: { left: M, right: M },
      head: [["Metric", "Value"]],
      body: [
        ["Initial Score", ra.initial_score],
        ["Re-Audit Score", ra.reaudit_score],
        ["Improvement", `+${ra.delta}`],
        ["Resolved Findings", ra.resolved_findings],
        ["New Findings", ra.new_findings],
      ],
      theme: "grid",
      headStyles: { fillColor: GOLD, textColor: VOID, fontStyle: "bold" },
      bodyStyles: { fillColor: DARK, textColor: 220 },
      styles: { cellPadding: 8, fontSize: 10, lineColor: [33, 40, 54] },
    });
  }

  // ---------- FOOTER page numbers ----------
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    if (i > 1) doc.text(`SilentCX  •  ${report.audit_id}  •  Page ${i} of ${pages}`, W - M, H - 24, { align: "right" });
  }

  doc.save(`SilentCX_Report_${report.audit_id}.pdf`);
}
