import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { OrderLayout } from '../layouts/OrderLayout';
import { RequireSessionGuard, RequireCartGuard, RequireOrderGuard } from './RouteGuards';
import { Loader2 } from 'lucide-react';

// Customer Pages (Lazy Loaded)
const RestaurantWelcomePage = lazy(() => import('../pages/RestaurantWelcomePage').then(m => ({ default: m.RestaurantWelcomePage })));
const CustomerDetailsPage = lazy(() => import('../pages/CustomerDetailsPage').then(m => ({ default: m.CustomerDetailsPage })));
const MenuPage = lazy(() => import('../pages/MenuPage').then(m => ({ default: m.MenuPage })));
const FoodDetailsPage = lazy(() => import('../pages/FoodDetailsPage').then(m => ({ default: m.FoodDetailsPage })));
const CartPage = lazy(() => import('../pages/CartPage').then(m => ({ default: m.CartPage })));
const OrderReviewPage = lazy(() => import('../pages/OrderReviewPage').then(m => ({ default: m.OrderReviewPage })));
const OrderConfirmationPage = lazy(() => import('../pages/OrderConfirmationPage').then(m => ({ default: m.OrderConfirmationPage })));
const PaymentPage = lazy(() => import('../pages/PaymentPage').then(m => ({ default: m.PaymentPage })));
const OrderStatusPage = lazy(() => import('../pages/OrderStatusPage').then(m => ({ default: m.OrderStatusPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Admin Architecture Components & Guards
import { ProtectedRoute, PermissionGuard, AdminLayout } from '../admin/components';

// Admin Pages (Lazy Loaded)
const AdminLoginPage = lazy(() => import('../admin/pages').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('../admin/pages').then(m => ({ default: m.AdminDashboardPage })));
const AdminOrdersPage = lazy(() => import('../admin/pages').then(m => ({ default: m.AdminOrdersPage })));
const AdminTablesPage = lazy(() => import('../admin/pages').then(m => ({ default: m.AdminTablesPage })));
const AdminMenuPage = lazy(() => import('../admin/pages').then(m => ({ default: m.AdminMenuPage })));
const AdminCustomersPage = lazy(() => import('../admin/pages').then(m => ({ default: m.AdminCustomersPage })));
const AdminNotificationsPage = lazy(() => import('../admin/pages').then(m => ({ default: m.AdminNotificationsPage })));
const AdminStaffPage = lazy(() => import('../admin/pages').then(m => ({ default: m.AdminStaffPage })));
const AdminPaymentsPage = lazy(() => import('../admin/pages').then(m => ({ default: m.AdminPaymentsPage })));
const AdminReportsPage = lazy(() => import('../admin/pages').then(m => ({ default: m.AdminReportsPage })));
const AdminSettingsPage = lazy(() => import('../admin/pages').then(m => ({ default: m.AdminSettingsPage })));

// Platform SuperAdmin Components & Pages
import { SuperAdminProtectedRoute, SuperAdminLayout } from '../superadmin/components';
const SuperAdminLoginPage = lazy(() => import('../superadmin/pages').then(m => ({ default: m.SuperAdminLoginPage })));
const SuperAdminDashboardPage = lazy(() => import('../superadmin/pages').then(m => ({ default: m.SuperAdminDashboardPage })));
const SuperAdminRestaurantsPage = lazy(() => import('../superadmin/pages').then(m => ({ default: m.SuperAdminRestaurantsPage })));
const SuperAdminPlansPage = lazy(() => import('../superadmin/pages').then(m => ({ default: m.SuperAdminPlansPage })));
const SuperAdminSubscriptionsPage = lazy(() => import('../superadmin/pages').then(m => ({ default: m.SuperAdminSubscriptionsPage })));
const SuperAdminInvoicesPage = lazy(() => import('../superadmin/pages').then(m => ({ default: m.SuperAdminInvoicesPage })));
const SuperAdminAnalyticsPage = lazy(() => import('../superadmin/pages').then(m => ({ default: m.SuperAdminAnalyticsPage })));
const SuperAdminSettingsPage = lazy(() => import('../superadmin/pages').then(m => ({ default: m.SuperAdminSettingsPage })));

// Suspense Loader Fallback
const PageFallback = () => (
  <div className="w-full h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
    <span className="text-xs font-semibold">Loading Page...</span>
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageFallback />}>

    <Routes>
      {/* Root redirect to default restaurant QR */}
      <Route path="/" element={<Navigate to="/menu/spice-garden" replace />} />

      {/* ========================================================= */}
      {/* CUSTOMER ROUTES (MOBILE-FIRST DINING JOURNEY)              */}
      {/* ========================================================= */}

      {/* Scanned QR Welcome Landing */}
      <Route path="/menu/:restaurantSlug" element={<RestaurantWelcomePage />} />

      {/* Customer Guest Form */}
      <Route path="/menu/:restaurantSlug/customer" element={<CustomerDetailsPage />} />

      {/* Menu & Browsing Pages (Under CustomerLayout) */}
      <Route element={<CustomerLayout />}>
        <Route
          path="/menu/:restaurantSlug/home"
          element={
            <RequireSessionGuard>
              <MenuPage />
            </RequireSessionGuard>
          }
        />
      </Route>

      {/* Standalone Food Details View */}
      <Route
        path="/menu/:restaurantSlug/item/:itemId"
        element={
          <RequireSessionGuard>
            <FoodDetailsPage />
          </RequireSessionGuard>
        }
      />

      {/* Checkout, Review & Status Pages (Under OrderLayout) */}
      <Route element={<OrderLayout />}>
        <Route
          path="/menu/:restaurantSlug/cart"
          element={
            <RequireSessionGuard>
              <CartPage />
            </RequireSessionGuard>
          }
        />

        <Route
          path="/menu/:restaurantSlug/review"
          element={
            <RequireSessionGuard>
              <RequireCartGuard>
                <OrderReviewPage />
              </RequireCartGuard>
            </RequireSessionGuard>
          }
        />

        <Route
          path="/menu/:restaurantSlug/order-success"
          element={
            <RequireOrderGuard>
              <OrderConfirmationPage />
            </RequireOrderGuard>
          }
        />

        <Route
          path="/menu/:restaurantSlug/payment"
          element={
            <RequireOrderGuard>
              <PaymentPage />
            </RequireOrderGuard>
          }
        />

        <Route
          path="/menu/:restaurantSlug/order-status"
          element={
            <RequireOrderGuard>
              <OrderStatusPage />
            </RequireOrderGuard>
          }
        />
      </Route>

      {/* ========================================================= */}
      {/* RESTAURANT ADMIN (INDIVIDUAL RESTAURANT DAILY OPERATIONS)  */}
      {/* ========================================================= */}

      {/* Public Restaurant Admin Login Screen */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Protected Restaurant Admin Suite */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            path="/admin"
            element={
              <PermissionGuard module="dashboard">
                <AdminDashboardPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <PermissionGuard module="orders">
                <AdminOrdersPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/admin/tables"
            element={
              <PermissionGuard module="tables">
                <AdminTablesPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/admin/menu"
            element={
              <PermissionGuard module="menu">
                <AdminMenuPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <PermissionGuard module="customers">
                <AdminCustomersPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <PermissionGuard module="notifications">
                <AdminNotificationsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <PermissionGuard module="staff">
                <AdminStaffPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <PermissionGuard module="payments">
                <AdminPaymentsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <PermissionGuard module="reports">
                <AdminReportsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <PermissionGuard module="settings">
                <AdminSettingsPage />
              </PermissionGuard>
            }
          />
        </Route>
      </Route>

      {/* ========================================================= */}
      {/* PLATFORM SUPERADMIN (SAAS OWNER & PACKAGING DASHBOARD)    */}
      {/* ========================================================= */}

      {/* SuperAdmin Login Screen */}
      <Route path="/superadmin/login" element={<SuperAdminLoginPage />} />

      {/* Protected SuperAdmin Suite with Executive SaaS Layout */}
      <Route element={<SuperAdminProtectedRoute />}>
        <Route element={<SuperAdminLayout />}>
          <Route path="/superadmin" element={<SuperAdminDashboardPage />} />
          <Route path="/superadmin/restaurants" element={<SuperAdminRestaurantsPage />} />
          <Route path="/superadmin/plans" element={<SuperAdminPlansPage />} />
          <Route path="/superadmin/subscriptions" element={<SuperAdminSubscriptionsPage />} />
          <Route path="/superadmin/invoices" element={<SuperAdminInvoicesPage />} />
          <Route path="/superadmin/analytics" element={<SuperAdminAnalyticsPage />} />
          <Route path="/superadmin/settings" element={<SuperAdminSettingsPage />} />
        </Route>
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
};

