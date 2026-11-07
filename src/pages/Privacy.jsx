import React from "react";
import BannerForAll from "../sections/banner";

function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-100">
            {/* Banner */}
            <BannerForAll title="Privacy & Policy" breadcrumb="Privacy & Policy" />

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-10">
                    {/* Heading */}
                    <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-8 tracking-tight">
                        Privacy Policy
                    </h2>
                    <p className="text-lg text-gray-600 text-center leading-relaxed mb-12">
                        This Privacy Policy explains how{" "}
                        <a
                            href="https://www.franchglobal.com"
                            className="text-[var(--t-p-c)] font-semibold underline hover:text-[var(--t-c-g)] transition"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            www.franchglobal.com
                        </a>{" "}
                        collects, uses, and shares your personal information when you visit
                        or purchase from our website.
                    </p>

                    {/* Sections */}
                    <div className="space-y-10">
                        <Section
                            title="Personal Information We Collect"
                            content={
                                <>
                                    <p className="mb-4">
                                        We collect information such as your device details, IP
                                        address, time zone, and cookies. We also gather browsing
                                        data, referral sources, and interaction history.
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                        <li>
                                            <strong className="text-[var(--t-p-c)]">Cookies:</strong>{" "}
                                            Store anonymous identifiers. Learn more at{" "}
                                            <a
                                                href="http://www.allaboutcookies.org"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[var(--t-p-c)] underline"
                                            >
                                                allaboutcookies.org
                                            </a>
                                            .
                                        </li>
                                        <li>
                                            <strong className="text-[var(--t-p-c)]">Log files:</strong>{" "}
                                            Track activity such as IP, browser type, and time stamps.
                                        </li>
                                        <li>
                                            <strong className="text-[var(--t-p-c)]">
                                                Web beacons/tags:
                                            </strong>{" "}
                                            Monitor how users interact with our site.
                                        </li>
                                    </ul>
                                    <p className="mt-4">
                                        When placing orders, we also collect your name, address,
                                        contact details, and payment information.
                                    </p>
                                </>
                            }
                        />

                        <Section
                            title="How We Use Your Information"
                            content={
                                <>
                                    <p className="mb-4">
                                        Your personal information is primarily used to fulfill
                                        orders, including payment processing, shipping, and order
                                        confirmations.
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Communicate with you regarding orders and services</li>
                                        <li>Screen orders for fraud and risks</li>
                                        <li>
                                            Provide personalized recommendations and advertising
                                        </li>
                                    </ul>
                                    <p className="mt-4">
                                        Device information is also used to optimize our website and
                                        improve marketing campaigns.
                                    </p>
                                </>
                            }
                        />

                        <Section
                            title="Sharing Your Information"
                            content={
                                <>
                                    <p className="mb-4">
                                        We share information with third parties to process orders
                                        and analyze site activity. For example,{" "}
                                        <span className="font-semibold text-[var(--t-p-c)]">
                                            Google Analytics
                                        </span>{" "}
                                        helps us understand customer behavior.
                                    </p>
                                    <p>
                                        Learn more:{" "}
                                        <a
                                            href="https://www.google.com/intl/en/policies/privacy/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[var(--t-p-c)] underline"
                                        >
                                            Google Privacy Policy
                                        </a>{" "}
                                        or opt-out{" "}
                                        <a
                                            href="https://tools.google.com/dlpage/gaoptout"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[var(--t-p-c)] underline"
                                        >
                                            here
                                        </a>
                                        .
                                    </p>
                                </>
                            }
                        />

                        <Section
                            title="Behavioural Advertising"
                            content={
                                <p>
                                    We use your data to deliver relevant advertisements. Learn
                                    more at{" "}
                                    <a
                                        href="http://www.networkadvertising.org/understanding-online-advertising/how-does-it-work"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[var(--t-p-c)] underline"
                                    >
                                        NAI’s educational page
                                    </a>
                                    .
                                </p>
                            }
                        />

                        <Section
                            title="Do Not Track"
                            content={
                                <p>
                                    Our site does not change its data collection practices when
                                    receiving a Do Not Track signal from your browser.
                                </p>
                            }
                        />

                        <Section
                            title="Data Retention"
                            content={
                                <p>
                                    We retain order information for our records unless you request
                                    deletion.
                                </p>
                            }
                        />

                        <Section
                            title="Changes"
                            content={
                                <p>
                                    Our Privacy Policy may be updated periodically to reflect
                                    changes in practices or legal requirements.
                                </p>
                            }
                        />

                        <Section
                            title="Contact Us"
                            content={
                                <p>
                                    For inquiries about this policy, email us at{" "}
                                    <a
                                        href="mailto:contact@franchglobal.com"
                                        className="text-[var(--t-p-c)] underline"
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

export default PrivacyPolicy;
