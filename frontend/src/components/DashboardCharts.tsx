import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface ChartProps {
  data: any[];
}

export default function DashboardCharts({ data }: ChartProps) {
  const chartData = React.useMemo(() => {
    if (data && data.length > 0) {
      const computedData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const name = d.toLocaleDateString('en-US', { weekday: 'short' });
        
        const count = data.filter(a => {
          if (!a.createdAt) return false;
          const aDate = new Date(a.createdAt);
          return aDate.toDateString() === d.toDateString();
        }).length;
        
        computedData.push({ name, count });
      }
      return computedData;
    }

    return [
      { name: 'Mon', count: 1 },
      { name: 'Tue', count: 2 },
      { name: 'Wed', count: 1 },
      { name: 'Thu', count: 4 },
      { name: 'Fri', count: 2 },
      { name: 'Sat', count: 5 },
      { name: 'Sun', count: 3 },
    ];
  }, [data]);

  return (
    <div className="w-full h-64 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-extrabold text-gray-800">Assessments Created (Last 7 Days)</h3>
        <p className="text-xs text-gray-400">Activity overview</p>
      </div>
      <div className="flex-1 w-full min-h-[150px]">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9ca3af' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9ca3af' }} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#f97316" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCount)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
