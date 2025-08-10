
import React from 'react';
import { LucideProps } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType<LucideProps>;
  iconBgColor: string;
  iconColor: string;
  percentage: string;
  percentageBgColor: string;
  percentageColor: string;
  period: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  percentage,
  percentageBgColor,
  percentageColor,
  period,
}) => {
  return (
    <div className="bg-white p-xl rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-base">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-text">{value}</p>
        </div>
        <div className={`w-12 h-12 ${iconBgColor} rounded-base flex items-center justify-center`}>
          <Icon size={24} className={iconColor} />
        </div>
      </div>
      <div className="flex items-center space-x-sm">
        <div className={`px-sm py-xs ${percentageBgColor} ${percentageColor} rounded-sm text-xs font-medium`}>
          {percentage}
        </div>
        <span className="text-sm text-gray-500">{period}</span>
      </div>
    </div>
  );
};

export default StatCard;
