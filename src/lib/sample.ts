

export async function sample<T>(random: () => Promise<number>, items: T[]): Promise<T> {
  // const z = ()
  const randomIndex = Math.floor(await random() * items.length);
  // console.log({
  //   // z,
  //   randomIndex,
  //   item: items[randomIndex]
  // })
  return items[randomIndex];
}
