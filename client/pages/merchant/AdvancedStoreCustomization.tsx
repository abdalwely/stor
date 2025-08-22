import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  storeService,
  Store
} from '@/lib/firestore';
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
  ArrowLeft,
  Plus,
  X,
  Upload,
  Settings,
  ShoppingBag,
  Search,
  User,
  Menu,
  Heart,
  Star,
  Phone,
  Mail,
  MapPin,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from 'lucide-react';

const colorPresets = [
  { name: 'الأزرق الكلاسيكي', primary: '#2563eb', secondary: '#64748b', accent: '#3b82f6', background: '#ffffff', text: '#1e293b' },
  { name: 'الأخضر الطبيعي', primary: '#16a34a', secondary: '#6b7280', accent: '#22c55e', background: '#ffffff', text: '#1e293b' },
  { name: 'البرتقالي النشط', primary: '#ea580c', secondary: '#71717a', accent: '#fb923c', background: '#ffffff', text: '#1e293b' },
  { name: 'البنفسجي العصري', primary: '#7c3aed', secondary: '#6b7280', accent: '#a855f7', background: '#ffffff', text: '#1e293b' },
  { name: 'الوردي الأنيق', primary: '#ec4899', secondary: '#64748b', accent: '#f472b6', background: '#ffffff', text: '#1e293b' },
  { name: 'الذهبي الفاخر', primary: '#d97706', secondary: '#78716c', accent: '#f59e0b', background: '#ffffff', text: '#1e293b' },
  { name: 'الأسود الأنيق', primary: '#000000', secondary: '#374151', accent: '#4b5563', background: '#ffffff', text: '#1e293b' },
  { name: 'الداكن الحديث', primary: '#ffffff', secondary: '#9ca3af', accent: '#60a5fa', background: '#1f2937', text: '#ffffff' }
];

const fontOptions = [
  { name: 'Cairo', value: 'Cairo', preview: 'Cairo - خط عربي حديث وواضح' },
  { name: 'Amiri', value: 'Amiri', preview: 'Amiri - خط عربي تقليدي أنيق' },
  { name: 'Noto Sans Arabic', value: 'Noto Sans Arabic', preview: 'Noto Sans Arabic - خط واضح للقراءة' },
  { name: 'Tajawal', value: 'Tajawal', preview: 'Tajawal - خط عصري ومتوازن' },
  { name: 'Almarai', value: 'Almarai', preview: 'Almarai - خط بسيط وأنيق' },
  { name: 'IBM Plex Sans Arabic', value: 'IBM Plex Sans Arabic', preview: 'IBM Plex - خط تقني احترافي' }
];

const headerLayouts = [
  { id: 'modern', name: 'عصري', description: 'تصميم بسيط ونظيف' },
  { id: 'classic', name: 'كلاسيكي', description: 'تصميم تقليدي وأنيق' },
  { id: 'minimal', name: 'مينيمال', description: 'تصم��م بسيط جداً' },
  { id: 'bold', name: 'جريء', description: 'تصميم قوي وبارز' },
  { id: 'elegant', name: 'أنيق', description: 'تصميم راقي ومتطور' }
];

const socialPlatforms = [
  { id: 'facebook', name: 'فيسبوك', icon: Facebook, placeholder: 'https://facebook.com/your-page' },
  { id: 'twitter', name: 'تويتر', icon: Twitter, placeholder: 'https://twitter.com/your-handle' },
  { id: 'instagram', name: 'انستغرام', icon: Instagram, placeholder: 'https://instagram.com/your-profile' },
  { id: 'youtube', name: 'يوتيوب', icon: Youtube, placeholder: 'https://youtube.com/your-channel' }
];

export default function AdvancedStoreCustomization() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState('colors');
  
  const [storeData, setStoreData] = useState({
    name: '',
    description: '',
    customization: {
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        background: '#ffffff',
        text: '#1e293b',
        accent: '#3b82f6',
        success: '#16a34a',
        warning: '#f59e0b',
        error: '#dc2626',
        muted: '#f8fafc',
        border: '#e2e8f0',
        headerBackground: '#ffffff',
        footerBackground: '#1e293b',
        cardBackground: '#ffffff',
        buttonPrimary: '#2563eb',
        buttonSecondary: '#6b7280'
      },
      fonts: {
        primary: 'Cairo',
        secondary: 'Inter',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        },
        weights: {
          light: '300',
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700'
        }
      },
      header: {
        layout: 'modern',
        showLogo: true,
        showSearch: true,
        showCart: true,
        showAccount: true,
        showLanguage: false,
        showSocial: false,
        sticky: true,
        transparent: false,
        showCategories: true,
        showPhone: true,
        showEmail: false,
        logoPosition: 'right',
        menuStyle: 'horizontal',
        height: 'normal',
        topBar: {
          enabled: true,
          showDeliveryInfo: true,
          showPhone: true,
          showEmail: false,
          showSocial: true,
          backgroundColor: '#f8fafc',
          textColor: '#64748b'
        }
      },
      footer: {
        layout: 'detailed',
        showLogo: true,
        showSocial: true,
        showPaymentMethods: true,
        showCopyright: true,
        showLinks: true,
        showNewsletter: true,
        showContact: true,
        backgroundColor: '#1e293b',
        textColor: '#ffffff',
        columns: 4,
        customSections: []
      },
      homepage: {
        showHeroSlider: true,
        showFeaturedProducts: true,
        showCategories: true,
        showNewsletter: true,
        showTestimonials: true,
        showStats: true,
        showBrands: false,
        showBlog: false,
        heroStyle: 'slider',
        heroTexts: [
          { 
            title: 'مرحباً بكم في متجرنا', 
            subtitle: 'أفضل المنتجات بأسعار مميزة', 
            buttonText: 'تسوق الآن',
            buttonLink: '/products',
            image: ''
          }
        ],
        sectionsOrder: ['hero', 'categories', 'featured', 'stats', 'testimonials', 'newsletter']
      },
      product: {
        cardStyle: 'modern',
        showRating: true,
        showReviews: true,
        showSalesBadge: true,
        showWishlist: true,
        showQuickView: true,
        showCompare: false,
        gridColumns: {
          desktop: 4,
          tablet: 3,
          mobile: 2
        },
        hoverEffect: 'lift',
        imageAspectRatio: 'square'
      },
      layout: {
        containerWidth: 'wide',
        borderRadius: 'medium',
        spacing: 'normal',
        shadows: true,
        animations: true,
        transitions: true
      },
      social: {
        facebook: '',
        twitter: '',
        instagram: '',
        youtube: '',
        linkedin: '',
        snapchat: '',
        tiktok: '',
        whatsapp: ''
      },
      seo: {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        ogImage: '',
        structuredData: true,
        sitemap: true,
        robotsTxt: true
      },
      tracking: {
        googleAnalytics: '',
        facebookPixel: '',
        snapchatPixel: '',
        tiktokPixel: '',
        hotjar: '',
        customCode: ''
      }
    },
    contact: {
      phone: '',
      email: '',
      address: '',
      city: '',
      website: '',
      workingHours: {
        enabled: false,
        schedule: [
          { day: 'sunday', open: '09:00', close: '18:00', closed: false },
          { day: 'monday', open: '09:00', close: '18:00', closed: false },
          { day: 'tuesday', open: '09:00', close: '18:00', closed: false },
          { day: 'wednesday', open: '09:00', close: '18:00', closed: false },
          { day: 'thursday', open: '09:00', close: '18:00', closed: false },
          { day: 'friday', open: '14:00', close: '18:00', closed: false },
          { day: 'saturday', open: '09:00', close: '18:00', closed: true }
        ]
      }
    }
  });

  useEffect(() => {
    loadStoreData();
  }, [userData]);

  const loadStoreData = async () => {
    if (!userData?.uid) return;

    try {
      setLoading(true);
      console.log('📝 Loading store data for user:', userData.uid);

      const stores = await storeService.getByOwner(userData.uid);
      if (stores.length > 0) {
        const storeData = stores[0];
        setStore(storeData);
        
        // تحديث بيانات التخصيص
        setStoreData(prev => ({
          ...prev,
          name: storeData.name || '',
          description: storeData.description || '',
          customization: {
            ...prev.customization,
            ...storeData.customization,
            colors: {
              ...prev.customization.colors,
              ...storeData.customization?.colors
            },
            fonts: {
              ...prev.customization.fonts,
              ...storeData.customization?.fonts
            },
            header: {
              ...prev.customization.header,
              ...storeData.customization?.header
            },
            footer: {
              ...prev.customization.footer,
              ...storeData.customization?.footer
            },
            homepage: {
              ...prev.customization.homepage,
              ...storeData.customization?.homepage
            },
            social: {
              ...prev.customization.social,
              ...storeData.customization?.social
            }
          },
          contact: {
            ...prev.contact,
            ...storeData.contact
          }
        }));

        console.log('✅ Store data loaded successfully');
      } else {
        console.log('⚠️ No store found for user');
        toast({
          title: 'تحذير',
          description: 'لا يوجد متجر مرتبط بحسابك',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('❌ Error loading store data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات المتجر',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!store) return;

    try {
      setSaving(true);
      console.log('💾 Saving store customization...');

      await storeService.update(store.id, {
        name: storeData.name,
        description: storeData.description,
        customization: storeData.customization,
        contact: storeData.contact,
        updatedAt: new Date()
      });

      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ تخصيصات المتجر بنجاح ✨',
        variant: 'default'
      });

      console.log('✅ Store customization saved successfully');
    } catch (error) {
      console.error('❌ Error saving store customization:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ التخصيصات',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setStoreData(prev => ({
      ...prev,
      customization: {
        ...prev.customization,
        colors: {
          ...prev.customization.colors,
          primary: preset.primary,
          secondary: preset.secondary,
          accent: preset.accent,
          background: preset.background,
          text: preset.text,
          buttonPrimary: preset.primary,
          headerBackground: preset.background,
          cardBackground: preset.background
        }
      }
    }));
  };

  const addHeroSlide = () => {
    setStoreData(prev => ({
      ...prev,
      customization: {
        ...prev.customization,
        homepage: {
          ...prev.customization.homepage,
          heroTexts: [
            ...prev.customization.homepage.heroTexts,
            {
              title: 'شريحة جديدة',
              subtitle: 'وصف الشريحة',
              buttonText: 'اقرأ المزيد',
              buttonLink: '',
              image: ''
            }
          ]
        }
      }
    }));
  };

  const removeHeroSlide = (index: number) => {
    setStoreData(prev => ({
      ...prev,
      customization: {
        ...prev.customization,
        homepage: {
          ...prev.customization.homepage,
          heroTexts: prev.customization.homepage.heroTexts.filter((_, i) => i !== index)
        }
      }
    }));
  };

  const updateHeroSlide = (index: number, field: string, value: string) => {
    setStoreData(prev => ({
      ...prev,
      customization: {
        ...prev.customization,
        homepage: {
          ...prev.customization.homepage,
          heroTexts: prev.customization.homepage.heroTexts.map((slide, i) => 
            i === index ? { ...slide, [field]: value } : slide
          )
        }
      }
    }));
  };

  const openStorePreview = () => {
    if (store) {
      const previewUrl = `/store/${store.subdomain}`;
      window.open(previewUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل إعدادات التخصيص...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/merchant/dashboard')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة للوحة التحكم
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">تخصيص المتجر المتقدم</h1>
            <p className="text-gray-600 mt-1">خصص مظهر وتخطيط متجرك بالكامل</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border">
            <Button
              size="sm"
              variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
              onClick={() => setPreviewDevice('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={previewDevice === 'tablet' ? 'default' : 'ghost'}
              onClick={() => setPreviewDevice('tablet')}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
              onClick={() => setPreviewDevice('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={openStorePreview} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            معاينة المتجر
          </Button>
          
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات التخصيص
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="colors">الألوان</TabsTrigger>
                  <TabsTrigger value="layout">التخطيط</TabsTrigger>
                </TabsList>
                
                <TabsContent value="colors" className="space-y-6 mt-6">
                  {/* Color Presets */}
                  <div>
                    <Label className="text-sm font-medium">القوالب الجاهزة</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {colorPresets.map((preset, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg border cursor-pointer hover:border-primary transition-colors"
                          onClick={() => applyColorPreset(preset)}
                        >
                          <div className="flex gap-1 mb-2">
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: preset.secondary }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: preset.accent }}
                            />
                          </div>
                          <p className="text-xs font-medium">{preset.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Custom Colors */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">الألوان المخصصة</Label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primary-color" className="text-xs">اللون الأساسي</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="primary-color"
                            type="color"
                            value={storeData.customization.colors.primary}
                            onChange={(e) => setStoreData(prev => ({
                              ...prev,
                              customization: {
                                ...prev.customization,
                                colors: {
                                  ...prev.customization.colors,
                                  primary: e.target.value,
                                  buttonPrimary: e.target.value
                                }
                              }
                            }))}
                            className="w-12 h-8 p-1 rounded border"
                          />
                          <Input
                            type="text"
                            value={storeData.customization.colors.primary}
                            onChange={(e) => setStoreData(prev => ({
                              ...prev,
                              customization: {
                                ...prev.customization,
                                colors: {
                                  ...prev.customization.colors,
                                  primary: e.target.value,
                                  buttonPrimary: e.target.value
                                }
                              }
                            }))}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="secondary-color" className="text-xs">اللون الثانوي</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="secondary-color"
                            type="color"
                            value={storeData.customization.colors.secondary}
                            onChange={(e) => setStoreData(prev => ({
                              ...prev,
                              customization: {
                                ...prev.customization,
                                colors: {
                                  ...prev.customization.colors,
                                  secondary: e.target.value
                                }
                              }
                            }))}
                            className="w-12 h-8 p-1 rounded border"
                          />
                          <Input
                            type="text"
                            value={storeData.customization.colors.secondary}
                            onChange={(e) => setStoreData(prev => ({
                              ...prev,
                              customization: {
                                ...prev.customization,
                                colors: {
                                  ...prev.customization.colors,
                                  secondary: e.target.value
                                }
                              }
                            }))}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="background-color" className="text-xs">لون الخلفية</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="background-color"
                            type="color"
                            value={storeData.customization.colors.background}
                            onChange={(e) => setStoreData(prev => ({
                              ...prev,
                              customization: {
                                ...prev.customization,
                                colors: {
                                  ...prev.customization.colors,
                                  background: e.target.value,
                                  headerBackground: e.target.value,
                                  cardBackground: e.target.value
                                }
                              }
                            }))}
                            className="w-12 h-8 p-1 rounded border"
                          />
                          <Input
                            type="text"
                            value={storeData.customization.colors.background}
                            onChange={(e) => setStoreData(prev => ({
                              ...prev,
                              customization: {
                                ...prev.customization,
                                colors: {
                                  ...prev.customization.colors,
                                  background: e.target.value,
                                  headerBackground: e.target.value,
                                  cardBackground: e.target.value
                                }
                              }
                            }))}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="text-color" className="text-xs">لون النص</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id="text-color"
                            type="color"
                            value={storeData.customization.colors.text}
                            onChange={(e) => setStoreData(prev => ({
                              ...prev,
                              customization: {
                                ...prev.customization,
                                colors: {
                                  ...prev.customization.colors,
                                  text: e.target.value
                                }
                              }
                            }))}
                            className="w-12 h-8 p-1 rounded border"
                          />
                          <Input
                            type="text"
                            value={storeData.customization.colors.text}
                            onChange={(e) => setStoreData(prev => ({
                              ...prev,
                              customization: {
                                ...prev.customization,
                                colors: {
                                  ...prev.customization.colors,
                                  text: e.target.value
                                }
                              }
                            }))}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Fonts */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">الخطوط</Label>
                    
                    <div>
                      <Label htmlFor="primary-font" className="text-xs">الخط الأساسي</Label>
                      <Select
                        value={storeData.customization.fonts.primary}
                        onValueChange={(value) => setStoreData(prev => ({
                          ...prev,
                          customization: {
                            ...prev.customization,
                            fonts: {
                              ...prev.customization.fonts,
                              primary: value
                            }
                          }
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              <div className="text-right">
                                <div className="font-medium">{font.name}</div>
                                <div className="text-xs text-gray-500">{font.preview}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="layout" className="space-y-6 mt-6">
                  {/* Header Layout */}
                  <div>
                    <Label className="text-sm font-medium">تخطيط الهيدر</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {headerLayouts.map((layout) => (
                        <div
                          key={layout.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            storeData.customization.header.layout === layout.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-primary/50'
                          }`}
                          onClick={() => setStoreData(prev => ({
                            ...prev,
                            customization: {
                              ...prev.customization,
                              header: {
                                ...prev.customization.header,
                                layout: layout.id
                              }
                            }
                          }))}
                        >
                          <div className="font-medium text-sm">{layout.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{layout.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Header Options */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">خيارات الهيدر</Label>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-search" className="text-xs">إظهار البحث</Label>
                        <Switch
                          id="show-search"
                          checked={storeData.customization.header.showSearch}
                          onCheckedChange={(checked) => setStoreData(prev => ({
                            ...prev,
                            customization: {
                              ...prev.customization,
                              header: {
                                ...prev.customization.header,
                                showSearch: checked
                              }
                            }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-cart" className="text-xs">إظهار السلة</Label>
                        <Switch
                          id="show-cart"
                          checked={storeData.customization.header.showCart}
                          onCheckedChange={(checked) => setStoreData(prev => ({
                            ...prev,
                            customization: {
                              ...prev.customization,
                              header: {
                                ...prev.customization.header,
                                showCart: checked
                              }
                            }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-account" className="text-xs">إظهار الحساب</Label>
                        <Switch
                          id="show-account"
                          checked={storeData.customization.header.showAccount}
                          onCheckedChange={(checked) => setStoreData(prev => ({
                            ...prev,
                            customization: {
                              ...prev.customization,
                              header: {
                                ...prev.customization.header,
                                showAccount: checked
                              }
                            }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="sticky-header" className="text-xs">هيدر ثابت</Label>
                        <Switch
                          id="sticky-header"
                          checked={storeData.customization.header.sticky}
                          onCheckedChange={(checked) => setStoreData(prev => ({
                            ...prev,
                            customization: {
                              ...prev.customization,
                              header: {
                                ...prev.customization.header,
                                sticky: checked
                              }
                            }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-categories" className="text-xs">إظهار الفئات</Label>
                        <Switch
                          id="show-categories"
                          checked={storeData.customization.header.showCategories}
                          onCheckedChange={(checked) => setStoreData(prev => ({
                            ...prev,
                            customization: {
                              ...prev.customization,
                              header: {
                                ...prev.customization.header,
                                showCategories: checked
                              }
                            }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-phone" className="text-xs">إظهار رقم الهاتف</Label>
                        <Switch
                          id="show-phone"
                          checked={storeData.customization.header.showPhone}
                          onCheckedChange={(checked) => setStoreData(prev => ({
                            ...prev,
                            customization: {
                              ...prev.customization,
                              header: {
                                ...prev.customization.header,
                                showPhone: checked
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Homepage Sections */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">أقسام الصفحة الرئيسية</Label>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-hero" className="text-xs">عرض البانر الرئيسي</Label>
                        <Switch
                          id="show-hero"
                          checked={storeData.customization.homepage.showHeroSlider}
                          onCheckedChange={(checked) => setStoreData(prev => ({
                            ...prev,
                            customization: {
                              ...prev.customization,
                              homepage: {
                                ...prev.customization.homepage,
                                showHeroSlider: checked
                              }
                            }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-featured" className="text-xs">المنتجات المميزة</Label>
                        <Switch
                          id="show-featured"
                          checked={storeData.customization.homepage.showFeaturedProducts}
                          onCheckedChange={(checked) => setStoreData(prev => ({
                            ...prev,
                            customization: {
                              ...prev.customization,
                              homepage: {
                                ...prev.customization.homepage,
                                showFeaturedProducts: checked
                              }
                            }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-categories-home" className="text-xs">عرض الفئات</Label>
                        <Switch
                          id="show-categories-home"
                          checked={storeData.customization.homepage.showCategories}
                          onCheckedChange={(checked) => setStoreData(prev => ({
                            ...prev,
                            customization: {
                              ...prev.customization,
                              homepage: {
                                ...prev.customization.homepage,
                                showCategories: checked
                              }
                            }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-newsletter" className="text-xs">النشرة البريدية</Label>
                        <Switch
                          id="show-newsletter"
                          checked={storeData.customization.homepage.showNewsletter}
                          onCheckedChange={(checked) => setStoreData(prev => ({
                            ...prev,
                            customization: {
                              ...prev.customization,
                              homepage: {
                                ...prev.customization.homepage,
                                showNewsletter: checked
                              }
                            }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-testimonials" className="text-xs">آراء العملاء</Label>
                        <Switch
                          id="show-testimonials"
                          checked={storeData.customization.homepage.showTestimonials}
                          onCheckedChange={(checked) => setStoreData(prev => ({
                            ...prev,
                            customization: {
                              ...prev.customization,
                              homepage: {
                                ...prev.customization.homepage,
                                showTestimonials: checked
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                معلومات التواصل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="store-phone">رقم الهاتف</Label>
                <Input
                  id="store-phone"
                  value={storeData.contact.phone}
                  onChange={(e) => setStoreData(prev => ({
                    ...prev,
                    contact: {
                      ...prev.contact,
                      phone: e.target.value
                    }
                  }))}
                  placeholder="966501234567"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="store-email">البريد الإلكتروني</Label>
                <Input
                  id="store-email"
                  type="email"
                  value={storeData.contact.email}
                  onChange={(e) => setStoreData(prev => ({
                    ...prev,
                    contact: {
                      ...prev.contact,
                      email: e.target.value
                    }
                  }))}
                  placeholder="info@store.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="store-address">العنوان</Label>
                <Textarea
                  id="store-address"
                  value={storeData.contact.address}
                  onChange={(e) => setStoreData(prev => ({
                    ...prev,
                    contact: {
                      ...prev.contact,
                      address: e.target.value
                    }
                  }))}
                  placeholder="الرياض، المملكة العربية السعودية"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                شبكات التواصل الاجتماعي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialPlatforms.map((platform) => (
                <div key={platform.id}>
                  <Label htmlFor={`social-${platform.id}`} className="flex items-center gap-2">
                    <platform.icon className="h-4 w-4" />
                    {platform.name}
                  </Label>
                  <Input
                    id={`social-${platform.id}`}
                    value={storeData.customization.social[platform.id] || ''}
                    onChange={(e) => setStoreData(prev => ({
                      ...prev,
                      customization: {
                        ...prev.customization,
                        social: {
                          ...prev.customization.social,
                          [platform.id]: e.target.value
                        }
                      }
                    }))}
                    placeholder={platform.placeholder}
                    className="mt-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                معاينة المتجر - {previewDevice === 'desktop' ? 'سطح المكتب' : previewDevice === 'tablet' ? 'تابلت' : 'جوال'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`mx-auto border rounded-lg overflow-hidden ${
                previewDevice === 'desktop' ? 'w-full' : 
                previewDevice === 'tablet' ? 'w-3/4' : 'w-1/3'
              }`}>
                <div 
                  className="bg-white"
                  style={{
                    backgroundColor: storeData.customization.colors.background,
                    color: storeData.customization.colors.text,
                    fontFamily: storeData.customization.fonts.primary
                  }}
                >
                  {/* Preview Header */}
                  <div 
                    className="border-b px-6 py-4"
                    style={{
                      backgroundColor: storeData.customization.colors.headerBackground,
                      borderColor: storeData.customization.colors.border
                    }}
                  >
                    <div className="flex items-center justify-between">
                      {/* Logo Area */}
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: storeData.customization.colors.primary }}
                        >
                          {storeData.name?.charAt(0) || 'م'}
                        </div>
                        <div>
                          <h1 className="font-bold text-lg">{storeData.name || 'اسم المتجر'}</h1>
                          {storeData.description && (
                            <p className="text-sm opacity-75">{storeData.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-4">
                        {storeData.customization.header.showSearch && (
                          <div className="flex items-center">
                            <Search className="h-4 w-4 opacity-50" />
                          </div>
                        )}
                        {storeData.customization.header.showCart && (
                          <div className="flex items-center">
                            <ShoppingBag className="h-4 w-4 opacity-50" />
                          </div>
                        )}
                        {storeData.customization.header.showAccount && (
                          <div className="flex items-center">
                            <User className="h-4 w-4 opacity-50" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Categories */}
                    {storeData.customization.header.showCategories && (
                      <div className="flex items-center gap-6 mt-4 pt-4 border-t" style={{ borderColor: storeData.customization.colors.border }}>
                        <span className="text-sm font-medium">الفئات</span>
                        <span className="text-sm opacity-75">الإلكترونيات</span>
                        <span className="text-sm opacity-75">الملابس</span>
                        <span className="text-sm opacity-75">المنزل</span>
                      </div>
                    )}

                    {/* Contact Info */}
                    {storeData.customization.header.showPhone && storeData.contact.phone && (
                      <div className="flex items-center gap-4 mt-2">
                        <Phone className="h-4 w-4 opacity-50" />
                        <span className="text-sm">{storeData.contact.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Preview Content */}
                  <div className="p-6">
                    {/* Hero Section */}
                    {storeData.customization.homepage.showHeroSlider && (
                      <div className="mb-8">
                        <div 
                          className="rounded-lg p-8 text-center text-white"
                          style={{ backgroundColor: storeData.customization.colors.primary }}
                        >
                          <h2 className="text-2xl font-bold mb-2">
                            {storeData.customization.homepage.heroTexts[0]?.title || 'مرحباً بكم في متجرنا'}
                          </h2>
                          <p className="mb-4 opacity-90">
                            {storeData.customization.homepage.heroTexts[0]?.subtitle || 'أفضل المنتجات بأسعار مميزة'}
                          </p>
                          <div 
                            className="inline-block px-6 py-2 rounded-lg font-medium"
                            style={{ 
                              backgroundColor: storeData.customization.colors.accent,
                              color: storeData.customization.colors.background 
                            }}
                          >
                            {storeData.customization.homepage.heroTexts[0]?.buttonText || 'تسوق الآن'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Categories Section */}
                    {storeData.customization.homepage.showCategories && (
                      <div className="mb-8">
                        <h3 className="text-xl font-bold mb-4">الفئات الرئيسية</h3>
                        <div className="grid grid-cols-4 gap-4">
                          {['الإلكترونيات', 'الملابس', 'المنزل', 'الجمال'].map((category, index) => (
                            <div 
                              key={index}
                              className="p-4 rounded-lg text-center border hover:shadow-lg transition-shadow cursor-pointer"
                              style={{ borderColor: storeData.customization.colors.border }}
                            >
                              <div 
                                className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                                style={{ backgroundColor: `${storeData.customization.colors.primary}20` }}
                              >
                                <Package className="h-6 w-6" style={{ color: storeData.customization.colors.primary }} />
                              </div>
                              <span className="text-sm font-medium">{category}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Featured Products */}
                    {storeData.customization.homepage.showFeaturedProducts && (
                      <div className="mb-8">
                        <h3 className="text-xl font-bold mb-4">المنتجات المميزة</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {[1, 2, 3].map((product) => (
                            <div 
                              key={product}
                              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                              style={{ borderColor: storeData.customization.colors.border }}
                            >
                              <div 
                                className="h-32 flex items-center justify-center"
                                style={{ backgroundColor: storeData.customization.colors.muted }}
                              >
                                <Package className="h-8 w-8 opacity-50" />
                              </div>
                              <div className="p-3">
                                <h4 className="font-medium text-sm mb-1">منتج رقم {product}</h4>
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="font-bold"
                                    style={{ color: storeData.customization.colors.primary }}
                                  >
                                    {99 * product} ريال
                                  </span>
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 fill-current text-yellow-400" />
                                    <span className="text-xs opacity-75 mr-1">4.5</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Newsletter */}
                    {storeData.customization.homepage.showNewsletter && (
                      <div className="mb-8">
                        <div 
                          className="rounded-lg p-6 text-center"
                          style={{ backgroundColor: `${storeData.customization.colors.primary}10` }}
                        >
                          <h3 className="text-lg font-bold mb-2">اشترك في النشرة البريدية</h3>
                          <p className="text-sm opacity-75 mb-4">احصل على أحدث العروض والمنتجات</p>
                          <div className="flex gap-2 max-w-sm mx-auto">
                            <Input placeholder="البريد الإلكتروني" className="text-sm" />
                            <Button 
                              size="sm"
                              style={{ backgroundColor: storeData.customization.colors.primary }}
                            >
                              اشتراك
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preview Footer */}
                  <div 
                    className="border-t px-6 py-8 text-center"
                    style={{
                      backgroundColor: storeData.customization.footer?.backgroundColor || '#1e293b',
                      color: storeData.customization.footer?.textColor || '#ffffff',
                      borderColor: storeData.customization.colors.border
                    }}
                  >
                    <div className="grid grid-cols-3 gap-6 mb-6 text-sm">
                      <div>
                        <h4 className="font-medium mb-2">المتجر</h4>
                        <p className="opacity-75">عن المتجر</p>
                        <p className="opacity-75">سياسة الإرجاع</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">التواصل</h4>
                        {storeData.contact.phone && (
                          <p className="opacity-75">{storeData.contact.phone}</p>
                        )}
                        {storeData.contact.email && (
                          <p className="opacity-75">{storeData.contact.email}</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">تابعنا</h4>
                        <div className="flex items-center justify-center gap-2">
                          {Object.entries(storeData.customization.social).filter(([_, url]) => url).map(([platform]) => (
                            <div key={platform} className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                              <span className="text-xs">{platform.charAt(0).toUpperCase()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs opacity-75">
                      © 2024 {storeData.name || 'المتجر'}. جميع الحقوق محفوظة.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hero Slides Configuration */}
          {storeData.customization.homepage.showHeroSlider && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    إعداد البانر الرئيسي
                  </div>
                  <Button size="sm" onClick={addHeroSlide}>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة شريحة
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {storeData.customization.homepage.heroTexts.map((slide, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">الشريحة {index + 1}</h4>
                        {storeData.customization.homepage.heroTexts.length > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeHeroSlide(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>العنوان الرئيسي</Label>
                          <Input
                            value={slide.title}
                            onChange={(e) => updateHeroSlide(index, 'title', e.target.value)}
                            placeholder="مرحباً بكم في متجرنا"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label>النص الفرعي</Label>
                          <Input
                            value={slide.subtitle}
                            onChange={(e) => updateHeroSlide(index, 'subtitle', e.target.value)}
                            placeholder="أفضل المنتجات بأسعار مميزة"
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>نص الزر</Label>
                            <Input
                              value={slide.buttonText}
                              onChange={(e) => updateHeroSlide(index, 'buttonText', e.target.value)}
                              placeholder="تسوق الآن"
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label>رابط الزر</Label>
                            <Input
                              value={slide.buttonLink || ''}
                              onChange={(e) => updateHeroSlide(index, 'buttonLink', e.target.value)}
                              placeholder="/products"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
