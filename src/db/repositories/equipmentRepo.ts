import { nowIso } from "../../utils/dates";
import type { PenRepsDatabase } from "../db";
import { db } from "../db";
import type { EquipmentCategory, UserEquipmentInventoryItem } from "../schema";
import { getActiveProfileId } from "./profilesRepo";

const DEFAULT_EQUIPMENT: Array<{
  key: string;
  name: string;
  category: EquipmentCategory;
  isOwned: boolean;
}> = [
  { key: "bodyweight", name: "Bodyweight", category: "bodyweight", isOwned: true },
  { key: "pull-up-bar", name: "Pull-up bar", category: "accessory", isOwned: false },
  { key: "treadmill", name: "Treadmill", category: "cardio", isOwned: false },
  { key: "dumbbells", name: "Dumbbells", category: "weights", isOwned: false },
  { key: "kettlebell", name: "Kettlebell", category: "weights", isOwned: false },
  { key: "resistance-bands", name: "Resistance bands", category: "accessory", isOwned: false },
  { key: "yoga-mat", name: "Yoga mat", category: "mobility", isOwned: false },
  { key: "bench", name: "Bench", category: "weights", isOwned: false }
];

export const seedEquipmentInventory = async (database: PenRepsDatabase = db) => {
  const profileId = await getActiveProfileId(database);
  const timestamp = nowIso();
  const existing = await database.userEquipmentInventory
    .where("profileId")
    .equals(profileId)
    .toArray();
  const existingKeys = new Set(existing.map((item) => item.equipmentKey));
  const missing: UserEquipmentInventoryItem[] = DEFAULT_EQUIPMENT.filter(
    (item) => !existingKeys.has(item.key)
  ).map((item) => ({
    id: `${profileId}_${item.key}`,
    profileId,
    equipmentKey: item.key,
    name: item.name,
    category: item.category,
    isOwned: item.isOwned,
    createdAt: timestamp,
    updatedAt: timestamp
  }));

  if (missing.length > 0) {
    await database.userEquipmentInventory.bulkAdd(missing);
  }
};

export const listEquipmentInventory = async (database: PenRepsDatabase = db) => {
  await seedEquipmentInventory(database);
  const profileId = await getActiveProfileId(database);
  return database.userEquipmentInventory.where("profileId").equals(profileId).toArray();
};

export const updateEquipmentOwnership = async (
  equipmentKey: string,
  isOwned: boolean,
  database: PenRepsDatabase = db
) => {
  await seedEquipmentInventory(database);
  const profileId = await getActiveProfileId(database);
  const existing = await database.userEquipmentInventory
    .where("profileId")
    .equals(profileId)
    .and((item) => item.equipmentKey === equipmentKey)
    .first();
  if (!existing) {
    throw new Error("Equipment item not found.");
  }
  const next = { ...existing, isOwned, updatedAt: nowIso() };
  await database.userEquipmentInventory.put(next);
  return next;
};
