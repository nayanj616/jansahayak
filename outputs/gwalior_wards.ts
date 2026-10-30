export type BoundaryStatus = "unavailable" | "approximate" | "verified";
export type VerificationStatus = "pending" | "verified" | "disputed";
export interface GwaliorWard {
  ward_id: string; ward_no: number; ward_name: string; ward_name_original: string; lgd_code: number | null;
  city: "Gwalior"; state: "Madhya Pradesh"; country: "India"; ulb_name: "Gwalior Municipal Corporation"; ulb_lgd_code: 250694;
  latitude: number | null; longitude: number | null; boundary_geojson: Record<string, unknown> | null; boundary_status: BoundaryStatus; center_source: string | null;
  councillor_name: string | null; supervisor_name: string | null; sanitary_inspector_name: string | null; sanitation_zone: string | null; active: boolean;
  verification_status: VerificationStatus; source_name: string; source_url: string | null; source_updated_at: string | null; last_verified_at: string | null; notes: string | null;
}
export interface GwaliorWardDataset { dataset_name: string; dataset_status: string; source_file: string; city: string; ulb_name: string; ulb_lgd_code: number; declared_total_wards: number; included_record_count: number; wards: GwaliorWard[]; }
export function isGwaliorWard(value: unknown): value is GwaliorWard {
  if (!value || typeof value !== "object") return false;
  const w = value as Record<string, unknown>;
  return typeof w.ward_id === "string" && w.ward_id.trim() !== "" && Number.isInteger(w.ward_no) &&
    typeof w.ward_name === "string" && w.ward_name.trim() !== "" && typeof w.ward_name_original === "string" &&
    (w.lgd_code === null || Number.isInteger(w.lgd_code)) && w.city === "Gwalior" && w.state === "Madhya Pradesh" && w.country === "India" &&
    w.ulb_name === "Gwalior Municipal Corporation" && w.ulb_lgd_code === 250694 &&
    (w.latitude === null || (typeof w.latitude === "number" && w.latitude >= -90 && w.latitude <= 90)) &&
    (w.longitude === null || (typeof w.longitude === "number" && w.longitude >= -180 && w.longitude <= 180)) &&
    (w.boundary_geojson === null || (typeof w.boundary_geojson === "object" && !Array.isArray(w.boundary_geojson))) &&
    ["unavailable", "approximate", "verified"].includes(String(w.boundary_status)) &&
    ["pending", "verified", "disputed"].includes(String(w.verification_status)) && typeof w.active === "boolean" &&
    typeof w.source_name === "string" && ["councillor_name", "supervisor_name", "sanitary_inspector_name", "sanitation_zone", "center_source", "source_url", "source_updated_at", "last_verified_at", "notes"].every(k => w[k] === null || typeof w[k] === "string");
}
export function parseGwaliorWardDataset(input: unknown): GwaliorWardDataset {
  if (!input || typeof input !== "object" || !Array.isArray((input as GwaliorWardDataset).wards)) throw new Error("Invalid Gwalior ward dataset: wards must be an array");
  const data = input as GwaliorWardDataset;
  if (data.wards.some(w => !isGwaliorWard(w))) throw new Error("Invalid Gwalior ward dataset: one or more records failed validation");
  if (data.included_record_count !== data.wards.length) throw new Error("Invalid Gwalior ward dataset: included_record_count does not match wards.length");
  const ids = new Set<string>(), numbers = new Set<number>();
  for (const w of data.wards) { if (ids.has(w.ward_id)) throw new Error(`Duplicate ward_id: ${w.ward_id}`); if (numbers.has(w.ward_no)) throw new Error(`Duplicate ward_no: ${w.ward_no}`); ids.add(w.ward_id); numbers.add(w.ward_no); }
  return data;
}
