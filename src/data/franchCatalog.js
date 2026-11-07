// ============================================================================
// FRANCH BRAND CATALOG — 25+ YEARS OF AYURVEDIC HERITAGE (FM GROUP)
// Hardcoded clean frontend product data, images, prices, variants & reviews
// ============================================================================

export const BRAND_INFO = {
  name: "Franch",
  parentCompany: "FM Group of Companies",
  tagline: "25+ Years of Ayurvedic Botanical Science & Healing Wisdom",
  foundedYear: 1998,
  yearsOfLegacy: "25+",
  helpline: "+91 98418 54321",
  supportEmail: "contact@franchglobal.com",
  corporateOffice: "FM Towers, Old No. 12, New No. 24, Cenotaph Road, Teynampet, Chennai, Tamil Nadu 600018",
  manufacturing: "GMP Certified AYUSH Licensed Facilities, Tamil Nadu, India",
  ratingsSummary: {
    score: 4.9,
    totalReviews: 5120,
    recommendRate: "98.4%",
    bottlesDelivered: "3.5 Million+"
  }
};

export const PRODUCTS_CATALOG = [
  {
    id: "franch-oil-nh-plus",
    name: "Franch Oil NH* Plus",
    title: "Franch Oil NH* Plus Multipurpose Ayurvedic Healing & Pain Relief Oil",
    shortTagline: "Multipurpose Ayurvedic Healing & Pain Relief Oil",
    category: "Pain Relief",
    categoryLabel: "Pain Relief & Wound Healing",
    badge: "Best Seller • 25+ Years",
    rating: 4.9,
    reviewsCount: 1420,
    mainImage: "/images/hero-section/oil.webp",
    gallery: [
      "/images/hero-section/oil.webp",
      "/images/hero-section/hero-1.webp",
      "/images/hero-section/hero-2.webp",
      "/images/product/p-1.webp"
    ],
    accentColor: "#145C34",
    highlight: "Cold-Pressed Castor & Rare Herbal Extracts Multi-Healer",
    tagline: "India's trusted household Ayurvedic healer for joints, muscles, wounds, burns & cracked skin.",
    description:
      "Crafted with natural Ayurvedic botanical actives and rare herbal extracts using a proprietary cold-pressed extraction technique. Franch Oil NH* Plus is a legendary multipurpose healing oil designed to ease joint stiffness, relieve muscular aches, soothe minor burns and wounds, and accelerate cellular dermal repair without greasy residue.",
    benefits: [
      "Rapidly relieves chronic knee, joint, neck & lower back pain",
      "Accelerates natural recovery for minor burns, cuts, scratches & insect bites",
      "Soothes dry skin, cracked heels, rashes & eczema irritation",
      "100% natural cold-pressed Ricinus Communis botanical formulation",
      "Zero mineral oil, steroids, parabens or harsh synthetic fragrances"
    ],
    variants: [
      { size: "50ml", price: 110, mrp: 130, discount: "15% OFF" },
      { size: "100ml", price: 198, mrp: 220, discount: "10% OFF", popular: true },
      { size: "200ml", price: 390, mrp: 480, discount: "19% OFF" }
    ],
    defaultVariantIndex: 1,
    specs: {
      volume: "100ml (Popular)",
      formulation: "Ayurvedic Medicated Oil",
      usage: "Apply 4 to 6 drops on affected area; massage gently in circular motions until absorbed.",
      keyActives: "Cold-Pressed Ricinus Communis, Herbal Decoctions, Botanical Phytosterols",
      suitableFor: "All ages (Children, Adults, Elderly)",
      shelfLife: "36 Months from Manufacturing"
    },
    dosageNote: "Apply 2-3 times daily for pain relief or directly on minor skin abrasions."
  },
  {
    id: "franch-orthovin-thailam",
    name: "Franch Orthovin Thailam",
    title: "Franch Orthovin Thailam Specialized Ayurvedic Joint & Arthritis Mobility Oil",
    shortTagline: "Specialized Joint & Arthritis Mobility Thailam",
    category: "Joint Care",
    categoryLabel: "Specialized Arthritis & Mobility",
    badge: "Doctor Formulated",
    rating: 4.8,
    reviewsCount: 890,
    mainImage: "/images/hero-section/thailam-product.webp",
    gallery: [
      "/images/hero-section/thailam-product.webp",
      "/images/hero-section/thailam-plat.webp",
      "/images/hero-section/thailam-x-ray.webp"
    ],
    accentColor: "#D4A316",
    highlight: "Deep Thermal Penetration for Cartilage, Tendons & Rigidity",
    tagline: "Concentrated classical Ayurvedic formulation for persistent joint inflammation and morning stiffness.",
    description:
      "A concentrated classical Ayurvedic thailam formulated specifically to alleviate debilitating joint stiffness, osteoarthritis symptoms, cervical spondylosis, frozen shoulder, and neuromuscular aches. Its herbal warmth penetrates deep into synovial joints to improve flexion, reduce swelling, and restore daily movement.",
    benefits: [
      "Deep thermal penetration directly into rigid joint capsules",
      "Noticeably diminishes morning joint stiffness and inflammation",
      "Enriched with time-tested anti-arthritic thailam roots & herbs",
      "Improves joint lubrication, cartilage flexibility & walking ease",
      "Safe for prolonged daily massage without skin irritation"
    ],
    variants: [
      { size: "100ml", price: 174, mrp: 210, discount: "17% OFF", popular: true },
      { size: "200ml", price: 320, mrp: 390, discount: "18% OFF" }
    ],
    defaultVariantIndex: 0,
    specs: {
      volume: "100ml",
      formulation: "Classical Medicated Thailam",
      usage: "Warm a few drops between palms and massage firmly around painful joints twice daily.",
      keyActives: "Classical Anti-Arthritic Herbal Extracts, Medicated Sesame Oil Base, Camphor",
      suitableFor: "Seniors, Arthritis sufferers, Athletes",
      shelfLife: "36 Months from Manufacturing"
    },
    dosageNote: "Best applied morning and before bedtime followed by mild warm fomentation."
  },
  {
    id: "omega-3",
    name: "Franch Omega-3 Veg (OG-3 Veg)",
    title: "Franch OG-3 Veg 100% Plant-Based Omega-3 Capsules",
    shortTagline: "100% Plant-Based Heart, Brain & Joint Wellness",
    category: "Supplements",
    categoryLabel: "Nutraceuticals & Daily Vitality",
    badge: "100% Vegan ALA",
    rating: 4.8,
    reviewsCount: 640,
    mainImage: "/images/hero-section/tablet.webp",
    gallery: [
      "/images/hero-section/tablet.webp",
      "/images/hero-section/og-1.webp",
      "/images/hero-section/og-2.webp"
    ],
    accentColor: "#145C34",
    highlight: "Zero Fishy Burps • Cold-Pressed Flaxseed ALA",
    tagline: "Pure botanical Omega-3 softgels derived from cold-pressed flaxseed for total cardiovascular & brain health.",
    description:
      "A pure plant-based Omega-3 nutraceutical supplement derived from organic cold-pressed flaxseed oil. Enclosed in 100% vegetarian cellulose softgels, it provides potent Alpha-Linolenic Acid (ALA) to sustain cardiovascular vitality, sharpen cognitive focus, and lubricate joint cartilage without fishy burps, heavy metal contaminants, or animal gelatin.",
    benefits: [
      "Supports healthy cardiovascular function & normal cholesterol balance",
      "Promotes mental clarity, cognitive memory & brain focus",
      "Natural anti-inflammatory support for supple joint lubrication",
      "100% vegetarian plant cellulose capsules — zero fish oil or gelatin",
      "No fishy aftertaste, acid reflux, ocean microplastics or mercury"
    ],
    variants: [
      { size: "60 Veg Capsules", price: 360, mrp: 450, discount: "20% OFF", popular: true },
      { size: "Pack of 2 (120 Caps)", price: 680, mrp: 900, discount: "24% OFF" }
    ],
    defaultVariantIndex: 0,
    specs: {
      volume: "60 Veg Softgels",
      formulation: "Cold-Pressed Flaxseed Oil Veg Capsule (500mg)",
      usage: "Take 1-2 capsules daily after meals with a glass of water.",
      keyActives: "Cold-Pressed Virgin Flaxseed Oil (Linum Usitatissimum), Rich in ALA Omega-3",
      suitableFor: "Strict Vegetarians, Vegans, Working Professionals, Seniors",
      shelfLife: "24 Months from Manufacturing"
    },
    dosageNote: "1 capsule after breakfast and 1 capsule after dinner for optimal wellness."
  },
  {
    id: "franch-ayurveda-skin-soap",
    name: "Franch Ayurveda Skin Soap",
    title: "Franch Ayurveda Herbal Bathing Soap with Franch Oil Essence",
    shortTagline: "Natural Herbal Cleansing & Blemish Defense",
    category: "Skin Care",
    categoryLabel: "Ayurvedic Skin Wellness",
    badge: "Herbal Clarifying",
    rating: 4.9,
    reviewsCount: 2150,
    mainImage: "/images/hero-section/soap-1.webp",
    gallery: [
      "/images/hero-section/soap-1.webp",
      "/images/hero-section/soap-2.webp",
      "/images/hero-section/soap-leaf.webp",
      "/images/hero-section/soap-plat.webp"
    ],
    accentColor: "#145C34",
    highlight: "Infused with Authentic Franch Oil Healing Essence",
    tagline: "Gentle Grade-1 Ayurvedic soap that clarifies pimples, fades spots, and nourishes skin naturally.",
    description:
      "Handcrafted following time-honored Ayurvedic principles and enriched with authentic Franch Oil healing essence. Gently purifies pores without stripping natural lipid moisture, fighting pimples, calming prickly heat, lightening dark spots, and leaving your skin glowing, hydrated, and protected.",
    benefits: [
      "Clears blemishes, pimples and prevents recurring breakouts",
      "Soothes summer prickly heat, skin rashes and itchy dry patches",
      "High TFM 76% Grade-1 herbal toilet soap for ultra-rich creamy lather",
      "Infused with authentic cold-pressed Franch Oil healing decoctions",
      "Free from harsh chemical sulfates, parabens and synthetic animal fats"
    ],
    variants: [
      { size: "100g Bar", price: 54, mrp: 60, discount: "10% OFF" },
      { size: "Pack of 3 (300g)", price: 150, mrp: 180, discount: "17% OFF", popular: true },
      { size: "Pack of 5 (500g)", price: 240, mrp: 300, discount: "20% OFF" }
    ],
    defaultVariantIndex: 1,
    specs: {
      volume: "100g / 3x100g",
      formulation: "Grade-1 Ayurvedic Herbal Toilet Soap (TFM 76%)",
      usage: "Lather with warm water, gently massage over face and body, then rinse thoroughly.",
      keyActives: "Franch Oil Active Essence, Botanical Skin Soothing Herbal Extracts",
      suitableFor: "All skin types, including sensitive and acne-prone skin",
      shelfLife: "36 Months from Manufacturing"
    },
    dosageNote: "Daily bathing bar for morning freshness and evening skin restoration."
  },
  {
    id: "bundle-pain-duo",
    name: "Ultimate Joint & Mobility Duo",
    title: "Franch Ultimate Joint & Mobility Duo (NH* Plus + Orthovin Thailam)",
    shortTagline: "Dual Action Complete Joint & Muscle Relief Kit",
    category: "Bundles",
    categoryLabel: "Curated Value Bundles",
    badge: "Save ₹71 • Best Value",
    rating: 4.9,
    reviewsCount: 520,
    mainImage: "/images/hero-section/hero-3.webp",
    gallery: [
      "/images/hero-section/hero-3.webp",
      "/images/hero-section/oil.webp",
      "/images/hero-section/thailam-product.webp"
    ],
    accentColor: "#145C34",
    highlight: "Complete External Pain Defense Combination",
    tagline: "Combine Franch Oil NH* Plus for daily muscular agility with Orthovin Thailam for deep joint arthritis relief.",
    description:
      "Our most recommended pain relief bundle! Combines the multipurpose tissue-healing power of Franch Oil NH* Plus (100ml) with the deep thermal penetrative warmth of Franch Orthovin Thailam (100ml). Perfect for households dealing with both sports aches and age-related arthritis.",
    benefits: [
      "Dual therapeutic power: immediate muscular relief + deep joint cartilage comfort",
      "Recommended by Ayurvedic doctors for chronic knee arthritis and back spasms",
      "Massive bundle savings compared to purchasing separately",
      "Includes complimentary Ayurvedic acupressure & massage guidance brochure"
    ],
    variants: [
      { size: "100ml + 100ml Kit", price: 359, mrp: 430, discount: "17% OFF", popular: true },
      { size: "200ml + 200ml Jumbo Kit", price: 659, mrp: 870, discount: "24% OFF" }
    ],
    defaultVariantIndex: 0,
    specs: {
      volume: "100ml Oil + 100ml Thailam",
      formulation: "Combo Pack: Medicated Oil + Classical Thailam",
      usage: "Apply Franch Oil during daytime; apply Orthovin Thailam before sleep.",
      keyActives: "Cold-Pressed Castor Decoction + Anti-Arthritic Herbal Roots",
      suitableFor: "Families, Seniors, Post-operative rehab, Fitness enthusiasts",
      shelfLife: "36 Months"
    },
    dosageNote: "Apply alternatively for maximum transdermal herbal synergy."
  },
  {
    id: "bundle-holistic-wellness",
    name: "Complete Ayurvedic Wellness Kit",
    title: "Franch Complete Ayurvedic Wellness Kit (Oil + Thailam + OG-3 Veg + Soap)",
    shortTagline: "All 4 Flagship Formulations in One Holistic Box",
    category: "Bundles",
    categoryLabel: "Curated Value Bundles",
    badge: "Save ₹261 • Complete Pack",
    rating: 5.0,
    reviewsCount: 310,
    mainImage: "/images/hero-section/11.webp",
    gallery: [
      "/images/hero-section/11.webp",
      "/images/hero-section/oil.webp",
      "/images/hero-section/tablet.webp",
      "/images/hero-section/soap-1.webp"
    ],
    accentColor: "#145C34",
    highlight: "The Ultimate 360° Internal & External Wellness System",
    tagline: "Everything you need for painless joints, healthy heart & brain, and glowing herbal skin care.",
    description:
      "Experience the complete 25-year botanical legacy of the FM Group. This comprehensive wellness box contains Franch Oil NH* Plus (100ml), Orthovin Thailam (100ml), OG-3 Veg Omega-3 Capsules (60 Softgels), and Franch Ayurveda Skin Soap (Pack of 3).",
    benefits: [
      "Holistic wellness covering internal cardiovascular vitality and external pain relief",
      "Full 30-day course of pure plant-powered wellness",
      "Special discounted collector's bundle pricing",
      "Delivered in a premium eco-friendly gift box"
    ],
    variants: [
      { size: "Complete 4-in-1 Kit", price: 799, mrp: 1060, discount: "25% OFF", popular: true }
    ],
    defaultVariantIndex: 0,
    specs: {
      volume: "100ml + 100ml + 60 Caps + 3x100g",
      formulation: "Multi-product Ayurvedic System",
      usage: "Comprehensive daily routine enclosed in package guide.",
      keyActives: "Cold-Pressed Castor, Flaxseed ALA, Anti-Arthritic Herbs, Pure Dermal Essences",
      suitableFor: "Holistic health conscious households",
      shelfLife: "24-36 Months"
    },
    dosageNote: "Full lifestyle herbal guide included in box."
  }
];

export const TRUST_BADGES = [
  {
    id: "legacy",
    title: "25+ Years Legacy",
    subtitle: "Pioneered by FM Group since 1998",
    description: "Over two and a half decades of unwavering clinical trust across 3.5 million Indian homes."
  },
  {
    id: "actives",
    title: "100% Pure Actives",
    subtitle: "Cold-pressed herbal decoctions",
    description: "Zero synthetic mineral oil, parabens, artificial steroids or harmful chemical solvents."
  },
  {
    id: "gmp",
    title: "GMP & AYUSH Certified",
    subtitle: "Pharmaceutical cleanroom units",
    description: "Produced under strict Ministry of AYUSH guidelines with rigorous multi-batch potency assays."
  },
  {
    id: "doctor",
    title: "Doctor Recommended",
    subtitle: "12,000+ Vaidyas & Clinics",
    description: "Trusted and prescribed by registered Ayurvedic practitioners, orthopedicians, and physiotherapists."
  },
  {
    id: "dispatch",
    title: "Express Pan-India Delivery",
    subtitle: "Dispatched within 24 hours",
    description: "Safe, tamper-evident hygienic packaging with live SMS and WhatsApp tracking updates."
  },
  {
    id: "vegetarian",
    title: "100% Vegetarian & Clean",
    subtitle: "Zero fish oil or animal gelatin",
    description: "Cruelty-free botanical formulations respecting ethical, dietary, and religious values."
  }
];

export const REVIEWS_CATALOG = [
  {
    id: 1,
    name: "Ameer Khurram",
    city: "Chennai, Tamil Nadu",
    rating: 5,
    productId: "franch-oil-nh-plus",
    productName: "Franch Oil NH* Plus",
    title: "Unmatched Multipurpose Healing Oil For Over 15 Years",
    comment:
      "Franch Oil has been an absolute staple in our home for over 15 years. My grandmother uses it for her knee arthritis, and I use it whenever I get gym muscle pulls or minor kitchen burns. Within 2 days the redness and pain vanish. Absolutely indispensable.",
    verified: true,
    date: "12 February 2026",
    avatar: "AK"
  },
  {
    id: 2,
    name: "Sakshi Verma",
    city: "Bengaluru, Karnataka",
    rating: 5,
    productId: "franch-orthovin-thailam",
    productName: "Franch Orthovin Thailam",
    title: "Remarkable relief for mother's chronic knee stiffness",
    comment:
      "My mother was suffering from severe morning joint stiffness in her fingers and knees due to osteoarthritis. After massaging Orthovin Thailam twice a day, her walking comfort and flexibility returned without any sticky chemical residue. Truly miraculous Ayurvedic formula!",
    verified: true,
    date: "28 January 2026",
    avatar: "SV"
  },
  {
    id: 3,
    name: "Jairam S. Narayan",
    city: "Coimbatore, Tamil Nadu",
    rating: 5,
    productId: "omega-3",
    productName: "Franch Omega-3 Veg (OG-3 Veg)",
    title: "Best vegetarian omega-3 in India — Zero fishy burps",
    comment:
      "As a strict vegetarian, finding authentic Omega-3 without fish gelatin capsules was tough. Franch Omega-3 has zero fishy burps, gives great energy, and helps keep my joints feeling lubricated. Highly recommend to everyone looking for plant-based wellness.",
    verified: true,
    date: "04 March 2026",
    avatar: "JN"
  },
  {
    id: 4,
    name: "Dr. Radhika Sundaram",
    city: "Kochi, Kerala",
    rating: 5,
    productId: "franch-ayurveda-skin-soap",
    productName: "Franch Ayurveda Skin Soap",
    title: "Gentle on sensitive skin, clears prickly heat and blemishes",
    comment:
      "I recommend Franch Ayurveda Soap to patients with heat rashes, acne, and dry irritated skin. Unlike commercial soaps that strip natural oils, this creates a soft nourishing lather with genuine Franch Oil healing essence. My whole family has switched to it.",
    verified: true,
    date: "19 February 2026",
    avatar: "RS"
  },
  {
    id: 5,
    name: "K. Sundaramoorthy",
    city: "Madurai, Tamil Nadu",
    rating: 5,
    productId: "franch-oil-nh-plus",
    productName: "Franch Oil NH* Plus",
    title: "Instant relief from sports muscle soreness & back strain",
    comment:
      "I am an avid badminton player. Muscle sprains and ankle twists are common. A gentle 5-minute massage with Franch Oil at night ensures I wake up without stiffness or pain. It penetrates deep into muscle tissue very quickly.",
    verified: true,
    date: "15 January 2026",
    avatar: "KS"
  },
  {
    id: 6,
    name: "Meenakshi Iyer",
    city: "Mumbai, Maharashtra",
    rating: 5,
    productId: "bundle-pain-duo",
    productName: "Ultimate Joint & Mobility Duo",
    title: "The combination of NH Plus and Orthovin is unbeatable",
    comment:
      "We ordered the Mobility Duo pack. Using Orthovin Thailam for the stubborn knee joints and Franch Oil NH* Plus for upper back tension has brought unbelievable relief to both my husband and myself. 5 stars for quality and fast shipping!",
    verified: true,
    date: "02 March 2026",
    avatar: "MI"
  }
];

export const BRAND_STORY_POINTS = [
  {
    step: "01",
    title: "Heritage Born in 1998",
    subtitle: "FM Group of Companies",
    desc: "Founded with the mission to bring authentic Ayurvedic classical healing wisdom to modern families seeking genuine, non-toxic pain relief."
  },
  {
    step: "02",
    title: "Proprietary Cold-Pressed Extraction",
    subtitle: "Bioactive Potency Preserved",
    desc: "Unlike standard industrial heating that destroys fragile plant phytosterols, our cold extraction preserves 100% of the botanical therapeutic compounds."
  },
  {
    step: "03",
    title: "Deep Transdermal Penetration",
    subtitle: "Reaches the Root of Pain",
    desc: "Micro-molecular herbal carriers penetrate deep across dermal layers into muscle tissues and joint synovial fluids for long-lasting relief."
  },
  {
    step: "04",
    title: "Seed-to-Bottle Ethical Purity",
    subtitle: "AYUSH & GMP Certified",
    desc: "Every batch is tested for zero heavy metals, zero steroids, zero pesticides, and zero artificial stabilizers. Pure botanical assurance in every bottle."
  }
];

export const FAQS = [
  {
    q: "How does Franch Oil NH* Plus differ from regular pain relief balms and mineral oils?",
    a: "Franch Oil NH* Plus is formulated using a specialized proprietary cold-pressed extraction technique that retains the active bio-nutrients of Ricinus Communis seed oil alongside rare Ayurvedic herbs. Unlike commercial balms that use strong artificial menthol to numb the surface temporarily, Franch Oil penetrates deep into muscular tissue to calm inflammation, accelerate blood circulation, and trigger natural cellular repair."
  },
  {
    q: "Can Franch Oil NH* Plus be safely applied on minor open wounds, burns, and cuts?",
    a: "Yes! Franch Oil NH* Plus is renowned for its multipurpose tissue-restorative properties. It can be applied gently to clean minor cuts, scratches, superficial kitchen burns, and dry rashes to soothe irritation, shield against environmental toxins, and promote smooth, scar-free healing."
  },
  {
    q: "How should I use Franch Orthovin Thailam for chronic knee arthritis and joint stiffness?",
    a: "Take 5 to 10 drops of Orthovin Thailam in your palm, warm it slightly by rubbing your hands together, and massage gently in circular motions over stiff joints (knees, hips, lower back, neck, or shoulders) for 3-5 minutes until fully absorbed. For best results, use twice daily: once in the morning and once before bedtime."
  },
  {
    q: "Why is Franch OG-3 Veg Omega-3 superior to ordinary fish oil supplements?",
    a: "Franch OG-3 Veg is 100% plant-based, derived from virgin cold-pressed flaxseed oil rich in Alpha-Linolenic Acid (ALA), encapsulated in vegetarian cellulose capsules. It provides all the cardiovascular, brain, and joint benefits of Omega-3 with zero fishy aftertaste, zero acid burps, zero ocean mercury contamination, and 100% vegetarian ethical compliance."
  },
  {
    q: "Is Franch Ayurveda Skin Soap suitable for sensitive skin and acne-prone skin?",
    a: "Yes. Franch Ayurveda Skin Soap is a Grade-1 Ayurvedic soap with a high TFM of 76%, infused with genuine Franch Oil healing essence. It is completely free from harsh parabens, animal fats, and synthetic detergents. It cleanses deeply while preserving your skin's natural moisture barrier, making it ideal for clearing acne, dark spots, and prickly heat."
  },
  {
    q: "How fast is delivery and what are the shipping charges?",
    a: "We offer Free Express Pan-India Shipping on all orders above ₹499. Orders are dispatched from our central facility within 24 hours. Delivery typically takes 2-4 business days across major cities with real-time SMS and WhatsApp tracking."
  }
];
