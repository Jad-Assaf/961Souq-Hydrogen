export function getCollectionImage(collection) {
  const directImage = collection?.image;
  if (directImage?.url || directImage?.src) {
    return {
      ...directImage,
      url: directImage.url || directImage.src,
      altText: directImage.altText || collection?.title || '',
    };
  }

  const firstProduct = collection?.products?.nodes?.[0];
  const productImage =
    firstProduct?.featuredImage ||
    firstProduct?.image ||
    firstProduct?.images?.nodes?.[0] ||
    firstProduct?.variants?.nodes?.find((variant) => variant?.image)?.image;

  if (productImage?.url || productImage?.src) {
    return {
      ...productImage,
      url: productImage.url || productImage.src,
      altText:
        productImage.altText || firstProduct?.title || collection?.title || '',
    };
  }

  return null;
}

export function withCollectionFallbackImage(collection) {
  if (!collection) return collection;

  return {
    ...collection,
    image: getCollectionImage(collection),
  };
}
