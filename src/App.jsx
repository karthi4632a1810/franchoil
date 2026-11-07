import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import useAuth, { AuthProvider } from "./hooks/useAuth";
import Header from './sections/Header';
import Footer from './sections/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import { useVisitTracker } from "./hooks/useVisitTracker";
import { cleanupExpiredImages } from "./utils/imageCache";
import { trackPageView, initPixelWithUser } from "./utils/metaPixel";
import MaintenanceScreen from "./components/MaintenanceScreen";
import {
  hasMaintenanceBypass,
  isMaintenanceEnabled,
} from "./utils/maintenanceAccess";
import '@fontsource/amarante';
import '@fontsource/poppins';
import '@fontsource/quando';
import '@fontsource/ruwudu';

// ─── Module-level constants (never re-created on render) ──────────────────────
const META_MAP = new Map([
  ["/", { title: "Buy Natural Ayurvedic Oil for Joint Pain relief Online", description: "Order Franch Oil today! Trusted for 25+ years, it provides herbal, safe relief for joint, muscle & body pain. Available online now." }],
  ["/about", { title: "About franch global - Ayurvedic joint Pain Relief Expertise", description: "Discover Franch Oil's 25+ years of Ayurvedic expertise in delivering natural Ayurvedic solutions. Learn about our mission, expertise, & commitment to wellness." }],
  ["/products", { title: "Buy Franch Oil – Ayurvedic Pain Relief for Body & Joints", description: "Shop Franch Ayurvedic Oil for natural relief from joint, muscle & body pain. Trusted for 25+ years of herbal expertise. Order Franch Oil online today!" }],
  ["/products?category=Wellness", { title: "Ayurvedic Wellness Products – Natural Oils & Remedies | Franch Global", description: "Shop Franch Ayurvedic Oil online for natural joint & muscle pain relief. Trusted 25+ years of herbal expertise. Order your Franch Oil today!" }],
  ["/products?category=Soaps", { title: "Ayurvedic Soaps – Natural Health & Wellness | Franch Global", description: "Franch Ayurvedic Soaps provide gentle care for soft, healthy skin. 25+ years of herbal expertise ensure safe and natural skin wellness." }],
  ["/blogs", { title: "Franch Oil Blog – Ayurvedic Tips for Joint & Muscle Pain", description: "Read Franch Oil's blog for natural Ayurvedic remedies and herbal oil tips for joint and muscle pain. Trusted 25+ years of pain relief expertise." }],
  ["/faq", { title: "Franch Global - Frequently Asked Questions", description: "Find answers about Franch Ayurvedic Oil for joint & muscle pain. Trusted 25+ years in herbal expertise. Get the right product and order online today!" }],
  ["/contact", { title: "Contact Franch global – 25 Years of Pain Relief Expertise", description: "Contact Franch Oil – 25 Years of Ayurvedic Pain Relief Expertise" }],
  ["/login", { title: "Login – Access Your Franch Global Account", description: "Sign in to manage your Ayurvedic product orders, track shipping, and explore health solutions." }],
  ["/user/login", { title: "Login – Access Your Franch Global Account", description: "Sign in to manage your Ayurvedic product orders, track shipping, and explore health solutions." }],
  ["/dashboard", { title: "Checkout Franch Oil – Ayurvedic Pain Relief for Joints", description: "Don't wait! Order your Franch Ayurvedic Oil for joint & muscle pain today. Trusted 25+ years of herbal expertise. Natural pain relief online now." }],
  ["/my-orders", { title: "My Orders – Franch Global", description: "View and track your Franch Global orders." }],
  ["/product/franch-oil-nh-plus", { title: "Franch Oil NH Plus – Ayurvedic Pain Relief & Healing Oil for Joint & Muscle Pain", description: "Experience natural relief with Franch Oil NH Plus. Ayurvedic multipurpose oil for joint pain, muscle soreness, skin healing & daily wellness. Shop now." }],
  ["/product/franch-orthovin-thailam", { title: "Franch Orthovin Thailam – Ayurvedic Oil for Joint & Arthritis Pain Relief", description: "Relieve joint pain naturally with Franch Orthovin Thailam. Ayurvedic oil for arthritis, back pain, muscle stiffness & inflammation. Fast relief, daily use." }],
  ["/product/franch-ayurveda-skin-soap", { title: "Franch Ayurveda Skin Soap – Herbal Soap for Clear & Glowing Skin", description: "Get naturally clear and glowing skin with Franch Ayurveda Skin Soap. Helps reduce pimples, dark spots & dryness with herbal care for daily use." }],
  ["/product/omega-3", { title: "Franch Omega 3 Veg Capsules – Omega Supplement for Heart, Brain & Immunity", description: "Boost your daily wellness with Franch Omega 3 Veg Capsules. Supports heart health, brain function, immunity & hair care with plant-based omega fatty acids." }],
  ["/coming-soon", { title: "Coming Soon – New Ayurvedic Products at Franch Global", description: "Stay tuned for our newest Ayurvedic arrivals designed to enhance your holistic wellness journey." }],
  ["/privacy-policy", { title: "Privacy Policy & Terms of Use | Franch Global", description: "Discover how Franch Global safeguards your privacy and personal data. Review our Terms of Use to shop with confidence and complete transparency." }],
  ["/terms-and-conditions", { title: "Terms & Conditions – Franch Global | Policies & User Agreement", description: "Read the Terms & Conditions of Franch Global. Learn about your rights, responsibilities, privacy policy, purchase terms, and user agreement. Browse safely." }],
  ["/shipping-and-delivery", { title: "Franch Oil Shipping Policy – Safe & Hassle-Free Delivery", description: "Franch Oil delivers Ayurvedic joint & muscle pain relief oils safely to your doorstep. Trusted 25+ years of herbal expertise. Learn about shipping details." }],
  ["/uiuxdesign", { title: "Ayurvedic Wellness & Pain Relief | UI/UX Showcase - Franch Global", description: "Explore the new ultra-premium UI/UX design showcase for Franch Oil NH* Plus, Orthovin Thailam, Skin Soap, and Omega-3." }],
  ["/ui-ux-design", { title: "Ayurvedic Wellness & Pain Relief | UI/UX Showcase - Franch Global", description: "Explore the new ultra-premium UI/UX design showcase for Franch Oil NH* Plus, Orthovin Thailam, Skin Soap, and Omega-3." }],
]);

const SCHEMA_MAP = {
  "franch-oil-nh-plus": {
    "@context": "https://schema.org/", "@type": "Product", "name": "Franch Oil NH* Plus",
    "image": "https://5.imimg.com/data5/SELLER/Default/2023/5/312147553/LS/EJ/TD/2529238/franch-oil-nh-plus.jpg",
    "description": "Franch Oil NH Plus is a powerful Ayurvedic multipurpose oil designed to provide natural relief from pain, support skin healing, and promote overall wellness. Formulated using advanced cold-pressed extraction, this herbal oil delivers deep penetration and long-lasting results.",
    "brand": { "@type": "Brand", "name": "Franch" },
    "offers": { "@type": "Offer", "url": "", "priceCurrency": "INR", "price": "210", "priceValidUntil": "2025-12-31", "availability": "https://schema.org/InStock", "itemCondition": "https://schema.org/NewCondition" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5", "ratingCount": "1", "reviewCount": "1" },
    "review": { "@type": "Review", "name": "Ameer", "reviewBody": "Franch Oil is an excellent all-rounder! Works great for pain relief, skin healing (rashes, burns), and general massage.", "reviewRating": { "@type": "Rating", "ratingValue": "5" }, "datePublished": "2025-11-10", "author": { "@type": "Person", "name": "" } }
  },
  "franch-orthovin-thailam": {
    "@context": "https://schema.org/", "@type": "Product", "name": "Franch Orthovin Thailam",
    "image": "https://m.media-amazon.com/images/I/61tSJNDo6eL._AC_UF350,350_QL80_.jpg",
    "description": "Franch Orthovin Thailam is a highly concentrated Ayurvedic oil formulated to relieve joint pain, arthritis, and muscle stiffness naturally. Its herbal blend penetrates deeply to reduce inflammation, improve mobility, and provide long-lasting relief.",
    "brand": { "@type": "Brand", "name": "Franch" }, "sku": "FOTH001",
    "offers": { "@type": "Offer", "url": "", "priceCurrency": "INR", "price": "174", "priceValidUntil": "2025-12-31", "availability": "https://schema.org/InStock", "itemCondition": "https://schema.org/NewCondition" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5", "ratingCount": "1", "reviewCount": "1" },
    "review": { "@type": "Review", "name": "Sakshi", "reviewBody": "Very useful... it's worth buying for joint pain...fast relief and effective one.", "reviewRating": { "@type": "Rating", "ratingValue": "5" }, "datePublished": "2023-09-01", "author": { "@type": "Person", "name": "" } }
  },
  "omega-3": {
    "@context": "https://schema.org/", "@type": "Product", "name": "Franch Omega 3 Veg Capsules",
    "image": "https://m.media-amazon.com/images/I/61VEEAdvikL._SL1080_.jpg",
    "description": "Franch Omega 3 Veg Capsules are a plant-based Ayurvedic supplement with flaxseed oil and ALA to support heart health, brain function, immunity, and overall wellness—a vegetarian omega-3 alternative to fish oil.",
    "brand": { "@type": "Brand", "name": "Franch" }, "sku": "FOG3C001",
    "offers": { "@type": "Offer", "url": "", "priceCurrency": "INR", "price": "360", "priceValidUntil": "2025-12-31", "availability": "https://schema.org/InStock", "itemCondition": "https://schema.org/NewCondition" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5", "ratingCount": "1", "reviewCount": "1" },
    "review": { "@type": "Review", "name": "Jairam.S Narayan", "reviewBody": "Excellent Omega 3 supplement. Unlike fish oil omega 3 this doesn't have the smell.", "reviewRating": { "@type": "Rating", "ratingValue": "5" }, "datePublished": "2025-01-24", "author": { "@type": "Person", "name": "" } }
  },
  "franch-ayurveda-skin-soap": {
    "@context": "https://schema.org/", "@type": "Product", "name": "Franch Ayurveda Skin Soap",
    "image": "https://m.media-amazon.com/images/I/71GJbBW7REL._AC_UF1000,1000_QL80_.jpg",
    "description": "Franch Ayurveda Skin Soap is a herbal bathing soap crafted to cleanse, nourish, and protect your skin naturally. Made using Ayurvedic principles, it supports clear skin, improved complexion, and daily protection from pimples, dryness, and dark spots.",
    "brand": { "@type": "Brand", "name": "Franch" }, "sku": "FA-SOAP-100G",
    "offers": { "@type": "Offer", "url": "", "priceCurrency": "INR", "price": "54", "priceValidUntil": "2025-12-31", "availability": "https://schema.org/InStock", "itemCondition": "https://schema.org/NewCondition" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5", "ratingCount": "1", "reviewCount": "1" },
    "review": { "@type": "Review", "name": "Sakshi", "reviewBody": "This is must recommend soap, Good quality and amazing fragrance.", "reviewRating": { "@type": "Rating", "ratingValue": "5" }, "datePublished": "2024-01-30", "author": { "@type": "Person", "name": "" } }
  },
};

// ScrollToTop component to ensure proper navigation
function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // Force scroll to top and ensure navigation is processed
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Force a reflow to ensure the route change is processed
    document.body.offsetHeight;
  }, [pathname]);

  return null;
}
// Lazy load admin panel components (not needed for most users)
const CheckOutPage = lazy(() => import('./pages/CheckOutPage'));
const RazorpayOrders = lazy(() => import('./pages/razorpay/RazorpayOrders'));
// Cashfree removed — Razorpay is the active payment provider
const AdminLayout = lazy(() => import('./pages/razorpay/AdminLayout'));
const AdminPanelDashboard = lazy(() => import('./pages/razorpay/Dashboard'));
const Enquiry = lazy(() => import('./pages/razorpay/Enquiry'));
const ManageProducts = lazy(() => import('./pages/razorpay/ManageProducts'));
const ManageUsers = lazy(() => import('./pages/razorpay/ManageUsers'));
const ManageBlogs = lazy(() => import('./pages/razorpay/ManageBlogs'));
const VisitStatistics = lazy(() => import('./pages/razorpay/VisitStatistics'));
const MonthlyOrdersPage = lazy(() => import('./pages/razorpay/MonthlyOrdersPage'));
const AdminOrderTracking = lazy(() => import('./pages/razorpay/AdminOrderTracking'));


// ✅ Lazy-loaded pages
// Home is not lazy-loaded to ensure proper navigation
import Home from './pages/Home';
const Faq = lazy(() => import('./pages/Faq'));
const About = lazy(() => import('./pages/About'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Shipping = lazy(() => import('./pages/Shipping'));
const Terms = lazy(() => import('./pages/Terms'));
const Auth = lazy(() => import('./pages/Auth'));
const Login = lazy(() => import('./pages/Login'));
const Contact = lazy(() => import('./pages/ContactUs'));
const Product = lazy(() => import('./pages/Product'));
const Products = lazy(() => import('./pages/Products'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminBlog = lazy(() => import('./pages/AdminBlog'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogsPage = lazy(() => import('./pages/BlogsPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
// Test pages removed (production cleanup)
const ThankYou = lazy(() => import('./pages/ThankYou'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const OrderTrackDetail = lazy(() => import('./pages/OrderTrackDetail'));
const UiUxDesign = lazy(() => import('./pages/uiuxdesign'));

function AppContent() {
  const { user, loading, signInAnonymouslyUser } = useAuth();
  const location = useLocation();
  const { trackVisit } = useVisitTracker();
  const hideHeaderFooterRoutes = ["/admin", "/dashboard", "/auth", "/thank-you", "/uiuxdesign", "/ui-ux-design"];
  const showHeaderFooter = !hideHeaderFooterRoutes.includes(location.pathname) && !location.pathname.startsWith("/admin");

  // Force re-render on location change to ensure proper navigation
  const locationKey = `${location.pathname}${location.search}${location.hash || ''}`;

  useEffect(() => {
    if (!user && !loading) signInAnonymouslyUser();
  }, [user, loading]);

  // Advanced Matching: initialize pixel with auth user data as soon as known
  useEffect(() => {
    if (user && !user.isAnonymous && (user.email || user.displayName)) {
      initPixelWithUser({
        email: user.email || "",
        name: user.displayName || "",
      });
    }
  }, [user?.uid]);

  // Track page visits and trigger Meta Pixel PageView
  useEffect(() => {
    // Fire Meta pixel PageView on every route change
    trackPageView();

    // Don't track admin panel pages
    if (!location.pathname.startsWith("/admin/panel")) {
      trackVisit(location.pathname);
    }
  }, [location.pathname, trackVisit]);

  // Cleanup expired images on app startup (once per session)
  useEffect(() => {
    cleanupExpiredImages().catch(console.error);
  }, []);

  // O(1) meta tag update from module-level Map
  useEffect(() => {
    const fullPath = `${location.pathname}${location.search}`;
    const meta = META_MAP.get(fullPath) ?? META_MAP.get(location.pathname);
    if (meta) {
      document.title = meta.title;
      let descTag = document.querySelector('meta[name="description"]');
      if (!descTag) {
        descTag = document.createElement('meta');
        descTag.name = 'description';
        document.head.appendChild(descTag);
      }
      descTag.setAttribute('content', meta.description);
    }
  }, [location.pathname, location.search]);

  // Canonical tag — update href on every route change (but create element only once)
  const canonicalRef = useRef(null);
  useEffect(() => {
    if (!canonicalRef.current) {
      let existing = document.querySelector('link[rel="canonical"]');
      if (!existing) {
        existing = document.createElement('link');
        existing.setAttribute('rel', 'canonical');
        document.head.appendChild(existing);
      }
      canonicalRef.current = existing;
    }
    canonicalRef.current.setAttribute('href', window.location.href.split('#')[0]);
  }, [location.pathname]);

  // Remove and add schema script on route change
  useEffect(() => {
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) existingScript.remove();
    const productSlug = location.pathname.split("/product/")[1];
    const schema = productSlug ? SCHEMA_MAP[productSlug] : null;
    if (!schema) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
  }, [location.pathname]);

  if (loading) return <span className='web_loading'></span>;

  return (
    <>
      <ScrollToTop />
      {showHeaderFooter && <Header />}
      <div key={locationKey}>
        <Suspense fallback={<div className='web_loading' style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Login />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/blog/:slug" element={<Blog />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/landing/:id" element={<LandingPage />} />
            <Route path="/checkout" element={<CheckOutPage />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/my-orders/:orderId" element={<OrderTrackDetail />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/uiuxdesign" element={<UiUxDesign />} />
            <Route path="/ui-ux-design" element={<UiUxDesign />} />
            {/* Admin Panel (Razorpay Style) */}
            <Route path="/admin/panel" element={<AdminLayout />}>
              <Route index element={<AdminPanelDashboard />} />
              <Route path="dashboard" element={<AdminPanelDashboard />} />
              <Route path="enquiry" element={<Enquiry />} />
              <Route path="products" element={<ManageProducts />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="blogs" element={<ManageBlogs />} />
              <Route path="orders" element={<RazorpayOrders />} />
              <Route path="order-tracking" element={<AdminOrderTracking />} />
              <Route path="monthly-reports" element={<MonthlyOrdersPage />} />
              <Route path="visit-statistics" element={<VisitStatistics />} />
            </Route>

          </Routes>
        </Suspense>
      </div>
      {showHeaderFooter && <Footer />}
      {showHeaderFooter && <WhatsAppButton />}
    </>
  );
}

function App() {
  if (isMaintenanceEnabled() && !hasMaintenanceBypass()) {
    return <MaintenanceScreen />;
  }

  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
