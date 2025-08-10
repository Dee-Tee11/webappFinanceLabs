
import React from 'react';

interface SummaryProps {
  totals: {
    receita: number;
    despesas: number;
    lucroLiquido: number;
  };
  formatCurrency: (value: number) => string;
}

const Summary: React.FC<SummaryProps> = ({ totals, formatCurrency }) => {
  return (
    <div className="bg-white p-xl rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-xl font-semiBold mb-base text-text">Resumo Financeiro</h3>
      <div className="space-y-md">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Receitas</span>
          <span className="font-semiBold text-green-600">{formatCurrency(totals.receita)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Despesas</span>
          <span className="font-semiBold text-red-600">{formatCurrency(totals.despesas)}</span>
        </div>
        <div className="flex justify-between items-center pt-md border-t border-gray-200">
          <span className="font-semiBold text-text">Lucro Líquido</span>
          <span className="font-bold text-green-600">{formatCurrency(totals.lucroLiquido)}</span>
        </div>
      </div>
    </div>
  );
};

export default Summary;
