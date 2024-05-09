import { generateRandomUser } from "./utils";

type Table = "dishes";

export function set<T>(table: Table, data: T) {
  localStorage.setItem(table, JSON.stringify(data));
}

export function add<T>(table: Table, data: T) {
  const existing = get<T>(table) || [];
  existing.push(data);
  set(table, existing);
}

export function get<T>(table: Table): T[] | null {
  const data = localStorage.getItem(table);
  if (data) {
    return JSON.parse(data).sort((a: any, b: any) => a.id - b.id);
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
