import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useFinance } from "@/hooks/useFinance";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { inrDecimal, formatDate } from "@/lib/format";
import { toast } from "sonner";

const ExportPDF = () => {
  const { incomes, expenses, totalIncome, totalExpense, balance } = useFinance();
  const [busy, setBusy] = useState(false);

  const generate = () => {
    if (incomes.length + expenses.length === 0) {
      toast.error("No data to export");
      return;
    }
    setBusy(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Smart Budget Report", 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`Generated ${new Date().toLocaleString("en-IN")}`, 14, 25);

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Total Income: ${inrDecimal(totalIncome)}`, 14, 36);
      doc.text(`Total Expenses: ${inrDecimal(totalExpense)}`, 14, 43);
      doc.text(`Net Balance: ${inrDecimal(balance)}`, 14, 50);

      autoTable(doc, {
        startY: 58,
        head: [["Date", "Source", "Amount", "Description"]],
        body: incomes.map((i) => [formatDate(i.occurred_at), i.source, inrDecimal(i.amount), i.description ?? ""]),
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 9 },
        didDrawPage: (d) => {
          doc.setFontSize(12);
          doc.text("Income", 14, d.cursor!.y - (d.table.body.length ? 6 : 0));
        },
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [["Date", "Category", "Amount", "Description"]],
        body: expenses.map((e) => [formatDate(e.occurred_at), e.category, inrDecimal(e.amount), e.description ?? ""]),
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 9 },
      });

      doc.save(`budget-report-${Date.now()}.pdf`);
      toast.success("PDF downloaded");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Export Report</h2>
        <p className="text-sm text-muted-foreground">Download a PDF of all your transactions</p>
      </div>
      <div className="glass rounded-2xl p-6">
        <p className="text-sm text-muted-foreground mb-4">
          Includes income, expenses, totals, and balance — all in INR with proper formatting.
        </p>
        <Button
          onClick={generate}
          disabled={busy}
          className="gap-2 bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)]"
        >
          <Download className="h-4 w-4" /> {busy ? "Generating…" : "Download PDF"}
        </Button>
      </div>
    </div>
  );
};
export default ExportPDF;