

import { useEffect } from "react";

export function useAnimation(elements, options = { rootMargin: "100px 0px 100px 0px" }) {

    useEffect(() => {


        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const animType = entry.target.dataset.animation;
                    if (entry.isIntersecting) {
                        entry.target.classList.add(`animation-${animType}-in`);
                        entry.target.classList.remove(`animation-${animType}-out`);
                        // observer.unobserve(entry.target);
                    } else {
                        entry.target.classList.add(`animation-${animType}-out`);
                        entry.target.classList.remove(`animation-${animType}-in`);
                    }
                });
            },
            {
                threshold: 0.2,
                rootMargin: options.rootMargin || "0px 0px -50px 0px", // 👈 default rootMargin
            }
        );

        // Observe each element
        elements.forEach((el) => {
            if (el) {
                observer.observe(el);
            }
        });

        // Cleanup
        return () => {
            observer.disconnect();
        };
    }, [elements, options]);

    return elements.map((el) => el);
}