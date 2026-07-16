# Work Order Components - Vodafone-Inspired Design

Komponen work order yang telah dirombak dengan desain modern terinspirasi dari Vodafone, featuring:
- ✨ Animasi smooth dan engaging
- 🎨 Efek 3D tilt pada hover
- 💫 Glow effects dan gradient indicators
- 🎯 Clean, bold typography
- 📱 Fully responsive
- 🌓 Dark mode support

## Komponen Yang Tersedia

### 1. WorkOrderCard
Card individual untuk menampilkan work order dengan efek 3D interaktif.

**Features:**
- 3D tilt effect mengikuti cursor
- Gradient glow effect on hover
- Animated color-coded gradient indicator
- Spring-based icon animations
- Staggered entrance animations

**Props:**
```typescript
interface WorkOrderCardProps {
  wo: any;              // Work order object
  onClick: () => void;  // Handler ketika card diklik
  index: number;        // Index untuk staggered animation
}
```

**Usage:**
```tsx
import { WorkOrderCard } from "@/components/work-order/WorkOrderCard";

<WorkOrderCard 
  wo={workOrderData} 
  onClick={() => handleOpenDetail(workOrderData.id)}
  index={0}
/>
```

### 2. WorkOrderHeader
Header section dengan search, filters, dan view mode toggle.

**Features:**
- Smooth entrance animations
- Integrated search bar
- Status & priority filters
- Grid/List view toggle
- Total count display
- Optional "Create New" button

**Props:**
```typescript
interface WorkOrderHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onCreateNew?: () => void;
  canCreate?: boolean;
  totalCount: number;
}
```

**Usage:**
```tsx
import { WorkOrderHeader } from "@/components/work-order/WorkOrderHeader";

const [searchTerm, setSearchTerm] = useState("");
const [statusFilter, setStatusFilter] = useState("");
const [priorityFilter, setPriorityFilter] = useState("");
const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

<WorkOrderHeader
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
  statusFilter={statusFilter}
  onStatusFilterChange={setStatusFilter}
  priorityFilter={priorityFilter}
  onPriorityFilterChange={setPriorityFilter}
  viewMode={viewMode}
  onViewModeChange={setViewMode}
  onCreateNew={() => console.log("Create new")}
  canCreate={true}
  totalCount={workOrders.length}
/>
```

## Implementasi Lengkap

Berikut contoh implementasi lengkap di halaman work order:

```tsx
"use client";

import { useState, useMemo } from "react";
import { WorkOrderHeader } from "@/components/work-order/WorkOrderHeader";
import { WorkOrderCard } from "@/components/work-order/WorkOrderCard";

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter work orders
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchesSearch = 
        wo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.woNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || wo.status === statusFilter;
      const matchesPriority = !priorityFilter || wo.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [workOrders, searchTerm, statusFilter, priorityFilter]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <WorkOrderHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalCount={filteredWorkOrders.length}
          canCreate={true}
          onCreateNew={() => {/* Handle create */}}
        />

        <div className={`mt-8 ${
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
            : "space-y-4"
        }`}>
          {filteredWorkOrders.map((wo, index) => (
            <WorkOrderCard
              key={wo.id}
              wo={wo}
              onClick={() => {/* Handle detail */}}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Animasi & Efek

### 3D Tilt Effect
Menggunakan `framer-motion` dengan `useMotionValue` dan `useTransform` untuk smooth performance tanpa re-render:

```tsx
const x = useMotionValue(0);
const y = useMotionValue(0);
const rotateX = useTransform(y, [-100, 100], [5, -5]);
const rotateY = useTransform(x, [-100, 100], [-5, 5]);
```

### Staggered Entrance
Cards muncul secara berurutan dengan delay 50ms per item:

```tsx
transition={{ duration: 0.4, delay: index * 0.05 }}
```

### Gradient Glow
Dynamic glow effect berdasarkan status work order dengan blur dan opacity transition.

### Spring Physics
Icon hover menggunakan spring physics untuk feel yang natural:

```tsx
transition={{ type: "spring", stiffness: 400, damping: 15 }}
```

## Color Coding

### Status Colors
- **OPEN**: Blue (Terbuka)
- **ASSIGNED**: Purple (Ditugaskan)
- **IN_PROGRESS**: Amber (Dikerjakan)
- **COMPLETED**: Emerald (Selesai)

### Priority Colors
- **URGENT**: Red
- **HIGH**: Orange
- **MEDIUM**: Yellow
- **LOW**: Slate

## Responsive Design

- **Mobile (< 768px)**: Single column
- **Tablet (768px - 1280px)**: 2 columns
- **Desktop (> 1280px)**: 3 columns

## Dark Mode

Semua komponen fully support dark mode menggunakan Tailwind's dark variant dengan color adjustments yang optimal.

## Dependencies

- `framer-motion`: ^12.40.0 (sudah terinstall)
- `lucide-react`: ^1.17.0 (sudah terinstall)
- `tailwindcss`: ^4 (sudah terinstall)

## Tips Optimasi

1. **Lazy Loading**: Untuk list panjang, gunakan virtualization
2. **Memoization**: Filter results dengan `useMemo`
3. **Debounce**: Search input sebaiknya di-debounce
4. **Image Optimization**: Gunakan Next.js Image untuk attachments

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14.1+
- Edge 90+

Semua browser modern yang support CSS transforms dan backdrop-filter.
