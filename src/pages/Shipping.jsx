import React from "react";
import BannerForAll from "../sections/banner";

function ShippingPolicy() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-100">
            {/* Banner */}
            <BannerForAll title="Shipping Policy" breadcrumb="Shipping Policy" />

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-10">
                    {/* Heading */}
                    <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-8 tracking-tight">
                        Shipping Policy
                    </h2>
                    <p className="text-lg text-gray-600 text-center leading-relaxed mb-12">
                        At{" "}
                        <a
                            href="https://franchglobal.com"
                            className="text-[var(--t-p-c)] font-semibold underline hover:text-[var(--t-c-g)] transition"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            franchglobal.com
                        </a>
                        , we ensure reliable shipping for buyers through trusted Courier Partners
                    </p>

                    {/* Sections */}
                    <div className="space-y-10">

                        <Section
                            title="Domestic Buyers"
                            content={
                                <p>
                                    Orders are shipped through{" "}
                                    <strong>registered domestic courier companies</strong> and/or{" "}
                                    <strong>Speed Post</strong> only.
                                </p>
                            }
                        />

                        <Section
                            title="Despatch Timeline"
                            content={
                                <p>
                                    Orders are shipped within{" "}
                                    <strong>0–2 working days</strong> from the date of order and
                                    payment, or as per the delivery date agreed upon at the time of
                                    order confirmation. Shipping is subject to{" "}
                                    <strong>Courier Company / Post Office norms</strong>.
                                </p>
                            }
                        />

                        <Section
                            title="Liability Disclaimer"
                            content={
                                <p>
                                    <strong>FRANCH GLOBAL HEALTH CARE LLP</strong> is not liable
                                    for any delay in delivery caused by courier companies or postal
                                    authorities. We guarantee only to hand over the consignment
                                    within the specified despatch timeframe.
                                </p>
                            }
                        />

                        <Section
                            title="Delivery Information"
                            content={
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>
                                        Delivery will be made to the{" "}
                                        <strong>address provided by the buyer</strong> at the time
                                        of order.
                                    </li>
                                    <li>
                                        Confirmation of delivery will be sent to your{" "}
                                        <strong>registered email ID</strong>.
                                    </li>
                                </ul>
                            }
                        />

                        <Section
                            title="Customer Support"
                            content={
                                <p>
                                    For any issues in utilizing our services, you may contact our
                                    helpdesk at:{" "}
                                    <a
                                        href="tel:+919841854321"
                                        className="text-[var(--t-p-c)] font-semibold underline"
                                    >
                                        9841854321
                                    </a>{" "}
                                    or email us at{" "}
                                    <a
                                        href="mailto:contact@franchglobal.com"
                                        className="text-[var(--t-p-c)] font-semibold underline"
                                    >
                                        contact@franchglobal.com
                                    </a>
                                    .
                                </p>
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ title, content }) {
    return (
        <section className="p-6 rounded-xl border border-gray-200 bg-white/90 hover:shadow-md transition">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 border-b pb-2">
                {title}
            </h3>
            <div className="text-gray-700 leading-relaxed">{content}</div>
        </section>
    );
}

export default ShippingPolicy;
