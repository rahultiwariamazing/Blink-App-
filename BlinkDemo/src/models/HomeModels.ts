// src/models/HomeModels.ts
export type Category = {
  id: string;
  name: string;
  icon?: string; // optional
};

export type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
};

export type Item = {
  id: string;
  subcategoryId: string;
  name: string;
  price: number;
  image: string;
  description: string;
};

// (Keep Store only if you actually use it elsewhere)
export type Store = {
  id: string;
  name: string;
  deliveryTime: string;
  discount?: string;
  image: string;
};