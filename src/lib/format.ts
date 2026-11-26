import type { BodyType, FuelType, ServiceHistory, Transmission, VehicleCondition } from "@/types/vehicle";

const gbp0 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const gbp2 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 });
const int = new Intl.NumberFormat("en-GB");

export const formatPrice = (n: number) => gbp0.format(n);
export const formatMoney = (n: number) => gbp2.format(n);
export const formatNumber = (n: number) => int.format(n);
export const formatMileage = (n: number) => `${int.format(n)} miles`;

export const fuelLabels: Record<FuelType, string> = {
  petrol: "Petrol", diesel: "Diesel", hybrid: "Hybrid", plug_in_hybrid: "Plug-in hybrid", electric: "Electric",
};
export const transmissionLabels: Record<Transmission, string> = { manual: "Manual", automatic: "Automatic" };
export const bodyLabels: Record<BodyType, string> = {
  hatchback: "Hatchback", saloon: "Saloon", estate: "Estate", suv: "SUV", coupe: "Coupe", convertible: "Convertible", mpv: "MPV", pickup: "Pick-up",
};
export const serviceHistoryLabels: Record<ServiceHistory, string> = { full: "Full service history", partial: "Part service history", none: "No service history" };
export const conditionLabels: Record<VehicleCondition, string> = { excellent: "Excellent", good: "Good", fair: "Fair" };

export function timeAgo(iso: string, now = Date.now()): string {
  const days = Math.floor((now - new Date(iso).getTime()) / 864e5);
  if (days <= 0) return "Listed today";
  if (days === 1) return "Listed yesterday";
  if (days < 7) return `Listed ${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks < 5 ? `Listed ${weeks} week${weeks > 1 ? "s" : ""} ago` : `Listed ${Math.floor(days / 30)} month${days >= 60 ? "s" : ""} ago`;
}

export const pluralise = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;
