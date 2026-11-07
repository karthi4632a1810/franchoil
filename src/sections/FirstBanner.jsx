import React, { useCallback, useState } from 'react'
import "../css/banner.css"
import { useAnimation } from '../hooks/useAnimation';

function FirstBannerSection() {
    const [elements, setElements] = useState([]);
    const refCallback = useCallback((el) => {
        if (el && !elements.includes(el)) {
            setElements((prev) => [...prev, el]);
        }
    }, [elements]);

    useAnimation(elements);

    return (
        <section className='w-full bg-w py-30 pt-10  overflow-clip'>
            <div className="max-w-[1200px] mx-auto ">
                <div className='grid grid-cols-12 lg:gap-10 gap-5'>
                    <div className="col-span-12 xl:col-span-6">
                        <div className='grid grid-cols-12'>
                            <a href='/product/franch-oil-nh-plus' ref={refCallback} data-animation="left" className="xl:col-span-12 lg:col-span-6 col-span-12 lg:mb-8 mb-5 mx-3">
                                <div className='banner-first  bg-[var(--bg-b-4)] rounded-[20px] px-5 sm:px-8 py-5 sm:py-10 relative overflow-hidden flex '>
                                    <div className='side-circle'></div>
                                    <div className='banner-image' style={{ "--banner-img": " url(/images/product/p-10.webp)" }}></div>
                                    <div className='banner-content-wrapper '>
                                        <h5 className='m-0 ruwudu tracking-[1px] sm:text-[28px] text-[20px]  text-c-l font-medium'>Franch Oil NH Plus </h5>
                                        <p className='quando m-0 text-[8px] sm:text-[10px]  text-c-l sm:w-[50%] w-[45%] font-light  mb-5'>Experience long-lasting relief from joint and muscle pain with Franch Oil NH* Plus.</p>
                                        <div className='banner-btn-link font-bold text-[7px] sm:text-[8px] tracking-[3px] text-[var(--t-c-l)]  py-[3px] px-2 border rounded-full flex w-max items-center gap-2 hover:bg-[var(--bg-w)]  hover:text-[var(--t-p-c)] transition-all duration-400'>
                                            KNOW MORE
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": "1.1rem",
                                                    "--m-bg": "var(--t-c-l)",
                                                    "--m-url": "url(https://api.iconify.design/material-symbols:chevron-right-rounded.svg?color=%23ff0000)",
                                                    "--m-h-bg": "var(--p-c)"
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                            <a href='/product/franch-orthovin-thailam' ref={refCallback} data-animation="left" className="xl:col-span-12 lg:col-span-6 col-span-12 px-4">
                                <div className='banner-second  bg-[var(--bg-b-1)] rounded-[20px] px-5 py-5 sm:py-10 relative overflow-hidden flex'>
                                    <div className='side-circle'></div>
                                    <div className='banner-image' style={{ "--banner-img": " url(/images/product/p-7.webp)" }}></div>
                                    <div className='grid grid-cols-12'>
                                        <div className=" col-span-6"></div>
                                        <div className=" col-span-6 flex px-0">
                                            <div className='banner-content-wrapper '>
                                                <h5 className='m-0 ruwudu tracking-[1px] sm:text-[28px] text-[15px]  text-c-l font-medium leading-7'>Franch Orthovin Thailam </h5>
                                                <p className='quando m-0 text-[8px] sm:text-[10px] text-c-l  sm:mb-7 mb-5'>Experience Ease stiffness and pain with Franch Orthovin Thailam. This 100% Ayurvedic medicated oil is ideal. </p>
                                                <div className='banner-btn-link font-bold text-[7px] sm:text-[8px] tracking-[3px] text-[var(--t-c-l)]  py-[3px] px-2 border rounded-full flex w-max items-center gap-2 hover:bg-[var(--bg-w)]  hover:text-[var(--bg-b-1)] transition-all duration-400'>
                                                    KNOW MORE
                                                    <div
                                                        className="mask-item"
                                                        style={{
                                                            "--m-size": "1.1rem",
                                                            "--m-bg": "var(--t-c-l)",
                                                            "--m-url": "url(https://api.iconify.design/material-symbols:chevron-right-rounded.svg?color=%23ff0000)",
                                                            "--m-h-bg": "var(--bg-b-1)"
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                    <div className="col-span-12 xl:col-span-6">
                        <div className='grid grid-cols-12'>
                            <a href='/product/omega-3' ref={refCallback} data-animation="right" className="xl:col-span-12 lg:col-span-6 col-span-12 lg:mb-8 mb-5 px-4">
                                <div className='banner-five  bg-[var(--bg-b-10)] rounded-[20px] px-5 sm:px-8 py-5 sm:py-10 relative overflow-hidden flex '>
                                    <div className='side-circle'></div>
                                    <div className='banner-image' style={{ "--banner-img": " url(/images/product/p-12.webp)" }}></div>
                                    <div className='banner-content-wrapper '>
                                        <h5 className='m-0 ruwudu tracking-[1px] sm:text-[28px] text-[20px]  text-c-l font-medium'>OG-3 Veg  </h5>
                                        <p className='quando m-0 text-[8px] sm:text-[10px]  text-c-l sm:w-[50%] w-[45%] font-light  mb-5'>This 100% vegetarian Omega-3 supplement is ideal for maintaining heart health, brain function, and overall wellness.</p>
                                        <div className='banner-btn-link font-bold text-[7px] sm:text-[8px] tracking-[3px] text-[var(--t-c-l)]  py-[3px] px-2 border rounded-full flex w-max items-center gap-2 hover:bg-[var(--bg-w)]  hover:text-[var(--bg-b-10)] transition-all duration-400'>
                                            KNOW MORE
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": "1.1rem",
                                                    "--m-bg": "var(--t-c-l)",
                                                    "--m-url": "url(https://api.iconify.design/material-symbols:chevron-right-rounded.svg?color=%23ff0000)",
                                                    "--m-h-bg": "var(--bg-b-10)"
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                            <a href='/product/franch-ayurveda-skin-soap' ref={refCallback} data-animation="right" className="xl:col-span-12 lg:col-span-6 col-span-12  mx-3">

                                <div className='banner-fourth  bg-[var(--bg-b-9)] rounded-[20px] px-5 py-5 sm:py-10 relative overflow-hidden flex'>
                                    <div className='side-circle'></div>
                                    <div className='banner-image' style={{ "--banner-img": " url(/images/product/p-8.webp)" }}></div>
                                    <div className='grid grid-cols-12'>
                                        <div className=" col-span-6"></div>
                                        <div className=" col-span-6 flex px-0">
                                            <div className='banner-content-wrapper '>
                                                <h5 className='m-0 ruwudu tracking-[1px] sm:text-[28px] text-[15px]  text-c-l font-medium leading-7'>Franch Ayurveda clear Skin Soap  </h5>
                                                <p className='quando m-0 text-[8px] sm:text-[10px] text-c-l  sm:mb-7 mb-5'>This 100% Ayurvedic soap is ideal for gentle cleansing, nourishing your skin, and maintaining a healthy glow. </p>
                                                <div className='banner-btn-link font-bold text-[7px] sm:text-[8px] tracking-[3px] text-[var(--t-c-l)]  py-[3px] px-2 border rounded-full flex w-max items-center gap-2 hover:bg-[var(--bg-w)]  hover:text-[var(--bg-b-8)] transition-all duration-400'>
                                                    KNOW MORE
                                                    <div
                                                        className="mask-item"
                                                        style={{
                                                            "--m-size": "1.1rem",
                                                            "--m-bg": "var(--t-c-l)",
                                                            "--m-url": "url(https://api.iconify.design/material-symbols:chevron-right-rounded.svg?color=%23ff0000)",
                                                            "--m-h-bg": "var(--bg-b-8)"
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </a>

                        </div>
                    </div>
                    <div ref={refCallback} data-animation="right" className="col-span-12 xl:col-span-6  px-4 hidden">
                        <div className='banner-third  rounded-[20px] px-5 lg:px-10 py-5 sm:py-15 relative overflow-hidden flex justify-center md:justify-start '>
                            <div className='banner-image' style={{ "--banner-img": " url(/images/product/p-8.webp)" }}></div>
                            <div className='banner-content-wrapper flex flex-col xl:items-center items-center md:items-start px-5'>
                                <h5 className='m-0 ruwudu  md:text-[28px] text-[20px] tracking-[1px] text-c-l font-medium xl:text-center text-center md:text-start'>Franch Diafite Powder </h5>
                                <p className='quando m-0 text-[10px] md:text-[12px] text-c-l xl:w-[100%] w-[100%] md:w-[60%]  font-light md:mb-5 mb-4 xl:text-center text-center md:text-start'>Take control of your sugar levels with Franch Diafite Powder. Formulated as a diabetic food supplement</p>
                                <a href='/product/franch-ayurveda-skin-soap' className='banner-btn-link font-bold text-[7px] md:text-[8px] tracking-[3px] text-[var(--t-c-l)]  py-[3px] px-2 border rounded-full flex w-max items-center gap-2 hover:bg-[var(--bg-w)]  hover:text-[var(--t-p-c)] transition-all duration-400'>
                                    KNOW MORE
                                    <div
                                        className="mask-item"
                                        style={{
                                            "--m-size": "1.1rem",
                                            "--m-bg": "var(--t-c-l)",
                                            "--m-url": "url(https://api.iconify.design/material-symbols:chevron-right-rounded.svg?color=%23ff0000)",
                                            "--m-h-bg": "var(--p-c)"
                                        }}
                                    ></div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default FirstBannerSection
