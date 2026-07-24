"""
Gera o ERP ATHENAS GYM — Fase 3 (Login Real).

Uso:
    python gerar_erp.py
"""

from __future__ import annotations

import shutil
import time
from pathlib import Path

from openpyxl import Workbook

from sheets import build_all_sheets

ROOT = Path(__file__).resolve().parent.parent
ERP_DIR = Path(__file__).resolve().parent
VBA_DIR = ERP_DIR / "vba"
XLSX_PATH = ROOT / "ATHENAS_GYM_ERP.xlsx"
XLSM_PATH = ROOT / "ATHENAS_GYM_ERP_COMERCIAL.xlsm"
EXCEL_DIR = ROOT / "Excel"
EXPORT_VBA_DIR = ROOT / "Export_VBA"

GOLD_BGR = 0x37AFD4
RED_BGR = 0x1E00A3
RED_DARK_BGR = 0x0F004A
WHITE_BGR = 0xFFFFFF
BLACK_BGR = 0x000000

BTN_H = 30
BTN_GAP = 10
MENU_BTN_H = 30  # altura fixa legível (não amarrar à altura da linha)
MENU_STEP = 36   # espaçamento vertical entre itens

# caption, key, macro, shape_name — textos curtos para caber na coluna A
MENU = [
    ("🏠 Home", "Home", "IrHome", "mnuHome"),
    ("🏢 Master", "Dashboard", "IrMaster", "mnuMaster"),
    ("🌐 Franquia", "Dashboard", "IrFranqueadora", "mnuFranquia"),
    ("🏛 Unidades", "Dashboard", "IrUnidades", "mnuUnidades"),
    ("🤖 Athena", "Dashboard", "IrAthenaAI", "mnuAthena"),
    ("📈 BI", "Dashboard", "IrBIExecutivo", "mnuBI"),
    ("📊 Dashboard", "Dashboard", "IrDashboard", "mnuDashboard"),
    ("📱 Portal", "Alunos", "IrPortalAluno", "mnuPortal"),
    ("☁ Sync", "Alunos", "IrPortalOps", "mnuPortalOps"),
    ("🚪 Acesso", "Acesso", "IrAcesso", "mnuAcesso"),
    ("🛒 PDV", "Estoque", "IrPDV", "mnuPDV"),
    ("👥 CRM", "CRM", "IrCRM", "mnuCRM"),
    ("👤 Alunos", "Alunos", "IrFormAluno", "mnuAlunos"),
    ("📏 Avaliação", "Avaliacao", "IrAvaliacao", "mnuAvaliacao"),
    ("🏋 Treinos", "Treinos", "IrTreinos", "mnuTreinos"),
    ("💳 Mensalidades", "Mensalidades", "IrMensalidades", "mnuMensalidades"),
    ("💰 Financeiro", "Financeiro", "IrFinanceiro", "mnuFinanceiro"),
    ("📦 Estoque", "Estoque", "IrEstoque", "mnuEstoque"),
    ("📊 Relatórios", "Relatorios", "IrRelatorios", "mnuRelatorios"),
    ("⚙ Config", "Configuracoes", "IrConfig", "mnuConfig"),
]

APP_SHEETS = [
    ("21_HOME", "Home"),
    ("01_DASHBOARD", "Dashboard"),
    ("31_BI_EXECUTIVO", "Dashboard"),
    ("32_INSIGHTS", "Dashboard"),
    ("33_PORTAL_ALUNO", "Alunos"),
    ("34_PORTAL_PROF", "Treinos"),
    ("35_PORTAL_OPS", "Alunos"),
    ("36_ATHENA_AI", "Dashboard"),
    ("37_RECOMENDACOES", "Dashboard"),
    ("38_MASTER", "Dashboard"),
    ("39_NOVA_ACADEMIA", "Dashboard"),
    ("40_UNIDADES", "Dashboard"),
    ("41_FRANQUEADORA", "Dashboard"),
    ("26_ACESSO", "Acesso"),
    ("27_DASH_FREQUENCIA", "Acesso"),
    ("28_PDV", "Estoque"),
    ("29_INVENTARIO", "Estoque"),
    ("30_DASH_PDV", "Estoque"),
    ("22_CRM", "CRM"),
    ("23_DASH_CRM", "CRM"),
    ("24_AVALIACAO", "Avaliacao"),
    ("25_TREINOS", "Treinos"),
    ("FORM_ALUNO", "Alunos"),
    ("16_RELATORIOS", "Relatorios"),
    ("13_DASH_FINANCEIRO", "Financeiro"),
    ("14_DASH_COMERCIAL", "Alunos"),
    ("17_DASH_PROFESSORES", "Treinos"),
    ("18_DASH_ESTOQUE", "Estoque"),
    ("19_DASH_EQUIPAMENTOS", "Estoque"),
    ("20_AGENDA", "Dashboard"),
]

DATA_SHEETS = [
    "03_MENSALIDADES",
    "04_FINANCEIRO",
    "09_ESTOQUE",
    "08_PROFESSORES",
    "15_CONFIG",
    "02_ALUNOS",
]

# Sprint 3.3 — ordem por dependência (camadas)
VBA_MODULES = [
    "modUtil.bas",
    "modValidacao.bas",
    "modSessao.bas",
    "modBanco.bas",
    "modLog.bas",
    "modConfiguracao.bas",
    "modSistema.bas",
    "modLogin.bas",
    "modMensalidade.bas",
    "modFinanceiro.bas",
    "modBI.bas",
    "modAgenda.bas",
    "modPainel.bas",
    "modCRM.bas",
    "modAvaliacao.bas",
    "modTreinos.bas",
    "modAcesso.bas",
    "modIntegracoes.bas",
    "modEstoque.bas",
    "modPDV.bas",
    "modBIAnalytics.bas",
    "modPortal.bas",
    "modAthenaAI.bas",
    "modEmpresa.bas",
    "modUnidades.bas",
    "modFranquias.bas",
    "modDashboard.bas",
    "modRelatorio.bas",
    "modAluno.bas",
]


def build_workbook() -> Path:
    wb = Workbook()
    default = wb.active
    wb.remove(default)
    build_all_sheets(wb)
    wb.save(XLSX_PATH)
    print(f"Base gerada: {XLSX_PATH}")
    print(f"Abas: {', '.join(wb.sheetnames)}")
    return XLSX_PATH


def _strip_bas_header(code: str) -> str:
    lines = code.splitlines()
    if lines and lines[0].startswith("Attribute VB_Name"):
        lines = lines[1:]
    return "\n".join(lines)


def _style_shape(shp, fill_bgr: int, font_bgr: int = BLACK_BGR, size: float = 11, bold: bool = True) -> None:
    shp.Fill.Visible = True
    shp.Fill.Solid()
    shp.Fill.ForeColor.RGB = fill_bgr
    shp.Line.Visible = True
    shp.Line.ForeColor.RGB = GOLD_BGR
    shp.Line.Weight = 1.25
    shp.TextFrame.HorizontalAlignment = -4108
    shp.TextFrame.VerticalAlignment = -4107
    font = shp.TextFrame.Characters().Font
    font.Color = font_bgr
    font.Size = size
    font.Bold = bold
    font.Name = "Calibri"


def _col_box(sheet, col: str) -> tuple[float, float]:
    """Retorna (Left, Width) da coluna — limites reais do Excel."""
    rng = sheet.Range(f"{col}1")
    return float(rng.Left), float(rng.Width)


def _range_box(sheet, addr: str) -> tuple[float, float, float, float]:
    """Left, Top, Width, Height da célula/intervalo."""
    rng = sheet.Range(addr)
    return float(rng.Left), float(rng.Top), float(rng.Width), float(rng.Height)


def _add_round_button(
    sheet,
    caption: str,
    macro: str,
    left: float,
    top: float,
    width: float,
    height: float = BTN_H,
    gold: bool = True,
    name: str | None = None,
    font_size: float = 11,
) -> None:
    # Nunca desenhar com largura negativa/zero
    width = max(36.0, width)
    shp = sheet.Shapes.AddShape(5, left, top, width, height)
    shp.TextFrame.Characters().Text = caption
    shp.OnAction = macro
    # xlMove: acompanha a rolagem, mas NÃO encolhe com a linha
    try:
        shp.Placement = 2  # xlMove
    except Exception:
        pass
    if name:
        try:
            shp.Name = name
        except Exception:
            pass
    if gold:
        _style_shape(shp, GOLD_BGR, BLACK_BGR, font_size, True)
    else:
        _style_shape(shp, RED_BGR, WHITE_BGR, font_size, True)
    try:
        shp.Adjustments.Item[1] = 0.18
    except Exception:
        pass
    try:
        shp.TextFrame.MarginLeft = 4
        shp.TextFrame.MarginRight = 4
    except Exception:
        pass


def _add_button_row_in_cols(
    sheet,
    buttons: list[tuple],
    start_col: str,
    end_col: str,
    top: float,
) -> None:
    """Distribui N botões igualmente entre start_col e end_col (sem invadir fora)."""
    left0, _ = _col_box(sheet, start_col)
    end_left, end_w = _col_box(sheet, end_col)
    right = end_left + end_w
    n = len(buttons)
    if n == 0:
        return
    gap = BTN_GAP
    total_gap = gap * (n - 1)
    btn_w = max(56.0, (right - left0 - total_gap) / n)
    for i, item in enumerate(buttons):
        caption, macro, gold = item[0], item[1], item[2]
        name = item[3] if len(item) > 3 else None
        left = left0 + i * (btn_w + gap)
        # Clamp: não ultrapassar a borda direita do intervalo
        if left + btn_w > right + 0.5:
            btn_w = max(40.0, right - left)
        _add_round_button(sheet, caption, macro, left, top, btn_w, BTN_H, gold, name, 10)


def _add_menu_shapes(sheet, active_key: str = "Dashboard") -> None:
    """Menu na coluna A — altura fixa (não comprimir com a linha)."""
    pad = 3.0
    left_a, width_a = _col_box(sheet, "A")
    left = left_a + pad
    width = max(50.0, width_a - 2 * pad)

    _, top0, _, _ = _range_box(sheet, "A6")

    for i, (caption, key, macro, shp_name) in enumerate(MENU):
        top = top0 + i * MENU_STEP
        shp = sheet.Shapes.AddShape(5, left, top, width, MENU_BTN_H)
        shp.TextFrame.Characters().Text = caption
        shp.OnAction = macro
        try:
            shp.Placement = 2  # xlMove — não encolhe
            shp.Name = shp_name
        except Exception:
            pass
        if key == active_key:
            _style_shape(shp, GOLD_BGR, BLACK_BGR, 11, True)
        else:
            _style_shape(shp, RED_DARK_BGR, WHITE_BGR, 11, True)
            shp.Line.ForeColor.RGB = GOLD_BGR
        try:
            shp.Adjustments.Item[1] = 0.15
            shp.TextFrame.MarginLeft = 4
            shp.TextFrame.MarginRight = 4
            shp.TextFrame.MarginTop = 2
            shp.TextFrame.MarginBottom = 2
        except Exception:
            pass

    # Sair abaixo do último item (espaço fixo)
    top_sair = top0 + len(MENU) * MENU_STEP + 10
    _add_round_button(
        sheet, "🚪 Sair", "SairSistema", left, top_sair, width, MENU_BTN_H, False, "mnuSair", 11
    )


def _add_data_nav(sheet) -> None:
    """Atalho Menu contido na coluna I (não invade J)."""
    try:
        left, width = _col_box(sheet, "I")
        _, top, _, _ = _range_box(sheet, "I1")
        pad = 2.0
        _add_round_button(
            sheet,
            "🏠 Menu",
            "IrHome",
            left + pad,
            top + 2,
            max(50.0, width - 2 * pad),
            22,
            True,
            "mnuDataHome",
            9,
        )
    except Exception:
        pass


def _inject_standard_module(vbproj, path: Path) -> None:
    name = path.stem
    try:
        vbproj.VBComponents.Remove(vbproj.VBComponents(name))
    except Exception:
        pass
    code = _strip_bas_header(path.read_text(encoding="utf-8"))
    mod = vbproj.VBComponents.Add(1)  # vbext_ct_StdModule
    mod.Name = name
    mod.CodeModule.AddFromString(code)


def _find_thisworkbook(vbproj):
    try:
        return vbproj.VBComponents("ThisWorkbook")
    except Exception:
        pass
    for i in range(1, vbproj.VBComponents.Count + 1):
        comp = vbproj.VBComponents.Item(i)
        # 100 = vbext_ct_Document
        if int(comp.Type) == 100 and "workbook" in comp.Name.lower():
            return comp
    for i in range(1, vbproj.VBComponents.Count + 1):
        comp = vbproj.VBComponents.Item(i)
        if int(comp.Type) == 100:
            return comp
    raise RuntimeError("ThisWorkbook não encontrado no VBAProject")


def _inject_thisworkbook(vbproj) -> None:
    code = (VBA_DIR / "ThisWorkbook_Code.txt").read_text(encoding="utf-8")
    tw = _find_thisworkbook(vbproj)
    cm = tw.CodeModule
    if cm.CountOfLines > 0:
        cm.DeleteLines(1, cm.CountOfLines)
    cm.AddFromString(code)


def _inject_sheet_code(wb, vbproj, sheet_name: str, code_file: str) -> None:
    """Injeta código no módulo da planilha (ex.: Worksheet_Change)."""
    ws = wb.Sheets(sheet_name)
    code_name = ws.CodeName
    comp = vbproj.VBComponents(code_name)
    code = (VBA_DIR / code_file).read_text(encoding="utf-8")
    cm = comp.CodeModule
    if cm.CountOfLines > 0:
        existing = cm.Lines(1, cm.CountOfLines)
        if "Option Explicit" in existing:
            code = code.replace("Option Explicit\n\n", "").replace("Option Explicit\n", "")
        cm.DeleteLines(1, cm.CountOfLines)
    cm.AddFromString(code)


def _create_frm_aluno(vbproj) -> None:
    """UserForm frmAluno — Sprint 3.4 (sem lógica de negócio no form)."""
    try:
        vbproj.VBComponents.Remove(vbproj.VBComponents("frmAluno"))
    except Exception:
        pass

    form = vbproj.VBComponents.Add(3)
    form.Name = "frmAluno"
    form.Properties("Caption").Value = "ATHENAS GYM — Cadastro de Aluno"
    form.Properties("Width").Value = 420
    form.Properties("Height").Value = 520

    d = form.Designer

    def add(prog_id: str, name: str, left, top, width, height):
        ctl = d.Controls.Add(prog_id)
        ctl.Name = name
        ctl.Left = left
        ctl.Top = top
        ctl.Width = width
        ctl.Height = height
        return ctl

    def lbl(name, caption, left, top, width=100):
        c = add("Forms.Label.1", name, left, top, width, 14)
        c.Caption = caption
        return c

    def txt(name, left, top, width=180):
        return add("Forms.TextBox.1", name, left, top, width, 20)

    def cmb(name, left, top, width=180):
        return add("Forms.ComboBox.1", name, left, top, width, 20)

    y = 10
    tit = add("Forms.Label.1", "lblTitulo", 12, y, 380, 18)
    tit.Caption = "Cadastro Inteligente de Aluno"
    try:
        tit.Font.Bold = True
        tit.Font.Size = 11
    except Exception:
        pass
    y = 32
    lbl("lblMatLabel", "Matrícula:", 12, y, 70)
    lm = add("Forms.Label.1", "lblMatricula", 80, y, 200, 14)
    lm.Caption = "(matrícula auto)"

    y = 52
    # Coluna esquerda
    fields_l = [
        ("lblNome", "Nome *", "txtNome", False),
        ("lblCPF", "CPF *", "txtCPF", False),
        ("lblPlano", "Plano *", "cmbPlano", True),
        ("lblProfessor", "Professor", "txtProfessor", False),
        ("lblValor", "Valor *", "txtValor", False),
        ("lblForma", "Forma Pag. *", "cmbForma", True),
        ("lblDiaVenc", "Dia Venc. *", "txtDiaVenc", False),
        ("lblRG", "RG", "txtRG", False),
    ]
    # Coluna direita
    fields_r = [
        ("lblSexo", "Sexo", "cmbSexo", True),
        ("lblNasc", "Nascimento", "txtNascimento", False),
        ("lblTel", "Telefone *", "txtTelefone", False),
        ("lblEmail", "E-mail", "txtEmail", False),
        ("lblCEP", "CEP", "txtCEP", False),
        ("lblEnd", "Endereço", "txtEndereco", False),
        ("lblNum", "Número", "txtNumero", False),
        ("lblBairro", "Bairro", "txtBairro", False),
    ]

    yl, yr = y, y
    for lab_name, lab_cap, ctl_name, is_cmb in fields_l:
        lbl(lab_name, lab_cap, 12, yl, 90)
        if is_cmb:
            cmb(ctl_name, 12, yl + 14, 180)
        else:
            txt(ctl_name, 12, yl + 14, 180)
        yl += 38

    for lab_name, lab_cap, ctl_name, is_cmb in fields_r:
        lbl(lab_name, lab_cap, 210, yr, 90)
        if is_cmb:
            cmb(ctl_name, 210, yr + 14, 180)
        else:
            txt(ctl_name, 210, yr + 14, 180)
        yr += 38

    y = max(yl, yr) + 4
    lbl("lblCidadeL", "Cidade", 12, y, 90)
    txt("txtCidade", 12, y + 14, 180)

    y = y + 40
    st = add("Forms.Label.1", "lblStatus", 12, y, 380, 28)
    st.Caption = ""
    try:
        st.ForeColor = RED_BGR
    except Exception:
        pass

    y += 34
    b1 = add("Forms.CommandButton.1", "btnSalvar", 12, y, 100, 28)
    b1.Caption = "Salvar"
    try:
        b1.Default = True
    except Exception:
        pass
    b2 = add("Forms.CommandButton.1", "btnNovo", 122, y, 100, 28)
    b2.Caption = "Novo"
    b3 = add("Forms.CommandButton.1", "btnCancelar", 232, y, 100, 28)
    b3.Caption = "Fechar"
    try:
        b3.Cancel = True
    except Exception:
        pass

    code = (VBA_DIR / "frmAluno_Code.txt").read_text(encoding="utf-8")
    cm = form.CodeModule
    if cm.CountOfLines > 0:
        existing = cm.Lines(1, cm.CountOfLines)
        if "Option Explicit" in existing:
            code = code.replace("Option Explicit\n\n", "").replace("Option Explicit\n", "")
    cm.AddFromString(code)


def _create_frm_login(vbproj) -> None:
    """Cria UserForm frmLogin via designer COM."""
    try:
        vbproj.VBComponents.Remove(vbproj.VBComponents("frmLogin"))
    except Exception:
        pass

    form = vbproj.VBComponents.Add(3)  # vbext_ct_MSForm
    form.Name = "frmLogin"
    # Dimensões/caption via Properties do componente (Designer.Width falha no pywin32)
    form.Properties("Caption").Value = "ATHENAS GYM — Login"
    form.Properties("Width").Value = 320
    form.Properties("Height").Value = 290

    d = form.Designer

    def add(prog_id: str, name: str, left, top, width, height):
        ctl = d.Controls.Add(prog_id)
        ctl.Name = name
        ctl.Left = left
        ctl.Top = top
        ctl.Width = width
        ctl.Height = height
        return ctl

    lbl = add("Forms.Label.1", "lblTitulo", 18, 12, 280, 24)
    lbl.Caption = "ATHENAS GYM — Acesso"
    try:
        lbl.Font.Bold = True
        lbl.Font.Size = 12
    except Exception:
        pass

    add("Forms.Label.1", "lblUsuario", 18, 48, 80, 16).Caption = "Usuário"
    add("Forms.TextBox.1", "txtUsuario", 18, 66, 270, 24)

    add("Forms.Label.1", "lblSenha", 18, 100, 80, 16).Caption = "Senha"
    txt_s = add("Forms.TextBox.1", "txtSenha", 18, 118, 270, 24)
    try:
        txt_s.PasswordChar = "*"
    except Exception:
        pass

    chk = add("Forms.CheckBox.1", "chkMostrarSenha", 18, 148, 160, 18)
    chk.Caption = "Mostrar senha"

    lbl_msg = add("Forms.Label.1", "lblMensagem", 18, 170, 270, 16)
    lbl_msg.Caption = ""
    try:
        lbl_msg.ForeColor = RED_BGR
    except Exception:
        pass

    btn_ok = add("Forms.CommandButton.1", "btnEntrar", 18, 198, 120, 30)
    btn_ok.Caption = "Entrar"
    try:
        btn_ok.Default = True
    except Exception:
        pass

    btn_cancel = add("Forms.CommandButton.1", "btnCancelar", 168, 198, 120, 30)
    btn_cancel.Caption = "Cancelar"
    try:
        btn_cancel.Cancel = True
    except Exception:
        pass

    code = (VBA_DIR / "frmLogin_Code.txt").read_text(encoding="utf-8")
    cm = form.CodeModule
    if cm.CountOfLines > 0:
        existing = cm.Lines(1, cm.CountOfLines)
        if "Option Explicit" in existing:
            code = code.replace("Option Explicit\n\n", "").replace("Option Explicit\n", "")
    cm.AddFromString(code)


def _create_frm_splash(vbproj) -> None:
    """Splash Screen — Sprint 3.5."""
    try:
        vbproj.VBComponents.Remove(vbproj.VBComponents("frmSplash"))
    except Exception:
        pass

    form = vbproj.VBComponents.Add(3)
    form.Name = "frmSplash"
    form.Properties("Caption").Value = "ATHENAS GYM"
    form.Properties("Width").Value = 360
    form.Properties("Height").Value = 260

    d = form.Designer

    def add(prog_id: str, name: str, left, top, width, height):
        ctl = d.Controls.Add(prog_id)
        ctl.Name = name
        ctl.Left = left
        ctl.Top = top
        ctl.Width = width
        ctl.Height = height
        return ctl

    lbl = add("Forms.Label.1", "lblMarca", 20, 28, 320, 28)
    lbl.Caption = "ATHENAS GYM"
    try:
        lbl.Font.Bold = True
        lbl.Font.Size = 18
    except Exception:
        pass

    add("Forms.Label.1", "lblSub", 20, 62, 320, 18).Caption = "ERP 2.0"
    add("Forms.Label.1", "lblStatus", 20, 100, 320, 16).Caption = "Carregando..."
    bar = add("Forms.Label.1", "lblBar", 20, 128, 320, 14)
    bar.Caption = "████████████████████"
    try:
        bar.ForeColor = GOLD_BGR
    except Exception:
        pass
    add("Forms.Label.1", "lblVersao", 20, 160, 320, 16).Caption = "Versão 2.0.0"
    add("Forms.Label.1", "lblCopy", 20, 186, 320, 16).Caption = "© ATHENAS GYM"

    code = (VBA_DIR / "frmSplash_Code.txt").read_text(encoding="utf-8")
    cm = form.CodeModule
    if cm.CountOfLines > 0:
        existing = cm.Lines(1, cm.CountOfLines)
        if "Option Explicit" in existing:
            code = code.replace("Option Explicit\n\n", "").replace("Option Explicit\n", "")
    cm.AddFromString(code)


def _create_frm_receber(vbproj) -> None:
    """UserForm frmReceber — Sprint 4.0."""
    try:
        vbproj.VBComponents.Remove(vbproj.VBComponents("frmReceber"))
    except Exception:
        pass

    form = vbproj.VBComponents.Add(3)
    form.Name = "frmReceber"
    form.Properties("Caption").Value = "ATHENAS GYM — Receber Pagamento"
    form.Properties("Width").Value = 340
    form.Properties("Height").Value = 360

    d = form.Designer

    def add(prog_id: str, name: str, left, top, width, height):
        ctl = d.Controls.Add(prog_id)
        ctl.Name = name
        ctl.Left = left
        ctl.Top = top
        ctl.Width = width
        ctl.Height = height
        return ctl

    tit = add("Forms.Label.1", "lblTitulo", 12, 10, 300, 18)
    tit.Caption = "Recebimento"
    try:
        tit.Font.Bold = True
        tit.Font.Size = 12
    except Exception:
        pass

    add("Forms.Label.1", "lblAlunoL", 12, 36, 80, 14).Caption = "Aluno"
    add("Forms.Label.1", "lblAluno", 100, 36, 210, 14).Caption = ""
    add("Forms.Label.1", "lblCompL", 12, 56, 80, 14).Caption = "Competência"
    add("Forms.Label.1", "lblCompetencia", 100, 56, 210, 14).Caption = ""
    add("Forms.Label.1", "lblDetalhe", 12, 76, 300, 28).Caption = ""

    add("Forms.Label.1", "lblValorL", 12, 110, 100, 14).Caption = "Valor esperado"
    add("Forms.TextBox.1", "txtValor", 12, 126, 140, 22)
    add("Forms.Label.1", "lblDescL", 170, 110, 100, 14).Caption = "Desconto"
    add("Forms.TextBox.1", "txtDesconto", 170, 126, 140, 22)

    add("Forms.Label.1", "lblFormaL", 12, 156, 100, 14).Caption = "Forma"
    add("Forms.ComboBox.1", "cmbForma", 12, 172, 140, 22)
    add("Forms.Label.1", "lblRecL", 170, 156, 120, 14).Caption = "Valor recebido"
    add("Forms.TextBox.1", "txtRecebido", 170, 172, 140, 22)

    add("Forms.Label.1", "lblDataL", 12, 202, 100, 14).Caption = "Data"
    add("Forms.TextBox.1", "txtData", 12, 218, 140, 22)
    add("Forms.Label.1", "lblObsL", 12, 248, 100, 14).Caption = "Observação"
    add("Forms.TextBox.1", "txtObs", 12, 264, 298, 22)

    b1 = add("Forms.CommandButton.1", "btnConfirmar", 12, 300, 140, 28)
    b1.Caption = "Confirmar"
    try:
        b1.Default = True
    except Exception:
        pass
    b2 = add("Forms.CommandButton.1", "btnCancelar", 170, 300, 140, 28)
    b2.Caption = "Cancelar"
    try:
        b2.Cancel = True
    except Exception:
        pass

    code = (VBA_DIR / "frmReceber_Code.txt").read_text(encoding="utf-8")
    cm = form.CodeModule
    if cm.CountOfLines > 0:
        existing = cm.Lines(1, cm.CountOfLines)
        if "Option Explicit" in existing:
            code = code.replace("Option Explicit\n\n", "").replace("Option Explicit\n", "")
    cm.AddFromString(code)


def _add_financeiro_buttons(wb) -> None:
    """Botões do hub 04_FINANCEIRO."""
    ws = wb.Sheets("04_FINANCEIRO")
    left, top, _, _ = _range_box(ws, "A6")
    btns = [
        ("Receber", "AbrirReceber", True),
        ("Estornar", "EstornarContaSelecionada", False),
        ("Cancelar", "CancelarContaSelecionada", False),
        ("Pesquisar", "PesquisarFinanceiro", True),
        ("Despesa", "NovaDespesaRapida", True),
        ("DRE", "GerarDRE", True),
        ("Fluxo", "IrFluxo", True),
        ("Dashboard", "IrDashFinanceiro", True),
        ("PDF", "PdfFinanceiro", True),
        ("Excel", "ExportarFinanceiroExcel", True),
    ]
    x = left
    for caption, macro, gold in btns:
        _add_round_button(ws, caption, macro, x, top, 72, 26, gold, None, 9)
        x += 76


def _hide_bd_sheets(wb) -> None:
    # 2 = xlSheetVeryHidden
    for name in (
        "BD_USUARIOS",
        "BD_SESSAO",
        "BD_ALUNOS",
        "BD_CONTAS_RECEBER",
        "BD_CONTAS_PAGAR",
        "BD_LANCAMENTOS",
        "BD_FLUXO_CAIXA",
        "BD_PARAMETROS",
        "BD_PLANOS",
        "BD_FORMAS_PAGAMENTO",
        "BD_STATUS",
        "BD_PERMISSOES",
        "BD_CORES",
        "BD_METAS",
        "BD_NOTIFICACOES",
        "BD_EVENTOS",
        "BD_PRIORIDADES",
        "BD_LEADS",
        "BD_CRM_HISTORICO",
        "BD_RETENCAO",
        "BD_CAMPANHAS",
        "BD_INDICACOES",
        "BD_AVALIACOES",
        "BD_MEDIDAS",
        "BD_TREINOS",
        "BD_EXERCICIOS",
        "BD_TREINO_ITENS",
        "BD_FOTOS",
        "BD_ACESSOS",
        "BD_PRESENCAS",
        "BD_UNIDADES",
        "BD_PARAMETROS_UNIDADE",
        "BD_PROFESSOR_UNIDADE",
        "BD_TRANSFERENCIAS",
        "BD_USUARIO_UNIDADE",
        "BD_PRODUTOS",
        "BD_FORNECEDORES",
        "BD_COMPRAS",
        "BD_MOVIMENTACAO_ESTOQUE",
        "BD_LOTES",
        "BD_VENDAS",
        "BD_VENDA_ITENS",
        "BD_KITS",
        "BD_KIT_ITENS",
        "BD_INDICADORES",
        "BD_INSIGHTS",
        "BD_PREVISOES",
        "BD_RISCO_RETENCAO",
        "BD_CHAT",
        "BD_METAS_ALUNO",
        "BD_PORTAL_TOKENS",
        "BD_DESAFIOS",
        "BD_PUSH",
        "BD_RECOMENDACOES",
        "BD_ATHENA_CHAT",
        "BD_EMPRESAS",
        "BD_LICENCAS",
        "BD_CONFIG_EMPRESA",
        "BD_FRANQUEADORAS",
        "BD_FRANQUEADOS",
        "BD_CONTRATOS_FRANQUIA",
        "BD_ROYALTIES",
        "BI_BASE",
        "VERSAO",
        "LOG",
    ):
        try:
            wb.Sheets(name).Visible = 2
        except Exception as exc:
            print(f"  hide {name}: {exc}")


def inject_vba_and_ui(xlsx_path: Path, xlsm_path: Path) -> bool:
    try:
        import win32com.client  # type: ignore
    except ImportError:
        print("pywin32 não disponível.")
        return False

    import subprocess

    subprocess.run(["taskkill", "/F", "/IM", "EXCEL.EXE"], capture_output=True)
    time.sleep(0.8)

    excel = win32com.client.DispatchEx("Excel.Application")
    excel.Visible = False
    excel.DisplayAlerts = False

    try:
        wb = excel.Workbooks.Open(str(xlsx_path.resolve()))
        try:
            vbproj = wb.VBProject
        except Exception as exc:
            print("Sem acesso ao VBA Project. Ative a confiança no modelo de objeto VBA.", exc)
            wb.Close(False)
            return False

        # Remove módulos obsoletos (pré-Sprint 3.3)
        for obsolete in ("ModuloAthenas", "modPermissoes"):
            try:
                vbproj.VBComponents.Remove(vbproj.VBComponents(obsolete))
                print(f"  - {obsolete} (removido)")
            except Exception:
                pass

        for mod_file in VBA_MODULES:
            path = VBA_DIR / mod_file
            try:
                _inject_standard_module(vbproj, path)
                print(f"  + {mod_file}")
            except Exception as exc:
                print(f"  falha {mod_file}: {exc}")
                raise

        try:
            _inject_thisworkbook(vbproj)
            print("  + ThisWorkbook")
        except Exception as exc:
            print(f"  ThisWorkbook: {exc}")

        try:
            _inject_sheet_code(wb, vbproj, "FORM_ALUNO", "FORM_ALUNO_Code.txt")
            print("  + FORM_ALUNO (Worksheet_Change)")
        except Exception as exc:
            print(f"  FORM_ALUNO code: {exc}")

        try:
            _create_frm_splash(vbproj)
            print("  + frmSplash")
        except Exception as exc:
            print(f"  frmSplash: {exc}")
            raise

        try:
            _create_frm_login(vbproj)
            print("  + frmLogin")
        except Exception as exc:
            print(f"  frmLogin: {exc}")
            raise

        try:
            _create_frm_aluno(vbproj)
            print("  + frmAluno")
        except Exception as exc:
            print(f"  frmAluno: {exc}")
            raise

        try:
            _create_frm_receber(vbproj)
            print("  + frmReceber")
        except Exception as exc:
            print(f"  frmReceber: {exc}")
            raise

        try:
            _add_financeiro_buttons(wb)
            print("  + botões financeiros")
        except Exception as exc:
            print(f"  botões financeiros: {exc}")

        for sheet_name, active in APP_SHEETS:
            try:
                _add_menu_shapes(wb.Sheets(sheet_name), active)
            except Exception as exc:
                print(f"  menu {sheet_name}: {exc}")

        for sheet_name in DATA_SHEETS:
            try:
                _add_data_nav(wb.Sheets(sheet_name))
            except Exception as exc:
                print(f"  nav {sheet_name}: {exc}")

        # Único botão ENTRAR — ancorado em D24:I24 (sem botão-célula duplicado)
        login = wb.Sheets("00_LOGIN")
        left_l, top_l, width_l, height_l = _range_box(login, "D24:I24")
        _add_round_button(
            login,
            "ENTRAR",
            "EntrarSistema",
            left_l,
            top_l + max(0.0, (height_l - 38) / 2),
            width_l,
            38,
            True,
            name="btnLoginEntrar",
            font_size=14,
        )

        f = wb.Sheets("FORM_ALUNO")
        # Botões só nas colunas C–E (área do formulário — não invade A/B)
        _, top_f, _, _ = _range_box(f, "C27")
        _add_button_row_in_cols(
            f,
            [
                ("+ Novo", "AbrirFrmAluno", True),
                ("Salvar", "SalvarAluno", True),
                ("Editar", "EditarAluno", True),
            ],
            "C",
            "E",
            top_f,
        )
        _add_button_row_in_cols(
            f,
            [
                ("Excluir", "ExcluirAluno", False),
                ("Cancelar", "LimparFormAluno", True),
                ("Pesquisar", "IrAlunos", True),
            ],
            "C",
            "E",
            top_f + BTN_H + BTN_GAP,
        )

        rel = wb.Sheets("16_RELATORIOS")
        left_r, width_r = _col_box(rel, "C")
        _, top_r, _, _ = _range_box(rel, "C7")
        # Largura = coluna C apenas (não invade D)
        pdf_w = max(120.0, width_r - 4)
        pdf_btns = [
            ("💰 PDF Financeiro", "PdfFinanceiro"),
            ("💰 PDF Fluxo", "PdfFluxo"),
            ("💳 PDF Inadimplentes", "PdfInadimplentes"),
            ("👤 PDF Alunos", "PdfAlunosAtivos"),
            ("📦 PDF Estoque", "PdfEstoque"),
            ("🏋 PDF Professores", "PdfProfessores"),
            ("📊 PDF Equipamentos", "PdfEquipamentos"),
            ("📏 PDF Avaliação", "PdfAvaliacao"),
            ("🏋 PDF Treino", "PdfTreino"),
        ]
        for i, (caption, macro) in enumerate(pdf_btns):
            _add_round_button(
                rel, caption, macro, left_r + 2, top_r + i * (BTN_H + 6), pdf_w, BTN_H, True, None, 10
            )

        d = wb.Sheets("01_DASHBOARD")
        _, top_d, _, _ = _range_box(d, "C50")
        _add_button_row_in_cols(
            d,
            [
                ("Atualizar BI", "AtualizarDashboards", True),
                ("📅 Agenda", "AbrirAgendaEAtualizar", True),
                ("Comercial", "IrDashComercial", True),
                ("Financeiro", "IrDashFinanceiro", True),
            ],
            "C",
            "F",
            top_d,
        )
        _add_button_row_in_cols(
            d,
            [
                ("Professores", "IrDashProfessores", True),
                ("Estoque BI", "IrDashEstoqueBI", True),
                ("Equipamentos", "IrDashEquipamentos", True),
                ("Filtros", "AbrirFiltrosBI", False),
            ],
            "C",
            "F",
            top_d + BTN_H + BTN_GAP,
        )

        try:
            ag = wb.Sheets("20_AGENDA")
            _, top_a, _, _ = _range_box(ag, "C51")
            _add_button_row_in_cols(
                ag,
                [
                    ("Atualizar", "AtualizarAgenda", True),
                    ("+ Evento", "NovoEventoManual", True),
                    ("Concluir", "ConcluirEventoSelecionado", False),
                    ("Home", "IrHome", True),
                ],
                "C",
                "F",
                top_a,
            )
            print("  + botões agenda")
        except Exception as exc:
            print(f"  botões agenda: {exc}")

        try:
            home = wb.Sheets("21_HOME")
            _, top_h, _, _ = _range_box(home, "C31")
            _add_button_row_in_cols(
                home,
                [
                    ("Abrir Ação", "AbrirAcaoSelecionada", True),
                    ("Atualizar", "AtualizarPainel", True),
                    ("Agenda", "AbrirAgendaEAtualizar", True),
                    ("CRM", "AbrirCRMEAtualizar", True),
                ],
                "C",
                "F",
                top_h,
            )
            print("  + botões HOME")
        except Exception as exc:
            print(f"  botões HOME: {exc}")

        try:
            crm = wb.Sheets("22_CRM")
            _, top_c, _, _ = _range_box(crm, "C49")
            _add_button_row_in_cols(
                crm,
                [
                    ("+ Lead", "NovoLead", True),
                    ("Editar", "EditarLead", True),
                    ("Contato", "RegistrarContato", True),
                    ("Agendar", "AgendarContato", True),
                ],
                "C",
                "F",
                top_c,
            )
            _add_button_row_in_cols(
                crm,
                [
                    ("Experimental", "RegistrarAulaExperimental", True),
                    ("Proposta", "RegistrarProposta", True),
                    ("Converter", "ConverterLead", False),
                    ("Histórico", "MostrarHistoricoLead", True),
                ],
                "C",
                "F",
                top_c + BTN_H + BTN_GAP,
            )
            _add_button_row_in_cols(
                crm,
                [
                    ("Atualizar", "AtualizarCRM", True),
                    ("Campanha", "GerarCampanha", True),
                    ("Indicação", "NovaIndicacao", True),
                    ("Dash CRM", "IrDashCRM", True),
                ],
                "C",
                "F",
                top_c + 2 * (BTN_H + BTN_GAP),
            )
            print("  + botões CRM")
        except Exception as exc:
            print(f"  botões CRM: {exc}")

        try:
            dash_crm = wb.Sheets("23_DASH_CRM")
            _, top_dc, _, _ = _range_box(dash_crm, "C37")
            _add_button_row_in_cols(
                dash_crm,
                [
                    ("Atualizar", "AtualizarCRM", True),
                    ("Abrir CRM", "IrCRM", True),
                    ("Home", "IrHome", True),
                    ("Dashboard", "IrDashboard", True),
                ],
                "C",
                "F",
                top_dc,
            )
            print("  + botões Dash CRM")
        except Exception as exc:
            print(f"  botões Dash CRM: {exc}")

        try:
            _inject_sheet_code(wb, vbproj, "21_HOME", "21_HOME_Code.txt")
            print("  + 21_HOME (double-click)")
        except Exception as exc:
            print(f"  21_HOME code: {exc}")

        try:
            _inject_sheet_code(wb, vbproj, "22_CRM", "22_CRM_Code.txt")
            print("  + 22_CRM (selection)")
        except Exception as exc:
            print(f"  22_CRM code: {exc}")

        try:
            aval = wb.Sheets("24_AVALIACAO")
            _, top_av, _, _ = _range_box(aval, "C51")
            _add_button_row_in_cols(
                aval,
                [
                    ("+ Avaliação", "NovaAvaliacao", True),
                    ("Comparar", "CompararAvaliacoes", True),
                    ("Atualizar", "AtualizarAvaliacoes", True),
                    ("PDF", "GerarPDFAvaliacao", True),
                ],
                "C",
                "F",
                top_av,
            )
            _add_button_row_in_cols(
                aval,
                [
                    ("Carregar", "CarregarAvaliacaoSelecionada", True),
                    ("Treinos", "IrTreinos", True),
                    ("Home", "IrHome", True),
                    ("Dash Prof", "IrDashProfessores", True),
                ],
                "C",
                "F",
                top_av + BTN_H + BTN_GAP,
            )
            print("  + botões Avaliação")
        except Exception as exc:
            print(f"  botões Avaliação: {exc}")

        try:
            tr = wb.Sheets("25_TREINOS")
            _, top_tr, _, _ = _range_box(tr, "C41")
            _add_button_row_in_cols(
                tr,
                [
                    ("+ Treino", "CriarTreino", True),
                    ("Copiar", "CopiarTreino", True),
                    ("+ Exercício", "AdicionarExercicioNaFicha", True),
                    ("Finalizar", "FinalizarTreino", False),
                ],
                "C",
                "F",
                top_tr,
            )
            _add_button_row_in_cols(
                tr,
                [
                    ("Atualizar", "AtualizarTreinos", True),
                    ("PDF", "GerarPDFTreino", True),
                    ("Avaliação", "IrAvaliacao", True),
                    ("Home", "IrHome", True),
                ],
                "C",
                "F",
                top_tr + BTN_H + BTN_GAP,
            )
            print("  + botões Treinos")
        except Exception as exc:
            print(f"  botões Treinos: {exc}")

        try:
            _inject_sheet_code(wb, vbproj, "24_AVALIACAO", "24_AVALIACAO_Code.txt")
            print("  + 24_AVALIACAO (selection)")
        except Exception as exc:
            print(f"  24_AVALIACAO code: {exc}")

        try:
            _inject_sheet_code(wb, vbproj, "25_TREINOS", "25_TREINOS_Code.txt")
            print("  + 25_TREINOS (selection)")
        except Exception as exc:
            print(f"  25_TREINOS code: {exc}")

        try:
            ac = wb.Sheets("26_ACESSO")
            _, top_ac, _, _ = _range_box(ac, "C24")
            _add_button_row_in_cols(
                ac,
                [
                    ("Consultar", "ConsultarAlunoAcesso", True),
                    ("Liberar Entrada", "LiberarEntrada", True),
                    ("Registrar Saída", "RegistrarSaida", False),
                    ("Histórico", "ConsultarHistorico", True),
                ],
                "C",
                "F",
                top_ac,
            )
            _add_button_row_in_cols(
                ac,
                [
                    ("Atualizar", "AtualizarAcesso", True),
                    ("Ausentes", "IdentificarAlunosAusentes", True),
                    ("Dash Freq.", "IrDashFrequencia", True),
                    ("Home", "IrHome", True),
                ],
                "C",
                "F",
                top_ac + BTN_H + BTN_GAP,
            )
            print("  + botões Acesso")
        except Exception as exc:
            print(f"  botões Acesso: {exc}")

        try:
            df = wb.Sheets("27_DASH_FREQUENCIA")
            _, top_df, _, _ = _range_box(df, "C38")
            _add_button_row_in_cols(
                df,
                [
                    ("Atualizar", "AtualizarDashboardAcesso", True),
                    ("Ausentes→CRM", "IdentificarAlunosAusentes", True),
                    ("Recepção", "IrAcesso", True),
                    ("Home", "IrHome", True),
                ],
                "C",
                "F",
                top_df,
            )
            print("  + botões Dash Frequência")
        except Exception as exc:
            print(f"  botões Dash Frequência: {exc}")

        try:
            est = wb.Sheets("09_ESTOQUE")
            _, top_est, _, _ = _range_box(est, "N20")
            _add_button_row_in_cols(
                est,
                [
                    ("+ Produto", "CadastrarProduto", True),
                    ("Entrada", "RegistrarEntrada", True),
                    ("Atualizar", "AtualizarEstoque", True),
                    ("Inventário", "Inventario", True),
                ],
                "N",
                "Q",
                top_est,
            )
            _add_button_row_in_cols(
                est,
                [
                    ("PDV", "IrPDV", True),
                    ("Dash PDV", "IrDashPDV", True),
                    ("Curva ABC", "CurvaABC", True),
                    ("Home", "IrHome", True),
                ],
                "N",
                "Q",
                top_est + BTN_H + BTN_GAP,
            )
            print("  + botões Estoque")
        except Exception as exc:
            print(f"  botões Estoque: {exc}")

        try:
            pdv = wb.Sheets("28_PDV")
            _, top_pdv, _, _ = _range_box(pdv, "C21")
            _add_button_row_in_cols(
                pdv,
                [
                    ("Buscar", "BuscarProdutoPDV", True),
                    ("+ Carrinho", "AdicionarProduto", True),
                    ("+ Kit", "AdicionarKit", True),
                    ("Remover", "RemoverProduto", False),
                ],
                "C",
                "F",
                top_pdv,
            )
            _add_button_row_in_cols(
                pdv,
                [
                    ("PIX", "PDV_PIX", True),
                    ("Cartão", "PDV_Cartao", True),
                    ("Dinheiro", "PDV_Dinheiro", True),
                    ("FINALIZAR", "FinalizarVenda", True),
                ],
                "C",
                "F",
                top_pdv + BTN_H + BTN_GAP,
            )
            _add_button_row_in_cols(
                pdv,
                [
                    ("Nova", "NovaVenda", True),
                    ("Cancelar", "CancelarVenda", False),
                    ("Dash", "IrDashPDV", True),
                    ("Estoque", "IrEstoque", True),
                ],
                "C",
                "F",
                top_pdv + 2 * (BTN_H + BTN_GAP),
            )
            print("  + botões PDV")
        except Exception as exc:
            print(f"  botões PDV: {exc}")

        try:
            inv = wb.Sheets("29_INVENTARIO")
            _, top_inv, _, _ = _range_box(inv, "C30")
            _add_button_row_in_cols(
                inv,
                [
                    ("Carregar", "Inventario", True),
                    ("Finalizar", "FinalizarInventario", True),
                    ("Estoque", "IrEstoque", True),
                    ("Home", "IrHome", True),
                ],
                "C",
                "F",
                top_inv,
            )
            print("  + botões Inventário")
        except Exception as exc:
            print(f"  botões Inventário: {exc}")

        try:
            dp = wb.Sheets("30_DASH_PDV")
            _, top_dp, _, _ = _range_box(dp, "C39")
            _add_button_row_in_cols(
                dp,
                [
                    ("Atualizar", "AtualizarDashboardEstoquePDV", True),
                    ("PDV", "IrPDV", True),
                    ("Estoque", "IrEstoque", True),
                    ("Home", "IrHome", True),
                ],
                "C",
                "F",
                top_dp,
            )
            print("  + botões Dash PDV")
        except Exception as exc:
            print(f"  botões Dash PDV: {exc}")

        try:
            bi = wb.Sheets("31_BI_EXECUTIVO")
            _, top_bi, _, _ = _range_box(bi, "C47")
            _add_button_row_in_cols(
                bi,
                [
                    ("Atualizar BI", "AtualizarBI", True),
                    ("Insights", "IrInsights", True),
                    ("Dashboard", "IrDashboard", True),
                    ("Home", "IrHome", True),
                ],
                "C",
                "F",
                top_bi,
            )
            print("  + botões BI Executivo")
        except Exception as exc:
            print(f"  botões BI Executivo: {exc}")

        try:
            ins = wb.Sheets("32_INSIGHTS")
            _, top_ins, _, _ = _range_box(ins, "C34")
            _add_button_row_in_cols(
                ins,
                [
                    ("Atualizar", "AtualizarInteligenciaAnalitica", True),
                    ("Simular Premium", "SimularAumentoPlano", True),
                    ("Simular Prof.", "SimularNovoProfessor", True),
                    ("Executivo", "IrBIExecutivo", True),
                ],
                "C",
                "F",
                top_ins,
            )
            print("  + botões Insights")
        except Exception as exc:
            print(f"  botões Insights: {exc}")

        try:
            pa = wb.Sheets("33_PORTAL_ALUNO")
            _, top_pa, _, _ = _range_box(pa, "C54")
            _add_button_row_in_cols(
                pa,
                [
                    ("Login Aluno", "LoginPortalAluno", True),
                    ("Atualizar", "AtualizarPortalAluno", True),
                    ("Sincronizar", "Sincronizar", True),
                    ("Ops / Sync", "IrPortalOps", True),
                ],
                "C",
                "F",
                top_pa,
            )
            print("  + botões Portal Aluno")
        except Exception as exc:
            print(f"  botões Portal Aluno: {exc}")

        try:
            pp = wb.Sheets("34_PORTAL_PROF")
            _, top_pp, _, _ = _range_box(pp, "C36")
            _add_button_row_in_cols(
                pp,
                [
                    ("Atualizar", "AtualizarPortalProfessor", True),
                    ("Enviar Msg", "EnviarMensagem", True),
                    ("Portal Aluno", "IrPortalAluno", True),
                    ("Treinos", "IrTreinos", True),
                ],
                "C",
                "F",
                top_pp,
            )
            print("  + botões Portal Prof")
        except Exception as exc:
            print(f"  botões Portal Prof: {exc}")

        try:
            po = wb.Sheets("35_PORTAL_OPS")
            _, top_po, _, _ = _range_box(po, "C29")
            _add_button_row_in_cols(
                po,
                [
                    ("Atualizar", "AtualizarPortalOps", True),
                    ("Sincronizar", "Sincronizar", True),
                    ("Portal Aluno", "IrPortalAluno", True),
                    ("Home", "IrHome", True),
                ],
                "C",
                "F",
                top_po,
            )
            print("  + botões Portal Ops")
        except Exception as exc:
            print(f"  botões Portal Ops: {exc}")

        try:
            ath = wb.Sheets("36_ATHENA_AI")
            _, top_ath, _, _ = _range_box(ath, "C53")
            _add_button_row_in_cols(
                ath,
                [
                    ("Perguntar", "PerguntarAthena", True),
                    ("Atualizar", "AtualizarAthenaAI", True),
                    ("Relatório IA", "GerarRelatorioIA", True),
                    ("Recomendações", "IrRecomendacoes", True),
                ],
                "C",
                "F",
                top_ath,
            )
            print("  + botões Athena AI")
        except Exception as exc:
            print(f"  botões Athena AI: {exc}")

        try:
            rec = wb.Sheets("37_RECOMENDACOES")
            _, top_rec, _, _ = _range_box(rec, "C37")
            _add_button_row_in_cols(
                rec,
                [
                    ("Atualizar", "AtualizarRecomendacoes", True),
                    ("Athena AI", "IrAthenaAI", True),
                    ("BI Exec", "IrBIExecutivo", True),
                    ("Home", "IrHome", True),
                ],
                "C",
                "F",
                top_rec,
            )
            print("  + botões Recomendações")
        except Exception as exc:
            print(f"  botões Recomendações: {exc}")

        try:
            master = wb.Sheets("38_MASTER")
            _, top_m, _, _ = _range_box(master, "C40")
            _add_button_row_in_cols(
                master,
                [
                    ("Atualizar", "AtualizarMaster", True),
                    ("Nova Academia", "IrNovaAcademia", True),
                    ("Trocar Empresa", "TrocarEmpresa", True),
                    ("Home", "IrHome", True),
                ],
                "C",
                "F",
                top_m,
            )
            print("  + botões Master")
        except Exception as exc:
            print(f"  botões Master: {exc}")

        try:
            nova = wb.Sheets("39_NOVA_ACADEMIA")
            _, top_n, _, _ = _range_box(nova, "C25")
            _add_button_row_in_cols(
                nova,
                [
                    ("Criar Academia", "CriarAcademiaCompleta", True),
                    ("Master", "IrMaster", True),
                    ("Trocar Empresa", "TrocarEmpresa", True),
                    ("Home", "IrHome", True),
                ],
                "C",
                "F",
                top_n,
            )
            print("  + botões Nova Academia")
        except Exception as exc:
            print(f"  botões Nova Academia: {exc}")

        try:
            uni = wb.Sheets("40_UNIDADES")
            _, top_u, _, _ = _range_box(uni, "C38")
            _add_button_row_in_cols(
                uni,
                [
                    ("Salvar", "CadastrarUnidade", True),
                    ("Editar", "EditarUnidade", True),
                    ("Trocar", "TrocarUnidade", True),
                    ("Transferir", "TransferirEstoque", True),
                    ("KPIs", "AtualizarDashboardUnidades", True),
                    ("Prof×Unid", "VincularProfessorUnidade", True),
                    ("Home", "IrHome", True),
                ],
                "C",
                "H",
                top_u,
            )
            print("  + botões Unidades")
        except Exception as exc:
            print(f"  botões Unidades: {exc}")

        try:
            fr = wb.Sheets("41_FRANQUEADORA")
            _, top_f, _, _ = _range_box(fr, "C44")
            _add_button_row_in_cols(
                fr,
                [
                    ("Salvar Franqueado", "CadastrarFranqueado", True),
                    ("Editar", "EditarFranquia", True),
                    ("Royalties", "CalcularRoyalties", True),
                    ("KPIs", "AtualizarDashboardFranqueadora", True),
                    ("Relatório", "GerarRelatorioFranqueadora", True),
                    ("Home", "IrHome", True),
                ],
                "C",
                "H",
                top_f,
            )
            print("  + botões Franqueadora")
        except Exception as exc:
            print(f"  botões Franqueadora: {exc}")

        _hide_bd_sheets(wb)

        try:
            excel.ActiveWindow.DisplayWorkbookTabs = False
            excel.ActiveWindow.DisplayHeadings = False
        except Exception:
            pass

        out = str(xlsm_path.resolve())
        if xlsm_path.exists():
            try:
                xlsm_path.unlink()
            except Exception:
                out = str((ROOT / f"ATHENAS_GYM_ERP_COMERCIAL_{int(time.time())}.xlsm").resolve())

        try:
            wb.SaveAs(out, FileFormat=52)
        except Exception as save_exc:
            alt = str((ROOT / f"ATHENAS_GYM_ERP_COMERCIAL_{int(time.time())}.xlsm").resolve())
            print(f"  SaveAs falhou ({save_exc}); tentando: {alt}")
            wb.SaveAs(alt, FileFormat=52)
            out = alt
        wb.Close(False)
        print(f"ERP Fase 3 gerado: {out}")
        print("Abra o arquivo, habilite macros. Login: admin / 123456")
        return True
    except Exception as exc:
        print(f"Falha ao gerar .xlsm: {exc}")
        try:
            excel.ActiveWorkbook.Close(False)
        except Exception:
            pass
        return False
    finally:
        try:
            excel.Quit()
        except Exception:
            pass
        subprocess.run(["taskkill", "/F", "/IM", "EXCEL.EXE"], capture_output=True)


def _sync_release_layout(xlsm_path: Path) -> None:
    """Espelha .xlsm e VBA na estrutura profissional (Excel/ + Export_VBA/)."""
    EXCEL_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_VBA_DIR.mkdir(parents=True, exist_ok=True)
    if xlsm_path.exists():
        dest = EXCEL_DIR / xlsm_path.name
        shutil.copy2(xlsm_path, dest)
        print(f"Release copiado: {dest}")
    for pattern in ("*.bas", "*.txt"):
        for src in VBA_DIR.glob(pattern):
            shutil.copy2(src, EXPORT_VBA_DIR / src.name)
    print(f"VBA exportado: {EXPORT_VBA_DIR}")


def main() -> None:
    build_workbook()
    ok = inject_vba_and_ui(XLSX_PATH, XLSM_PATH)
    if ok and XLSX_PATH.exists():
        try:
            XLSX_PATH.unlink()
            print("Base .xlsx intermediária removida.")
        except Exception:
            pass
    if ok:
        _sync_release_layout(XLSM_PATH)
    if not ok:
        print(f"Base .xlsx pronta. Verifique VBA em: {VBA_DIR}")


if __name__ == "__main__":
    main()
