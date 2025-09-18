// client/src/lib/utils/visual-utils.ts
import {
    Package,
    Code,
    Users,
    Target,
    BarChart,
    Layers,
    LifeBuoy,
    BookOpen,
    Wrench,
    Component,
    ClipboardList,
    FileText,
    LucideProps,
  } from 'lucide-react';
  import { ForwardRefExoticComponent, RefAttributes } from 'react';
  
  // --- Card Background Colors ---
  export const pastelColors = [
    'bg-pastel-magnolia',
    'bg-pastel-mint_cream',
    'bg-pastel-light_blue',
    'bg-pastel-isabelline',
    'bg-pastel-lavender_web',
    'bg-pastel-periwinkle',
  ];
  
  export const getColorFromId = (id: string): string => {
    if (!id) return pastelColors[0];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return pastelColors[hash % pastelColors.length];
  };
  
  // --- Card Header Images ---
  const cardHeaderImages = [
    '/images/card-headers/1.png',
    '/images/card-headers/2.png',
    '/images/card-headers/3.png',
    '/images/card-headers/4.png',
    '/images/card-headers/5.png',
  ];
  
  export const getCardHeaderImage = (id: string): string => {
    if (!id) return cardHeaderImages[0];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return cardHeaderImages[hash % cardHeaderImages.length];
  };
  
  // --- Card Icons ---
  type IconComponent = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  
  const cardIcons: IconComponent[] = [
    Layers,
    Package,
    Users,
    Code,
    Target,
    BarChart,
    LifeBuoy,
    BookOpen,
    Wrench,
    Component,
    ClipboardList,
    FileText,
  ];
  
  export const getCardIcon = (id: string): IconComponent => {
    if (!id) return cardIcons[0];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return cardIcons[hash % cardIcons.length];
  };