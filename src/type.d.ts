type NonNullableField<T extends object> = {
  [P in keyof T]: NonNullable<T[P]>;
};

type RequiredNonNullable<T extends object> = Required<NonNullableField<T>>;

type OmitNullish<T> = {
  [P in keyof T as T[P] extends null | undefined ? never : P]: T[P];
};

type PickNullish<T> = {
  [P in keyof T as T[P] extends null | undefined ? P : never]: T[P];
};
