import React, { useState } from 'react'
import "../css/footer.css"
import logo from "/images/logo.webp"
import visa from "/images/product/productpage/visa.webp"
import upi from "/images/product/productpage/upi.webp"
import master from "/images/product/productpage/master.webp"
import google_pay from "/images/product/productpage/google_pay.webp"
import paypal from "/images/product/productpage/paypal.webp"
// import useAuth from "../hooks/useAuth";

function Footer() {
    const [search, setSearch] = useState('')

    return (
        <section className='w-full bg-w '>
            {/* {!user && <div className='login-popup-wrapper z-9999'>
                <div className="footer-login-alert  bg-white shadow-lg rounded-xl p-8 flex flex-col items-center gap-4 max-w-xs mx-auto border border-gray-200">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-green-500 to-green-500 mb-2">
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                            <path fill="#fff" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.31 0-6 2.01-6 4.5V20a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1.5c0-2.49-2.69-4.5-6-4.5Z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Login Required</h3>
                    <p className="text-gray-500 text-center text-sm">
                        Please log in to access this feature. If you don't have an account, you can create one in seconds!
                    </p>
                    <div className="flex gap-3 w-full mt-2">
                        <a href='#' className="flex-1 text-center bg-gradient-to-tr from-green-500 to-green-500 text-white font-semibold py-2 rounded-lg shadow hover:from-green-600 hover:to-green-600 transition">
                            Login
                        </a>
                        <a href='#' className="flex-1 text-center bg-white border border-green-500 text-green-600 font-semibold py-2 rounded-lg hover:bg-green-50 transition">
                            Sign Up
                        </a>
                    </div>
                </div>
            </div>} */}
            <footer className='w-full sm:px-10 px-5 mt-40'>
                <div className='max-w-[1200px] mx-auto bg-w py-20 relative'>
                    <div className='w-full footer-top-bar bg-w mb-5 py-4 md:flex px-8'>
                        <div className='grid grid-cols-12 w-full'>
                            <div className='lg:col-span-3 sm:col-span-6   col-span-12 lg:mt-0'>
                                <div className='flex items-center quando text-c-l text-[13px] gap-3 contact'>
                                    <div className=''>
                                        <div
                                            className="mask-item"
                                            style={{
                                                "--m-size": "3rem",
                                                "--m-bg": "var(--p-c)",
                                                "--m-url": "url(https://api.iconify.design/garden:headset-fill-12.svg)",
                                            }}
                                        ></div>
                                    </div>
                                    <div className='montagu-slab flex flex-col gap-2'>
                                        <h5 className='m-0 text-[12px] font-semibold text-[var(--t-c-d)] tracking-[1px]'>CONTACT US </h5>
                                        <div className='flex gap-1'>
                                            <a href='tel:+919841854321' className='m-0 text-center quando text-[14px] text-[var(--t-p-c)] font-medium'>(+91) 984 185 4321</a>
                                        </div>
                                        <p className='m-0 quando text-[11px] text-[var(--t-p-c)] opacity-80'>Mon-Sat, 10:00 AM - 7:00 PM</p>
                                    </div>

                                </div>
                            </div>
                            <div className='lg:col-span-3 sm:col-span-6  col-span-12 mt-10 sm:mt-0'>
                                <div className='flex items-center quando text-c-l text-[13px] gap-3 contact'>
                                    <div className=''>
                                        <div
                                            className="mask-item"
                                            style={{
                                                "--m-size": "3rem",
                                                "--m-bg": "var(--p-c)",
                                                "--m-url": "url(https://api.iconify.design/icon-park-solid:mail-unpacking.svg?color=%23ff0000)",
                                            }}
                                        ></div>
                                    </div>
                                    <div className='montagu-slab flex flex-col gap-2'>
                                        <h5 className='m-0 text-[12px] font-semibold text-[var(--t-c-d)] tracking-[1px]'>EMAIL US </h5>
                                        <div className='flex gap-1'>
                                            <a href='mailto:contact@franchglobal.com' target='blank' className='m-0 text-center quando sm:text-[14px] text-[12px] text-[var(--t-p-c)] font-medium'>contact@franchglobal.com</a>                                        </div>
                                        <a href='https://wa.me/919841854321' target='blank' className='m-0 quando text-[11px] text-[var(--p-c)] font-semibold'>WhatsApp Support</a>
                                    </div>

                                </div>
                            </div>
                            <div className='lg:col-span-6 sm:col-span-12  col-span-12 mt-10 lg:mt-0 flex items-center justify-center lg:justify-end'>
                                <div className="flex lg:justify-end items-center gap-4">
                                    <img src={visa} alt="" />
                                    <img src={master} alt="" />
                                    <img src={paypal} alt="" />
                                    <img src={google_pay} alt="" />
                                    <img src={upi} alt="" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='grid grid-cols-12 footer-center-bar'>
                        <div className="col-span-12 mt-15  xl:mt-5 md:col-span-6 lg:col-span-4 xl:col-span-3">
                            <div className='footer-first flex flex-col gap-10'>
                                <div className="footer-log w-[50%]">
                                    <img className='w-full' src={logo} alt="" />
                                </div>
                                <p className='m-0  quando text-[12px]'>Explore our curated range of Ayurvedic products—from pain relief oils and diabetic supplements to skin-friendly soaps.</p>
                                <div className='footer-social-link-wrapper flex gap-6'>

                                    <a href="https://www.facebook.com/FranchFM">
                                        <div className='bg-w w-max p-2 rounded-full flex justify-center items-center  hover:!bg-[#007E3C] transition-[.4s] footer-social-link'>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": "1.3rem",
                                                    "--m-bg": "var(--p-c)",
                                                    "--m-url": "url(https://api.iconify.design/gg:facebook.svg)",
                                                    "--m-h-bg": "var(--s-c)"
                                                }}
                                            ></div>
                                        </div>
                                    </a>
                                    <a href="https://www.instagram.com/franchindia/">
                                        <div className='bg-w w-max p-2 rounded-full flex justify-center items-center  hover:!bg-[var(--p-c)] transition-[.4s] footer-social-link'>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": "1.3rem",
                                                    "--m-bg": "var(--p-c)",
                                                    "--m-url": "url(https://api.iconify.design/mdi:instagram.svg)",
                                                    "--m-h-bg": "var(--s-c)"
                                                }}
                                            ></div>
                                        </div>
                                    </a>
                                    <a href="https://www.youtube.com/@franchglobalhealthcarellp2381">
                                        <div className='bg-w w-max p-2 rounded-full flex justify-center items-center  hover:!bg-[var(--p-c)] transition-[.4s] footer-social-link'>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": "1.3rem",
                                                    "--m-bg": "var(--p-c)",
                                                    "--m-url": "url(https://api.iconify.design/flowbite:youtube-solid.svg)",
                                                    "--m-h-bg": "var(--s-c)"
                                                }}
                                            ></div>
                                        </div>
                                    </a>
                                    <a href="https://x.com/FranchTweets">
                                        <div className='bg-w w-max p-2 rounded-full flex justify-center items-center hover:!bg-[var(--p-c)] transition-[.4s] footer-social-link'>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": "1.3rem",
                                                    "--m-bg": "var(--p-c)",
                                                    "--m-url": "url(https://api.iconify.design/hugeicons:new-twitter.svg?color=%23ff0000)",
                                                    "--m-h-bg": "var(--s-c)"
                                                }}
                                            ></div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className='col-span-12 mt-15  xl:mt-5 md:col-span-6 lg:col-span-4 xl:col-span-2'>
                            <div className='footer-links flex flex-col lg:items-center'>
                                <div className='footer-link-wrapper flex flex-col gap-8'>
                                    <div className="footer-heading relative w-max">
                                        <h5 className='m-0 font-bold text-[14px] poppins tracking-widest'>QUICK LINKS</h5>
                                    </div>
                                    <div className='footer-link  flex flex-col gap-5 p-0'>
                                        <a href="/" className=' text-[12px] p-0 quando rounded-full flex w-max items-center justify-center gap-2 hover:bg-[var(--bg-w)]  transition-all duration-400'>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": ".8rem",
                                                    "--m-bg": "var(--t-p-c)",
                                                    "--m-url": "url(https://api.iconify.design/solar:map-arrow-right-bold-duotone.svg?color=%23ff0000)",
                                                    "--m-h-bg": "var(--t-p-c)"
                                                }}
                                            ></div>
                                            Home
                                        </a>
                                        <a href="/about" className=' text-[12px] p-0 quando rounded-full flex w-max items-center justify-center gap-2 hover:bg-[var(--bg-w)]  transition-all duration-400'>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": ".8rem",
                                                    "--m-bg": "var(--t-p-c)",
                                                    "--m-url": "url(https://api.iconify.design/solar:map-arrow-right-bold-duotone.svg?color=%23ff0000)",
                                                    "--m-h-bg": "var(--t-p-c)"
                                                }}
                                            ></div>
                                            About Us
                                        </a>
                                        <a href="/products" className=' text-[12px] p-0 quando rounded-full flex w-max items-center justify-center gap-2 hover:bg-[var(--bg-w)]  transition-all duration-400'>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": ".8rem",
                                                    "--m-bg": "var(--t-p-c)",
                                                    "--m-url": "url(https://api.iconify.design/solar:map-arrow-right-bold-duotone.svg?color=%23ff0000)",
                                                    "--m-h-bg": "var(--t-p-c)"
                                                }}
                                            ></div>
                                            Shop
                                        </a>
                                        <a href="/blogs" className=' text-[12px] p-0 quando rounded-full flex w-max items-center justify-center gap-2 hover:bg-[var(--bg-w)]  transition-all duration-400'>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": ".8rem",
                                                    "--m-bg": "var(--t-p-c)",
                                                    "--m-url": "url(https://api.iconify.design/solar:map-arrow-right-bold-duotone.svg?color=%23ff0000)",
                                                    "--m-h-bg": "var(--t-p-c)"
                                                }}
                                            ></div>
                                            Blogs
                                        </a>
                                        <a href="/contact" className=' text-[12px] p-0 quando rounded-full flex w-max items-center justify-center gap-2 hover:bg-[var(--bg-w)]  transition-all duration-400'>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": ".8rem",
                                                    "--m-bg": "var(--t-p-c)",
                                                    "--m-url": "url(https://api.iconify.design/solar:map-arrow-right-bold-duotone.svg?color=%23ff0000)",
                                                    "--m-h-bg": "var(--t-p-c)"
                                                }}
                                            ></div>
                                            Contact Us
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='col-span-12 mt-15  xl:mt-5 md:col-span-6 lg:col-span-4 xl:col-span-3'>
                            <div className='footer-links flex flex-col lg:items-center'>
                                <div className='footer-link-wrapper flex flex-col gap-8'>
                                    <div className="footer-heading relative w-max">
                                        <h5 className='m-0 font-bold text-[14px] poppins tracking-widest'>QUICK LINKS</h5>
                                    </div>
                                    <div className='footer-link  flex flex-col gap-5 p-0'>
                                        <a href="/privacy" className='text-[12px] p-0 quando rounded-full flex w-max items-center justify-center gap-2 hover:bg-[var(--bg-w)]  transition-all duration-400'>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": ".8rem",
                                                    "--m-bg": "var(--t-p-c)",
                                                    "--m-url": "url(https://api.iconify.design/solar:map-arrow-right-bold-duotone.svg?color=%23ff0000)",
                                                    "--m-h-bg": "var(--t-p-c)"
                                                }}
                                            ></div>
                                            Privacy Policy
                                        </a>
                                        {/* <a href="/refund" className='text-[12px] p-0 quando rounded-full flex w-max items-center justify-center gap-2 hover:bg-[var(--bg-w)]  transition-all duration-400'>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": ".8rem",
                                                    "--m-bg": "var(--t-p-c)",
                                                    "--m-url": "url(https://api.iconify.design/solar:map-arrow-right-bold-duotone.svg?color=%23ff0000)",
                                                    "--m-h-bg": "var(--t-p-c)"
                                                }}
                                            ></div>
                                            Returns + Exchanges
                                        </a> */}
                                        <a href="/terms" className='text-[12px] p-0 quando rounded-full flex w-max items-center justify-center gap-2 hover:bg-[var(--bg-w)]  transition-all duration-400'>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": ".8rem",
                                                    "--m-bg": "var(--t-p-c)",
                                                    "--m-url": "url(https://api.iconify.design/solar:map-arrow-right-bold-duotone.svg?color=%23ff0000)",
                                                    "--m-h-bg": "var(--t-p-c)"
                                                }}
                                            ></div>
                                            Terms & Conditions
                                        </a>
                                        <a href="/shipping" className='text-[12px] p-0 quando rounded-full flex w-max items-center justify-center gap-2 hover:bg-[var(--bg-w)]  transition-all duration-400'>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": ".8rem",
                                                    "--m-bg": "var(--t-p-c)",
                                                    "--m-url": "url(https://api.iconify.design/solar:map-arrow-right-bold-duotone.svg?color=%23ff0000)",
                                                    "--m-h-bg": "var(--t-p-c)"
                                                }}
                                            ></div>
                                            Shipping & Delivery
                                        </a>
                                        <a href="/faq" className='text-[12px] p-0 quando rounded-full flex w-max items-center justify-center gap-2 hover:bg-[var(--bg-w)]  transition-all duration-400'>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": ".8rem",
                                                    "--m-bg": "var(--t-p-c)",
                                                    "--m-url": "url(https://api.iconify.design/solar:map-arrow-right-bold-duotone.svg?color=%23ff0000)",
                                                    "--m-h-bg": "var(--t-p-c)"
                                                }}
                                            ></div>
                                            FAQ
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='col-span-12 mt-15  xl:mt-5 md:col-span-6 lg:col-span-4 xl:col-span-4'>
                            <div className='footer-links flex flex-col items-center gap-8'>
                                <div className='footer-search-wrapper w-full'>
                                    <div className='input-wrapper  w-[100%] border flex items-center  border-[var(--a-c-4)] border-[.5px] box-sha-2  rounded-tl-[3px] rounded-bl-[3px] rounded-tr-[3px] rounded-br-[3px]  py-[1px] px-[1px] '>
                                        <input
                                            value={search}
                                            onInput={(e) => setSearch(e.target.value)}
                                            id='footer-search' type="text" placeholder='' className=' w-full placeholder:text-[12px] poppins text-[var(--t-p-c)] text-[12px] px-4 border-0 outline-0 focus:outline-0' />
                                        <a href={`/products?search=${search}`} htmlFor="footer-search " className='search-label px-2 bg-p-c py-[5px]  flex items-center gap-2 poppins text-[13px] rounded-[2px] box-sha-1 cursor-pointer hover:!bg-[var(--bg-b-2)] transition-[.4s] '
                                            style={{ color: "color-mix(in srgb, var(--t-c-l) 80%, transparent)", backgroundColor: "color-mix(in srgb, var(--p-c) 80%, transparent)" }}>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": ".9rem",
                                                    "--m-bg": "var(--t-c-l)",
                                                    "--m-url": "url(https://api.iconify.design/hugeicons:search-02.svg)",
                                                    // "--m-h-bg": "var(--p-c)"
                                                }}
                                            ></div>
                                            Search</a>
                                    </div>
                                </div>
                                <div className='footer-map-wrapper'>
                                    <iframe
                                        title="Franch Global Health Care LLP Map"
                                        src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7772.558731470083!2d80.246474!3d13.081473!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5265a25afa93db%3A0xcb53818f0509ba4f!2sFranch%20Global%20Health%20Care%20LLP!5e0!3m2!1sen!2sin!4v1756665267018!5m2!1sen!2sin"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
            <div className='footer-bottom w-full bg-p-c px-10'>
                <div className='max-w-[1200px] mx-auto py-5 '>
                    <div className='w-full flex flex-col md:flex-row justify-between items-center gap-2'>
                        <p className='m-0 quando text-c-l text-[14px] leading-5 text-center md:text-start'>© 2025 Franch Global Health Care LLP . All Rights Reserved</p>
                        <p className='m-0 quando text-c-l text-[14px] leading-5 text-center md:text-start'>Powered By : FranchGlobalTeam</p>
                    </div>
                </div>
            </div>
        </section >
    )
}

export default Footer
