import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getStoreByOwnerId, 
  updateStore, 
  Store 
} from '@/lib/store-management';
import {
  Palette,
  Type,
  Layout,
  Home,
  Sparkles,
  Eye,
  Save,
  RotateCcw,
  Image,
  Smartphone,
  Monitor,
  Tablet,
  ArrowLeft
} from 'lucide-react';

const colorPresets = [
  { name: 'الأزرق الكلاسيكي', primary: '#2563eb', secondary: '#64748b', accent: '#3b82f6' },
  { name: 'الأخضر الطبيعي', primary: '#16a34a', secondary: '#6b7280', accent: '#22c55e' },
  { name: 'البرتقالي النشط', primary: '#ea580c', secondary: '#71717a', accent: '#fb923c' },
  { name: 'البنفسجي العصري', primary: '#7c3aed', secondary: '#6b7280', accent: '#a855f7' },
  { name: 'الوردي الأنيق', primary: '#ec4899', secondary: '#64748b', accent: '#f472b6' },
  { name: 'الذهبي الفاخر', primary: '#d97706', secondary: '#78716c', accent: '#f59e0b' }
];

const fontOptions = [
  { name: 'Cairo', value: 'Cairo', preview: 'Cairo - خط عربي حديث' },
  { name: 'Amiri', value: 'Amiri', preview: 'Amiri - خط عربي تقليدي' },
  { name: 'Noto Sans Arabic', value: 'Noto Sans Arabic', preview: 'Noto Sans Arabic - خط واضح' },
  { name: 'Tajawal', value: 'Tajawal', preview: 'Tajawal - خط عصري' },
  { name: 'Almarai', value: 'Almarai', preview: 'Almarai - خط بسيط' }
];

export default function AdvancedStoreCustomization() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userData } = useAuth();
  
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  const [customization, setCustomization] = useState({
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#1e293b',
      accent: '#3b82f6',
      headerBackground: '#ffffff',
      footerBackground: '#f8fafc',
      cardBackground: '#ffffff',
      borderColor: '#e5e7eb'
    },
    fonts: {
      heading: 'Cairo',
      body: 'Cairo',
      size: {
        small: '14px',
        medium: '16px',
        large: '18px',
        xlarge: '24px'
      }
    },
    layout: {
      headerStyle: 'modern' as const,
      footerStyle: 'detailed' as const,
      productGridColumns: 4,
      containerWidth: 'normal' as const,
      borderRadius: 'medium' as const,
      spacing: 'normal' as const
    },
    homepage: {
      showHeroSlider: true,
      showFeaturedProducts: true,
      showCategories: true,
      showNewsletter: true,
      showTestimonials: false,
      showStats: true,
      showBrands: false,
      heroImages: [],
      heroTexts: [
        { title: 'مرحباً بكم في متجرنا', subtitle: 'أفضل المنتجات بأسعار مميزة', buttonText: 'تسوق الآن' }
      ],
      sectionsOrder: ['hero', 'categories', 'featured', 'stats']
    },
    pages: {
      enableBlog: false,
      enableReviews: true,
      enableWishlist: true,
      enableCompare: false,
      enableLiveChat: false,
      enableFAQ: true,
      enableAboutUs: true,
      enableContactUs: true
    },
    branding: {
      logo: '',
      favicon: '',
      watermark: '',
      showPoweredBy: true
    },
    effects: {
      animations: true,
      transitions: true,
      shadows: true,
      gradients: true
    }
  });

  useEffect(() => {
    loadStoreData();
  }, [userData]);

  const loadStoreData = async () => {
    if (!userData) return;

    try {
      const storeData = getStoreByOwnerId(userData.uid);
      if (storeData) {
        setStore(storeData);

        // Ensure customization has all required properties with defaults
        const safeCustomization = {
          colors: {
            primary: '#2563eb',
            secondary: '#64748b',
            background: '#ffffff',
            text: '#1e293b',
            accent: '#3b82f6',
            headerBackground: '#ffffff',
            footerBackground: '#f8fafc',
            cardBackground: '#ffffff',
            borderColor: '#e5e7eb',
            ...storeData.customization?.colors
          },
          fonts: {
            heading: 'Cairo',
            body: 'Cairo',
            size: {
              small: '14px',
              medium: '16px',
              large: '18px',
              xlarge: '24px',
              ...storeData.customization?.fonts?.size
            },
            ...storeData.customization?.fonts
          },
          layout: {
            headerStyle: 'modern' as const,
            footerStyle: 'detailed' as const,
            productGridColumns: 4,
            containerWidth: 'normal' as const,
            borderRadius: 'medium' as const,
            spacing: 'normal' as const,
            ...storeData.customization?.layout
          },
          homepage: {
            showHeroSlider: true,
            showFeaturedProducts: true,
            showCategories: true,
            showNewsletter: true,
            showTestimonials: false,
            showStats: true,
            showBrands: false,
            heroImages: [],
            heroTexts: [
              { title: 'مرحباً بكم في متجرنا', subtitle: 'أفضل المنتجات بأسعار مميزة', buttonText: 'تسوق ال��ن' }
            ],
            sectionsOrder: ['hero', 'categories', 'featured', 'stats'],
            ...storeData.customization?.homepage
          },
          pages: {
            enableBlog: false,
            enableReviews: true,
            enableWishlist: true,
            enableCompare: false,
            enableLiveChat: false,
            enableFAQ: true,
            enableAboutUs: true,
            enableContactUs: true,
            ...storeData.customization?.pages
          },
          branding: {
            logo: '',
            favicon: '',
            watermark: '',
            showPoweredBy: true,
            ...storeData.customization?.branding
          },
          effects: {
            animations: true,
            transitions: true,
            shadows: true,
            gradients: true,
            ...storeData.customization?.effects
          }
        };

        setCustomization(safeCustomization);
      }
    } catch (error) {
      console.error('Error loading store:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!store) return;

    setSaving(true);
    try {
      const updatedStore = updateStore(store.id, {
        customization: customization
      });

      if (updatedStore) {
        setStore(updatedStore);

        // Force reload of store data across all tabs/windows
        window.postMessage({
          type: 'STORE_CUSTOMIZATION_UPDATED',
          storeId: store.id,
          customization: customization,
          timestamp: Date.now()
        }, '*');

        // Also trigger storage event for same-origin tabs
        localStorage.setItem('store_customization_sync', JSON.stringify({
          storeId: store.id,
          customization: customization,
          timestamp: Date.now()
        }));

        toast({
          title: 'تم حفظ التخصيصات بنجاح! 🎉',
          description: 'تم تطبيق التغييرات على متجرك. قم بتحديث صفحة المتجر لرؤية التغييرات.',
          action: {
            label: 'افتح المتجر',
            onClick: () => {
              window.open(`/store/${store.subdomain}?_t=${Date.now()}`, '_blank');
            }
          }
        });
      }
    } catch (error) {
      console.error('Error saving customization:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء حفظ التخصيصات',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setCustomization(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        primary: preset.primary,
        secondary: preset.secondary,
        accent: preset.accent
      }
    }));
  };

  const resetToDefaults = () => {
    setCustomization({
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        background: '#ffffff',
        text: '#1e293b',
        accent: '#3b82f6',
        headerBackground: '#ffffff',
        footerBackground: '#f8fafc',
        cardBackground: '#ffffff',
        borderColor: '#e5e7eb'
      },
      fonts: {
        heading: 'Cairo',
        body: 'Cairo',
        size: {
          small: '14px',
          medium: '16px',
          large: '18px',
          xlarge: '24px'
        }
      },
      layout: {
        headerStyle: 'modern',
        footerStyle: 'detailed',
        productGridColumns: 4,
        containerWidth: 'normal',
        borderRadius: 'medium',
        spacing: 'normal'
      },
      homepage: {
        showHeroSlider: true,
        showFeaturedProducts: true,
        showCategories: true,
        showNewsletter: true,
        showTestimonials: false,
        showStats: true,
        showBrands: false,
        heroImages: [],
        heroTexts: [
          { title: 'مرحباً بكم في متجرنا', subtitle: 'أفضل المنتجات بأسعار مميزة', buttonText: 'تسوق الآن' }
        ],
        sectionsOrder: ['hero', 'categories', 'featured', 'stats']
      },
      pages: {
        enableBlog: false,
        enableReviews: true,
        enableWishlist: true,
        enableCompare: false,
        enableLiveChat: false,
        enableFAQ: true,
        enableAboutUs: true,
        enableContactUs: true
      },
      branding: {
        logo: '',
        favicon: '',
        watermark: '',
        showPoweredBy: true
      },
      effects: {
        animations: true,
        transitions: true,
        shadows: true,
        gradients: true
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">لم يتم العثور على متجر</h1>
          <Button onClick={() => navigate('/merchant/dashboard')}>
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/merchant/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                العودة
              </Button>
              <div>
                <h1 className="text-2xl font-bold">تخصيص المتجر</h1>
                <p className="text-gray-600">{store.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Preview Mode Toggle */}
              <div className="flex border rounded-lg">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                  className="rounded-r-none"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('tablet')}
                  className="rounded-none"
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                  className="rounded-l-none"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                variant="outline"
                onClick={() => window.open(`/store/${store.subdomain}?preview=true`, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                معاينة
              </Button>
              
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customization Panel */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="colors" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="colors">
                  <Palette className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="fonts">
                  <Type className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="layout">
                  <Layout className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="pages">
                  <Home className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              {/* Colors Tab */}
              <TabsContent value="colors">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      ال��لوان
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Color Presets */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">قوالب الألوان</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {colorPresets.map((preset, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="h-auto p-3 flex flex-col items-start"
                            onClick={() => applyColorPreset(preset)}
                          >
                            <div className="flex gap-1 mb-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: preset.primary }}
                              ></div>
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: preset.secondary }}
                              ></div>
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: preset.accent }}
                              ></div>
                            </div>
                            <span className="text-xs">{preset.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Individual Colors */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="primary">اللون الأساسي</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="primary"
                            type="color"
                            value={customization.colors?.primary || '#2563eb'}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              colors: { ...prev.colors, primary: e.target.value }
                            }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={customization.colors?.primary || '#2563eb'}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              colors: { ...prev.colors, primary: e.target.value }
                            }))}
                            className="flex-1"
                            placeholder="#2563eb"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="secondary">اللون الثانوي</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="secondary"
                            type="color"
                            value={customization.colors?.secondary || '#64748b'}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              colors: { ...prev.colors, secondary: e.target.value }
                            }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={customization.colors?.secondary || '#64748b'}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              colors: { ...prev.colors, secondary: e.target.value }
                            }))}
                            className="flex-1"
                            placeholder="#64748b"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="accent">لون التمييز</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="accent"
                            type="color"
                            value={customization.colors?.accent || '#3b82f6'}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              colors: { ...prev.colors, accent: e.target.value }
                            }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={customization.colors?.accent || '#3b82f6'}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              colors: { ...prev.colors, accent: e.target.value }
                            }))}
                            className="flex-1"
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="background">لون الخلفية</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="background"
                            type="color"
                            value={customization.colors?.background || '#ffffff'}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              colors: { ...prev.colors, background: e.target.value }
                            }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={customization.colors?.background || '#ffffff'}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              colors: { ...prev.colors, background: e.target.value }
                            }))}
                            className="flex-1"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="text">لون النص</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="text"
                            type="color"
                            value={customization.colors?.text || '#1e293b'}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              colors: { ...prev.colors, text: e.target.value }
                            }))}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={customization.colors?.text || '#1e293b'}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              colors: { ...prev.colors, text: e.target.value }
                            }))}
                            className="flex-1"
                            placeholder="#1e293b"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Fonts Tab */}
              <TabsContent value="fonts">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5" />
                      الخطوط
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>خط العناوين</Label>
                      <Select
                        value={customization.fonts?.heading || 'Cairo'}
                        onValueChange={(value) => setCustomization(prev => ({
                          ...prev,
                          fonts: { ...prev.fonts, heading: value }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fontOptions.map(font => (
                            <SelectItem key={font.value} value={font.value}>
                              <span style={{ fontFamily: font.value }}>{font.preview}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>خط النصوص</Label>
                      <Select
                        value={customization.fonts?.body || 'Cairo'}
                        onValueChange={(value) => setCustomization(prev => ({
                          ...prev,
                          fonts: { ...prev.fonts, body: value }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fontOptions.map(font => (
                            <SelectItem key={font.value} value={font.value}>
                              <span style={{ fontFamily: font.value }}>{font.preview}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>حجم الخط الأساسي</Label>
                      <Select
                        value={customization.fonts?.size?.medium || '16px'}
                        onValueChange={(value) => setCustomization(prev => ({
                          ...prev,
                          fonts: {
                            ...prev.fonts,
                            size: { ...prev.fonts?.size, medium: value }
                          }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="14px">صغير (14px)</SelectItem>
                          <SelectItem value="16px">عادي (16px)</SelectItem>
                          <SelectItem value="18px">كبير (18px)</SelectItem>
                          <SelectItem value="20px">كبير جداً (20px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Layout Tab */}
              <TabsContent value="layout">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layout className="h-5 w-5" />
                      التخطيط
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>نمط الهيدر</Label>
                      <Select 
                        value={customization.layout?.headerStyle || 'modern'} 
                        onValueChange={(value: any) => setCustomization(prev => ({
                          ...prev,
                          layout: { ...prev.layout, headerStyle: value }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">عصري</SelectItem>
                          <SelectItem value="classic">كلاسيكي</SelectItem>
                          <SelectItem value="minimal">بسيط</SelectItem>
                          <SelectItem value="elegant">أنيق</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>نمط الفوتر</Label>
                      <Select 
                        value={customization.layout?.footerStyle || 'detailed'} 
                        onValueChange={(value: any) => setCustomization(prev => ({
                          ...prev,
                          layout: { ...prev.layout, footerStyle: value }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">بسيط</SelectItem>
                          <SelectItem value="detailed">مفصل</SelectItem>
                          <SelectItem value="compact">مضغوط</SelectItem>
                          <SelectItem value="mega">شامل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>عدد أعمدة المنتجات</Label>
                      <Select 
                        value={(customization.layout?.productGridColumns || 4).toString()} 
                        onValueChange={(value) => setCustomization(prev => ({
                          ...prev,
                          layout: { ...prev.layout, productGridColumns: parseInt(value) }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 أعمدة</SelectItem>
                          <SelectItem value="3">3 أعمدة</SelectItem>
                          <SelectItem value="4">4 أعمدة</SelectItem>
                          <SelectItem value="5">5 أعمدة</SelectItem>
                          <SelectItem value="6">6 أعمدة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>عرض الحاوية</Label>
                      <Select 
                        value={customization.layout?.containerWidth || 'normal'} 
                        onValueChange={(value: any) => setCustomization(prev => ({
                          ...prev,
                          layout: { ...prev.layout, containerWidth: value }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="narrow">ضيق</SelectItem>
                          <SelectItem value="normal">عادي</SelectItem>
                          <SelectItem value="wide">واسع</SelectItem>
                          <SelectItem value="full">كامل الشاشة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>نصف قطر الحواف</Label>
                      <Select 
                        value={customization.layout?.borderRadius || 'medium'} 
                        onValueChange={(value: any) => setCustomization(prev => ({
                          ...prev,
                          layout: { ...prev.layout, borderRadius: value }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون</SelectItem>
                          <SelectItem value="small">صغير</SelectItem>
                          <SelectItem value="medium">متوسط</SelectItem>
                          <SelectItem value="large">كبير</SelectItem>
                          <SelectItem value="full">دائري</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>المسافات</Label>
                      <Select 
                        value={customization.layout?.spacing || 'normal'} 
                        onValueChange={(value: any) => setCustomization(prev => ({
                          ...prev,
                          layout: { ...prev.layout, spacing: value }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tight">ضيقة</SelectItem>
                          <SelectItem value="normal">عادية</SelectItem>
                          <SelectItem value="relaxed">مريحة</SelectItem>
                          <SelectItem value="loose">واسعة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pages Tab */}
              <TabsContent value="pages">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      الصفحات والميزات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Homepage Sections */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">أقسام الصفحة الرئيسية</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="hero">قسم البطل</Label>
                          <Switch
                            id="hero"
                            checked={customization.homepage?.showHeroSlider || true}
                            onCheckedChange={(checked) => setCustomization(prev => ({
                              ...prev,
                              homepage: { ...prev.homepage, showHeroSlider: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="categories">الفئات</Label>
                          <Switch
                            id="categories"
                            checked={customization.homepage?.showCategories || true}
                            onCheckedChange={(checked) => setCustomization(prev => ({
                              ...prev,
                              homepage: { ...prev.homepage, showCategories: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="featured">المنتجات المميزة</Label>
                          <Switch
                            id="featured"
                            checked={customization.homepage?.showFeaturedProducts || true}
                            onCheckedChange={(checked) => setCustomization(prev => ({
                              ...prev,
                              homepage: { ...prev.homepage, showFeaturedProducts: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="stats">الإحصائيات</Label>
                          <Switch
                            id="stats"
                            checked={customization.homepage?.showStats || true}
                            onCheckedChange={(checked) => setCustomization(prev => ({
                              ...prev,
                              homepage: { ...prev.homepage, showStats: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="newsletter">النشرة الإخبارية</Label>
                          <Switch
                            id="newsletter"
                            checked={customization.homepage?.showNewsletter || true}
                            onCheckedChange={(checked) => setCustomization(prev => ({
                              ...prev,
                              homepage: { ...prev.homepage, showNewsletter: checked }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Pages Features */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">ميزات الصفحات</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="reviews">التقييمات</Label>
                          <Switch
                            id="reviews"
                            checked={customization.pages?.enableReviews || true}
                            onCheckedChange={(checked) => setCustomization(prev => ({
                              ...prev,
                              pages: { ...prev.pages, enableReviews: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="wishlist">قائمة الأمنيات</Label>
                          <Switch
                            id="wishlist"
                            checked={customization.pages?.enableWishlist || true}
                            onCheckedChange={(checked) => setCustomization(prev => ({
                              ...prev,
                              pages: { ...prev.pages, enableWishlist: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="compare">مقارنة المنتجات</Label>
                          <Switch
                            id="compare"
                            checked={customization.pages?.enableCompare || false}
                            onCheckedChange={(checked) => setCustomization(prev => ({
                              ...prev,
                              pages: { ...prev.pages, enableCompare: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="faq">الأسئلة الشائعة</Label>
                          <Switch
                            id="faq"
                            checked={customization.pages?.enableFAQ || true}
                            onCheckedChange={(checked) => setCustomization(prev => ({
                              ...prev,
                              pages: { ...prev.pages, enableFAQ: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="about">من نحن</Label>
                          <Switch
                            id="about"
                            checked={customization.pages?.enableAboutUs || true}
                            onCheckedChange={(checked) => setCustomization(prev => ({
                              ...prev,
                              pages: { ...prev.pages, enableAboutUs: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="contact">اتصل بنا</Label>
                          <Switch
                            id="contact"
                            checked={customization.pages?.enableContactUs || true}
                            onCheckedChange={(checked) => setCustomization(prev => ({
                              ...prev,
                              pages: { ...prev.pages, enableContactUs: checked }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Effects */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">التأثيرات المرئية</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="animations">الحركات</Label>
                          <Switch
                            id="animations"
                            checked={customization.effects?.animations || true}
                            onCheckedChange={(checked) => setCustomization(prev => ({
                              ...prev,
                              effects: { ...prev.effects, animations: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="shadows">الظلال</Label>
                          <Switch
                            id="shadows"
                            checked={customization.effects?.shadows || true}
                            onCheckedChange={(checked) => setCustomization(prev => ({
                              ...prev,
                              effects: { ...prev.effects, shadows: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="gradients">التدرجات</Label>
                          <Switch
                            id="gradients"
                            checked={customization.effects?.gradients || true}
                            onCheckedChange={(checked) => setCustomization(prev => ({
                              ...prev,
                              effects: { ...prev.effects, gradients: checked }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Reset Button */}
            <Button 
              variant="outline" 
              onClick={resetToDefaults}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              إعادة تعيين لل��فتراضي
            </Button>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    معاينة مباشرة
                  </CardTitle>
                  <Badge variant="outline">{previewMode}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={`/store/${store.subdomain}?preview=true&customization=${encodeURIComponent(JSON.stringify(customization))}&_t=${Date.now()}`}
                    className={`w-full border-0 ${
                      previewMode === 'desktop' ? 'h-[800px]' :
                      previewMode === 'tablet' ? 'h-[600px] max-w-md mx-auto' :
                      'h-[600px] max-w-sm mx-auto'
                    }`}
                    title="معاينة المتجر"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
