Attribute VB_Name = "modBI"
Option Explicit

'============================================================
' Sprint 5.0 — Inteligência / BI / Alertas / Metas / Rankings
'============================================================

Public Const SHT_BI As String = "BI_BASE"
Public Const SHT_METAS As String = "BD_METAS"
Public Const TBL_METAS As String = "tbMetas"
Public Const SHT_NOTIF As String = "BD_NOTIFICACOES"
Public Const TBL_NOTIF As String = "tbNotificacoes"

Public Sub AtualizarBI()
    On Error GoTo TrataErro
    Call AtualizarKPIsBI
    Call AtualizarSerieMensalBI
    Call AtualizarRankingsBI
    Call AtualizarMetasBI
    Call AplicarSemaforosBI
    Call GerarAlertasBI
    Call AtualizarDashboardFinanceiro
    On Error Resume Next
    Call AtualizarInteligenciaAnalitica
    On Error GoTo TrataErro
    Application.Calculate
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarBI"
End Sub

Public Sub AtualizarKPIsBI()
    Dim m As Long, a As Long
    Dim recMes As Double, despMes As Double
    Dim ativos As Long, novos As Long, cancel As Long, cong As Long
    Dim hoje As Date

    On Error Resume Next
    hoje = DataAtual()
    m = Month(hoje)
    a = Year(hoje)
    recMes = SomaCreditosMes(m, a)
    despMes = SomaDebitosMes(m, a)
    ativos = ContarAlunosAtivos()
    novos = ContarNovosAlunosMes(m, a)
    cancel = ContarOnde(SHT_ALUNOS, TBL_ALUNOS, "Status", "Cancelado")
    cong = ContarOnde(SHT_ALUNOS, TBL_ALUNOS, "Status", "Congelado")

    GravarCelula SHT_BI, "E2", SomaCreditosDia(hoje)
    GravarCelula SHT_BI, "E3", recMes
    GravarCelula SHT_BI, "E4", recMes - despMes
    GravarCelula SHT_BI, "E5", ativos
    GravarCelula SHT_BI, "E6", novos
    GravarCelula SHT_BI, "E7", cancel
    GravarCelula SHT_BI, "E8", CalcularChurn()
    GravarCelula SHT_BI, "E9", CalcularTicketMedio()
    GravarCelula SHT_BI, "E10", PercentualInadimplencia()
    GravarCelula SHT_BI, "E11", UltimoSaldoFluxo()
    GravarCelula SHT_BI, "E12", TotalAReceber()
    GravarCelula SHT_BI, "E13", recMes
    GravarCelula SHT_BI, "E14", TotalEmAtraso()
    GravarCelula SHT_BI, "E15", TotalAReceber()
    GravarCelula SHT_BI, "E16", TotalAPagar()
    GravarCelula SHT_BI, "E17", cong
    GravarCelula SHT_BI, "E18", ContarRenovacoesMes(m, a)
    GravarCelula SHT_BI, "E19", novos
    GravarCelula SHT_BI, "E20", CalcularConversao(novos, ativos)
    GravarCelula SHT_BI, "E21", ContarLinhasComDados("08_PROFESSORES", "tblProfessores", "Nome")
    GravarCelula SHT_BI, "E22", ContarAvaliacoesMes(m, a)
    GravarCelula SHT_BI, "E23", ContarLinhasComDados("09_ESTOQUE", "tblEstoque", "Produto")
    GravarCelula SHT_BI, "E24", ContarEstoqueBaixo()
    GravarCelula SHT_BI, "E25", SomaValorEstoque()
    GravarCelula SHT_BI, "E26", ContarLinhasComDados("10_EQUIPAMENTOS", "tblEquipamentos", "Equipamento")
    GravarCelula SHT_BI, "E27", ContarEquipEmManutencao()
    On Error GoTo 0
End Sub

Private Function ContarNovosAlunosMes(ByVal m As Long, ByVal a As Long) As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim n As Long, dt As Date
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    For Each lr In lo.ListRows
        If IsDate(LerCampo(lr, "DataCadastro")) Then
            dt = CDate(LerCampo(lr, "DataCadastro"))
            If Month(dt) = m And Year(dt) = a Then n = n + 1
        End If
    Next lr
Sai:
    ContarNovosAlunosMes = n
End Function

Private Function ContarRenovacoesMes(ByVal m As Long, ByVal a As Long) As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim n As Long, dt As Date
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_LANCAMENTOS, TBL_LANCAMENTOS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Origem")), "Mensalidade", vbTextCompare) = 0 Then
            If IsDate(LerCampo(lr, "Data")) Then
                dt = CDate(LerCampo(lr, "Data"))
                If Month(dt) = m And Year(dt) = a Then
                    If CDbl(Val(Replace(CStr(LerCampo(lr, "Crédito")), ",", "."))) > 0 Then n = n + 1
                End If
            End If
        End If
    Next lr
Sai:
    ContarRenovacoesMes = n
End Function

Private Function CalcularConversao(ByVal novos As Long, ByVal ativos As Long) As Double
    If ativos <= 0 Then
        CalcularConversao = 0
    Else
        CalcularConversao = Round((novos / ativos) * 100#, 1)
    End If
End Function

Private Function ContarLinhasComDados(ByVal sheetName As String, ByVal tableName As String, ByVal colName As String) As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim n As Long
    On Error GoTo Sai
    Set lo = ObterTabela(sheetName, tableName)
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, colName))) > 0 Then n = n + 1
    Next lr
Sai:
    ContarLinhasComDados = n
End Function

Private Function ContarAvaliacoesMes(ByVal m As Long, ByVal a As Long) As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim n As Long, dt As Date
    On Error GoTo Legado
    Set lo = ObterTabela("BD_AVALIACOES", "tbAvaliacoes")
    For Each lr In lo.ListRows
        If IsDate(LerCampo(lr, "Data")) Then
            dt = CDate(LerCampo(lr, "Data"))
            If Month(dt) = m And Year(dt) = a Then n = n + 1
        End If
    Next lr
    ContarAvaliacoesMes = n
    Exit Function
Legado:
    On Error GoTo Sai
    n = 0
    Set lo = ObterTabela("11_AVALIACAO", "tblAvaliacao")
    For Each lr In lo.ListRows
        If IsDate(LerCampo(lr, "Data")) Then
            dt = CDate(LerCampo(lr, "Data"))
            If Month(dt) = m And Year(dt) = a Then n = n + 1
        End If
    Next lr
Sai:
    ContarAvaliacoesMes = n
End Function

Private Function ContarEstoqueBaixo() As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim n As Long
    On Error GoTo Sai
    Set lo = ObterTabela("09_ESTOQUE", "tblEstoque")
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Produto"))) = 0 Then GoTo Prox
        If CDbl(Val(LerCampo(lr, "Qtd Atual"))) <= CDbl(Val(LerCampo(lr, "Estoque Mínimo"))) Then n = n + 1
Prox:
    Next lr
Sai:
    ContarEstoqueBaixo = n
End Function

Private Function SomaValorEstoque() As Double
    Dim lo As ListObject
    Dim lr As ListRow
    Dim tot As Double
    On Error GoTo Sai
    Set lo = ObterTabela("09_ESTOQUE", "tblEstoque")
    For Each lr In lo.ListRows
        tot = tot + CDbl(Val(Replace(CStr(LerCampo(lr, "Valor Estoque")), ",", ".")))
    Next lr
Sai:
    SomaValorEstoque = tot
End Function

Private Function ContarEquipEmManutencao() As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim n As Long, st As String
    On Error GoTo Sai
    Set lo = ObterTabela("10_EQUIPAMENTOS", "tblEquipamentos")
    For Each lr In lo.ListRows
        st = UCase$(NzStr(LerCampo(lr, "Status Manutenção")))
        If InStr(st, "MANUT") > 0 Or InStr(st, "PARADO") > 0 Or InStr(st, "REPARO") > 0 Then n = n + 1
    Next lr
Sai:
    ContarEquipEmManutencao = n
End Function

Public Sub AtualizarSerieMensalBI()
    Dim i As Long, m As Long, a As Long, r As Long
    Dim rec As Double, desp As Double
    Dim mesAtual As Long, anoAtual As Long

    On Error Resume Next
    mesAtual = Month(DataAtual())
    anoAtual = Year(DataAtual())
    For i = 0 To 5
        m = mesAtual - 5 + i
        a = anoAtual
        If m <= 0 Then
            m = m + 12
            a = a - 1
        End If
        r = 26 + i
        rec = SomaCreditosMes(m, a)
        desp = SomaDebitosMes(m, a)
        GravarCelula SHT_BI, "B" & r, rec
        GravarCelula SHT_BI, "C" & r, desp
        GravarCelula SHT_BI, "D" & r, rec - desp
        GravarCelula SHT_BI, "E" & r, ContarAlunosAtivos()
    Next i
    On Error GoTo 0
End Sub

Public Sub AtualizarRankingsBI()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim planos() As String, qtds() As Long
    Dim profs() As String, pQtds() As Long
    Dim n As Long, i As Long, j As Long, tmpS As String, tmpL As Long
    Dim p As String, maxBar As Long
    Dim barra As String

    On Error Resume Next
    ' Planos
    ReDim planos(1 To 50)
    ReDim qtds(1 To 50)
    n = 0
    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    For Each lr In lo.ListRows
        If UCase$(NzStr(LerCampo(lr, "Status"))) <> "ATIVO" Then GoTo ProxA
        p = NzStr(LerCampo(lr, "Plano"))
        If Len(p) = 0 Then GoTo ProxA
        For i = 1 To n
            If StrComp(planos(i), p, vbTextCompare) = 0 Then
                qtds(i) = qtds(i) + 1
                GoTo ProxA
            End If
        Next i
        n = n + 1
        planos(n) = p
        qtds(n) = 1
ProxA:
    Next lr

    ' bubble sort desc
    For i = 1 To n - 1
        For j = i + 1 To n
            If qtds(j) > qtds(i) Then
                tmpL = qtds(i): qtds(i) = qtds(j): qtds(j) = tmpL
                tmpS = planos(i): planos(i) = planos(j): planos(j) = tmpS
            End If
        Next j
    Next i

    maxBar = 1
    If n >= 1 Then maxBar = qtds(1)
    For i = 1 To 10
        If i <= n Then
            GravarCelula SHT_BI, "A" & (11 + i), i
            GravarCelula SHT_BI, "B" & (11 + i), planos(i)
            GravarCelula SHT_BI, "C" & (11 + i), qtds(i)
            barra = String$(CLng((qtds(i) / maxBar) * 12), ChrW(&H2588))
            GravarCelula SHT_BI, "D" & (11 + i), barra
        Else
            GravarCelula SHT_BI, "A" & (11 + i), ""
            GravarCelula SHT_BI, "B" & (11 + i), ""
            GravarCelula SHT_BI, "C" & (11 + i), ""
            GravarCelula SHT_BI, "D" & (11 + i), ""
        End If
    Next i

    ' Professores
    ReDim profs(1 To 50)
    ReDim pQtds(1 To 50)
    n = 0
    For Each lr In lo.ListRows
        If UCase$(NzStr(LerCampo(lr, "Status"))) <> "ATIVO" Then GoTo ProxP
        p = NzStr(LerCampo(lr, "Professor"))
        If Len(p) = 0 Then GoTo ProxP
        For i = 1 To n
            If StrComp(profs(i), p, vbTextCompare) = 0 Then
                pQtds(i) = pQtds(i) + 1
                GoTo ProxP
            End If
        Next i
        n = n + 1
        profs(n) = p
        pQtds(n) = 1
ProxP:
    Next lr

    For i = 1 To n - 1
        For j = i + 1 To n
            If pQtds(j) > pQtds(i) Then
                tmpL = pQtds(i): pQtds(i) = pQtds(j): pQtds(j) = tmpL
                tmpS = profs(i): profs(i) = profs(j): profs(j) = tmpS
            End If
        Next j
    Next i

    For i = 1 To 10
        If i <= n Then
            GravarCelula SHT_BI, "F" & (11 + i), i
            GravarCelula SHT_BI, "G" & (11 + i), profs(i)
            GravarCelula SHT_BI, "H" & (11 + i), pQtds(i)
        Else
            GravarCelula SHT_BI, "F" & (11 + i), ""
            GravarCelula SHT_BI, "G" & (11 + i), ""
            GravarCelula SHT_BI, "H" & (11 + i), ""
        End If
    Next i
    On Error GoTo 0
End Sub

Public Function SemaforoValor(ByVal indicador As String, ByVal valor As Double) As String
    Select Case UCase$(indicador)
        Case "INADIMPLENCIA", "INADIMPLÊNCIA"
            If valor <= 5 Then
                SemaforoValor = "🟢"
            ElseIf valor <= 10 Then
                SemaforoValor = "🟡"
            Else
                SemaforoValor = "🔴"
            End If
        Case "CHURN"
            If valor <= 5 Then
                SemaforoValor = "🟢"
            ElseIf valor <= 10 Then
                SemaforoValor = "🟡"
            Else
                SemaforoValor = "🔴"
            End If
        Case "METARECEITA", "RECEITA"
            If valor >= 95 Then
                SemaforoValor = "🟢"
            ElseIf valor >= 70 Then
                SemaforoValor = "🟡"
            Else
                SemaforoValor = "🔴"
            End If
        Case "ESTOQUE"
            If valor <= 0 Then
                SemaforoValor = "🟢"
            ElseIf valor <= 3 Then
                SemaforoValor = "🟡"
            Else
                SemaforoValor = "🔴"
            End If
        Case Else
            SemaforoValor = "🟡"
    End Select
End Function

Public Sub AplicarSemaforosBI()
    Dim inad As Double, churn As Double, metaPct As Double, estBaixo As Double
    Dim metaRec As Double, recMes As Double

    On Error Resume Next
    inad = CDbl(Val(LerCelula(SHT_BI, "E10")))
    churn = CDbl(Val(LerCelula(SHT_BI, "E8")))
    recMes = CDbl(Val(LerCelula(SHT_BI, "E3")))
    metaRec = MetaNumerica("Receita")
    If metaRec > 0 Then metaPct = (recMes / metaRec) * 100# Else metaPct = 0
    estBaixo = CDbl(Val(LerCelula(SHT_BI, "E24")))

    GravarCelula SHT_BI, "H2", SemaforoValor("Inadimplencia", inad)
    GravarCelula SHT_BI, "H3", SemaforoValor("Churn", churn)
    GravarCelula SHT_BI, "H4", SemaforoValor("MetaReceita", metaPct)
    GravarCelula SHT_BI, "H5", SemaforoValor("Estoque", estBaixo)

    ' Espelho no dashboard executivo
    GravarCelula "01_DASHBOARD", "M8", SemaforoValor("Inadimplencia", inad)
    GravarCelula "01_DASHBOARD", "M9", SemaforoValor("Churn", churn)
    GravarCelula "01_DASHBOARD", "M10", SemaforoValor("MetaReceita", metaPct)
    GravarCelula "01_DASHBOARD", "M11", SemaforoValor("Estoque", estBaixo)
    On Error GoTo 0
End Sub

Public Function MetaNumerica(ByVal indicador As String) As Double
    Dim lo As ListObject
    Dim lr As ListRow
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_METAS, TBL_METAS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Indicador")), indicador, vbTextCompare) = 0 Then
            MetaNumerica = CDbl(Val(Replace(CStr(LerCampo(lr, "Meta")), ",", ".")))
            Exit Function
        End If
    Next lr
Sai:
    MetaNumerica = 0
End Function

Public Sub AtualizarMetasBI()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim ind As String, meta As Double, atual As Double, prog As Double
    Dim und As String, sem As String

    On Error Resume Next
    Set lo = ObterTabela(SHT_METAS, TBL_METAS)
    For Each lr In lo.ListRows
        ind = NzStr(LerCampo(lr, "Indicador"))
        meta = CDbl(Val(Replace(CStr(LerCampo(lr, "Meta")), ",", ".")))
        und = NzStr(LerCampo(lr, "Unidade"))
        Select Case UCase$(ind)
            Case "RECEITA": atual = CDbl(Val(LerCelula(SHT_BI, "E3")))
            Case "NOVOS ALUNOS": atual = CDbl(Val(LerCelula(SHT_BI, "E6")))
            Case "CHURN": atual = CDbl(Val(LerCelula(SHT_BI, "E8")))
            Case "INADIMPLÊNCIA", "INADIMPLENCIA": atual = CDbl(Val(LerCelula(SHT_BI, "E10")))
            Case "TICKET MÉDIO", "TICKET MEDIO": atual = CDbl(Val(LerCelula(SHT_BI, "E9")))
            Case "ALUNOS ATIVOS": atual = CDbl(Val(LerCelula(SHT_BI, "E5")))
            Case "AVALIAÇÕES", "AVALIACOES": atual = CDbl(Val(LerCelula(SHT_BI, "E22")))
            Case "LTV": atual = CDbl(Val(LerCelula(SHT_BI, "E37")))
            Case "CAC": atual = CDbl(Val(LerCelula(SHT_BI, "E38")))
            Case "LUCRO": atual = CDbl(Val(LerCelula(SHT_BI, "E4")))
            Case Else: atual = 0
        End Select
        Call GravarCampo(lr, "Atual", atual)
        If meta <= 0 Then
            prog = 0
        ElseIf und = "%" And (UCase$(ind) = "CHURN" Or InStr(1, UCase$(ind), "INADIMPL") > 0) Then
            ' quanto menor melhor — progresso invertido
            If atual <= meta Then
                prog = 1
            Else
                prog = Application.Max(0, 1 - ((atual - meta) / meta))
            End If
            sem = SemaforoValor(ind, atual)
        ElseIf UCase$(ind) = "CAC" Then
            If atual <= meta Then
                prog = 1
            Else
                prog = Application.Max(0, 1 - ((atual - meta) / meta))
            End If
            If prog >= 0.95 Then
                sem = "🟢"
            ElseIf prog >= 0.7 Then
                sem = "🟡"
            Else
                sem = "🔴"
            End If
        Else
            prog = Application.Min(1, atual / meta)
            If prog >= 0.95 Then
                sem = "🟢"
            ElseIf prog >= 0.7 Then
                sem = "🟡"
            Else
                sem = "🔴"
            End If
        End If
        Call GravarCampo(lr, "Progresso", prog)
        Call GravarCampo(lr, "Semáforo", sem)
    Next lr
    On Error GoTo 0
End Sub

Public Sub LimparNotificacoes()
    Dim lo As ListObject
    On Error Resume Next
    Set lo = ObterTabela(SHT_NOTIF, TBL_NOTIF)
    Do While lo.ListRows.Count > 1
        lo.ListRows(lo.ListRows.Count).Delete
    Loop
    Dim c As Long
    For c = 1 To lo.ListColumns.Count
        lo.ListRows(1).Range(1, c).Value = ""
    Next c
    On Error GoTo 0
End Sub

Public Sub AdicionarNotificacao(ByVal tipo As String, ByVal prioridade As String, _
                                 ByVal mensagem As String, ByVal destino As String)
    Dim lo As ListObject
    Dim lr As ListRow
    Dim cols As Variant, vals As Variant
    On Error Resume Next
    cols = Array("Data", "Hora", "Tipo", "Prioridade", "Mensagem", "Destino", "Lida")
    vals = Array(DataAtual(), Format$(Now, "hh:nn"), tipo, prioridade, mensagem, destino, "NÃO")
    Set lo = ObterTabela(SHT_NOTIF, TBL_NOTIF)
    If Len(NzStr(LerCampo(lo.ListRows(1), "Mensagem"))) = 0 Then
        Call EditarRegistro(lo.ListRows(1), cols, vals)
    Else
        Call AdicionarRegistro(SHT_NOTIF, TBL_NOTIF, cols, vals)
    End If
    On Error GoTo 0
End Sub

Public Sub GerarAlertasBI()
    Dim vencidas As Long, estBaixo As Long
    Dim metaRec As Double, recMes As Double, pct As Double
    Dim i As Long, msg As String
    Dim lo As ListObject
    Dim lr As ListRow

    On Error Resume Next
    Call LimparNotificacoes

    ' Contar atrasadas
    vencidas = 0
    Set lo = ObterTabela(SHT_RECEBER_BD, TBL_RECEBER_BD)
    For Each lr In lo.ListRows
        If UCase$(NzStr(LerCampo(lr, "Situação"))) = "ATRASADO" Then vencidas = vencidas + 1
    Next lr
    estBaixo = CLng(Val(LerCelula(SHT_BI, "E24")))
    metaRec = MetaNumerica("Receita")
    recMes = CDbl(Val(LerCelula(SHT_BI, "E3")))
    If metaRec > 0 Then pct = recMes / metaRec Else pct = 0

    i = 0
    ' Limpa painel de alertas BI_BASE
    For i = 12 To 21
        GravarCelula SHT_BI, "J" & i, ""
        GravarCelula SHT_BI, "K" & i, ""
        GravarCelula SHT_BI, "L" & i, ""
    Next i

    i = 12
    If vencidas > 0 Then
        msg = "Existem " & vencidas & " mensalidades vencidas."
        Call AdicionarNotificacao("Financeiro", "🔴", msg, "04_FINANCEIRO")
        GravarCelula SHT_BI, "J" & i, "🔴"
        GravarCelula SHT_BI, "K" & i, msg
        GravarCelula SHT_BI, "L" & i, "04_FINANCEIRO"
        i = i + 1
    End If
    If estBaixo > 0 Then
        msg = estBaixo & " produto(s) abaixo do estoque mínimo."
        Call AdicionarNotificacao("Estoque", "🟡", msg, "09_ESTOQUE")
        GravarCelula SHT_BI, "J" & i, "🟡"
        GravarCelula SHT_BI, "K" & i, msg
        GravarCelula SHT_BI, "L" & i, "09_ESTOQUE"
        i = i + 1
    End If
    If pct >= 0.9 And metaRec > 0 Then
        msg = "Meta de receita " & Format$(pct, "0%") & " atingida."
        Call AdicionarNotificacao("Meta", "🟢", msg, "01_DASHBOARD")
        GravarCelula SHT_BI, "J" & i, "🟢"
        GravarCelula SHT_BI, "K" & i, msg
        GravarCelula SHT_BI, "L" & i, "01_DASHBOARD"
        i = i + 1
    ElseIf pct < 0.7 And metaRec > 0 Then
        msg = "Meta de receita em " & Format$(pct, "0%") & " — atenção."
        Call AdicionarNotificacao("Meta", "🟡", msg, "01_DASHBOARD")
        GravarCelula SHT_BI, "J" & i, "🟡"
        GravarCelula SHT_BI, "K" & i, msg
        GravarCelula SHT_BI, "L" & i, "01_DASHBOARD"
        i = i + 1
    End If

    Call EspelharAlertasDashboard
    On Error GoTo 0
End Sub

Private Sub EspelharAlertasDashboard()
    Dim i As Long
    On Error Resume Next
    For i = 0 To 4
        GravarCelula "01_DASHBOARD", "C" & (41 + i), LerCelula(SHT_BI, "J" & (12 + i))
        GravarCelula "01_DASHBOARD", "D" & (41 + i), LerCelula(SHT_BI, "K" & (12 + i))
        GravarCelula "01_DASHBOARD", "F" & (41 + i), LerCelula(SHT_BI, "L" & (12 + i))
    Next i
    On Error GoTo 0
End Sub

Public Sub MostrarAlertasAoAbrir()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim txt As String, n As Long

    On Error Resume Next
    Call AtualizarBI
    Set lo = ObterTabela(SHT_NOTIF, TBL_NOTIF)
    txt = "ALERTAS INTELIGENTES — ATHENAS GYM" & vbCrLf & vbCrLf
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Mensagem"))) > 0 Then
            n = n + 1
            txt = txt & NzStr(LerCampo(lr, "Prioridade")) & " " & NzStr(LerCampo(lr, "Mensagem")) & vbCrLf
        End If
    Next lr
    If n = 0 Then
        txt = txt & "🟢 Nenhum alerta crítico no momento."
    End If
    MsgBox txt, vbInformation, APP_TITLE
    On Error GoTo 0
End Sub

Public Sub AbrirCentroNotificacoes()
    On Error Resume Next
    Call AtualizarBI
    ThisWorkbook.Sheets(SHT_NOTIF).Visible = -1
    AtivarAba SHT_NOTIF
    On Error GoTo 0
End Sub

Public Sub AbrirFiltrosBI()
    On Error Resume Next
    ThisWorkbook.Sheets(SHT_BI).Visible = -1
    AtivarAba SHT_BI
    MsgAviso "Ajuste Período / Professor / Plano / Aluno / Unidade nas células B2:B7 e volte ao Dashboard."
    On Error GoTo 0
End Sub

Public Sub AbrirAlertaDestino()
    Dim dest As String
    On Error Resume Next
    dest = NzStr(ActiveCell.Value)
    If dest = "" Then dest = NzStr(LerCelula("01_DASHBOARD", "F40"))
    If Len(dest) > 0 Then NavegarPara dest
    On Error GoTo 0
End Sub
