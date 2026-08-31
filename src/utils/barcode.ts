import JsBarcode from 'jsbarcode';

export function generateRandomBarcode(prefix: string = 'OMS'): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${timestamp}${random}`;
}

export function renderBarcodeSvg(svgElement: SVGSVGElement | null, text: string, options?: {
  format?: 'CODE128' | 'EAN13' | 'pharmacode';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  lineColor?: string;
  background?: string;
}) {
  if (!svgElement || !text) return;
  try {
    JsBarcode(svgElement, text, {
      format: options?.format || 'CODE128',
      width: options?.width || 1.8,
      height: options?.height || 45,
      displayValue: options?.displayValue !== undefined ? options?.displayValue : true,
      fontSize: options?.fontSize || 13,
      font: 'JetBrains Mono, monospace',
      lineColor: options?.lineColor || '#0f172a',
      background: options?.background || 'transparent',
      margin: 4,
    });
  } catch (err) {
    console.error('Failed to render barcode for text:', text, err);
  }
}
