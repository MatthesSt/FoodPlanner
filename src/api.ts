// import { ref } from "vue";
// import { Dish } from "./types";
// import * as db from "./firebase";
// import * as storage from "./storage";

// //TODO: snyc local storage with db
// const dishes = ref<Dish[]>([]);

// const dbDishes = await db.getDishes();
// const storageDishes = storage.get("dishes") || [];

// function migrateDishes(dishes: Dish[]) {
//   return dishes.map((dish) => ({
//     ...dish,
//     updated_at: dish.updated_at ?? new Date().valueOf(),
//   })) as Required<Dish>[];
// }
