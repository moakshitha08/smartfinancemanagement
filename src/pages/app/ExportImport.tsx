import { useRef, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useFinance } from "@/hooks/useFinance";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, FileSpreadsheet, Upload, Share2 } from "lucide-react";
import { inrDecimal, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { INCOME_SOURCES, EXPENSE_CATEGORIES } from "@/lib/categories";

type Kind = "income" | "expense";

/** Trigger a download or invoke native share on mobile when available. */
const deliverFile = async (filename: string, mime: string, data: Blob | string) => {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const file = new File([blob], filename, { type: mime });

  // Mobile: use Web Share API when supported (works with Notes, Files, email, etc.)
  const navAny = navigator as any;
  if (navAny.canShare && navAny.canShare({ files: [file] })) {
    try {
      await navAny.share({ files: [file], title: filename });
      return;
    } catch {
      // user cancelled or failed → fall through to download
    }
  }

  // Desktop / fallback: trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const csvEscape = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const ExportImport = () => {
  const { incomes, expenses, totalIncome, totalExpense, balance, refresh } = useFinance();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importKind, setImportKind] = useState<Kind>("expense");

  const noData = incomes.length + expenses.length === 0;

  /* -------------------- PDF -------------------- */
  const exportPDF = async () => {
    if (noData) return toast.error("No data to export");
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
      });
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [["Date", "Category", "Amount", "Description"]],
        body: expenses.map((e) => [formatDate(e.occurred_at), e.category, inrDecimal(e.amount), e.description ?? ""]),
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 9 },
      });

      const blob = doc.output("blob");
      await deliverFile(`budget-report-${Date.now()}.pdf`, "application/pdf", blob);
      toast.success("PDF ready");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------- CSV -------------------- */
  const buildCSV = (kind: Kind) => {
    if (kind === "income") {
      const head = ["Date", "Source", "Amount", "Description"];
      const rows = incomes.map((i) => [i.occurred_at.slice(0, 10), i.source, i.amount, i.description ?? ""]);
      return [head, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
    }
    const head = ["Date", "Category", "Amount", "Description"];
    const rows = expenses.map((e) => [e.occurred_at.slice(0, 10), e.category, e.amount, e.description ?? ""]);
    return [head, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
  };

  const exportCSV = async (kind: Kind) => {
    const list = kind === "income" ? incomes : expenses;
    if (!list.length) return toast.error(`No ${kind} data`);
    setBusy(true);
    try {
      await deliverFile(`${kind}s-${Date.now()}.csv`, "text/csv", buildCSV(kind));
      toast.success("CSV ready");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------- TXT (notepad-friendly) -------------------- */
  const exportTXT = async () => {
    if (noData) return toast.error("No data to export");
    setBusy(true);
    try {
      const lines: string[] = [];
      lines.push("SMART BUDGET REPORT");
      lines.push("=".repeat(40));
      lines.push(`Generated: ${new Date().toLocaleString("en-IN")}`);
      lines.push("");
      lines.push(`Total Income  : ${inrDecimal(totalIncome)}`);
      lines.push(`Total Expenses: ${inrDecimal(totalExpense)}`);
      lines.push(`Net Balance   : ${inrDecimal(balance)}`);
      lines.push("");
      lines.push("INCOME");
      lines.push("-".repeat(40));
      incomes.forEach((i) =>
        lines.push(`${formatDate(i.occurred_at)} | ${i.source} | ${inrDecimal(i.amount)}${i.description ? " | " + i.description : ""}`),
      );
      lines.push("");
      lines.push("EXPENSES");
      lines.push("-".repeat(40));
      expenses.forEach((e) =>
        lines.push(`${formatDate(e.occurred_at)} | ${e.category} | ${inrDecimal(e.amount)}${e.description ? " | " + e.description : ""}`),
      );
      await deliverFile(`budget-report-${Date.now()}.txt`, "text/plain", lines.join("\n"));
      toast.success("Text file ready");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------- CSV Import -------------------- */
  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let cur: string[] = [];
    let val = "";
    let inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"' && text[i + 1] === '"') {
          val += '"';
          i++;
        } else if (c === '"') inQ = false;
        else val += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ",") {
          cur.push(val);
          val = "";
        } else if (c === "\n" || c === "\r") {
          if (val !== "" || cur.length) {
            cur.push(val);
            rows.push(cur);
            cur = [];
            val = "";
          }
          if (c === "\r" && text[i + 1] === "\n") i++;
        } else val += c;
      }
    }
    if (val !== "" || cur.length) {
      cur.push(val);
      rows.push(cur);
    }
    return rows.filter((r) => r.some((x) => x.trim() !== ""));
  };

  const handleImport = async (file: File) => {
    if (!user) return toast.error("Not signed in");
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) {
        toast.error("CSV is empty");
        return;
      }
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const idx = (name: string) => header.indexOf(name);
      const dateI = idx("date");
      const amtI = idx("amount");
      const descI = idx("description");
      const catI = importKind === "expense" ? idx("category") : idx("source");

      if (dateI < 0 || amtI < 0 || catI < 0) {
        toast.error(`CSV must include Date, ${importKind === "expense" ? "Category" : "Source"}, Amount`);
        return;
      }

      const validList = importKind === "expense" ? EXPENSE_CATEGORIES : INCOME_SOURCES;
      const records: any[] = [];
      let skipped = 0;
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const amount = Number(String(row[amtI]).replace(/[^\d.-]/g, ""));
        const dateStr = (row[dateI] ?? "").trim();
        let label = (row[catI] ?? "").trim();
        if (!label || isNaN(amount) || amount <= 0 || !dateStr) {
          skipped++;
          continue;
        }
        if (!validList.includes(label)) label = "Other";
        const occurred = new Date(dateStr);
        if (isNaN(occurred.getTime())) {
          skipped++;
          continue;
        }
        const base = {
          user_id: user.id,
          amount,
          occurred_at: occurred.toISOString(),
          description: descI >= 0 ? row[descI]?.trim() || null : null,
        };
        records.push(importKind === "expense" ? { ...base, category: label } : { ...base, source: label });
      }

      if (!records.length) {
        toast.error("No valid rows found");
        return;
      }

      const { error } = await supabase.from(importKind === "expense" ? "expenses" : "incomes").insert(records);
      if (error) throw error;
      toast.success(`Imported ${records.length} row${records.length > 1 ? "s" : ""}${skipped ? `, skipped ${skipped}` : ""}`);
      await refresh();
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      toast.error(e.message ?? "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async (kind: Kind) => {
    const head = kind === "expense" ? "Date,Category,Amount,Description" : "Date,Source,Amount,Description";
    const sample =
      kind === "expense"
        ? "\n2025-01-15,Reagents & Chemicals,1500,Sample reagents\n2025-01-16,Lab Consumables,350,"
        : "\n2025-01-15,Test Fees,5000,Sample test\n2025-01-16,Sample Processing,2500,";
    await deliverFile(`${kind}-template.csv`, "text/csv", head + sample);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Export & Import</h2>
        <p className="text-sm text-muted-foreground">Download your data in any format or import transactions from CSV</p>
      </div>

      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" /> Export
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" /> Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="mt-4">
          <div className="glass rounded-2xl p-6 space-y-5">
            <p className="text-sm text-muted-foreground">
              Choose a format. On mobile, you can save to Notes, Files, or share via any app.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onClick={exportPDF}
                disabled={busy || noData}
                className="gap-2 h-auto py-4 flex-col items-start bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90 shadow-[var(--shadow-glow)]"
              >
                <div className="flex items-center gap-2 w-full">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold">PDF Report</span>
                </div>
                <span className="text-xs opacity-90 font-normal">Full styled report with totals</span>
              </Button>

              <Button
                onClick={exportTXT}
                disabled={busy || noData}
                variant="secondary"
                className="gap-2 h-auto py-4 flex-col items-start"
              >
                <div className="flex items-center gap-2 w-full">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold">Text (.txt)</span>
                </div>
                <span className="text-xs text-muted-foreground font-normal">Notepad-friendly plain text</span>
              </Button>

              <Button
                onClick={() => exportCSV("income")}
                disabled={busy || !incomes.length}
                variant="outline"
                className="gap-2 h-auto py-4 flex-col items-start"
              >
                <div className="flex items-center gap-2 w-full">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="font-semibold">Income CSV</span>
                </div>
                <span className="text-xs text-muted-foreground font-normal">{incomes.length} record{incomes.length === 1 ? "" : "s"}</span>
              </Button>

              <Button
                onClick={() => exportCSV("expense")}
                disabled={busy || !expenses.length}
                variant="outline"
                className="gap-2 h-auto py-4 flex-col items-start"
              >
                <div className="flex items-center gap-2 w-full">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="font-semibold">Expenses CSV</span>
                </div>
                <span className="text-xs text-muted-foreground font-normal">{expenses.length} record{expenses.length === 1 ? "" : "s"}</span>
              </Button>
            </div>

            <p className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
              <Share2 className="h-3 w-3" />
              Mobile devices will open the share sheet for saving to apps like Notes, Drive, or Mail.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="import" className="mt-4">
          <div className="glass rounded-2xl p-6 space-y-5">
            <div>
              <p className="text-sm font-medium mb-2">Import type</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={importKind === "expense" ? "default" : "outline"}
                  onClick={() => setImportKind("expense")}
                >
                  Expenses
                </Button>
                <Button
                  size="sm"
                  variant={importKind === "income" ? "default" : "outline"}
                  onClick={() => setImportKind("income")}
                >
                  Income
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Upload a CSV with columns: <span className="font-mono text-foreground">Date, {importKind === "expense" ? "Category" : "Source"}, Amount, Description</span>
              </p>
              <Button variant="link" size="sm" className="px-0 h-auto" onClick={() => downloadTemplate(importKind)}>
                Download template
              </Button>
            </div>

            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                }}
              />
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="gap-2 w-full sm:w-auto bg-[image:var(--gradient-primary)] text-primary-foreground hover:opacity-90"
              >
                <Upload className="h-4 w-4" /> {importing ? "Importing…" : "Choose CSV file"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">
              Unknown categories will be saved as "Other". Invalid rows are skipped automatically.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExportImport;