import { Dish, PartialBy, Prettify } from "./types";
import * as db from "./firebase";
import * as storage from "./storage";

function migrateDish(dish: Dish) {
  return {
    ...dish,
    updated_at: dish.updated_at ?? 0,
  } as Prettify<PartialBy<Required<Dish>, "id">>;
}

/**
 * Fetches dishes from the database and local storage
 * if db dish got deleted, local will still be used
 * if local is newer than db, push local to db
 */
export async function getDishes() {
  const dbDishes = await db.getDishes();
  const storageDishes = storage.get<Dish>("dishes") || [];

  const allDishes = [...dbDishes.map((d) => migrateDish(d))];

  for (const dish of storageDishes.map((d) => migrateDish(d))) {
    const dbDish = allDishes.find((d) => d.id === dish.id);

    if (!dbDish) {
      dish.id = await db.saveDish(dish);
      allDishes.push(dish);
    } else if (dbDish.updated_at < dish.updated_at) {
      await db.saveDish(dish);
      allDishes.splice(allDishes.indexOf(dbDish), 1, dish);
    }
  }

  storage.set("dishes", allDishes);
  return allDishes;
}

/**
 * Saves a dish to the database and local storage
 * @param dish the dish to save
 */
export async function saveDish(dish: Dish) {
  if (dish.updated_at) {
    dish = { ...dish, updated_at: Date.now() };
  }

  try {
    dish.id = await db.saveDish(dish);
  } catch (e) {}

  const storageDishes = storage.get<Dish>("dishes") || [];

  if (dish.id) {
    storage.set("dishes", [
      ...storageDishes.filter((d) => d.id !== dish.id),
      dish,
    ]);
  }
  return dish.id;
}
