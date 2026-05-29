import Image from "next/image";

export function Logo({ large = false, text = true }: { large?: boolean; text?: boolean }) {
  const size = large ? 158 : 54;

  return (
    <div className="pw-logo">
      <Image
        src="/login-hero.png"
        alt="Logo PIRRIU"
        width={size}
        height={size}
        className={large ? "pw-logo-img pw-logo-img--large" : "pw-logo-img pw-logo-img--small"}
        priority={large}
      />

      {text && (
        <div>
          <div className="pw-logo-title">PIRRIU</div>
          <div className="pw-logo-subtitle">Portal Web</div>
        </div>
      )}
    </div>
  );
}
