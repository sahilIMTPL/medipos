/**
 * Universal print trigger helper.
 * When targetId is supplied, it isolates that element in a clean off-screen iframe
 * to guarantee zero top/side margin bleed, no modal backdrop displacement,
 * and exact 1:1 fidelity with document stylesheets.
 */
export function triggerPrint(targetId?: string) {
  if (typeof window === "undefined") return;

  if (!targetId) {
    window.print();
    return;
  }

  const targetEl = document.getElementById(targetId);
  if (!targetEl) {
    window.print();
    return;
  }

  try {
    // Remove any leftover print iframes from previous executions
    const existingIframes = document.querySelectorAll("iframe[data-print-frame='true']");
    existingIframes.forEach((f) => f.remove());

    // Create an invisible, isolated iframe
    const iframe = document.createElement("iframe");
    iframe.setAttribute("data-print-frame", "true");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Build fresh HTML shell
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Print Document</title></head><body></body></html>`);
    doc.close();

    // 1. Copy all host stylesheets and <style> tags
    const parentStyles = document.querySelectorAll("link[rel='stylesheet'], style");
    parentStyles.forEach((node) => {
      doc.head.appendChild(node.cloneNode(true));
    });

    // 2. Inject print optimization overrides
    const printStyle = doc.createElement("style");
    printStyle.textContent = `
      @page {
        size: auto;
        margin: 6mm 8mm;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #0f172a !important;
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      }
      .no-print, [data-no-print="true"] {
        display: none !important;
      }
      .print-only-header {
        display: flex !important;
      }
      #${targetId}, .print-target-content {
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        background: #ffffff !important;
      }
      /* Thermal receipt format if applicable */
      .thermal-receipt, [data-format="thermal"] {
        width: 78mm !important;
        max-width: 78mm !important;
        margin: 0 auto !important;
        padding: 2mm !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    `;
    doc.head.appendChild(printStyle);

    // 3. Clone target content
    const clonedTarget = targetEl.cloneNode(true) as HTMLElement;
    // Strip scroll/max-height locks so all pages render fully
    clonedTarget.classList.remove(
      "overflow-y-auto",
      "overflow-x-auto",
      "overflow-hidden",
      "max-h-[94vh]",
      "max-h-screen",
      "p-6",
      "bg-slate-50/50"
    );
    clonedTarget.style.maxHeight = "none";
    clonedTarget.style.height = "auto";
    clonedTarget.style.overflow = "visible";
    doc.body.appendChild(clonedTarget);

    // 4. Ensure external stylesheets finish loading, then trigger print
    const linkTags = Array.from(doc.head.querySelectorAll("link[rel='stylesheet']"));
    const styleWaiters = linkTags.map((link) => {
      return new Promise<void>((resolve) => {
        if ((link as any).sheet) {
          resolve();
          return;
        }
        (link as HTMLLinkElement).onload = () => resolve();
        (link as HTMLLinkElement).onerror = () => resolve();
        setTimeout(resolve, 350); // Fallback timeout
      });
    });

    const cleanup = () => {
      setTimeout(() => {
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    };

    Promise.all(styleWaiters).then(() => {
      // Small tick to allow layout engine to render fonts & SVGs
      setTimeout(() => {
        try {
          const win = iframe.contentWindow;
          if (win) {
            win.focus();
            win.addEventListener("afterprint", cleanup);
            win.print();
            // Fallback cleanup if afterprint doesn't fire
            setTimeout(cleanup, 60000);
          } else {
            window.print();
            cleanup();
          }
        } catch (err) {
          console.warn("Iframe print error, falling back to window.print():", err);
          window.print();
          cleanup();
        }
      }, 120);
    });
  } catch (err) {
    console.warn("Failed to isolate print target in iframe:", err);
    window.print();
  }
}
