import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PuntoVentaDiaria } from './estadisticas';

interface VentasChartProps {
  datos: PuntoVentaDiaria[];
  ocultarSaldos?: boolean;
}

export function VentasChart({ datos, ocultarSaldos = false }: VentasChartProps) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
          <XAxis dataKey="fecha" tick={{ fontSize: 11 }} stroke="currentColor" className="text-gray-400" />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            className="text-gray-400"
            width={48}
            tickFormatter={(value) => (ocultarSaldos ? '•••' : String(value))}
          />
          <Tooltip
            formatter={(value) => [ocultarSaldos ? '•••••' : `$${Number(value).toFixed(2)}`, 'Ventas']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Line type="monotone" dataKey="total" stroke="var(--color-brand-600)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
