# chat-e2ee

## Chat Privado Criptografado Ponta a Ponta (E2EE)

Aplicação de chat web em tempo real focada em privacidade e segurança, inspirada no modelo do Signal e WhatsApp. O sistema utiliza criptografia de ponta a ponta (E2EE) no próprio navegador do usuário e isolamento total de contatos, garantindo que o servidor nunca tenha acesso às chaves privadas ou ao conteúdo legível das mensagens.

## Funcionalidades

- Criptografia Ponta a Ponta (E2EE): As mensagens são cifradas e decifradas exclusivamente no cliente (browser) via Web Crypto API nativa.
- Diretório de Contatos Privado: Sem transmissões públicas (broadcast) de usuários online. Ninguém sabe quem está na plataforma a não ser que haja pareamento mútuo através da digitação explícita do nome do contato.
- Indicador de "Digitando...": Sinalização em tempo real quando o contato está escrevendo uma mensagem.
- Confirmação de Leitura (Riscos Azuis): Status de entrega (✓) e confirmação de leitura instantânea (✓✓ azul) ao abrir o chat.
- Suporte a Emojis e GIFs: Seletor integrado de emojis e busca de GIFs via API do Giphy.

## Arquitetura de Segurança
A segurança é construída sobre padrões criptográficos modernos suportados diretamente pelos navegadores:
- Troca de Chaves (ECDH): Cada cliente gera um par de chaves usando o algoritmo ECDH (P-256) ao entrar na aplicação.
- Derivação de Chave Simétrica: Quando dois usuários se conectam, o algoritmo deriva uma chave compartilhada AES-GCM (256-bit) no navegador.
- Cifragem de Mensagens: Toda mensagem de texto ou link de mídia é cifrada usando AES-GCM com um Vetor de Inicialização (IV) aleatório de 12 bytes gerado para cada pacote
- Zero Knowledge Server: O servidor Node.js atua estritamente como um roteador de pacotes (relay). Ele recebe e entrega apenas a chave pública em texto puro e cargas como ciphertext e iv.

## Pré-requisitos
- Node.js (Versão 14 ou superior)
- Navegador Moderno com suporte a Web Crypto API (Chrome, Firefox, Edge, Safari, Brave, Opera)

## Instalação e Execução
- Clone este repositório:
git clone https://github.com/seu-usuario/chat-privado-e2ee.git
cd chat-privado-e2ee.
- Instale as dependências:
npm install
- Inicie o servidor:
npm start
- Acesse a aplicação:
Abra seu navegador em http://localhost:3000

## Como Testar o Chat e a Criptografia
- Abra duas janelas/abas do navegador (uma em modo normal e outra em janela anônima).
- Na primeira aba, digite o nome Alice e clique em Entrar.
- Na segunda aba, digite o nome Bob e clique em Entrar.
- Na aba da Alice, vá no campo "Iniciar Conversa Privada", digite Bob e clique no botão +.
- O pareamento ocorrerá e ambos os usuários aparecerão mutuamente em suas listas de contatos com o status Online.
- Envie mensagens, emojis ou GIFs entre os usuários e observe os indicadores de Digitando... e os riscos azuis de leitura ao visualizar o chat.


