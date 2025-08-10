
import React from 'react';
import { Plus } from 'lucide-react';
import ReceiptForm from '@/components/ReceiptForm';

interface AddCardProps {
  isExpanded: boolean;
  onAddCard: () => void;
  onCloseForm: () => void;
  onReceiptProcessed: (receipt: any) => void;
  activeMenuItem: string;
}

const AddCard: React.FC<AddCardProps> = ({ 
    isExpanded, 
    onAddCard, 
    onCloseForm, 
    onReceiptProcessed,
    activeMenuItem 
}) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-500 ease-in-out ${
        isExpanded ? 'col-span-full row-span-2 p-xxl' : 'p-xl'
      }`}
    >
      {!isExpanded ? (
        <div
          className="flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-shadow duration-300 h-full"
          onClick={onAddCard}
        >
          <div className="w-16 h-16 bg-primary-gradient rounded-xl flex items-center justify-center text-white mb-base transition-transform hover:scale-105">
            <Plus size={24} />
          </div>
          <h3 className="font-semiBold mb-sm text-text">Adicionar Card</h3>
          <p className="text-sm text-center text-gray-500">Clique para adicionar</p>
        </div>
      ) : (
        <ReceiptForm
          onClose={onCloseForm}
          onReceiptProcessed={onReceiptProcessed}
          activeMenuItem={activeMenuItem}
        />
      )}
    </div>
  );
};

export default AddCard;
