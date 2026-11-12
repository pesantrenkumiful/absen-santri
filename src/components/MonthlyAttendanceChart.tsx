import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AbsensiRecord, Santri } from '../types';
import { formatMonthYear, INDONESIAN_MONTHS } from '../utils/dateHelper';

interface MonthlyAttendanceChartProps {
  absensis: AbsensiRecord[];
  santris: Santri[];
  selectedMonth: string;
  selectedClassFilter: string;
  selectedGenderFilter: string;
}

export const MonthlyAttendanceChart: React.FC<MonthlyAttendanceChartProps> = ({
  absensis,
  santris,
  selectedMonth,
  selectedClassFilter,
  selectedGenderFilter,
}) => {
  type ChartMode = 'class_distribution' | 'daily_trend' | 'discipline_rate' | 'month_comparison';
  const [chartMode, setChartMode] = useState<ChartMode>('class_distribution');
  const [isStacked, setIsStacked] = useState<boolean>(true);

  // Filter santri based on active filters
  const filteredSantris = useMemo(() => {
    let list = santris;
    if (selectedClassFilter !== 'ALL') {
      list = list.filter((s) => s.kelas === selectedClassFilter);
    }
    if (selectedGenderFilter !== 'ALL') {
      list = list.filter((s) => s.jk === selectedGenderFilter);
    }
    return list;
  }, [santris, selectedClassFilter, selectedGenderFilter]);

  const santriIdsSet = useMemo(() => new Set(filteredSantris.map((s) => s.id)), [filteredSantris]);

  // Absensis in the selected month for filtered santris
  const monthAbsensis = useMemo(() => {
    return absensis.filter((a) => {
      const matchMonth = selectedMonth === 'ALL' || a.tanggal.startsWith(selectedMonth);
      const matchSantri = santriIdsSet.has(a.santriId);
      return matchMonth && matchSantri;
    });
  }, [absensis, selectedMonth, santriIdsSet]);

  // 1. Data: Distribusi Status Kehadiran per Kelas
  const classDistributionData = useMemo(() => {
    // Unique classes in filtered santris
    const classList = Array.from(new Set(filteredSantris.map((s) => s.kelas))).sort();

    return classList.map((cls) => {
      const classSantriIds = new Set(filteredSantris.filter((s) => s.kelas === cls).map((s) => s.id));
      const classRecords = monthAbsensis.filter((a) => classSantriIds.has(a.santriId));

      const hadir = classRecords.filter((a) => a.status === 'H').length;
      const sakit = classRecords.filter((a) => a.status === 'S').length;
      const izin = classRecords.filter((a) => a.status === 'I').length;
      const alpha = classRecords.filter((a) => a.status === 'A').length;
      const total = hadir + sakit + izin + alpha;
      const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;

      // Clean short label for classes
      let shortName = cls
        .replace(' (Santriwan)', ' (Pa)')
        .replace(' (Santriwati)', ' (Pi)')
        .replace('Awaliyah', 'Awa')
        .replace('Wustho', 'Wus')
        .replace('Ulya', 'Uly');

      return {
        className: cls,
        shortName,
        hadir,
        sakit,
        izin,
        alpha,
        total,
        percentage,
      };
    });
  }, [filteredSantris, monthAbsensis]);

  // 2. Data: Tren Harian Kehadiran dalam Bulan
  const dailyTrendData = useMemo(() => {
    // Unique dates in the selected month
    const dates = Array.from(new Set(monthAbsensis.map((a) => a.tanggal))).sort();

    return dates.map((dateStr) => {
      const dayRecords = monthAbsensis.filter((a) => a.tanggal === dateStr);
      const hadir = dayRecords.filter((a) => a.status === 'H').length;
      const sakit = dayRecords.filter((a) => a.status === 'S').length;
      const izin = dayRecords.filter((a) => a.status === 'I').length;
      const alpha = dayRecords.filter((a) => a.status === 'A').length;
      const total = hadir + sakit + izin + alpha;
      const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;

      // Format date label as DD/MM (e.g. 05/11)
      const parts = dateStr.split('-');
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;

      return {
        date: dateStr,
        label,
        hadir,
        sakit,
        izin,
        alpha,
        total,
        percentage,
      };
    });
  }, [monthAbsensis]);

  // 3. Data: Perbandingan Antar Bulan (Sepanjang Tahun/Data)
  const monthComparisonData = useMemo(() => {
    // Extract unique months from all absensis matching filtered santris
    const monthsSet = new Set<string>();
    absensis.forEach((a) => {
      if (santriIdsSet.has(a.santriId) && a.tanggal.length >= 7) {
        monthsSet.add(a.tanggal.slice(0, 7));
      }
    });

    const sortedMonths = Array.from(monthsSet).sort();
    return sortedMonths.map((ym) => {
      const records = absensis.filter((a) => a.tanggal.startsWith(ym) && santriIdsSet.has(a.santriId));
      const hadir = records.filter((a) => a.status === 'H').length;
      const sakit = records.filter((a) => a.status === 'S').length;
      const izin = records.filter((a) => a.status === 'I').length;
      const alpha = records.filter((a) => a.status === 'A').length;
      const total = hadir + sakit + izin + alpha;
      const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;

      const [year, monthStr] = ym.split('-');
      const mIdx = parseInt(monthStr, 10) - 1;
      const monthObj = INDONESIAN_MONTHS[mIdx];
      const shortLabel = `${monthObj ? monthObj.name.slice(0, 3) : ym} '${year ? year.slice(2) : ''}`;

      return {
        ym,
        label: shortLabel,
        fullLabel: formatMonthYear(ym),
        hadir,
        sakit,
        izin,
        alpha,
        total,
        percentage,
      };
    });
  }, [absensis, santriIdsSet]);

  // Insight calculations
  const insights = useMemo(() => {
    if (classDistributionData.length === 0 || monthAbsensis.length === 0) {
      return null;
    }

    // Find class with highest attendance rate (with at least 1 record)
    const validClasses = classDistributionData.filter((c) => c.total > 0);
    if (validClasses.length === 0) return null;

    const bestClass = [...validClasses].sort((a, b) => b.percentage - a.percentage)[0];
    const highestAlphaClass = [...validClasses].sort((a, b) => b.alpha - a.alpha)[0];

    const totalH = monthAbsensis.filter((a) => a.status === 'H').length;
    const totalA = monthAbsensis.filter((a) => a.status === 'A').length;
    const totalRec = monthAbsensis.length;
    const overallRate = totalRec > 0 ? Math.round((totalH / totalRec) * 100) : 0;

    return {
      bestClass: bestClass?.percentage > 0 ? bestClass : null,
      highestAlphaClass: highestAlphaClass?.alpha > 0 ? highestAlphaClass : null,
      overallRate,
      totalAlpha: totalA,
    };
  }, [classDistributionData, monthAbsensis]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700/80 backdrop-blur-xs min-w-[190px]">
        <div className="font-bold text-slate-200 border-b border-slate-700 pb-1.5 mb-2 flex items-center justify-between">
          <span>{data.fullLabel || data.className || data.date || label}</span>
          {data.percentage !== undefined && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                data.percentage >= 85
                  ? 'bg-emerald-500/30 text-emerald-300'
                  : data.percentage >= 70
                  ? 'bg-amber-500/30 text-amber-300'
                  : 'bg-rose-500/30 text-rose-300'
              }`}
            >
              {data.percentage}% Hadir
            </span>
          )}
        </div>

        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            let labelName = entry.name;
            if (labelName === 'hadir') labelName = 'Hadir (H)';
            if (labelName === 'sakit') labelName = 'Sakit (S)';
            if (labelName === 'izin') labelName = 'Izin (I)';
            if (labelName === 'alpha') labelName = 'Alpha (A)';
            if (labelName === 'percentage') labelName = 'Tingkat Kehadiran (%)';

            return (
              <div key={`item-${index}`} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-xs inline-block shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-300">{labelName}:</span>
                </div>
                <span className="font-mono font-bold text-white">
                  {entry.value} {labelName.includes('%') ? '%' : ''}
                </span>
              </div>
            );
          })}
        </div>

        {data.total !== undefined && (
          <div className="mt-2 pt-1.5 border-t border-slate-700 text-[10px] text-slate-400 flex justify-between">
            <span>Total Catatan:</span>
            <span className="font-bold text-slate-200">{data.total} catatan</span>
          </div>
        )}
      </div>
    );
  };

  const hasData = monthAbsensis.length > 0;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      {/* Top Header & Visualizer Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <i className="fa-solid fa-chart-column text-emerald-700"></i>
              <span>Visualisasi & Dasbor Kehadiran Bulanan</span>
            </h4>
            <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              {formatMonthYear(selectedMonth)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Grafik interaktif pemantauan tingkat kedisiplinan dan absensi santri berbasis Recharts
          </p>
        </div>

        {/* Visualizer Mode Switchers */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start md:self-auto text-xs">
          <button
            type="button"
            onClick={() => setChartMode('class_distribution')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              chartMode === 'class_distribution'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-layer-group text-[11px]"></i>
            <span>Status per Kelas</span>
          </button>

          <button
            type="button"
            onClick={() => setChartMode('daily_trend')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              chartMode === 'daily_trend'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-calendar-day text-[11px]"></i>
            <span>Tren Harian</span>
          </button>

          <button
            type="button"
            onClick={() => setChartMode('discipline_rate')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              chartMode === 'discipline_rate'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-award text-[11px]"></i>
            <span>% Disiplin</span>
          </button>

          <button
            type="button"
            onClick={() => setChartMode('month_comparison')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              chartMode === 'month_comparison'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-chart-line text-[11px]"></i>
            <span>Antar Bulan</span>
          </button>
        </div>
      </div>

      {/* Insights Row for quick executive monitoring */}
      {insights && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Best Discipline Class */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-xl flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
              <i className="fa-solid fa-trophy"></i>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-emerald-800 uppercase font-black block tracking-wider">
                Kelas Terdisiplin Bulan Ini
              </span>
              <p className="font-bold text-slate-800 text-xs truncate">
                {insights.bestClass ? insights.bestClass.className : '-'}
              </p>
              <span className="text-[11px] text-emerald-700 font-extrabold">
                {insights.bestClass ? `${insights.bestClass.percentage}% Kehadiran` : '-'}
              </span>
            </div>
          </div>

          {/* Highest Alpha Alert */}
          <div className="bg-rose-50/70 border border-rose-200/80 p-3 rounded-xl flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-rose-800 uppercase font-black block tracking-wider">
                Perhatian: Alpha Tertinggi
              </span>
              <p className="font-bold text-slate-800 text-xs truncate">
                {insights.highestAlphaClass ? insights.highestAlphaClass.className : 'Tidak ada Alpha'}
              </p>
              <span className="text-[11px] text-rose-700 font-extrabold">
                {insights.highestAlphaClass
                  ? `${insights.highestAlphaClass.alpha} hari Alpha tercatat`
                  : 'Nihil Alpha (Tertib)'}
              </span>
            </div>
          </div>

          {/* Overall Attendance Rate */}
          <div className="bg-blue-50/70 border border-blue-200/80 p-3 rounded-xl flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
              <i className="fa-solid fa-clipboard-check"></i>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-blue-800 uppercase font-black block tracking-wider">
                Rata-rata Kehadiran
              </span>
              <p className="font-black text-slate-800 text-base">
                {insights.overallRate}%
              </p>
              <span className="text-[10px] text-blue-700">
                {insights.overallRate >= 85 ? 'Kategori Baik Sekali' : 'Perlu Peningkatan'}
              </span>
            </div>
          </div>

          {/* Total Alpha Count */}
          <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
              <i className="fa-solid fa-user-xmark"></i>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-amber-800 uppercase font-black block tracking-wider">
                Total Alpha Bulan Ini
              </span>
              <p className="font-black text-slate-800 text-base">
                {insights.totalAlpha} Hari
              </p>
              <span className="text-[10px] text-amber-700">
                {insights.totalAlpha === 0 ? 'Disiplin sempurna' : 'Memerlukan pembinaan'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stacked / Grouped Toggle for distribution modes */}
      {(chartMode === 'class_distribution' || chartMode === 'daily_trend') && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="text-[11px]">
            {chartMode === 'class_distribution'
              ? 'Menampilkan rekapitulasi Hadir (H), Sakit (S), Izin (I), dan Alpha (A) masing-masing kelas.'
              : 'Menampilkan fluktuasi kehadiran santri per hari kegiatan aktif.'}
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold">Tipe Grafik:</span>
            <button
              type="button"
              onClick={() => setIsStacked(true)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                isStacked ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bertumpuk (Stacked)
            </button>
            <button
              type="button"
              onClick={() => setIsStacked(false)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                !isStacked ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Berdampingan (Grouped)
            </button>
          </div>
        </div>
      )}

      {/* Main Chart Area */}
      <div className="h-72 sm:h-80 w-full pt-2">
        {!hasData && chartMode !== 'month_comparison' ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-2">
            <i className="fa-solid fa-chart-column text-4xl text-slate-300"></i>
            <p className="text-sm font-semibold text-slate-600">
              Belum Ada Data Presensi di Periode {formatMonthYear(selectedMonth)}
            </p>
            <p className="text-xs text-slate-400 max-w-sm text-center">
              Pilih bulan lain pada dropdown periode di atas atau input presensi santri via Ustadz/Scan QR.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {(() => {
              if (chartMode === 'class_distribution') {
                return (
                  <BarChart
                    data={classDistributionData}
                    margin={{ top: 10, right: 15, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val: string) => {
                        if (val === 'hadir') return <span className="text-xs text-slate-700 font-bold">Hadir (H)</span>;
                        if (val === 'sakit') return <span className="text-xs text-slate-700 font-bold">Sakit (S)</span>;
                        if (val === 'izin') return <span className="text-xs text-slate-700 font-bold">Izin (I)</span>;
                        if (val === 'alpha') return <span className="text-xs text-slate-700 font-bold">Alpha (A)</span>;
                        return val;
                      }}
                    />
                    <Bar
                      dataKey="hadir"
                      name="hadir"
                      stackId={isStacked ? 'a' : undefined}
                      fill="#10b981"
                      radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="sakit"
                      name="sakit"
                      stackId={isStacked ? 'a' : undefined}
                      fill="#f59e0b"
                      radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="izin"
                      name="izin"
                      stackId={isStacked ? 'a' : undefined}
                      fill="#3b82f6"
                      radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="alpha"
                      name="alpha"
                      stackId={isStacked ? 'a' : undefined}
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                );
              }

              if (chartMode === 'daily_trend') {
                return (
                  <BarChart
                    data={dailyTrendData}
                    margin={{ top: 10, right: 15, left: -10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val: string) => {
                        if (val === 'hadir') return <span className="text-xs text-slate-700 font-bold">Hadir (H)</span>;
                        if (val === 'sakit') return <span className="text-xs text-slate-700 font-bold">Sakit (S)</span>;
                        if (val === 'izin') return <span className="text-xs text-slate-700 font-bold">Izin (I)</span>;
                        if (val === 'alpha') return <span className="text-xs text-slate-700 font-bold">Alpha (A)</span>;
                        return val;
                      }}
                    />
                    <Bar
                      dataKey="hadir"
                      name="hadir"
                      stackId={isStacked ? 'a' : undefined}
                      fill="#10b981"
                      radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="sakit"
                      name="sakit"
                      stackId={isStacked ? 'a' : undefined}
                      fill="#f59e0b"
                      radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="izin"
                      name="izin"
                      stackId={isStacked ? 'a' : undefined}
                      fill="#3b82f6"
                      radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="alpha"
                      name="alpha"
                      stackId={isStacked ? 'a' : undefined}
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                );
              }

              if (chartMode === 'discipline_rate') {
                return (
                  <BarChart
                    data={classDistributionData}
                    margin={{ top: 10, right: 15, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      unit="%"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={() => (
                        <span className="text-xs text-emerald-800 font-bold">
                          Tingkat Kehadiran Santri (%) - Target Ideal &ge; 85%
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="percentage"
                      name="percentage"
                      fill="#059669"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                );
              }

              // month_comparison
              return (
                <BarChart
                  data={monthComparisonData}
                  margin={{ top: 10, right: 15, left: -10, bottom: 15 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#475569' }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(val: string) => {
                      if (val === 'hadir') return <span className="text-xs text-slate-700 font-bold">Hadir (H)</span>;
                      if (val === 'alpha') return <span className="text-xs text-slate-700 font-bold">Alpha (A)</span>;
                      return val;
                    }}
                  />
                  <Bar
                    dataKey="hadir"
                    name="hadir"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="alpha"
                    name="alpha"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              );
            })()}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
