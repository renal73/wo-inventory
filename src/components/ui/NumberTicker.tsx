'use client';

import React, { useEffect, useState } from 'react';

interface NumberTickerProps {
  value: number;
  duration?: number; // Durasi animasi dalam milidetik
  isCurrency?: boolean; // Tampilkan sebagai format mata uang Rupiah
}

export function NumberTicker({ value, duration = 800, isCurrency = false }: NumberTickerProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let active = true;
    const target = Number(value) || 0;
    if (target === 0) {
      setCurrent(0);
      return;
    }

    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!active) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Fungsi Easing: easeOutQuad
      const easeProgress = progress * (2 - progress);
      
      const currentValue = Math.floor(startValue + easeProgress * (target - startValue));
      setCurrent(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrent(target);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      active = false;
    };
  }, [value, duration]);

  // Format angka ke Bahasa Indonesia / Rupiah
  const formatValue = (num: number) => {
    if (isCurrency) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(num);
    }
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return <span className="tabular-nums">{formatValue(current)}</span>;
}
