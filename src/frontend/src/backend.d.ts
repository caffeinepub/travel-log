import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TravelEntry {
    id: bigint;
    destination: string;
    date: string;
    note?: string;
    createdAt: bigint;
    distanceKm: number;
    departure: string;
}
export interface Preset {
    id: bigint;
    destination: string;
    name: string;
    distanceKm: number;
    departure: string;
}
export interface backendInterface {
    addEntry(date: string, departure: string, destination: string, distanceKm: number, note: string | null): Promise<bigint>;
    addPreset(name: string, departure: string, destination: string, distanceKm: number): Promise<bigint>;
    deleteEntry(id: bigint): Promise<void>;
    deletePreset(id: bigint): Promise<void>;
    getAllEntries(): Promise<Array<TravelEntry>>;
    getAllPresets(): Promise<Array<Preset>>;
}
