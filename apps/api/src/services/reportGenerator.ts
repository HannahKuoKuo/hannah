import PDFDocument from 'pdfkit';

export async function generatePDFReport(report: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument();

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('Marketing Report', 50, 50);
    doc.fontSize(12).font('Helvetica').text(`Period: ${report.period}`, 50, 100);
    doc.moveDown(2);

    const data = JSON.parse(report.data);

    // EDM Section
    doc.fontSize(16).font('Helvetica-Bold').text('Email Marketing (EDM)', 50, 150);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Total Campaigns Sent: ${data.edm.campaigns_sent}`, 50, 180);
    doc.text(`Total Recipients: ${data.edm.total_recipients}`, 50, 200);
    doc.text(`Average Open Rate: ${data.edm.avg_open_rate}%`, 50, 220);
    doc.text(`Average Click Rate: ${data.edm.avg_click_rate}%`, 50, 240);
    doc.moveDown(3);

    // Meta Section
    doc.fontSize(16).font('Helvetica-Bold').text('Social Media (Meta)', 50, 300);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Total Posts: ${data.meta.total_posts}`, 50, 330);
    doc.text(`Total Engagement: ${data.meta.total_engagement}`, 50, 350);
    doc.text(`Average Likes: ${data.meta.avg_likes}`, 50, 370);
    doc.text(`Average Comments: ${data.meta.avg_comments}`, 50, 390);
    doc.moveDown(3);

    // Ads Section
    doc.fontSize(16).font('Helvetica-Bold').text('Advertising', 50, 450);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Active Campaigns: ${data.ads.active_campaigns}`, 50, 480);
    doc.text(`Total Spend: $${data.ads.total_spend}`, 50, 500);
    doc.text(`Total Impressions: ${data.ads.total_impressions}`, 50, 520);
    doc.text(`Total Conversions: ${data.ads.total_conversions}`, 50, 540);
    doc.text(`Average ROI: ${data.ads.avg_roi}x`, 50, 560);

    doc.end();
  });
}

export async function generateCSVReport(report: any): Promise<string> {
  const data = JSON.parse(report.data);

  const csv = `Marketing Report - ${report.period}
"EDM Metrics"
"Campaigns Sent","${data.edm.campaigns_sent}"
"Total Recipients","${data.edm.total_recipients}"
"Average Open Rate","${data.edm.avg_open_rate}%"
"Average Click Rate","${data.edm.avg_click_rate}%"

"Meta Metrics"
"Total Posts","${data.meta.total_posts}"
"Total Engagement","${data.meta.total_engagement}"
"Average Likes","${data.meta.avg_likes}"
"Average Comments","${data.meta.avg_comments}"

"Advertising Metrics"
"Active Campaigns","${data.ads.active_campaigns}"
"Total Spend","$${data.ads.total_spend}"
"Total Impressions","${data.ads.total_impressions}"
"Total Conversions","${data.ads.total_conversions}"
"Average ROI","${data.ads.avg_roi}x"`;

  return csv;
}
