import React from 'react';
import {
  Wheat,
  Sprout,
  Leaf,
  Flower2,
  Flower,
  Flame,
  Sparkles,
  Ghost,
  Egg,
  EggFried,
  Milk,
  Drumstick,
  Beef,
  CircleDot,
  Sun,
  Apple,
  Carrot,
  Nut,
  Package,
  Soup,
  Utensils,
  FlaskConical,
  Cookie,
  PieChart,
  GlassWater,
} from 'lucide-react';

interface ItemIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const ItemIcon: React.FC<ItemIconProps> = ({ name, className = '', size = 20 }) => {
  switch (name) {
    case 'Carrot':
      return <Carrot size={size} className={className} />;
    case 'Bean':
    case 'Sprout':
      return <Sprout size={size} className={className} />;
    case 'Wheat':
      return <Wheat size={size} className={className} />;
    case 'Leaf':
      return <Leaf size={size} className={className} />;
    case 'Flower2':
      return <Flower2 size={size} className={className} />;
    case 'Flower':
      return <Flower size={size} className={className} />;
    case 'Flame':
      return <Flame size={size} className={className} />;
    case 'Sparkles':
      return <Sparkles size={size} className={className} />;
    case 'Ghost':
      return <Ghost size={size} className={className} />;
    case 'Egg':
      return <Egg size={size} className={className} />;
    case 'EggFried':
      return <EggFried size={size} className={className} />;
    case 'Milk':
      return <Milk size={size} className={className} />;
    case 'Drumstick':
      return <Drumstick size={size} className={className} />;
    case 'Beef':
      return <Beef size={size} className={className} />;
    case 'CircleDot':
      return <CircleDot size={size} className={className} />;
    case 'Sun':
      return <Sun size={size} className={className} />;
    case 'Apple':
      return <Apple size={size} className={className} />;
    case 'Nut':
      return <Nut size={size} className={className} />;
    case 'Soup':
      return <Soup size={size} className={className} />;
    case 'Utensils':
      return <Utensils size={size} className={className} />;
    case 'FlaskConical':
      return <FlaskConical size={size} className={className} />;
    case 'Pie':
    case 'PieChart':
      return <PieChart size={size} className={className} />;
    case 'Cookie':
      return <Cookie size={size} className={className} />;
    case 'GlassWater':
      return <GlassWater size={size} className={className} />;
    default:
      return <Package size={size} className={className} />;
  }
};
