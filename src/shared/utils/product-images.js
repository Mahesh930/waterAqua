export const productImagePaths = {
  bottle1L: "/product-images/bottle-1l.png",
  can20L: "/product-images/can-20l.png",
  jar15L: "/product-images/jar-15l.png",
  tanker5K10K: "/product-images/tanker-5k-10k.png",
};

export function getDefaultProductImage(product) {
  if (!product) return productImagePaths.can20L;
  const category = (product.category || "").toLowerCase();
  const sizeLiters = Number(product.capacityLiters ?? product.capacity_liters ?? product.size_liters ?? 0);

  if (category === "jar") return productImagePaths.jar15L;
  if (category === "can" || category === "water can") return productImagePaths.can20L;
  if (category === "bottle" || category === "water bottle") return productImagePaths.bottle1L;
  if (category === "tanker" || category === "dispenser") return productImagePaths.tanker5K10K;

  if (sizeLiters === 15) return productImagePaths.jar15L;
  if (sizeLiters === 20) return productImagePaths.can20L;
  if (sizeLiters === 1) return productImagePaths.bottle1L;
  if (sizeLiters >= 5000) return productImagePaths.tanker5K10K;

  return productImagePaths.can20L;
}

export function getProductImageUrl(product) {
  if (!product) return productImagePaths.can20L;
  return product.imageUrl || product.image_url || getDefaultProductImage(product);
}
