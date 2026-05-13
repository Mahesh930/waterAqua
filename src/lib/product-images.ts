type ProductImageInput = {
  category?: string | null;
  size_liters?: number | string | null;
  image_url?: string | null;
};

export const productImagePaths = {
  bottle1L: "/product-images/bottle-1l.png",
  can20L: "/product-images/can-20l.png",
  jar15L: "/product-images/jar-15l.png",
  tanker5K10K: "/product-images/tanker-5k-10k.png",
} as const;

export function getDefaultProductImage(product: ProductImageInput) {
  const category = product.category?.toLowerCase();
  const sizeLiters = Number(product.size_liters ?? 0);

  if (category === "jar") return productImagePaths.jar15L;
  if (category === "can") return productImagePaths.can20L;
  if (category === "bottle") return productImagePaths.bottle1L;
  if (category === "tanker") return productImagePaths.tanker5K10K;

  if (sizeLiters === 15) return productImagePaths.jar15L;
  if (sizeLiters === 20) return productImagePaths.can20L;
  if (sizeLiters === 1) return productImagePaths.bottle1L;
  if (sizeLiters >= 5000) return productImagePaths.tanker5K10K;

  return productImagePaths.can20L;
}

export function getProductImageUrl(product: ProductImageInput) {
  return product.image_url || getDefaultProductImage(product);
}
