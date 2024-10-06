import * as R from "ramda";

export function randomFromArray<T>(arr: T[]): T {
  return R.nth(Math.floor(Math.random() * arr.length), arr)!;
}
