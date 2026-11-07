import React from "react";
import BannerForAll from "../sections/banner";

function RefundPolicy() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-100">
            {/* Banner */}
            <BannerForAll title="Refund Policy" breadcrumb="Refund Policy" />

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-10">
                    {/* Heading */}
                    <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-8 tracking-tight">
                        Refund & Shipping Policies
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
                        , customer satisfaction is our priority. Please review the
                        following policies for cancellations, returns, refunds, and
                        shipping.
                    </p>

                    {/* Sections */}
                    <div className="space-y-10">
                        <Section
                            title="Cancellation Prior to Shipment"
                            content={
                                <>
                                    <p className="mb-4">
                                        If you cancel your order(s) before it ships from our
                                        warehouse, you will not be charged any additional fees. We
                                        require a cancellation request to be submitted by emailing
                                        us at{" "}
                                        <a
                                            href="mailto:contact@franchglobal.com"
                                            className="text-[var(--t-p-c)] underline font-semibold"
                                        >
                                            contact@franchglobal.com
                                        </a>
                                        .
                                    </p>
                                    <p>
                                        Once the cancellation request is received, a full refund
                                        will be initiated. We advise submitting cancellation
                                        requests within 12 hours of placing your order to ensure
                                        shipment has not yet been processed.
                                    </p>
                                </>
                            }
                        />

                        <Section
                            title="Return Policy"
                            content={
                                <>
                                    <p className="mb-4">
                                        The following policies apply for return requests after
                                        shipment or receipt of goods:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            Goods are non-refundable except in cases of{" "}
                                            <strong>Failed Delivery</strong>,{" "}
                                            <strong>Wrong Delivery</strong>, or{" "}
                                            <strong>Damaged goods during delivery</strong>.
                                        </li>
                                        <li>
                                            Only items purchased directly from{" "}
                                            <a
                                                href="https://franchglobal.com"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[var(--t-p-c)] underline font-semibold"
                                            >
                                                franchglobal.com
                                            </a>{" "}
                                            Online Store are eligible.
                                        </li>
                                        <li>
                                            Items purchased through other retailers must follow
                                            their respective returns/refunds policies.
                                        </li>
                                    </ul>

                                    <h4 className="font-semibold text-[var(--t-c-g)] mt-6">
                                        Goods are eligible for return if:
                                    </h4>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <strong>Incorrect:</strong> Wrong item, size, or color,
                                            or missing items inside packaging.
                                        </li>
                                        <li>
                                            <strong>Damaged:</strong> Items damaged upon receipt,
                                            tampered, refurbished, or modified. Customers bear
                                            shipping charges for returns. Returns apply only to
                                            complete{" "}
                                            <a
                                                href="https://franchglobal.com"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[var(--t-p-c)] underline"
                                            >
                                                franchglobal.com
                                            </a>{" "}
                                            products.
                                        </li>
                                    </ul>

                                    <h4 className="font-semibold text-[var(--t-c-g)] mt-6">
                                        Returned items must meet these requirements:
                                    </h4>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            Shipped back within 7 working days (courier receipt
                                            required).
                                        </li>
                                        <li>
                                            Proof of purchase (invoice number & receipt).
                                        </li>
                                        <li>
                                            Item must be new, unused, in original packaging,
                                            including free gifts.
                                        </li>
                                        <li>
                                            Returned in original or suitable packaging to prevent
                                            damage.
                                        </li>
                                    </ul>

                                    <ol className="list-decimal pl-6 space-y-2 mt-4">
                                        <li>
                                            Change or cancellation of order is not permitted once
                                            payment is confirmed.
                                        </li>
                                        <li>
                                            We reserve the right to reject unreasonable
                                            cancellations or refund requests.
                                        </li>
                                    </ol>
                                </>
                            }
                        />

                        <Section
                            title="Refund Policy"
                            content={
                                <>
                                    <p className="mb-4">
                                        We accept returns and issue full refunds for defective,
                                        damaged, or incorrectly shipped items within 7 days of
                                        receiving your order (Malaysia & Singapore).
                                    </p>
                                    <p className="mb-4">
                                        Shipping fees are refundable if the return criteria are
                                        met. Refunds will be issued once goods are inspected and
                                        approved at our return center.
                                    </p>
                                    <h4 className="font-semibold text-[var(--t-c-g)] mt-6">
                                        Refund Methods:
                                    </h4>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>
                                            <strong>Online Bank Transfer:</strong> Credited within
                                            3–5 working days.
                                        </li>
                                        <li>
                                            <strong>Credit Card:</strong> Refund sent to the
                                            card-issuing bank (processing time depends on the bank).
                                        </li>
                                    </ul>
                                </>
                            }
                        />

                        <Section
                            title="Shipping Policy"
                            content={
                                <>
                                    <h4 className="font-semibold text-[var(--t-c-g)] mb-2">
                                        Shipping Address
                                    </h4>
                                    <p className="mb-4">
                                        We utilize <strong>Pos Laju</strong> for Malaysia and{" "}
                                        <strong>Haresh Enterprise Pte Ltd</strong> for Singapore
                                        deliveries. Only valid shipping addresses are accepted. No
                                        P.O. Boxes.
                                    </p>

                                    <h4 className="font-semibold text-[var(--t-c-g)] mb-2">
                                        Change in Shipping Address
                                    </h4>
                                    <p className="mb-4">
                                        Email{" "}
                                        <a
                                            href="mailto:contact@franchglobal.com"
                                            className="text-[var(--t-p-c)] underline font-semibold"
                                        >
                                            contact@franchglobal.com
                                        </a>{" "}
                                        within 12 hours of order submission to change address. After
                                        24 hours, customers bear shipping charges for changes.
                                    </p>

                                    <h4 className="font-semibold text-[var(--t-c-g)] mb-2">
                                        Delivery Timeframes
                                    </h4>
                                    <ul className="list-disc pl-6 space-y-2 mb-4">
                                        <li>West Malaysia & Singapore: 3–5 working days.</li>
                                        <li>East Malaysia: 3–7 working days.</li>
                                    </ul>

                                    <h4 className="font-semibold text-[var(--t-c-g)] mb-2">
                                        Tracking Number
                                    </h4>
                                    <p className="mb-2">
                                        Once picked up, tracking ID will be provided via
                                        email/mobile app/SMS. Proof of purchase and invoice will
                                        also be available.
                                    </p>
                                    <p className="italic">
                                        We reserve the right to amend this policy without prior
                                        notice.
                                    </p>
                                </>
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

export default RefundPolicy;
