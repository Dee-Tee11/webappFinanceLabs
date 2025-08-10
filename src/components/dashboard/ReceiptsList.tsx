
import React from 'react';
import { Tables } from '@/utils/supabase/types';
import { X, Receipt, Tag, Calendar } from 'lucide-react';

interface ReceiptsListProps {
  receipts: Tables<'receipts'>[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string | null) => string;
  onAddReceipt: () => void;
}

const ReceiptsList: React.FC<ReceiptsListProps> = ({ 
    receipts, 
    loading, 
    error, 
    onRetry,
    formatCurrency,
    formatDate,
    onAddReceipt 
}) => {
  if (loading) {
    return (
      <div className="bg-white p-xl rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-xl">
          <div className="flex items-center space-x-md">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">Carregando recibos...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-xl rounded-xl shadow-sm border border-gray-200">
        <div className="text-center py-xl">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-base">
            <X size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semiBold text-text mb-sm">Erro ao carregar recibos</h3>
          <p className="text-gray-500 mb-base">{error}</p>
          <button
            onClick={onRetry}
            className="bg-primary-gradient text-white px-base py-sm rounded-base hover:opacity-90 transition-opacity"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
        <div className="bg-white p-xl rounded-xl shadow-sm border border-gray-200">
            <div className="text-center py-xl">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-base">
                    <Receipt size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semiBold text-text mb-sm">Nenhum recibo encontrado</h3>
                <p className="text-gray-500 mb-base">Comece a adicionar recibos através do dashboard para vê-los aqui.</p>
                <button
                    onClick={onAddReceipt}
                    className="bg-primary-gradient text-white px-base py-sm rounded-base hover:opacity-90"
                >
                    Adicionar Recibo
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-white p-xl rounded-xl shadow-sm border border-gray-200">
      <div className="space-y-md">
        {receipts.map((receipt) => (
          <div
            key={receipt.id}
            className="p-base border-b border-gray-200 last:border-b-0 flex justify-between items-center hover:bg-gray-50 rounded-md"
          >
            <div className="flex items-center space-x-md">
              <div className="w-10 h-10 bg-blue-light rounded-base flex items-center justify-center">
                <Tag size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-semiBold text-text">{receipt.merchant_name || 'Comerciante não identificado'}</p>
                <p className="text-sm text-gray-500">{receipt.categoria || 'Sem categoria'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semiBold text-red-600">{formatCurrency(receipt.total_amount || 0)}</p>
              {receipt.categoria === 'fatura' && (receipt.valor_iva || 0) > 0 && (
                <p className="text-xs text-gray-500">
                  IVA: {formatCurrency(receipt.valor_iva || 0)}
                </p>
              )}
              <p className="text-sm text-gray-500">{formatDate(receipt.date_detected)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReceiptsList;
