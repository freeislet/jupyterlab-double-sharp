type NonNullableField<T extends object> = {
  [P in keyof T]: NonNullable<T[P]>;
};

type RequiredNonNullable<T extends object> = Required<NonNullableField<T>>;

type OmitNullish<T> = {
  [P in keyof T as T[P] extends {} ? P : never]: T[P];
};

type PickNullish<T> = {
  [P in keyof T as T[P] extends {} ? never : P]: T[P];
};

type PartialPick<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type PartialExcept<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

type RequiredPick<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
type RequiredExcept<T, K extends keyof T> = Pick<T, K> & Required<Omit<T, K>>;
