
import React from 'react';
import { LucideProps } from 'lucide-react';

interface PlaceholderProps {
  icon: React.ElementType<LucideProps>;
  title: string;
  message: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ icon: Icon, title, message }) => {
  return (
    <div className="bg-white p-xl rounded-xl shadow-sm border border-gray-200">
      <div className="text-center py-xxl">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-base">
          <Icon size={28} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-sm">{title}</h2>
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  );
};

export default Placeholder;
