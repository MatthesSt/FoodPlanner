export type Dish = {
  id?: string;
  name: string;
  ingredients: { id: number; name: string; amount: string }[];
  description: string;
  author: string;
  //   updated_at?: number;
};
