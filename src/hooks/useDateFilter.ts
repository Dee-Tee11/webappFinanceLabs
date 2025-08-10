import { useState } from "react";

interface DateRange {
  start: string;
  end: string;
}

export const useDateFilter = () => {
  const [dateFilter, setDateFilter] = useState("todos");
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(
    null
  );
  const [showDateSelector, setShowDateSelector] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data não disponível";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "Data inválida";
    }
  };

  const handleDateFilterChange = (filterType: string) => {
    setDateFilter(filterType);
    if (filterType === "calendario") {
      setShowDateSelector(true);
    } else {
      setCustomDateRange(null);
      setShowDateSelector(false);
    }
  };

  const getFilterText = () => {
    switch (dateFilter) {
      case "todos":
        return "Todos";
      case "mes":
        return "Este Mês";
      case "3meses":
        return "Últimos 3 Meses";
      case "calendario":
        if (customDateRange) {
          return `${formatDate(customDateRange.start)} - ${formatDate(
            customDateRange.end
          )}`;
        }
        return "Calendário";
      default:
        return "Todos";
    }
  };

  return {
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
    showDateSelector,
    setShowDateSelector,
    handleDateFilterChange,
    getFilterText,
    formatDate,
  };
};
