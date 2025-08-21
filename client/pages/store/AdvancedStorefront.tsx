import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getStores,
  getProducts,
  getCategories,
  Store,
  Product,
  Category
} from '@/lib/store-management';
import { storeSyncManager, waitForStoreData } from '@/lib/store-sync';
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
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Share2,
  Bookmark,
  Eye,
  ThumbsUp,
  MessageCircle,
  TrendingUp,
  Award,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard
} from 'lucide-react';

interface CartItem {
  productId: string;
  quantity: number;
  variantId?: string;
}

interface ProductPageProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (productId: string, quantity: number) => void;
  store: Store;
}

interface FilterOptions {
  category: string;
  priceRange: [number, number];
  rating: number;
  sortBy: 'newest' | 'price_low' | 'price_high' | 'rating' | 'popularity';
}

export default function AdvancedStorefront() {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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
    sortBy: 'newest'
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadStoreData();

    // Setup sync listeners
    const handleStoresUpdated = (stores: Store[]) => {
      loadStoreData();
    };

    const handleProductsUpdated = (updatedProducts: Product[]) => {
      setProducts(prev => {
        // استخدام current store من state
        const currentStore = store;
        if (currentStore) {
          return updatedProducts.filter(p => p.storeId === currentStore.id);
        }
        return prev;
      });
    };

    const handleCategoriesUpdated = (updatedCategories: Category[]) => {
      setCategories(prev => {
        // است��دام current store من state
        const currentStore = store;
        if (currentStore) {
          return updatedCategories.filter(c => c.storeId === currentStore.id);
        }
        return prev;
      });
    };

    // Debounced reload function
    let reloadTimeout: NodeJS.Timeout;
    const debouncedReload = () => {
      clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(() => {
        loadStoreData();
      }, 500); // تأخير 500ms لتجنب التحديثات المتكررة
    };

    // Listen for customization updates
    const handleCustomizationUpdate = (e: MessageEvent) => {
      // استخدام subdomain بدلاً من store.id لتجنب dependency
      if (e.data.type === 'STORE_CUSTOMIZATION_UPDATED') {
        console.log('🎨 Store customization updated, reloading...');
        debouncedReload();
      }

      // Listen for new product creation
      if (e.data.type === 'PRODUCT_CREATED') {
        console.log('📦 New product created, reloading products...');
        debouncedReload();
      }
    };

    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === 'store_customization_sync' && e.newValue) {
        try {
          console.log('🎨 Store customization sync detected, reloading...');
          debouncedReload();
        } catch (error) {
          console.error('Error parsing customization sync data:', error);
        }
      }

      if (e.key === 'product_creation_sync' && e.newValue) {
        try {
          console.log('📦 New product sync detected, reloading products...');
          debouncedReload();
        } catch (error) {
          console.error('Error parsing product creation sync data:', error);
        }
      }
    };

    storeSyncManager.addEventListener('stores-updated', handleStoresUpdated);
    storeSyncManager.addEventListener('products-updated', handleProductsUpdated);
    storeSyncManager.addEventListener('categories-updated', handleCategoriesUpdated);
    window.addEventListener('message', handleCustomizationUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      clearTimeout(reloadTimeout); // تنظيف الـ timeout
      storeSyncManager.removeEventListener('stores-updated', handleStoresUpdated);
      storeSyncManager.removeEventListener('products-updated', handleProductsUpdated);
      storeSyncManager.removeEventListener('categories-updated', handleCategoriesUpdated);
      window.removeEventListener('message', handleCustomizationUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [subdomain]); // إزالة store من dependencies لتجنب infinite loop

  const loadStoreData = async () => {
    try {
      setLoading(true);

      console.log('🔍 Searching for store with subdomain:', subdomain);

      let stores = storeSyncManager.getStoresWithFallback();

      console.log('📦 Available stores:', stores.map(s => ({ name: s.name, subdomain: s.subdomain, id: s.id })));

      if (stores.length === 0) {
        console.log('⏳ No stores found, trying direct localStorage access...');

        // محاولة قراءة البيانات مباشرة من localStorage
        try {
          const directStores = localStorage.getItem('stores');
          if (directStores) {
            const parsedStores = JSON.parse(directStores);
            if (Array.isArray(parsedStores) && parsedStores.length > 0) {
              stores = parsedStores.map((store: any) => ({
                ...store,
                createdAt: new Date(store.createdAt),
                updatedAt: new Date(store.updatedAt)
              }));
              console.log('📦 Loaded stores directly from localStorage:', stores.length);
            }
          }
        } catch (error) {
          console.error('Error reading stores from localStorage:', error);
        }

        // إذا لم نجد بيانات، انتظر
        if (stores.length === 0) {
          console.log('⏳ Still no stores found, waiting for data...');
          stores = await waitForStoreData(subdomain, 5000);
          console.log('📦 Stores after waiting:', stores.map(s => ({ name: s.name, subdomain: s.subdomain, id: s.id })));
        }
      }

      let foundStore = stores.find(s => s.subdomain === subdomain);

      // إذا لم يتم العثور على المتجر بالـ subdomain، جرب البحث بالـ id
      if (!foundStore && subdomain?.startsWith('store-')) {
        foundStore = stores.find(s => s.id === subdomain);
        console.log('🔍 Searching by ID instead of subdomain');
      }

      // إذا لم يتم العثور عليه، جرب البحث بجزء من الـ subdomain
      if (!foundStore) {
        foundStore = stores.find(s => s.subdomain.includes(subdomain) || subdomain.includes(s.subdomain));
        console.log('🔍 Trying partial subdomain match');
      }

      if (!foundStore) {
        console.error('❌ Store not found! Looking for subdomain:', subdomain);
        console.error('Available stores:', stores.map(s => ({
          name: s.name,
          subdomain: s.subdomain,
          id: s.id,
          ownerId: s.ownerId
        })));
        setLoading(false);
        return;
      }

      setStore(foundStore);

      const storeProducts = getProducts(foundStore.id);
      const storeCategories = getCategories(foundStore.id);

      setProducts(storeProducts);
      setCategories(storeCategories);

      console.log('✅ Advanced Storefront loaded:', {
        store: foundStore.name,
        subdomain: foundStore.subdomain,
        products: storeProducts.length,
        categories: storeCategories.length,
        customization: foundStore.customization ? 'موجود' : 'غير موجود',
        primaryColor: foundStore.customization?.colors?.primary || 'غير محدد'
      });

    } catch (error) {
      console.error('❌ Error loading store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (productId: string, quantity: number = 1) => {
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
      description: 'يمكنك مراجعة سلة التسوق الآن'
    });
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const isInWishlist = prev.includes(productId);
      const newWishlist = isInWishlist 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      toast({
        title: isInWishlist ? 'تم حذف المنتج من المفضلة' : 'تم إضافة المنتج للمفضلة',
        description: isInWishlist ? 'تم حذف المنتج من قائمة المفضلة' : 'تم إضافة المنتج لقائمة المفضلة'
      });
      
      return newWishlist;
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
      filtered = filtered.filter(product => product.rating >= filters.rating);
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
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'popularity':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">جاري تحميل المتجر...</p>
          <p className="text-sm text-gray-500 mt-2">المطلوب: {subdomain}</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-2xl mx-auto p-6">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">المتجر غير متوفر</h1>
          <p className="text-gray-600 mb-6">
            ل�� يتم العثور على متجر بالرابط: <strong>{subdomain}</strong>
          </p>

          <div className="space-y-4 mb-6">
            <Button
              onClick={() => loadStoreData()}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'جاري إعادة المحاولة...' : 'إعادة المحاولة'}
            </Button>

            <Button
              onClick={() => navigate('/diagnostics')}
              variant="outline"
              className="w-full"
            >
              فتح صفحة التشخيص
            </Button>

            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              العودة للصفحة الرئيسية
            </Button>
          </div>

          <div className="text-sm text-gray-500 bg-gray-100 p-4 rounded-lg text-right">
            <p><strong>معلومات التشخيص:</strong></p>
            <p>الرابط المطلوب: {subdomain}</p>
            <p>حالة التحميل: {loading ? 'جاري التحميل' : 'مكتمل'}</p>
            <div className="mt-2 text-xs">
              <p><strong>خطوات الحل:</strong></p>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>اذهب لصفحة التشخيص واضغط "إصلاح مشكلة التزامن"</li>
                <li>تأكد من تسجيل دخول التاجر بشكل صحيح</li>
                <li>تحقق من وحدة التحكم (F12) لتفاصيل أكثر</li>
              </ol>
            </div>
          </div>
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
    '--store-accent': store.customization.colors.accent,
    '--store-header-bg': store.customization.colors.headerBackground || store.customization.colors.background,
    '--store-footer-bg': store.customization.colors.footerBackground || store.customization.colors.secondary,
    '--store-card-bg': store.customization.colors.cardBackground || '#ffffff',
    '--store-border': store.customization.colors.borderColor || '#e5e7eb',
  } as React.CSSProperties : {};

  const containerClass = store?.customization.layout.containerWidth === 'full' ? 'max-w-full' :
                        store?.customization.layout.containerWidth === 'wide' ? 'max-w-8xl' :
                        store?.customization.layout.containerWidth === 'narrow' ? 'max-w-4xl' :
                        'max-w-7xl';

  const spacingClass = store?.customization.layout.spacing === 'tight' ? 'space-y-4' :
                      store?.customization.layout.spacing === 'relaxed' ? 'space-y-12' :
                      store?.customization.layout.spacing === 'loose' ? 'space-y-16' :
                      'space-y-8';

  return (
    <div
      className={`min-h-screen ${store?.customization.effects?.animations ? 'transition-all duration-300' : ''}`}
      dir="rtl"
      style={{
        backgroundColor: store?.customization.colors.background || '#ffffff',
        color: store?.customization.colors.text || '#1e293b',
        fontFamily: store?.customization.fonts.body || 'Cairo',
        fontSize: store?.customization.fonts.size?.medium || '16px',
        ...storeStyleVars
      }}
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
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">تم إنشاء طلبك بنجاح! 🎉</h1>
            <p className="text-gray-600 mb-6">
              رقم الطلب: <strong>{completedOrderId.slice(-8).toUpperCase()}</strong>
            </p>
            <p className="text-gray-600 mb-8">
              سيتم إرسال تفاصيل الطلب إلى بريدك الإلكتروني
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setCurrentPage('order-tracking')}
                style={{
                  backgroundColor: store?.customization.colors.primary || '#2563eb',
                  color: 'white'
                }}
              >
                تتبع الطلب
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage('home')}
              >
                العودة للمتجر
              </Button>
            </div>
          </div>
        )}

        {currentPage === 'order-tracking' && (
          <OrderTrackingPage
            store={store}
            onBack={() => setCurrentPage('home')}
          />
        )}
      </main>

      {/* Enhanced Footer */}
      <Footer store={store} />
    </div>
  );
}

// Header Component
const Header = ({ store, searchQuery, setSearchQuery, cart, wishlist, categories, currentPage, setCurrentPage, setSelectedProduct, mobileMenuOpen, setMobileMenuOpen }: any) => (
  <header
    className={`shadow-sm border-b sticky top-0 z-50 ${store?.customization.effects?.shadows ? 'shadow-lg' : 'shadow-sm'}`}
    style={{
      backgroundColor: store?.customization.colors.headerBackground || store?.customization.colors.background || '#ffffff',
      borderColor: store?.customization.colors.borderColor || '#e5e7eb'
    }}
  >
    <div className="max-w-7xl mx-auto px-4">
      {/* Top Bar */}
      <div 
        className="hidden md:flex items-center justify-between py-2 text-sm border-b"
        style={{ borderColor: store?.customization.colors.secondary || '#e5e7eb' }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span>شحن مجاني للطلبات فوق {store.settings.shipping.freeShippingThreshold} ر.س</span>
          </div>
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
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>920012345</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>info@{store.subdomain}.com</span>
          </div>
        </div>
      </div>

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
            className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md"
            style={{ backgroundColor: store?.customization.colors.primary || '#2563eb' }}
          >
            <ShoppingBag className="h-7 w-7 text-white" />
          </div>
          <div>
            <span
              className="text-2xl font-bold block"
              style={{
                fontFamily: store?.customization.fonts.heading || 'Cairo',
                color: store?.customization.colors.text || '#1e293b'
              }}
            >
              {store.name}
            </span>
            <span className="text-sm text-gray-500">{store.description}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative">
            <Input
              placeholder="ابحث عن المنتجات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full border-2"
              style={{ borderColor: store?.customization.colors.secondary || '#e5e7eb' }}
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentPage('wishlist')}
            className="relative hidden md:flex"
          >
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && (
              <span 
                className="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                style={{ backgroundColor: store?.customization.colors.primary || '#2563eb' }}
              >
                {wishlist.length}
              </span>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentPage('cart')}
            className="relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {cart.length > 0 && (
              <span 
                className="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                style={{ backgroundColor: store?.customization.colors.primary || '#2563eb' }}
              >
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </span>
            )}
          </Button>
          
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <User className="h-5 w-5" />
          </Button>

          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`pb-4 ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <Button
            variant={currentPage === 'home' ? 'default' : 'ghost'}
            onClick={() => {
              setCurrentPage('home');
              setSelectedProduct(null);
              setMobileMenuOpen(false);
            }}
            size="sm"
            style={currentPage === 'home' ? {
              backgroundColor: store?.customization.colors.primary || '#2563eb',
              color: 'white'
            } : {}}
          >
            <Home className="h-4 w-4 mr-2" />
            الرئيسية
          </Button>
          
          <Button 
            variant={currentPage === 'products' ? 'default' : 'ghost'}
            onClick={() => {
              setCurrentPage('products');
              setSelectedProduct(null);
              setMobileMenuOpen(false);
            }}
            size="sm"
            style={currentPage === 'products' ? {
              backgroundColor: store?.customization.colors.primary || '#2563eb',
              color: 'white'
            } : {}}
          >
            <Package className="h-4 w-4 mr-2" />
            المنتجات
          </Button>
          
          {categories.slice(0, 5).map(category => (
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
        </div>

        {/* Mobile Search */}
        <div className="mt-4 md:hidden">
          <div className="relative">
            <Input
              placeholder="ابحث عن المنتجات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </nav>
    </div>
  </header>
);

// Homepage Component
const Homepage = ({ store, products, categories, onCategorySelect, onProductSelect, onAddToCart, onToggleWishlist, wishlist, setCurrentPage }: any) => (
  <div className="space-y-12">
    {/* Hero Section */}
    <section 
      className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: `linear-gradient(135deg, ${store?.customization.colors.primary || '#2563eb'}, ${store?.customization.colors.accent || '#7c3aed'})`
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      <div className="absolute inset-0 flex items-center justify-center text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1 
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
            style={{ fontFamily: store?.customization.fonts.heading || 'Cairo' }}
          >
            مرحباً ��كم في {store.name}
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            اكتشف أفضل ال��نتجات بأسعار مميزة وجودة عالية
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setCurrentPage('products')}
              style={{
                backgroundColor: store?.customization.colors.background || '#ffffff',
                color: store?.customization.colors.primary || '#2563eb'
              }}
              className="hover:opacity-90 transition-all duration-300 shadow-lg text-lg px-8 py-4"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              تسوق الآن
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-300 text-lg px-8 py-4"
            >
              <Eye className="h-5 w-5 mr-2" />
              شاهد المجموعات
            </Button>
          </div>
        </div>
      </div>
      
      {/* Floating Cards */}
      <div className="absolute bottom-8 left-8 right-8 hidden md:flex justify-center gap-6">
        <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg p-4 text-white text-center">
          <Truck className="h-8 w-8 mx-auto mb-2" />
          <div className="text-sm font-semibold">شحن سريع</div>
        </div>
        <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg p-4 text-white text-center">
          <Shield className="h-8 w-8 mx-auto mb-2" />
          <div className="text-sm font-semibold">ضمان الجودة</div>
        </div>
        <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg p-4 text-white text-center">
          <Award className="h-8 w-8 mx-auto mb-2" />
          <div className="text-sm font-semibold">خدمة ممتازة</div>
        </div>
      </div>
    </section>

    {/* Categories Section */}
    {categories.length > 0 && (
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">تسوق حسب الفئة</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            اكتشف مجموع��نا المتنوعة من المنتجات المصنفة خصيصاً لتلبية احتياجاتك
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {categories.map(category => (
            <Card 
              key={category.id}
              className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group"
              onClick={() => {
                onCategorySelect(category.name);
                setCurrentPage('products');
              }}
            >
              <CardContent className="p-6 text-center">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${store?.customization.colors.primary}20` }}
                >
                  <Package 
                    className="h-8 w-8"
                    style={{ color: store?.customization.colors.primary || '#2563eb' }}
                  />
                </div>
                <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    )}

    {/* Featured Products */}
    <section>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">المنتجات المميزة</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          اختيارنا الخاص ��ن أفضل المنتجات التي تلقى إعجاب عملائنا
        </p>
      </div>
      
      {products.filter(p => p.featured && p.status === 'active').length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.filter(p => p.featured && p.status === 'active').slice(0, 8).map(product => (
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
      ) : (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد منتجات مميزة</h3>
          <p className="text-gray-600 mb-4">سيتم عرض المنتجات المميزة هنا قريباً</p>
          <Button onClick={() => setCurrentPage('products')}>
            تصفح جميع المنتجات
          </Button>
        </div>
      )}
    </section>

    {/* Stats Section */}
    <section 
      className="rounded-2xl p-8 md:p-12"
      style={{ backgroundColor: `${store?.customization.colors.primary}10` }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div>
          <div 
            className="text-4xl font-bold mb-2"
            style={{ color: store?.customization.colors.primary || '#2563eb' }}
          >
            {products.filter(p => p.status === 'active').length}+
          </div>
          <div className="text-gray-600">منتج متوفر</div>
        </div>
        <div>
          <div 
            className="text-4xl font-bold mb-2"
            style={{ color: store?.customization.colors.primary || '#2563eb' }}
          >
            {categories.length}+
          </div>
          <div className="text-gray-600">فئة مختلفة</div>
        </div>
        <div>
          <div 
            className="text-4xl font-bold mb-2"
            style={{ color: store?.customization.colors.primary || '#2563eb' }}
          >
            1000+
          </div>
          <div className="text-gray-600">عميل راض</div>
        </div>
        <div>
          <div 
            className="text-4xl font-bold mb-2"
            style={{ color: store?.customization.colors.primary || '#2563eb' }}
          >
            24/7
          </div>
          <div className="text-gray-600">دعم فني</div>
        </div>
      </div>
    </section>
  </div>
);

// Product Card Component
const ProductCard = ({ product, onSelect, onAddToCart, onToggleWishlist, isInWishlist, store }: any) => (
  <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
    <div className="relative">
      <div 
        className="aspect-square bg-gray-200 overflow-hidden"
        onClick={() => onSelect(product)}
      >
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
          <Package className="h-16 w-16 text-gray-400" />
        </div>
        
        {/* Discount Badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <Badge className="absolute top-3 left-3 bg-red-500 text-white shadow-md">
            خصم {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
          </Badge>
        )}
        
        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 bg-white shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
          >
            <Heart 
              className={`h-4 w-4 ${isInWishlist ? 'fill-current text-red-500' : ''}`} 
            />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 bg-white shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>

        {/* Stock Status */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Badge variant="destructive" className="text-white">نفد المخزون</Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div onClick={() => onSelect(product)}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
              />
            ))}
            <span className="text-sm text-gray-600 mr-1">
              ({product.reviewCount})
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span 
              className="text-xl font-bold"
              style={{ color: store?.customization.colors.primary || '#16a34a' }}
            >
              {product.price} ر.س
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through mr-2">
                {product.originalPrice} ر.س
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product.id);
            }}
            disabled={product.stock === 0}
            style={{
              backgroundColor: store?.customization.colors.primary || '#2563eb',
              color: 'white'
            }}
            className="hover:opacity-90 transition-opacity shadow-md"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </div>
  </Card>
);

// Products Page Component (will continue in next part...)
const ProductsPage = ({ products, categories, filters, setFilters, viewMode, setViewMode, showFilters, setShowFilters, onProductSelect, onAddToCart, onToggleWishlist, wishlist, store }: any) => (
  <div className="space-y-6">
    {/* Page Header */}
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold mb-2">جميع المنتجات</h1>
        <p className="text-gray-600">عدد المنتجات: {products.length}</p>
      </div>
      
      <div className="flex items-center gap-4">
        {/* View Mode Toggle */}
        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          الفلاتر
        </Button>
      </div>
    </div>

    <div className="flex gap-8">
      {/* Filters Sidebar */}
      <div className={`${showFilters ? 'block' : 'hidden'} w-80 space-y-6`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الفلاتر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Filter */}
            <div>
              <h3 className="font-semibold mb-3">الفئة</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === 'all'}
                    onChange={() => setFilters({ ...filters, category: 'all' })}
                  />
                  <span>جميع الفئات</span>
                </label>
                {categories.map((category: Category) => (
                  <label key={category.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="category"
                      checked={filters.category === category.name}
                      onChange={() => setFilters({ ...filters, category: category.name })}
                    />
                    <span>{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="font-semibold mb-3">نطاق السعر</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="من"
                    value={filters.priceRange[0]}
                    onChange={(e) => setFilters({
                      ...filters,
                      priceRange: [Number(e.target.value), filters.priceRange[1]]
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="إلى"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters({
                      ...filters,
                      priceRange: [filters.priceRange[0], Number(e.target.value)]
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <h3 className="font-semibold mb-3">التقييم</h3>
              <div className="space-y-2">
                {[4, 3, 2, 1].map(rating => (
                  <label key={rating} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="rating"
                      checked={filters.rating === rating}
                      onChange={() => setFilters({ ...filters, rating })}
                    />
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                      <span className="text-sm">فأعلى</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <h3 className="font-semibold mb-3">ترتيب حسب</h3>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="newest">الأحدث</option>
                <option value="price_low">السعر: من الأقل للأعلى</option>
                <option value="price_high">السعر: من الأعلى للأقل</option>
                <option value="rating">الأعلى تقييماً</option>
                <option value="popularity">الأكثر شعبية</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid/List */}
      <div className="flex-1">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد منتجات</h3>
            <p className="text-gray-600">لم يتم العثور على منتجات تطابق الفلاتر المحددة</p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {products.map((product: Product) => (
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
  </div>
);

// Product List Item Component
const ProductListItem = ({ product, onSelect, onAddToCart, onToggleWishlist, isInWishlist, store }: any) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6">
      <div className="flex gap-6">
        <div 
          className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer"
          onClick={() => onSelect(product)}
        >
          <Package className="h-12 w-12 text-gray-400" />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 
              className="text-xl font-semibold cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => onSelect(product)}
            >
              {product.name}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleWishlist(product.id)}
            >
              <Heart 
                className={`h-5 w-5 ${isInWishlist ? 'fill-current text-red-500' : ''}`} 
              />
            </Button>
          </div>
          
          <p className="text-gray-600 mb-3 line-clamp-2">{product.description}</p>
          
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({product.reviewCount} تقييم)</span>
            <Badge variant="outline">{product.category}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span 
                className="text-2xl font-bold"
                style={{ color: store?.customization.colors.primary || '#16a34a' }}
              >
                {product.price} ر.س
              </span>
              {product.originalPrice && (
                <span className="text-lg text-gray-500 line-through mr-2">
                  {product.originalPrice} ر.س
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                المخزون: {product.stock}
              </span>
              <Button
                onClick={() => onAddToCart(product.id)}
                disabled={product.stock === 0}
                style={{
                  backgroundColor: store?.customization.colors.primary || '#2563eb',
                  color: 'white'
                }}
                className="hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4 mr-2" />
                أضف للسلة
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Product Page Component (continues in next part...)
const ProductPage = ({ product, store, onBack, onAddToCart, onToggleWishlist, isInWishlist, relatedProducts }: any) => (
  <div className="space-y-8">
    {/* Breadcrumb */}
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <button onClick={onBack} className="hover:text-blue-600">الرئيسية</button>
      <ArrowLeft className="h-4 w-4" />
      <button onClick={onBack} className="hover:text-blue-600">المنتجات</button>
      <ArrowLeft className="h-4 w-4" />
      <span>{product.name}</span>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Product Images */}
      <div>
        <div className="aspect-square bg-gray-200 rounded-2xl mb-4 flex items-center justify-center shadow-lg">
          <Package className="h-32 w-32 text-gray-400" />
        </div>
        
        {/* Image Thumbnails */}
        <div className="grid grid-cols-4 gap-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({product.reviewCount} تقييم)</span>
            <Badge>{product.category}</Badge>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <span 
              className="text-4xl font-bold"
              style={{ color: store?.customization.colors.primary || '#16a34a' }}
            >
              {product.price} ر.س
            </span>
            {product.originalPrice && (
              <span className="text-2xl text-gray-500 line-through">
                {product.originalPrice} ر.س
              </span>
            )}
            {product.originalPrice && (
              <Badge className="bg-red-500">
                وفر {product.originalPrice - product.price} ر.س
              </Badge>
            )}
          </div>
          
          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2 mb-6">
          <span className="font-semibold">الحالة:</span>
          {product.stock > 0 ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-4 w-4 mr-1" />
              متوفر ({product.stock} قطعة)
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="h-4 w-4 mr-1" />
              نفد المخزون
            </Badge>
          )}
        </div>

        {/* Product Specifications */}
        {Object.keys(product.specifications).length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">المواصفات</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium">{key}:</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button 
              className="flex-1"
              size="lg"
              onClick={() => onAddToCart(product.id)}
              disabled={product.stock === 0}
              style={{
                backgroundColor: store?.customization.colors.primary || '#2563eb',
                color: 'white'
              }}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              أضف للسلة
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => onToggleWishlist(product.id)}
            >
              <Heart 
                className={`h-5 w-5 ${isInWishlist ? 'fill-current text-red-500' : ''}`} 
              />
            </Button>
            
            <Button variant="outline" size="lg">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Truck className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-sm font-medium">شحن سريع</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Shield className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-sm font-medium">ضمان</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <RotateCcw className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-sm font-medium">إرجاع سهل</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Related Products */}
    {relatedProducts.length > 0 && (
      <section>
        <h2 className="text-2xl font-bold mb-6">منتجات ذات صلة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts.map((relatedProduct: Product) => (
            <ProductCard
              key={relatedProduct.id}
              product={relatedProduct}
              onSelect={() => {}}
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
const CartPage = ({ cart, products, store, onUpdateQuantity, onProceedToCheckout }: any) => {
  const getCartTotal = () => {
    return cart.reduce((total: number, item: CartItem) => {
      const product = products.find((p: Product) => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const getShippingCost = () => {
    const total = getCartTotal();
    return total >= store.settings.shipping.freeShippingThreshold ? 0 : store.settings.shipping.defaultCost;
  };

  const getFinalTotal = () => {
    return getCartTotal() + getShippingCost();
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
            backgroundColor: store?.customization.colors.primary || '#2563eb',
            color: 'white'
          }}
        >
          متابعة التسوق
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
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                      <p className="text-gray-600 mb-3">{product.category}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border rounded-lg">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="px-4 py-2 min-w-[60px] text-center font-semibold">
                            {item.quantity}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= product.stock}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="text-left">
                          <p 
                            className="text-xl font-bold"
                            style={{ color: store?.customization.colors.primary || '#16a34a' }}
                          >
                            {product.price * item.quantity} ر.س
                          </p>
                          <p className="text-sm text-gray-500">
                            {product.price} ر.س × {item.quantity}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onUpdateQuantity(item.productId, 0)}
                            className="text-red-500 hover:text-red-700 mt-2"
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-xl">ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>المجموع الفرعي</span>
                  <span className="font-semibold">{getCartTotal()} ر.��</span>
                </div>
                
                <div className="flex justify-between">
                  <span>الشحن</span>
                  <span className="font-semibold">
                    {getShippingCost() === 0 ? (
                      <span className="text-green-600">مجاني</span>
                    ) : (
                      `${getShippingCost()} ر.س`
                    )}
                  </span>
                </div>
                
                {getCartTotal() < store.settings.shipping.freeShippingThreshold && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                    أضف {store.settings.shipping.freeShippingThreshold - getCartTotal()} ر.س 
                    أكثر للحصول على شحن مجاني!
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>الإجمالي</span>
                <span 
                  style={{ color: store?.customization.colors.primary || '#16a34a' }}
                >
                  {getFinalTotal()} ر.س
                </span>
              </div>
              
              <Button 
                className="w-full"
                size="lg"
                onClick={onProceedToCheckout}
                style={{
                  backgroundColor: store?.customization.colors.primary || '#2563eb',
                  color: 'white'
                }}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                متابعة للدفع
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.history.back()}
              >
                متابعة التسوق
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Footer Component
const Footer = ({ store }: any) => (
  <footer 
    className="mt-16 border-t"
    style={{ 
      backgroundColor: store?.customization.colors.background || '#f8fafc',
      borderColor: store?.customization.colors.secondary || '#e2e8f0'
    }}
  >
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Store Info */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: store?.customization.colors.primary || '#2563eb' }}
            >
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <span 
              className="text-xl font-bold"
              style={{
                fontFamily: store?.customization.fonts.heading || 'Cairo',
                color: store?.customization.colors.text || '#1e293b'
              }}
            >
              {store.name}
            </span>
          </div>
          <p className="text-gray-600 mb-4">{store.description}</p>
          <div className="flex gap-3">
            <Button size="sm" variant="outline">
              <Facebook className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Instagram className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-lg mb-4">روابط سريعة</h4>
          <ul className="space-y-2 text-gray-600">
            <li><a href="#" className="hover:text-blue-600 transition-colors">الرئيسية</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">المنتجات</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">من نحن</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">اتصل بنا</a></li>
          </ul>
        </div>

        {/* Customer Service */}
        <div>
          <h4 className="font-semibold text-lg mb-4">خدمة العملاء</h4>
          <ul className="space-y-2 text-gray-600">
            <li><a href="#" className="hover:text-blue-600 transition-colors">الأسئلة الشائعة</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">سياسة الإرجاع</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">الشروط والأحكام</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">سياسة الخصوصية</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-semibold text-lg mb-4">تواصل معنا</h4>
          <div className="space-y-3 text-gray-600">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>920012345</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>info@{store.subdomain}.com</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>الرياض، المملكة العربية السعودية</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>24/7 خدمة العملاء</span>
            </div>
          </div>
        </div>
      </div>
      
      <Separator className="my-8" />
      
      <div className="flex flex-col md:flex-row items-center justify-between text-center md:text-right">
        <p className="text-gray-600">
          © 2024 {store.name}. جميع الحقوق محفوظة.
        </p>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <span className="text-sm text-gray-500">مدعوم بتقنية </span>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-sm">دفع آمن</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
);
