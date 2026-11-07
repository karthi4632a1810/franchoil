import React from 'react';
import BannerForAll from '../sections/banner';

function Faq() {
    const [openIndex, setOpenIndex] = React.useState(null);

    const ayurvedaFaqs = [
        {
            question: "What is Ayurveda?",
            answer:
                "Ayurveda is an ancient system of natural healing that originated in India more than 5,000 years ago. It focuses on balancing the body, mind, and spirit using herbs, diet, lifestyle practices, and therapies."
        },
        {
            question: "Are Ayurvedic products safe to use?",
            answer:
                "Yes, Ayurvedic products are made from natural herbs, minerals, and oils. When used as directed, they are generally safe and free from harmful side effects. However, it is always best to consult a qualified practitioner before starting any new treatment."
        },
        {
            question: "How long does it take to see results with Ayurveda?",
            answer:
                "Ayurveda works holistically and aims at addressing the root cause rather than just symptoms. The time to see results can vary depending on the individual, their lifestyle, and the nature of the condition."
        },
        {
            question: "Can Ayurvedic remedies be used alongside modern product?",
            answer:
                "In many cases, Ayurvedic remedies can complement modern product. However, it is important to consult both your physician and an Ayurvedic practitioner to ensure safety and avoid interactions."
        },
        {
            question: "Are your Ayurvedic products vegetarian and cruelty-free?",
            answer:
                "Yes, our Ayurvedic products are 100% vegetarian and cruelty-free. We follow traditional formulations while ensuring ethical and sustainable practices."
        },
        // {
        //     question: "Do you ship Ayurvedic products internationally?",
        //     answer:
        //         "Yes, we offer international shipping so that Ayurveda can reach you wherever you are. Shipping charges and delivery times may vary based on location."
        // }
    ];


    // Main green color
    const primaryGreen = "#007E3C";

    return (
        <div className="min-h-screen" >
            <BannerForAll title="Frequently Asked Questions" breadcrumb="FAQ" />
            <div className="w-full flex items-center justify-center py-10 pt-30 px-4">
                <div className="max-w-[1200px] w-[90%]">
                    <div className='grid grid-cols-12'>
                        <div className='col-span-12'>
                            <div
                                className="premium-faq-section rounded-3xl shadow-2xl p-10"

                            >
                                <h2
                                    className="text-3xl font-extrabold mb-8 flex items-center gap-3"
                                    style={{ color: primaryGreen }}
                                >
                                    <svg className="w-8 h-8" fill="currentColor" style={{ color: primaryGreen }} viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V6h2v4z" /></svg>
                                    FAQ
                                </h2>
                                <div className="space-y-6">
                                    {ayurvedaFaqs.map((faq, idx) => (
                                        <div
                                            key={idx}
                                            className={`rounded-xl transition-all duration-300 shadow-lg border-l-2 border-[var(--p-c)] ${openIndex === idx ? 'bg-white/90 shadow-lg border-l-4' : 'bg-white/70'}`}
                                            style={openIndex === idx ? { borderLeft: `8px solid ${primaryGreen}` } : {}}
                                        >
                                            <button
                                                className="w-full text-left text-lg font-semibold focus:outline-none flex justify-between items-center px-6 py-4 cursor-pointer"
                                                style={{ color: primaryGreen }}
                                                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <svg className="w-6 h-6" fill="none" stroke={primaryGreen} strokeWidth="2" viewBox="0 0 24 24">
                                                        <circle cx="12" cy="12" r="10" />
                                                    </svg>
                                                    {faq.question}
                                                </span>
                                                <span className={`ml-2 text-2xl font-bold transition-transform duration-200`} style={{ color: primaryGreen, transform: openIndex === idx ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                                    {openIndex === idx ? '-' : '+'}
                                                </span>
                                            </button>
                                            {openIndex === idx && (
                                                <p className="text-gray-700 mt-2 px-8 pb-4 text-base font-medium">
                                                    {faq.answer}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Faq;
