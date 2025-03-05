const { jsPDF } = window.jspdf;

document.getElementById('receiptForm').addEventListener('submit', function (e) {
    e.preventDefault();
    generateReceipt();
});

document.getElementById('paymentMethod').addEventListener('change', function () {
    const cardDetails = document.getElementById('cardDetails');
    cardDetails.classList.toggle('hidden', this.value !== 'Card');
});

function addItem() {
    const itemsDiv = document.getElementById('items');
    const newItem = document.createElement('div');
    newItem.className = 'item';
    newItem.innerHTML = `
        <input type="text" class="itemName" placeholder="Item Name">
        <input type="number" class="itemQty" placeholder="Qty" min="0">
        <input type="number" class="itemPrice" placeholder="Price ($)" min="0" step="0.01">
    `;
    itemsDiv.appendChild(newItem);
}

function generateReceipt() {
    try {
        // Get form values
        const customerEmail = document.getElementById('customerEmail').value;
        if (!customerEmail) {
            alert("Customer Email is required!");
            return;
        }
        const date = document.getElementById('date').value || new Date().toISOString().split('T')[0];
        const time = document.getElementById('time').value || new Date().toTimeString().slice(0, 5);
        const paymentMethod = document.getElementById('paymentMethod').value;
        const cardType = document.getElementById('cardType').value;
        const lastFour = document.getElementById('lastFour').value || "N/A";

        const items = [];
        const itemElements = document.getElementsByClassName('item');
        for (let item of itemElements) {
            const name = item.querySelector('.itemName').value;
            const qty = parseInt(item.querySelector('.itemQty').value) || 0;
            const price = parseFloat(item.querySelector('.itemPrice').value) || 0;
            if (name && qty > 0 && price > 0) {
                items.push({ name, qty, price });
            }
        }

        // Fixed ABN and Phone
        const abn = "86 381 577 263";
        const phone = "08 9227 6157";

        // Calculate total
        const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

        // Format payment details
        const paymentText = paymentMethod === "Card" && lastFour !== "N/A" 
            ? `Paid via ${cardType} ending in ${lastFour}` 
            : `Paid via ${paymentMethod}`;

        // Generate receipt HTML for preview
        const receiptContent = `
            <h1 style="text-align: center; color: #2c3e50;">Supplements2U</h1>
            <p style="text-align: center; font-style: italic; color: #7f8c8d;">Your Health, Our Priority</p>
            <p style="text-align: center;">ABN: ${abn} | Phone: ${phone}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <hr>
            <h3>Items Purchased</h3>
            <table>
                <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
                ${items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td style="text-align: center;">${item.qty}</td>
                        <td style="text-align: right;">$${item.price.toFixed(2)}</td>
                        <td style="text-align: right;">$${(item.price * item.qty).toFixed(2)}</td>
                    </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="3" style="text-align: right;">Grand Total</td>
                    <td style="text-align: right;">$${total.toFixed(2)}</td>
                </tr>
            </table>
            <hr>
            <p><strong>Payment:</strong> ${paymentText}</p>
            <p style="text-align: center; margin-top: 20px; font-weight: bold;">Thank You for Shopping at Supplements2U!</p>
            <p style="text-align: center; font-size: 12px;">All prices in AUD and include GST. Contact: supplements2ustore@outlook.com</p>
        `;

        // Display preview
        document.getElementById('receiptPreview').innerHTML = receiptContent;

        // Generate PDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Header
        doc.setFontSize(20);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(44, 62, 80); // #2c3e50
        doc.text("Supplements2U", 105, 15, { align: "center" });
        doc.setFontSize(12);
        doc.setFont("Helvetica", "italic");
        doc.setTextColor(127, 140, 141); // #7f8c8d
        doc.text("Your Health, Our Priority", 105, 23, { align: "center" });
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(51, 51, 51); // #333
        doc.text(`ABN: ${abn}  |  Phone: ${phone}`, 105, 31, { align: "center" });
        doc.setLineWidth(0.5);
        doc.setDrawColor(52, 73, 94); // #34495e
        doc.line(20, 35, 190, 35);

        // Receipt Details
        doc.setFontSize(12);
        doc.text(`Date: ${date}`, 20, 45);
        doc.text(`Time: ${time}`, 20, 53);

        // Items Table
        doc.setFontSize(14);
        doc.setFont("Helvetica", "bold");
        doc.text("Items Purchased", 20, 65);
        let y = 73;
        doc.setFontSize(11);
        doc.setFillColor(52, 73, 94); // #34495e
        doc.rect(20, y, 170, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.text("Item", 22, y + 5);
        doc.text("Qty", 90, y + 5, { align: "center" });
        doc.text("Unit Price", 120, y + 5, { align: "right" });
        doc.text("Total", 180, y + 5, { align: "right" });
        y += 7;

        doc.setTextColor(51, 51, 51);
        doc.setFont("Helvetica", "normal");
        items.forEach((item, index) => {
            doc.setFillColor(index % 2 === 0 ? 249 : 255, index % 2 === 0 ? 249 : 255, index % 2 === 0 ? 249 : 255); // #f9f9f9 or #ffffff
            doc.rect(20, y, 170, 7, "F");
            doc.text(item.name.slice(0, 30), 22, y + 5); // Truncate long names
            doc.text(item.qty.toString(), 90, y + 5, { align: "center" });
            doc.text(`$${item.price.toFixed(2)}`, 120, y + 5, { align: "right" });
            doc.text(`$${(item.price * item.qty).toFixed(2)}`, 180, y + 5, { align: "right" });
            y += 7;
        });

        doc.setFillColor(236, 240, 241); // #ecf0f1
        doc.rect(20, y, 170, 7, "F");
        doc.setFont("Helvetica", "bold");
        doc.text("Grand Total", 120, y + 5, { align: "right" });
        doc.text(`$${total.toFixed(2)}`, 180, y + 5, { align: "right" });
        y += 12;

        // Payment Details
        doc.setLineWidth(0.3);
        doc.line(20, y, 190, y);
        y += 8;
        doc.setFontSize(12);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(51, 51, 51);
        doc.text(paymentText, 20, y);

        // Footer
        y += 15;
        doc.setFontSize(14);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(44, 62, 80);
        doc.text("Thank You for Shopping at Supplements2U!", 105, y, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(127, 140, 141);
        doc.text("All prices in AUD and include GST", 105, y + 8, { align: "center" });
        doc.text("Contact: supplements2ustore@outlook.com", 105, y + 14, { align: "center" });

        // Download PDF
        const pdfOutput = doc.output('blob');
        const url = URL.createObjectURL(pdfOutput);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Supplements2U_Receipt_${date}_${time.replace(':', '')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("An error occurred while generating the PDF. Please check the console and try again.");
    }
}
