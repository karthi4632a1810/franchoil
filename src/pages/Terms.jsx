import React from "react";
import BannerForAll from "../sections/banner";

function TermsAndConditions() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-100">
            {/* Banner */}
            <BannerForAll title="Terms & Conditions" breadcrumb="Terms & Conditions" />

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-10">
                    {/* Heading */}
                    <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-8 tracking-tight">
                        Terms & Conditions
                    </h2>
                    <p className="text-lg text-gray-600 text-center leading-relaxed mb-12">
                        By using{" "}
                        <a
                            href="https://franchglobal.com"
                            className="text-[var(--t-p-c)] font-semibold underline hover:text-[var(--t-c-g)] transition"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            franchglobal.com
                        </a>{" "}
                        or making a purchase, you agree to the following terms and
                        conditions outlined below.
                    </p>

                    {/* Sections */}
                    <div className="space-y-10">
                        <Section
                            title="Definition of Terms"
                            content={
                                <>
                                    <p>
                                        The terms <strong>"we", "us", "our"</strong> refer to{" "}
                                        <strong>FRANCH GLOBAL HEALTH CARE LLP</strong>, whose
                                        registered/operational office is OLD NO. 17, NEW NO. 61,
                                        ORMES ROAD, 2ND FLOOR, KILPAUK, Chennai, Tamil Nadu 600010.{" "}
                                        The terms <strong>"you", "your", "user", "visitor"</strong>{" "}
                                        refer to any natural or legal person visiting our website
                                        and/or purchasing from us.
                                    </p>
                                </>
                            }
                        />

                        <Section
                            title="General Usage"
                            content={
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>
                                        The content of this website is subject to change without
                                        notice.
                                    </li>
                                    <li>
                                        You acknowledge that information and materials may contain
                                        inaccuracies or errors. We exclude liability to the fullest
                                        extent permitted by law.
                                    </li>
                                    <li>
                                        Your use of any information or products is at your own risk.
                                        You must ensure that they meet your specific requirements.
                                    </li>
                                </ul>
                            }
                        />

                        <Section
                            title="Intellectual Property"
                            content={
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>
                                        This website contains material owned or licensed by us,
                                        including design, layout, graphics, and content.
                                    </li>
                                    <li>
                                        Reproduction of content is prohibited other than in
                                        accordance with the copyright notice.
                                    </li>
                                    <li>
                                        All trademarks reproduced on this website that are not
                                        property of or licensed to us are acknowledged.
                                    </li>
                                </ul>
                            }
                        />

                        <Section
                            title="Unauthorized Use"
                            content={
                                <p>
                                    Unauthorized use of any content or information from this
                                    website may give rise to claims for damages and/or may be a
                                    criminal offense.
                                </p>
                            }
                        />

                        <Section
                            title="Third-Party Links"
                            content={
                                <p>
                                    Our website may include links to third-party websites. These
                                    links are provided for your convenience and additional
                                    information. We are not responsible for the content or
                                    practices of linked sites.
                                </p>
                            }
                        />

                        <Section
                            title="Linking Policy"
                            content={
                                <p>
                                    You may not create a link to our website without prior written
                                    consent from{" "}
                                    <strong>FRANCH GLOBAL HEALTH CARE LLP</strong>.
                                </p>
                            }
                        />

                        <Section
                            title="Jurisdiction"
                            content={
                                <p>
                                    Any dispute arising out of the use of our website, purchases,
                                    or interactions with us shall be governed by the laws of{" "}
                                    <strong>India</strong>.
                                </p>
                            }
                        />

                        <Section
                            title="Liability"
                            content={
                                <p>
                                    We shall not be liable for any loss or damage arising directly
                                    or indirectly from a decline of transaction authorization,
                                    including but not limited to cardholders exceeding preset bank
                                    limits.
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

export default TermsAndConditions;
