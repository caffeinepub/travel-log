import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  ClipboardList,
  Download,
  Loader2,
  PenLine,
  Plus,
  Trash2,
  TreePine,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Preset, TravelEntry } from "../backend.d";
import { useActor } from "../hooks/useActor";

type MobileTab = "log" | "history" | "presets";

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getFourWeeksAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 28);
  return d.toISOString().split("T")[0];
}

function exportCSV(entries: TravelEntry[], from: string, to: string) {
  const filtered = entries.filter((e) => {
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    return true;
  });

  const header = ["Date", "Departure", "Destination", "Distance (km)", "Note"];
  const rows = filtered.map((e) => [
    e.date,
    e.departure,
    e.destination,
    e.distanceKm.toString(),
    e.note ?? "",
  ]);

  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "travel-log-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Preset chips ──────────────────────────────────────────────────────────────
function PresetChips({
  presets,
  onApply,
}: {
  presets: Preset[];
  onApply: (p: Preset) => void;
}) {
  return (
    <div className="mb-5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
        Quick Presets
      </Label>
      <div className="flex flex-wrap gap-2" data-ocid="presets.list">
        {presets.map((p, i) => (
          <button
            type="button"
            key={p.id.toString()}
            onClick={() => onApply(p)}
            data-ocid={`presets.item.${i + 1}`}
            className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all hover:shadow-xs"
            style={{
              borderColor: "oklch(0.38 0.09 175 / 0.4)",
              color: "oklch(0.38 0.09 175)",
              background: "oklch(0.38 0.09 175 / 0.06)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "oklch(0.38 0.09 175 / 0.14)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "oklch(0.38 0.09 175 / 0.06)";
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Log Trip Form ─────────────────────────────────────────────────────────────
function LogTripForm({
  date,
  setDate,
  departure,
  setDeparture,
  destination,
  setDestination,
  distance,
  setDistance,
  note,
  setNote,
  presets,
  presetsLoading,
  isFormValid,
  isPending,
  actorReady,
  onSubmit,
  onApplyPreset,
  onGoToPresetsTab,
  showPresetLink,
}: {
  date: string;
  setDate: (v: string) => void;
  departure: string;
  setDeparture: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  distance: string;
  setDistance: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  presets: Preset[];
  presetsLoading: boolean;
  isFormValid: boolean;
  isPending: boolean;
  actorReady: boolean;
  onSubmit: () => void;
  onApplyPreset: (p: Preset) => void;
  onGoToPresetsTab?: () => void;
  showPresetLink?: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Quick Presets */}
      {!presetsLoading && presets.length > 0 && (
        <PresetChips presets={presets} onApply={onApplyPreset} />
      )}

      {/* No presets yet */}
      {!presetsLoading && presets.length === 0 && (
        <div className="mb-5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">No presets yet</span>
          {showPresetLink && onGoToPresetsTab ? (
            <button
              type="button"
              onClick={onGoToPresetsTab}
              className="text-xs font-semibold underline underline-offset-2"
              style={{ color: "oklch(0.38 0.09 175)" }}
              data-ocid="presets.tab.link"
            >
              + New Preset
            </button>
          ) : null}
        </div>
      )}

      {/* If presets exist on mobile, show link to presets tab */}
      {showPresetLink &&
        !presetsLoading &&
        presets.length > 0 &&
        onGoToPresetsTab && (
          <div className="flex justify-end -mt-3 mb-2">
            <button
              type="button"
              onClick={onGoToPresetsTab}
              className="text-xs font-semibold underline underline-offset-2"
              style={{ color: "oklch(0.38 0.09 175)" }}
              data-ocid="presets.tab.link"
            >
              + New Preset
            </button>
          </div>
        )}

      {/* Date + Distance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="date" className="text-xs font-medium">
            Date
          </Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 text-sm w-full"
            data-ocid="entry.date.input"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="distance" className="text-xs font-medium">
            Distance (km)
          </Label>
          <Input
            id="distance"
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 18.5"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="h-9 text-sm"
            data-ocid="entry.distance.input"
          />
        </div>
      </div>

      {/* Departure + Destination */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="departure" className="text-xs font-medium">
            Departure
          </Label>
          <Input
            id="departure"
            type="text"
            placeholder="e.g. Home, Auckland"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            className="h-9 text-sm"
            data-ocid="entry.departure.input"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="destination" className="text-xs font-medium">
            Destination
          </Label>
          <Input
            id="destination"
            type="text"
            placeholder="e.g. 201 Luckens Rd"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="h-9 text-sm"
            data-ocid="entry.destination.input"
          />
        </div>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <Label htmlFor="note" className="text-xs font-medium">
          Note{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="note"
          placeholder="Add a note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="text-sm resize-none h-20"
          data-ocid="entry.note.textarea"
        />
      </div>

      {/* Submit */}
      <Button
        type="button"
        className="w-full h-11 rounded-full font-semibold text-sm"
        disabled={!isFormValid || isPending || !actorReady}
        onClick={onSubmit}
        data-ocid="entry.submit_button"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging...
          </>
        ) : (
          "Log Trip"
        )}
      </Button>
    </div>
  );
}

// ── History Panel ─────────────────────────────────────────────────────────────
function HistoryPanel({
  entries,
  filteredEntries,
  entriesLoading,
  filterFrom,
  setFilterFrom,
  filterTo,
  setFilterTo,
  onDeleteRequest,
  deleteIsPending,
}: {
  entries: TravelEntry[];
  filteredEntries: TravelEntry[];
  entriesLoading: boolean;
  filterFrom: string;
  setFilterFrom: (v: string) => void;
  filterTo: string;
  setFilterTo: (v: string) => void;
  onDeleteRequest: (id: bigint) => void;
  deleteIsPending: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-card">
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div>
          <h2 className="text-base font-bold text-foreground">Travel Log</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredEntries.length}{" "}
            {filteredEntries.length === 1 ? "entry" : "entries"} shown
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs rounded-full"
          onClick={() => exportCSV(entries, filterFrom, filterTo)}
          disabled={filteredEntries.length === 0}
          data-ocid="log.export.button"
        >
          <Download className="w-3 h-3 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* Date range filter */}
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <Label className="text-xs font-medium text-muted-foreground block mb-2">
          Filter by date
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="h-8 text-xs w-full"
              data-ocid="log.filter_from.input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="h-8 text-xs w-full"
              data-ocid="log.filter_to.input"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[calc(100vh-320px)] lg:max-h-[520px]">
        {entriesLoading ? (
          <div className="p-4 space-y-3" data-ocid="log.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-14 text-center"
            data-ocid="log.empty_state"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ background: "oklch(0.88 0.035 75)" }}
            >
              <TreePine className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No entries found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {entries.length === 0
                ? "Log your first trip using the form."
                : "Try adjusting the date range filter."}
            </p>
          </div>
        ) : (
          <table className="w-full text-xs" data-ocid="log.table">
            <thead>
              <tr
                className="border-b border-border"
                style={{ background: "oklch(0.88 0.035 75)" }}
              >
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">
                  Date
                </th>
                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">
                  Departure
                </th>
                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">
                  Destination
                </th>
                <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">
                  km
                </th>
                <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground hidden sm:table-cell">
                  Note
                </th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, i) => (
                <tr
                  key={entry.id.toString()}
                  className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                  data-ocid={`log.item.${i + 1}`}
                >
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                    {entry.date}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground max-w-[90px] truncate hidden sm:table-cell">
                    {entry.departure}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground max-w-[100px] truncate">
                    {entry.destination}
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-foreground">
                    {entry.distanceKm.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground max-w-[100px] truncate hidden sm:table-cell">
                    {entry.note ?? <span className="italic opacity-50">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onDeleteRequest(entry.id)}
                      disabled={deleteIsPending}
                      data-ocid={`log.delete_button.${i + 1}`}
                      className="p-1.5 rounded transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Presets Panel ─────────────────────────────────────────────────────────────
function PresetsPanel({
  presets,
  presetsLoading,
  newPresetName,
  setNewPresetName,
  newPresetDeparture,
  setNewPresetDeparture,
  newPresetDestination,
  setNewPresetDestination,
  newPresetDistance,
  setNewPresetDistance,
  isPresetValid,
  isSavingPreset,
  actorReady,
  onSavePreset,
  onDeleteRequest,
  deleteIsPending,
}: {
  presets: Preset[];
  presetsLoading: boolean;
  newPresetName: string;
  setNewPresetName: (v: string) => void;
  newPresetDeparture: string;
  setNewPresetDeparture: (v: string) => void;
  newPresetDestination: string;
  setNewPresetDestination: (v: string) => void;
  newPresetDistance: string;
  setNewPresetDistance: (v: string) => void;
  isPresetValid: boolean;
  isSavingPreset: boolean;
  actorReady: boolean;
  onSavePreset: () => void;
  onDeleteRequest: (id: bigint) => void;
  deleteIsPending: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Existing presets list */}
      <div className="bg-card border border-border rounded-lg shadow-card">
        <div className="px-4 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Saved Presets</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tap a preset on the Log Trip tab to auto-fill the form.
          </p>
        </div>
        <div className="p-4">
          {presetsLoading ? (
            <div className="space-y-3" data-ocid="presets.loading_state">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded" />
              ))}
            </div>
          ) : presets.length === 0 ? (
            <div className="text-center py-6" data-ocid="presets.empty_state">
              <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">
                No presets yet. Create one below.
              </p>
            </div>
          ) : (
            <div className="space-y-2" data-ocid="presets.list">
              {presets.map((p, i) => (
                <div
                  key={p.id.toString()}
                  className="flex items-center justify-between px-3 py-3 rounded-lg border border-border"
                  style={{ background: "oklch(0.88 0.035 75 / 0.3)" }}
                  data-ocid={`presets.row.${i + 1}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {p.departure} → {p.destination} · {p.distanceKm} km
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(p.id)}
                    disabled={deleteIsPending}
                    data-ocid={`presets.delete_button.${i + 1}`}
                    className="ml-3 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                    title="Delete preset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Preset form */}
      <div
        className="bg-card border-2 rounded-lg shadow-card"
        style={{ borderColor: "oklch(0.38 0.09 175 / 0.35)" }}
      >
        <div
          className="px-4 py-4 border-b rounded-t-lg"
          style={{
            borderColor: "oklch(0.38 0.09 175 / 0.2)",
            background: "oklch(0.38 0.09 175 / 0.06)",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.38 0.09 175)" }}
            >
              <Plus
                className="w-4 h-4"
                style={{ color: "oklch(0.98 0.008 85)" }}
              />
            </div>
            <div>
              <h3
                className="text-base font-bold"
                style={{ color: "oklch(0.38 0.09 175)" }}
              >
                Create Preset
              </h3>
              <p className="text-xs text-muted-foreground">
                Save a route for quick re-use
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pname" className="text-xs font-medium">
              Preset Name
            </Label>
            <Input
              id="pname"
              placeholder="e.g. West Harbour Delivery"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="h-10 text-sm"
              data-ocid="presets.name.input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pdep" className="text-xs font-medium">
                Departure
              </Label>
              <Input
                id="pdep"
                placeholder="e.g. Home, Auckland"
                value={newPresetDeparture}
                onChange={(e) => setNewPresetDeparture(e.target.value)}
                className="h-10 text-sm"
                data-ocid="presets.departure.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pdest" className="text-xs font-medium">
                Destination
              </Label>
              <Input
                id="pdest"
                placeholder="e.g. 201 Luckens Rd"
                value={newPresetDestination}
                onChange={(e) => setNewPresetDestination(e.target.value)}
                className="h-10 text-sm"
                data-ocid="presets.destination.input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pdist" className="text-xs font-medium">
              Distance (km)
            </Label>
            <Input
              id="pdist"
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 18.5"
              value={newPresetDistance}
              onChange={(e) => setNewPresetDistance(e.target.value)}
              className="h-10 text-sm"
              data-ocid="presets.distance.input"
            />
          </div>

          <Button
            type="button"
            className="w-full h-11 rounded-full font-semibold text-sm mt-1"
            onClick={onSavePreset}
            disabled={!isPresetValid || isSavingPreset || !actorReady}
            data-ocid="presets.save_button"
          >
            {isSavingPreset ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Preset"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function MainApp() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<MobileTab>("log");

  // Log trip form state
  const [date, setDate] = useState(getTodayDate());
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState("");
  const [note, setNote] = useState("");

  // Filter state
  const [filterFrom, setFilterFrom] = useState(getFourWeeksAgo());
  const [filterTo, setFilterTo] = useState(getTodayDate());

  // Desktop preset modal state
  const [presetModalOpen, setPresetModalOpen] = useState(false);

  // Preset form state
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetDeparture, setNewPresetDeparture] = useState("");
  const [newPresetDestination, setNewPresetDestination] = useState("");
  const [newPresetDistance, setNewPresetDistance] = useState("");

  // Delete confirmation state
  const [deleteEntryConfirm, setDeleteEntryConfirm] = useState<bigint | null>(
    null,
  );
  const [deletePresetConfirm, setDeletePresetConfirm] = useState<bigint | null>(
    null,
  );

  // Queries
  const { data: entries = [], isLoading: entriesLoading } = useQuery<
    TravelEntry[]
  >({
    queryKey: ["entries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEntries();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: presets = [], isLoading: presetsLoading } = useQuery<Preset[]>({
    queryKey: ["presets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPresets();
    },
    enabled: !!actor && !isFetching,
  });

  // Mutations
  const addEntryMutation = useMutation({
    mutationFn: () => {
      if (!actor) throw new Error("Not connected");
      return actor.addEntry(
        date,
        departure,
        destination,
        Number.parseFloat(distance),
        note.trim() || null,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      setDate(getTodayDate());
      setDeparture("");
      setDestination("");
      setDistance("");
      setNote("");
      toast.success("Trip logged successfully!");
    },
    onError: () => {
      toast.error("Failed to log trip. Please try again.");
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteEntry(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      setDeleteEntryConfirm(null);
      toast.success("Entry deleted.");
    },
    onError: () => {
      toast.error("Failed to delete entry.");
    },
  });

  const addPresetMutation = useMutation({
    mutationFn: () => {
      if (!actor) throw new Error("Not connected");
      return actor.addPreset(
        newPresetName,
        newPresetDeparture,
        newPresetDestination,
        Number.parseFloat(newPresetDistance),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["presets"] });
      setNewPresetName("");
      setNewPresetDeparture("");
      setNewPresetDestination("");
      setNewPresetDistance("");
      setPresetModalOpen(false);
      toast.success("Preset saved!");
    },
    onError: () => {
      toast.error("Failed to save preset.");
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deletePreset(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["presets"] });
      setDeletePresetConfirm(null);
      toast.success("Preset deleted.");
    },
  });

  const applyPreset = (preset: Preset) => {
    setDeparture(preset.departure);
    setDestination(preset.destination);
    setDistance(preset.distanceKm.toString());
    setActiveTab("log");
  };

  const filteredEntries = entries
    .filter((e) => {
      if (filterFrom && e.date < filterFrom) return false;
      if (filterTo && e.date > filterTo) return false;
      return true;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const isFormValid =
    date.trim() !== "" &&
    departure.trim() !== "" &&
    destination.trim() !== "" &&
    distance !== "" &&
    Number.parseFloat(distance) > 0;

  const isPresetValid =
    newPresetName.trim() !== "" &&
    newPresetDeparture.trim() !== "" &&
    newPresetDestination.trim() !== "" &&
    newPresetDistance !== "" &&
    Number.parseFloat(newPresetDistance) > 0;

  const tabItems: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
    { id: "log", label: "Log Trip", icon: <PenLine className="w-5 h-5" /> },
    {
      id: "history",
      label: "History",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    { id: "presets", label: "Presets", icon: <Bookmark className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-40 w-full border-b border-border bg-card shadow-xs"
        data-ocid="nav.section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/img_9735-019d509c-1d55-74d9-a037-285208c6ba13.png"
              alt="Company Logo"
              className="h-9 w-auto object-contain"
            />
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Wood Care Products — Tax Travel Records
          </span>
        </div>
      </header>

      {/* Mobile layout */}
      <main className="lg:hidden max-w-2xl mx-auto px-4 pt-5 pb-28">
        {activeTab === "log" && (
          <motion.div
            key="log"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="bg-card border border-border rounded-lg shadow-card p-5">
              <h2 className="text-base font-bold text-foreground mb-1">
                Log a New Trip
              </h2>
              <p className="text-xs text-muted-foreground mb-5">
                Record a trip for your tax records.
              </p>
              <LogTripForm
                date={date}
                setDate={setDate}
                departure={departure}
                setDeparture={setDeparture}
                destination={destination}
                setDestination={setDestination}
                distance={distance}
                setDistance={setDistance}
                note={note}
                setNote={setNote}
                presets={presets}
                presetsLoading={presetsLoading}
                isFormValid={isFormValid}
                isPending={addEntryMutation.isPending}
                actorReady={!!actor}
                onSubmit={() => addEntryMutation.mutate()}
                onApplyPreset={applyPreset}
                onGoToPresetsTab={() => setActiveTab("presets")}
                showPresetLink
              />
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <HistoryPanel
              entries={entries}
              filteredEntries={filteredEntries}
              entriesLoading={entriesLoading}
              filterFrom={filterFrom}
              setFilterFrom={setFilterFrom}
              filterTo={filterTo}
              setFilterTo={setFilterTo}
              onDeleteRequest={setDeleteEntryConfirm}
              deleteIsPending={deleteEntryMutation.isPending}
            />
          </motion.div>
        )}

        {activeTab === "presets" && (
          <motion.div
            key="presets"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <PresetsPanel
              presets={presets}
              presetsLoading={presetsLoading}
              newPresetName={newPresetName}
              setNewPresetName={setNewPresetName}
              newPresetDeparture={newPresetDeparture}
              setNewPresetDeparture={setNewPresetDeparture}
              newPresetDestination={newPresetDestination}
              setNewPresetDestination={setNewPresetDestination}
              newPresetDistance={newPresetDistance}
              setNewPresetDistance={setNewPresetDistance}
              isPresetValid={isPresetValid}
              isSavingPreset={addPresetMutation.isPending}
              actorReady={!!actor}
              onSavePreset={() => addPresetMutation.mutate()}
              onDeleteRequest={setDeletePresetConfirm}
              deleteIsPending={deletePresetMutation.isPending}
            />
          </motion.div>
        )}
      </main>

      {/* Desktop layout */}
      <main className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="bg-card border border-border rounded-lg shadow-card p-6">
              <h2 className="text-lg font-bold text-foreground mb-1">
                Log a New Trip
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Record a trip for your tax records.
              </p>
              <LogTripForm
                date={date}
                setDate={setDate}
                departure={departure}
                setDeparture={setDeparture}
                destination={destination}
                setDestination={setDestination}
                distance={distance}
                setDistance={setDistance}
                note={note}
                setNote={setNote}
                presets={presets}
                presetsLoading={presetsLoading}
                isFormValid={isFormValid}
                isPending={addEntryMutation.isPending}
                actorReady={!!actor}
                onSubmit={() => addEntryMutation.mutate()}
                onApplyPreset={applyPreset}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
          >
            <HistoryPanel
              entries={entries}
              filteredEntries={filteredEntries}
              entriesLoading={entriesLoading}
              filterFrom={filterFrom}
              setFilterFrom={setFilterFrom}
              filterTo={filterTo}
              setFilterTo={setFilterTo}
              onDeleteRequest={setDeleteEntryConfirm}
              deleteIsPending={deleteEntryMutation.isPending}
            />
          </motion.div>
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        data-ocid="nav.tab"
      >
        <div className="flex items-stretch h-16">
          {tabItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                data-ocid={`nav.${tab.id}.tab`}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 transition-colors"
                style={{
                  color: isActive
                    ? "oklch(0.38 0.09 175)"
                    : "oklch(0.55 0.04 175)",
                }}
              >
                <span
                  className="flex items-center justify-center w-9 h-6 rounded-full transition-all"
                  style={{
                    background: isActive
                      ? "oklch(0.38 0.09 175 / 0.1)"
                      : "transparent",
                  }}
                >
                  {tab.icon}
                </span>
                <span className="text-[10px] font-semibold leading-tight tracking-wide">
                  {tab.label}
                </span>
                {isActive && (
                  <span
                    className="absolute bottom-1 w-1 h-1 rounded-full"
                    style={{ background: "oklch(0.38 0.09 175)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <footer className="hidden lg:block mt-12 pb-8 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* Desktop: Preset Management Modal */}
      <Dialog open={presetModalOpen} onOpenChange={setPresetModalOpen}>
        <DialogContent className="max-w-md" data-ocid="presets.dialog">
          <DialogHeader>
            <DialogTitle>Manage Presets</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {presetsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : presets.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No presets saved yet.
              </p>
            ) : (
              presets.map((p, i) => (
                <div
                  key={p.id.toString()}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/30 border border-border"
                  data-ocid={`presets.row.${i + 1}`}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.departure} → {p.destination} · {p.distanceKm} km
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeletePresetConfirm(p.id)}
                    disabled={deletePresetMutation.isPending}
                    data-ocid={`presets.delete_button.${i + 1}`}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              New Preset
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="pname-modal" className="text-xs">
                Preset Name
              </Label>
              <Input
                id="pname-modal"
                placeholder="e.g. West Harbour Delivery"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="pdep-modal" className="text-xs">
                  Departure
                </Label>
                <Input
                  id="pdep-modal"
                  placeholder="Departure"
                  value={newPresetDeparture}
                  onChange={(e) => setNewPresetDeparture(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pdest-modal" className="text-xs">
                  Destination
                </Label>
                <Input
                  id="pdest-modal"
                  placeholder="Destination"
                  value={newPresetDestination}
                  onChange={(e) => setNewPresetDestination(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pdist-modal" className="text-xs">
                Distance (km)
              </Label>
              <Input
                id="pdist-modal"
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 18.5"
                value={newPresetDistance}
                onChange={(e) => setNewPresetDistance(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPresetModalOpen(false)}
              className="text-sm"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => addPresetMutation.mutate()}
              disabled={!isPresetValid || addPresetMutation.isPending || !actor}
              className="text-sm"
            >
              {addPresetMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save Preset"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Entry Confirmation */}
      <AlertDialog
        open={deleteEntryConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteEntryConfirm(null);
        }}
      >
        <AlertDialogContent data-ocid="log.delete_entry.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trip entry? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteEntryConfirm(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteEntryConfirm !== null)
                  deleteEntryMutation.mutate(deleteEntryConfirm);
              }}
              disabled={deleteEntryMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEntryMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Preset Confirmation */}
      <AlertDialog
        open={deletePresetConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setDeletePresetConfirm(null);
        }}
      >
        <AlertDialogContent data-ocid="presets.delete_preset.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this preset? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePresetConfirm(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletePresetConfirm !== null)
                  deletePresetMutation.mutate(deletePresetConfirm);
              }}
              disabled={deletePresetMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePresetMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
