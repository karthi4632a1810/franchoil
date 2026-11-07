import { lazy, Suspense } from 'react';
import "../css/home.css"
import "../css/animation.css"
import HeroSection from '../sections/HeroSection';

// Below-the-fold sections — lazy loaded so they don't block first paint
const VideoSection    = lazy(() => import('../sections/VideoSection'));
const FirstBannerSection = lazy(() => import('../sections/FirstBanner'));
const ProductSection  = lazy(() => import('../sections/ProductSection'));
const SecondBannerSection = lazy(() => import('../sections/SecondBanner'));
const Category        = lazy(() => import('../sections/Category'));
const Testimonial     = lazy(() => import('../sections/Testimonial'));
const CallToAction    = lazy(() => import('../sections/CallToAction'));

function Home() {
    return (
        <div>
            <h1 className="hidden">25 Years of Ayurvedic Expertise in Muscle & Joint Pain Relief Oils</h1>
            {/* HeroSection is eager — it is the LCP element */}
            <HeroSection />
            <Suspense fallback={null}>
                {/* <VideoSection /> */}
                <ProductSection />
                <FirstBannerSection />
                <SecondBannerSection />
                {/* <Category /> */}
                <Testimonial />
                <CallToAction />
            </Suspense>
        </div >
    )
}

export default Home;
