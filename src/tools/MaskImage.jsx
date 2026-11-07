import React from 'react'
import '../css/tools/MaskImage.css';

function MaskImage({ size = "1.1rem", bg = "var(--t-c-l)", hBg = "var(--p-c)", url = "https://api.iconify.design/hugeicons:search-02.svg" }) {
    return (
        <span
            className="mask-item inline-block bg-no-repeat bg-center bg-contain"
            style={{
                "--m-size": size,
                "--m-bg": bg,
                "--m-url": `url(${url})`,
                "--m-h-bg": hBg
            }}
        ></span>
    )
}

export default MaskImage