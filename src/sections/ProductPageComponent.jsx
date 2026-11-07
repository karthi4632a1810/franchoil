import React, { useState } from "react";
import {
    ShieldCheck,
    Leaf,
    Award,
    Heart,
    ChevronDown,
    Sparkles,
    BookOpen,
    CircleHelp,
    FlaskConical,
    Hand,
    Info,
} from "lucide-react";
import "../css/productPage.css";

const TRUST_PILLARS = [
    { icon: Leaf, label: "Ayurvedic formula", sub: "Natural herb ingredients" },
    { icon: Award, label: "25+ years expertise", sub: "Trusted by families" },
    { icon: ShieldCheck, label: "Genuine product", sub: "Direct from Franch" },
    { icon: Heart, label: "Daily wellness", sub: "Safe for regular use" },
];

const TAB_META = {
    Description: { icon: BookOpen, subtitle: "What this product is and how it helps" },
    FAQ: { icon: CircleHelp, subtitle: "Common questions from customers" },
    Benefits: { icon: Sparkles, subtitle: "Why customers choose this" },
    Ingredient: { icon: FlaskConical, subtitle: "What's inside the formula" },
    "How to Use": { icon: Hand, subtitle: "Simple steps for best results" },
    Disclaimer: { icon: Info, subtitle: "Important safety information" },
};

function ProductPageComponent({ path, desc, faqs, embedded = false }) {
    const [activeTab, setActiveTab] = useState("Description");
    const [openAccordion, setOpenAccordion] = useState(null);
    const [openFaqIndex, setOpenFaqIndex] = useState(0);

    const tabs = [
        "Description",
        "FAQ",
        "Benefits",
        "Ingredient",
        "How to Use",
        "Disclaimer",
    ];

    const tabContent = {
        Description: (
            <div className="pdp-trust-prose">{desc}</div>
        ),

        FAQ: (
            <div className="pdp-trust-faq">
                {faqs.map((item, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                        <div
                            key={index}
                            className={`pdp-trust-faq__item${isOpen ? " is-open" : ""}`}
                        >
                            <button
                                type="button"
                                className="pdp-trust-faq__question"
                                onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                                aria-expanded={isOpen}
                            >
                                <span>{item.q}</span>
                                <ChevronDown className="pdp-trust-faq__chevron" aria-hidden />
                            </button>
                            <div className="pdp-trust-faq__answer">
                                <p>{item.a}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        ),

        Benefits: (
            <div className="pdp-trust-prose">
                {path == "landing-franch-oil-nh-plus-pack-of-2" && (<>
                    <p className="pdp-trust-prose__heading">Why choose Franch Oil NH Plus?</p>
                    <ul className="pdp-trust-list">
                        <li>Ayurvedic formulation with natural ingredients</li>
                        <li>Supports joint, muscle, and body pain relief</li>
                        <li>Helps in skin repair, dryness, and irritation</li>
                        <li>Suitable for daily use for all age groups</li>
                        <li>Non-greasy, fast-absorbing formula</li>
                    </ul>
                    <p className="pdp-trust-prose__heading">Key benefits</p>
                    <ul className="pdp-trust-list">
                        <li><strong>Pain relief support</strong> — Helps reduce joint pain, back pain, knee pain, and muscle stiffness</li>
                        <li><strong>Muscle recovery</strong> — Ideal for post-workout soreness and inflammation</li>
                        <li><strong>Skin healing</strong> — Supports healing of minor burns, cuts, cracks, and dryness</li>
                        <li><strong>Multipurpose use</strong> — Works as body oil, massage oil, and skin care oil</li>
                        <li><strong>Natural wellness</strong> — Helps balance body heat and supports relaxation</li>
                    </ul>
                </>)}
                {path == "franch-oil-nh-plus" && (<>
                    <p className="pdp-trust-prose__heading">Why choose Franch Oil NH Plus?</p>
                    <ul className="pdp-trust-list">
                        <li>Ayurvedic formulation with natural ingredients</li>
                        <li>Supports joint, muscle, and body pain relief</li>
                        <li>Helps in skin repair, dryness, and irritation</li>
                        <li>Suitable for daily use for all age groups</li>
                        <li>Non-greasy, fast-absorbing formula</li>
                    </ul>
                    <p className="pdp-trust-prose__heading">Key benefits</p>
                    <ul className="pdp-trust-list">
                        <li><strong>Pain relief support</strong> — Helps reduce joint pain, back pain, knee pain, and muscle stiffness</li>
                        <li><strong>Muscle recovery</strong> — Ideal for post-workout soreness and inflammation</li>
                        <li><strong>Skin healing</strong> — Supports healing of minor burns, cuts, cracks, and dryness</li>
                        <li><strong>Multipurpose use</strong> — Works as body oil, massage oil, and skin care oil</li>
                        <li><strong>Natural wellness</strong> — Helps balance body heat and supports relaxation</li>
                    </ul>
                </>)}
                {path == "omega-3" && (<>
                    <p className="pdp-trust-prose__heading">Key benefits</p>
                    <ul className="pdp-trust-list">
                        <li><strong>Heart health support</strong> — Helps maintain cardiovascular health and healthy cholesterol levels</li>
                        <li><strong>Brain function</strong> — Supports memory, focus, and cognitive performance</li>
                        <li><strong>Immunity boost</strong> — Strengthens natural defense system</li>
                        <li><strong>Hair &amp; skin care</strong> — Promotes healthier hair growth and nourished skin</li>
                        <li><strong>Anti-inflammatory support</strong> — Helps reduce inflammation and joint discomfort</li>
                    </ul>
                    <p className="pdp-trust-prose__heading">Why choose this product</p>
                    <ul className="pdp-trust-list">
                        <li>100% vegetarian omega-3 (flaxseed based)</li>
                        <li>Rich in ALA (converts to EPA &amp; DHA naturally)</li>
                        <li>Ayurvedic formulation</li>
                        <li>No fishy smell or aftertaste</li>
                        <li>Suitable for daily long-term use</li>
                        <li>Supports overall health, not just one function</li>
                    </ul>
                </>)}
                {path == "franch-ayurveda-skin-soap" && (<>
                    <p className="pdp-trust-prose__heading">Key benefits</p>
                    <ul className="pdp-trust-list">
                        <li><strong>Clear skin support</strong> — Helps maintain clean and healthy skin</li>
                        <li><strong>Glowing complexion</strong> — Improves natural skin radiance</li>
                        <li><strong>Pimple protection</strong> — Helps protect skin from acne and breakouts</li>
                        <li><strong>Dark spot reduction</strong> — Supports even skin tone</li>
                        <li><strong>Natural moisturizing</strong> — Prevents dryness and keeps skin soft</li>
                    </ul>
                    <p className="pdp-trust-prose__heading">Why choose this soap</p>
                    <ul className="pdp-trust-list">
                        <li>Ayurvedic herbal formulation</li>
                        <li>Suitable for daily bathing</li>
                        <li>Works for all skin types</li>
                        <li>Gentle on skin (not harsh like chemical soaps)</li>
                        <li>Multi-benefit: cleansing + glow + protection</li>
                    </ul>
                </>)}
                {path == "franch-orthovin-thailam" && (<>
                    <p className="pdp-trust-prose__heading">Key benefits</p>
                    <ul className="pdp-trust-list">
                        <li><strong>Joint pain relief</strong> — Helps reduce arthritis, knee pain, and joint discomfort</li>
                        <li><strong>Muscle relaxation</strong> — Relieves stiffness, strain, and muscle soreness</li>
                        <li><strong>Anti-inflammatory action</strong> — Helps reduce swelling and inflammation</li>
                        <li><strong>Improves mobility</strong> — Supports better movement and flexibility</li>
                        <li><strong>Deep penetration</strong> — Works at the root cause, not just surface relief</li>
                    </ul>
                    <p className="pdp-trust-prose__heading">Why choose this product</p>
                    <ul className="pdp-trust-list">
                        <li>Ayurvedic herbal formulation</li>
                        <li>Chemical-free pain relief solution</li>
                        <li>Suitable for daily use</li>
                        <li>Works for all age groups</li>
                        <li>Highly concentrated oil</li>
                    </ul>
                </>)}
            </div>
        ),

        Ingredient: (
            <div className="pdp-trust-prose">
                <p className="pdp-trust-prose__heading">Key Ayurvedic ingredients</p>
                {path == "landing-franch-oil-nh-plus-pack-of-2" && (<ul className="pdp-trust-list">
                    <li>Ricinus Seed Extract</li>
                    <li>Aloe Vera Extract</li>
                    <li>Krishna Tulsi Extract</li>
                    <li>Flax Seed Oil</li>
                    <li>Almond Oil (Vitamin E)</li>
                    <li>Ricinus Root Extract</li>
                </ul>)}
                {path == "franch-oil-nh-plus" && (<ul className="pdp-trust-list">
                    <li>Ricinus Seed Extract</li>
                    <li>Aloe Vera Extract</li>
                    <li>Krishna Tulsi Extract</li>
                    <li>Flax Seed Oil</li>
                    <li>Almond Oil (Vitamin E)</li>
                    <li>Ricinus Root Extract</li>
                </ul>)}
                {path == "omega-3" && (<ul className="pdp-trust-list">
                    <li><strong>Flaxseed oil</strong> (rich in ALA — alpha-linolenic acid)</li>
                    <li>ALA converts into EPA &amp; DHA based on body needs</li>
                </ul>)}
                {path == "franch-ayurveda-skin-soap" && (<ul className="pdp-trust-list">
                    <li>Ayurvedic herbal cleansing base</li>
                    <li>Natural skin-nourishing ingredients</li>
                    <li>Gentle moisturizing care for daily use</li>
                    <li>Please check product packaging for full ingredient details.</li>
                </ul>)}
                {path == "franch-orthovin-thailam" && (<ul className="pdp-trust-list">
                    <li>Sweet Flag</li>
                    <li>Indian Castus Tree</li>
                    <li>Veld Grape</li>
                    <li>Five-Leaved Chaste Tree</li>
                    <li>Winter Cherry</li>
                </ul>)}
            </div>
        ),

        "How to Use": (
            <div className="pdp-trust-prose">
                {path == "landing-franch-oil-nh-plus-pack-of-2" && (<ol className="pdp-trust-steps">
                    <li>Apply a small amount to the affected area.</li>
                    <li>Gently massage for 3–5 minutes.</li>
                    <li>Use regularly for best results.</li>
                    <li>Optional: Apply before sleep for deeper relaxation.</li>
                </ol>)}
                {path == "franch-oil-nh-plus" && (<ol className="pdp-trust-steps">
                    <li>Apply a small amount to the affected area.</li>
                    <li>Gently massage for 3–5 minutes.</li>
                    <li>Use regularly for best results.</li>
                    <li>Optional: Apply before sleep for deeper relaxation.</li>
                </ol>)}
                {path == "omega-3" && (<ol className="pdp-trust-steps">
                    <li>Take as directed (usually 1–2 capsules daily after food).</li>
                    <li>Consistent use is recommended for best results.</li>
                </ol>)}
                {path == "franch-ayurveda-skin-soap" && (<ol className="pdp-trust-steps">
                    <li>Wet skin with water.</li>
                    <li>Apply soap and lather gently.</li>
                    <li>Massage for a few seconds.</li>
                    <li>Rinse thoroughly.</li>
                    <li>Use daily for best results.</li>
                </ol>)}
                {path == "franch-orthovin-thailam" && (<ol className="pdp-trust-steps">
                    <li>Take a small amount of oil.</li>
                    <li>Apply to the affected area.</li>
                    <li>Gently massage until absorbed.</li>
                    <li>Use 2–3 times daily for best results.</li>
                </ol>)}
            </div>
        ),

        Disclaimer: (
            <div className="pdp-trust-prose pdp-trust-prose--muted">
                {path == "landing-franch-oil-nh-plus-pack-of-2" && (<ul className="pdp-trust-list">
                    <li>This product is for external use only.</li>
                    <li>Avoid contact with eyes and open wounds.</li>
                    <li>Keep out of reach of children.</li>
                    <li>Consult a physician if you are pregnant or under medical treatment.</li>
                </ul>)}
                {path == "franch-oil-nh-plus" && (<ul className="pdp-trust-list">
                    <li>This product is for external use only.</li>
                    <li>Avoid contact with eyes and open wounds.</li>
                    <li>Keep out of reach of children.</li>
                    <li>Consult a physician if you are pregnant or under medical treatment.</li>
                </ul>)}
                {path == "omega-3" && (<ul className="pdp-trust-list">
                    <li>This product is an Ayurvedic supplement and not a substitute for a varied diet or prescribed medication. Results may vary based on individual health conditions. Consult your healthcare professional before use if you are pregnant, nursing, taking other medications, or have a medical condition. Keep out of reach of children.</li>
                </ul>)}
                {path == "franch-ayurveda-skin-soap" && (<ul className="pdp-trust-list">
                    <li>This product is for external use only. Avoid contact with eyes. In case of irritation, discontinue use and consult a physician. Store in a cool, dry place. The product is made with natural Ingredient; slight variations in color or fragrance may occur but do not affect quality or efficacy.</li>
                </ul>)}
                {path == "franch-orthovin-thailam" && (<ul className="pdp-trust-list">
                    <li>This product is for external use only. Results may vary depending on individual health conditions. Not intended to replace professional medical advice or prescribed treatment. In case of severe or persistent pain, consult a healthcare professional</li>
                </ul>)}
            </div>
        ),
    };

    const activeMeta = TAB_META[activeTab];
    const ActiveIcon = activeMeta?.icon;

    return (
        <section
            className={`pdp-trust-section poppins ${embedded ? "w-full" : "max-w-[1200px] w-[92%] mx-auto"}`}
            aria-label="Product details and trust information"
        >
            <header className="pdp-trust-section__header">
                <span className="pdp-trust-section__eyebrow">Buy with confidence</span>
                <h2 className="pdp-trust-section__title">Everything you need to know</h2>
                <p className="pdp-trust-section__lead">
                    Clear, honest details on ingredients, usage, and safety — so you can shop with peace of mind.
                </p>
            </header>

            <div className="pdp-trust-strip">
                {TRUST_PILLARS.map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="pdp-trust-strip__item">
                        <span className="pdp-trust-strip__icon" aria-hidden>
                            <Icon strokeWidth={2.1} />
                        </span>
                        <div>
                            <strong>{label}</strong>
                            <span>{sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop: sidebar + panel */}
            <div className="pdp-trust-layout">
                <nav className="pdp-trust-nav" aria-label="Product information tabs">
                    {tabs.map((tab) => {
                        const TabIcon = TAB_META[tab].icon;
                        const isActive = activeTab === tab;
                        return (
                            <button
                                type="button"
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pdp-trust-nav__btn${isActive ? " is-active" : ""}`}
                                aria-current={isActive ? "true" : undefined}
                            >
                                <TabIcon className="pdp-trust-nav__icon" aria-hidden />
                                <span>{tab}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="pdp-trust-panel">
                    <div className="pdp-trust-panel__head">
                        {ActiveIcon && (
                            <span className="pdp-trust-panel__icon" aria-hidden>
                                <ActiveIcon strokeWidth={2} />
                            </span>
                        )}
                        <div>
                            <h3 className="pdp-trust-panel__title">{activeTab}</h3>
                            <p className="pdp-trust-panel__subtitle">{activeMeta?.subtitle}</p>
                        </div>
                    </div>
                    <div className="pdp-trust-panel__body">
                        {tabContent[activeTab]}
                    </div>
                </div>
            </div>

            {/* Mobile accordion */}
            <div className="pdp-trust-mobile">
                {tabs.map((tab) => {
                    const TabIcon = TAB_META[tab].icon;
                    const isOpen = openAccordion === tab;
                    return (
                        <div key={tab} className={`pdp-trust-mobile__item${isOpen ? " is-open" : ""}`}>
                            <button
                                type="button"
                                className="pdp-trust-mobile__trigger"
                                onClick={() => setOpenAccordion(isOpen ? null : tab)}
                                aria-expanded={isOpen}
                            >
                                <span className="pdp-trust-mobile__label">
                                    <TabIcon aria-hidden />
                                    {tab}
                                </span>
                                <ChevronDown className="pdp-trust-mobile__chevron" aria-hidden />
                            </button>
                            <div className="pdp-trust-mobile__content">
                                {tabContent[tab]}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default ProductPageComponent;
