import React, { useEffect, useState } from 'react';
import logo from "/images/logo.webp";
import { isTamilNaduOrder } from '../utils/gstTaxHelper';

function Invoice({ orderData, edit }) {
    // orderData look like this 
    //     {
    //     "id": "order_RyL3xR11ASqU4f",
    //     "createdAt": {
    //         "type": "firestore/timestamp/1.0",
    //         "seconds": 1767210358,
    //         "nanoseconds": 700000000
    //     },
    //     "razorpay_order_id": "order_RyL3xR11ASqU4f",
    //     "selectedAddress": {
    //         "city": "chennai",
    //         "street": "test razorpay",
    //         "country": "India",
    //         "state": "tamil",
    //         "pincode": "600005",
    //         "line2": "",
    //         "line1": "NO 20/51 ROYAL BUILDERS FLAT"
    //     },
    //     "cart": [
    //         {
    //             "sku": "franch-oil-nh-plus",
    //             "createdAt": {
    //                 "type": "firestore/timestamp/1.0",
    //                 "seconds": 1767117772,
    //                 "nanoseconds": 103000000
    //             },
    //             "id": "rOwdtMz5dDDHJtC5lhip",
    //             "price": 210,
    //             "title": "Franch Oil NH* Plus",
    //             "productId": "60TbIHdbSiArXkExKiUJ",
    //             "qty": 1,
    //             "imageURL": "https://firebasestorage.googleapis.com/v0/b/transvaal-franchglobal.firebasestorage.app/o/products%2Fgallery%2Ffranch-oil-nh-plus%2F1760291120340-81jNprNajBL._SL1500_.webp?alt=media&token=b0c7078c-795f-45f5-bb36-c99a59a46599"
    //         }
    //     ],
    //     "isValid": true,
    //     "amount": 100,
    //     "razorpay_signature": "a37e135908da8bc3b21d46f20107443cff5ef3a33b8840d2f920b1046a54c0e7",
    //     "razorpay_payment_id": "pay_RyL4L10mMZ9dDv"
    // }

    const [editstate, setEditState] = useState(false);

    useEffect(() => {
        setEditState(edit);
    }, [edit])
    useEffect(() => {
        // console.log("Edit state changed:", orderData);
    }, [orderData])

    const nameLookLike = {
        "franch-oil-nh-plus": "Franch Oil NH* Plus - Ayurvedic Product - 100 ML",
        "Franch Oil NH* Plus": "Franch Oil NH* Plus - Ayurvedic Product - 100 ML",

        "landing-franch-oil-nh-plus-pack-of-2": "Franch Oil NH* Plus | Multipurpose Healing Oil - Stretch Marks, Small Burns, Scars, Aches & Pains - 100 ML (Pack of 2)",
        "Franch Oil NH* Plus | Multipurpose Healing Oil - Stretch Marks, Small Burns, Scars, Aches & Pains - 100 ML (Pack of 2)": "Franch Oil NH* Plus | Multipurpose Healing Oil - Stretch Marks, Small Burns, Scars, Aches & Pains - 100 ML (Pack of 2)",

        "franch-ayurveda-skin-soap": "Franch Ayurveda Clear Skin Soap 100 Gms",
        "Franch Ayurveda Clear Skin Soap": "Franch Ayurveda Clear Skin Soap 100 Gms",

        "franch-orthovin-thailam": "Franch Orthovin Thailam 60 ML - Ayurvedic Medicine [60 ML]",
        "Franch Orthovin Thailam": "Franch Orthovin Thailam 60 ML - Ayurvedic Medicine [60 ML]",

        "omega-3": "Franch OG-3 Veg Softgels Softgels Capsules",
        "OG-3 Veg": "Franch OG-3 Veg Softgels Softgels Capsules",
    }
    const TamilnaduCities = [
        "aarkadu",
        "adirampattinam",
        "adiyakkamangalam",
        "aduthurai",
        "alangudi",
        "alwarthirunagiri",
        "alāndurai",
        "ambasamudram",
        "ambaturai",
        "ambur",
        "ammaianayakkanur",
        "anaikatti",
        "anaimalai",
        "anakkara",
        "anandathandavapuram",
        "anangur",
        "andampallam",
        "andevanahalli",
        "andipatti",
        "anekal",
        "annur",
        "anuppampattu",
        "anvarthikanpettei",
        "arakkonam",
        "aralvaimozhi",
        "arani",
        "aranthangi",
        "ariyalur",
        "ariyanoor",
        "arumuganeri",
        "aruppukkottai",
        "attadi",
        "attur",
        "auroville",
        "avinashi",
        "ayandur",
        "ayodhiyapatinam",
        "ayyampalayam",
        "ayyampettai",
        "banavarm",
        "bangarapet",
        "batlagundu",
        "belukkurichchi",
        "bhavani",
        "bhel township",
        "bhutapandi",
        "bodinayakanur",
        "bommayapalayam",
        "bommidi",
        "booluvampatti",
        "budalur",
        "buddireddipatti",
        "chalakudy",
        "chamarajanagara",
        "chellarcovil",
        "chengalpattu",
        "chengam",
        "chennai",
        "cherambadi",
        "cheranmahadevi",
        "chettippattu",
        "cheyyur",
        "chidambaram",
        "chinna salem",
        "chinnakanal",
        "chitra nagar",
        "chittar lake",
        "chittāmūr",
        "coimbatore",
        "colachel",
        "coonoor",
        "courtallam",
        "cuddalore",
        "cuddalore - puducherry administrative boundary",
        "cumbum",
        "danishpet",
        "dasampatti",
        "denkanikota",
        "devakottai",
        "devala",
        "devikolam",
        "dhanushkodi",
        "dhārāpuram",
        "eachangadu",
        "egattur",
        "elanthoppu",
        "elavur",
        "eraniel",
        "eriyodu",
        "erode",
        "ethapur",
        "ganapathichettikulam",
        "gangaikonda cholapuram",
        "genguvarpatti",
        "gingee",
        "gobichettipalayam",
        "golden rock",
        "gudalur",
        "gudiyatham",
        "guduvancheri",
        "gummidipundi",
        "gundlupet",
        "gvanagar",
        "harur",
        "hogenakkal",
        "hoskote",
        "hosur",
        "huligal",
        "ilaiyankudi",
        "ingur",
        "iravanpatti",
        "ithalar",
        "jolarpet",
        "kadambattur",
        "kadambur",
        "kadayam",
        "kadayanallur",
        "kaduvanur",
        "kalambur",
        "kalanivasal",
        "kalapet",
        "kalial",
        "kallagam",
        "kallakkurichi",
        "kallal",
        "kallidaikurichi",
        "kambarasampettai",
        "kamudi",
        "kanakammachattram",
        "kanakapura",
        "kanchipuram",
        "kaniyambadi",
        "kannamangalam",
        "kannan devan hills",
        "kanyakumari",
        "karaikal",
        "karaikudi",
        "karambavayal",
        "karumattampatti",
        "karungulam",
        "karunya nagar",
        "karuppur",
        "karur",
        "kathadimattam",
        "katpadi",
        "kattankulathur",
        "kattumannarkoil",
        "kavanur",
        "kilvelur",
        "kizha ambur",
        "kodaikanal",
        "kollegal",
        "kollidam",
        "konni",
        "koolipalayam",
        "koonimedu",
        "koradacheri",
        "korampallam",
        "kotagiri",
        "kothamangalam",
        "kottachchedu",
        "kottagudi",
        "kottakuppam",
        "kovilampoondi",
        "kovilpatti",
        "krishna karanai",
        "krishnagiri",
        "kuchanur",
        "kuilapalayam",
        "kulattur",
        "kulithalai",
        "kumaran nagar",
        "kumbakonam",
        "kumily",
        "kuppam",
        "kurumbur",
        "kuthalam",
        "kuthambakkam",
        "kuzhithurai",
        "kālpākkam",
        "kānādukāttān",
        "kāramadai",
        "kāverippattanam",
        "kāveripāk",
        "lalgudi",
        "latteri",
        "lokur",
        "lovedale",
        "madurai",
        "madurantakam",
        "magudanchavadi",
        "mahabalipuram",
        "mailam",
        "malaiyāndipattanam",
        "malampuzha - i",
        "mallur",
        "malur",
        "mambalapattu",
        "manamadurai",
        "manamedu",
        "manapparai",
        "manavur",
        "mandapam",
        "mandavi",
        "mangalam",
        "manganallur",
        "manimutharu",
        "maniyachi",
        "manjakuppam",
        "manjakuttai",
        "mannargudi",
        "mannarkkad",
        "maraimalai nagar",
        "marie oulgaret",
        "marthandam",
        "marungai",
        "marungoor",
        "masinagudi",
        "mattur",
        "mavelipalayam",
        "mayiladuthurai",
        "mekkarai",
        "melmaruvathur",
        "melnariyappanur",
        "melpattampakkam",
        "melpatti",
        "melur",
        "mettupalayam",
        "mettur",
        "minjur",
        "mohanur",
        "morappur",
        "moratandi",
        "mudukulattur",
        "mudumalai",
        "mulligoor",
        "mundiyampakkam",
        "munthal",
        "musiri",
        "muthalamada",
        "muthupet",
        "naduhatty",
        "nagapattinam",
        "nagercoil",
        "nagore",
        "namakkal",
        "nandhiyan kudikkadu",
        "nanguneri",
        "nannilam",
        "nattam",
        "nazareth",
        "nedumangad",
        "needamangalam",
        "nellikuppam",
        "nerinjippettai",
        "nettapakkam",
        "neyveli",
        "neyyattinkara",
        "nidur",
        "nilakkottai",
        "nilambur",
        "oddanchatram",
        "olakur",
        "omalur",
        "ooty",
        "oragadam",
        "orattanadu",
        "ottapidaram",
        "pachakuppam",
        "padavayal",
        "palakkad",
        "palakkodu",
        "palani",
        "palayam",
        "palayankottai",
        "palladam",
        "pallapatti",
        "pallipalayam",
        "pallippattu",
        "palliyadi",
        "palmaner",
        "pamba kovil shandy",
        "panagudi",
        "panambakkam",
        "panangudi",
        "panruti",
        "papanasam",
        "papasanam",
        "paramakudi",
        "parangipettai",
        "parassala",
        "pattukkottai",
        "pedda nayakkanpalaiyam",
        "peermade",
        "pennadam",
        "pennagaram",
        "peralam",
        "perambalūr",
        "perani",
        "peravurani",
        "periyakulam",
        "perumal kovil pathy",
        "perumālmalai",
        "perundurai",
        "pollachi",
        "polur",
        "ponneri",
        "ponnirai",
        "poondi",
        "poondithangal",
        "poothurai",
        "poothurai",
        "poovar",
        "potheri",
        "pottaveli",
        "pudi",
        "puducherry",
        "pudukkottai",
        "pudukudi",
        "pudumund",
        "pukkiravari",
        "puliyūr",
        "punalur",
        "punjai puliyampatti",
        "pushpagiri",
        "puthiamputhur",
        "puttur",
        "pykara",
        "pāchchalūr",
        "pālamedu",
        "radhapuram",
        "rajapalayam",
        "ramakkalmedu",
        "ramanathapuram",
        "rameshwaram",
        "ranipet",
        "rasipuram",
        "salem",
        "saliamangalam",
        "samalpatti",
        "samayanallur",
        "samayapuram",
        "samudram",
        "sankagiri",
        "sankarankovil",
        "sannanallur",
        "saranthangi",
        "saravanampatty",
        "sathyamangalam",
        "sattankulam",
        "sattiyakudi",
        "sattur",
        "satyavedu",
        "sembatti",
        "sendurai",
        "sengulam",
        "sethumadai",
        "sevoor",
        "seydunganallur",
        "shenkottai",
        "shimla",
        "sholavandan",
        "silaiman",
        "sillakkudi",
        "singanallur",
        "singaperumal koil",
        "sirkazhi",
        "sirumalai",
        "sirumugai",
        "siruseri",
        "sivaganga",
        "sivagiri",
        "sivakasi",
        "solagampatti",
        "somanur",
        "sorapattu",
        "sriharikota",
        "sriperumbudur",
        "srivaikuntam",
        "srivilliputhur",
        "srīrangam",
        "suchindram",
        "sulerikadu",
        "sulthan bathery",
        "swamimalai",
        "tada",
        "taingapatam",
        "taiyūr",
        "takkolam",
        "tarangambadi",
        "tenkasi",
        "thadikombu",
        "thalaivasal",
        "thalayathimund",
        "thanjavur",
        "tharumapuri",
        "thekkady",
        "theni",
        "thindal",
        "thindukkal",
        "thirukadaiyur",
        "thirukkadaiyur",
        "thirumayam",
        "thirunageswaram",
        "thirunallar",
        "thirunankovil",
        "thiruparankundram",
        "thiruthangal",
        "thiruthani",
        "thiruthuraipoondi",
        "thiruthuraiyur",
        "thiruvaiyaru",
        "thiruvalangadu",
        "thiruvallam",
        "thiruvarur",
        "thiruvavaduthurai",
        "thiruverumbur",
        "thiruvidaimarudur",
        "thiruvisanallur",
        "thoothukudi",
        "thovalai",
        "thuckalay",
        "thuraiyur",
        "tindivanam",
        "tiruchendur",
        "tiruchengode",
        "tiruchirappalli",
        "tiruchuli",
        "tirukoilur",
        "tirumalaisamudram",
        "tirumalpur",
        "tirumangalam",
        "tirunelveli",
        "tirupattur",
        "tiruppattur",
        "tirupporur",
        "tiruppuvanam",
        "tirupur",
        "tiruvadanai",
        "tiruvannamalai",
        "tiruvettipuram",
        "tiruvādūr",
        "tozhuppedu",
        "tranquebar",
        "uchipuli",
        "udaiyarpalaiyam",
        "udumalaipettai",
        "udumbanchola",
        "ulundurpet",
        "umayalparamancheri",
        "usilampatti",
        "uthamapalayam",
        "uthukuli",
        "uttangarai",
        "uttiramerur",
        "uttukkottai",
        "vadavalli",
        "vadipatti",
        "vaduvanchal",
        "vaithīsvarankoil",
        "vallam",
        "vallampadugai",
        "vallioor",
        "valparai",
        "vandavasi",
        "vaniyambadi",
        "vannarpet",
        "varakalpattu",
        "vasavasamudram",
        "vazhapadi",
        "vedasandur",
        "veerarakiyam",
        "velankanni",
        "velayuthampalayam",
        "velliyanai",
        "vellore",
        "veppadai",
        "vijayamanagaram",
        "vijayamangalam",
        "vikravandi",
        "vilattikulam",
        "villiyanallur",
        "vilpatti",
        "viluppuram",
        "vinnamangalam",
        "virudhunagar",
        "vriddhachalam",
        "vythiri",
        "walajabad",
        "walajapet",
        "walayar",
        "west mere",
        "yelagiri",
    ]
    // Priority hierarchy: GSTIN -> Explicit State -> PIN code range (600000-643999) -> Tamil Nadu city fallback
    const isTamilNadu = isTamilNaduOrder(orderData, TamilnaduCities);
    // console.log("Rendering Invoice with data:", orderData, "Edit mode:", editstate, "Is Tamil Nadu:", isTamilNadu);

    return (
        <div className="max-w-[1400px] w-full mx-auto font-sans text-sm leading-[1.2] bg-white p-2">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="w-[55%]">
                    <img src={logo} alt="Company Logo" className="max-h-[70px] mb-3" />
                    <div className="font-bold">Franch Global Health Care LLP</div>
                    <div contentEditable={editstate} className="text-[#012169]">
                        Address:<br />
                        Old No. 17, New No. 61, Ormes Road, 2nd Floor, Kilpauk,<br />
                        Chennai - 600010 (Tamil Nadu)<br />
                        Contact: 9841854321<br />
                        GSTIN: 33AAHFF7124K1ZF<br />
                        PAN: AAHFF7124K
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold mb-2">Tax Invoice</div>
                    <table className="border-collapse w-[270px]">
                        <tbody>
                            <tr>
                                <td className="border border-black p-2 font-bold text-left w-[140px]">INVOICE NO:</td>
                                <td contentEditable={editstate} className="border border-black p-2 text-left">{orderData.invoiceNo}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-2 font-bold text-left">INVOICE DATE:</td>
                                <td contentEditable={editstate} className="border border-black p-2 text-left">{orderData.invoiceDate}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Receiver / Consignee */}
            <div className="flex justify-between mt-5">
                {/* Bill To */}
                <div className="w-1/2 border border-black p-2">
                    <h4 className="m-0 mb-1 font-bold">Details of Receiver (Bill To)</h4>
                    <p>
                        <strong>Name:</strong> <span contentEditable={editstate}>{orderData.name || "Unknown"}</span><br />
                        <strong>Address:</strong> <span contentEditable={editstate}>{orderData.receiver?.address || "Unknown"}</span><br />
                        <strong>City, State:</strong> <span contentEditable={editstate}>{orderData.receiver?.city || "Unknown"}, {orderData.receiver?.state || "Unknown"} - {orderData.receiver?.pincode || "Unknown"}</span><br />
                        <strong>Contact:</strong> <span contentEditable={editstate}>{orderData.phone || "Unknown"}</span><br />
                        <strong>GSTIN:</strong> <span contentEditable={editstate}>{orderData.receiver?.gstin || "—"}</span>
                    </p>
                </div>

                {/* Ship To */}
                <div className="w-1/2 border border-black p-2">
                    <h4 className="m-0 mb-1 font-bold">Details of Consignee (Shipped To)</h4>
                    <p>
                        <strong>Name:</strong> <span contentEditable={editstate}>{orderData.name || "Unknown"}</span><br />
                        <strong>Address:</strong> <span contentEditable={editstate}>{orderData.consignee?.address || "Unknown"}</span><br />
                        <strong>City, State:</strong> <span contentEditable={editstate}>{orderData.consignee?.city || "Unknown"}, {orderData.consignee?.state || "Unknown"} - {orderData.consignee?.pincode || "Unknown"}</span><br />
                        <strong>Contact:</strong> <span contentEditable={editstate}>{orderData.phone || "Unknown"}</span>
                    </p>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse text-[8px] leading-[1.2] mt-4 border border-black">
                <thead>
                    <tr className="bg-[#e5e3e3]">
                        <th contentEditable={editstate} className="border border-black p-1 w-[2%]">#</th>
                        <th contentEditable={editstate} className="border border-black p-1 w-[20%] text-left">Item</th>
                        <th contentEditable={editstate} className="border border-black p-1 w-[5%]">HSN</th>
                        <th contentEditable={editstate} className="border border-black p-1 w-[5%]">Unit Price</th>
                        <th contentEditable={editstate} className="border border-black p-1 w-[4%]">Qty</th>
                        <th contentEditable={editstate} className="border border-black p-1 w-[6%]">Taxable</th>
                        <th contentEditable={editstate} colSpan={2} className="border border-black p-1 w-[14%]">CGST</th>
                        <th contentEditable={editstate} colSpan={2} className="border border-black p-1 w-[14%]">SGST</th>
                        <th contentEditable={editstate} colSpan={2} className="border border-black p-1 w-[14%]">IGST</th>
                        <th contentEditable={editstate} className="border border-black p-1 w-[15%]">Total</th>
                    </tr>
                    <tr className="bg-[#e5e3e3]">
                        <th contentEditable={editstate} colSpan={6}></th>
                        <th contentEditable={editstate} className="border border-black p-1 w-[7%]">Rate</th>
                        <th contentEditable={editstate} className="border border-black p-1 w-[7%]">Amount</th>
                        <th contentEditable={editstate} className="border border-black p-1 w-[7%]">Rate</th>
                        <th contentEditable={editstate} className="border border-black p-1 w-[7%]">Amount</th>
                        <th contentEditable={editstate} className="border border-black p-1 w-[7%]">Rate</th>
                        <th contentEditable={editstate} className="border border-black p-1 w-[7%]">Amount</th>
                        <th contentEditable={editstate} ></th>
                    </tr>
                </thead>

                <tbody>
                    {orderData.items?.map((item, index) => {
                        const taxable = item.unit / 1.05;
                        const cgstAmt = isTamilNadu ? (taxable * (item.cgstRate / 100)) * item.qty : 0;
                        const sgstAmt = isTamilNadu ? (taxable * (item.sgstRate / 100)) * item.qty : 0;
                        const igstAmt = !isTamilNadu ? (taxable * 0.05) * item.qty : 0;
                        const total = (item.unit * item.qty).toFixed(2);

                        return (
                            <tr key={index}>
                                <td contentEditable={editstate} className="border border-black p-1 text-center">{index + 1}</td>
                                <td contentEditable={editstate} className="border border-black p-1 text-left">
                                    {(nameLookLike[item.code]) ? (nameLookLike[item.code]) : (nameLookLike[item.name])}{item.code === "franch-ayurveda-skin-soap" ? ` [${item.qty} QUANTITY]` : ""}
                                </td>
                                <td contentEditable={editstate} className="border border-black p-1 text-center">{item.hsn}</td>
                                <td contentEditable={editstate} className="border border-black p-1 text-center">{item.unit}</td>
                                <td contentEditable={editstate} className="border border-black p-1 text-center">{item.qty}</td>
                                <td contentEditable={editstate} className="border border-black p-1 text-center">{(taxable * item.qty).toFixed(2)}</td>

                                {/* CGST / SGST / IGST */}
                                <td contentEditable={editstate} className="border border-black p-1 text-center">{isTamilNadu ? `${item.cgstRate}%` : "0%"}</td>
                                <td contentEditable={editstate} className="border border-black p-1 text-center">{cgstAmt.toFixed(2)}</td>
                                <td contentEditable={editstate} className="border border-black p-1 text-center">{isTamilNadu ? `${item.sgstRate}%` : "0%"}</td>
                                <td contentEditable={editstate} className="border border-black p-1 text-center">{sgstAmt.toFixed(2)}</td>
                                <td contentEditable={editstate} className="border border-black p-1 text-center">{!isTamilNadu ? "5%" : "0%"}</td>
                                <td contentEditable={editstate} className="border border-black p-1 text-center">{igstAmt.toFixed(2)}</td>

                                <td contentEditable={editstate} className="border border-black p-1 text-center">{total}</td>
                            </tr>
                        );
                    })}

                    {/* Totals */}
                    <tr className="bg-[#e5e3e3] font-bold">
                        <td contentEditable={editstate} colSpan={4} className="border border-black p-1 text-end">Total</td>
                        <td contentEditable={editstate} className="border border-black p-1 text-center">
                            {orderData.items?.reduce((a, i) => a + i.qty, 0) || 0}
                        </td>
                        <td contentEditable={editstate} className="border border-black p-1 text-center">
                            {orderData.items?.reduce((a, i) => a + ((i.unit * i.qty) / 1.05), 0).toFixed(2) || "0.00"}
                        </td>
                        <td contentEditable={editstate} colSpan={6} className="border border-black p-1 text-center">
                            Total Tax: {
                                orderData.items?.reduce((a, i) => {
                                    const taxable = i.unit / 1.05;
                                    const cgst = isTamilNadu ? taxable * (i.cgstRate / 100) * i.qty : 0;
                                    const sgst = isTamilNadu ? taxable * (i.sgstRate / 100) * i.qty : 0;
                                    const igst = !isTamilNadu ? taxable * 0.05 * i.qty : 0;
                                    return a + cgst + sgst + igst;
                                }, 0).toFixed(2) || "0.00"
                            }
                        </td>
                        <td contentEditable={editstate} className="border border-black p-1 text-center">
                            {orderData.items?.reduce((a, i) => a + (i.unit * i.qty), 0).toFixed(2)}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Amount in Words */}
            <div className="border border-black p-1 mt-2">
                <span className="text-[8px]">Amount Chargeable (in Words):</span><br />
                <strong contentEditable={editstate}>{orderData.amountInWords}</strong>
            </div>

            {/* Terms & Conditions */}
            <div className="border border-black p-2 text-sm mt-2">
                <h4 className="m-0 mb-1 font-normal">Terms & Conditions</h4>
                <ul contentEditable={editstate} className="m-0 pl-5 list-disc">
                    {orderData.terms?.map((term, index) => (
                        <li key={index}>{term}</li>
                    ))}
                </ul>
            </div>
        </div>

    );
}

export default Invoice;