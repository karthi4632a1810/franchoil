import React, { useState } from "react";
import BannerForAll from "../sections/banner";
import { useEnquiry } from "../hooks/useEnquiry";

function Contact() {
    const token = "8430059272:AAGsb0ZkDrWbSWlRpP9MKUGYX7nFTTbO9hs"; // your bot token
    const chatId = "-1003053642016"; // your group id

    const [showPopup, setShowPopup] = useState(false);
    const { loading, submitEnquiry } = useEnquiry();

    const handleSubmit = async (e) => {
        e.preventDefault();


        const formData = new FormData(e.target);
        const name = formData.get("name");
        const email = formData.get("email");
        const phone = formData.get("phone");
        const message = formData.get("message");

        submitEnquiry({ name, email, phone, message });

        const text = `
📩 *New Contact Form Submission*
👤 Name: ${name}
📧 Email: ${email}
📱 Phone: ${phone}
💬 Message: ${message}
    `;

        try {
            const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: "Markdown",
                }),
            });

            const data = await res.json();
            if (data.ok) {
                e.target.reset();
                setShowPopup(true); // show thank you popup
            } else {
                alert("❌ Failed to send message.");
                console.error(data);
            }
        } catch (err) {
            console.error("Error:", err);
            alert("⚠️ Something went wrong!");
        }
    };

    return (
        <section>
            <BannerForAll title="CONTACT US" breadcrumb="CONTACT US" />

            {/* Contact section remains unchanged ... */}

            <div className="w-full min-h-screen pt-30">
                <div className="max-w-[1350px] mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 shadow-2xl rounded-3xl bg-white overflow-hidden">
                        <div className="relative min-h-[400px]">
                            {/* Google Map */}
                            <iframe
                                title="Franch Global Health Care LLP Map"
                                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7772.558731470083!2d80.246474!3d13.081473!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5265a25afa93db%3A0xcb53818f0509ba4f!2sFranch%20Global%20Health%20Care%20LLP!5e0!3m2!1sen!2sin!4v1756665267018!5m2!1sen!2sin"
                                className="absolute inset-0 w-full h-full rounded-l-3xl"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-green-900/10 to-transparent pointer-events-none rounded-l-3xl" />
                        </div>

                        {/* Form */}
                        {!loading && (
                            <div className="flex flex-col justify-center px-8 py-12">
                                <h2 className="text-3xl font-bold text-[var(--t-p-c)] mb-2">Contact Us</h2>
                                <p className="text-gray-500 mb-8">
                                    We'd love to hear from you. Fill out the form and our team will get back to you soon.
                                </p>

                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-semibold text-[var(--t-p-c)] mb-1">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            className="block w-full rounded-lg border border-green-200 bg-green-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                                            placeholder="Your Name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold text-[var(--t-p-c)] mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            className="block w-full rounded-lg border border-green-200 bg-green-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-semibold text-[var(--t-p-c)] mb-1">
                                            Phone phone
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            className="block w-full rounded-lg border border-green-200 bg-green-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                                            placeholder="Your Phone phone"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-semibold text-[var(--t-p-c)] mb-1">
                                            Message
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows={4}
                                            className="block w-full rounded-lg border border-green-200 bg-green-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                                            placeholder="Your Message"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-3 px-4 bg-[var(--p-c)] text-white font-bold rounded-lg shadow-lg hover:bg-[var(--bg-b-2)] transition cursor-pointer"
                                    >
                                        Send Message
                                    </button>
                                </form>
                            </div>)}
                    </div>
                </div>
            </div>

            {/* Thank You Popup */}
            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm text-center">
                        <h2 className="text-2xl font-bold text-green-600 mb-4">🎉 Thank You!</h2>
                        <p className="text-gray-600 mb-6">Your message has been sent successfully. We’ll contact you soon.</p>
                        <button
                            onClick={() => setShowPopup(false)}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Contact;
