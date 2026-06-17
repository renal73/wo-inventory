import React from 'react';

interface QrCodeProps {
  value: string;
  size?: number;
}

export function QrCode({ value, size = 120 }: QrCodeProps) {
  // Hash sederhana untuk menghasilkan seed angka dari nilai string
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }

  const gridSize = 21; // Versi 1 QR Code (21x21 grid)
  const cellSize = size / gridSize;

  // Cek apakah koordinat berada di area Finder Pattern (kotak besar di sudut)
  const isFinderPattern = (x: number, y: number) => {
    // Kiri Atas
    if (x < 7 && y < 7) return true;
    // Kanan Atas
    if (x >= gridSize - 7 && y < 7) return true;
    // Kiri Bawah
    if (x < 7 && y >= gridSize - 7) return true;
    return false;
  };

  // Hasilkan pola titik-titik secara deterministik berdasarkan hash dari value
  const getCellState = (x: number, y: number): boolean => {
    if (isFinderPattern(x, y)) return false; // Digambar terpisah sebagai bentuk solid
    
    // Generator angka acak semu berbasis seed (hash)
    const seed = Math.abs(hash + (x * 13) + (y * 37));
    return (seed % 3 === 0 || seed % 7 === 0);
  };

  // Render Finder Pattern SVG
  const renderFinder = (x: number, y: number) => {
    const px = x * cellSize;
    const py = y * cellSize;
    const size7 = 7 * cellSize;
    const size5 = 5 * cellSize;
    const size3 = 3 * cellSize;

    return (
      <g key={`finder-${x}-${y}`}>
        {/* Kotak Luar */}
        <rect x={px} y={py} width={size7} height={size7} fill="currentColor" rx={cellSize * 0.8} />
        {/* Pembatas Putih */}
        <rect x={px + cellSize} y={py + cellSize} width={size5} height={size5} fill="var(--color-white, #ffffff)" rx={cellSize * 0.4} />
        {/* Kotak Dalam */}
        <rect x={px + 2 * cellSize} y={py + 2 * cellSize} width={size3} height={size3} fill="currentColor" rx={cellSize * 0.2} />
      </g>
    );
  };

  const cells: React.ReactNode[] = [];

  // Gambar sel-sel kecil
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (isFinderPattern(x, y)) continue;

      if (getCellState(x, y)) {
        cells.push(
          <rect
            key={`cell-${x}-${y}`}
            x={x * cellSize}
            y={y * cellSize}
            width={cellSize * 0.9}
            height={cellSize * 0.9}
            rx={cellSize * 0.2}
            fill="currentColor"
          />
        );
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-xs w-fit text-slate-800">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="text-slate-900"
      >
        {/* Finder Patterns */}
        {renderFinder(0, 0)} {/* Kiri Atas */}
        {renderFinder(gridSize - 7, 0)} {/* Kanan Atas */}
        {renderFinder(0, gridSize - 7)} {/* Kiri Bawah */}
        
        {/* Sel data kecil */}
        {cells}
      </svg>
      <span className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-wider">
        {value}
      </span>
    </div>
  );
}
