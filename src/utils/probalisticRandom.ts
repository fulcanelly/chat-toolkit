
export function probabilisticRandomPercentageArray<T>(randomNum: number, items: { probability: number; value: T }[]): T {
  if (items.length === 0) {
    throw new Error("Items cannot be empty");
  }

  const total = items.reduce((acc, item) => acc + item.probability, 0);

  if (total !== 100) {
    throw new Error("Total probability does not sum up to 100%.");
  }

  let random = randomNum * 100;
  let sum = 0;

  for (const item of items) {
    sum += item.probability;
    if (random < sum) {
      return item.value;
    }
  }

  // Fallback to the first item if no match is found
  return items[0].value;
}


export function probabilisticRandomFractionArray<T>(randomNum: number, items: { probability: number; value: T }[]): T {
  if (items.length === 0) {
    throw new Error("Items cannot be empty");
  }

  const total = items.reduce((acc, item) => acc + item.probability, 0);

  if (total.toFixed(2) !== '1.00') {
    throw new Error("Total probability does not sum up to 1");
  }

  let random = randomNum;
  let sum = 0;

  for (const item of items) {
    sum += item.probability;
    if (random < sum) {
      return item.value;
    }
  }

  // Fallback to the first item if no match is found
  return items[0].value;
}
