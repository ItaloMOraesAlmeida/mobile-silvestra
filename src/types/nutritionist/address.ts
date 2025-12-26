export interface NutritionistAddress {
  id: string;
  nutritionistId: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isPrimary: boolean;
  isServiceLocation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNutritionistAddressDto {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isPrimary?: boolean;
  isServiceLocation?: boolean;
}

export type UpdateNutritionistAddressDto =
  Partial<CreateNutritionistAddressDto>;
