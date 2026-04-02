import Map "mo:core/Map";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";

actor {
  type TravelEntry = {
    id : Nat;
    date : Text;
    departure : Text;
    destination : Text;
    distanceKm : Float;
    note : ?Text;
    createdAt : Int;
  };

  type Preset = {
    id : Nat;
    name : Text;
    departure : Text;
    destination : Text;
    distanceKm : Float;
  };

  func compareTravelEntry(a : TravelEntry, b : TravelEntry) : Order.Order {
    Text.compare(b.date, a.date);
  };

  func comparePreset(a : Preset, b : Preset) : Order.Order {
    Nat.compare(a.id, b.id);
  };

  let entries = Map.empty<Nat, TravelEntry>();
  let presets = Map.empty<Nat, Preset>();

  var nextEntryId = 0;
  var nextPresetId = 0;

  public shared func addEntry(date : Text, departure : Text, destination : Text, distanceKm : Float, note : ?Text) : async Nat {
    let entry : TravelEntry = {
      id = nextEntryId;
      date;
      departure;
      destination;
      distanceKm;
      note;
      createdAt = Time.now();
    };
    entries.add(nextEntryId, entry);
    nextEntryId += 1;
    entry.id;
  };

  public shared func deleteEntry(id : Nat) : async () {
    if (not entries.containsKey(id)) {
      Runtime.trap("Entry not found");
    };
    entries.remove(id);
  };

  public query func getAllEntries() : async [TravelEntry] {
    entries.values().toArray().sort(compareTravelEntry);
  };

  public shared func addPreset(name : Text, departure : Text, destination : Text, distanceKm : Float) : async Nat {
    let preset : Preset = {
      id = nextPresetId;
      name;
      departure;
      destination;
      distanceKm;
    };
    presets.add(nextPresetId, preset);
    nextPresetId += 1;
    preset.id;
  };

  public shared func deletePreset(id : Nat) : async () {
    if (not presets.containsKey(id)) {
      Runtime.trap("Preset not found");
    };
    presets.remove(id);
  };

  public query func getAllPresets() : async [Preset] {
    presets.values().toArray().sort(comparePreset);
  };
};
