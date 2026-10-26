"use client";

export default function PrintReceiptButton() {
  return (
    <button className="receipt-print-button" type="button" onClick={() => window.print()}>
      In / Tải biên lai PDF
    </button>
  );
}
