import React, { createContext, useContext, useState, useEffect } from 'react';
import { orderService } from '@/lib/firestore';

interface CustomerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  storeId: string;
  createdAt: Date;
}

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface StoreCustomerContextType {
  currentCustomer: CustomerData | null;
  addresses: Address[];
  isLoggedIn: boolean;
  loginCustomer: (email: string, phone: string, firstName: string, lastName: string, storeId: string) => void;
  logoutCustomer: () => void;
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
}

const StoreCustomerContext = createContext<StoreCustomerContextType>({
  currentCustomer: null,
  addresses: [],
  isLoggedIn: false,
  loginCustomer: () => {},
  logoutCustomer: () => {},
  addAddress: () => {},
  updateAddress: () => {},
  deleteAddress: () => {},
  setDefaultAddress: () => {}
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
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);

  // تحميل بيانات العميل من localStorage عند بدء التشغيل
  useEffect(() => {
    const stored = localStorage.getItem(`store_customer_${storeId}`);
    if (stored) {
      try {
        const customerData = JSON.parse(stored);
        setCurrentCustomer(customerData);
      } catch (error) {
        console.error('Error parsing customer data:', error);
      }
    }

    // تحميل العناوين
    const storedAddresses = localStorage.getItem(`store_addresses_${storeId}`);
    if (storedAddresses) {
      try {
        const addressesData = JSON.parse(storedAddresses);
        setAddresses(addressesData);
      } catch (error) {
        console.error('Error parsing addresses:', error);
      }
    }
  }, [storeId]);

  const loginCustomer = (email: string, phone: string, firstName: string, lastName: string, storeId: string) => {
    const customer: CustomerData = {
      id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firstName,
      lastName,
      email,
      phone,
      storeId,
      createdAt: new Date()
    };

    setCurrentCustomer(customer);
    localStorage.setItem(`store_customer_${storeId}`, JSON.stringify(customer));
  };

  const logoutCustomer = () => {
    setCurrentCustomer(null);
    localStorage.removeItem(`store_customer_${storeId}`);
  };

  const addAddress = (addressData: Omit<Address, 'id'>) => {
    const newAddress: Address = {
      ...addressData,
      id: `address_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // إذا كان هذا العنوان الوحيد، اجعله افتراضي
    if (addresses.length === 0) {
      newAddress.isDefault = true;
    }

    const updatedAddresses = [...addresses, newAddress];
    setAddresses(updatedAddresses);
    localStorage.setItem(`store_addresses_${storeId}`, JSON.stringify(updatedAddresses));
  };

  const updateAddress = (id: string, updates: Partial<Address>) => {
    const updatedAddresses = addresses.map(addr => 
      addr.id === id ? { ...addr, ...updates } : addr
    );
    setAddresses(updatedAddresses);
    localStorage.setItem(`store_addresses_${storeId}`, JSON.stringify(updatedAddresses));
  };

  const deleteAddress = (id: string) => {
    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    
    // إذا كان العنوان المحذوف هو الافتراضي، اجعل أول عنوان متبقي افتراضي
    if (updatedAddresses.length > 0 && !updatedAddresses.some(addr => addr.isDefault)) {
      updatedAddresses[0].isDefault = true;
    }
    
    setAddresses(updatedAddresses);
    localStorage.setItem(`store_addresses_${storeId}`, JSON.stringify(updatedAddresses));
  };

  const setDefaultAddress = (id: string) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    }));
    setAddresses(updatedAddresses);
    localStorage.setItem(`store_addresses_${storeId}`, JSON.stringify(updatedAddresses));
  };

  const value = {
    currentCustomer,
    addresses,
    isLoggedIn: !!currentCustomer,
    loginCustomer,
    logoutCustomer,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
  };

  return (
    <StoreCustomerContext.Provider value={value}>
      {children}
    </StoreCustomerContext.Provider>
  );
};

export type { CustomerData, Address };
