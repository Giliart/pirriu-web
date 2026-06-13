import { Header } from "@/components/Header";
import { ShieldCheck, Database, MapPin, Trash2 } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade | PIRRIU",
  description: "Política de Privacidade do aplicativo PIRRIU.",
};

export default function PrivacidadePage() {
  return (
    <div className="pw-page">
      <Header />

      <main className="pw-legal-main">
        <div className="pw-container">
          <section className="pw-legal-hero">
            <p className="pw-legal-kicker">PIRRIU</p>
            <h1 className="pw-legal-title">Política de Privacidade</h1>
            <p className="pw-legal-subtitle">
              Esta política explica como o PIRRIU coleta, utiliza, armazena e protege dados usados para operação de clientes, rondas, cobranças e recibos.
            </p>
          </section>

          <div className="pw-legal-grid">
            <section className="pw-legal-card">
              <h2><ShieldCheck size={22} /> Dados coletados</h2>
              <p>
                O PIRRIU pode coletar dados informados pelo usuário, como nome, e-mail, telefone, foto de perfil, chave Pix, configurações de recibo, clientes cadastrados, endereços, valores de cobrança, status de pagamento, rotas, pontos de ronda e registros operacionais.
              </p>
              <p>
                Também podem ser armazenados dados técnicos necessários para login, segurança, controle de assinatura, notificações e funcionamento do aplicativo.
              </p>
            </section>

            <section className="pw-legal-card">
              <h2><MapPin size={22} /> Localização e mapas</h2>
              <p>
                O aplicativo utiliza localização para recursos de ronda, navegação, mapa de cobrança, cálculo de proximidade, confirmação de pontos e visualização operacional.
              </p>
              <p>
                A localização é usada para executar funções solicitadas dentro do app e melhorar a precisão dos recursos de vigilância e cobrança em mapa.
              </p>
            </section>

            <section className="pw-legal-card">
              <h2><Database size={22} /> Armazenamento e segurança</h2>
              <p>
                Os dados são armazenados em serviços de nuvem utilizados pelo PIRRIU, incluindo autenticação, banco de dados e armazenamento de arquivos. Aplicamos controles de acesso, autenticação e regras por conta para proteger as informações.
              </p>
              <p>
                O usuário deve manter seus dados de acesso protegidos e não compartilhar senha ou acesso da conta com terceiros não autorizados.
              </p>
            </section>

            <section className="pw-legal-card">
              <h2><Trash2 size={22} /> Exclusão de dados</h2>
              <p>
                O usuário pode solicitar suporte, correção ou exclusão de dados pelos canais oficiais do PIRRIU. Algumas informações podem ser preservadas quando forem necessárias para obrigações legais, segurança, prevenção de fraude ou histórico financeiro.
              </p>
              <div className="pw-legal-note">Última atualização: 13/06/2026</div>
            </section>
          </div>
        </div>
      </main>

      <footer className="pw-footer">
        PIRRIU © 2026
        <span className="pw-footer-links">
          <a href="/termos">Termos</a>
          <a href="/suporte">Suporte</a>
        </span>
      </footer>
    </div>
  );
}
