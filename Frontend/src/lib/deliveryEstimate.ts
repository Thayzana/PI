import { apiFetch } from "./api";

export interface AddressParts {
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface DeliveryEstimate {
  distanceKm: number;
  durationMinutes: number;
  drivingMinutes: number;
  prepBufferMinutes: number;
  estimatedTime: string;
  source: "google" | "osrm" | "fallback";
  originAddress: string;
  destinationAddress: string;
  googleMapsUrl: string;
  wazeUrl: string;
}

export function buildAddressFromParts(parts: AddressParts): string {
  const cep = parts.cep?.replace(/\D/g, "") ?? "";
  return [
    parts.rua?.trim(),
    parts.numero?.trim(),
    parts.bairro?.trim(),
    parts.cidade?.trim(),
    parts.estado?.trim()?.toUpperCase(),
    cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : "",
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");
}

export function hasMinimumAddress(parts: AddressParts): boolean {
  const city = parts.cidade?.trim();
  const neighborhood = parts.bairro?.trim();
  const street = parts.rua?.trim();
  return Boolean(city && (neighborhood || street));
}

export async function fetchDeliveryEstimate(
  destinationParts: AddressParts,
  origin?: string
): Promise<DeliveryEstimate> {
  const res = await apiFetch("/api/logistics/delivery-estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin: origin?.trim() || undefined,
      destinationParts,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Não foi possível estimar o tempo de entrega.");
  }
  return data as DeliveryEstimate;
}

export function estimateSourceLabel(source: DeliveryEstimate["source"]): string {
  switch (source) {
    case "google":
      return "Google Maps";
    case "osrm":
      return "OpenStreetMap / OSRM";
    default:
      return "Estimativa padrão";
  }
}
