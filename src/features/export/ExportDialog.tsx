import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet } from "lucide-react";
import { useFinance } from "@/store/finance";
import { exportCSV, exportPDF } from "@/services/exporter";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: Props) {
  const { transactions, categories } = useFinance();

  const handle = (fn: () => void, label: string) => {
    if (transactions.length === 0) return toast.error("Nothing to export yet");
    fn();
    toast.success(`${label} exported`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Export your data</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Download all {transactions.length} transactions in your preferred format.
        </p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            onClick={() => handle(() => exportCSV(transactions, categories), "CSV")}
            variant="outline"
            className="h-24 flex-col gap-2 hover:bg-accent hover:border-accent"
          >
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            <span className="font-semibold">CSV</span>
          </Button>
          <Button
            onClick={() => handle(() => exportPDF(transactions, categories), "PDF")}
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
