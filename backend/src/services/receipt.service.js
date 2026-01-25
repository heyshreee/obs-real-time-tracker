const PDFDocument = require('pdfkit');

class ReceiptService {
    static generateReceipt(payment, user, res) {
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);
        ReceiptService._buildReceipt(doc, payment, user);
        doc.end();
    }

    static generatePDFBuffer(payment, user) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            ReceiptService._buildReceipt(doc, payment, user);
            doc.end();
        });
    }

    static _buildReceipt(doc, payment, user) {
        // Header
        doc.fillColor('#444444')
            .fontSize(20)
            .text('OBS Tracker', 50, 57)
            .fontSize(10)
            .text('123 Tech Street', 200, 65, { align: 'right' })
            .text('San Francisco, CA, 94103', 200, 80, { align: 'right' })
            .moveDown();

        // Receipt Title
        doc.fillColor('#000000')
            .fontSize(20)
            .text('RECEIPT', 50, 160);

        // Receipt Details
        doc.fontSize(10)
            .text(`Receipt Number: ${payment.id}`, 50, 200)
            .text(`Date: ${new Date(payment.created_at * 1000).toLocaleDateString()}`, 50, 215)
            .text(`Payment Method: ${payment.method}`, 50, 230)
            .moveDown();

        // Billed To
        doc.text('Billed To:', 300, 200)
            .font('Helvetica-Bold')
            .text(user.name || 'Valued Customer', 300, 215)
            .font('Helvetica')
            .text(user.email, 300, 230)
            .moveDown();

        // Table Header
        const tableTop = 330;
        doc.font('Helvetica-Bold');
        generateTableRow(doc, tableTop, 'Item', 'Description', 'Unit Cost', 'Quantity', 'Line Total');
        generateHr(doc, tableTop + 20);
        doc.font('Helvetica');

        // Table Row
        const itemCode = payment.notes?.planId || 'Subscription';
        const description = `OBS Tracker ${itemCode.charAt(0).toUpperCase() + itemCode.slice(1)} Plan`;
        const amount = (payment.amount / 100).toFixed(2);

        const position = tableTop + 30;
        generateTableRow(doc, position, itemCode, description, `$${amount}`, 1, `$${amount}`);
        generateHr(doc, position + 20);

        // Total
        const subtotalPosition = position + 40;
        generateTableRow(doc, subtotalPosition, '', '', 'Subtotal', '', `$${amount}`);

        const totalPosition = subtotalPosition + 25;
        doc.font('Helvetica-Bold');
        generateTableRow(doc, totalPosition, '', '', 'Total', '', `$${amount}`);
        doc.font('Helvetica');

        // Footer
        doc.fontSize(10)
            .text(
                'Thank you for your business.',
                50,
                700,
                { align: 'center', width: 500 }
            );
    }
}

function generateTableRow(doc, y, item, description, unitCost, quantity, lineTotal) {
    doc.fontSize(10)
        .text(item, 50, y)
        .text(description, 150, y)
        .text(unitCost, 280, y, { width: 90, align: 'right' })
        .text(quantity, 370, y, { width: 90, align: 'right' })
        .text(lineTotal, 0, y, { align: 'right' });
}

function generateHr(doc, y) {
    doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

module.exports = ReceiptService;
