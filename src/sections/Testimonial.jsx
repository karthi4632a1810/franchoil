import React, { useRef, useEffect, useState, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "../css/testimonial.css"
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { Pagination, Navigation, Autoplay } from "swiper/modules";
import { useAnimation } from "../hooks/useAnimation";

function Testimonial() {
    const [elements, setElements] = useState([]);
    const refCallback = useCallback((el) => {
        if (el && !elements.includes(el)) {
            setElements((prev) => [...prev, el]);
        }
    }, [elements]);

    useAnimation(elements);

    const paginationRef = useRef(false);
    const swiperRef = useRef(false);

    const franchOilReviews = [
        {
            name: "K Premkumar",
            review: "Knee and leg Pain relief oil for elders - Not easily available in the market. Has medicinal properties. Good for all seasons. Not harmful."
        },
        {
            name: "Francis Gerard",
            review: "I know franch oil never give disappointments. Super duper oil with multiple uses. I'm using it for years."
        },
        {
            name: "Anu Mobi",
            review: "Really good, should keep to everyone."
        },
        {
            name: "Aravinth Natharaaj",
            review: "We have been using this for years. Any kind of problem can be solved with franch oil."
        },
        {
            name: "Niranjanee",
            review: "I have been using for last 8 years. It’s incredible and multiple use for hair, body ache, acne, cuts, scars, wounds, etc. True value for money. Thanks to them for free bag."
        },
        {
            name: "Raman Pushkar",
            review: "We have been using this product for over a decade now. It was not available online. So glad that it is now available. No words to describe the magical pain relief it provides. Helps in period related backpain too."
        },
        {
            name: "Vandana N",
            review: "Amazing product! Helps in pain relief and more."
        },
        {
            name: "K Premkumar",
            review: "Knee and leg Pain relief oil for elders - Not easily available in the market. Has medicinal properties. Good for all seasons. Not harmful."
        },
        {
            name: "Francis Gerard",
            review: "I know franch oil never give disappointments. Super duper oil with multiple uses. I'm using it for years."
        },
        {
            name: "Anu Mobi",
            review: "Really good, should keep to everyone."
        },
        {
            name: "Aravinth Natharaaj",
            review: "We have been using this for years. Any kind of problem can be solved with franch oil."
        },
        {
            name: "Niranjanee",
            review: "I have been using for last 8 years. It’s incredible and multiple use for hair, body ache, acne, cuts, scars, wounds, etc. True value for money. Thanks to them for free bag."
        },
        {
            name: "Raman Pushkar",
            review: "We have been using this product for over a decade now. It was not available online. So glad that it is now available. No words to describe the magical pain relief it provides. Helps in period related backpain too."
        },
        {
            name: "Vandana N",
            review: "Amazing product! Helps in pain relief and more."
        }
    ];


    useEffect(() => {
        if (swiperRef.current && paginationRef.current) {
            swiperRef.current.params.pagination.el = paginationRef.current;
            swiperRef.current.pagination.init();
            swiperRef.current.pagination.render();
            swiperRef.current.pagination.update();

        }
    }, [swiperRef, paginationRef.current]);

    return (
        <section id="testimonials-sec" className="max-w-[1920px] bg-w py-40 overflow-hidden mx-auto px-5 sm:px-10">
            <div className="max-w-[1200px] w-[90%] mx-auto ">
                <div className="grid grid-cols-12">
                    <div className="col-span-12 xl:col-span-5">
                        <div className="testimonial-headings-wrapper">
                            <div className="testimonial-headings">
                                <h5 ref={refCallback} data-animation="left" className="m-0 quando text-p-c text-center xl:text-start font-bold">TESTIMONIAL</h5>
                                <h2 ref={refCallback} data-animation="left" className="quando text-[var(--t-l-d)] text-[35px] mt-5 text-center xl:text-start font-bold">
                                    Here Some of Our Happy Clients Words
                                </h2>
                            </div>
                            <div className=" swiper-parent relative w-[80%] ">
                                <Swiper
                                    slidesPerView={5}
                                    spaceBetween={10}
                                    loop={true}
                                    autoplay={{
                                        delay: 4000,
                                        disableOnInteraction: false,
                                    }}
                                    pagination={{
                                        el: paginationRef.current,
                                        clickable: true,
                                    }}
                                    navigation={false}
                                    slideToClickedSlide={true}
                                    centeredSlides={true}
                                    modules={[Pagination, Navigation, Autoplay]}
                                    className="testimonialSwiper"
                                    onSwiper={(swiper) => {
                                        swiperRef.current = swiper;
                                    }}
                                    onSlideChange={() => {
                                        if (swiperRef.current && paginationRef.current) {

                                            const activeSlide = swiperRef.current.slides[swiperRef.current.activeIndex];
                                            const activeData = activeSlide.getAttribute("data-swiper");

                                            document.querySelectorAll(".client-testimonial-details-parent").forEach((el) => {
                                                if (el.getAttribute("data-swiper-connect") === activeData) {
                                                    el.classList.add("show");
                                                    el.classList.remove("hide");
                                                } else {
                                                    el.classList.remove("show");
                                                    el.classList.add("hide");
                                                }
                                            });
                                        }
                                    }}
                                >
                                    {franchOilReviews.map((fSlide, i) => (
                                        <SwiperSlide key={`slide_${fSlide + i}`} data-swiper={i}>
                                            <div className="testimonial-slider-client-wrapper w-full flex justify-center">
                                                <div className="testimonial-slider-client" style={{ "--profile": `url(https://placehold.co/600x400/00a63e/FFF?text=${fSlide.name[0].toUpperCase()})` }}>

                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                                <div className="gap-3 mt-4 swiper-next-prev-wrapper flex justify-between">
                                    <div className="next-prev prev p-1" onClick={() => swiperRef.current?.slidePrev()}>
                                        <div
                                            className="mask-item"
                                            style={{
                                                "--m-size": "4rem",
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
                                                "--m-size": "4rem",
                                                "--m-bg": "var(--t-p-c)",
                                                "--m-url": "url(https://api.iconify.design/material-symbols:chevron-right-rounded.svg?color=%23ff0000)",
                                                // "--m-h-bg": "var(--p-c)"
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 xl:col-span-7 h-full flex justify-center">
                        <div className=" flex items-center flex-col justify-center w-full md:w-[80%] lg:w-[70%] xl:w-full h-full gap-10">
                            <div className="client-testimonial-details-wrapper grid isolate w-[95%] relative">
                                {franchOilReviews.map((fSlide, i) => (
                                    <div key={fSlide + i} data-swiper-connect={i} className="client-testimonial-details-parent relative show">
                                        <div className="slider-number text-c-l text-[14px] quando flex justify-center items-center">{i + 1}</div>
                                        <div className='client-ratings-wrapper flex items-center gap-2 poppins p-2'>
                                            <div className='client-ratings' style={{ "--ratings": "4.95" }}></div>
                                        </div>
                                        <div className="client-testimonial-details w-full bg-w py-3 px-3 relative flex  ">
                                            <div className="client-profile" style={{ "--profile": `url(https://placehold.co/600x400/00a63e/FFF?text=${fSlide.name[0].toUpperCase()})` }} >
                                            </div>
                                            <div className="client-details flex items-center flex-col w-full px-15 gap-3 justify-center">
                                                <h5 className="m-0 font-bold quando text-[18px] text-center">{fSlide.name}</h5>
                                                <p className="m-0 quando text-[9px] sm:text-[10px] text-center sm:leading-5 leading-4">{fSlide.review}</p>
                                            </div>
                                        </div>
                                    </div>))}
                            </div>
                            <div ref={paginationRef} className="custom-pagination mt-5 w-max flex gap-3 justify-center "></div>
                        </div>
                    </div>
                </div>
            </div>
        </section >
    );
}

export default Testimonial;


