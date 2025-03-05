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
        const dateInput = document.getElementById('date').value || new Date().toISOString().split('T')[0];
        const timeInput = document.getElementById('time').value || new Date().toTimeString().slice(0, 5);
        const paymentMethod = document.getElementById('paymentMethod').value;
        const cardType = document.getElementById('cardType').value;
        const lastFour = document.getElementById('lastFour').value || "N/A";

        // Format date and time
        const dateObj = new Date(dateInput);
        const date = dateObj.toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' });
        const time = timeInput.replace(':', ':') + (parseInt(timeInput.split(':')[0]) >= 12 ? ' PM' : ' AM');
        const formattedDateTime = `${date} at ${time}`;

        // Generate random order number
        const orderNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit number

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

        // Fixed ABN, Phone, and Address
        const abn = "86 381 577 263";
        const phone = "08 9227 6157";
        const address = "Water Town Shopping Centre\nA035/840 Wellington Street\nWest Perth WA 6005\nAustralia";

        // Calculate total
        const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

        // Format payment details
        const paymentText = paymentMethod === "Card" && lastFour !== "N/A" 
            ? `Paid via ${cardType} •••• ${lastFour}` 
            : `Paid via ${paymentMethod}`;

        // Generate receipt HTML for preview
        const receiptContent = `
            <h1 style="text-align: center; color: #1a3c5e;">Supplements2U</h1>
            <p style="text-align: center; font-style: italic; color: #7f8c8d;">Your Health, Our Priority</p>
            <p style="text-align: center;">${address.replace(/\n/g, '<br>')}</p>
            <p style="text-align: center;">ABN: ${abn} | Phone: ${phone}</p>
            <p><strong>Order #${orderNumber}</strong></p>
            <p><strong>Transaction Date:</strong> ${formattedDateTime}</p>
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
            <div class="banner">Earn 200 Member Points on Your Next Shop!</div>
            <div class="qr-placeholder">Help Us Improve – Scan for Feedback</div>
            <p style="text-align: center; margin-top: 20px; font-weight: bold;">Thank You for Shopping at Supplements2U!</p>
            <p style="text-align: center; font-size: 10px;">All prices in AUD and include GST</p>
        `;

        // Display preview
        document.getElementById('receiptPreview').innerHTML = receiptContent;

        // Generate PDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Header (logo placeholder - instructions below)
        doc.setFontSize(22);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(26, 60, 94); // #1a3c5e
        doc.text("Supplements2U", 105, 25, { align: "center" });
        doc.setFontSize(11);
        doc.setFont("Helvetica", "italic");
        doc.setTextColor(127, 140, 141); // #7f8c8d
        doc.text("Your Health, Our Priority", 105, 32, { align: "center" });
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(51, 51, 51); // #333
        doc.text(address, 105, 40, { align: "center", maxWidth: 100 });
        doc.text(`ABN: ${abn}  |  Phone: ${phone}`, 105, 55, { align: "center" });
        doc.setLineWidth(0.5);
        doc.setDrawColor(26, 60, 94);
        doc.line(20, 60, 190, 60);

        // Order and Date
        doc.setFontSize(12);
        doc.setFont("Helvetica", "bold");
        doc.text(`Order #${orderNumber}`, 20, 70);
        doc.setFont("Helvetica", "normal");
        doc.text(`Date: ${formattedDateTime}`, 20, 78);

        // Items Table
        doc.setFontSize(14);
        doc.setFont("Helvetica", "bold");
        doc.text("Items Purchased", 20, 90);
        let y = 97;
        doc.setFontSize(10);
        doc.setFillColor(26, 60, 94); // #1a3c5e
        doc.rect(20, y, 170, 6, "F");
        doc.setTextColor(255, 255, 255);
        doc.text("Item", 22, y + 4);
        doc.text("Qty", 90, y + 4, { align: "center" });
        doc.text("Unit Price", 120, y + 4, { align: "right" });
        doc.text("Total", 180, y + 4, { align: "right" });
        y += 6;

        doc.setTextColor(51, 51, 51);
        doc.setFont("Helvetica", "normal");
        items.forEach((item, index) => {
            doc.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 248 : 255); // #f8f8f8 or #ffffff
            doc.rect(20, y, 170, 6, "F");
            doc.text(item.name.slice(0, 35), 22, y + 4); // Truncate long names
            doc.text(item.qty.toString(), 90, y + 4, { align: "center" });
            doc.text(`$${item.price.toFixed(2)}`, 120, y + 4, { align: "right" });
            doc.text(`$${(item.price * item.qty).toFixed(2)}`, 180, y + 4, { align: "right" });
            y += 6;
        });

        doc.setFillColor(232, 236, 239); // #e8ecef
        doc.rect(20, y, 170, 6, "F");
        doc.setFont("Helvetica", "bold");
        doc.text("Grand Total", 120, y + 4, { align: "right" });
        doc.text(`$${total.toFixed(2)}`, 180, y + 4, { align: "right" });
        y += 12;

        // Payment Details
        doc.setLineWidth(0.3);
        doc.line(20, y, 190, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(51, 51, 51);
        doc.text(paymentText, 20, y);
        y += 10;

        // Banner
        doc.setFillColor(255, 243, 205); // #fff3cd
        doc.rect(20, y, 170, 10, "F");
        doc.setTextColor(133, 100, 4); // #856404
        doc.setFontSize(10);
        doc.text("Earn 200 Member Points on Your Next Shop!", 105, y + 7, { align: "center" });
        y += 15;

        // QR Code Placeholder
        doc.setDrawColor(153, 153, 153); // #999
        doc.setLineWidth(0.2);
        doc.setDashPattern([2, 2], 0);
        doc.rect(85, y, 40, 40);
        doc.setFontSize(9);
        doc.setTextColor(51, 51, 51);
        doc.text("Help Us Improve", 105, y + 20, { align: "center" });
        doc.text("Scan for Feedback", 105, y + 26, { align: "center" });
        y += 45;

        // Footer
        doc.setLineWidth(0.3);
        doc.setDashPattern([], 0);
        doc.line(20, y, 190, y);
        y += 8;
        doc.setFontSize(13);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(26, 60, 94);
        doc.text("Thank You for Shopping at Supplements2U!", 105, y, { align: "center" });
        doc.setFontSize(9);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(127, 140, 141);
        doc.text("All prices in AUD and include GST", 105, y + 7, { align: "center" });

        // Download PDF
        const pdfOutput = doc.output('blob');
        const url = URL.createObjectURL(pdfOutput);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Supplements2U_Receipt_${date.replace(/\s/g, '_')}_${time.replace(':', '').replace(' ', '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("An error occurred while generating the PDF. Check the console for details.");
    }
}
