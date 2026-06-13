import { Header } from "@/components/Header";
import { CreditCard, FileText, ShieldAlert, UserCheck } from "lucide-react";

export const metadata = {
  title: "Termos de Uso | PIRRIU",
  description: "Termos de Uso do aplicativo PIRRIU.",
};

export default function TermosPage() {
  return (
    <div className="pw-page">
      <Header />

      <main className="pw-legal-main">
        <div className="pw-container">
          <section className="pw-legal-hero">
            <p className="pw-legal-kicker">PIRRIU</p>
            <h1 className="pw-legal-title">Termos de Uso</h1>
            <p className="pw-legal-subtitle">
              Ao utilizar o PIRRIU, você concorda com as regras de uso, responsabilidades e condições de acesso aos recursos do aplicativo e portal.
            </p>
          </section>

          <div className="pw-legal-grid">
            <section className="pw-legal-card">
              <h2><UserCheck size={22} /> Uso do serviço</h2>
              <p>
                O PIRRIU é uma plataforma de apoio à gestão operacional de vigilância, clientes, cobranças, recibos, rondas, membros e relatórios. O usuário é responsável pela veracidade dos dados cadastrados e pelo uso correto das informações.
              </p>
              <p>
                É proibido utilizar o sistema para fins ilegais, abusivos, fraudulentos ou que violem direitos de terceiros.
              </p>
            </section>

            <section className="pw-legal-card">
              <h2><CreditCard size={22} /> Planos e assinatura</h2>
              <p>
                O acesso a limites e recursos pode variar conforme o plano contratado. Mudanças de plano podem impactar quantidade de clientes, rondas e membros disponíveis.
              </p>
              <p>
                Pagamentos, cancelamentos, upgrades e downgrades seguem as regras apresentadas no portal de assinatura e no provedor de pagamento utilizado.
              </p>
            </section>

            <section className="pw-legal-card">
              <h2><ShieldAlert size={22} /> Disponibilidade e responsabilidade</h2>
              <p>
                O PIRRIU busca manter o serviço estável, mas pode haver indisponibilidades causadas por internet, GPS, serviços de mapas, sistemas de pagamento, servidores externos, manutenção ou atualizações.
              </p>
              <p>
                O aplicativo é uma ferramenta de apoio à gestão e não substitui protocolos internos, responsabilidade operacional, supervisão humana ou medidas formais de segurança.
              </p>
            </section>

            <section className="pw-legal-card">
              <h2><FileText size={22} /> Alterações</h2>
              <p>
                Estes termos podem ser atualizados para refletir melhorias do serviço, exigências legais, mudanças de tecnologia ou novas funcionalidades.
              </p>
              <div className="pw-legal-note">Última atualização: 13/06/2026</div>
            </section>
          </div>
        </div>
      </main>

      <footer className="pw-footer">
        PIRRIU © 2026
        <span className="pw-footer-links">
          <a href="/privacidade">Privacidade</a>
          <a href="/suporte">Suporte</a>
        </span>
      </footer>
    </div>
  );
}
