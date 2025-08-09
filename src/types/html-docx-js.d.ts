declare module 'html-docx-js/dist/html-docx' {
  export function asBlob(htmlContent: string): Blob;
  export function asArrayBuffer(htmlContent: string): ArrayBuffer;
}
