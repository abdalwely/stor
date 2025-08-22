import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useStoreCustomer } from '@/contexts/StoreCustomerContext';
import { User, Phone, Mail, Lock } from 'lucide-react';

interface CustomerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
  onLoginSuccess?: () => void;
}

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({
  isOpen,
  onClose,
  storeId,
  storeName,
  onLoginSuccess
}) => {
  const { loginCustomer } = useStoreCustomer();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);

  // بيانات تسجيل الدخول
  const [loginData, setLoginData] = useState({
    email: '',
    phone: ''
  });

  // بيانات التسجيل
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.phone) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يرجى إدخال البريد الإلكتروني ورقم الهاتف',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      // في التطبيق الحقيقي، هنا سيتم التحقق من البيانات مع الخادم
      // لكن لأغراض التطوير، سنقوم بتسجيل الدخول مباشرة
      const firstName = loginData.email.split('@')[0] || 'عميل';
      
      loginCustomer(loginData.email, loginData.phone, firstName, 'المتجر', storeId);
      
      toast({
        title: 'تم تسجيل الدخول بنجاح! 🎉',
        description: `مرحباً بك في ${storeName}`
      });

      onLoginSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: 'خطأ في تسجيل الدخول',
        description: 'حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerData.firstName || !registerData.lastName || !registerData.email || !registerData.phone) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يرجى تعبئة جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      loginCustomer(
        registerData.email, 
        registerData.phone, 
        registerData.firstName, 
        registerData.lastName, 
        storeId
      );
      
      toast({
        title: 'تم إنشاء الحساب بنجاح! 🎉',
        description: `مرحباً بك ${registerData.firstName} في ${storeName}`
      });

      onLoginSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: 'خطأ في إنشاء الحساب',
        description: 'حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setLoginData({ email: '', phone: '' });
    setRegisterData({ firstName: '', lastName: '', email: '', phone: '' });
    setLoading(false);
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            مرحباً بك في {storeName}
          </DialogTitle>
          <DialogDescription className="text-center">
            يرجى تسجيل الدخول أو إنشاء حساب جديد للمتابعة
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
            <TabsTrigger value="register">حساب جديد</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="05xxxxxxxx"
                    value={loginData.phone}
                    onChange={(e) => setLoginData(prev => ({ ...prev, phone: e.target.value }))}
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">الاسم الأول</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="أحمد"
                    value={registerData.firstName}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">اسم العائلة</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="محمد"
                    value={registerData.lastName}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="register-email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="example@email.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="register-phone">رقم الهاتف</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="register-phone"
                    type="tel"
                    placeholder="05xxxxxxxx"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-gray-600 mt-4">
          بإنشاء حساب، فإنك توافق على الشروط والأحكام
        </div>
      </DialogContent>
    </Dialog>
  );
};
