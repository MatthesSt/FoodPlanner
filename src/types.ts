export type Dish = {
  id?: string;
  name: string;
  ingredients: { id: number; name: string; amount: string }[];
  description: string;
  author: string;
  updated_at?: number;
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
