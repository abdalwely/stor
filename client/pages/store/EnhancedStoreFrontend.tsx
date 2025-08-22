import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  storeService, 
  productService, 
  categoryService, 
  Store, 
  Product, 
  Category 
} from '@/lib/firestore';
import { StoreCustomerProvider, useStoreCustomer } from '@/contexts/StoreCustomerContext';
import { CustomerLoginModal } from '@/components/CustomerLoginModal';
import CheckoutPage from './CheckoutPage';
import OrderTrackingPage from './OrderTrackingPage';
import { 
  Search,
  ShoppingCart,
  Heart,
  Star,
  Package,
  Home,
  ShoppingBag,
  Menu,
  X,
  User,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  Filter,
  Grid3X3,
  List,
  Truck,
  Shield,
  RotateCcw,
  Award,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Share2,
  Eye,
  Compare,
  Gift,
  Clock,
  CheckCircle,
  Zap,
  TrendingUp,
  Users,
  MessageCircle,
  Globe,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CreditCard,
  Banknote,
  Building2
} from 'lucide-react';

// Types
interface CartItem {
  productId: string;
  quantity: number;
  variant?: string;
}

interface FilterOptions {
  category: string;
  priceRange: [number, number];
  rating: number;
  sortBy: string;
  inStock: boolean;
}

// Enhanced Storefront Component
function EnhancedStorefront() {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoggedIn, customer } = useStoreCustomer();
  
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    priceRange: [0, 10000],
    rating: 0,
    sortBy: 'newest',
    inStock: false
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPendingAction, setLoginPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    loadStoreData();
  }, [subdomain]);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Searching for store with subdomain:', subdomain);

      if (!subdomain) {
        setError('رابط المتجر غير صحيح');
        return;
      }

      // البحث عن المتجر باستخدام Firestore
      let foundStore = await storeService.getBySubdomain(subdomain);
      
      if (!foundStore) {
        console.error('❌ Store not found! Looking for subdomain:', subdomain);
        setError('المتجر غير موجود أو غير نشط');
        return;
      }

      console.log('✅ Found store:', foundStore.name);
      setStore(foundStore);

      // تحميل المنتجات والتصنيفات من Firestore
      const [storeProducts, storeCategories] = await Promise.all([
        productService.getByStore(foundStore.id),
        categoryService.getByStore(foundStore.id)
      ]);

      setProducts(storeProducts);
      setCategories(storeCategories);

      console.log('✅ Enhanced Storefront loaded:', {
        store: foundStore.name,
        subdomain: foundStore.subdomain,
        products: storeProducts.length,
        categories: storeCategories.length,
        customization: foundStore.customization,
        primaryColor: foundStore.customization?.colors?.primary || 'غير محدد'
      });
      
    } catch (error) {
      console.error('❌ Error loading store data:', error);
      setError('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const requireLogin = (action: () => void) => {
    if (!isLoggedIn) {
      setLoginPendingAction(() => action);
      setShowLoginModal(true);
      return;
    }
    action();
  };

  const addToCart = (productId: string, quantity: number = 1) => {
    requireLogin(() => {
      setCart(prev => {
        const existingItem = prev.find(item => item.productId === productId);
        
        if (existingItem) {
          return prev.map(item =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          return [...prev, { productId, quantity }];
        }
      });

      toast({
        title: 'تم إضافة المنتج للسلة',
        description: 'يمكنك مراجعة سلة التسوق الآن',
        variant: 'default'
      });
    });
  };

  const toggleWishlist = (productId: string) => {
    requireLogin(() => {
      setWishlist(prev => {
        const isInWishlist = prev.includes(productId);
        const newWishlist = isInWishlist 
          ? prev.filter(id => id !== productId)
          : [...prev, productId];

        toast({
          title: isInWishlist ? 'تم إزالة المنتج من المفضلة' : 'تم إضافة المنتج للمفضلة',
          description: isInWishlist ? '' : 'يمكنك مراجعة قائمة المفضلة'
        });

        return newWishlist;
      });
    });
  };

  const getFilteredProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Price range filter
    filtered = filtered.filter(product =>
      product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
    );

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(product => (product as any).rating >= filters.rating);
    }

    // Stock filter
    if (filters.inStock) {
      filtered = filtered.filter(product => product.inventory.quantity > 0);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => ((b as any).rating || 0) - ((a as any).rating || 0));
        break;
      case 'popularity':
        filtered.sort((a, b) => ((b as any).reviewCount || 0) - ((a as any).reviewCount || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered.filter(p => p.status === 'active');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">جاري تحميل المتجر...</h3>
          <p className="text-gray-600">يرجى الانتظار بينما نحضر لك أفضل تجربة تسوق</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">المتجر غير موجود</h1>
          <p className="text-gray-600 mb-6">
            عذراً، المتجر الذي تبحث عنه غير موجود أو غير نشط حالياً
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/')} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              العودة للصفحة الرئيسية
            </Button>
            <p className="text-sm text-gray-500">
              رابط المتجر: <code className="bg-gray-100 px-2 py-1 rounded">{subdomain}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // عرض رسالة الخطأ
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">خطأ في التحميل</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              loadStoreData();
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  // Generate CSS variables for store customization
  const storeStyleVars = store ? {
    '--store-primary': store.customization.colors.primary,
    '--store-secondary': store.customization.colors.secondary,
    '--store-background': store.customization.colors.background,
    '--store-text': store.customization.colors.text,
    '--store-accent': store.customization.colors.accent || store.customization.colors.primary,
    '--store-header-bg': store.customization.colors.headerBackground || store.customization.colors.background,
    '--store-border': store.customization.colors.border || '#e2e8f0',
    '--store-muted': store.customization.colors.muted || '#f8fafc',
    '--store-font-primary': store.customization.fonts.primary || 'Cairo',
    '--store-font-secondary': store.customization.fonts.secondary || 'Inter'
  } as React.CSSProperties : {};

  const containerClass = store?.customization?.layout?.containerWidth === 'wide' ? 'max-w-7xl' : 'max-w-6xl';

  return (
    <div 
      className="min-h-screen bg-background text-foreground" 
      dir="rtl"
      style={storeStyleVars}
    >
      {/* Enhanced Header */}
      <Header 
        store={store}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cart={cart}
        wishlist={wishlist}
        categories={categories}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setSelectedProduct={setSelectedProduct}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        customer={customer}
        isLoggedIn={isLoggedIn}
        onLoginClick={() => setShowLoginModal(true)}
      />

      {/* Main Content */}
      <main className={`${containerClass} mx-auto px-4 py-8`}>
        {currentPage === 'home' && !selectedProduct && (
          <Homepage
            store={store}
            products={products}
            categories={categories}
            onCategorySelect={setSelectedCategory}
            onProductSelect={setSelectedProduct}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            wishlist={wishlist}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === 'products' && !selectedProduct && (
          <ProductsPage
            products={getFilteredProducts()}
            categories={categories}
            filters={filters}
            setFilters={setFilters}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            onProductSelect={setSelectedProduct}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            wishlist={wishlist}
            store={store}
          />
        )}

        {selectedProduct && (
          <ProductPage
            product={selectedProduct}
            store={store}
            onBack={() => setSelectedProduct(null)}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            isInWishlist={wishlist.includes(selectedProduct.id)}
            relatedProducts={products.filter(p => 
              p.category === selectedProduct.category && 
              p.id !== selectedProduct.id
            ).slice(0, 4)}
          />
        )}

        {currentPage === 'cart' && (
          <CartPage
            cart={cart}
            products={products}
            store={store}
            onUpdateQuantity={(productId, quantity) => {
              if (quantity <= 0) {
                setCart(prev => prev.filter(item => item.productId !== productId));
                return;
              }
              setCart(prev => prev.map(item =>
                item.productId === productId ? { ...item, quantity } : item
              ));
            }}
            onProceedToCheckout={() => setCurrentPage('checkout')}
            isLoggedIn={isLoggedIn}
            onLoginRequired={() => setShowLoginModal(true)}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            cart={cart}
            products={products}
            store={store}
            onOrderComplete={(orderId) => {
              setCompletedOrderId(orderId);
              setCart([]); // Clear cart
              setCurrentPage('order-success');
            }}
            onBack={() => setCurrentPage('cart')}
          />
        )}

        {currentPage === 'order-success' && completedOrderId && (
          <OrderSuccessPage
            orderId={completedOrderId}
            store={store}
            onContinueShopping={() => setCurrentPage('home')}
            onTrackOrder={() => setCurrentPage('order-tracking')}
          />
        )}

        {currentPage === 'order-tracking' && (
          <OrderTrackingPage
            store={store}
            onBack={() => setCurrentPage('home')}
          />
        )}

        {currentPage === 'wishlist' && (
          <WishlistPage
            products={products.filter(p => wishlist.includes(p.id))}
            onProductSelect={setSelectedProduct}
            onAddToCart={addToCart}
            onRemoveFromWishlist={toggleWishlist}
            store={store}
          />
        )}
      </main>

      {/* Enhanced Footer */}
      <Footer store={store} />

      {/* Customer Login Modal */}
      {store && (
        <CustomerLoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            setLoginPendingAction(null);
          }}
          storeId={store.id}
          storeName={store.name}
          onLoginSuccess={() => {
            if (loginPendingAction) {
              loginPendingAction();
              setLoginPendingAction(null);
            }
          }}
        />
      )}
    </div>
  );
}

// Enhanced Header Component
const Header = ({ store, searchQuery, setSearchQuery, cart, wishlist, categories, currentPage, setCurrentPage, setSelectedProduct, mobileMenuOpen, setMobileMenuOpen, customer, isLoggedIn, onLoginClick }: any) => {
  const customization = store?.customization;
  const headerStyle = customization?.header || {};
  
  return (
    <header
      className={`shadow-sm border-b ${headerStyle.sticky ? 'sticky top-0 z-50' : ''} ${customization?.effects?.shadows ? 'shadow-lg' : 'shadow-sm'}`}
      style={{
        backgroundColor: headerStyle.backgroundColor || customization?.colors?.headerBackground || customization?.colors?.background || '#ffffff',
        borderColor: customization?.colors?.border || '#e5e7eb'
      }}
    >
      {/* Top Bar */}
      {headerStyle.topBar?.enabled && (
        <div 
          className="hidden md:flex items-center justify-between py-2 px-4 text-sm border-b"
          style={{ 
            backgroundColor: headerStyle.topBar.backgroundColor || '#f8fafc',
            color: headerStyle.topBar.textColor || '#64748b',
            borderColor: customization?.colors?.border || '#e5e7eb'
          }}
        >
          <div className="flex items-center gap-6">
            {headerStyle.topBar.showDeliveryInfo && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span>شحن مجاني للطلبات فوق {store.settings?.shipping?.freeShippingThreshold || 200} ر.س</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>ضمان الجودة</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              <span>إرجاع مجاني خلال 14 يوم</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {headerStyle.topBar.showPhone && store.contact?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{store.contact.phone}</span>
              </div>
            )}
            {headerStyle.topBar.showEmail && store.contact?.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{store.contact.email}</span>
              </div>
            )}
            {headerStyle.topBar.showSocial && (
              <div className="flex items-center gap-2">
                {customization?.social?.facebook && (
                  <a href={customization.social.facebook} target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-4 w-4 hover:opacity-75" />
                  </a>
                )}
                {customization?.social?.twitter && (
                  <a href={customization.social.twitter} target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4 hover:opacity-75" />
                  </a>
                )}
                {customization?.social?.instagram && (
                  <a href={customization.social.instagram} target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4 hover:opacity-75" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        {/* Main Header */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div 
            onClick={() => {
              setCurrentPage('home');
              setSelectedProduct(null);
            }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl ${customization?.effects?.shadows ? 'shadow-lg' : ''}`}
              style={{
                backgroundColor: customization?.colors?.primary || '#2563eb',
                backgroundImage: customization?.effects?.gradients ? `linear-gradient(135deg, ${customization?.colors?.primary || '#2563eb'}, ${customization?.colors?.accent || '#3b82f6'})` : undefined
              }}
            >
              {store.name?.charAt(0) || 'م'}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: customization?.colors?.text || '#1e293b' }}>
                {store.name}
              </h1>
              {store.description && (
                <p className="text-sm opacity-75">{store.description}</p>
              )}
            </div>
          </div>

          {/* Search Bar */}
          {headerStyle.showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="ابحث عن المنتجات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 pl-4 rounded-full border-2 focus:border-primary transition-colors"
                  style={{ borderColor: customization?.colors?.border || '#e5e7eb' }}
                />
              </div>
            </div>
          )}

          {/* Header Actions */}
          <div className="flex items-center gap-4">
            {/* Wishlist */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage('wishlist')}
              className="relative"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                  {wishlist.length}
                </Badge>
              )}
            </Button>

            {/* Cart */}
            {headerStyle.showCart && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage('cart')}
                className="relative"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    style={{ backgroundColor: customization?.colors?.primary || '#2563eb' }}>
                    {cart.reduce((total: number, item: any) => total + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            )}

            {/* Account */}
            {headerStyle.showAccount && (
              <Button variant="ghost" size="sm" onClick={isLoggedIn ? undefined : onLoginClick}>
                <User className="h-5 w-5" />
                {isLoggedIn && customer && (
                  <span className="hidden md:inline mr-2">{customer.firstName}</span>
                )}
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        {headerStyle.showCategories && (
          <nav className="hidden md:flex items-center space-x-8 rtl:space-x-reverse py-4 border-t" style={{ borderColor: customization?.colors?.border || '#e5e7eb' }}>
            <Button
              variant={currentPage === 'home' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setCurrentPage('home');
                setSelectedProduct(null);
                setMobileMenuOpen(false);
              }}
              style={currentPage === 'home' ? {
                backgroundColor: customization?.colors?.primary || '#2563eb',
                color: 'white'
              } : {}}
            >
              <Home className="h-4 w-4 mr-2" />
              الرئيسية
            </Button>

            <Button
              variant={currentPage === 'products' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setCurrentPage('products');
                setSelectedProduct(null);
                setMobileMenuOpen(false);
              }}
              style={currentPage === 'products' ? {
                backgroundColor: customization?.colors?.primary || '#2563eb',
                color: 'white'
              } : {}}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              جميع المنتجات
            </Button>

            {categories.slice(0, 4).map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentPage('products');
                  setSelectedProduct(null);
                  setMobileMenuOpen(false);
                }}
              >
                {category.name}
              </Button>
            ))}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentPage('order-tracking');
                setSelectedProduct(null);
                setMobileMenuOpen(false);
              }}
            >
              <Package className="h-4 w-4 mr-2" />
              تتبع الطلب
            </Button>
          </nav>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4" style={{ borderColor: customization?.colors?.border || '#e5e7eb' }}>
            <div className="space-y-2">
              <Button
                variant={currentPage === 'home' ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setCurrentPage('home');
                  setSelectedProduct(null);
                  setMobileMenuOpen(false);
                }}
                style={currentPage === 'home' ? {
                  backgroundColor: customization?.colors?.primary || '#2563eb',
                  color: 'white'
                } : {}}
              >
                <Home className="h-4 w-4 mr-2" />
                الرئيسية
              </Button>

              <Button
                variant={currentPage === 'products' ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setCurrentPage('products');
                  setSelectedProduct(null);
                  setMobileMenuOpen(false);
                }}
                style={currentPage === 'products' ? {
                  backgroundColor: customization?.colors?.primary || '#2563eb',
                  color: 'white'
                } : {}}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                ��ميع المنتجات
              </Button>

              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setCurrentPage('products');
                    setSelectedProduct(null);
                    setMobileMenuOpen(false);
                  }}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// Enhanced Homepage Component
const Homepage = ({ store, products, categories, onCategorySelect, onProductSelect, onAddToCart, onToggleWishlist, wishlist, setCurrentPage }: any) => {
  const customization = store?.customization;
  const homepage = customization?.homepage || {};
  const featuredProducts = products.filter((p: any) => p.featured).slice(0, 8);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      {homepage.showHeroSlider && (
        <section className="relative overflow-hidden">
          <div 
            className="rounded-2xl p-12 text-center text-white relative"
            style={{
              backgroundColor: customization?.colors?.primary || '#2563eb',
              backgroundImage: customization?.effects?.gradients ? 
                `linear-gradient(135deg, ${customization?.colors?.primary || '#2563eb'}, ${customization?.colors?.accent || '#3b82f6'})` : 
                undefined
            }}
          >
            <div className="relative z-10">
              <h1 className="text-5xl font-bold mb-4">
                {homepage.heroTexts?.[0]?.title || 'مرحباً بكم في متجرنا'}
              </h1>
              <p className="text-xl mb-8 opacity-90">
                {homepage.heroTexts?.[0]?.subtitle || 'اكتشف مجموعة رائعة من المنتجات عالية الجودة'}
              </p>
              <Button
                size="lg"
                onClick={() => setCurrentPage('products')}
                className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105"
              >
                {homepage.heroTexts?.[0]?.buttonText || 'تسوق الآن'}
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      {homepage.showCategories && categories.length > 0 && (
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">تصفح الفئات</h2>
            <p className="text-gray-600">اختر من مجموعة متنوعة من الفئات</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category: any) => (
              <Card
                key={category.id}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                onClick={() => {
                  onCategorySelect(category.name);
                  setCurrentPage('products');
                }}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                    style={{
                      backgroundColor: `${customization?.colors?.primary || '#2563eb'}20`,
                      color: customization?.colors?.primary || '#2563eb'
                    }}
                  >
                    <Package className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-sm">{category.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {products.filter((p: any) => p.category === category.name).length} منتج
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {homepage.showFeaturedProducts && featuredProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">المنتجات المميزة</h2>
              <p className="text-gray-600">أفضل منتجاتنا المختارة بعناية</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage('products')}
              className="hidden md:flex"
            >
              عرض الكل
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onProductSelect}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                isInWishlist={wishlist.includes(product.id)}
                store={store}
              />
            ))}
          </div>
        </section>
      )}

      {/* Stats Section */}
      {homepage.showStats && (
        <section>
          <div 
            className="rounded-2xl p-8"
            style={{ backgroundColor: customization?.colors?.muted || '#f8fafc' }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold mb-2" style={{ color: customization?.colors?.primary || '#2563eb' }}>
                  {products.length}+
                </div>
                <p className="text-gray-600">منتج متنوع</p>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2" style={{ color: customization?.colors?.primary || '#2563eb' }}>
                  1000+
                </div>
                <p className="text-gray-600">عميل راضٍ</p>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2" style={{ color: customization?.colors?.primary || '#2563eb' }}>
                  24/7
                </div>
                <p className="text-gray-600">خدمة العملاء</p>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2" style={{ color: customization?.colors?.primary || '#2563eb' }}>
                  99%
                </div>
                <p className="text-gray-600">رضا العملاء</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      {homepage.showNewsletter && (
        <section>
          <div 
            className="rounded-2xl p-8 text-center"
            style={{ backgroundColor: `${customization?.colors?.primary || '#2563eb'}10` }}
          >
            <h3 className="text-2xl font-bold mb-4">اشترك في النشرة البريدية</h3>
            <p className="text-gray-600 mb-6">احصل على أحدث العروض والمنتجات الجديدة</p>
            <div className="flex gap-4 max-w-md mx-auto">
              <Input 
                placeholder="البريد الإلكتروني" 
                className="flex-1 rounded-full"
              />
              <Button 
                className="rounded-full px-8"
                style={{ backgroundColor: customization?.colors?.primary || '#2563eb' }}
              >
                اشتراك
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, onSelect, onAddToCart, onToggleWishlist, isInWishlist, store }: any) => {
  const customization = store?.customization;
  const productCustomization = customization?.product || {};
  
  return (
    <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
      <div className="relative">
        {/* Product Image */}
        <div 
          className="aspect-square bg-gray-200 flex items-center justify-center overflow-hidden"
          onClick={() => onSelect(product)}
        >
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <Package className="h-16 w-16 text-gray-400" />
          )}
        </div>

        {/* Sale Badge */}
        {product.salePrice && product.salePrice < product.price && (
          <Badge className="absolute top-2 right-2 bg-red-500 text-white">
            خصم {Math.round(((product.price - product.salePrice) / product.price) * 100)}%
          </Badge>
        )}

        {/* Wishlist Button */}
        {productCustomization.showWishlist !== false && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 left-2 h-8 w-8 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
          >
            <Heart
              className={`h-4 w-4 ${isInWishlist ? 'fill-current text-red-500' : ''}`}
            />
          </Button>
        )}

        {/* Quick View Button */}
        {productCustomization.showQuickView !== false && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-2 left-2 h-8 w-8 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}

        {/* Stock Status */}
        {product.inventory.quantity === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Badge variant="secondary">نفد المخزون</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 
            className="font-semibold text-sm line-clamp-2 cursor-pointer hover:underline"
            onClick={() => onSelect(product)}
          >
            {product.name}
          </h3>
          
          {/* Rating */}
          {productCustomization.showRating !== false && (
            <div className="flex items-center gap-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < Math.floor((product as any).rating || 4) ? 'fill-current text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                ({(product as any).reviewCount || 12} تقييم)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span 
              className="font-bold text-lg"
              style={{ color: customization?.colors?.primary || '#2563eb' }}
            >
              {product.salePrice || product.price} ر.س
            </span>
            {product.salePrice && product.salePrice < product.price && (
              <span className="text-sm text-gray-500 line-through">
                {product.price} ر.س
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <Button
            className="w-full mt-3"
            size="sm"
            disabled={product.inventory.quantity === 0}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product.id);
            }}
            style={{
              backgroundColor: customization?.colors?.primary || '#2563eb',
              color: 'white'
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.inventory.quantity === 0 ? 'نفد المخزون' : 'أضف للسلة'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Products Page Component
const ProductsPage = ({ products, categories, filters, setFilters, viewMode, setViewMode, showFilters, setShowFilters, onProductSelect, onAddToCart, onToggleWishlist, wishlist, store }: any) => (
  <div className="space-y-6">
    {/* Page Header */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">جميع المنتجات</h1>
        <p className="text-gray-600 mt-1">تصفح مجموعتنا الكاملة من المنتجات</p>
      </div>
      <div className="flex items-center gap-4">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            onClick={() => setViewMode('grid')}
            className="rounded-md"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => setViewMode('list')}
            className="rounded-md"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          فلاتر
        </Button>
      </div>
    </div>

    {/* Filters Panel */}
    {showFilters && (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">الفئة</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="all">جميع الفئات</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium mb-2">نطاق السعر</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="من"
                  value={filters.priceRange[0]}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priceRange: [Number(e.target.value), prev.priceRange[1]]
                  }))}
                />
                <Input
                  type="number"
                  placeholder="إلى"
                  value={filters.priceRange[1]}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priceRange: [prev.priceRange[0], Number(e.target.value)]
                  }))}
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">التقييم</label>
              <select
                value={filters.rating}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value={0}>جميع التقييمات</option>
                <option value={4}>4 نجوم فأكثر</option>
                <option value={3}>3 نجوم فأكثر</option>
                <option value={2}>2 نجوم فأكثر</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium mb-2">ترتيب حسب</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="newest">الأحدث</option>
                <option value="price_low">السعر: من الأقل للأعلى</option>
                <option value="price_high">السعر: من الأعلى للأقل</option>
                <option value="rating">الأعلى تقييماً</option>
                <option value="popularity">الأكثر شعبية</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Products Grid/List */}
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-600">عرض {products.length} منتج</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد منتجات</h3>
          <p className="text-gray-600">لم يتم العثور على منتجات تطابق بحثك</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {products.map((product: any) => (
            viewMode === 'grid' ? (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onProductSelect}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                isInWishlist={wishlist.includes(product.id)}
                store={store}
              />
            ) : (
              <ProductListItem
                key={product.id}
                product={product}
                onSelect={onProductSelect}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                isInWishlist={wishlist.includes(product.id)}
                store={store}
              />
            )
          ))}
        </div>
      )}
    </div>
  </div>
);

// Product List Item Component
const ProductListItem = ({ product, onSelect, onAddToCart, onToggleWishlist, isInWishlist, store }: any) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6">
      <div className="flex gap-6">
        {/* Product Image */}
        <div 
          className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden"
          onClick={() => onSelect(product)}
        >
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover hover:scale-110 transition-transform"
            />
          ) : (
            <Package className="h-12 w-12 text-gray-400" />
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 space-y-3">
          <div>
            <h3 
              className="font-bold text-lg cursor-pointer hover:underline"
              onClick={() => onSelect(product)}
            >
              {product.name}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor((product as any).rating || 4) ? 'fill-current text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              ({(product as any).reviewCount || 12} تقييم)
            </span>
          </div>

          {/* Price and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span 
                className="text-2xl font-bold"
                style={{ color: store?.customization?.colors?.primary || '#2563eb' }}
              >
                {product.salePrice || product.price} ر.س
              </span>
              {product.salePrice && product.salePrice < product.price && (
                <span className="text-lg text-gray-500 line-through">
                  {product.price} ر.س
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleWishlist(product.id)}
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current text-red-500' : ''}`} />
              </Button>
              <Button
                size="sm"
                disabled={product.inventory.quantity === 0}
                onClick={() => onAddToCart(product.id)}
                style={{
                  backgroundColor: store?.customization?.colors?.primary || '#2563eb',
                  color: 'white'
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {product.inventory.quantity === 0 ? 'نفد المخزون' : 'أضف للسلة'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Product Page Component
const ProductPage = ({ product, store, onBack, onAddToCart, onToggleWishlist, isInWishlist, relatedProducts }: any) => (
  <div className="space-y-8">
    {/* Breadcrumb */}
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowRight className="h-4 w-4 ml-2" />
        العودة
      </Button>
      <span>/</span>
      <span>{product.category}</span>
      <span>/</span>
      <span className="text-gray-900">{product.name}</span>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Product Images */}
      <div className="space-y-4">
        <div className="aspect-square bg-gray-200 rounded-2xl overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-24 w-24 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Additional Images */}
        {product.images && product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {product.images.slice(1, 5).map((image: string, index: number) => (
              <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img 
                  src={image} 
                  alt={`${product.name} ${index + 2}`}
                  className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          
          {/* Rating */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < Math.floor((product as any).rating || 4) ? 'fill-current text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-gray-600">
              ({(product as any).reviewCount || 12} تقييم)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-4 mb-6">
            <span 
              className="text-4xl font-bold"
              style={{ color: store?.customization?.colors?.primary || '#2563eb' }}
            >
              {product.salePrice || product.price} ر.س
            </span>
            {product.salePrice && product.salePrice < product.price && (
              <>
                <span className="text-2xl text-gray-500 line-through">
                  {product.price} ر.س
                </span>
                <Badge className="bg-red-500 text-white">
                  خصم {Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                </Badge>
              </>
            )}
          </div>

          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            {product.description}
          </p>
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2 mb-6">
          {product.inventory.quantity > 0 ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-600 font-medium">متوفر في المخزون</span>
              <span className="text-gray-500">({product.inventory.quantity} قطعة)</span>
            </>
          ) : (
            <>
              <X className="h-5 w-5 text-red-600" />
              <span className="text-red-600 font-medium">نفد المخزون</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1"
              disabled={product.inventory.quantity === 0}
              onClick={() => onAddToCart(product.id)}
              style={{
                backgroundColor: store?.customization?.colors?.primary || '#2563eb',
                color: 'white'
              }}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {product.inventory.quantity === 0 ? 'نفد المخزون' : 'أضف للس��ة'}
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => onToggleWishlist(product.id)}
              className="px-6"
            >
              <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current text-red-500' : ''}`} />
            </Button>
          </div>

          {/* Product Features */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-green-600" />
              <span>شحن مجاني للطلبات فوق {store.settings?.shipping?.freeShippingThreshold || 200} ر.س</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>ضمان الجودة</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <RotateCcw className="h-4 w-4 text-purple-600" />
              <span>إرجاع مجاني خلال 14 يوم</span>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">الوصف</TabsTrigger>
            <TabsTrigger value="specifications">المواصفات</TabsTrigger>
            <TabsTrigger value="reviews">التقييمات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <div className="prose max-w-none">
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="specifications" className="mt-6">
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">الفئة</span>
                <span>{product.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">رمز المنتج</span>
                <span>{product.inventory.sku}</span>
              </div>
              {product.tags && product.tags.length > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">العلامات</span>
                  <div className="flex gap-1">
                    {product.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد تقييمات بعد</p>
              <p className="text-sm text-gray-500 mt-2">كن أول من يقيم هذا المنتج</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>

    {/* Related Products */}
    {relatedProducts && relatedProducts.length > 0 && (
      <section>
        <h2 className="text-2xl font-bold mb-6">منتجات ذات صلة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts.map((relatedProduct: any) => (
            <ProductCard
              key={relatedProduct.id}
              product={relatedProduct}
              onSelect={onBack}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              isInWishlist={false}
              store={store}
            />
          ))}
        </div>
      </section>
    )}
  </div>
);

// Cart Page Component
const CartPage = ({ cart, products, store, onUpdateQuantity, onProceedToCheckout, isLoggedIn, onLoginRequired }: any) => {
  const getCartTotal = () => {
    return cart.reduce((total: number, item: CartItem) => {
      const product = products.find((p: Product) => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const getShippingCost = () => {
    const total = getCartTotal();
    const freeShippingThreshold = store.settings?.shipping?.freeShippingThreshold || 200;
    return total >= freeShippingThreshold ? 0 : (store.settings?.shipping?.defaultCost || 15);
  };

  const getFinalTotal = () => {
    return getCartTotal() + getShippingCost();
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    onProceedToCheckout();
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">سلة التسوق فارغة</h2>
        <p className="text-gray-600 mb-6">أضف بعض المنتجات للمتابعة</p>
        <Button
          onClick={() => window.history.back()}
          style={{
            backgroundColor: store?.customization?.colors?.primary || '#2563eb',
            color: 'white'
          }}
        >
          تصفح المنتجات
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">سلة التسوق</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item: CartItem) => {
            const product = products.find((p: Product) => p.id === item.productId);
            if (!product) return null;

            return (
              <Card key={item.productId}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium text-lg px-4">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="text-left">
                          <div 
                            className="font-bold text-lg"
                            style={{ color: store?.customization?.colors?.primary || '#2563eb' }}
                          >
                            {product.price * item.quantity} ر.س
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.price} ر.س × {item.quantity}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onUpdateQuantity(item.productId, 0)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>المجموع الفرعي</span>
                  <span className="font-semibold">{getCartTotal()} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>الشحن</span>
                  <span className="font-semibold">
                    {getShippingCost() === 0 ? 'مجاني' : `${getShippingCost()} ر.س`}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>المجموع الكلي</span>
                  <span style={{ color: store?.customization?.colors?.primary || '#2563eb' }}>
                    {getFinalTotal()} ر.س
                  </span>
                </div>
              </div>

              {!isLoggedIn && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    يجب تسجيل الدخول لإتمام عملية الشراء
                  </p>
                </div>
              )}

              <Button 
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                style={{
                  backgroundColor: store?.customization?.colors?.primary || '#2563eb',
                  color: 'white'
                }}
              >
                {isLoggedIn ? 'متابعة الدفع' : 'تسجيل الدخول والدفع'}
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Order Success Page Component
const OrderSuccessPage = ({ orderId, store, onContinueShopping, onTrackOrder }: any) => (
  <div className="text-center py-16">
    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <CheckCircle className="h-12 w-12 text-green-600" />
    </div>
    <h1 className="text-3xl font-bold text-gray-900 mb-4">تم إنشاء طلبك بنجاح! 🎉</h1>
    <p className="text-gray-600 mb-6">
      رقم الطلب: <strong>{orderId.slice(-8).toUpperCase()}</strong>
    </p>
    <p className="text-gray-600 mb-8">
      سيتم إرسال تفاصيل الطلب إلى بريدك الإلكتروني
    </p>
    <div className="flex gap-4 justify-center">
      <Button
        onClick={onTrackOrder}
        style={{
          backgroundColor: store?.customization?.colors?.primary || '#2563eb',
          color: 'white'
        }}
      >
        تتبع الطلب
      </Button>
      <Button
        variant="outline"
        onClick={onContinueShopping}
      >
        متابعة التسوق
      </Button>
    </div>
  </div>
);

// Wishlist Page Component
const WishlistPage = ({ products, onProductSelect, onAddToCart, onRemoveFromWishlist, store }: any) => (
  <div className="space-y-8">
    <h1 className="text-3xl font-bold">قائمة المفضلة</h1>

    {products.length === 0 ? (
      <div className="text-center py-16">
        <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">قائمة المفضلة فارغة</h2>
        <p className="text-gray-600 mb-6">أضف بعض المنتجات المفضلة لديك</p>
        <Button
          onClick={() => window.history.back()}
          style={{
            backgroundColor: store?.customization?.colors?.primary || '#2563eb',
            color: 'white'
          }}
        >
          تصفح المنتجات
        </Button>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product: any) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelect={onProductSelect}
            onAddToCart={onAddToCart}
            onToggleWishlist={onRemoveFromWishlist}
            isInWishlist={true}
            store={store}
          />
        ))}
      </div>
    )}
  </div>
);

// Enhanced Footer Component
const Footer = ({ store }: any) => {
  const customization = store?.customization;
  const footer = customization?.footer || {};
  const social = customization?.social || {};

  return (
    <footer 
      className="border-t mt-16 py-12"
      style={{
        backgroundColor: footer.backgroundColor || '#1e293b',
        color: footer.textColor || '#ffffff',
        borderColor: customization?.colors?.border || '#e5e7eb'
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className={`grid grid-cols-1 md:grid-cols-${footer.columns || 4} gap-8 mb-8`}>
          {/* Store Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{
                  backgroundColor: customization?.colors?.primary || '#2563eb'
                }}
              >
                {store.name?.charAt(0) || 'م'}
              </div>
              <h3 className="text-lg font-bold">{store.name}</h3>
            </div>
            <p className="opacity-75 mb-4">{store.description}</p>
            
            {/* Social Media */}
            {footer.showSocial && (
              <div className="flex items-center gap-3">
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="opacity-75 hover:opacity-100">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {social.twitter && (
                  <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="opacity-75 hover:opacity-100">
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="opacity-75 hover:opacity-100">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {social.youtube && (
                  <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="opacity-75 hover:opacity-100">
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">روابط سريعة</h4>
            <ul className="space-y-2 opacity-75">
              <li><a href="#" className="hover:opacity-100 transition-opacity">الرئيسية</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">المنتجات</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">من نحن</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">تواصل معنا</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-lg mb-4">خدمة العملاء</h4>
            <ul className="space-y-2 opacity-75">
              <li><a href="#" className="hover:opacity-100 transition-opacity">الأسئلة الشائعة</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">سياسة الإرجاع</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">الشروط والأحكام</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">سياسة الخصوصية</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          {footer.showContact && (
            <div>
              <h4 className="font-semibold text-lg mb-4">تواصل معنا</h4>
              <div className="space-y-3 opacity-75">
                {store.contact?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{store.contact.phone}</span>
                  </div>
                )}
                {store.contact?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{store.contact.email}</span>
                  </div>
                )}
                {store.contact?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{store.contact.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>24/7 خدمة العملاء</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        {footer.showPaymentMethods && (
          <div className="border-t py-6 mb-6" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold mb-2">طرق الدفع المقبولة</h4>
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 rounded p-2">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="bg-white/10 rounded p-2">
                    <Banknote className="h-6 w-6" />
                  </div>
                  <div className="bg-white/10 rounded p-2">
                    <Building2 className="h-6 w-6" />
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium">موقع آمن ��محمي</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-400" />
                  <span className="text-sm">شحن سريع لجميع أنحاء المملكة</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Copyright */}
        {footer.showCopyright && (
          <div className="border-t pt-6 text-center opacity-75" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <p>&copy; 2024 {store.name}. جميع الحقوق محفوظة.</p>
            <div className="flex items-center justify-center gap-4 mt-2 text-sm">
              <span>مدعوم بتقنية متقدمة</span>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span>دفع آمن</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};

// Enhanced AdvancedStorefront with authentication
function EnhancedStorefrontWithAuth() {
  const { subdomain } = useParams();
  const [storeData, setStoreData] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const loadStoreInfo = async () => {
      if (!subdomain) return;

      try {
        const foundStore = await storeService.getBySubdomain(subdomain);
        if (foundStore) {
          setStoreData({ id: foundStore.id, name: foundStore.name });
        }
      } catch (error) {
        console.error('Error loading store info:', error);
      }
    };

    loadStoreInfo();
  }, [subdomain]);

  if (!storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p>جاري تحميل المتجر...</p>
        </div>
      </div>
    );
  }

  return (
    <StoreCustomerProvider storeId={storeData.id}>
      <EnhancedStorefront />
    </StoreCustomerProvider>
  );
}

export default EnhancedStorefrontWithAuth;
