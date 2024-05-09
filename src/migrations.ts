import { Dish } from "./types";

export function migrateDish(
  dish: Dish
): Dish & { deleted_at: number | null } & { updated_at: number } {
  addUpdated_at: {
    dish = {
      ...dish,
      updated_at: dish.updated_at ?? Date.now(),
    };
  }
  addDeleted_at: {
    dish = {
      ...dish,
      deleted_at: dish.deleted_at ?? null,
    };
  }
  return dish;
}
