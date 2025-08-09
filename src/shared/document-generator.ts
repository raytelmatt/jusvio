// Document generation utilities for the browser
export interface DocumentGenerationOptions {
  template: {
    body: string;
    variables: string[];
    output_type: 'docx' | 'pdf';
  };
  variables: Record<string, string>;
  title: string;
}

export async function generateDocumentContent(options: DocumentGenerationOptions): Promise<{
  content: string;
  blob: Blob;
  filename: string;
}> {
  const { template, variables, title } = options;
  
  try {
    // Replace variables in template body
    let content = template.body;
    Object.entries(variables).forEach(([variable, value]) => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      content = content.replace(regex, value || '');
    });

    // Generate filename with better sanitization
    const timestamp = new Date().toISOString().split('T')[0];
    const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
    const filename = `${cleanTitle}_${timestamp}.${template.output_type}`;

    let blob: Blob;

    if (template.output_type === 'pdf') {
      // Generate PDF using jsPDF with error handling
      try {
        const jsPDFModule = await import('jspdf');
        const jsPDF = jsPDFModule.jsPDF || (jsPDFModule as any).default;
        
        if (!jsPDF) {
          throw new Error('jsPDF not available');
        }

        const doc = new jsPDF();
        
        // Add title with proper positioning
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 20, 30, { maxWidth: 170 });
        
        // Add content with proper formatting
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        // Split content into lines and handle long text
        const contentLines = content.split('\n');
        let yPosition = 50;
        const lineHeight = 7;
        const pageHeight = 280; // A4 page height minus margins
        
        contentLines.forEach((line) => {
          if (yPosition > pageHeight) {
            doc.addPage();
            yPosition = 30;
          }
          
          if (line.trim()) {
            const wrappedLines = doc.splitTextToSize(line, 170);
            wrappedLines.forEach((wrappedLine: string) => {
              if (yPosition > pageHeight) {
                doc.addPage();
                yPosition = 30;
              }
              doc.text(wrappedLine, 20, yPosition);
              yPosition += lineHeight;
            });
          } else {
            yPosition += lineHeight; // Empty line spacing
          }
        });
        
        // Get PDF as blob
        blob = doc.output('blob');
        
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        throw new Error(`PDF generation failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
      }
    } else {
      // Generate DOCX using docx library with error handling
      try {
        const docxModule = await import('docx');
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docxModule;
        
        if (!Document || !Packer || !Paragraph || !TextRun) {
          throw new Error('DOCX library components not available');
        }

        // Create document paragraphs
        const paragraphs = [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: "", // Empty line
          }),
        ];

        // Split content into paragraphs and add them
        const contentLines = content.split('\n');
        contentLines.forEach(line => {
          paragraphs.push(new Paragraph({
            children: [new TextRun({
              text: line || " ", // Use space for empty lines
              size: 24, // 12pt font
            })],
          }));
        });

        // Create the document with proper configuration
        const doc = new Document({
          sections: [
            {
              properties: {},
              children: paragraphs,
            },
          ],
        });

        // Generate the DOCX blob with browser-compatible method
        blob = await Packer.toBlob(doc);
        
      } catch (docxError) {
        console.error('DOCX generation error:', docxError);
        throw new Error(`DOCX generation failed: ${docxError instanceof Error ? docxError.message : 'Unknown error'}`);
      }
    }

    return {
      content,
      blob,
      filename
    };
    
  } catch (error) {
    console.error('Document generation error:', error);
    throw new Error(`Document generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function downloadDocument(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
