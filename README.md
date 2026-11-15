# LXR PORTAL — projeto local

## Abrir e editar
1. Extraia a pasta `lxr-portal-local` para um local no computador.
2. Abra o Visual Studio Code.
3. Vá em **Arquivo > Abrir Pasta** e escolha `lxr-portal-local`.
4. Instale a extensão **Live Server** (Ritwick Dey).
5. Clique com o botão direito em `index.html` e escolha **Open with Live Server**.
6. O site abrirá no navegador. Ao salvar `index.html`, `styles.css` ou `app.js` (`Ctrl+S`), o navegador atualizará automaticamente.

## O que editar
- `index.html`: estrutura, títulos, campos e textos.
- `styles.css`: cores, fontes, tamanhos, alinhamento e aparência.
- `app.js`: ações dos botões, navegação entre telas e comportamentos.

## Colocar sua logo
1. Copie a imagem para `assets/logo.png`.
2. Abra `index.html`.
3. Dentro de `.brand-area`, descomente a linha `<img class="logo" src="assets/logo.png" alt="LXR PORTAL">`.
4. Remova ou comente os elementos `.brand-mark` e `.brand-name` se quiser mostrar somente a imagem.

## Importante
Esta é uma prévia local de interface. O formulário não valida contas, não salva cadastro e não transmite nem armazena senhas. Não use dados reais de clientes nesta demonstração. Antes de publicar, conectaremos autenticação segura, banco de dados, recuperação de senha e uma área administrativa protegida.

## Se não quiser instalar Live Server
Com Python instalado, abra o terminal do VS Code na pasta do projeto e execute:
`python -m http.server 5500`

Depois acesse `http://localhost:5500`.