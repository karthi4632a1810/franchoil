import React, { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

import { Pagination, Navigation, Autoplay, EffectFade } from "swiper/modules";


function HeroSection() {
    const swiperRef = useRef(false);
    const [videoPopup, setVideoPopup] = useState(false);
    const [videoSrc, setVedioSrc] = useState('franch_oil_1')

    const videoSrcArr = {
        "franch_oil_1": "https://www.youtube.com/embed/jB3KL-Gr8iU",
        "franch_oil_2": "https://www.youtube.com/embed/u1iOWT9Uj7c",
        "omega_3": "https://www.youtube.com/embed/GIhk-jP5Uv4"
    }

    useEffect(() => {
        // console.log(videoPopup)
        if (videoPopup) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [videoPopup])
    return (
        <>
            <div id="videoPopup" className={`video-popup ${videoPopup ? "active" : ""}`}>
                <span className='absolute  inset-[-100vw] bg-white/70 backdrop-blur-lg' onClick={() => setVideoPopup(false)}></span>
                <div className="video-popup-content">
                    <span className="close-btn bg-white w-9 h-9 flex justify-center items-center rounded-full" onClick={() => setVideoPopup(false)}>
                        <div
                            className="mask-item"
                            style={{
                                "--m-size": "2rem",
                                "--m-bg": "black",
                                "--m-url": "url(https://api.iconify.design/material-symbols:close-small.svg?color=%23ff0000)",
                                "--m-h-bg": "red"
                            }}
                        ></div>
                    </span>
                    {videoPopup && (
                        <iframe
                            className="w-full aspect-video"
                            src={`${videoSrcArr[videoSrc].split("/embed/")[0]}/embed/?autoplay=1&loop=1&playlist=${videoSrcArr[videoSrc].split("/embed/")[1]}&rel=0&modestbranding=1`}
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                        ></iframe>
                    )}
                </div>
            </div>

            <div id="heroSection" className="w-full relative overflow-hidden"
                onMouseEnter={() => swiperRef.current?.autoplay.stop()}
                onMouseLeave={() => swiperRef.current?.autoplay.start()}
            >
                <div className="w-full mx-auto ">
                    <Swiper
                        loop={true}
                        grabCursor={true}
                        effect="fade"
                        fadeEffect={{ crossFade: true }}
                        pagination={{ clickable: true }}
                        autoplay={{
                            delay: 3500,
                            disableOnInteraction: false,
                        }}
                        navigation={false}
                        speed={2000}
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                        }}
                        modules={[Pagination, Navigation, Autoplay, EffectFade]}
                        className="mySwiper"
                    >
                        <SwiperSlide>
                            <div className='w-full hero-swiper-section-wrapper px-5 md:px-10' style={{ "--hero-img": "url(/images/hero-section/hero-1.webp)" }}>
                                <div className='max-w-[1200px] w-[90%] mx-auto h-full '>
                                    <div className='grid grid-cols-12 h-full'>
                                        <div className='col-span-12 lg:col-span-6 h-full'>
                                            <div className='w-full flex items-center justify-center h-full slider-group-image-wrapper'>
                                                <div className='slider-group-image'>

                                                </div>
                                            </div>
                                        </div>
                                        <div className='col-span-12 lg:col-span-6 h-full'>
                                            <div className='w-full flex  justify-center h-full flex-col slider-1-content'>
                                                <h2 className='m-0 2xl:text-[4rem] xl:text-[3.8rem] md:text-[3rem] text-[2.5rem] amarante text-[var(--t-c-d1)]'>AYURVEDA WITH FRANCH ESSENTIALS</h2>
                                                <p className='quando mt-8 mb-3  md:text-[12px] text-[10px]' style={{ color: "color-mix(in srgb, var(--t-c-d1) 70%, white)" }}>Franch Oil NH* Plus, is in essence, brewed with the natural Ayurvedic Ingredient and rare herbal extracts, making it a one-of-a-kind bottle of goodness. It primarily serves as a solution to negate pain. unique multipurpose healing oil.</p>
                                                <div className="flex items-center gap-3 slider-1-btn-wrapper">
                                                    <a href='/product/franch-oil-nh-plus' className='poppins slider-1-btn '>SHOP NOW</a>
                                                    {/* <div className={`video-player-btn-wrapper  flex justify-center items-center active ${videoPopup}`}>
                                                        <div onClick={() => { setVideoPopup(true); setVedioSrc('franch_oil_1') }} className='play-btn-img'></div>
                                                    </div>
                                                    <div className={`video-player-btn-wrapper  flex justify-center items-center active ${videoPopup}`}>
                                                        <div onClick={() => { setVideoPopup(true); setVedioSrc('franch_oil_2') }} className='play-btn-img'></div>
                                                    </div> */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </SwiperSlide>
                        <SwiperSlide>
                            <div className='w-full hero-swiper-section-wrapper px-5 md:px-10' style={{ "--hero-img": "url(/images/hero-section/hero-4.webp)" }}>
                                <div className='max-w-[1200px] w-[90%] mx-auto h-full '>
                                    <div className='grid grid-cols-12 h-full'>
                                        <div className='col-span-12 lg:col-span-6 h-full'>
                                            <div className='w-full flex items-center justify-center h-full slider-group-image-wrapper'>
                                                <div className='slider-group-image-4'>

                                                </div>
                                            </div>
                                        </div>
                                        <div className='col-span-12 lg:col-span-6 h-full'>
                                            <div className="w-full flex justify-center h-full flex-col slider-1-content">
                                                <h2 className="m-0 2xl:text-[4rem] xl:text-[3.8rem] md:text-[3rem] text-[2.5rem] amarante text-c-l">
                                                    OG-3 VEG Ayurvedic Product
                                                </h2>
                                                <p className='quando mt-8 mb-3  md:text-[12px] text-[10px] text-c-l'>
                                                    Discover the complete wellness benefits of <strong>OG-3 Veg</strong>, a natural Vegetarian Omega-3 supplement,  rich content of essential fatty acids and antioxidants.
                                                    It promotes heart health, strengthens immunity, eases inflammation, and supports overall vitality for a healthier lifestyle.
                                                </p>
                                                <div className="flex items-center gap-10 slider-1-btn-wrapper">
                                                    <a href="/product/omega-3" className="poppins slider-1-btn">SHOP NOW</a>
                                                    {/* <div className={`video-player-btn-wrapper  flex justify-center items-center active ${videoPopup}`}>
                                                        <div onClick={() => { setVideoPopup(true); setVedioSrc('omega_3') }} className='play-btn-img'></div>
                                                    </div> */}
                                                </div>

                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide>
                            <div className='w-full hero-swiper-section-wrapper px-5 md:px-10' style={{ "--hero-img": "url(/images/hero-section/hero-2.webp)" }}>
                                <div className='max-w-[1200px] w-[90%] mx-auto h-full '>
                                    <div className='grid grid-cols-12 h-full'>
                                        <div className='col-span-12 lg:col-span-6 h-full'>
                                            <div className='w-full flex items-center justify-center h-full slider-group-image-wrapper'>
                                                <div className='slider-group-image-2'>

                                                </div>
                                            </div>
                                        </div>
                                        <div className='col-span-12 lg:col-span-6 h-full'>
                                            <div className='w-full flex  justify-center h-full flex-col slider-1-content'>
                                                <h2 className='m-0 2xl:text-[4rem] xl:text-[3.8rem] md:text-[3rem] text-[2.5rem] amarante text-c-l'>FRANCH AYURVEDA CLEAR SKIN SOAP</h2>
                                                <p className='quando mt-8 mb-3  md:text-[12px] text-[10px] text-c-l'>  Discover the rejuvenating power of Ayurveda with our <strong>Franch Ayurveda Clear Skin Soap</strong>.
                                                    Enriched with nature’s best, it promotes a glowing complexion, nourishes deeply, and is gentle on every skin type.</p>

                                                <div className="flex items-center gap-10 slider-1-btn-wrapper">
                                                    <a href='/product/franch-ayurveda-skin-soap' className='poppins slider-1-btn '>SHOP NOW</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                        <SwiperSlide>
                            <div className='w-full hero-swiper-section-wrapper px-5 md:px-10' style={{ "--hero-img": "url(/images/hero-section/hero-3.webp)" }}>
                                <div className='max-w-[1200px] w-[90%] mx-auto h-full '>
                                    <div className='grid grid-cols-12 h-full'>
                                        <div className='col-span-12 lg:col-span-6 h-full'>
                                            <div className='w-full flex items-center justify-center h-full slider-group-image-wrapper'>
                                                <div className='slider-group-image-3'>

                                                </div>
                                            </div>
                                        </div>
                                        <div className='col-span-12 lg:col-span-6 h-full'>
                                            <div className='w-full flex  justify-center h-full flex-col slider-1-content'>
                                                <h2 className='m-0 2xl:text-[4rem] xl:text-[3.8rem] md:text-[3rem] text-[2.5rem] amarante text-c-l'>FRANCH  ORTHOVIN THAILAM</h2>
                                                <p className='quando mt-8 mb-3  md:text-[12px] text-[10px] text-c-l'>    Experience fast and natural relief from arthritis joint pain with <strong>Orthovin Thailam</strong>.
                                                    Formulated with time-tested Ayurvedic herbs, it helps improve mobility, reduce discomfort, and promote overall well-being.</p>
                                                <div className="flex items-center gap-10 slider-1-btn-wrapper">
                                                    <a href='/product/franch-orthovin-thailam' className='poppins slider-1-btn '>SHOP NOW</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </SwiperSlide>
                    </Swiper>
                </div>
                <div className="flex gap-3 mt-4 swiper-next-prev-wrapper flex justify-between">
                    <div className="next-prev prev p-1" onClick={() => swiperRef.current?.slidePrev()}>
                        <div
                            className="mask-item"
                            style={{
                                "--m-size": "3rem",
                                "--m-bg": "var(--t-p-c)",
                                "--m-url": "url(https://api.iconify.design/material-symbols:chevron-left-rounded.svg?color=%23ff0000)",
                                // "--m-h-bg": "var(--p-c)"
                            }}
                        ></div>
                    </div>
                    <div className="next-prev next p-1" onClick={() => swiperRef.current?.slideNext()}>
                        <div
                            className="mask-item"
                            style={{
                                "--m-size": "3rem",
                                "--m-bg": "var(--t-p-c)",
                                "--m-url": "url(https://api.iconify.design/material-symbols:chevron-right-rounded.svg?color=%23ff0000)",
                                // "--m-h-bg": "var(--p-c)"
                            }}
                        ></div>
                    </div>
                </div>
            </div >
        </>
    )
}

export default HeroSection
