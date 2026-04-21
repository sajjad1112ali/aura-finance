import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/store/auth";
import { useFinance } from "@/store/finance";
import { useTheme } from "@/store/theme";
import AuthPage from "@/features/auth/AuthPage";
import { AppShell, Tab } from "@/components/AppShell";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { TransactionsList } from "@/features/transactions/TransactionsList";
import { CategoriesPage } from "@/features/categories/CategoriesPage";
import { ExportDialog } from "@/features/export/ExportDialog";
import { RecurringDialog } from "@/features/recurring/RecurringDialog";

const Index = () => {
  const { user, initialized, init } = useAuth();
  const loadFinance = useFinance((s) => s.load);
  const resetFinance = useFinance((s) => s.reset);
  const initTheme = useTheme((s) => s.init);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [exportOpen, setExportOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);

  useEffect(() => {
    init();
    initTheme();
  }, [init, initTheme]);

  useEffect(() => {
    if (user) {
      loadFinance(user.id);
    } else {
      resetFinance();
    }
  }, [user, loadFinance, resetFinance]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <div className="min-h-screen bg-background">
      <AppShell
        active={tab}
        onChange={setTab}
        onExport={() => setExportOpen(true)}
        onRecurring={() => setRecurringOpen(true)}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "dashboard" && <Dashboard />}
            {tab === "transactions" && <TransactionsList />}
            {tab === "categories" && <CategoriesPage />}
          </motion.div>
        </AnimatePresence>
      </main>
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <RecurringDialog open={recurringOpen} onOpenChange={setRecurringOpen} />
    </div>
  );
};

export default Index;
