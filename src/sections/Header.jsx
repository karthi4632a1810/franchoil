import React, { useRef, useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import "../css/header.css"
import "../css/header-mobile.css"
import logo from "/images/logo.webp"
import year25 from "/images/25_years.webp"

import { Link, Navigate, NavLink, useNavigate } from "react-router-dom";
import ProfileAccountMenu from "../components/ProfileAccountMenu";
import useRequireCustomerLogin from "../hooks/useRequireCustomerLogin";

import { useProducts } from "../hooks/useProducts.js";
import useAuth from "../hooks/useAuth";
import {
    fetchCustomerFavorites,
    addCustomerFavorite,
    removeCustomerFavorite,
} from "../api/customerDataApi.js";
import MaskImage from '../tools/MaskImage.jsx';
import { useLocation } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { shouldHideFromProductListings } from "../utils/franchOilCart";

function Header() {
    const [searchParams] = useSearchParams();
    const category = searchParams.get("category");

    // Memoize isMobile so it doesn't re-run on every render
    const isMobile = useMemo(() => document.body.clientWidth > 1250, []);


    const [posState, setPosState] = useState(3);
    const [cerPopup, setCerPopup] = useState(false);
    const [zoomedImg, setZoomedImg] = useState(null);

    const navigate = useNavigate();
    const { user, isCustomerLoggedIn, logout } = useAuth();
    const { requireCustomerLogin } = useRequireCustomerLogin();

    const handleSignOut = async () => {
        await logout();
    };

    const goToDashboard = (e) => {
        e?.preventDefault();
        if (!requireCustomerLogin("/dashboard")) return;
        navigate("/dashboard");
    };

    const goToWishList = (e) => {
        e?.preventDefault();
        if (!requireCustomerLogin("/dashboard")) return;
        navigate("/dashboard");
    };

    const searchRef = useRef();
    const [searchActive, setSearchActive] = useState(false);
    const [search, setSearch] = useState("");
    const location = useLocation();

    const [myProfile, setMyProfile] = useState({ name: "", email: "", phone: "", photoURL: "" });

    useEffect(() => {
        if (searchRef.current) {
            searchRef.current.addEventListener("focus", () => setSearchActive(true));
            searchRef.current.addEventListener("blur", () => setTimeout(() => {
                setSearchActive(false);
            }, 1000));
        }
        return () => {
            if (searchRef.current) {
                searchRef.current.removeEventListener("focus", () => setSearchActive(true));
                searchRef.current.removeEventListener("blur", () => {
                    setTimeout(() => {
                        setSearchActive(false);
                    }, 1000);
                });
            }
        };
    }, [searchRef]);
    useEffect(() => {
        setSearch("");
    }, [location.pathname]);
    const [favs, setFavs] = useState([]);

    // Only fetch products when the user is actively searching (saves an IndexedDB round-trip on every page)
    const { products, loading: prodLoading } = useProducts({
        onlyActive: true,
        search,
        pageSize: 200,
        skipFetch: !searchActive && search.trim() === "",
    });

    const toggleFav = async (product) => {
        if (!requireCustomerLogin() || !isCustomerLoggedIn) return;
        const existing = favs.find((f) => f.productId === product.id);
        const payload = {
            productId: product.id,
            title: product.title,
            price: Number(product.price) || 0,
            imageURL: product.imageURL || "",
        };
        try {
            if (existing) {
                const items = await removeCustomerFavorite({
                    productId: product.id,
                    lineId: existing.id,
                });
                setFavs(items);
            } else {
                const items = await addCustomerFavorite(payload);
                setFavs(items);
            }
        } catch (err) {
            console.error("toggleFav:", err);
        }
    };

    useEffect(() => {
        if (!user) return;

        if (isCustomerLoggedIn) {
            setMyProfile({
                name: user.name || user.displayName || "",
                email: user.email || "",
                phone: user.phone || "",
                photoURL: user.photoURL || "",
            });
            fetchCustomerFavorites()
                .then(setFavs)
                .catch(console.error);
        } else {
            setFavs([]);
        }
    }, [user, isCustomerLoggedIn]);

    const profileLinks = useRef();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    const handleMenuOpen = (e) => {
        e.stopPropagation();
        setPosState(5);
        setMobileMenuOpen((open) => !open);
    };

    const texts = [
        "AYURVEDIC",
        "COSMETIC",
        "NUTRACEUTICAL"
    ];
    const [currentTextIndex, setCurrentTextIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        }, 5000); // Switch every 2 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!mobileMenuOpen) return undefined;

        function handleClickOutside(e) {
            const menuEl = document.getElementById('mobile-bottom-menu-panel');
            if (menuEl?.contains(e.target)) return;
            if (profileLinks.current?.contains(e.target)) return;
            setMobileMenuOpen(false);
        }

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [mobileMenuOpen]);

    useEffect(() => {
        if (!mobileMenuOpen) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [mobileMenuOpen]);



    return (
        <>
            <div className="year_25_img"></div>
            {isMobile ?
                <header className=''>
                    <div className="top-bar-wrapper w-full bg-p-c">
                        <div className='top-bar max-w-[1200px] mx-auto py-3 px-4 2xl:px-0'>
                            <div className='grid grid-cols-12'>
                                {/* <div className='col-span-4 flex items-center'>
                                    <div className='top-left-links quando text-c-l flex gap-7 font-size text-[11px] font-normal'>
                                        <Link to="/about">About Us</Link>
                                        <Link to="/dashboard">My Account</Link>
                                        <Link to="/orders">Order Tracking</Link>
                                    </div>
                                </div> */}
                                <div className='col-span-9 flex items-center justify-center'>
                                    <marquee behavior="scroll" direction="left" scrollamount="8">
                                        <div className='flex gap-30'>
                                            <div className='flex gap-3 items-center text-white'>Free gift with every order — <strong className="text-[var(--s-c)] flex gap-1 items-center inline-flex"><MaskImage size="1.1em" hBg="var(--s-c)" bg="var(--s-c)" url="https://api.iconify.design/meteor-icons:gift.svg" />No minimum purchase</strong></div>
                                            <div className='flex gap-3 items-center text-white'>Free gift with every order — <strong className="text-[var(--s-c)] flex gap-1 items-center inline-flex"><MaskImage size="1.1em" hBg="var(--s-c)" bg="var(--s-c)" url="https://api.iconify.design/meteor-icons:gift.svg" />No minimum purchase</strong></div>
                                            <div className='flex gap-3 items-center text-white'>Free gift with every order — <strong className="text-[var(--s-c)] flex gap-1 items-center inline-flex"><MaskImage size="1.1em" hBg="var(--s-c)" bg="var(--s-c)" url="https://api.iconify.design/meteor-icons:gift.svg" />No minimum purchase</strong></div>
                                            <div className='flex gap-3 items-center text-white'>Free gift with every order — <strong className="text-[var(--s-c)] flex gap-1 items-center inline-flex"><MaskImage size="1.1em" hBg="var(--s-c)" bg="var(--s-c)" url="https://api.iconify.design/meteor-icons:gift.svg" />No minimum purchase</strong></div>
                                            <div className='flex gap-3 items-center text-white'>Free gift with every order — <strong className="text-[var(--s-c)] flex gap-1 items-center inline-flex"><MaskImage size="1.1em" hBg="var(--s-c)" bg="var(--s-c)" url="https://api.iconify.design/meteor-icons:gift.svg" />No minimum purchase</strong></div>
                                            <div className='flex gap-3 items-center text-white'>Free gift with every order — <strong className="text-[var(--s-c)] flex gap-1 items-center inline-flex"><MaskImage size="1.1em" hBg="var(--s-c)" bg="var(--s-c)" url="https://api.iconify.design/meteor-icons:gift.svg" />No minimum purchase</strong></div>
                                            <div className='flex gap-3 items-center text-white'>Free gift with every order — <strong className="text-[var(--s-c)] flex gap-1 items-center inline-flex"><MaskImage size="1.1em" hBg="var(--s-c)" bg="var(--s-c)" url="https://api.iconify.design/meteor-icons:gift.svg" />No minimum purchase</strong></div>
                                            <div className='flex gap-3 items-center text-white'>Free gift with every order — <strong className="text-[var(--s-c)] flex gap-1 items-center inline-flex"><MaskImage size="1.1em" hBg="var(--s-c)" bg="var(--s-c)" url="https://api.iconify.design/meteor-icons:gift.svg" />No minimum purchase</strong></div>
                                            <div className='flex gap-3 items-center text-white'>Free gift with every order — <strong className="text-[var(--s-c)] flex gap-1 items-center inline-flex"><MaskImage size="1.1em" hBg="var(--s-c)" bg="var(--s-c)" url="https://api.iconify.design/meteor-icons:gift.svg" />No minimum purchase</strong></div>
                                            <div className='flex gap-3 items-center text-white'>Free gift with every order — <strong className="text-[var(--s-c)] flex gap-1 items-center inline-flex"><MaskImage size="1.1em" hBg="var(--s-c)" bg="var(--s-c)" url="https://api.iconify.design/meteor-icons:gift.svg" />No minimum purchase</strong></div>
                                        </div>
                                    </marquee>
                                    {/* <div className='quando flex justify-center text-[10px] text-c-l'>
                                        <p className='m-0'>WE ARE CREATING UNIQUE  <span className='text-[var(--s-c)] top-bar-cont'>{texts[currentTextIndex]}</span></p>
                                    </div> */}
                                </div>
                                <div className='col-span-3 flex items-center justify-end'>
                                    <div className='top-right-links flex gap-4'>
                                        <a href='https://www.facebook.com/FranchFM'>
                                            <div className='bg-w w-max p-1 rounded-full flex justify-center items-center  hover:!bg-[#007E3C] transition-[.4s] box-sha-1'>
                                                <div
                                                    className="mask-item"
                                                    style={{
                                                        "--m-size": "1.2rem",
                                                        "--m-bg": "var(--p-c)",
                                                        "--m-url": "url(https://api.iconify.design/gg:facebook.svg)",
                                                        "--m-h-bg": "var(--s-c)"
                                                    }}
                                                ></div>
                                            </div>
                                        </a>
                                        <a href='https://www.instagram.com/franchindia/'>
                                            <div className='bg-w w-max p-1 rounded-full flex justify-center items-center  hover:!bg-[var(--p-c)] transition-[.4s] box-sha-1'>
                                                <div
                                                    className="mask-item"
                                                    style={{
                                                        "--m-size": "1.2rem",
                                                        "--m-bg": "var(--p-c)",
                                                        "--m-url": "url(https://api.iconify.design/mdi:instagram.svg)",
                                                        "--m-h-bg": "var(--s-c)"
                                                    }}
                                                ></div>
                                            </div>
                                        </a>
                                        <a href='https://www.youtube.com/@franchglobalhealthcarellp2381'>
                                            <div className='bg-w w-max p-1 rounded-full flex justify-center items-center  hover:!bg-[var(--p-c)] transition-[.4s] box-sha-1'>
                                                <div
                                                    className="mask-item"
                                                    style={{
                                                        "--m-size": "1.2rem",
                                                        "--m-bg": "var(--p-c)",
                                                        "--m-url": "url(https://api.iconify.design/flowbite:youtube-solid.svg)",
                                                        "--m-h-bg": "var(--s-c)"
                                                    }}
                                                ></div>
                                            </div>
                                        </a>
                                        <a href='https://x.com/FranchTweets'>
                                            <div className='bg-w w-max p-1 rounded-full flex justify-center items-center hover:!bg-[var(--p-c)] transition-[.4s] box-sha-1'>
                                                <div
                                                    className="mask-item"
                                                    style={{
                                                        "--m-size": "1.2rem",
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
                        </div>
                    </div>
                    <div className='header-account-wrapper w-full bg-w'>
                        <div className='max-w-[1200px] py-6 mx-auto px-4 2xl:px-0'>
                            <div className='grid grid-cols-12 items-center'>
                                <div className="col-span-1 relative">
                                    <Link to="/" className='logo-wrapper w-full'>
                                        <img className='w-full' src={logo} alt="" />
                                    </Link>
                                    <div className={`icon_wrapper absolute left-[150%] top-[0%] flex justify-center items-center active`}>
                                        <div className='play-btn-img icon'></div>

                                    </div>
                                </div>

                                <div className='col-span-6 relative'>
                                    <div className='header-search-wrapper px-3 flex justify-end '>
                                        <div className='input-wrapper  w-[85%] flex items-center  border-[var(--a-c-4)] border-[.5px] box-sha-2 rounded-[3px] py-[1px] px-[1px] relative'>
                                            <input id='header-search'
                                                value={search}
                                                ref={searchRef}
                                                onChange={(e) => setSearch(e.target.value)}
                                                type="text" placeholder='' className=' w-full placeholder-[var(--t-c-p)] placeholder:text-[12px] text-[var(--t-p-c)] text-[12px] poppins  px-4' />
                                            <a href={`/products?search=${search}`} htmlFor="header-search " className='search-label px-2 bg-p-c py-[7px]  flex items-center gap-2 poppins text-[16px] rounded-[2px] box-sha-1 cursor-pointer hover:!bg-[var(--bg-b-2)] transition-[.4s] '
                                                style={{ color: "color-mix(in srgb, var(--t-c-l) 80%, transparent)", backgroundColor: "color-mix(in srgb, var(--p-c) 80%, transparent)" }}>
                                                <div
                                                    className="mask-item"
                                                    style={{
                                                        "--m-size": "1.1rem",
                                                        "--m-bg": "var(--t-c-l)",
                                                        "--m-url": "url(https://api.iconify.design/hugeicons:search-02.svg)",
                                                        // "--m-h-bg": "var(--p-c)"
                                                    }}
                                                ></div>
                                                Search</a>
                                            {!prodLoading && searchActive && search != "" && <div className="absolute top-[120%] left-0 right-0 grid sm:grid-cols-1 lg:grid-cols-1 gap-3 z-5 p-4 box-sha-1 bg-w rounded-[10px] ">
                                                {!products.length == 0 ? products.filter((p) => !shouldHideFromProductListings(p)).map((p) => {
                                                    const isFav = favs.some((f) => f.productId === p.id);
                                                    return (
                                                        <Link to={`/product/${p.sku}`} key={p.id} className="rounded-xl border bg-white border-green-200 p-3 flex items-center gap-3 hover:bg-green-100 transition">
                                                            {p.imageURL ? (
                                                                <img src={p.imageURL} alt="" className="h-16 w-16 rounded object-cover" />
                                                            ) : (
                                                                <div className="h-16 w-16 rounded bg-green-200 grid place-items-center">🛍️</div>
                                                            )}
                                                            <div className="flex-1 min-w-0 me-4">
                                                                <div className="font-medium truncate" title={p.title}>{p.title}</div>
                                                                <div className="text-sm text-slate-400">₹{p.price}</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    className="cursor-pointer"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        toggleFav(p);
                                                                    }}
                                                                >
                                                                    <MaskImage bg={isFav ? "green" : "black"} hBg="green" url={isFav ? "https://api.iconify.design/material-symbols:star-rounded.svg" : "https://api.iconify.design/material-symbols:star-outline-rounded.svg"} />
                                                                </button>
                                                            </div>
                                                        </Link>
                                                    );
                                                }) : <div>No products found</div>}
                                            </div>}
                                        </div>

                                    </div>
                                    <div className={` absolute right-[0%] top-[50%] translate-y-[-50%] translate-x-[100%] flex justify-center items-center active`}>
                                        <div title='Certificate' onClick={() => setCerPopup(true)} className={`video-player-btn-wrapper certificate animate-blink-scale  flex justify-center items-center active `} style={{ cursor: 'pointer' }}>
                                            <div className='cer-btn-img'></div>
                                        </div>
                                    </div>
                                </div>
                                <div className='col-span-5'>
                                    <div className='flex gap-10 justify-end'>
                                        <div className='header-contact-wrapper flex gap-1'>
                                            <div className='contact-icon-wrapper w-[30px]'>
                                                <div
                                                    className="mask-item"
                                                    style={{
                                                        "--m-size": "100%",
                                                        "--m-bg": "var(--p-c)",
                                                        "--m-url": "url(https://api.iconify.design/garden:headset-fill-12.svg)",
                                                        // "--m-h-bg": "var(--p-c)"
                                                    }}
                                                ></div>
                                            </div>
                                            <div className='montagu-slab flex flex-col justify-center'>
                                                <h5 className='m-0 text-[10px] font-semibold'>CONTACT US </h5>
                                                <a href='tel:+919841854321' className='m-0 text-[10px] tracking-[2px]' style={{ color: "color-mix(in srgb, var(--t-c-d) 50%, transparent)" }}>9841854321</a>
                                            </div>
                                        </div>
                                        <a href="/dashboard" onClick={goToWishList} className='wish-list-wrapper flex gap-1 cursor-pointer'>
                                            <div className='contact-icon-wrapper w-[25px] relative '>
                                                <div
                                                    className="mask-item"
                                                    style={{
                                                        "--m-size": "100%",
                                                        "--m-bg": "var(--t-c-d)",
                                                        "--m-url": "url(https://api.iconify.design/si:heart-alt-line.svg)",
                                                        // "--m-h-bg": "var(--p-c)"
                                                    }}
                                                ></div>
                                            </div>
                                            <div className='poppins flex flex-col justify-center'>
                                                <h5 className='m-0 text-[13px] tracking-[2px]' style={{ color: "color-mix(in srgb, var(--t-c-d) 68%, transparent)" }}>Wish List</h5>
                                            </div>
                                        </a>
                                        <a href="/dashboard" onClick={goToDashboard} className='cart-wrapper flex gap-1 cursor-pointer'>
                                            <div className='contact-icon-wrapper w-[25px] relative'>
                                                <div
                                                    className="mask-item"
                                                    style={{
                                                        "--m-size": "100%",
                                                        "--m-bg": "var(--t-c-d)",
                                                        "--m-url": "url(https://api.iconify.design/ic:outline-shopping-cart.svg)",
                                                        // "--m-h-bg": "var(--p-c)"
                                                    }}
                                                ></div>

                                            </div>
                                            <div className='poppins flex flex-col justify-center'>
                                                <h5 className='m-0 text-[13px] tracking-[2px]' style={{ color: "color-mix(in srgb, var(--t-c-d) 68%, transparent)" }}>Cart</h5>
                                            </div>
                                        </a>
                                        <ProfileAccountMenu
                                            isCustomerLoggedIn={isCustomerLoggedIn}
                                            user={user}
                                            myProfile={myProfile}
                                            onSignOut={handleSignOut}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className='header-nav-links-wrapper w-full border bg-w ' style={{ borderColor: "color-mix(in srgb, var(--bg-b-2) 40%, transparent)" }}>
                        <div className='max-w-[1200px]  mx-auto px-4 2xl:px-0'>
                            <div className='grid grid-cols-12 items-center'>
                                {/* <div className="w-[300px] relative group col-span-3 bg-p-c py-[18px]">
                                    <div className=' flex gap-3 items-center px-4 justify-around'>
                                        <div className='categ-icon-wrapper '>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": "1.9rem",
                                                    "--m-bg": "var(--t-c-l)",
                                                    "--m-url": "url(https://api.iconify.design/iconamoon:category.svg)",
                                                    //
                                                }}
                                            ></div>
                                        </div>
                                        <div className=" inline-block">
                                          
                                            <h5 className="m-0 text-[16px] text-c-l poppins font-[500] tracking-widest cursor-pointer">
                                                Browse All Categories
                                            </h5>

                                          
                                            <div className="absolute w-full left-0 top-[100%] z-40 bg-white shadow-lg rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                                                <ul className="py-2 w-full flex flex-col">
                                                    <a href="/products?category=Wellness" className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Wellness</a>
                                                    <a href="/products?category=Soaps" className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Soaps</a>
                                                </ul>
                                            </div>
                                        </div>

                                    </div>
                                </div> */}
                                <div className="col-span-2">
                                    {/* <div className=' flex items-center px-5 gap-2 '>
                                        <div className='categ-icon-wrapper '>
                                            <div
                                                className="mask-item"
                                                style={{
                                                    "--m-size": "1.9rem",
                                                    "--m-bg": "var(--p-c)",
                                                    "--m-url": "url(https://api.iconify.design/tabler:rosette-discount-filled.svg)",
                                                    // "--m-h-bg": "var(--p-c)"
                                                }}
                                            ></div>
                                        </div>
                                        <h5 className='m-0 text-[16px] text-c-d poppins font-[500] tracking-widest quando'>Hot Deal</h5>
                                    </div> */}
                                    <div className='quando flex flex-col justify-center text-[10px] text-c-l'>
                                        <p className='m-0 text-black'>WE ARE CREATING UNIQUE  <strong className='text-green-500 top-bar-cont text-2xl'>{texts[currentTextIndex]}</strong> PRODUCTS</p>
                                    </div>
                                </div>
                                <div className='col-span-10 '>
                                    <div className='nav-links-wrapper flex justify-end'>
                                        <nav className='links-wrapper quando text-[13px] flex gap-10 justify-end w-full'>
                                            <NavLink to="/" className={({ isActive }) => (isActive ? 'active ' : '') + 'py-6 tracking-[2px] nav-link-tag'}>Home</NavLink>
                                            <NavLink to="/about" className={({ isActive }) => (isActive ? 'active ' : '') + 'py-6 tracking-[2px] nav-link-tag'}>About Us</NavLink>
                                            <Link
                                                to="/products?category=Wellness"
                                                className={`py-6 tracking-[2px] nav-link-tag ${category === "Wellness" ? "active" : ""
                                                    }`}
                                            >
                                                Wellness
                                            </Link>

                                            {/* Soaps */}
                                            <Link
                                                to="/products?category=Soaps"
                                                className={`py-6 tracking-[2px] nav-link-tag ${category === "Soaps" ? "active" : ""
                                                    }`}
                                            >
                                                Soaps
                                            </Link>

                                            {/* Shop Dropdown */}
                                            <div className="py-6 tracking-[2px] nav-link-tag relative drop-down nav-drop-group">

                                                {/* Shop main link */}
                                                <Link
                                                    to="/products"
                                                    className={`py-6 tracking-[2px] nav-link-tag ${location.pathname === "/products" && !category ? "active" : ""
                                                        }`}
                                                >
                                                    Shop
                                                </Link>

                                                {/* Dropdown */}
                                                <div className="drop-down-links absolute bg-white top-full left-1/2 transform -translate-x-1/2 w-[200px] z-10 flex flex-col p-2">

                                                    <Link
                                                        to="/products"
                                                        className={`tracking-[2px] p-4 drop-link ${location.pathname === "/products" && !category ? "active" : ""
                                                            }`}
                                                    >
                                                        <div>All Products</div>
                                                    </Link>

                                                </div>
                                            </div>


                                            <NavLink to="/contact" className={({ isActive }) => (isActive ? 'active ' : '') + 'py-6 tracking-[2px] nav-link-tag'}>Contact Us</NavLink>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div >
                </header >
                :
                <header>
                    <div
                        className={`mobile-header-account-wrapper w-full bg-w fixed top-0 left-0 z-50 transition-all duration-300 `}
                    >
                        <div className="max-w-[1200px] py-6 mx-auto px-4 2xl:px-0">
                            <div className="grid grid-cols-12 items-center">
                                <div className="col-span-12 flex gap-10 justify-center relative">
                                    <div className={` absolute left-[0%] top-[50%]  translate-y-[-50%] flex justify-center items-center active`}>
                                        <div title='Certificate' onClick={() => setCerPopup(true)} className={`video-player-btn-wrapper certificate animate-blink-scale flex justify-center items-center active `} style={{ cursor: 'pointer' }}>
                                            <div className='cer-btn-img'></div>
                                        </div>
                                    </div>
                                    <Link to="/" className="logo-wrapper max-w-[100px]">
                                        <img className="w-full" src={logo} alt="Logo" />
                                    </Link>
                                    <div className={`icon_wrapper flex justify-center items-center active `}>
                                        <div className='play-btn-img'></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='nav-mobile-main w-full'>
                        <div className=' nav-mobile-wrapper fixed z-[100000]'>
                            <div data-pos={posState} className='grid grid-cols-10 mobile-nav-links-wrapper relative rounded-full'>
                                <div className='mobile-nav-circle-wrapper'>
                                    <div className='mobile-nav-circle'></div>
                                </div>
                                <div className="col-span-2">
                                    <div onClick={() => { setPosState(4); closeMobileMenu(); }} data-pos="4" className='mobile-nav-links w-full flex justify-center py-1'>
                                        <div className='flex flex-col items-center justify-center' onClick={(e) => e.stopPropagation()}>
                                            
                                            <ProfileAccountMenu
                                                isCustomerLoggedIn={isCustomerLoggedIn}
                                                user={user}
                                                myProfile={myProfile}
                                                onSignOut={handleSignOut}
                                                dropUp
                                            />
                                            <p className='m-0 mobile-nav-content leading-[1.2] poppins text-[12px] font-bold tracking-[1px] pt-1'>
                                                PROFILE
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 ">
                                    <div onClick={() => { setPosState(2); closeMobileMenu(); }} data-pos="2" className='mobile-nav-links w-full'>
                                        <Link to="/products" className='w-full flex items-center justify-center py-3 flex-col gap-2'>
                                            <div className='w-full  mobile-nav-icon-wrapper flex justify-center'>
                                                <div
                                                    className="mask-item"
                                                    style={{
                                                        "--m-size": "2rem",
                                                        "--m-bg": "var(--p-c)",
                                                        "--m-url": "url(https://api.iconify.design/material-symbols:content-paste-search.svg?color=%23ff0000)",
                                                        // "--m-h-bg": "var(--s-c)"
                                                    }}
                                                ></div>
                                            </div>
                                            <p className='m-0 mobile-nav-content leading-[1.2] poppins text-[12px] font-bold tracking-[1px]'>
                                                SHOP
                                            </p>
                                        </Link>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <div onClick={() => { setPosState(3); closeMobileMenu(); }} data-pos="3" className='mobile-nav-links w-full'>
                                        <Link to="/" className='w-full flex items-center justify-center py-3 flex-col gap-2'>
                                            <div className='w-full  mobile-nav-icon-wrapper flex justify-center'>
                                                <div
                                                    className="mask-item"
                                                    style={{
                                                        "--m-size": "1.5rem",
                                                        "--m-bg": "var(--p-c)",
                                                        "--m-url": "url(https://api.iconify.design/famicons:home.svg?color=%23ff0000)",
                                                        // "--m-h-bg": "var(--s-c)"
                                                    }}
                                                ></div>
                                            </div>
                                            <p className='m-0 mobile-nav-content leading-[1.2] poppins text-[12px] font-bold tracking-[1px]'>
                                                HOME
                                            </p>
                                        </Link>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <div onClick={() => { setPosState(1); closeMobileMenu(); }} data-pos="1" className='mobile-nav-links w-full'>
                                        <a href="/dashboard" onClick={goToDashboard} className='w-full flex items-center justify-center py-3 flex-col gap-2 cursor-pointer'>
                                            <div className='w-full  mobile-nav-icon-wrapper flex justify-center'>
                                                <div
                                                    className="mask-item"
                                                    style={{
                                                        "--m-size": "2rem",
                                                        "--m-bg": "var(--p-c)",
                                                        "--m-url": "url(https://api.iconify.design/material-symbols:remove-shopping-cart-rounded.svg?color=%23ff0000)",
                                                        // "--m-h-bg": "var(--s-c)"
                                                    }}
                                                ></div>
                                            </div>
                                            <p className='m-0 mobile-nav-content leading-[1.2] poppins text-[12px] font-bold tracking-[1px]'>
                                                CART
                                            </p>
                                        </a>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <div ref={profileLinks} onClick={handleMenuOpen} data-pos="5" className='mobile-nav-links w-full'>
                                        <div className='w-full flex items-center justify-center py-3 flex-col gap-2'>
                                            <div className='w-full  mobile-nav-icon-wrapper flex justify-center'>
                                                <div
                                                    className="mask-item"
                                                    style={{
                                                        "--m-size": "2rem",
                                                        "--m-bg": "var(--p-c)",
                                                        "--m-url": "url(https://api.iconify.design/line-md:list-3-filled.svg?color=%23ff0000)",
                                                        // "--m-h-bg": "var(--s-c)"
                                                    }}
                                                ></div>
                                            </div>
                                            <p className='m-0 mobile-nav-content leading-[1.2] poppins text-[12px] font-bold tracking-[1px]'>
                                                MENU
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {typeof document !== 'undefined' &&
                        createPortal(
                            <>
                                <div
                                    className={`mobile-menu-backdrop ${mobileMenuOpen ? 'active' : ''}`}
                                    onClick={closeMobileMenu}
                                    aria-hidden={!mobileMenuOpen}
                                />
                                <div
                                    id="mobile-bottom-menu-panel"
                                    role="dialog"
                                    aria-modal="true"
                                    aria-label="Menu"
                                    className={`mobile-search-box p-6 ${mobileMenuOpen ? 'active' : ''}`}
                                >
                                    <div className='header-search-wrapper  flex justify-end'>
                                        <div className='input-wrapper  w-[100%] relative flex items-center  border-[var(--a-c-4)] border-[.5px] box-sha-2  rounded-tl-[3px] rounded-bl-[3px] rounded-tr-[3px] rounded-br-[3px]  py-[1px] px-[1px] '>
                                            <input
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                id='header-search' type="text" placeholder='' className=' w-full placeholder:text-[12px] poppins text-[var(--t-p-c)] text-[12px]   px-4' />
                                            <a href={`/products?search=${search}`} onClick={closeMobileMenu} htmlFor="header-search " className='search-label px-2 bg-p-c py-[5px]  flex items-center gap-2 poppins text-[13px] rounded-[2px] box-sha-1 cursor-pointer hover:!bg-[var(--bg-b-2)] transition-[.4s] '
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
                                    <div className='mobile-otherLinks  mt-8 flex flex-col gap-1 '>
                                        <div className='grid grid-cols-12 gap-2'>
                                            <div className='col-span-6'>
                                                <Link to="/about" onClick={closeMobileMenu} className='w-full flex items-center justify-between other-links py-[6px] px-3 gap-2 rounded-[100vh]'>
                                                    <p className='m-0 mobile-nav-content leading-[1.2] poppins text-[8px] font-bold tracking-[1px]'>
                                                        ABOUT US
                                                    </p>
                                                    <div className=' mobile-nav-icon-wrapper flex '>
                                                        <div
                                                            className="mask-item"
                                                            style={{
                                                                "--m-size": "1.2rem",
                                                                "--m-bg": "var(--bg-w)",
                                                                "--m-url": "url(https://api.iconify.design/material-symbols:chevron-right-rounded.svg?color=%23ff0000)",
                                                                // "--m-h-bg": "var(--s-c)"
                                                            }}
                                                        ></div>
                                                    </div>

                                                </Link>
                                            </div>
                                            <div className='col-span-6'>
                                                <Link to="/contact" onClick={closeMobileMenu} className='w-full flex items-center justify-between other-links py-[6px] px-3 gap-2 rounded-[100vh]'>
                                                    <p className='m-0 mobile-nav-content leading-[1.2] poppins text-[8px] font-bold tracking-[1px]'>
                                                        CONTACT US
                                                    </p>
                                                    <div className=' mobile-nav-icon-wrapper flex '>
                                                        <div
                                                            className="mask-item"
                                                            style={{
                                                                "--m-size": "1.2rem",
                                                                "--m-bg": "var(--bg-w)",
                                                                "--m-url": "url(https://api.iconify.design/material-symbols:chevron-right-rounded.svg?color=%23ff0000)",
                                                                // "--m-h-bg": "var(--s-c)"
                                                            }}
                                                        ></div>
                                                    </div>
                                                </Link>
                                            </div>
                                            <div className='col-span-6'>
                                                <Link to="/faq" onClick={closeMobileMenu} className='w-full flex items-center justify-between other-links py-[6px] px-3 gap-2 rounded-[100vh]'>
                                                    <p className='m-0 mobile-nav-content leading-[1.2] poppins text-[8px] font-bold tracking-[1px]'>
                                                        FAQ
                                                    </p>
                                                    <div className=' mobile-nav-icon-wrapper flex '>
                                                        <div
                                                            className="mask-item"
                                                            style={{
                                                                "--m-size": "1.2rem",
                                                                "--m-bg": "var(--bg-w)",
                                                                "--m-url": "url(https://api.iconify.design/material-symbols:chevron-right-rounded.svg?color=%23ff0000)",
                                                                // "--m-h-bg": "var(--s-c)"
                                                            }}
                                                        ></div>
                                                    </div>

                                                </Link>
                                            </div>
                                            <div className='col-span-6'>
                                                <Link to="/blogs" onClick={closeMobileMenu} className='w-full flex items-center justify-between other-links py-[6px] px-3 gap-2 rounded-[100vh]'>
                                                    <p className='m-0 mobile-nav-content leading-[1.2] poppins text-[8px] font-bold tracking-[1px]'>
                                                        BLOG
                                                    </p>
                                                    <div className=' mobile-nav-icon-wrapper flex '>
                                                        <div
                                                            className="mask-item"
                                                            style={{
                                                                "--m-size": "1.2rem",
                                                                "--m-bg": "var(--bg-w)",
                                                                "--m-url": "url(https://api.iconify.design/material-symbols:chevron-right-rounded.svg?color=%23ff0000)",
                                                                // "--m-h-bg": "var(--s-c)"
                                                            }}
                                                        ></div>
                                                    </div>

                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='mobile-social-media-links mt-7 flex gap-1 items-center justify-center'>
                                        <div className='m-0 mobile-social-media-heading w-max text-p-c  leading-[1.2] poppins text-[8px] font-bold tracking-[1px] rounded-full p-3'>
                                            SOCIAL MEDIAS
                                        </div>:
                                        <div className='mobile-social-medias flex gap-3 ms-4'>
                                            <Link to="https://x.com/FranchTweets">
                                                <div className='bg-w w-max p-1 rounded-full flex justify-center items-center hover:!bg-[var(--p-c)] transition-[.4s] box-sha-1'>
                                                    <div
                                                        className="mask-item"
                                                        style={{
                                                            "--m-size": ".8rem",
                                                            "--m-bg": "var(--p-c)",
                                                            "--m-url": "url(https://api.iconify.design/hugeicons:new-twitter.svg?color=%23ff0000)",
                                                            // "--m-h-bg": "var(--s-c)"
                                                        }}
                                                    ></div>
                                                </div>
                                            </Link>
                                            <Link to="https://www.instagram.com/franchindia/">
                                                <div className='bg-w w-max p-1 rounded-full flex justify-center items-center  hover:!bg-[var(--p-c)] transition-[.4s] box-sha-1'>
                                                    <div
                                                        className="mask-item"
                                                        style={{
                                                            "--m-size": ".8rem",
                                                            "--m-bg": "var(--p-c)",
                                                            "--m-url": "url(https://api.iconify.design/mdi:instagram.svg)",
                                                            // "--m-h-bg": "var(--s-c)"
                                                        }}
                                                    ></div>
                                                </div>
                                            </Link>
                                            <Link to="https://www.youtube.com/@franchglobalhealthcarellp2381">
                                                <div className='bg-w w-max p-1 rounded-full flex justify-center items-center  hover:!bg-[var(--p-c)] transition-[.4s] box-sha-1'>
                                                    <div
                                                        className="mask-item"
                                                        style={{
                                                            "--m-size": ".8rem",
                                                            "--m-bg": "var(--p-c)",
                                                            "--m-url": "url(https://api.iconify.design/flowbite:youtube-solid.svg)",
                                                            // "--m-h-bg": "var(--s-c)"
                                                        }}
                                                    ></div>
                                                </div>
                                            </Link>
                                            <Link to="https://www.facebook.com/FranchFM">
                                                <div className='bg-w w-max p-1 rounded-full flex justify-center items-center  hover:!bg-[#007E3C] transition-[.4s] box-sha-1'>
                                                    <div
                                                        className="mask-item"
                                                        style={{
                                                            "--m-size": ".8rem",
                                                            "--m-bg": "var(--p-c)",
                                                            "--m-url": "url(https://api.iconify.design/gg:facebook.svg)",
                                                            // "--m-h-bg": "var(--s-c)"
                                                        }}
                                                    ></div>
                                                </div>
                                            </Link>
                                        </div>

                                    </div>
                                </div>
                            </>,
                            document.body
                        )}
                </header >
            }
            {/* Certificate Popup Modal */}
            {
                cerPopup && (
                    <div className="cer-modal-overlay" onClick={() => setCerPopup(false)}>
                        <div className="cer-modal-box" onClick={e => e.stopPropagation()}>
                            <button className="cer-modal-close" onClick={() => setCerPopup(false)}>
                                <div
                                    className="mask-item"
                                    style={{
                                        "--m-size": "1.6rem",
                                        "--m-bg": "var(--p-c)",
                                        "--m-url": "url(https://api.iconify.design/material-symbols:close-small.svg?color=%23ff0000)",
                                        "--m-h-bg": "red"
                                    }}
                                ></div>
                            </button>
                            <div className="cer-modal-header">
                                <div
                                    className="mask-item shrink-0"
                                    style={{
                                        "--m-size": "1rem",
                                        "--m-bg": "var(--p-c)",
                                        "--m-url": "url(https://api.iconify.design/mingcute:safety-certificate-fill.svg?color=%23ff0000)",
                                    }}
                                ></div>
                                <h3 className="cer-modal-title poppins">Scientifically proved by University of Madras</h3>
                            </div>
                            {/* <p className="cer-zoom-hint poppins">Click on image to zoom</p> */}
                            <div className="cer-modal-grid">
                                <div className="cer-modal-item" onClick={() => setZoomedImg('/cer/1.webp')}>
                                    <img src="/cer/1.webp" alt="Certificate 1" className="cer-modal-img" />
                                    {/* <p className="cer-modal-label poppins">ISO Certification</p> */}
                                </div>
                                <div className="cer-modal-item" onClick={() => setZoomedImg('/cer/2.webp')}>
                                    <img src="/cer/2.webp" alt="Certificate 2" className="cer-modal-img" />
                                    {/* <p className="cer-modal-label poppins">GMP Certification</p> */}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Certificate Zoom Lightbox */}
            {
                zoomedImg && (
                    <div className="cer-lightbox-overlay" onClick={() => setZoomedImg(null)}>
                        <button className="cer-lightbox-close" onClick={() => setZoomedImg(null)}>
                            <div
                                className="mask-item"
                                style={{
                                    "--m-size": "1.8rem",
                                    "--m-bg": "white",
                                    "--m-url": "url(https://api.iconify.design/material-symbols:close-small.svg?color=%23ff0000)",
                                }}
                            ></div>
                        </button>
                        <img src={zoomedImg} alt="Zoomed Certificate" className="cer-lightbox-img" onClick={e => e.stopPropagation()} />
                    </div>
                )
            }
        </>
    )
}

export default Header
