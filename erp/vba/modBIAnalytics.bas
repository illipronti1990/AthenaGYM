Attribute VB_Name = "modBIAnalytics"
Option Explicit

'============================================================
' Sprint 10.0 — Inteligencia Analitica (extensao do motor BI)
' Indicadores, insights, previsoes, retencao, estoque, simulador
'============================================================

Public Const SHT_INDICADORES As String = "BD_INDICADORES"
Public Const TBL_INDICADORES As String = "tbIndicadores"
Public Const SHT_INSIGHTS_BD As String = "BD_INSIGHTS"
Public Const TBL_INSIGHTS As String = "tbInsights"
Public Const SHT_PREVISOES As String = "BD_PREVISOES"
Public Const TBL_PREVISOES As String = "tbPrevisoes"
Public Const SHT_RISCO As String = "BD_RISCO_RETENCAO"
Public Const TBL_RISCO As String = "tbRiscoRetencao"
Public Const SHT_BI_EXEC As String = "31_BI_EXECUTIVO"
Public Const SHT_INSIGHTS_UI As String = "32_INSIGHTS"

Public Sub IrBIExecutivo(): NavegarPara SHT_BI_EXEC: End Sub
Public Sub IrInsights(): NavegarPara SHT_INSIGHTS_UI: End Sub
Public Sub AbrirBIExecutivoEAtualizar()
    Call AtualizarBI
    NavegarPara SHT_BI_EXEC
End Sub

Public Sub AtualizarInteligenciaAnalitica()
    On Error GoTo TrataErro
    Call AtualizarIndicadores
    Call PreverReceita
    Call PreverCaixa
    Call AnalisarRetencao
    Call AnalisarEstoqueInteligente
    Call GerarInsights
    Call GerarRankingEstrategico
    Call AtualizarPainelExecutivo
    Call AtualizarTelaInsights
    Application.Calculate
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarInteligenciaAnalitica"
End Sub

'--- LTV / CAC ------------------------------------------------

Public Function CalcularLTV() As Double
    Dim ticket As Double, churn As Double
    On Error Resume Next
    ticket = CalcularTicketMedio()
    churn = CalcularChurn()
    If churn <= 0 Then
        CalcularLTV = Round(ticket * 24, 2) ' fallback 24 meses
    Else
        ' LTV aproximado = ticket / (churn mensal em decimal)
        CalcularLTV = Round(ticket / (churn / 100#), 2)
    End If
End Function

Public Function CalcularCAC() As Double
    Dim lo As ListObject, lr As ListRow
    Dim mkt As Double, novos As Long, d As Date
    Dim m As Long, a As Long
    On Error Resume Next
    m = Month(DataAtual())
    a = Year(DataAtual())
    novos = CLng(Val(LerCelula(SHT_BI, "E6")))
    Set lo = ObterTabela(SHT_LANCAMENTOS, TBL_LANCAMENTOS)
    For Each lr In lo.ListRows
        If InStr(1, UCase$(NzStr(LerCampo(lr, "Categoria"))), "MARKET", vbTextCompare) > 0 _
           Or InStr(1, UCase$(NzStr(LerCampo(lr, "Categoria"))), "MARKETING", vbTextCompare) > 0 Then
            If IsDate(LerCampo(lr, "Data")) Then
                d = CDate(LerCampo(lr, "Data"))
                If Month(d) = m And Year(d) = a Then
                    mkt = mkt + Val(LerCampo(lr, "Débito"))
                    If Val(LerCampo(lr, "Débito")) = 0 Then mkt = mkt + Val(LerCampo(lr, "Debito"))
                End If
            End If
        End If
    Next lr
    If mkt <= 0 Then mkt = ObterParametroNumero("BI", "CACEstimadoMes", 2000)
    If novos <= 0 Then
        CalcularCAC = Round(mkt, 2)
    Else
        CalcularCAC = Round(mkt / novos, 2)
    End If
End Function

Public Function PercentualFrequencia() As Double
    Dim ativos As Long, presentes As Long
    Dim lo As ListObject, lr As ListRow
    Dim hoje As Date
    On Error Resume Next
    hoje = DataAtual()
    ativos = ContarAlunosAtivos()
    If TabelaExiste("BD_PRESENCAS", "tbPresencasBD") Then
        Set lo = ObterTabela("BD_PRESENCAS", "tbPresencasBD")
        For Each lr In lo.ListRows
            If IsDate(LerCampo(lr, "Data")) Then
                If CDate(LerCampo(lr, "Data")) = hoje Then presentes = presentes + 1
            End If
        Next lr
    End If
    If ativos <= 0 Then
        PercentualFrequencia = 0
    Else
        PercentualFrequencia = Round(presentes / ativos * 100, 1)
    End If
End Function

Public Function PercentualSaudeEstoque() As Double
    Dim lo As ListObject, lr As ListRow
    Dim tot As Long, ok As Long
    On Error Resume Next
    If Not TabelaExiste("BD_PRODUTOS", "tbProdutos") Then
        PercentualSaudeEstoque = 100
        Exit Function
    End If
    Set lo = ObterTabela("BD_PRODUTOS", "tbProdutos")
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Código"))) = 0 Then GoTo Prox
        tot = tot + 1
        If Val(LerCampo(lr, "Estoque Atual")) > Val(LerCampo(lr, "Estoque Mínimo")) Then ok = ok + 1
Prox:
    Next lr
    If tot <= 0 Then
        PercentualSaudeEstoque = 100
    Else
        PercentualSaudeEstoque = Round(ok / tot * 100, 1)
    End If
End Function

Public Sub AtualizarIndicadores()
    Dim lo As ListObject, lr As ListRow
    Dim ind As String, atual As Double, meta As Double
    Dim ant As Double, varTxt As String, tend As String
    Dim rec As Double, lucro As Double
    On Error GoTo TrataErro
    rec = SomaCreditosMes(Month(DataAtual()), Year(DataAtual()))
    lucro = rec - SomaDebitosMes(Month(DataAtual()), Year(DataAtual()))
    ' KPIs extras no BI_BASE
    GravarCelula SHT_BI, "E37", CalcularLTV()
    GravarCelula SHT_BI, "E38", CalcularCAC()
    GravarCelula SHT_BI, "E39", PercentualFrequencia()
    GravarCelula SHT_BI, "E40", PercentualSaudeEstoque()

    Set lo = ObterTabela(SHT_INDICADORES, TBL_INDICADORES)
    For Each lr In lo.ListRows
        ind = NzStr(LerCampo(lr, "Indicador"))
        meta = Val(LerCampo(lr, "Meta"))
        ant = Val(LerCampo(lr, "Valor Atual"))
        Select Case UCase$(ind)
            Case "RECEITA": atual = rec
            Case "CHURN": atual = CalcularChurn()
            Case "TICKET MÉDIO", "TICKET MEDIO": atual = CalcularTicketMedio()
            Case "INADIMPLÊNCIA", "INADIMPLENCIA": atual = PercentualInadimplencia()
            Case "ALUNOS ATIVOS": atual = ContarAlunosAtivos()
            Case "LTV": atual = CalcularLTV()
            Case "CAC": atual = CalcularCAC()
            Case "FREQUÊNCIA", "FREQUENCIA": atual = PercentualFrequencia()
            Case "ESTOQUE SAÚDE", "ESTOQUE SAUDE": atual = PercentualSaudeEstoque()
            Case "LUCRO": atual = lucro
            Case Else: atual = Val(LerCampo(lr, "Valor Atual"))
        End Select
        If ant = 0 Then
            tend = "▲"
            varTxt = "—"
        ElseIf atual >= ant Then
            tend = "▲"
            varTxt = Format$((atual - ant) / IIf(ant = 0, 1, ant) * 100, "0.0") & "%"
        Else
            tend = "▼"
            varTxt = Format$((atual - ant) / IIf(ant = 0, 1, ant) * 100, "0.0") & "%"
        End If
        ' indicadores "quanto menor melhor"
        If (UCase$(ind) = "CHURN" Or InStr(1, UCase$(ind), "INADIMPL") > 0 Or UCase$(ind) = "CAC") Then
            If atual <= ant Or ant = 0 Then tend = "▼" Else tend = "▲"
        End If
        Call GravarCampo(lr, "Valor Atual", Round(atual, 2))
        Call GravarCampo(lr, "Tendência", tend)
        Call GravarCampo(lr, "Variação", varTxt)
        Call GravarCampo(lr, "Última Atualização", DataAtual())
        If meta <= 0 And MetaNumerica(ind) > 0 Then Call GravarCampo(lr, "Meta", MetaNumerica(ind))
    Next lr
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarIndicadores"
End Sub

Public Sub PreverReceita()
    Dim vals(1 To 6) As Double
    Dim i As Long, m As Long, a As Long, d As Date
    Dim soma As Double, n As Long, media As Double, prev As Double
    Dim slope As Double
    On Error Resume Next
    d = DataAtual()
    For i = 5 To 0 Step -1
        m = Month(DateAdd("m", -i, d))
        a = Year(DateAdd("m", -i, d))
        vals(6 - i) = SomaCreditosMes(m, a)
        If vals(6 - i) > 0 Then
            soma = soma + vals(6 - i)
            n = n + 1
        End If
        GravarCelula SHT_BI_EXEC, "C" & (29 + (5 - i)), Format$(DateAdd("m", -i, d), "MMM/YYYY")
        GravarCelula SHT_BI_EXEC, "D" & (29 + (5 - i)), vals(6 - i)
        GravarCelula SHT_BI_EXEC, "E" & (29 + (5 - i)), IIf(i = 0, "Atual", "↓")
    Next i
    If n >= 2 Then
        slope = (vals(6) - vals(1)) / 5
    Else
        slope = 0
    End If
    If n > 0 Then media = soma / n Else media = 0
    prev = Application.Max(0, vals(6) + slope)
    If prev = 0 Then prev = media * 1.05
    GravarCelula SHT_BI_EXEC, "C35", "Previsão +"
    GravarCelula SHT_BI_EXEC, "D35", Round(prev, 2)
    GravarCelula SHT_BI_EXEC, "E35", "▲"
    Call UpsertPrevisao("Receita", "Mês atual", vals(6), "Série 6 meses")
    Call UpsertPrevisao("Receita", "Próximo mês", Round(prev, 2), "Tendência linear")
    GravarCelula SHT_BI, "E41", Round(prev, 2)
End Sub

Public Sub PreverCaixa()
    Dim saldo As Double, receber As Double, pagar As Double
    Dim c30 As Double, c60 As Double
    On Error Resume Next
    saldo = UltimoSaldoFluxo()
    receber = TotalAReceber()
    pagar = TotalAPagar()
    c30 = saldo + (receber * 0.6) - (pagar * 0.5)
    c60 = saldo + (receber * 0.95) - (pagar * 0.9) + SomaCreditosMes(Month(DataAtual()), Year(DataAtual())) * 0.3
    GravarCelula SHT_BI_EXEC, "I21", "R$ " & Format$(saldo, "#,##0.00")
    GravarCelula SHT_BI_EXEC, "I22", "R$ " & Format$(c30, "#,##0.00")
    GravarCelula SHT_BI_EXEC, "I23", "R$ " & Format$(c60, "#,##0.00")
    Call UpsertPrevisao("Caixa", "Hoje", Round(saldo, 2), "Saldo fluxo")
    Call UpsertPrevisao("Caixa", "30 dias", Round(c30, 2), "Receber - Pagar")
    Call UpsertPrevisao("Caixa", "60 dias", Round(c60, 2), "Receber - Pagar")
    GravarCelula SHT_BI, "E42", Round(c30, 2)
End Sub

Private Sub UpsertPrevisao(ByVal tipo As String, ByVal horizonte As String, ByVal valor As Double, ByVal base As String)
    Dim lo As ListObject, lr As ListRow
    Dim achou As Boolean
    On Error Resume Next
    Set lo = ObterTabela(SHT_PREVISOES, TBL_PREVISOES)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Tipo")), tipo, vbTextCompare) = 0 _
           And StrComp(NzStr(LerCampo(lr, "Horizonte")), horizonte, vbTextCompare) = 0 Then
            Call GravarCampo(lr, "Valor", valor)
            Call GravarCampo(lr, "Base", base)
            Call GravarCampo(lr, "Atualizado", DataAtual())
            achou = True
            Exit Sub
        End If
    Next lr
    If Not achou Then
        Call AdicionarRegistro(SHT_PREVISOES, TBL_PREVISOES, _
            Array("Tipo", "Horizonte", "Valor", "Base", "Atualizado"), _
            Array(tipo, horizonte, valor, base, DataAtual()))
    End If
End Sub

Public Sub AnalisarRetencao()
    Dim loA As ListObject, lrA As ListRow
    Dim mat As String, nome As String, score As Long
    Dim diasAcesso As Long, atraso As Boolean, semAval As Boolean
    Dim planoVence As Boolean, freqBaixa As Boolean
    Dim cls As String, rec As String
    Dim cols As Variant, vals As Variant
    On Error GoTo TrataErro
    Call LimparTabelaRisco
    Set loA = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    For Each lrA In loA.ListRows
        If UCase$(NzStr(LerCampo(lrA, "Status"))) <> "ATIVO" _
           And UCase$(NzStr(LerCampo(lrA, "Status"))) <> "INADIMPLENTE" Then GoTo Prox
        mat = NzStr(LerCampo(lrA, "Matrícula"))
        nome = NzStr(LerCampo(lrA, "Nome"))
        If Len(mat) = 0 Then GoTo Prox
        score = 0
        diasAcesso = DiasDesdeUltimoAcesso(mat)
        atraso = AlunoComAtraso(mat)
        semAval = AlunoSemAvaliacaoRecente(mat)
        planoVence = AlunoPlanoVencendo(lrA)
        freqBaixa = (diasAcesso >= CLng(ObterParametroNumero("BI", "DiasSemAcessoRisco", 15)))
        If freqBaixa Then score = score + 25
        If atraso Then score = score + 30
        If semAval Then score = score + 15
        If planoVence Then score = score + 20
        If diasAcesso >= 30 Then score = score + 10
        If score >= 70 Then
            cls = "🔴 Alto risco"
            rec = "Entrar em contato agora"
        ElseIf score >= 40 Then
            cls = "🟡 Médio risco"
            rec = "Oferecer avaliação / treino"
        Else
            cls = "🟢 Baixo risco"
            rec = "Manter acompanhamento"
        End If
        If score < 40 Then GoTo Prox ' painel foca medio/alto; grava todos altos
        cols = Array("Matrícula", "Aluno", "Score", "Classificação", "Frequência", "Mensalidade", _
                     "Dias sem acesso", "Avaliação", "Plano vence", "Recomendação")
        vals = Array(mat, nome, score, cls, IIf(freqBaixa, "Baixa", "OK"), IIf(atraso, "Atrasada", "Em dia"), _
                     diasAcesso, IIf(semAval, "Atrasada", "OK"), IIf(planoVence, "Em breve", "OK"), rec)
        Call AdicionarRegistro(SHT_RISCO, TBL_RISCO, cols, vals)
Prox:
    Next lrA
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AnalisarRetencao"
End Sub

Private Sub LimparTabelaRisco()
    Dim lo As ListObject
    On Error Resume Next
    Set lo = ObterTabela(SHT_RISCO, TBL_RISCO)
    Do While lo.ListRows.Count > 0
        lo.ListRows(1).Delete
    Loop
End Sub

Private Function DiasDesdeUltimoAcesso(ByVal mat As String) As Long
    Dim lo As ListObject, lr As ListRow
    Dim maxD As Date, d As Date, achou As Boolean
    On Error Resume Next
    maxD = DateSerial(2000, 1, 1)
    If TabelaExiste("BD_ACESSOS", "tbAcessos") Then
        Set lo = ObterTabela("BD_ACESSOS", "tbAcessos")
        For Each lr In lo.ListRows
            If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) = 0 Then
                If IsDate(LerCampo(lr, "Data")) Then
                    d = CDate(LerCampo(lr, "Data"))
                    If d > maxD Then maxD = d: achou = True
                End If
            End If
        Next lr
    End If
    If Not achou Then
        DiasDesdeUltimoAcesso = 45
    Else
        DiasDesdeUltimoAcesso = DateDiff("d", maxD, DataAtual())
    End If
End Function

Private Function AlunoComAtraso(ByVal mat As String) As Boolean
    Dim lo As ListObject, lr As ListRow
    On Error Resume Next
    Set lo = ObterTabela(SHT_RECEBER_BD, TBL_RECEBER_BD)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) = 0 Then
            If StrComp(NzStr(LerCampo(lr, "Situação")), "Atrasado", vbTextCompare) = 0 Then
                AlunoComAtraso = True
                Exit Function
            End If
        End If
    Next lr
    AlunoComAtraso = False
End Function

Private Function AlunoSemAvaliacaoRecente(ByVal mat As String) As Boolean
    Dim lo As ListObject, lr As ListRow
    Dim maxD As Date, d As Date, achou As Boolean
    Dim dias As Long
    On Error Resume Next
    dias = CLng(ObterParametroNumero("Treinos", "DiasReavaliacao", 60))
    maxD = DateSerial(2000, 1, 1)
    If TabelaExiste("BD_AVALIACOES", "tbAvaliacoes") Then
        Set lo = ObterTabela("BD_AVALIACOES", "tbAvaliacoes")
        For Each lr In lo.ListRows
            If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) = 0 Then
                If IsDate(LerCampo(lr, "Data")) Then
                    d = CDate(LerCampo(lr, "Data"))
                    If d > maxD Then maxD = d: achou = True
                End If
            End If
        Next lr
    End If
    If Not achou Then
        AlunoSemAvaliacaoRecente = True
    Else
        AlunoSemAvaliacaoRecente = (DateDiff("d", maxD, DataAtual()) > dias)
    End If
End Function

Private Function AlunoPlanoVencendo(ByVal lrA As ListRow) As Boolean
    ' Sem campo de vencimento no cadastro: usa aniversario de plano via DataCadastro + 30 dias proximos do dia
    Dim d As Date, dias As Long, prox As Date
    On Error Resume Next
    dias = CLng(ObterParametroNumero("CRM", "DiasPlanoVencendo", 30))
    If IsDate(LerCampo(lrA, "DataCadastro")) Then
        d = CDate(LerCampo(lrA, "DataCadastro"))
        prox = DateSerial(Year(DataAtual()), Month(d), Day(d))
        If prox < DataAtual() Then prox = DateAdd("m", 1, prox)
        AlunoPlanoVencendo = (prox >= DataAtual() And prox <= DataAtual() + dias)
    Else
        AlunoPlanoVencendo = False
    End If
End Function

Public Sub AnalisarEstoqueInteligente()
    Dim lo As ListObject, lr As ListRow
    Dim r As Long, cod As String, nome As String
    Dim atual As Double, minE As Double, dias As Long
    Dim mediaDia As Double, sug As Double
    On Error Resume Next
    Call LimparIntervalo(SHT_INSIGHTS_UI, "H19:K26")
    If Not TabelaExiste("BD_PRODUTOS", "tbProdutos") Then Exit Sub
    Set lo = ObterTabela("BD_PRODUTOS", "tbProdutos")
    r = 19
    For Each lr In lo.ListRows
        If r > 26 Then Exit For
        cod = NzStr(LerCampo(lr, "Código"))
        If Len(cod) = 0 Then GoTo Prox
        atual = Val(LerCampo(lr, "Estoque Atual"))
        minE = Val(LerCampo(lr, "Estoque Mínimo"))
        mediaDia = MediaVendaDiariaProduto(cod)
        If mediaDia <= 0 Then mediaDia = 0.2
        dias = CLng(atual / mediaDia)
        If atual <= minE Or dias <= 21 Then
            sug = Application.Max(minE * 2 - atual, minE)
            GravarCelula SHT_INSIGHTS_UI, "H" & r, NzStr(LerCampo(lr, "Produto"))
            GravarCelula SHT_INSIGHTS_UI, "I" & r, dias
            GravarCelula SHT_INSIGHTS_UI, "J" & r, "✔ Esta semana"
            GravarCelula SHT_INSIGHTS_UI, "K" & r, Application.RoundUp(sug, 0)
            r = r + 1
        End If
Prox:
    Next lr
End Sub

Private Function MediaVendaDiariaProduto(ByVal cod As String) As Double
    Dim lo As ListObject, lr As ListRow
    Dim q As Double
    On Error Resume Next
    If Not TabelaExiste("BD_VENDA_ITENS", "tbVendaItens") Then
        MediaVendaDiariaProduto = 0.15
        Exit Function
    End If
    Set lo = ObterTabela("BD_VENDA_ITENS", "tbVendaItens")
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Código")), cod, vbTextCompare) = 0 Then
            q = q + Val(LerCampo(lr, "Qtde"))
        End If
    Next lr
    MediaVendaDiariaProduto = q / 30#
End Function

Public Sub GerarInsights()
    Dim msgs() As String
    Dim n As Long, i As Long, id As Long
    Dim rec As Double, recAnt As Double, m As Long, a As Long
    Dim inad As Double, pico As String
    Dim lo As ListObject
    On Error GoTo TrataErro
    ReDim msgs(1 To 12)
    n = 0
    rec = SomaCreditosMes(Month(DataAtual()), Year(DataAtual()))
    m = Month(DateAdd("m", -1, DataAtual()))
    a = Year(DateAdd("m", -1, DataAtual()))
    recAnt = SomaCreditosMes(m, a)
    If recAnt > 0 Then
        n = n + 1
        msgs(n) = "📊 Insight  A receita " & IIf(rec >= recAnt, "cresceu ", "caiu ") & _
                  Format$(Abs((rec - recAnt) / recAnt * 100), "0.0") & "% em relação ao mês anterior."
    End If
    inad = PercentualInadimplencia()
    n = n + 1
    msgs(n) = "📊 Insight  Inadimplência atual: " & Format$(inad, "0.0") & "% (meta " & _
              Format$(MetaNumerica("Inadimplência"), "0") & "%)."
    n = n + 1
    msgs(n) = "📊 Insight  Ticket médio: R$ " & Format$(CalcularTicketMedio(), "#,##0.00") & _
              " | LTV estimado: R$ " & Format$(CalcularLTV(), "#,##0.00")
    n = n + 1
    msgs(n) = "📊 Insight  CAC estimado: R$ " & Format$(CalcularCAC(), "#,##0.00") & _
              " | Churn: " & Format$(CalcularChurn(), "0.0") & "%"
    pico = InsightHorarioPico()
    If Len(pico) > 0 Then
        n = n + 1
        msgs(n) = "📊 Insight  " & pico
    End If
    n = n + 1
    msgs(n) = "📊 Insight  Plano destaque: " & InsightPlanoTop()
    n = n + 1
    msgs(n) = "📊 Insight  Produto mais vendido: " & InsightProdutoTop()
    n = n + 1
    msgs(n) = "📊 Insight  Saúde do estoque: " & Format$(PercentualSaudeEstoque(), "0.0") & "% dos SKUs acima do mínimo."

    ' limpa e regrava BD_INSIGHTS
    Set lo = ObterTabela(SHT_INSIGHTS_BD, TBL_INSIGHTS)
    Do While lo.ListRows.Count > 0
        lo.ListRows(1).Delete
    Loop
    id = 0
    For i = 1 To n
        id = id + 1
        Call AdicionarRegistro(SHT_INSIGHTS_BD, TBL_INSIGHTS, _
            Array("ID", "Data", "Tipo", "Mensagem", "Prioridade", "Módulo"), _
            Array(id, DataAtual(), "Auto", msgs(i), "📊", "BI"))
    Next i
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "GerarInsights"
End Sub

Private Function InsightHorarioPico() As String
    Dim lo As ListObject, lr As ListRow
    Dim counts(0 To 23) As Long
    Dim h As Long, maxH As Long, maxC As Long, tot As Long
    Dim ent As String
    On Error Resume Next
    If Not TabelaExiste("BD_ACESSOS", "tbAcessos") Then Exit Function
    Set lo = ObterTabela("BD_ACESSOS", "tbAcessos")
    For Each lr In lo.ListRows
        ent = NzStr(LerCampo(lr, "Entrada"))
        If Len(ent) >= 2 Then
            h = CLng(Val(Left$(ent, 2)))
            If h >= 0 And h <= 23 Then
                counts(h) = counts(h) + 1
                tot = tot + 1
            End If
        End If
    Next lr
    maxC = -1
    For h = 0 To 23
        If counts(h) > maxC Then maxC = counts(h): maxH = h
    Next h
    If tot <= 0 Or maxC <= 0 Then Exit Function
    InsightHorarioPico = "O horário " & Format$(maxH, "00") & "h–" & Format$(maxH + 1, "00") & _
                         "h representa " & Format$(maxC / tot * 100, "0") & "% das entradas amostradas."
End Function

Private Function InsightPlanoTop() As String
    Dim lo As ListObject, lr As ListRow
    Dim dict As Object, k As Variant, topK As String, topN As Long
    On Error Resume Next
    Set dict = CreateObject("Scripting.Dictionary")
    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    For Each lr In lo.ListRows
        If UCase$(NzStr(LerCampo(lr, "Status"))) = "ATIVO" Then
            k = NzStr(LerCampo(lr, "Plano"))
            If Len(CStr(k)) = 0 Then k = "(sem plano)"
            If dict.Exists(k) Then dict(k) = dict(k) + 1 Else dict.Add k, 1
        End If
    Next lr
    topN = -1
    For Each k In dict.Keys
        If dict(k) > topN Then topN = dict(k): topK = CStr(k)
    Next k
    If topN < 0 Then
        InsightPlanoTop = "—"
    Else
        InsightPlanoTop = topK & " (" & topN & " alunos)"
    End If
End Function

Private Function InsightProdutoTop() As String
    Dim lo As ListObject, lr As ListRow
    Dim dict As Object, k As Variant, topK As String, topN As Double
    On Error Resume Next
    Set dict = CreateObject("Scripting.Dictionary")
    If Not TabelaExiste("BD_VENDA_ITENS", "tbVendaItens") Then
        InsightProdutoTop = "—"
        Exit Function
    End If
    Set lo = ObterTabela("BD_VENDA_ITENS", "tbVendaItens")
    For Each lr In lo.ListRows
        k = NzStr(LerCampo(lr, "Produto"))
        If Len(CStr(k)) = 0 Then GoTo Prox
        If dict.Exists(k) Then dict(k) = dict(k) + Val(LerCampo(lr, "Qtde")) Else dict.Add k, Val(LerCampo(lr, "Qtde"))
Prox:
    Next lr
    topN = -1
    For Each k In dict.Keys
        If dict(k) > topN Then topN = dict(k): topK = CStr(k)
    Next k
    If topN < 0 Then InsightProdutoTop = "—" Else InsightProdutoTop = topK & " (" & topN & " un.)"
End Function

Private Function InsightProfessorTop() As String
    Dim lo As ListObject, lr As ListRow
    Dim dict As Object, k As Variant, topK As String, topN As Long
    On Error Resume Next
    Set dict = CreateObject("Scripting.Dictionary")
    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    For Each lr In lo.ListRows
        If UCase$(NzStr(LerCampo(lr, "Status"))) = "ATIVO" Then
            k = NzStr(LerCampo(lr, "Professor"))
            If Len(CStr(k)) = 0 Then k = "(sem professor)"
            If dict.Exists(k) Then dict(k) = dict(k) + 1 Else dict.Add k, 1
        End If
    Next lr
    topN = -1
    For Each k In dict.Keys
        If dict(k) > topN Then topN = dict(k): topK = CStr(k)
    Next k
    If topN < 0 Then InsightProfessorTop = "—" Else InsightProfessorTop = topK
End Function

Private Function InsightCanalTop() As String
    Dim lo As ListObject, lr As ListRow
    Dim dict As Object, k As Variant, topK As String, topN As Long
    On Error Resume Next
    Set dict = CreateObject("Scripting.Dictionary")
    If TabelaExiste("BD_LEADS", "tbLeads") Then
        Set lo = ObterTabela("BD_LEADS", "tbLeads")
        For Each lr In lo.ListRows
            k = NzStr(LerCampo(lr, "Origem"))
            If Len(CStr(k)) = 0 Then k = "Indicação"
            If dict.Exists(k) Then dict(k) = dict(k) + 1 Else dict.Add k, 1
        Next lr
    End If
    topN = -1
    For Each k In dict.Keys
        If dict(k) > topN Then topN = dict(k): topK = CStr(k)
    Next k
    If topN < 0 Then InsightCanalTop = "Indicação / Balcão" Else InsightCanalTop = topK
End Function

Public Sub GerarRankingEstrategico()
    On Error Resume Next
    GravarCelula SHT_BI_EXEC, "C40", "Professor"
    GravarCelula SHT_BI_EXEC, "D40", InsightProfessorTop()
    GravarCelula SHT_BI_EXEC, "E40", "★★★★★"
    GravarCelula SHT_BI_EXEC, "F40", "Maior base de alunos"
    GravarCelula SHT_BI_EXEC, "C41", "Plano"
    GravarCelula SHT_BI_EXEC, "D41", InsightPlanoTop()
    GravarCelula SHT_BI_EXEC, "E41", "★★★★★"
    GravarCelula SHT_BI_EXEC, "F41", "Mais adotado"
    GravarCelula SHT_BI_EXEC, "C42", "Produto"
    GravarCelula SHT_BI_EXEC, "D42", InsightProdutoTop()
    GravarCelula SHT_BI_EXEC, "E42", "★★★★★"
    GravarCelula SHT_BI_EXEC, "F42", "PDV"
    GravarCelula SHT_BI_EXEC, "C43", "Canal"
    GravarCelula SHT_BI_EXEC, "D43", InsightCanalTop()
    GravarCelula SHT_BI_EXEC, "E43", "★★★★"
    GravarCelula SHT_BI_EXEC, "F43", "Aquisição"
End Sub

Public Sub AtualizarPainelExecutivo()
    Dim rec As Double, lucro As Double, ativos As Long
    Dim inad As Double, churn As Double
    On Error Resume Next
    rec = SomaCreditosMes(Month(DataAtual()), Year(DataAtual()))
    lucro = rec - SomaDebitosMes(Month(DataAtual()), Year(DataAtual()))
    ativos = ContarAlunosAtivos()
    inad = PercentualInadimplencia()
    churn = CalcularChurn()

    GravarCelula SHT_BI_EXEC, "C8", "R$ " & Format$(rec, "#,##0.00")
    GravarCelula SHT_BI_EXEC, "E8", ativos
    GravarCelula SHT_BI_EXEC, "G8", Format$(inad, "0.0") & "%"
    GravarCelula SHT_BI_EXEC, "I8", "R$ " & Format$(lucro, "#,##0.00")

    GravarCelula SHT_BI_EXEC, "C12", Format$(churn, "0.0") & "%"
    GravarCelula SHT_BI_EXEC, "E12", "R$ " & Format$(CalcularTicketMedio(), "#,##0.00")
    GravarCelula SHT_BI_EXEC, "G12", "R$ " & Format$(CalcularLTV(), "#,##0.00")
    GravarCelula SHT_BI_EXEC, "I12", "R$ " & Format$(CalcularCAC(), "#,##0.00")

    GravarCelula SHT_BI_EXEC, "C16", Format$(PercentualFrequencia(), "0.0") & "%"
    GravarCelula SHT_BI_EXEC, "E16", Format$(PercentualSaudeEstoque(), "0.0") & "%"
    GravarCelula SHT_BI_EXEC, "G16", "R$ " & Format$(Val(LerCelula(SHT_BI, "E41")), "#,##0.00")
    GravarCelula SHT_BI_EXEC, "I16", "R$ " & Format$(Val(LerCelula(SHT_BI, "E42")), "#,##0.00")

    GravarCelula SHT_BI_EXEC, "D21", InsightPlanoTop()
    GravarCelula SHT_BI_EXEC, "D22", InsightHorarioPicoResumo()
    GravarCelula SHT_BI_EXEC, "D23", InsightProfessorTop()
    GravarCelula SHT_BI_EXEC, "D24", InsightProdutoTop()
    GravarCelula SHT_BI_EXEC, "D25", InsightCanalTop()

    Call PreencherMetasExecutivo
End Sub

Private Function InsightHorarioPicoResumo() As String
    Dim s As String
    s = InsightHorarioPico()
    If Len(s) = 0 Then
        InsightHorarioPicoResumo = "18h–20h"
    ElseIf InStr(s, "horário ") > 0 Then
        InsightHorarioPicoResumo = Mid$(s, InStr(s, "horário ") + 8, 10)
    Else
        InsightHorarioPicoResumo = Left$(s, 20)
    End If
End Function

Private Sub PreencherMetasExecutivo()
    Dim lo As ListObject, lr As ListRow
    Dim r As Long, prog As Double, barra As String
    On Error Resume Next
    Call LimparIntervalo(SHT_BI_EXEC, "H29:K36")
    Set lo = ObterTabela(SHT_METAS, TBL_METAS)
    r = 29
    For Each lr In lo.ListRows
        If r > 36 Then Exit For
        prog = Val(LerCampo(lr, "Progresso"))
        barra = String$(Application.Min(12, CLng(prog * 12)), ChrW(&H2588)) & _
                String$(Application.Max(0, 12 - CLng(prog * 12)), ChrW(&H2591))
        GravarCelula SHT_BI_EXEC, "H" & r, NzStr(LerCampo(lr, "Indicador"))
        GravarCelula SHT_BI_EXEC, "I" & r, Format$(prog * 100, "0") & "%"
        GravarCelula SHT_BI_EXEC, "J" & r, barra
        GravarCelula SHT_BI_EXEC, "K" & r, NzStr(LerCampo(lr, "Semáforo"))
        r = r + 1
    Next lr
End Sub

Public Sub AtualizarTelaInsights()
    Dim lo As ListObject, lr As ListRow
    Dim r As Long, i As Long
    On Error Resume Next
    Call LimparIntervalo(SHT_INSIGHTS_UI, "C8:K15")
    Set lo = ObterTabela(SHT_INSIGHTS_BD, TBL_INSIGHTS)
    r = 8
    For Each lr In lo.ListRows
        If r > 15 Then Exit For
        GravarCelula SHT_INSIGHTS_UI, "C" & r, NzStr(LerCampo(lr, "Mensagem"))
        r = r + 1
    Next lr

    Call LimparIntervalo(SHT_INSIGHTS_UI, "C19:F26")
    Set lo = ObterTabela(SHT_RISCO, TBL_RISCO)
    r = 19
    For Each lr In lo.ListRows
        If r > 26 Then Exit For
        If InStr(1, NzStr(LerCampo(lr, "Classificação")), "Baixo", vbTextCompare) > 0 Then GoTo Prox
        GravarCelula SHT_INSIGHTS_UI, "C" & r, NzStr(LerCampo(lr, "Aluno"))
        GravarCelula SHT_INSIGHTS_UI, "D" & r, LerCampo(lr, "Score")
        GravarCelula SHT_INSIGHTS_UI, "E" & r, NzStr(LerCampo(lr, "Classificação"))
        GravarCelula SHT_INSIGHTS_UI, "F" & r, NzStr(LerCampo(lr, "Recomendação"))
        r = r + 1
Prox:
    Next lr

    Call LimparIntervalo(SHT_INSIGHTS_UI, "C38:G47")
    Set lo = ObterTabela(SHT_INDICADORES, TBL_INDICADORES)
    r = 38
    For Each lr In lo.ListRows
        If r > 47 Then Exit For
        GravarCelula SHT_INSIGHTS_UI, "C" & r, NzStr(LerCampo(lr, "Indicador"))
        GravarCelula SHT_INSIGHTS_UI, "D" & r, LerCampo(lr, "Valor Atual")
        GravarCelula SHT_INSIGHTS_UI, "E" & r, LerCampo(lr, "Meta")
        GravarCelula SHT_INSIGHTS_UI, "F" & r, NzStr(LerCampo(lr, "Tendência"))
        GravarCelula SHT_INSIGHTS_UI, "G" & r, NzStr(LerCampo(lr, "Variação"))
        r = r + 1
    Next lr
End Sub

Public Sub SimularAumentoPlano()
    Dim pct As Double, base As Double, delta As Double
    On Error GoTo TrataErro
    pct = Val(LerCelula(SHT_INSIGHTS_UI, "D30"))
    If pct = 0 Then pct = 10
    base = SomaCreditosMes(Month(DataAtual()), Year(DataAtual()))
    ' assume Premium ~ 40% da receita
    delta = base * 0.4 * (pct / 100#)
    GravarCelula SHT_INSIGHTS_UI, "D31", "Receita prevista +" & "R$ " & Format$(delta, "#,##0.00") & "/mês"
    RegistrarLog "Simulacao Premium +" & pct & "%", "BI", "Delta=" & delta
    MsgOk "Simulação: aumento de " & pct & "% no Premium" & vbCrLf & _
          "Impacto estimado: +R$ " & Format$(delta, "#,##0.00") & " / mês"
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "SimularAumentoPlano"
End Sub

Public Sub SimularNovoProfessor()
    Dim custo As Double, cap As Long, ticket As Double, potencial As Double
    On Error GoTo TrataErro
    custo = Val(LerCelula(SHT_INSIGHTS_UI, "I30"))
    If custo <= 0 Then custo = 3500
    cap = CLng(Val(LerCelula(SHT_INSIGHTS_UI, "I31")))
    If cap <= 0 Then cap = 90
    ticket = CalcularTicketMedio()
    If ticket <= 0 Then ticket = 150
    potencial = cap * ticket * 0.35 ' ocupação inicial 35%
    GravarCelula SHT_INSIGHTS_UI, "I32", _
        "Lucro previsto " & IIf(potencial >= custo, "+", "") & _
        "R$ " & Format$(potencial - custo, "#,##0.00") & " | Capacidade +" & cap
    RegistrarLog "Simulacao novo professor", "BI", "Custo=" & custo & " Cap=" & cap
    MsgOk "Simulação: +1 professor" & vbCrLf & _
          "Custo: R$ " & Format$(custo, "#,##0.00") & vbCrLf & _
          "Capacidade: +" & cap & " alunos" & vbCrLf & _
          "Resultado estimado: R$ " & Format$(potencial - custo, "#,##0.00") & "/mês"
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "SimularNovoProfessor"
End Sub
