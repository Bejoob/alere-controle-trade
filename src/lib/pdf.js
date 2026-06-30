import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas-pro';

/**
 * Gera um PDF com (opcionalmente) uma captura de um elemento DOM (dashboard/gráficos)
 * seguido de uma ou mais tabelas. tabelas: [{ titulo, colunas: string[], linhas: any[][] }]
 */
export async function gerarPDFRelatorio({
  elemento,
  titulo = 'Relatório Alere - Controle de Trade',
  tabelas = [],
  nomeArquivo = 'relatorio-alere.pdf',
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 32;

  doc.setFontSize(16);
  doc.text(titulo, margin, 40);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, margin, 58);
  doc.setTextColor(0);

  let cursorY = 75;

  if (elemento) {
    const canvas = await html2canvas(elemento, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    doc.addImage(imgData, 'PNG', margin, cursorY, imgWidth, imgHeight);
    cursorY += imgHeight + 24;
  }

  for (const tabela of tabelas) {
    if (cursorY > pageHeight - 120) {
      doc.addPage();
      cursorY = 40;
    }
    doc.setFontSize(12);
    doc.text(tabela.titulo, margin, cursorY);
    cursorY += 8;
    autoTable(doc, {
      startY: cursorY,
      head: [tabela.colunas],
      body: tabela.linhas,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 101, 52] },
      margin: { left: margin, right: margin },
      theme: 'grid',
    });
    cursorY = doc.lastAutoTable.finalY + 24;
  }

  doc.save(nomeArquivo);
}
