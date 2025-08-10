import React, { useState } from "react";
import { Calendar, X } from "lucide-react";

interface DateRange {
  start: string;
  end: string;
}

interface DateSelectorProps {
  selectedDate: DateRange | null;
  onDateChange: (dateRange: DateRange | null) => void;
  onClose: () => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateChange,
  onClose,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Adicionar dias vazios do mês anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Adicionar dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      // Primeiro clique ou reset
      setStartDate(date);
      setEndDate(null);
    } else {
      // Segundo clique
      if (date < startDate) {
        setStartDate(date);
        setEndDate(null);
      } else {
        setEndDate(date);
      }
    }
  };

  const isDateInRange = (date: Date): boolean => {
    if (!startDate) return false;
    if (!endDate) return date.getTime() === startDate.getTime();
    return date >= startDate && date <= endDate;
  };

  const isDateStart = (date: Date): boolean => {
    return startDate ? date.getTime() === startDate.getTime() : false;
  };

  const isDateEnd = (date: Date): boolean => {
    return endDate ? date.getTime() === endDate.getTime() : false;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleApply = () => {
    if (startDate && endDate) {
      onDateChange({
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      });
    } else if (startDate) {
      onDateChange({
        start: startDate.toISOString().split("T")[0],
        end: startDate.toISOString().split("T")[0],
      });
    }
    onClose();
  };

  const handleCancel = () => {
    setStartDate(null);
    setEndDate(null);
    onClose();
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="text-white" size={24} />
              <div>
                <h3 className="text-white text-lg font-semibold">
                  Selecionar Período
                </h3>
                <p className="text-white text-opacity-80 text-sm">
                  {startDate && endDate
                    ? `${startDate.toLocaleDateString(
                        "pt-PT"
                      )} - ${endDate.toLocaleDateString("pt-PT")}`
                    : startDate
                    ? `${startDate.toLocaleDateString("pt-PT")} - ...`
                    : "Período selecionado"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Calendar Body */}
        <div className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-base transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <h4 className="text-xl font-semibold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>

            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-base transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="h-10" />;
              }

              const inRange = isDateInRange(date);
              const isStart = isDateStart(date);
              const isEnd = isDateEnd(date);
              const isTodayDate = isToday(date);

              return (
                <button
                  key={date.getTime()}
                  onClick={() => handleDateClick(date)}
                  className={`
                    h-10 w-10 text-sm font-medium rounded-base transition-all duration-200 hover:bg-gray-100
                    ${
                      inRange
                        ? isStart || isEnd
                          ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md"
                          : "bg-blue-50 text-primary"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                    ${
                      isTodayDate && !inRange
                        ? "ring-2 ring-primary ring-opacity-50"
                        : ""
                    }
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-base">
            <p className="text-sm text-gray-600">
              <strong>Como usar:</strong> Clique em uma data para selecionar o
              início do período, depois clique em outra data para selecionar o
              fim do período.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-base font-medium hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={!startDate}
              className={`
                flex-1 px-4 py-3 rounded-base font-medium transition-all duration-200
                ${
                  startDate
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              Aplicar Período
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateSelector;
