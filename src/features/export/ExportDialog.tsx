import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet } from "lucide-react";
import { useFinance } from "@/store/finance";
import { useExportScope } from "@/store/exportScope";
import { api } from "@/services/api";
import { exportCSV, exportPDF } from "@/services/exporter";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: Props) {
  const { transactions, categories } = useFinance();
  const filteredIds = useExportScope((s) => s.filteredIds);
  const [allTx, setAllTx] = useState<typeof transactions | null>(null);

  // When exporting everything (no active filter), lazily fetch full history.
  useEffect(() => {
    if (!open || filteredIds !== null) return;
    let live = true;
    api
      .transactions.list()
      .then((rows) => live && setAllTx(rows))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [open, filteredIds]);

  const scope = useMemo(() => {
    if (filteredIds !== null) {
      const set = new Set(filteredIds);
      return transactions.filter((t) => set.has(t.id));
    }
    return allTx ?? transactions;
  }, [allTx, transactions, filteredIds]);

  const isFiltered = filteredIds !== null;
  const shownCount = filteredIds !== null ? scope.length : allTx?.length ?? transactions.length;

  const handle = (fn: () => void, label: string) => {
    if (!scope.length) return toast.error("Nothing to export");
    fn();
    toast.success(`${label} exported`);
    setAllTx(null);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setAllTx(null);
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Export your data</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {isFiltered ? (
            <>
              Exporting <span className="font-semibold text-foreground">{scope.length}</span> filtered
              {" "}of {shownCount} transactions.
            </>
          ) : (
            <>
              Downloading all <span className="font-semibold text-foreground">{shownCount}</span> transactions in your preferred format.
            </>
          )}
        </p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            onClick={() => handle(() => exportCSV(scope, categories), "CSV")}
            variant="outline"
            className="h-24 flex-col gap-2 hover:bg-accent hover:border-accent"
          >
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <span className="font-semibold">CSV</span>
          </Button>
          <Button
            onClick={() => handle(() => exportPDF(scope, categories), "PDF")}
            variant="outline"
            className="h-24 flex-col gap-2 hover:bg-accent hover:border-accent"
          >
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-semibold">PDF</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
