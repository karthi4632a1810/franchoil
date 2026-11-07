import React, { useCallback, useState } from 'react'
import "../css/banner.css"
import { useAnimation } from '../hooks/useAnimation';

function CallToAction() {
    const [elements, setElements] = useState([]);
    const refCallback = useCallback((el) => {
        if (el && !elements.includes(el)) {
            setElements((prev) => [...prev, el]);
        }
    }, [elements]);

    useAnimation(elements);
    return (
        <section className='w-full bg-w '>
            <div className='bg-d max-w-[1920px] mx-auto  relative overflow-hidden isolate call-banner-full-wrapper'>
                <div className='call-back-wrapper flex gap-4 absolute'>
                    <div className="call-1"></div>
                    <div className='call-2'></div>
                    <div className='call-3'></div>
                </div>
                <div className="max-w-[1450px] mx-auto  px-10">
                    <div className='grid grid-cols-12 '>
                        <div className='col-span-12  sm:col-span-6 '>
                            <div className='flex items-end h-full justify-center md:justify-start '>
                                <div ref={refCallback} data-animation="left" className='call-banner-image'></div>
                            </div>
                        </div>
                        <div className="col-span-12  sm:col-span-6  xl:text-[55px] lg:text-[40px] text-[30px]   py-20">
                            <h2 ref={refCallback} data-animation="right" className='m-0 text-c-l text-[1em]  ruwudu xl:leading-13  mb-[.5em] leading-9 tracking-wider '>Discover the Power of Ayurveda with Franch Ayurdeva Clear Skin Soap.</h2>
                            <p ref={refCallback} data-animation="right" className='m-0  text-c-l text-[.45em] ruwudu mb-[2em]'>Explore our curated range of Ayurvedic products—from pain relief oils and diabetic supplements to skin-friendly soaps.</p>
                            <a ref={refCallback} data-animation="right" href='/product/franch-ayurveda-skin-soap' className='banner-btn-link font-bold  text-[.30em] tracking-[.15em] text-[var(--t-c-l)]  py-[.5em] px-[1.7em] border rounded-full flex w-max items-center gap-2 hover:bg-[var(--bg-w)]  hover:text-[var(--t-p-c)] transition-all duration-400'>
                                KNOW MORE
                                <div
                                    className="mask-item"
                                    style={{
                                        "--m-size": "1.5em",
                                        "--m-bg": "var(--t-c-l)",
                                        "--m-url": "url(https://api.iconify.design/material-symbols:chevron-right-rounded.svg?color=%23ff0000)",
                                        "--m-h-bg": "var(--t-p-c)"
                                    }}
                                ></div>
                            </a>
                        </div>

                    </div>

                </div>
            </div>
        </section>
    )
}

export default CallToAction
