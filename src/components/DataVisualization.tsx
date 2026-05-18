import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie
} from 'recharts';

interface DataPoint {
  name: string;
  value: number;
}

interface DataVisualizationProps {
  data: DataPoint[];
  type: 'bar' | 'line' | 'pie';
}

export const DataVisualization = ({ data, type }: DataVisualizationProps) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="w-full h-[300px] mt-4 p-4 rounded-xl bg-bg border border-edge">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
            <XAxis dataKey="name" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '8px' }} 
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
            <XAxis dataKey="name" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '8px' }} 
              itemStyle={{ color: '#fff' }}
            />
            <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', strokeWidth: 2 }} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181B', border: '1px solid #27272A', borderRadius: '8px' }} 
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
