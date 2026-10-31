import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatLempiras } from '../lib/currency';

interface HistoryViewProps {
  transactions: Transaction[];
  onSelectTransaction?: (tx: Transaction) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  onSelectTransaction,
}) => {
  const [activeFilter, setActiveFilter] = useState<'Todos' | 'Depósitos' | 'Transferencias' | 'Retiros'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === 'Depósitos' && tx.type !== 'deposit') return false;
    if (activeFilter === 'Transferencias' && tx.type !== 'transfer') return false;
    if (activeFilter === 'Retiros' && tx.type !== 'withdrawal') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = tx.title.toLowerCase().includes(q);
      const matchSubtitle = tx.subtitle?.toLowerCase().includes(q) || false;
      const matchCategory = tx.category?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchSubtitle && !matchCategory) return false;
    }

    return true;
  });

  const handleExportStatement = () => {
    const csvContent = [
      'ID,Fecha,Concepto,Categoria,Tipo,Monto (HNL),Estado',
      ...filteredTransactions.map(
        (t) => `"${t.id}","${t.date}","${t.title}","${t.category}","${t.type}","L. ${t.amount}","${t.status}"`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `extracto_bancanova_hn_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="flex-1 md:ml-64 min-h-screen overflow-y-auto pt-20 md:pt-8 pb-24 md:pb-16 px-4 md:px-10 bg-[#F5F5F7] text-[#1D1D1F]">
      <div className="max-w-[1020px] mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-[#86868B] tracking-wide uppercase">
              Registros en Honduras (HNL)
            </span>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
              Historial de Movimientos
            </h1>
          </div>

          <button
            onClick={handleExportStatement}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-black/[0.04] text-[#1D1D1F] text-xs font-semibold border border-black/[0.06] shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#0071E3]">
              {downloadSuccess ? 'done' : 'download'}
            </span>
            <span>{downloadSuccess ? '¡Extracto Descargado!' : 'Descargar Extracto CSV'}</span>
          </button>
        </div>

        {/* Toolbar: Segmented Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Apple Segmented Pills */}
          <div className="flex items-center p-1 bg-black/[0.05] rounded-full border border-black/[0.03] overflow-x-auto">
            {(['Todos', 'Depósitos', 'Transferencias', 'Retiros'] as const).map((filter) => {
              const isSelected = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`text-xs font-medium px-4 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#0071E3] text-white shadow-[0_2px_8px_rgba(0,113,227,0.25)] font-semibold'
                      : 'text-[#86868B] hover:text-[#0071E3]'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#86868B]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar transacción..."
              className="w-full bg-white border border-black/[0.06] focus:border-[#0071E3] rounded-full pl-10 pr-4 py-2 text-xs text-[#1D1D1F] outline-none transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Transactions Card */}
        <div className="bg-white rounded-[28px] p-5 sm:p-7 md:p-8 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="flex flex-col divide-y divide-black/[0.04]">
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-[#86868B]">
                <span className="material-symbols-outlined text-[36px] text-black/20 block mb-2">
                  search_off
                </span>
                <p className="text-sm font-medium">No se encontraron movimientos</p>
                <p className="text-xs text-[#AEAEB2] mt-1">Prueba ajustando los filtros o el término de búsqueda</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction?.(tx)}
                    className="py-3.5 sm:py-4 flex items-center justify-between gap-2.5 sm:gap-4 hover:bg-[#F5F5F7] px-2 sm:px-3 rounded-2xl transition-colors cursor-pointer group w-full"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 ${
                        isPositive
                          ? 'bg-emerald-50 text-[#34C759]'
                          : 'bg-black/[0.04] text-[#1D1D1F]'
                      }`}>
                        <span className="material-symbols-outlined text-[19px] sm:text-[20px]">
                          {tx.type === 'deposit' ? 'payments' : tx.type === 'transfer' ? 'send' : 'shopping_bag'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] sm:text-[14px] font-semibold text-[#1D1D1F] block leading-tight group-hover:text-[#0071E3] transition-colors truncate">
                          {tx.title}
                        </span>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                          <span className="text-[11px] sm:text-xs text-[#86868B] shrink-0">
                            {tx.date}
                          </span>
                          <span className="text-[9.5px] sm:text-[10px] text-[#86868B] bg-[#F5F5F7] px-1.5 sm:px-2 py-0.5 rounded-full font-medium truncate max-w-[110px] sm:max-w-none">
                            {tx.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className={`text-[13px] sm:text-[15px] font-bold block whitespace-nowrap tabular-nums tracking-tight ${
                        isPositive ? 'text-[#34C759]' : 'text-[#1D1D1F]'
                      }`}>
                        {isPositive ? '+' : '-'}{formatLempiras(Math.abs(tx.amount))}
                      </span>
                      <span className="text-[9.5px] sm:text-[10px] text-[#86868B] uppercase font-semibold whitespace-nowrap block">
                        {tx.status === 'completed' ? 'Completado' : 'En proceso'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
