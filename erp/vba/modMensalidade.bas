Attribute VB_Name = "modMensalidade"
Option Explicit

'============================================================
' Sprint 3.3 — Regras de mensalidades
'============================================================

Public Sub GerarMensalidade(ByVal nome As String, ByVal matricula As String, _
                            ByVal valor As Double, ByVal forma As String)
    Dim diaVenc As Long
    Dim venc As Date, comp As Date

    On Error GoTo TrataErro
    diaVenc = DiaVencimentoPadrao()
    comp = DateSerial(Year(DataAtual()), Month(DataAtual()), 1)
    venc = DateSerial(Year(DataAtual()), Month(DataAtual()), diaVenc)
    Call InserirMensalidade(nome, matricula, comp, valor, venc, forma)
    Call CriarContaReceber(matricula, nome, valor, venc, forma, CompetenciaTexto(venc), "")
    Exit Sub

TrataErro:
    RegistrarErro Err.Number, Err.Description, "GerarMensalidade"
End Sub

Public Sub GerarMensalidadesMes()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim nome As String, matricula As String, status As String
    Dim valor As Double, venc As Date, comp As Date, diaVenc As Long
    Dim existe As Boolean, criadas As Long
    Dim loM As ListObject
    Dim lrM As ListRow

    On Error GoTo TrataErro

    If Not (PodeAcessar("Mensalidades") Or PodeAcessar("Financeiro")) Then
        Call ExigeAcesso("Mensalidades")
        Exit Sub
    End If

    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    Set loM = ObterTabela(SHT_MENSALIDADES, TBL_MENSALIDADES)
    diaVenc = DiaVencimentoPadrao()
    comp = DateSerial(Year(DataAtual()), Month(DataAtual()), 1)
    venc = DateSerial(Year(DataAtual()), Month(DataAtual()), diaVenc)
    criadas = 0

    For Each lr In lo.ListRows
        nome = NzStr(LerCampo(lr, "Nome"))
        matricula = NzStr(LerCampo(lr, "Matrícula"))
        status = NzStr(LerCampo(lr, "Status"))
        If nome = "" Or matricula = "" Or status <> "Ativo" Then GoTo Prox
        valor = CDbl(Val(LerCampo(lr, "ValorPlano")))
        existe = False
        For Each lrM In loM.ListRows
            If NzStr(LerCampo(lrM, "Código")) = matricula Then
                If IsDate(LerCampo(lrM, "Competência")) Then
                    If Year(CDate(LerCampo(lrM, "Competência"))) = Year(comp) _
                       And Month(CDate(LerCampo(lrM, "Competência"))) = Month(comp) Then
                        existe = True: Exit For
                    End If
                End If
            End If
        Next lrM
        If Not existe Then
            Call InserirMensalidade(nome, matricula, comp, valor, venc, "PIX")
            Call CriarContaReceber(matricula, nome, valor, venc, "PIX", CompetenciaTexto(venc), "")
            criadas = criadas + 1
        End If
Prox:
    Next lr

    Call SincronizarContasReceberUI
    Call AtualizarDashboardFinanceiro
    RegistrarAcao "Mensalidades geradas: " & criadas, "Financeiro"
    MsgOk "Mensalidades processadas. Novas: " & criadas
    Exit Sub

TrataErro:
    RegistrarErro Err.Number, Err.Description, "GerarMensalidadesMes"
    MsgErro "Erro ao gerar mensalidades."
End Sub
