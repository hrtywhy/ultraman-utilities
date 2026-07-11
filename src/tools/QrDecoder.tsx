import React, { useRef, useState } from 'react';
import jsQR from 'jsqr';
import { useCopy } from '../lib/toast';

function decodeImageElement(img: HTMLImageElement, onResult: (text: string) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  let imageData;
  try {
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    onResult('Could not read image data (likely a cross-origin restriction).');
    return;
  }
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  onResult(code ? code.data : 'No QR code detected in this image.');
}

export function QrDecoder() {
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [out, setOut] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const copy = useCopy();

  const fromFile = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setOut('Choose a file first.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => { setPreview(dataUrl); decodeImageElement(img, setOut); };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const fromUrl = () => {
    if (!url.trim()) { setOut('Paste an image URL first.'); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { setPreview(url); decodeImageElement(img, setOut); };
    img.onerror = () => setOut('Could not load image from that URL.');
    img.src = url;
  };

  const reset = () => {
    if (fileRef.current) fileRef.current.value = '';
    setUrl('');
    setPreview(null);
    setOut('');
  };

  return (
    <>
      <label htmlFor="qrFile">Upload an image</label>
      <input id="qrFile" type="file" accept="image/*" ref={fileRef} style={{ marginBottom: 12 }} />
      <label htmlFor="qrUrl">...or paste an image URL</label>
      <input id="qrUrl" type="text" placeholder="https://example.com/qr.png" value={url} onChange={(e) => setUrl(e.target.value)} />
      <div className="btn-row">
        <button className="primary" onClick={fromFile}>Decode uploaded image</button>
        <button onClick={fromUrl}>Decode from URL</button>
        <button className="small" onClick={reset}>Reset</button>
        <button className="small" onClick={() => copy(out)}>Copy result</button>
      </div>
      {preview && <img id="qrPreview" style={{ display: 'block' }} src={preview} alt="QR preview" />}
      <div className="result-box">{out}</div>
      <div className="hint">Image-URL decoding depends on the host allowing cross-origin image reads; if it fails, download and upload the file instead.</div>
    </>
  );
}
