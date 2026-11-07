import React from "react";

function BannerForAll({ title, breadcrumb }) {
    return (
        <section className="w-full bg-w banner-image-all-page">
            <div className="max-w-[1200px] w-90% m-auto h-full">
                <div className="grid grid-cols-12 h-full">
                    <div className="col-span-12 h-full">
                        <div className="w-full flex justify-center h-full flex-col">
                            <h1 className="m-0 uppercase 2xl:text-[4rem] xl:text-[3.8rem] md:text-[3rem] text-[2.5rem] amarante text-center">
                                {title}
                            </h1>
                            <div className="quando mt-8 mb-3 md:text-[12px] text-[10px] font-bold flex items-center justify-center w-full gap-2">
                                <a href="/">HOME</a>
                                <div
                                    className="mask-item"
                                    style={{
                                        "--m-size": "1.5em",
                                        "--m-bg": "var(--t-c-d)",
                                        "--m-url":
                                            "url(https://api.iconify.design/material-symbols:chevron-right-rounded.svg?color=%23ff0000)",
                                    }}
                                ></div>
                                <p className="m-0 text-p-c">{breadcrumb}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default BannerForAll;
