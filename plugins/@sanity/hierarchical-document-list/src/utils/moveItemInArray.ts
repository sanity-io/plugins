export default function moveItemInArray<ItemType = unknown>({
  array,
  fromIndex,
  toIndex,
}: {
  array: ItemType[]
  fromIndex: number
  toIndex: number
}): ItemType[] {
  if (fromIndex === toIndex) {
    return array
  }

  const newArray = [...array]
  const [target] = newArray.splice(fromIndex, 1)

  if (target === undefined) {
    return array
  }

  newArray.splice(toIndex, 0, target)

  return newArray
}
