import { migrateDish } from "./migrations";
import { Dish } from "./types";
import { generateRandomUser } from "./utils";

export function setDishes(data: Dish[]) {
  localStorage.setItem("dishes", JSON.stringify(data));
}

export function add(dish: Dish) {
  const existing = getDishes() || [];
  existing.push(dish);
  setDishes(existing);
}

export function getDishes() {
  const data = localStorage.getItem("dishes");
  if (data) {
    return (JSON.parse(data) as Dish[])
      .map((d) => migrateDish(d))
      .sort((a, b) =>
        a.updated_at.toString().localeCompare(b.updated_at.toString())
      );
  }
  return null;
}

export function getCurrentUser() {
  const user = localStorage.getItem("user") || generateRandomUser();
  localStorage.setItem("user", user);
  return user;
}

export function setCurrentUser(user: string) {
  localStorage.setItem("user", user);
}
