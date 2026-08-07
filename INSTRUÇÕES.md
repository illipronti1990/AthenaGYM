# INSTRUÇÕES — ATHENA GYM ERP

Manual de instalação e uso em **outra máquina Windows**.

Há dois caminhos:

| Objetivo | O que fazer |
|----------|-------------|
| **Só usar o sistema** | Abrir o `.xlsm` pronto (sem Python) |
| **Gerar / atualizar o ERP** | Instalar Python + dependências + Excel + regenerar |

---

## 1. Requisitos do computador

- **Windows 10 ou 11** (64 bits recomendado)
- **Microsoft Excel** (desktop: Microsoft 365, Excel 2016, 2019 ou 2021)
  - Excel Online **não** executa macros VBA
- Conta com permissão para instalar programas (ou Python já instalado)
- Pasta do projeto completa (não só o `.xlsm`), se for regenerar

---

## 2. Usar o ERP sem regenerar (mais simples)

1. Copie a pasta do projeto (ou pelo menos o arquivo):
   - `Excel/ATHENA_GYM_ERP_COMERCIAL.xlsm`  
   - ou a cópia na raiz: `ATHENA_GYM_ERP_COMERCIAL.xlsm`
2. Abra o arquivo no Excel.
3. Se aparecer aviso de segurança:
   - clique em **Habilitar Conteúdo** / **Habilitar Macros**
4. Login de demonstração:
   - usuário: `admin`
   - senha: `123456`
5. Outros perfis (demo): `financeiro`, `recepcao`, `professor` (senha: `123456`)

Pronto para operar. Python **não** é necessário neste modo.

---

## 3. Instalar Python (necessário para regenerar o ERP)

### 3.1 Download

1. Acesse: https://www.python.org/downloads/
2. Baixe o **Python 3.11** ou **3.12** (64-bit).  
   Evite versões muito antigas (3.8-) ou pré-releases.

### 3.2 Instalação (importante)

Durante o instalador:

1. Marque a opção **Add python.exe to PATH** (Adicionar Python ao PATH).
2. Clique em **Install Now** (ou Custom e mantenha pip marcado).
3. Ao terminar, feche e **abra um novo** Prompt de Comando / PowerShell / Git Bash.

### 3.3 Conferir

No terminal:

```bat
python --version
pip --version
```

Deve aparecer algo como `Python 3.12.x` e a versão do `pip`.

Se `python` não for reconhecido:

- reinstale marcando **Add to PATH**, ou
- use o atalho **Python** do menu Iniciar → abra o terminal a partir dali, ou
- tente `py --version` (launcher do Windows) e use `py` no lugar de `python`.

---

## 4. Dependências Python do projeto

Na pasta `erp` existe o arquivo `requirements.txt` com:

| Pacote | Função |
|--------|--------|
| **openpyxl** | Monta as abas, tabelas e layout do Excel |
| **pywin32** | Injeta VBA, UserForms e botões via Excel COM |
| **Pillow** | Imagens (logo) no workbook |

### 4.1 Instalar (recomendado)

Abra o terminal **na pasta do projeto** e execute:

```bat
cd "CAMINHO\ATHENA GYM\erp"
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Exemplo de caminho:

```bat
cd "C:\Users\SeuUsuario\Documents\ATHENA GYM\erp"
python -m pip install -r requirements.txt
```

### 4.2 Instalar pacote a pacote (alternativa)

```bat
python -m pip install openpyxl==3.1.5
python -m pip install pywin32==308
python -m pip install Pillow==12.3.0
```

### 4.3 Conferir dependências

```bat
python -c "import openpyxl; import win32com.client; from PIL import Image; print('OK — openpyxl', openpyxl.__version__)"
```

Se imprimir `OK — openpyxl ...`, as bibliotecas estão corretas.

---

## 5. Configurar o Excel para injetar VBA (obrigatório para gerar)

O gerador usa a API do VBA. No Excel:

1. Arquivo → **Opções** → **Central de Confiabilidade** → **Configurações da Central de Confiabilidade**
2. **Configurações de Macro**
3. Marque:
   - **Confiar no acesso ao modelo de objeto do projeto do VBA**  
     *(em inglês: Trust access to the VBA project object model)*
4. Em **Configurações de Macro**, use pelo menos:
   - **Desabilitar todas as macros com notificação** (e habilitar ao abrir), ou
   - **Habilitar todas as macros** (apenas em ambiente controlado)
5. Feche o Excel completamente.

Sem essa opção, o script gera a base `.xlsx` mas **não** consegue criar o `.xlsm` com macros.

---

## 6. Regenerar o ERP

1. Feche **todas** as janelas do Excel (o gerador encerra `EXCEL.EXE` se necessário).
2. No terminal:

```bat
cd "CAMINHO\ATHENA GYM\erp"
python gerar_erp.py
```

3. Ao final, você deve ver algo como:

```text
ERP Fase 3 gerado: ...\ATHENA_GYM_ERP_COMERCIAL.xlsm
Release copiado: ...\Excel\ATHENA_GYM_ERP_COMERCIAL.xlsm
VBA exportado: ...\Export_VBA
```

4. Abra o `.xlsm` gerado, habilite macros e faça login (`admin` / `123456`).

### Onde ficam os arquivos gerados

| Arquivo / pasta | Conteúdo |
|-----------------|----------|
| `ATHENA_GYM_ERP_COMERCIAL.xlsm` (raiz) | ERP gerado |
| `Excel/` | Cópia de release |
| `Export_VBA/` | Módulos VBA exportados |
| `erp/vba/` | Fonte VBA usada no build |

---

## 7. Problemas comuns

### `python` não é reconhecido
- Reinstale o Python com **Add to PATH**.
- Feche e abra o terminal de novo.
- Teste `py -m pip install -r requirements.txt`.

### `No module named 'openpyxl'` / `win32com` / `PIL`
```bat
cd erp
python -m pip install -r requirements.txt
```

### “Sem acesso ao VBA Project”
- Ative **Confiar no acesso ao modelo de objeto do projeto do VBA** (seção 5).
- Feche o Excel e rode `python gerar_erp.py` de novo.

### Excel abre e o script falha / arquivo bloqueado
- Feche o Excel e o OneDrive se o arquivo estiver “em uso”.
- Rode o terminal como usuário normal (não precisa de Admin, em geral).
- Evite gerar com o `.xlsm` aberto.

### Macros desabilitadas ao abrir
- Clique em **Habilitar Conteúdo**.
- Se o arquivo veio da internet/e-mail: propriedades do arquivo → desmarque **Bloquear** (Unblock).

### OneDrive
- Pastas sincronizadas podem travar o `SaveAs`. Se falhar, pause a sincronização ou copie o projeto para `C:\ATHENA_GYM` e gere lá.

---

## 8. Checklist rápido (máquina nova — modo desenvolvedor)

- [ ] Windows + Excel desktop instalados
- [ ] Python 3.11+ instalado com PATH
- `python --version` e `pip --version` OK
- [ ] `cd erp` → `python -m pip install -r requirements.txt`
- [ ] Teste: `python -c "import openpyxl, win32com.client; from PIL import Image; print('OK')"`
- [ ] Excel: confiança no modelo de objeto VBA
- [ ] Excel fechado → `python gerar_erp.py`
- [ ] Abrir `.xlsm` → Habilitar macros → login `admin` / `123456`

---

## 9. Contatos / estrutura do projeto

```text
ATHENA GYM/
├── INSTRUÇÕES.md              ← este manual
├── ATHENA_GYM_ERP_COMERCIAL.xlsm
├── Excel/                     ← release
├── Documentacao/              ← arquitetura e changelog
├── Export_VBA/                ← VBA exportado
└── erp/
    ├── requirements.txt       ← dependências Python
    ├── gerar_erp.py           ← gerador
    └── vba/                   ← código VBA fonte
```

Versão do sistema: consulte a aba oculta `VERSAO` ou `Documentacao/Changelog.md`.
