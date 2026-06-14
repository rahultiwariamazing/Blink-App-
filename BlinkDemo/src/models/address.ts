/**
 * Address Model
 * MAUI mapping:
 * - Model class used by ViewModel/ObservableCollection
 */

export type UserAddress = {
  id: string;
  userId: string;
  label: string; // Home/Office/Other
  addressLine: string;
  pincode: string;
  city: string;
  lat?: number | null;
  lng?: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};