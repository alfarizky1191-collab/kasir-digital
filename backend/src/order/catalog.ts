export const PRODUCT_CATALOG = [
  { name: 'Batagor', price: 5000 },
  { name: 'Mie Level', price: 8000 },
  { name: 'Cilok', price: 5000 },
  { name: 'Es Potong Milo (full)', price: 4000 },
  { name: 'Es Potong Milo (half)', price: 2000 },
  { name: 'Es Potong Real good (full)', price: 2000 },
  { name: 'Es Potong Real good (1/2)', price: 1000 },
  { name: 'Suki Bakar', price: 5000 },
  { name: 'Sosis Bakar', price: 5000 },
  { name: 'Jasuke', price: 5000 },
] as const

export function getCatalogPrice(displayName: string) {
  const product = [...PRODUCT_CATALOG]
    .sort((a, b) => b.name.length - a.name.length)
    .find(({ name }) => displayName === name || displayName.startsWith(`${name} `))

  return product?.price
}
