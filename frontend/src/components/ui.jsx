import {
  Utensils, Truck, Bike, Bus, Store, Heart, Wrench, MapPin, Phone,
  MessageCircle, Star, Search,
} from 'lucide-react';

// mapea el nombre de icono de la categoría a un icono de lucide
const ICONS = { utensils: Utensils, truck: Truck, bike: Bike, bus: Bus, store: Store, heart: Heart, wrench: Wrench };
export function CatIcon({ name, size = 22 }) {
  const I = ICONS[name] || Store;
  return <I size={size} />;
}

export { Phone, MessageCircle, MapPin, Star, Search };

// arma el enlace de WhatsApp (solo dígitos; antepone 593 si es un celular local 09...)
export function waHref(numero, texto) {
  if (!numero) return null;
  let n = String(numero).replace(/\D/g, '');
  if (n.startsWith('0')) n = '593' + n.slice(1);
  const t = texto ? '?text=' + encodeURIComponent(texto) : '';
  return `https://wa.me/${n}${t}`;
}

export function telHref(numero) {
  if (!numero) return null;
  return 'tel:' + String(numero).replace(/[^\d+]/g, '');
}

export function Loader() { return <div className="spin" />; }
export function Vacio({ children }) { return <div className="empty">{children}</div>; }
