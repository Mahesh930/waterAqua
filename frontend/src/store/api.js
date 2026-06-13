import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

let rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
if (rawBaseUrl && !rawBaseUrl.includes('/api/v1')) {
  rawBaseUrl = rawBaseUrl.replace(/\/$/, '') + '/api/v1';
}
const baseUrl = rawBaseUrl;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      // Pull token from Redux auth slice or localStorage
      const token = getState().auth.token || localStorage.getItem('aquahome_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
    credentials: 'include',
  }),
  tagTypes: ['User', 'Product', 'Order', 'Cart', 'Supplier', 'Notification', 'Feedback', 'Admin'],
  endpoints: (builder) => ({
    // AUTH ENPOINTS
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['User'],
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['User'],
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      transformResponse: (response) => response.data,
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: profileData,
      }),
      transformResponse: (response) => response.data.user,
      invalidatesTags: ['User'],
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
      transformResponse: (response) => response.data || response,
    }),
    resetPassword: builder.mutation({
      query: ({ token, password }) => ({
        url: `/auth/reset-password/${token}`,
        method: 'POST',
        body: { password },
      }),
      transformResponse: (response) => response.data || response,
    }),

    // SUPPLIER ENDPOINTS
    getSuppliers: builder.query({
      query: (params) => ({
        url: '/suppliers',
        params: params || undefined,
      }),
      transformResponse: (response) => response.data?.results || response.data,
      providesTags: ['Supplier'],
    }),
    getSupplierById: builder.query({
      query: (id) => `/suppliers/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Supplier', id }],
    }),
    getMySupplier: builder.query({
      query: () => '/suppliers/me',
      transformResponse: (response) => response.data,
      providesTags: [{ type: 'Supplier', id: 'ME' }],
    }),
    updateSupplier: builder.mutation({
      query: (body) => ({
        url: '/suppliers/me',
        method: 'PUT',
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Supplier'],
    }),
    getSupplierFeedback: builder.query({
      query: (id) => `/suppliers/${id}/feedback`,
      transformResponse: (response) => response.data?.results || response.data,
      providesTags: ['Feedback'],
    }),
    submitFeedback: builder.mutation({
      query: ({ orderId, rating, comment }) => ({
        url: `/orders/${orderId}/feedback`,
        method: 'POST',
        body: { rating, comment },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Order', 'Feedback', 'Supplier'],
    }),

    // PRODUCT ENDPOINTS
    getProducts: builder.query({
      query: (params) => {
        const cleanParams = {};
        if (params) {
          Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== 'undefined' && params[key] !== 'null') {
              cleanParams[key] = params[key];
            }
          });
        }
        return {
          url: '/products',
          params: cleanParams,
        };
      },
      transformResponse: (response) => response.data?.results || response.data,
      providesTags: ['Product'],
    }),
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    uploadProductImage: builder.mutation({
      query: (formData) => ({
        url: '/products/upload',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response) => response.data,
    }),
    createProduct: builder.mutation({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Product'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Product'],
    }),

    // CART ENDPOINTS
    getCart: builder.query({
      query: () => '/cart',
      transformResponse: (response) => response.data,
      providesTags: ['Cart'],
    }),
    addToCart: builder.mutation({
      query: (body) => ({
        url: '/cart/items',
        method: 'POST',
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: builder.mutation({
      query: ({ id, quantity }) => ({
        url: `/cart/items/${id}`,
        method: 'PATCH',
        body: { quantity },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Cart'],
    }),
    removeCartItem: builder.mutation({
      query: (id) => ({
        url: `/cart/items/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Cart'],
    }),
    clearCart: builder.mutation({
      query: () => ({
        url: '/cart/clear',
        method: 'DELETE',
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Cart'],
    }),

    // ORDER ENDPOINTS
    getOrders: builder.query({
      query: () => '/orders',
      transformResponse: (response) => response.data?.results || response.data,
      providesTags: ['Order'],
    }),
    getOrderById: builder.query({
      query: (id) => `/orders/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    createOrder: builder.mutation({
      query: (body) => ({
        url: '/orders',
        method: 'POST',
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Order', 'Cart'],
    }),
    verifyRazorpayPayment: builder.mutation({
      query: (body) => ({
        url: '/orders/verify-payment',
        method: 'POST',
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Order', 'Cart'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Order'],
    }),
    cancelOrder: builder.mutation({
      query: (id) => ({
        url: `/orders/${id}/cancel`,
        method: 'PATCH',
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Order', 'Product'],
    }),
    verifyOtp: builder.mutation({
      query: ({ id, otp }) => ({
        url: `/orders/${id}/verify-otp`,
        method: 'POST',
        body: { otp },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Order'],
    }),

    // NOTIFICATION ENDPOINTS
    getNotifications: builder.query({
      query: () => '/notifications',
      transformResponse: (response) => response.data?.results || response.data,
      providesTags: ['Notification'],
    }),
    markNotificationsRead: builder.mutation({
      query: () => ({
        url: '/notifications/mark-read',
        method: 'PATCH',
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Notification'],
    }),

    // ADMIN ENDPOINTS
    getAdminOverview: builder.query({
      query: () => '/admin/overview',
      transformResponse: (response) => response.data,
      providesTags: ['Admin'],
    }),
    getAdminUsers: builder.query({
      query: (params) => ({
        url: '/admin/users',
        params: params || undefined,
      }),
      transformResponse: (response) => response.data?.results || response.data,
      providesTags: ['User'],
    }),
    getAdminSuppliers: builder.query({
      query: () => '/admin/suppliers',
      transformResponse: (response) => response.data?.results || response.data,
      providesTags: ['Supplier'],
    }),
    getAdminCommissions: builder.query({
      query: () => '/admin/commissions',
      transformResponse: (response) => response.data?.results || response.data,
      providesTags: ['Admin'],
    }),
    getAdminLogs: builder.query({
      query: (params) => ({
        url: '/admin/logs',
        params: params || undefined,
      }),
      transformResponse: (response) => response.data?.results || response.data,
      providesTags: ['Admin'],
    }),
    toggleUserStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/users/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['User', 'Admin'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useGetMySupplierQuery,
  useUpdateSupplierMutation,
  useGetSupplierFeedbackQuery,
  useSubmitFeedbackMutation,
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUploadProductImageMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useVerifyRazorpayPaymentMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useVerifyOtpMutation,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useGetAdminOverviewQuery,
  useGetAdminUsersQuery,
  useGetAdminSuppliersQuery,
  useGetAdminCommissionsQuery,
  useGetAdminLogsQuery,
  useToggleUserStatusMutation,
} = api;
