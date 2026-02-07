import React, { useEffect, useRef, useState } from "react";

type QRScannerProps = {
  onDecode: (text: string) => void;
  onClose?: () => void;
};

const QRScanner: React.FC<QRScannerProps> = ({ onDecode, onClose }) => {
  const elRef = useRef<HTMLDivElement | null>(null);
  const html5Ref = useRef<any>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted) return;
        const elementId = "qr-scanner-element";
        const config = { fps: 10, qrbox: 250 };
        const constraints = { facingMode: "environment" } as any;
        const scanner = new Html5Qrcode(elementId);
        html5Ref.current = scanner;

        const startScanner = async () => {
          try {
            // prefer enumerating cameras and pick a back-facing camera when available
            let cameraArg: any = constraints;
            try {
              const cams = await (Html5Qrcode as any).getCameras();
              if (cams && cams.length) {
                const back = cams.find((c: any) => /back|rear|environment/i.test(c.label));
                cameraArg = back ? back.id : cams[0].id;
              }
            } catch (e) {
              // ignore camera list errors and fall back to constraints
            }

            await scanner.start(cameraArg, config, async (decoded) => {
              try {
                // stop to avoid duplicate rapid decodes
                await scanner.stop();
              } catch {}
              onDecode(decoded);
              // resume after short delay if still mounted
              setTimeout(async () => {
                if (!mounted) return;
                try {
                  // try to restart using the same cameraArg
                  await scanner.start(cameraArg, config, async (d) => {
                    try { await scanner.stop(); } catch {}
                    onDecode(d);
                  });
                } catch (e) {
                  // ignore restart errors
                }
              }, 1200);
            });
          } catch (e: any) {
            console.error("QR start error", e);
            setError(String(e?.message || e));
          }
        };

        startScanner();
      } catch (e: any) {
        console.error("QR import error", e);
        setError(String(e?.message || e));
      }
    })();

    return () => {
      mounted = false;
      if (html5Ref.current) html5Ref.current.stop().catch(() => {});
    };
  }, [onDecode]);

  return (
    <div className="p-4">
      {error ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive">Scanner error: {error}</p>
          <div className="flex justify-end">
            <button className="btn-primary" onClick={onClose}>Close</button>
          </div>
        </div>
      ) : (
        <>
          <div id="qr-scanner-element" style={{ width: "100%" }} ref={elRef} />
          <div className="mt-3 flex justify-end">
            <button className="btn-primary" onClick={onClose}>Close</button>
          </div>
        </>
      )}
    </div>
  );
};

export default QRScanner;
