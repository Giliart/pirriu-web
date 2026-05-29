import { Download, QrCode, Smartphone } from "lucide-react";

export function StoreBadge({ store }: { store: "App Store" | "Google Play" }) {
  const isApple = store === "App Store";

  return (
    <div className="pw-store-badge">
      <div className="pw-store-left">
        {isApple ? <Download size={30} /> : <Smartphone size={30} />}
        <div>
          <span className="pw-store-small">Baixar na</span>
          <span className="pw-store-name">{store}</span>
        </div>
      </div>

      <div className="pw-qr">
        <QrCode size={52} />
      </div>
    </div>
  );
}
