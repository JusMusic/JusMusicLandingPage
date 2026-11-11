export default function StatusBadge() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 sm:top-6 z-50 flex justify-center px-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-sm">
        <span className="relative flex h-1.5 w-1.5">
          <span className="status-dot-pulse absolute inline-flex h-full w-full rounded-full bg-[#34D399]" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#DDD6FE] shadow-[0_0_8px_rgba(167,139,250,0.9)]" />
        </span>
        <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#FDFCF5]/50">
          Exclusive Preview
        </span>
      </div>
    </div>
  );
}