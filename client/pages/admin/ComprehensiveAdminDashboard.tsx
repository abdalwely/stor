import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  storeService, 
  productService, 
  Store, 
  Product 
} from '@/lib/firestore';
import { 
  storeCustomerService, 
  storeOrderService, 
  StoreCustomer, 
  StoreOrder 
} from '@/contexts/StoreCustomerContext';
import { 
  doc, 
  collection, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Users,
  Store as StoreIcon,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Package,
  Activity,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Settings,
  Shield,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Loader2,
  ExternalLink,
  Plus,
  UserCheck,
  UserX,
  Building2,
  CreditCard,
  Truck,
  Star,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from 'lucide-react';

interface AdminStats {
  totalMerchants: number;
  activeMerchants: number;
  pendingMerchants: number;
  suspendedMerchants: number;
  totalStores: number;
  activeStores: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalCustomers: number;
  activeCustomers: number;
}

interface MerchantData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  createdAt: Date;
  isActive: boolean;
  store?: Store;
  stats?: {
    products: number;
    orders: number;
    customers: number;
    revenue: number;
  };
}

export default function ComprehensiveAdminDashboard() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalMerchants: 0,
    activeMerchants: 0,
    pendingMerchants: 0,
    suspendedMerchants: 0,
    totalStores: 0,
    activeStores: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalCustomers: 0,
    activeCustomers: 0
  });
  
  const [merchants, setMerchants] = useState<MerchantData[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [allOrders, setAllOrders] = useState<StoreOrder[]>([]);
  const [allCustomers, setAllCustomers] = useState<StoreCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantData | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);

  useEffect(() => {
    if (userData?.userType === 'admin') {
      loadDashboardData();
    }
  }, [userData]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading admin dashboard data...');

      // تحميل جميع البيانات بالتوازي
      const [
        merchantsData,
        storesData,
        ordersData,
        customersData
      ] = await Promise.all([
        loadMerchants(),
        loadStores(),
        loadAllOrders(),
        loadAllCustomers()
      ]);

      // حساب الإحصائيات
      calculateStats(merchantsData, storesData, ordersData, customersData);

      console.log('✅ Admin dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading admin dashboard:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات لوحة التحكم',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMerchants = async (): Promise<MerchantData[]> => {
    try {
      // تحميل جميع المستخدمين من نوع merchant
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userType', '==', 'merchant'));
      const querySnapshot = await getDocs(q);
      
      const merchantsData: MerchantData[] = [];
      
      for (const docSnap of querySnapshot.docs) {
        const merchantData = { id: docSnap.id, ...docSnap.data() } as MerchantData;
        
        // تحميل متجر التاجر
        const merchantStores = await storeService.getByOwner(merchantData.id);
        if (merchantStores.length > 0) {
          merchantData.store = merchantStores[0];
          
          // تحميل إحصائيات التاجر
          const [products, orders, customers] = await Promise.all([
            productService.getByStore(merchantStores[0].id),
            storeOrderService.getByStore(merchantStores[0].id),
            storeCustomerService.getByStore(merchantStores[0].id)
          ]);
          
          const revenue = orders.reduce((total, order) => total + order.total, 0);
          
          merchantData.stats = {
            products: products.length,
            orders: orders.length,
            customers: customers.length,
            revenue
          };
        }
        
        merchantsData.push(merchantData);
      }
      
      setMerchants(merchantsData);
      return merchantsData;
    } catch (error) {
      console.error('Error loading merchants:', error);
      return [];
    }
  };

  const loadStores = async (): Promise<Store[]> => {
    try {
      const storesData = await storeService.getAll();
      setStores(storesData);
      return storesData;
    } catch (error) {
      console.error('Error loading stores:', error);
      return [];
    }
  };

  const loadAllOrders = async (): Promise<StoreOrder[]> => {
    try {
      const ordersRef = collection(db, 'store_orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StoreOrder[];
      
      setAllOrders(orders);
      return orders;
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  };

  const loadAllCustomers = async (): Promise<StoreCustomer[]> => {
    try {
      const customersRef = collection(db, 'store_customers');
      const q = query(customersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const customers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StoreCustomer[];
      
      setAllCustomers(customers);
      return customers;
    } catch (error) {
      console.error('Error loading customers:', error);
      return [];
    }
  };

  const calculateStats = (
    merchantsData: MerchantData[], 
    storesData: Store[], 
    ordersData: StoreOrder[], 
    customersData: StoreCustomer[]
  ) => {
    const activeMerchants = merchantsData.filter(m => m.isActive).length;
    const activeStores = storesData.filter(s => s.status === 'active').length;
    const totalRevenue = ordersData.reduce((total, order) => total + order.total, 0);
    
    // حساب الإيرادات الشهرية
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = ordersData
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      })
      .reduce((total, order) => total + order.total, 0);

    const totalProducts = merchantsData.reduce((total, merchant) => 
      total + (merchant.stats?.products || 0), 0
    );

    const activeCustomers = customersData.filter(c => c.isActive).length;

    setStats({
      totalMerchants: merchantsData.length,
      activeMerchants,
      pendingMerchants: merchantsData.filter(m => !m.isActive).length,
      suspendedMerchants: merchantsData.filter(m => !m.isActive).length,
      totalStores: storesData.length,
      activeStores,
      totalProducts,
      totalOrders: ordersData.length,
      totalRevenue,
      monthlyRevenue,
      totalCustomers: customersData.length,
      activeCustomers
    });
  };

  const handleToggleStoreStatus = async (storeId: string, currentStatus: Store['status']) => {
    try {
      setActionLoading(storeId);
      console.log('🔄 Toggling store status:', storeId, 'from', currentStatus);

      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      
      await storeService.update(storeId, { status: newStatus });

      // تحديث البيانات المحلية
      setStores(prev => prev.map(store => 
        store.id === storeId ? { ...store, status: newStatus } : store
      ));

      setMerchants(prev => prev.map(merchant => 
        merchant.store?.id === storeId 
          ? { ...merchant, store: { ...merchant.store, status: newStatus } }
          : merchant
      ));

      toast({
        title: newStatus === 'active' ? 'تم تفعيل المتجر' : 'تم إيقاف المتجر',
        description: `تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} المتجر بنجاح`,
        variant: 'default'
      });

      console.log('✅ Store status updated successfully');
    } catch (error) {
      console.error('❌ Error updating store status:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة المتجر',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleMerchantStatus = async (merchantId: string, currentStatus: boolean) => {
    try {
      setActionLoading(merchantId);
      console.log('🔄 Toggling merchant status:', merchantId, 'from', currentStatus);

      const newStatus = !currentStatus;
      
      // تحديث حالة التاجر
      const merchantRef = doc(db, 'users', merchantId);
      await updateDoc(merchantRef, { isActive: newStatus });

      // تحديث البيانات المحلية
      setMerchants(prev => prev.map(merchant => 
        merchant.id === merchantId ? { ...merchant, isActive: newStatus } : merchant
      ));

      toast({
        title: newStatus ? 'تم تفعيل التاجر' : 'تم إيقاف التاجر',
        description: `تم ${newStatus ? 'تفعيل' : 'إيقاف'} التاجر بنجاح`,
        variant: 'default'
      });

      console.log('✅ Merchant status updated successfully');
    } catch (error) {
      console.error('❌ Error updating merchant status:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة التاجر',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    try {
      setActionLoading(storeId);
      console.log('🗑️ Deleting store:', storeId);

      await storeService.delete(storeId);

      // تحديث البيانات المحلية
      setStores(prev => prev.filter(store => store.id !== storeId));
      setMerchants(prev => prev.map(merchant => 
        merchant.store?.id === storeId 
          ? { ...merchant, store: undefined }
          : merchant
      ));

      toast({
        title: 'تم حذف المتجر',
        description: 'تم حذف المتجر نهائياً',
        variant: 'default'
      });

      console.log('✅ Store deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting store:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المتجر',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch = 
      merchant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.store?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && merchant.isActive) ||
      (statusFilter === 'inactive' && !merchant.isActive) ||
      (statusFilter === 'hasStore' && merchant.store) ||
      (statusFilter === 'noStore' && !merchant.store);

    return matchesSearch && matchesStatus;
  });

  const filteredStores = stores.filter(store => {
    const matchesSearch = 
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.subdomain.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && store.status === 'active') ||
      (statusFilter === 'pending' && store.status === 'pending') ||
      (statusFilter === 'suspended' && store.status === 'suspended');

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">جاري تحميل لوحة التحكم...</h3>
          <p className="text-gray-600">يرجى الانتظار بينما نحضر البيانات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم الأدمن</h1>
          <p className="text-gray-600 mt-1">إدارة شاملة للمنصة والتجار والمتاجر</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={loadDashboardData} 
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>
          
          <Button onClick={() => navigate('/')}>
            <Globe className="h-4 w-4 mr-2" />
            عرض الموقع
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">إجمالي التجار</p>
                <p className="text-3xl font-bold">{stats.totalMerchants}</p>
                <p className="text-blue-100 text-sm mt-1">
                  {stats.activeMerchants} نشط
                </p>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">إجمالي المتاجر</p>
                <p className="text-3xl font-bold">{stats.totalStores}</p>
                <p className="text-green-100 text-sm mt-1">
                  {stats.activeStores} نشط
                </p>
              </div>
              <StoreIcon className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">إجمالي الطلبات</p>
                <p className="text-3xl font-bold">{stats.totalOrders}</p>
                <p className="text-purple-100 text-sm mt-1">
                  {stats.totalProducts} منتج
                </p>
              </div>
              <ShoppingBag className="h-12 w-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-orange-100 text-sm mt-1">ريال سعودي</p>
              </div>
              <DollarSign className="h-12 w-12 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">العملاء الإجمالي</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">{stats.activeCustomers} نشط</span>
                </div>
              </div>
              <Users className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">إيرادات هذا الشهر</p>
                <p className="text-2xl font-bold text-gray-900">{stats.monthlyRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">ريال سعودي</span>
                </div>
              </div>
              <BarChart3 className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">متوسط الطلبات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalStores > 0 ? Math.round(stats.totalOrders / stats.totalStores) : 0}
                </p>
                <div className="flex items-center mt-2 text-sm">
                  <Target className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-blue-600">لكل متجر</span>
                </div>
              </div>
              <Activity className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="merchants" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="merchants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            التجار
          </TabsTrigger>
          <TabsTrigger value="stores" className="flex items-center gap-2">
            <StoreIcon className="h-4 w-4" />
            المتاجر
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            الطلبات
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            التحليلات
          </TabsTrigger>
        </TabsList>

        {/* Merchants Tab */}
        <TabsContent value="merchants" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>إدارة التجار</CardTitle>
                  <CardDescription>
                    عرض وإدارة جميع التجار المسجلين في المنصة
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {filteredMerchants.length} تاجر
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="البحث في التجار..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="فلترة بالحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع التجار</SelectItem>
                    <SelectItem value="active">التجار النشطين</SelectItem>
                    <SelectItem value="inactive">التجار غير النشطين</SelectItem>
                    <SelectItem value="hasStore">لديهم متاجر</SelectItem>
                    <SelectItem value="noStore">بدون متاجر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Merchants List */}
              <div className="space-y-4">
                {filteredMerchants.map((merchant) => (
                  <Card key={merchant.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {merchant.firstName} {merchant.lastName}
                            </h3>
                            <p className="text-gray-600">{merchant.email}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant={merchant.isActive ? 'default' : 'secondary'}>
                                {merchant.isActive ? 'نشط' : 'غير نشط'}
                              </Badge>
                              {merchant.store && (
                                <Badge variant="outline">
                                  {merchant.store.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {/* Stats */}
                          {merchant.stats && (
                            <div className="grid grid-cols-2 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold text-gray-900">
                                  {merchant.stats.products}
                                </p>
                                <p className="text-xs text-gray-600">منتج</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-gray-900">
                                  {merchant.stats.orders}
                                </p>
                                <p className="text-xs text-gray-600">طلب</p>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {merchant.store && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/store/${merchant.store?.subdomain}`, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedMerchant(merchant);
                                setShowMerchantModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant={merchant.isActive ? 'destructive' : 'default'}
                              onClick={() => handleToggleMerchantStatus(merchant.id, merchant.isActive)}
                              disabled={actionLoading === merchant.id}
                            >
                              {actionLoading === merchant.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : merchant.isActive ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredMerchants.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
                    <p className="text-gray-600">لم يتم العثور على تجار مطابقين للبحث</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stores Tab */}
        <TabsContent value="stores" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>إدارة المتاجر</CardTitle>
                  <CardDescription>
                    عرض وإدارة جميع المتاجر في المنصة
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {filteredStores.length} متجر
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="البحث في المتا��ر..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="فلترة بالحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المتاجر</SelectItem>
                    <SelectItem value="active">المتاجر النشطة</SelectItem>
                    <SelectItem value="pending">في انتظار الموافقة</SelectItem>
                    <SelectItem value="suspended">المتاجر المعلقة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stores Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores.map((store) => (
                  <Card key={store.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: store.customization?.colors?.primary || '#2563eb' }}
                          >
                            {store.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{store.name}</h3>
                            <p className="text-sm text-gray-600">/{store.subdomain}</p>
                          </div>
                        </div>
                        
                        <Badge variant={
                          store.status === 'active' ? 'default' : 
                          store.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {store.status === 'active' ? 'نشط' : 
                           store.status === 'pending' ? 'في انتظار الموافقة' : 'معلق'}
                        </Badge>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {store.description}
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{store.contact?.email || 'غير محدد'}</span>
                        </div>
                        {store.contact?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{store.contact.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(store.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/store/${store.subdomain}`, '_blank')}
                          className="flex-1"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          زيارة المتجر
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStore(store);
                            setShowStoreModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant={store.status === 'active' ? 'destructive' : 'default'}
                          onClick={() => handleToggleStoreStatus(store.id, store.status)}
                          disabled={actionLoading === store.id}
                        >
                          {actionLoading === store.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : store.status === 'active' ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredStores.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <StoreIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
                    <p className="text-gray-600">لم يتم العثور على متاجر مطابقة للبحث</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إدارة الطلبات</CardTitle>
              <CardDescription>
                عرض جميع الطلبات في المنصة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">إجمالي الطلبات</h3>
                <p className="text-3xl font-bold text-primary mb-2">{allOrders.length}</p>
                <p className="text-gray-600">طلب في جميع المتاجر</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات المنصة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>معدل نمو التجار</span>
                    <span className="font-bold text-green-600">+12%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>معدل نمو المتاجر</span>
                    <span className="font-bold text-green-600">+8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>معدل نمو الطلبات</span>
                    <span className="font-bold text-green-600">+15%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>معدل نمو الإيرادات</span>
                    <span className="font-bold text-green-600">+22%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أداء المنصة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>متوسط الطلبات اليومية</span>
                    <span className="font-bold">{Math.round(stats.totalOrders / 30)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>متوسط قيمة الطلب</span>
                    <span className="font-bold">
                      {stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0} ريال
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>معدل التحويل</span>
                    <span className="font-bold text-blue-600">3.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>مستوى رضا العملاء</span>
                    <span className="font-bold text-yellow-600">4.5/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Merchant Details Modal */}
      <Dialog open={showMerchantModal} onOpenChange={setShowMerchantModal}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل التاجر</DialogTitle>
          </DialogHeader>
          {selectedMerchant && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الاسم الكامل</Label>
                  <p className="text-lg font-medium">
                    {selectedMerchant.firstName} {selectedMerchant.lastName}
                  </p>
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <p className="text-lg">{selectedMerchant.email}</p>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <Badge variant={selectedMerchant.isActive ? 'default' : 'secondary'}>
                    {selectedMerchant.isActive ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
                <div>
                  <Label>تاريخ التسجيل</Label>
                  <p>{new Date(selectedMerchant.createdAt).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>

              {selectedMerchant.store && (
                <div>
                  <h3 className="text-lg font-bold mb-4">معلومات المتجر</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>اسم المتجر</Label>
                      <p className="font-medium">{selectedMerchant.store.name}</p>
                    </div>
                    <div>
                      <Label>الرابط</Label>
                      <p>{selectedMerchant.store.subdomain}</p>
                    </div>
                    <div>
                      <Label>حالة المتجر</Label>
                      <Badge variant={
                        selectedMerchant.store.status === 'active' ? 'default' : 'secondary'
                      }>
                        {selectedMerchant.store.status === 'active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {selectedMerchant.stats && (
                <div>
                  <h3 className="text-lg font-bold mb-4">الإحصائيات</h3>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedMerchant.stats.products}
                      </p>
                      <p className="text-sm text-gray-600">منتج</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedMerchant.stats.orders}
                      </p>
                      <p className="text-sm text-gray-600">طلب</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedMerchant.stats.customers}
                      </p>
                      <p className="text-sm text-gray-600">عميل</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {selectedMerchant.stats.revenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">ريال</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Store Details Modal */}
      <Dialog open={showStoreModal} onOpenChange={setShowStoreModal}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل المتجر</DialogTitle>
          </DialogHeader>
          {selectedStore && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>اسم المتجر</Label>
                  <p className="text-lg font-medium">{selectedStore.name}</p>
                </div>
                <div>
                  <Label>الرابط</Label>
                  <p className="text-lg">/{selectedStore.subdomain}</p>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <Badge variant={
                    selectedStore.status === 'active' ? 'default' : 
                    selectedStore.status === 'pending' ? 'secondary' : 'destructive'
                  }>
                    {selectedStore.status === 'active' ? 'نشط' : 
                     selectedStore.status === 'pending' ? 'في انتظار الموافقة' : 'معلق'}
                  </Badge>
                </div>
                <div>
                  <Label>تاريخ الإنشاء</Label>
                  <p>{new Date(selectedStore.createdAt).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>

              <div>
                <Label>الوصف</Label>
                <p className="mt-1">{selectedStore.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4">معلومات التواصل</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>البريد الإلكتروني</Label>
                    <p>{selectedStore.contact?.email || 'غير محدد'}</p>
                  </div>
                  <div>
                    <Label>رقم الهاتف</Label>
                    <p>{selectedStore.contact?.phone || 'غير محدد'}</p>
                  </div>
                  <div>
                    <Label>المدينة</Label>
                    <p>{selectedStore.contact?.city || 'غير محدد'}</p>
                  </div>
                  <div>
                    <Label>العنوان</Label>
                    <p>{selectedStore.contact?.address || 'غير محدد'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => window.open(`/store/${selectedStore.subdomain}`, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  زيارة المتجر
                </Button>
                
                <Button
                  variant={selectedStore.status === 'active' ? 'destructive' : 'default'}
                  onClick={() => {
                    handleToggleStoreStatus(selectedStore.id, selectedStore.status);
                    setShowStoreModal(false);
                  }}
                >
                  {selectedStore.status === 'active' ? 'إيقاف المتجر' : 'تفعيل المتجر'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
