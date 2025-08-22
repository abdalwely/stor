import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Store Customer interface
export interface StoreCustomer {
  id: string;
  storeId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isActive: boolean;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Order interface for store customers
export interface StoreOrder {
  id: string;
  storeId: string;
  customerId: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
    image?: string;
  }[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface StoreCustomerContextType {
  customer: StoreCustomer | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; customer?: StoreCustomer }>;
  register: (customerData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string; customer?: StoreCustomer }>;
  logout: () => void;
  updateProfile: (updates: Partial<StoreCustomer>) => Promise<boolean>;
  getOrderHistory: () => Promise<StoreOrder[]>;
  createOrder: (orderData: Omit<StoreOrder, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
}

const StoreCustomerContext = createContext<StoreCustomerContextType>({
  customer: null,
  isLoggedIn: false,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  updateProfile: async () => false,
  getOrderHistory: async () => [],
  createOrder: async () => ''
});

export const useStoreCustomer = () => {
  const context = useContext(StoreCustomerContext);
  if (!context) {
    throw new Error('useStoreCustomer must be used within a StoreCustomerProvider');
  }
  return context;
};

interface StoreCustomerProviderProps {
  children: React.ReactNode;
  storeId: string;
}

export const StoreCustomerProvider: React.FC<StoreCustomerProviderProps> = ({ children, storeId }) => {
  const [customer, setCustomer] = useState<StoreCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing customer session for this store
    const checkExistingSession = () => {
      try {
        const sessionKey = `store_customer_${storeId}`;
        const savedSession = localStorage.getItem(sessionKey);
        
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);
          console.log('📋 Found existing customer session for store:', storeId);
          setCustomer(sessionData);
        }
      } catch (error) {
        console.error('Error loading customer session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, [storeId]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; customer?: StoreCustomer }> => {
    try {
      console.log('🔐 Customer login attempt for store:', storeId, 'email:', email);

      // Query for customer in this specific store
      const customersRef = collection(db, 'store_customers');
      const q = query(
        customersRef, 
        where('storeId', '==', storeId),
        where('email', '==', email.toLowerCase())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, error: 'البريد الإلكتروني غير مسجل في هذا المتجر' };
      }

      const customerDoc = querySnapshot.docs[0];
      const customerData = { id: customerDoc.id, ...customerDoc.data() } as StoreCustomer;

      // For demo purposes, we'll accept any password
      // In production, you would verify the password properly
      console.log('✅ Customer login successful');
      
      setCustomer(customerData);
      
      // Save session for this store
      const sessionKey = `store_customer_${storeId}`;
      localStorage.setItem(sessionKey, JSON.stringify(customerData));

      return { success: true, customer: customerData };
    } catch (error) {
      console.error('❌ Customer login error:', error);
      return { success: false, error: 'حدث خطأ في تسجيل الدخول' };
    }
  };

  const register = async (customerData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string; customer?: StoreCustomer }> => {
    try {
      console.log('📝 Customer registration for store:', storeId, 'email:', customerData.email);

      // Check if customer already exists in this store
      const customersRef = collection(db, 'store_customers');
      const q = query(
        customersRef,
        where('storeId', '==', storeId),
        where('email', '==', customerData.email.toLowerCase())
      );
      
      const existingCustomer = await getDocs(q);
      
      if (!existingCustomer.empty) {
        return { success: false, error: 'البريد الإلكتروني مسجل مسبقاً في هذا المتجر' };
      }

      // Create new customer
      const newCustomer: Omit<StoreCustomer, 'id'> = {
        storeId,
        email: customerData.email.toLowerCase(),
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        phone: customerData.phone,
        isActive: true,
        totalOrders: 0,
        totalSpent: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(customersRef, newCustomer);
      const createdCustomer: StoreCustomer = { id: docRef.id, ...newCustomer };

      console.log('✅ Customer registration successful');
      
      setCustomer(createdCustomer);
      
      // Save session for this store
      const sessionKey = `store_customer_${storeId}`;
      localStorage.setItem(sessionKey, JSON.stringify(createdCustomer));

      return { success: true, customer: createdCustomer };
    } catch (error) {
      console.error('❌ Customer registration error:', error);
      return { success: false, error: 'حدث خطأ في إنشاء الحساب' };
    }
  };

  const logout = () => {
    console.log('👋 Customer logout for store:', storeId);
    setCustomer(null);
    
    // Remove session for this store
    const sessionKey = `store_customer_${storeId}`;
    localStorage.removeItem(sessionKey);
  };

  const updateProfile = async (updates: Partial<StoreCustomer>): Promise<boolean> => {
    if (!customer) return false;

    try {
      console.log('👤 Updating customer profile for store:', storeId);

      const customerRef = doc(db, 'store_customers', customer.id);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await updateDoc(customerRef, updateData);

      const updatedCustomer = { ...customer, ...updateData };
      setCustomer(updatedCustomer);

      // Update session
      const sessionKey = `store_customer_${storeId}`;
      localStorage.setItem(sessionKey, JSON.stringify(updatedCustomer));

      console.log('✅ Customer profile updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating customer profile:', error);
      return false;
    }
  };

  const getOrderHistory = async (): Promise<StoreOrder[]> => {
    if (!customer) return [];

    try {
      console.log('📦 Loading order history for customer:', customer.id, 'in store:', storeId);

      const ordersRef = collection(db, 'store_orders');
      const q = query(
        ordersRef,
        where('storeId', '==', storeId),
        where('customerId', '==', customer.id),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StoreOrder[];

      console.log('✅ Loaded', orders.length, 'orders for customer');
      return orders;
    } catch (error) {
      console.error('❌ Error loading order history:', error);
      return [];
    }
  };

  const createOrder = async (orderData: Omit<StoreOrder, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!customer) throw new Error('Customer not logged in');

    try {
      console.log('🛒 Creating order for customer:', customer.id, 'in store:', storeId);

      const ordersRef = collection(db, 'store_orders');
      const newOrder: Omit<StoreOrder, 'id'> = {
        ...orderData,
        customerId: customer.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(ordersRef, newOrder);

      // Update customer stats
      await updateProfile({
        totalOrders: customer.totalOrders + 1,
        totalSpent: customer.totalSpent + orderData.total,
        lastOrderDate: new Date()
      });

      console.log('✅ Order created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  };

  const value = {
    customer,
    isLoggedIn: !!customer,
    loading,
    login,
    register,
    logout,
    updateProfile,
    getOrderHistory,
    createOrder
  };

  return (
    <StoreCustomerContext.Provider value={value}>
      {children}
    </StoreCustomerContext.Provider>
  );
};

// Store Customer Services for Firebase
export const storeCustomerService = {
  // Get all customers for a store (for merchant dashboard)
  async getByStore(storeId: string): Promise<StoreCustomer[]> {
    try {
      const customersRef = collection(db, 'store_customers');
      const q = query(
        customersRef,
        where('storeId', '==', storeId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StoreCustomer[];
    } catch (error) {
      console.error('Error getting store customers:', error);
      return [];
    }
  },

  // Get customer by ID
  async getById(customerId: string): Promise<StoreCustomer | null> {
    try {
      const customerRef = doc(db, 'store_customers', customerId);
      const customerSnap = await getDoc(customerRef);

      if (customerSnap.exists()) {
        return { id: customerSnap.id, ...customerSnap.data() } as StoreCustomer;
      }
      return null;
    } catch (error) {
      console.error('Error getting customer:', error);
      return null;
    }
  },

  // Update customer
  async update(customerId: string, data: Partial<StoreCustomer>): Promise<boolean> {
    try {
      const customerRef = doc(db, 'store_customers', customerId);
      await updateDoc(customerRef, {
        ...data,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating customer:', error);
      return false;
    }
  }
};

// Store Order Services for Firebase
export const storeOrderService = {
  // Get all orders for a store (for merchant dashboard)
  async getByStore(storeId: string): Promise<StoreOrder[]> {
    try {
      const ordersRef = collection(db, 'store_orders');
      const q = query(
        ordersRef,
        where('storeId', '==', storeId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StoreOrder[];
    } catch (error) {
      console.error('Error getting store orders:', error);
      return [];
    }
  },

  // Get order by ID
  async getById(orderId: string): Promise<StoreOrder | null> {
    try {
      const orderRef = doc(db, 'store_orders', orderId);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        return { id: orderSnap.id, ...orderSnap.data() } as StoreOrder;
      }
      return null;
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  },

  // Update order status
  async updateStatus(orderId: string, status: StoreOrder['orderStatus']): Promise<boolean> {
    try {
      const orderRef = doc(db, 'store_orders', orderId);
      await updateDoc(orderRef, {
        orderStatus: status,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  },

  // Update order
  async update(orderId: string, data: Partial<StoreOrder>): Promise<boolean> {
    try {
      const orderRef = doc(db, 'store_orders', orderId);
      await updateDoc(orderRef, {
        ...data,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      return false;
    }
  }
};
