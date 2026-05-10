<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\BkashController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\CouponController;
use App\Http\Controllers\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Admin\ChatController as AdminChatController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\BannerController;
use App\Http\Controllers\Admin\ERPController;
use App\Http\Controllers\Admin\FraudController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OtpController;

// ── Public Routes ─────────────────────────────────────────────────
Route::post('/auth/register',  [AuthController::class, 'register']);
Route::post('/auth/login',     [AuthController::class, 'login']);
Route::post('/otp/send',       [OtpController::class, 'send']);
Route::post('/otp/verify',     [OtpController::class, 'verify']);
Route::get('/auth/{provider}/redirect',  [SocialAuthController::class, 'redirect']);
Route::get('/auth/{provider}/callback',  [SocialAuthController::class, 'callback']);

Route::get('/banners',            [BannerController::class, 'publicIndex']);
Route::get('/products',           [ProductController::class, 'index']);
Route::get('/products/featured',  [ProductController::class, 'featured']);
Route::get('/products/search',    [ProductController::class, 'search']);
Route::get('/products/{slug}',    [ProductController::class, 'show']);
Route::get('/categories',         [ProductController::class, 'categories']);
Route::post('/guest-order',       [OrderController::class, 'guestStore']);

// ── Auth-Protected (all logged-in users) ─────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout',          [AuthController::class, 'logout']);
    Route::get('/auth/profile',          [AuthController::class, 'profile']);
    Route::post('/auth/profile',         [AuthController::class, 'updateProfile']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Cart
    Route::get('/cart',               [CartController::class, 'index']);
    Route::post('/cart/add',          [CartController::class, 'add']);
    Route::put('/cart/items/{item}',  [CartController::class, 'update']);
    Route::delete('/cart/items/{item}', [CartController::class, 'remove']);
    Route::delete('/cart/clear',      [CartController::class, 'clear']);

    // Customer Orders & bKash
    Route::get('/orders',                    [OrderController::class, 'index']);
    Route::post('/orders',                   [OrderController::class, 'store']);
    Route::get('/orders/{order}',            [OrderController::class, 'show']);
    Route::post('/orders/validate-coupon',   [OrderController::class, 'validateCoupon']);
    Route::post('/bkash/initiate',           [BkashController::class, 'initiate']);
    Route::post('/bkash/verify',             [BkashController::class, 'verify']);
    Route::get('/bkash/transactions',        [BkashController::class, 'transactions']);

    // Wishlist, Reviews, Addresses, Chat
    Route::get('/wishlist',           [WishlistController::class, 'index']);
    Route::post('/wishlist/toggle',   [WishlistController::class, 'toggle']);
    Route::post('/reviews',           [ReviewController::class, 'store']);
    Route::post('/comments',          [ReviewController::class, 'storeComment']);
    Route::apiResource('/addresses',  AddressController::class);
    Route::get('/chat/room',          [ChatController::class, 'getOrCreateRoom']);
    Route::post('/chat/send',         [ChatController::class, 'sendMessage']);
    Route::post('/chat/ticket',       [ChatController::class, 'createTicket']);

    // Notifications
    Route::get('/notifications',                        [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count',           [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-all-read',         [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read',   [NotificationController::class, 'markRead']);
});

// ── Admin: Order Management (admin, super_admin, order_manager) ───
Route::middleware(['auth:sanctum', 'role:admin,super_admin,order_manager'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/dashboard',                          [DashboardController::class, 'stats']);
        Route::get('/orders',                             [AdminOrderController::class, 'index']);
        Route::get('/orders/{order}',                     [AdminOrderController::class, 'show']);
        Route::put('/orders/{order}/status',              [AdminOrderController::class, 'updateStatus']);
        Route::get('/orders/{order}/invoice',             [AdminOrderController::class, 'invoice']);
        Route::get('/customers',                          [CustomerController::class, 'index']);
        Route::get('/customers/{user}',                   [CustomerController::class, 'show']);
        Route::post('/customers/{user}/toggle-status',    [CustomerController::class, 'toggleStatus']);
        Route::get('/chat/inbox',                         [AdminChatController::class, 'inbox']);
        Route::get('/chat/user/{user}/room',              [AdminChatController::class, 'userRoom']);
        Route::get('/chat/rooms/{room}',                  [AdminChatController::class, 'roomMessages']);
        Route::post('/chat/rooms/{room}/reply',           [AdminChatController::class, 'reply']);
        Route::post('/chat/rooms/{room}/close',           [AdminChatController::class, 'closeRoom']);
        Route::post('/chat/rooms/{room}/reopen',          [AdminChatController::class, 'reopenRoom']);
        Route::get('/chat/canned-responses',              [AdminChatController::class, 'cannedResponses']);
        Route::post('/chat/canned-responses',             [AdminChatController::class, 'storeCannedResponse']);
    });

// ── Admin: Full Access (admin, super_admin) ───────────────────────
Route::middleware(['auth:sanctum', 'role:admin,super_admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/reports/export', [DashboardController::class, 'exportReport']);

        // Categories
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::post('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        // Products
        Route::get('/products',                        [AdminProductController::class, 'index']);
        Route::post('/products',                       [AdminProductController::class, 'store']);
        Route::put('/products/{product}',              [AdminProductController::class, 'update']);
        Route::delete('/products/{product}',           [AdminProductController::class, 'destroy']);
        Route::post('/products/{product}/restore',     [AdminProductController::class, 'restore']);
        Route::post('/products/{product}/variants',    [AdminProductController::class, 'addVariant']);
        Route::delete('/products/{product}/images/{image}', [AdminProductController::class, 'deleteImage']);

        // Coupons
        Route::apiResource('/coupons', CouponController::class);

        // Reviews & Comments moderation
        Route::get('/reviews',                         [AdminReviewController::class, 'index']);
        Route::put('/reviews/{review}/status',         [AdminReviewController::class, 'updateStatus']);
        Route::get('/comments',                        [AdminReviewController::class, 'comments']);
        Route::put('/comments/{comment}/status',       [AdminReviewController::class, 'updateCommentStatus']);

        // Banners
        Route::get('/banners',                         [BannerController::class, 'index']);
        Route::post('/banners',                        [BannerController::class, 'store']);
        Route::post('/banners/{banner}',               [BannerController::class, 'update']);
        Route::delete('/banners/{banner}',             [BannerController::class, 'destroy']);

        // Fraud Detection
        Route::get('/fraud',                        [FraudController::class, 'index']);
        Route::get('/fraud/stats',                  [FraudController::class, 'stats']);
        Route::post('/fraud/{fraudLog}/reviewed',   [FraudController::class, 'markReviewed']);

        // ERP
        Route::prefix('erp')->group(function () {
            Route::get('/stats',                                  [ERPController::class, 'stats']);
            Route::get('/inventory',                              [ERPController::class, 'inventoryOverview']);
            Route::post('/inventory/{product}/adjust',            [ERPController::class, 'adjustStock']);
            Route::get('/inventory/{product}/logs',               [ERPController::class, 'inventoryLogs']);
            Route::get('/suppliers',                              [ERPController::class, 'suppliers']);
            Route::post('/suppliers',                             [ERPController::class, 'storeSupplier']);
            Route::put('/suppliers/{supplier}',                   [ERPController::class, 'updateSupplier']);
            Route::delete('/suppliers/{supplier}',                [ERPController::class, 'deleteSupplier']);
            Route::get('/purchase-orders',                        [ERPController::class, 'purchaseOrders']);
            Route::post('/purchase-orders',                       [ERPController::class, 'storePurchaseOrder']);
            Route::put('/purchase-orders/{po}/status',            [ERPController::class, 'updatePOStatus']);
            Route::delete('/purchase-orders/{po}',                [ERPController::class, 'deletePO']);
        });
    });

// ── Admin: Super Admin Only (super_admin) ─────────────────────────
Route::middleware(['auth:sanctum', 'role:super_admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/settings',             [SettingController::class, 'index']);
        Route::post('/settings',            [SettingController::class, 'update']);
        Route::put('/customers/{user}/role', [CustomerController::class, 'updateRole']);
    });
