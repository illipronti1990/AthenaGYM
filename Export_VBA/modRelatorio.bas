Attribute VB_Name = "modRelatorio"
Option Explicit

'============================================================
' Sprint 3.3 — Relatórios / PDF
'============================================================

Private Sub ExportarAbaPDF(ByVal sheetName As String, ByVal fileSuffix As String)
    Dim path As String
    Dim ws As Worksheet
    On Error GoTo Falha
    Set ws = ThisWorkbook.Sheets(sheetName)
    path = ThisWorkbook.Path & "\PDF_" & fileSuffix & "_" & Format$(DataAtual(), "yyyymmdd") & ".pdf"
    ws.ExportAsFixedFormat Type:=0, Filename:=path, Quality:=0, _
        IncludeDocProperties:=True, IgnorePrintAreas:=False, OpenAfterPublish:=True
    RegistrarAcao "PDF " & sheetName, "Relatorios"
    MsgOk "PDF gerado:" & vbCrLf & path
    Exit Sub
Falha:
    RegistrarErro Err.Number, Err.Description, "ExportarAbaPDF"
    MsgErro "Não foi possível gerar o PDF." & vbCrLf & Err.Description
End Sub

Public Sub PdfFinanceiro()
    If Not ExigeAcesso("Financeiro") Then Exit Sub
    Call AtualizarDashboardFinanceiro
    ExportarAbaPDF "04_FINANCEIRO", "Financeiro"
End Sub

Public Sub PdfFluxo()
    If Not ExigeAcesso("Financeiro") Then Exit Sub
    ExportarAbaPDF "05_FLUXO_CAIXA", "FluxoCaixa"
End Sub

Public Sub PdfInadimplentes()
    If Not ExigeAcesso("Financeiro") Then Exit Sub
    Call RecalcularTodasContasAbertas
    Call SincronizarContasReceberUI
    ExportarAbaPDF "06_CONTAS_RECEBER", "Inadimplentes"
End Sub

Public Sub PdfContasPagar()
    If Not ExigeAcesso("Financeiro") Then Exit Sub
    ExportarAbaPDF "07_CONTAS_PAGAR", "ContasPagar"
End Sub

Public Sub PdfDashFinanceiro()
    If Not ExigeAcesso("Financeiro") Then Exit Sub
    Call AtualizarDashboardFinanceiro
    ExportarAbaPDF "13_DASH_FINANCEIRO", "DashFinanceiro"
End Sub

Public Sub PdfAlunosAtivos()
    If Not ExigeAcesso("Alunos") Then Exit Sub
    ExportarAbaPDF "02_ALUNOS", "Alunos"
End Sub

Public Sub PdfEstoque()
    If Not ExigeAcesso("Estoque") Then Exit Sub
    ExportarAbaPDF "09_ESTOQUE", "Estoque"
End Sub

Public Sub PdfProfessores()
    If Not ExigeAcesso("Professores") Then Exit Sub
    ExportarAbaPDF "08_PROFESSORES", "Professores"
End Sub

Public Sub PdfEquipamentos()
    If Not ExigeAcesso("Estoque") Then Exit Sub
    ExportarAbaPDF "10_EQUIPAMENTOS", "Equipamentos"
End Sub

Public Sub RelatorioFinanceiroPDF(): PdfFinanceiro: End Sub
Public Sub RelatorioInadimplentes(): PdfInadimplentes: End Sub

Public Sub RelatorioPresenca()
    If Not (PodeAcessar("Presenca") Or PerfilUsuario = CONST_PERFIL_ADMIN) Then
        Call ExigeAcesso("Presenca")
        Exit Sub
    End If
    ExportarAbaPDF "12_PRESENCA", "Presenca"
End Sub

Public Sub PdfAvaliacao()
    If Not ExigeAcesso("Avaliacao") Then Exit Sub
    On Error Resume Next
    Call AtualizarAvaliacoes
    On Error GoTo 0
    ExportarAbaPDF "24_AVALIACAO", "Avaliacao"
End Sub

Public Sub PdfTreino()
    If Not ExigeAcesso("Avaliacao") Then Exit Sub
    On Error Resume Next
    Call AtualizarTreinos
    On Error GoTo 0
    ExportarAbaPDF "25_TREINOS", "Treino"
End Sub

Public Sub ImprimirFichaAluno()
    Dim nome As String
    On Error GoTo TrataErro
    If Not ExigeAcesso("Alunos") Then Exit Sub
    nome = InputBox("Nome do aluno:", "Ficha do Aluno")
    If Trim$(nome) = "" Then Exit Sub
    AtivarAba "02_ALUNOS"
    On Error Resume Next
    ThisWorkbook.Sheets("02_ALUNOS").Range("A5:U5").AutoFilter Field:=3, Criteria1:="=*" & nome & "*"
    On Error GoTo TrataErro
    ExportarAbaPDF "02_ALUNOS", "Ficha_" & Left$(nome, 12)
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "ImprimirFichaAluno"
End Sub

Public Sub VerificarAlertas()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim atrasados As Long, manut As Long

    On Error GoTo TrataErro
    If Not SessaoAtiva() Then MsgAviso "Faça login.": Exit Sub

    Set lo = ObterTabela(SHT_MENSALIDADES, TBL_MENSALIDADES)
    For Each lr In lo.ListRows
        If NzStr(LerCampo(lr, "Status")) = "Atrasado" Then atrasados = atrasados + 1
        If NzStr(LerCampo(lr, "Status")) = "Pendente" And IsDate(LerCampo(lr, "Vencimento")) Then
            If CDate(LerCampo(lr, "Vencimento")) < DataAtual() Then
                Call GravarCampo(lr, "Status", "Atrasado")
                atrasados = atrasados + 1
            End If
        End If
    Next lr

    On Error Resume Next
    Set lo = ObterTabela("10_EQUIPAMENTOS", "tblEquipamentos")
    If Not lo Is Nothing Then
        For Each lr In lo.ListRows
            If IsDate(lr.Range(1, 6).Value) Then
                If CDate(lr.Range(1, 6).Value) <= DataAtual() Then manut = manut + 1
            End If
        Next lr
    End If
    On Error GoTo TrataErro

    RegistrarAcao "Alertas Atraso=" & atrasados & " Manut=" & manut, "Sistema"
    MsgAviso "ALERTAS ATHENAS GYM" & vbCrLf & vbCrLf & _
           "Mensalidades em atraso: " & atrasados & vbCrLf & _
           "Equipamentos com manutenção vencida: " & manut
    Exit Sub

TrataErro:
    RegistrarErro Err.Number, Err.Description, "VerificarAlertas"
End Sub
