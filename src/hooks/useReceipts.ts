import { useState, useEffect, useMemo } from "react";
import { getAllReceipts } from "@/services/receiptService";
import { Tables } from "@/utils/supabase/types";

interface DateRange {
  start: string;
  end: string;
}

export const useReceipts = (activeMenuItem: string, dateFilter: string, customDateRange: DateRange | null) => {
  const [receipts, setReceipts] = useState<Tables<"receipts">[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [receiptsError, setReceiptsError] = useState<string | null>(null);

  const fetchReceipts = async () => {
    setLoadingReceipts(true);
    setReceiptsError(null);
    try {
      console.log("🔄 Carregando recibos...");
      const fetchedReceipts = await getAllReceipts();
      setReceipts(fetchedReceipts);
      console.log(`✅ ${fetchedReceipts.length} recibos carregados`);
    } catch (err) {
      console.error("❌ Erro ao carregar recibos:", err);
      setReceiptsError(
        "Não foi possível carregar os recibos. Tente novamente."
      );
    } finally {
      setLoadingReceipts(false);
    }
  };

  useEffect(() => {
    if (activeMenuItem === "despesas") {
      fetchReceipts();
    }
  }, [activeMenuItem]);

  const filteredReceipts = useMemo(() => {
    if (dateFilter === "todos") return receipts;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    return receipts.filter((receipt) => {
      if (!receipt.date_detected) return false;

      const receiptDate = new Date(receipt.date_detected);

      switch (dateFilter) {
        case "mes":
          return (
            receiptDate.getMonth() === currentMonth &&
            receiptDate.getFullYear() === currentYear
          );
        case "3meses":
          const threeMonthsAgo = new Date(today);
          threeMonthsAgo.setMonth(today.getMonth() - 3);
          return receiptDate >= threeMonthsAgo && receiptDate <= today;
        case "calendario":
          if (!customDateRange) return false;
          const startDate = new Date(customDateRange.start);
          const endDate = new Date(customDateRange.end);
          endDate.setDate(endDate.getDate() + 1);
          return receiptDate >= startDate && receiptDate < endDate;
        default:
          return true;
      }
    });
  }, [receipts, dateFilter, customDateRange]);

  return { receipts, filteredReceipts, loadingReceipts, receiptsError, fetchReceipts };
};
