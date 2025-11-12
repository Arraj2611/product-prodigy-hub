import { apiClient } from './client.js';

export interface Product {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'PROCESSING' | 'BOM_GENERATED' | 'SOURCING' | 'READY' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export const productApi = {
  createProduct: async (data: { name: string; description?: string }) => {
    return apiClient.post<{
      success: boolean;
      data: { product: Product };
    }>('/products', data);
  },

  getProducts: async () => {
    return apiClient.get<{
      success: boolean;
      data: { products: Product[] };
    }>('/products');
  },

  getProduct: async (productId: string) => {
    return apiClient.get<{
      success: boolean;
      data: { product: Product };
    }>(`/products/${productId}`);
  },

  updateProduct: async (productId: string, data: Partial<Product>) => {
    return apiClient.patch<{
      success: boolean;
      data: { product: Product };
    }>(`/products/${productId}`, data);
  },

  deleteProduct: async (productId: string) => {
    return apiClient.delete<{ success: boolean }>(`/products/${productId}`);
  },
};

