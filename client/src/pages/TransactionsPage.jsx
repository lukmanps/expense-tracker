import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';

const filters = ['All', 'Income', 'Sent', 'Request', 'Transfer'];

const mockData = [
  {
    date: 'TODAY',
    items: [
      {
        id: 1,
        name: 'Mikel Borle',
        amount: 350.00,
        type: 'Receive',
        time: '10:30 AM',
        iconType: 'initials',
        iconValue: 'MB',
        iconBg: 'bg-[#2B5B4E]',
        iconText: 'text-white'
      },
      {
        id: 2,
        name: 'Uber',
        amount: -10.00,
        type: 'Transfer',
        time: '08:25 AM',
        iconType: 'logo',
        iconValue: 'Uber',
        iconBg: 'bg-[#0F0F0F]',
        iconText: 'text-white'
      },
      {
        id: 3,
        name: 'Ryan Scott',
        amount: -124.00,
        type: 'Send',
        time: '09:45 AM',
        iconType: 'image',
        iconValue: 'https://i.pravatar.cc/150?u=a042581f4e29026704b',
      }
    ]
  },
  {
    date: 'Yesterday',
    items: [
      {
        id: 4,
        name: 'Mikel Borle',
        amount: 350.00,
        type: 'Receive',
        time: '10:30 AM',
        iconType: 'image',
        iconValue: 'https://i.pravatar.cc/150?img=11',
      },
      {
        id: 5,
        name: 'Food Panda',
        amount: -21.56,
        type: 'Payment',
        time: '09:45 AM',
        iconType: 'logo-img',
        iconValue: '🐼',
        iconBg: 'bg-[#E7165D]',
        iconText: 'text-white'
      },
      {
        id: 6,
        name: 'Uber',
        amount: -25.00,
        type: 'Transfer',
        time: '08:25 PM',
        iconType: 'logo',
        iconValue: 'Uber',
        iconBg: 'bg-[#0F0F0F]',
        iconText: 'text-white'
      }
    ]
  }
];

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');

  const renderIcon = (item) => {
    if (item.iconType === 'image') {
      return (
        <img 
          src={item.iconValue} 
          alt={item.name} 
          className="w-12 h-12 rounded-full object-cover border border-border" 
        />
      );
    }
    if (item.iconType === 'logo') {
      return (
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.iconBg}`}>
          <span className={`text-xs font-semibold ${item.iconText}`}>{item.iconValue}</span>
        </div>
      );
    }
    if (item.iconType === 'logo-img') {
      return (
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.iconBg}`}>
          <span className={`text-xl ${item.iconText}`}>{item.iconValue}</span>
        </div>
      );
    }
    // Initials
    return (
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.iconBg}`}>
        <span className={`text-[15px] font-medium tracking-wide ${item.iconText}`}>{item.iconValue}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg pt-4 px-5 pb-3">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full active:bg-surface-alt transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-text" />
            </button>
            <h1 className="text-[28px] font-black text-text tracking-tight">
              Activity<span className="text-primary">.</span>
            </h1>
          </div>
          <button className="p-2 -mr-2 active:scale-95 transition-transform">
            <Search className="w-6 h-6 text-text" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === filter 
                  ? 'bg-primary text-bg-dark' 
                  : 'bg-surface border border-surface-alt text-text-secondary shadow-sm'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-5 pb-8 space-y-6 mt-2">
        {mockData.map((group) => (
          <div key={group.date}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-wide font-bold text-text-secondary">
                {group.date}
              </span>
              <div className="h-px bg-surface-alt flex-1"></div>
            </div>
            
            <div className="space-y-5">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    {renderIcon(item)}
                    <div>
                      <p className="text-[15px] font-semibold text-text">{item.name}</p>
                      <p className="text-[13px] text-text-secondary mt-0.5">{item.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[15px] font-black tabular-nums text-text group-hover:scale-105 transition-transform`}>
                      {item.amount > 0 ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[13px] text-text-secondary mt-0.5">{item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
