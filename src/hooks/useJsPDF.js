import { useCallback } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; // import function explicitly

export function useJsPDF() {
    const generateInvoicePDF = useCallback((invoiceData) => {
        const doc = new jsPDF();

        // Logo + Header Section
        const logoImg = "/images/pdf-logo.webp";
        doc.addImage(logoImg, "PNG", 10, 0, 32, 25);

        // Company Name and Address
        doc.setFontSize(12).setFont("helvetica", "bold");
        doc.text("Franch Global Health Care LLP", 12, 30);
        doc.setFontSize(9).setFont("helvetica", "normal");
        doc.text("Old No. 17, New No. 61, Ormes Road, 2nd Floor,", 12, 35);
        doc.text("Kilpauk, Chennai - 600010 (Tamil Nadu)", 12, 40);
        doc.text("Contact: 9841854321", 12, 45);
        doc.text("GSTIN: 33AAHFF7124K1ZF", 12, 50);

        // Tax Invoice Title and Invoice Info Box
        doc.setFontSize(16).setFont("helvetica", "bold");
        doc.text("Tax Invoice", 165, 20);
        doc.setFontSize(10).setFont("helvetica", "normal");
        doc.setFillColor(245, 255, 246);
        doc.setDrawColor(0, 0, 0);
        doc.rect(127, 24, 70, 16, "FD"); // Filled rectangle with border
        doc.setFontSize(10).setFont("helvetica", "bold");
        doc.text(`INVOICE NO`, 132, 30);
        doc.setFontSize(10).setFont("helvetica", "normal");
        doc.text(`: ${invoiceData.invoiceNo}`, 160, 30);
        doc.setFontSize(10).setFont("helvetica", "bold");
        doc.text(`INVOICE DATE`, 132, 37);
        doc.setFontSize(10).setFont("helvetica", "normal");
        doc.text(`: ${invoiceData.invoiceDate}`, 160, 37);

        // Receiver and Consignee Boxes
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(245, 255, 246);
        doc.rect(12, 55, 92, 28, "F"); // Bill To box
        doc.text("Details of Receiver (Bill To)", 15, 60);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const receiver = invoiceData.receiver;
        doc.text(`Name: ${receiver.name}`, 15, 66);
        doc.text(`Address: ${receiver.address}`, 15, 71);
        doc.text(`City,State: ${receiver.city}, ${receiver.state} - ${receiver.pincode}`, 15, 76);
        doc.text(`Contact: ${receiver.contact}`, 15, 81);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(245, 255, 246);
        doc.rect(108, 55, 92, 28, "F"); // Ship To box
        doc.text("Details of Consignee (Shipped To)", 111, 60);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const consignee = invoiceData.consignee;
        doc.text(`Name: ${consignee.name}`, 111, 66);
        doc.text(`Address: ${consignee.address}`, 111, 71);
        doc.text(`City,State: ${consignee.city}, ${consignee.state} - ${consignee.pincode}`, 111, 76);
        doc.text(`Contact: ${consignee.contact}`, 111, 81);

        // Items Table: using jsPDF-AutoTable for robust tables
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("Products :", 14, 95);

        // Build table data
        const tableBody = invoiceData.items.map((item, idx) => [
            idx + 1,
            item.code,
            item.name,
            item.hsn,
            item.unit,
            item.qty,
            item.taxable,
            `${item.cgstRate}%`,
            item.cgstAmount,
            `${item.sgstRate}%`,
            item.sgstAmount,
            `${item.igstRate}%`,
            item.igstAmount,
            item.totalAmount
        ]);

        autoTable(doc, {
            head: [[
                "#", "Item Code", "Item", "HSN", "Unit Price", "Qty", "Taxable",
                "CGST", "CGST Amt", "SGST", "SGST Amt", "IGST", "IGST Amt", "Total Amt"
            ]],
            body: tableBody,
            startY: 100,
            styles: { fontSize: 5, cellPadding: 2 },
            headStyles: { fillColor: [153, 255, 163], textColor: [0, 0, 0], fontStyle: "bold" }
        });
        // Total
        doc.setFont("helvetica", "bold").setFontSize(10);
        doc.text(`Total Amount: ${invoiceData.totalAmount}`, 160, doc.lastAutoTable.finalY + 14);

        // Amount in Words & Footer
        doc.setFont("helvetica", "normal");
        doc.text(`Amount Chargeable (in Words):`, 12, doc.lastAutoTable.finalY + 8 + 30);
        doc.setFont("helvetica", "bold").setFontSize(14);
        doc.text(`${invoiceData.amountInWords}`, 12, doc.lastAutoTable.finalY + 14 + 30);
        doc.setFont("helvetica", "italic").setFontSize(9);
        doc.text("Terms & Conditions:", 12, doc.lastAutoTable.finalY + 22 + 30);
        invoiceData.terms.forEach((term, idx) => {
            doc.text(`${idx + 1}. ${term}`, 18, doc.lastAutoTable.finalY + 28 + idx * 6 + 30);
        });

        doc.setFont("helvetica", "italic").setFontSize(9);
        doc.text("This is a Computer Generated Invoice", 12, 285);
        doc.setDrawColor(0, 0, 0);
        doc.rect(2, 2, 206, 293, "D");

        doc.save(`invoice-${invoiceData.invoiceNo}.pdf`);
    }, []);

    return { generateInvoicePDF };
}
