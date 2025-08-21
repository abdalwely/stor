import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getStores,
  getProducts,
  getCategories,
  syncStoresData,
  setupStorageListener,
  Store,
  Product,
  Category
} from '@/lib/store-management';
import { storeSyncManager, waitForStoreData } from '@/lib/store-sync';

// Test function to check localStorage
const testLocalStorageData = () => {
  console.log('🧪 Testing localStorage data...');
  console.log('🧪 Raw stores data:', localStorage.getItem('stores'));
  console.log('🧪 Raw products data:', localStorage.getItem('products'));
  console.log('🧪 Raw categories data:', localStorage.getItem('categories'));

  try {
    const stores = JSON.parse(localStorage.getItem('stores') || '[]');
    console.log('🧪 Parsed stores:', stores);
  } catch (e) {
    console.error('🧪 Error parsing stores:', e);
  }
};
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
  ArrowRight
} from 'lucide-react';

interface CartItem {
  productId: string;
  quantity: number;
}

export default function WorkingStorefront() {
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
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    // Setup storage listener for cross-window sync
    setupStorageListener();

    // Listen for store data updates using StoreSyncManager
    const handleStoresUpdated = (stores: Store[]) => {
      console.log('🔄 Stores updated via StoreSyncManager:', stores.length, 'stores');
      loadStoreData();
    };

    const handleProductsUpdated = (updatedProducts: Product[]) => {
      console.log('🔄 Products updated via StoreSyncManager:', updatedProducts.length, 'products');
      if (store) {
        const storeProducts = updatedProducts.filter(p => p.storeId === store.id);
        setProducts(storeProducts);
        console.log('✅ Updated store products:', storeProducts.length);
      }
    };

    const handleCategoriesUpdated = (updatedCategories: Category[]) => {
      console.log('🔄 Categories updated via StoreSyncManager:', updatedCategories.length, 'categories');
      if (store) {
        const storeCategories = updatedCategories.filter(c => c.storeId === store.id);
        setCategories(storeCategories);
        console.log('✅ Updated store categories:', storeCategories.length);
      }
    };

    storeSyncManager.addEventListener('stores-updated', handleStoresUpdated);
    storeSyncManager.addEventListener('products-updated', handleProductsUpdated);
    storeSyncManager.addEventListener('categories-updated', handleCategoriesUpdated);

    // Load initial data with enhanced sync
    loadStoreData();

    // Cleanup
    return () => {
      storeSyncManager.removeEventListener('stores-updated', handleStoresUpdated);
      storeSyncManager.removeEventListener('products-updated', handleProductsUpdated);
      storeSyncManager.removeEventListener('categories-updated', handleCategoriesUpdated);
    };
  }, [subdomain]);

  const loadStoreData = async () => {
    try {
      // Check for debug mode and URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const isDebugMode = urlParams.get('debug') === 'true';
      const isPreviewMode = urlParams.get('preview') === 'true';

      if (isDebugMode || isPreviewMode) {
        console.log('🐛 SPECIAL MODE: WorkingStorefront');
        console.log('🐛 Debug mode:', isDebugMode);
        console.log('🐛 Preview mode:', isPreviewMode);
        console.log('🐛 URL Params:', Object.fromEntries(urlParams));
        console.log('🐛 Window location:', window.location.href);

        // In preview mode, wait a bit for data sync
        if (isPreviewMode) {
          console.log('⏱️ Preview mode: waiting for data sync...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('📊 Loading store data for subdomain:', subdomain);

      // Test localStorage data
      testLocalStorageData();

      // Get all stores with enhanced sync using StoreSyncManager
      let stores = storeSyncManager.getStoresWithFallback();
      console.log('🔍 Total available stores:', stores.length);

      // If no stores found, wait for them to load
      if (stores.length === 0) {
        console.log('⏱️ No stores found, waiting for data...');
        stores = await waitForStoreData(subdomain, 5000);
        console.log('⏱️ After waiting, found stores:', stores.length);
      }
      console.log('🔍 Available stores:', stores.map(s => ({
        id: s.id,
        name: s.name,
        subdomain: s.subdomain,
        status: s.status
      })));

      // Debug localStorage directly
      console.log('🔍 Raw localStorage stores:', localStorage.getItem('stores'));

      // Also check other possible storage keys
      console.log('🔍 All localStorage keys:', Object.keys(localStorage));

      if (stores.length === 0) {
        console.warn('❌ No stores found in localStorage');

        // Try to find any store data with different patterns
        Object.keys(localStorage).forEach(key => {
          if (key.includes('store') || key.includes('Store')) {
            console.log(`🔍 Found store-related key: ${key} =`, localStorage.getItem(key));
          }
        });

        // Try to get data from sessionStorage as fallback
        console.log('🔍 Checking sessionStorage...');
        const sessionStores = sessionStorage.getItem('stores');
        if (sessionStores) {
          console.log('🔍 Found stores in sessionStorage:', sessionStores);
          try {
            const parsedSessionStores = JSON.parse(sessionStores);
            if (parsedSessionStores.length > 0) {
              console.log('🔧 Using stores from sessionStorage');
              localStorage.setItem('stores', sessionStores);

              // Limit reload attempts to prevent ERR_CONNECTION_RESET
              const reloadAttempts = parseInt(sessionStorage.getItem('reloadAttempts') || '0');
              if (reloadAttempts < 2) {
                sessionStorage.setItem('reloadAttempts', String(reloadAttempts + 1));
                console.log(`🔄 Reloading (attempt ${reloadAttempts + 1}/2)...`);
                setTimeout(() => window.location.reload(), 500);
              } else {
                console.log('🔄 Max reload attempts reached, continuing without reload');
                sessionStorage.removeItem('reloadAttempts');
                // Try to reload data manually instead of page reload
                setTimeout(() => loadStoreData(), 1000);
              }
              return;
            }
          } catch (e) {
            console.error('Error parsing sessionStorage stores:', e);
          }
        }

        // Try to communicate with parent window (if opened from dashboard)
        const dataRequestAttempts = parseInt(sessionStorage.getItem('dataRequestAttempts') || '0');
        if (dataRequestAttempts < 3) {
          sessionStorage.setItem('dataRequestAttempts', String(dataRequestAttempts + 1));

          if (window.opener && !window.opener.closed) {
            console.log(`🔍 Trying to get data from parent window (attempt ${dataRequestAttempts + 1}/3)...`);
            try {
              window.opener.postMessage({
                type: 'REQUEST_STORE_DATA',
                subdomain: subdomain,
                timestamp: Date.now()
              }, '*');

              console.log('📤 Sent data request to parent window for subdomain:', subdomain);
            } catch (e) {
              console.error('Error communicating with parent window:', e);
            }
          }

          // Also try to request data from the current window if it's in an iframe
          if (window.parent !== window) {
            console.log('🔍 Requesting data from parent iframe...');
            try {
              window.parent.postMessage({
                type: 'REQUEST_STORE_DATA',
                subdomain: subdomain,
                timestamp: Date.now()
              }, '*');
            } catch (e) {
              console.error('Error communicating with parent iframe:', e);
            }
          }
        } else {
          console.log('🔄 Max data request attempts reached');
          sessionStorage.removeItem('dataRequestAttempts');
        }

        setLoading(false);
        return;
      }

      // Find store by subdomain
      let foundStore = stores.find(s => s.subdomain === subdomain);
      console.log('🔍 Exact subdomain match:', foundStore ? foundStore.name : 'Not found');
      console.log('🔍 Looking for subdomain:', subdomain);
      console.log('🔍 Available subdomains:', stores.map(s => s.subdomain));

      // If not found by exact subdomain, try alternatives
      if (!foundStore) {
        console.log('🔍 Trying alternative matching for subdomain:', subdomain);

        // Try partial match
        foundStore = stores.find(s =>
          s.subdomain?.includes(subdomain || '') && subdomain !== ''
        );

        if (!foundStore) {
          // Try name match
          foundStore = stores.find(s =>
            s.name.toLowerCase().includes(subdomain?.toLowerCase() || '') && subdomain !== ''
          );
        }

        console.log('🔍 Alternative match result:', foundStore ? foundStore.name : 'Still not found');
      }

      // Don't use fallback stores - if the exact store isn't found, show error
      if (!foundStore) {
        console.log('🔍 No matching store found for subdomain:', subdomain);
        console.log('🔍 Available stores:', stores.map(s => ({
          name: s.name,
          subdomain: s.subdomain,
          ownerId: s.ownerId,
          createdAt: s.createdAt
        })));

        // Remove old test stores that might interfere
        const filteredStores = stores.filter(s =>
          s.subdomain !== 'store-fallback' &&
          s.name !== 'متجر تجريبي' &&
          s.ownerId !== 'merchant_fallback'
        );

        if (filteredStores.length !== stores.length) {
          console.log('🧹 Cleaning up old test stores...');
          localStorage.setItem('stores', JSON.stringify(filteredStores));

          // Try to find in cleaned stores
          foundStore = filteredStores.find(s => s.subdomain === subdomain);
          if (foundStore) {
            console.log('✅ Found store after cleanup:', foundStore.name);
          }
        }
      }

      if (!foundStore) {
        console.error('❌ No stores available after all attempts');
        console.error('Subdomain requested:', subdomain);
        console.error('Available stores:', stores);
        setLoading(false);
        return;
      }

      console.log('✅ Found store:', {
        id: foundStore.id,
        name: foundStore.name,
        subdomain: foundStore.subdomain,
        status: foundStore.status
      });

      setStore(foundStore);

      // Load products and categories
      const allProducts = getProducts(); // Get all products first
      const allCategories = getCategories(); // Get all categories first

      console.log('🔍 Debug products loading:', {
        storeId: foundStore.id,
        allProductsCount: allProducts.length,
        allCategoriesCount: allCategories.length,
        rawProductsData: localStorage.getItem('products'),
        rawCategoriesData: localStorage.getItem('categories'),
        allProducts: allProducts.map(p => ({ id: p.id, name: p.name, storeId: p.storeId })),
        allCategories: allCategories.map(c => ({ id: c.id, name: c.name, storeId: c.storeId }))
      });

      const storeProducts = getProducts(foundStore.id);
      const storeCategories = getCategories(foundStore.id);

      setProducts(storeProducts);
      setCategories(storeCategories);

      console.log('✅ Store data loaded successfully:', {
        store: foundStore.name,
        products: storeProducts.length,
        categories: storeCategories.length,
        storeProducts: storeProducts.map(p => ({ name: p.name, storeId: p.storeId }))
      });

      // Clear any reload attempts since we loaded successfully
      sessionStorage.removeItem('reloadAttempts');
      sessionStorage.removeItem('pageReloadAttempts');
      sessionStorage.removeItem('dataRequestAttempts');

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

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.productId !== productId));
      return;
    }
    
    setCart(prev => prev.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    ));
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    product.status === 'active'
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">جاري تحميل المتجر...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">جاري تحميل المتجر...</p>
          <p className="text-sm text-gray-500 mt-2">المطلوب: {subdomain}</p>
        </div>
      </div>
    );
  }

  if (!store) {
    // Debug information
    const stores = getStores();

    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-2xl mx-auto p-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">المتجر غير متوفر</h1>
          <p className="text-gray-600 mb-4">
            لم يتم العثور على متجر بالرا��ط: <strong>{subdomain}</strong>
          </p>

          <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm">
            <p className="text-blue-800 mb-2"><strong>معلومات التشخيص:</strong></p>
            <p>عدد المتاجر المتاحة: {stores.length}</p>
            <p>الرابط المطلوب: {subdomain}</p>
            <p>localStorage stores: {localStorage.getItem('stores') ? 'موجود' : 'غير موجود'}</p>
            <p>sessionStorage stores: {sessionStorage.getItem('stores') ? 'موجود' : 'غير موجود'}</p>
            <p>نافذة الأب: {window.opener ? 'متاحة' : 'غير متاحة'}</p>
            <p>iframe: {window.parent !== window ? 'نعم' : 'لا'}</p>
            <p>الوقت الحالي: {new Date().toLocaleString('ar-SA')}</p>
            {stores.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-blue-700">المتاجر المتاحة:</summary>
                <ul className="mt-1 list-disc list-inside text-xs">
                  {stores.map(s => (
                    <li key={s.id}>
                      {s.name} - {s.subdomain} (المالك: {s.ownerId})
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {stores.length === 0 ? (
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <p className="text-yellow-800 mb-4">لا توجد متاجر في ا��نظام حالياً</p>
              <p className="text-yellow-700 text-sm mb-4">
                يمكنك إنشاء متجر جديد من خلال لوحة تح��م التاجر
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/merchant/dashboard')} className="bg-blue-600 hover:bg-blue-700">
                  إنشاء متجر جديد
                </Button>
                <Button
                  onClick={() => {
                    // Create a test store directly
                    const testStore = {
                      name: 'متجر تجريبي',
                      description: 'متجر للاختبار والمعاينة',
                      subdomain: subdomain || 'test-store',
                      ownerId: 'test-user',
                      template: 'modern-ecommerce',
                      customization: {
                        colors: {
                          primary: '#2563eb',
                          secondary: '#64748b',
                          background: '#ffffff',
                          text: '#1e293b',
                          accent: '#f59e0b'
                        },
                        fonts: {
                          heading: 'Cairo',
                          body: 'Inter'
                        },
                        layout: {
                          headerStyle: 'modern',
                          footerStyle: 'detailed',
                          productGridColumns: 3
                        },
                        homepage: {
                          showHeroSlider: true,
                          showFeaturedProducts: true,
                          showCategories: true,
                          showNewsletter: true,
                          heroImages: [],
                          heroTexts: [
                            { title: 'مرحباً بكم في متجرنا', subtitle: 'أفضل المنتجات بأسعار مميزة', buttonText: 'تسوق الآن' }
                          ]
                        },
                        pages: {
                          enableBlog: false,
                          enableReviews: true,
                          enableWishlist: true,
                          enableCompare: false
                        }
                      },
                      settings: {
                        currency: 'SAR',
                        language: 'ar',
                        timezone: 'Asia/Riyadh',
                        shipping: {
                          enabled: true,
                          freeShippingThreshold: 200,
                          defaultCost: 15,
                          zones: []
                        },
                        payment: {
                          cashOnDelivery: true,
                          bankTransfer: true,
                          creditCard: false,
                          paypal: false,
                          stripe: false
                        },
                        taxes: {
                          enabled: true,
                          rate: 15,
                          includeInPrice: false
                        }
                      },
                      status: 'active'
                    };

                    // Import the functions we need
                    import('@/lib/store-management').then(({ createStore, initializeSampleData }) => {
                      console.log('🔧 Creating test store with subdomain:', subdomain);
                      const newStore = createStore({
                        ...testStore,
                        subdomain: subdomain || 'test-store' // Use the actual subdomain from URL
                      });
                      initializeSampleData(newStore.id);
                      console.log('✅ Test store created:', newStore);
                      toast({
                        title: 'تم إنشاء المتجر التجريبي',
                        description: 'سيتم إعادة تحميل الصفحة لعرض المتجر'
                      });
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    }).catch(error => {
                      console.error('Error creating test store:', error);
                      toast({
                        title: 'خطأ في إنشاء المتجر',
                        description: 'حدث خطأ أثناء إنشاء المتجر التجريبي',
                        variant: 'destructive'
                      });
                    });
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  إنشاء متجر تجريبي
                </Button>
                <Button onClick={() => navigate('/merchant/dashboard')} className="bg-blue-600 hover:bg-blue-700">
                  إنشاء متجر جديد
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-blue-800 mb-4">ا��متاجر المتاحة:</p>
              <div className="grid gap-2">
                {stores.slice(0, 5).map(store => (
                  <div key={store.id} className="text-sm">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/store/${store.subdomain}`)}
                      className="w-full text-left justify-start"
                    >
                      {store.name} - {store.subdomain}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              variant="outline"
              onClick={() => {
                console.log('🔄 Force reloading store data...');

                // Try to get fresh data from multiple sources
                const localStores = localStorage.getItem('stores');
                const sessionStores = sessionStorage.getItem('stores');

                console.log('🔄 Local storage:', localStores);
                console.log('🔄 Session storage:', sessionStores);

                if (sessionStores && (!localStores || localStores === '[]')) {
                  console.log('🔄 Using session storage data');
                  localStorage.setItem('stores', sessionStores);
                }

                loadStoreData();
              }}
            >
              إعادة تحميل البيانات
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                console.log('🔧 Initializing sample data for existing store...');
                const currentStores = getStores();
                const targetStore = currentStores.find(s => s.subdomain === subdomain);

                if (targetStore) {
                  import('@/lib/store-management').then(({ initializeSampleData }) => {
                    initializeSampleData(targetStore.id);
                    console.log('✅ Sample data initialized for store:', targetStore.name);
                    toast({
                      title: 'تم إضافة المنتجات النموذجية',
                      description: 'تم إضافة منتجات وفئات نموذجية للمتجر'
                    });
                    setTimeout(() => loadStoreData(), 1000);
                  }).catch(error => {
                    console.error('Error initializing sample data:', error);
                  });
                } else {
                  console.error('Store not found for sample data initialization');
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              إضافة منتجات نموذجية
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Force sync data before reload
                const sessionStores = sessionStorage.getItem('stores');
                if (sessionStores) {
                  localStorage.setItem('stores', sessionStores);
                }

                // Limit reload attempts
                const reloadAttempts = parseInt(sessionStorage.getItem('pageReloadAttempts') || '0');
                if (reloadAttempts < 1) {
                  sessionStorage.setItem('pageReloadAttempts', String(reloadAttempts + 1));
                  window.location.reload();
                } else {
                  console.log('🔄 Using data reload instead of page reload');
                  sessionStorage.removeItem('pageReloadAttempts');
                  loadStoreData();
                }
              }}
            >
              إعادة المحاولة
            </Button>
            <Button
              onClick={() => navigate('/merchant/dashboard')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              العودة للوحة التحكم
            </Button>
            <Button
              onClick={() => navigate('/customer/stores')}
              className="bg-green-600 hover:bg-green-700"
            >
              تصفح جم��ع ال��تاجر
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="group cursor-pointer hover:shadow-lg transition-all">
      <div onClick={() => setSelectedProduct(product)}>
        <div className="aspect-square bg-gray-200 rounded-t-lg overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-gray-400" />
          </div>
          {product.originalPrice && product.originalPrice > product.price && (
            <Badge className="absolute top-2 left-2 bg-red-500">
              خ��م {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold line-clamp-2 mb-2">{product.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
              />
            ))}
            <span className="text-sm text-gray-600">({product.reviewCount})</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-green-600">{product.price} ر.س</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through mr-2">{product.originalPrice} ر.س</span>
              )}
            </div>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product.id);
              }}
              style={{
                backgroundColor: store?.customization.colors.primary || '#2563eb',
                color: 'white'
              }}
              className="hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );

  // Apply store customizations
  const storeStyle = store ? {
    '--store-primary': store.customization.colors.primary,
    '--store-secondary': store.customization.colors.secondary,
    '--store-background': store.customization.colors.background,
    '--store-text': store.customization.colors.text,
    '--store-accent': store.customization.colors.accent,
  } as React.CSSProperties : {};

  return (
    <div
      className="min-h-screen"
      dir="rtl"
      style={{
        backgroundColor: store?.customization.colors.background || '#ffffff',
        color: store?.customization.colors.text || '#1e293b',
        fontFamily: store?.customization.fonts.body || 'Cairo',
        ...storeStyle
      }}
    >
      {/* Header */}
      <header
        className="shadow-sm border-b sticky top-0 z-50"
        style={{
          backgroundColor: store?.customization.colors.background || '#ffffff',
          borderColor: store?.customization.colors.secondary || '#e5e7eb'
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          {/* Top Bar */}
          <div
            className="flex items-center justify-between py-2 text-sm border-b"
            style={{ borderColor: store?.customization.colors.secondary || '#e5e7eb' }}
          >
            <div className="flex items-center gap-4">
              <span
                className="text-opacity-70"
                style={{ color: store?.customization.colors.text || '#4b5563' }}
              >
                مرحباً بكم في {store.name}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span
                className="text-opacity-70"
                style={{ color: store?.customization.colors.text || '#4b5563' }}
              >
                التوصيل المجاني للطلبات أكثر من {store.settings.shipping.freeShippingThreshold} ر.س
              </span>
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

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Input
                  placeholder="ابحث عن الم��تجات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
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
                    {getCartItemsCount()}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="sm">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="pb-4">
            <div className="flex items-center gap-4">
              <Button
                variant={currentPage === 'home' ? 'default' : 'ghost'}
                onClick={() => {
                  setCurrentPage('home');
                  setSelectedProduct(null);
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
                }}
                size="sm"
                style={currentPage === 'products' ? {
                  backgroundColor: store?.customization.colors.primary || '#2563eb',
                  color: 'white'
                } : {}}
              >
                <Package className="h-4 w-4 mr-2" />
                ��لمنتجات
              </Button>
              {categories.map(category => (
                <Button 
                  key={category.id}
                  variant="ghost"
                  size="sm"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Homepage */}
        {currentPage === 'home' && !selectedProduct && (
          <div className="space-y-8">
            {/* Hero Section */}
            <section
              className="relative h-96 rounded-lg overflow-hidden"
              style={{
                background: `linear-gradient(to right, ${store?.customization.colors.primary || '#2563eb'}, ${store?.customization.colors.accent || '#7c3aed'})`
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-white text-center">
                <div>
                  <h1
                    className="text-4xl font-bold mb-4"
                    style={{ fontFamily: store?.customization.fonts.heading || 'Cairo' }}
                  >
                    مرحباً بكم في {store.name}
                  </h1>
                  <p className="text-xl mb-6">أفضل المنتجات بأسعار مميزة</p>
                  <Button
                    size="lg"
                    onClick={() => setCurrentPage('products')}
                    style={{
                      backgroundColor: store?.customization.colors.background || '#ffffff',
                      color: store?.customization.colors.primary || '#2563eb'
                    }}
                    className="hover:opacity-90 transition-opacity"
                  >
                    تسوق الآن
                  </Button>
                </div>
              </div>
            </section>

            {/* Categories */}
            {categories.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">تسوق حسب الفئة</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {categories.map(category => (
                    <Card 
                      key={category.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-600" />
                        </div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Featured Products */}
            <section>
              <h2 className="text-2xl font-bold mb-6">المنتجات المميزة</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.filter(p => p.featured && p.status === 'active').slice(0, 8).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Products Page */}
        {currentPage === 'products' && !selectedProduct && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">جميع المنتجات</h1>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد منتجات</h3>
                <p className="text-gray-600">لم يتم العثور على منتجات تطابق البحث</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Product Details */}
        {selectedProduct && (
          <div className="space-y-8">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <button onClick={() => setCurrentPage('home')}>الرئيسية</button>
              <ArrowLeft className="h-4 w-4" />
              <button onClick={() => setCurrentPage('products')}>المنتجات</button>
              <ArrowLeft className="h-4 w-4" />
              <span>{selectedProduct.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Product Images */}
              <div>
                <div className="aspect-square bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <Package className="h-24 w-24 text-gray-400" />
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{selectedProduct.name}</h1>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < Math.floor(selectedProduct.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({selectedProduct.reviewCount} تقييم)</span>
                    <Badge>{selectedProduct.category}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-3xl font-bold text-green-600">{selectedProduct.price} ر.س</span>
                    {selectedProduct.originalPrice && (
                      <span className="text-xl text-gray-500 line-through">{selectedProduct.originalPrice} ر.س</span>
                    )}
                  </div>
                  <p className="text-gray-600 leading-relaxed">{selectedProduct.description}</p>
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">الحالة:</span>
                  {selectedProduct.stock > 0 ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      متوفر ({selectedProduct.stock} قطعة)
                    </Badge>
                  ) : (
                    <Badge variant="destructive">نفد المخزون</Badge>
                  )}
                </div>

                {/* Add to Cart */}
                <div className="flex gap-4">
                  <Button 
                    className="flex-1"
                    onClick={() => addToCart(selectedProduct.id)}
                    disabled={selectedProduct.stock === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    إضافة للسلة
                  </Button>
                  <Button variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cart Page */}
        {currentPage === 'cart' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">سلة التسوق</h1>
            
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">سلة التسوق فارغة</h3>
                <p className="text-gray-600 mb-4">أضف بعض المن��جات للمتابعة</p>
                <Button onClick={() => setCurrentPage('products')}>
                  تصفح المنتجات
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  {cart.map((item) => {
                    const product = products.find(p => p.id === item.productId);
                    if (!product) return null;
                    
                    return (
                      <Card key={item.productId}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{product.name}</h3>
                              <p className="text-sm text-gray-600 mb-2">{product.price} ر.س</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center border rounded-lg">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="px-4 py-2 min-w-[60px] text-center">{item.quantity}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                                    disabled={item.quantity >= product.stock}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="text-left">
                                  <p className="font-semibold">{product.price * item.quantity} ر.س</p>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => updateCartQuantity(item.productId, 0)}
                                    className="text-red-500 hover:text-red-700"
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
                  <Card>
                    <CardHeader>
                      <CardTitle>ملخص الطلب</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span>المجموع الفرعي</span>
                        <span>{getCartTotal()} ر.س</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الشحن</span>
                        <span>
                          {getCartTotal() >= store.settings.shipping.freeShippingThreshold 
                            ? 'مجاني' 
                            : `${store.settings.shipping.defaultCost} ر.س`
                          }
                        </span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between text-lg font-bold">
                          <span>الإجمالي</span>
                          <span>
                            {getCartTotal() + (getCartTotal() >= store.settings.shipping.freeShippingThreshold ? 0 : store.settings.shipping.defaultCost)} ر.س
                          </span>
                        </div>
                      </div>
                      <Button className="w-full">
                        متابعة للدفع
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">{store.name}</h3>
              <p className="text-gray-300">{store.description}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">روابط سريعة</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <button onClick={() => setCurrentPage('home')} className="hover:text-white">
                    الرئيسية
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentPage('products')} className="hover:text-white">
                    المنتجات
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">تواصل معنا</h4>
              <div className="space-y-2 text-gray-300">
                <p>info@{store.subdomain}.com</p>
                <p>+966 50 123 4567</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© 2024 {store.name}. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
