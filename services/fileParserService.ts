import * as pdfjsLib from 'pdfjs-dist';

// Set the workerSrc to the same CDN path as in the importmap to ensure the PDF parsing worker is loaded correctly.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

async function parsePdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
    return textContent;
}

function parseTxt(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            resolve(event.target?.result as string);
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsText(file);
    });
}


export async function parseFile(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'pdf':
            return parsePdf(file);
        case 'txt':
            return parseTxt(file);
        default:
            throw new Error('Unsupported file type. Please upload a PDF or TXT file.');
    }
}
