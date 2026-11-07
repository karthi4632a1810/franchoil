import React, { useState, useEffect, useCallback } from 'react'
import "../css/category.css"
import { useProducts } from "../hooks/useProducts.js";
import { useAnimation } from '../hooks/useAnimation.js';
import { shouldHideFromProductListings } from '../utils/franchOilCart';

function Category() {

    const [elements, setElements] = useState([]);
    const refCallback = useCallback((el) => {
        if (el && !elements.includes(el)) {
            setElements((prev) => [...prev, el]);
        }
    }, [elements]);

    useAnimation(elements);

    const [activeTab, setActiveTab] = useState('Wellness');

    const { products, loading } = useProducts();

    const [filteredProducts, setFilteredProducts] = useState([]);

    useEffect(() => {
        setFilteredProducts(products.filter((p) => !shouldHideFromProductListings(p)));
    }, [products, loading]);

    if (loading) return <div>Loading...</div>;

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        // console.log(activeTab)
    };



    return (
        <section className='w-full bg-w py-30  '>
            <div className="max-w-[1200px] w-[90%] mx-auto category-section-wrapper">
                <div className='grid grid-cols-12'>
                    <div className="col-span-12 mb-15 px-4">
                        <div className='category-section-heading-wrapper  border-b-[5px] border-[var(--p-c)] flex gap-2 justify-between flex-col sm:flex-row'>
                            <div className='category-section-heading ruwudu font-bold py-2 text-p-c pb-0  mb-[3px] text-[20px] w-max  rounded-t-[7px] tracking-[1px] sm:block hidden'>Our Products</div>
                            <div className='flex gap-2 justify-start sm:justify-start'>
                                <div onClick={() => handleTabClick("Wellness")} data-category-tab='Wellness' className={`category-section-tab ruwudu p-2 px-7 pb-0  mb-[3px] w-max  rounded-t-[7px] tracking-[1px] ${activeTab == "Wellness" ? "active" : ""}`}>Wellness</div>
                                <div onClick={() => handleTabClick("Soaps")} data-category-tab='Soaps' className={`category-section-tab ruwudu p-2 px-7 pb-0  mb-[3px] w-max  rounded-t-[7px] tracking-[1px] ${activeTab == "Soaps" ? "active" : ""}`}>Soap</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div data-category-content='wellness' className='grid grid-cols-12'>
                    {filteredProducts.length > 0 && filteredProducts.filter(p => p.category == activeTab).map((product) => (
                        <div ref={refCallback} data-animation="left" key={product.id} className='col-span-12 sm:col-span-6 lg:col-span-4 2xl:col-span-3 px-6 mb-15 isolate'>
                            <a href={`/product/${product.sku}`}>
                                <div className='poppins bg-w shadow-[0_0_10px_rgba(0,0,0,0.15)] p-3 rounded-[8px] category-product-section'>
                                    <div
                                        style={{
                                            "--back-image": "url(" + product.imageURL + ")",
                                            "--h-back-image": "url(" + product.images[1] + ")",
                                        }}
                                        className='category-img-wrapper  w-full aspect-[1/1.1] bg-p-c rounded-[8px] shadow-[0_0_10px_rgba(0,0,0,0.3)]'></div>

                                    <div className='category-details-wrapper  pt-3 px-1 '>
                                        <h5 className='poppins font-extrabold text-[14px] text-c-l mt-2 tracking-widest m-0 text-center'>{product.title}</h5>
                                    </div>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}

export default Category
