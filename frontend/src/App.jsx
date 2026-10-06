import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { RestaurantProvider } from './context/RestaurantContext';
import { CustomerSessionProvider } from './context/CustomerSessionContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { AdminAuthProvider } from './admin/context/AdminAuthContext';
import { AdminDataProvider } from './admin/context/AdminDataContext';
import { SuperAdminAuthProvider } from './superadmin/context/SuperAdminAuthContext';
import { SuperAdminDataProvider } from './superadmin/context/SuperAdminDataContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <SuperAdminAuthProvider>
        <SuperAdminDataProvider>
          <AdminAuthProvider>
            <AdminDataProvider>
              <RestaurantProvider>
                <CustomerSessionProvider>
                  <CartProvider>
                    <OrderProvider>
                      <AppRoutes />
                    </OrderProvider>
                  </CartProvider>
                </CustomerSessionProvider>
              </RestaurantProvider>
            </AdminDataProvider>
          </AdminAuthProvider>
        </SuperAdminDataProvider>
      </SuperAdminAuthProvider>
    </BrowserRouter>
  );
}
