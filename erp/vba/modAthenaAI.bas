Attribute VB_Name = "modAthenaAI"
Option Explicit

'============================================================
' Sprint 12.0 — ATHENA AI + Automação Total
' Motor de inteligência rule-based sobre o ERP
' Financeiro · Comercial · Operacional · Retenção · Estoque
'============================================================

Public Const SHT_ATHENA As String = "36_ATHENA_AI"
Public Const SHT_RECOM_UI As String = "37_RECOMENDACOES"
Public Const SHT_RECOM_BD As String = "BD_RECOMENDACOES"
Public Const TBL_RECOM As String = "tbRecomendacoes"
Public Const SHT_ATHENA_CHAT As String = "BD_ATHENA_CHAT"
Public Const TBL_ATHENA_CHAT As String = "tbAthenaChat"
Public Const SHT_INSIGHTS_BD As String = "BD_INSIGHTS"
Public Const TBL_INSIGHTS As String = "tbInsights"
Public Const SHT_PREVISOES As String = "BD_PREVISOES"
Public Const TBL_PREVISOES As String = "tbPrevisoes"
Public Const SHT_RISCO As String = "BD_RISCO_RETENCAO"
Public Const TBL_RISCO As String = "tbRiscoRetencao"

Public Sub IrAthenaAI(): NavegarPara SHT_ATHENA: End Sub
Public Sub IrRecomendacoes(): NavegarPara SHT_RECOM_UI: End Sub

Public Sub AbrirAthenaEAtualizar()
    Call AtualizarAthenaAI
    NavegarPara SHT_ATHENA
End Sub

'--- Orquestrador ------------------------------------------------

Public Sub AtualizarAthenaAI()
    On Error GoTo TrataErro
    Call AtualizarInteligenciaAnalitica
    Call AnalisarFinanceiro
    Call AnalisarCRM
    Call AnalisarEstoque
    Call AnalisarTreinos
    Call AnalisarRetencaoAthena
    Call AtualizarRecomendacoes
    Call GerarInsightsAthena
    Call AtualizarPrevisoesAthena
    Call GerarAutomacoes
    Call AtualizarTelaAthena
    Call AtualizarTelaRecomendacoes
    Application.Calculate
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarAthenaAI"
End Sub

Public Sub AthenaGerarInsights()
    Call GerarInsightsAthena
    Call AtualizarTelaAthena
End Sub

'--- Análises por domínio ----------------------------------------

Public Sub AnalisarFinanceiro()
    Dim rec As Double, recAnt As Double, desp As Double
    Dim m As Long, a As Long, varRec As Double, varDesp As Double
    Dim msg As String
    On Error Resume Next
    rec = SomaCreditosMes(Month(DataAtual()), Year(DataAtual()))
    m = Month(DateAdd("m", -1, DataAtual()))
    a = Year(DateAdd("m", -1, DataAtual()))
    recAnt = SomaCreditosMes(m, a)
    desp = SomaDebitosMes(Month(DataAtual()), Year(DataAtual()))
    If recAnt > 0 Then varRec = (rec - recAnt) / recAnt * 100#
    If desp > 0 And rec > 0 Then varDesp = desp / rec * 100#

    msg = "📈 Financeiro  Receita R$ " & Format$(rec, "#,##0.00")
    If recAnt > 0 Then
        msg = msg & " (" & IIf(varRec >= 0, "▲ ", "▼ ") & Format$(Abs(varRec), "0.0") & "% vs mês anterior)."
    End If
    If varDesp >= 15 Then
        msg = msg & " Despesas relevantes (" & Format$(varDesp, "0.0") & "% da receita) — revise fornecedores."
    End If
    Call RegistrarInsightAthena("Financeiro", msg, "📈", "Financeiro")
End Sub

Public Sub AnalisarCRM()
    Dim lo As ListObject, lr As ListRow
    Dim semContato As Long, leads As Long
    Dim canalTop As String, maxN As Long
    Dim dict As Object, k As Variant, n As Long
    Dim d As Date, dias As Long
    On Error Resume Next
    Set dict = CreateObject("Scripting.Dictionary")
    If TabelaExiste("BD_LEADS", "tbLeads") Then
        Set lo = ObterTabela("BD_LEADS", "tbLeads")
        For Each lr In lo.ListRows
            leads = leads + 1
            If IsDate(LerCampo(lr, "Último Contato")) Then
                d = CDate(LerCampo(lr, "Último Contato"))
            ElseIf IsDate(LerCampo(lr, "Data")) Then
                d = CDate(LerCampo(lr, "Data"))
            Else
                d = DataAtual() - 10
            End If
            dias = DateDiff("d", d, DataAtual())
            If dias >= 5 And InStr(1, UCase$(NzStr(LerCampo(lr, "Status"))), "GANHO", vbTextCompare) = 0 _
               And InStr(1, UCase$(NzStr(LerCampo(lr, "Status"))), "PERDIDO", vbTextCompare) = 0 Then
                semContato = semContato + 1
            End If
            k = Trim$(NzStr(LerCampo(lr, "Origem")))
            If Len(k) = 0 Then k = Trim$(NzStr(LerCampo(lr, "Canal")))
            If Len(k) = 0 Then k = "Outros"
            If dict.Exists(k) Then dict(k) = dict(k) + 1 Else dict.Add k, 1
        Next lr
    End If
    maxN = 0: canalTop = "—"
    For Each k In dict.Keys
        n = CLng(dict(k))
        If n > maxN Then maxN = n: canalTop = CStr(k)
    Next k
    If leads > 0 And maxN > 0 Then
        Call RegistrarInsightAthena("Comercial", _
            "📣 Comercial  " & canalTop & " concentra " & Format$(maxN / leads * 100, "0") & _
            "% dos leads. Invista mais nesse canal.", "📣", "CRM")
    End If
    If semContato > 0 Then
        Call RegistrarInsightAthena("CRM", _
            "📞 CRM  " & semContato & " lead(s) sem contato há 5+ dias — criar tarefas de follow-up.", "📞", "CRM")
    End If
End Sub

Public Sub AnalisarEstoque()
    Dim lo As ListObject, lr As ListRow
    Dim nome As String, q As Double, minQ As Double, faltas As Long
    Dim topNome As String, topDias As Double, dias As Double, media As Double
    On Error Resume Next
    faltas = 0: topDias = 9999: topNome = "—"
    If Not TabelaExiste("BD_PRODUTOS", "tbProdutos") Then Exit Sub
    Set lo = ObterTabela("BD_PRODUTOS", "tbProdutos")
    For Each lr In lo.ListRows
        nome = NzStr(LerCampo(lr, "Nome"))
        If Len(nome) = 0 Then nome = NzStr(LerCampo(lr, "Produto"))
        q = Val(LerCampo(lr, "Estoque"))
        If q = 0 Then q = Val(LerCampo(lr, "Qtde"))
        minQ = Val(LerCampo(lr, "Mínimo"))
        If minQ = 0 Then minQ = Val(LerCampo(lr, "Minimo"))
        If q <= minQ Then faltas = faltas + 1
        media = MediaVendaDiariaProdutoSafe(NzStr(LerCampo(lr, "Código")))
        If media <= 0 Then media = MediaVendaDiariaProdutoSafe(NzStr(LerCampo(lr, "Codigo")))
        If media > 0 Then
            dias = q / media
            If dias < topDias Then topDias = dias: topNome = nome
        End If
    Next lr
    If faltas > 0 Then
        Call RegistrarInsightAthena("Estoque", _
            "📦 Estoque  " & faltas & " produto(s) no mínimo ou abaixo — priorize compra.", "📦", "Estoque")
    End If
    If topDias < 9999 And topDias <= 30 Then
        Call RegistrarInsightAthena("Estoque", _
            "📦 Estoque  " & topNome & " deve acabar em cerca de " & Format$(topDias, "0") & " dias.", "📦", "Estoque")
    End If
End Sub

Public Sub AnalisarTreinos()
    Dim lo As ListObject, lr As ListRow
    Dim desatual As Long, diasLimite As Long, d As Date
    On Error Resume Next
    diasLimite = 45
    If Not TabelaExiste("BD_TREINOS", "tbTreinos") Then Exit Sub
    Set lo = ObterTabela("BD_TREINOS", "tbTreinos")
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) = 0 _
           Or Len(NzStr(LerCampo(lr, "Status"))) = 0 Then
            If IsDate(LerCampo(lr, "Data Início")) Then
                d = CDate(LerCampo(lr, "Data Início"))
            ElseIf IsDate(LerCampo(lr, "Data")) Then
                d = CDate(LerCampo(lr, "Data"))
            Else
                d = DataAtual()
            End If
            If DateDiff("d", d, DataAtual()) >= diasLimite Then desatual = desatual + 1
        End If
    Next lr
    If desatual > 0 Then
        Call RegistrarInsightAthena("Treinos", _
            "🏋 Treinos  " & desatual & " ficha(s) com 45+ dias — sugerir atualização.", "🏋", "Treinos")
    End If
End Sub

Public Sub AnalisarRetencaoAthena()
    Dim lo As ListObject, lr As ListRow
    Dim alto As Long, medio As Long, baixo As Long, score As Double
    Dim cls As String
    On Error Resume Next
    Call modBIAnalytics.AnalisarRetencao
    If Not TabelaExiste(SHT_RISCO, TBL_RISCO) Then Exit Sub
    Set lo = ObterTabela(SHT_RISCO, TBL_RISCO)
    For Each lr In lo.ListRows
        score = Val(LerCampo(lr, "Score"))
        cls = NzStr(LerCampo(lr, "Classificação"))
        If score >= 71 Or InStr(1, cls, "Alto", vbTextCompare) > 0 Then
            alto = alto + 1
        ElseIf score >= 31 Or InStr(1, cls, "Médio", vbTextCompare) > 0 Or InStr(1, cls, "Medio", vbTextCompare) > 0 Then
            medio = medio + 1
        Else
            baixo = baixo + 1
        End If
    Next lr
    Call RegistrarInsightAthena("Retenção", _
        "🛡 Retenção  Baixo " & baixo & " · Médio " & medio & " · Alto " & alto & _
        " (0–30 / 31–70 / 71–100).", "🛡", "Retenção")
End Sub

'--- Recomendações -----------------------------------------------

Public Sub AtualizarRecomendacoes()
    Dim lo As ListObject
    Dim cob As Long, estoque As Long, treinos As Long, reaval As Long, riscoAlto As Long
    Dim id As Long
    On Error GoTo TrataErro

    cob = ContarCobrancasPendentes()
    estoque = ContarProdutosAbaixoMinimo()
    treinos = ContarTreinosDesatualizados()
    reaval = ContarReavaliacoesPendentes()
    riscoAlto = ContarRiscoAlto()

    Set lo = ObterTabela(SHT_RECOM_BD, TBL_RECOM)
    Do While lo.ListRows.Count > 0
        lo.ListRows(1).Delete
    Loop

    id = 0
    If cob > 0 Then
        id = id + 1
        Call AdicionarRegistro(SHT_RECOM_BD, TBL_RECOM, _
            Array("ID", "Tipo", "Descrição", "Responsável", "Situação", "Prioridade", "Categoria", "Data"), _
            Array(id, "Cobrança", "Cobrar " & cob & " aluno(s) com mensalidade em atraso", _
                  "Financeiro", "Pendente", "🔴", "Financeiro", DataAtual()))
    End If
    If estoque > 0 Then
        id = id + 1
        Call AdicionarRegistro(SHT_RECOM_BD, TBL_RECOM, _
            Array("ID", "Tipo", "Descrição", "Responsável", "Situação", "Prioridade", "Categoria", "Data"), _
            Array(id, "Estoque", "Comprar / repor " & estoque & " produto(s) críticos", _
                  "Estoque", "Pendente", "🟠", "Estoque", DataAtual()))
    End If
    If treinos > 0 Then
        id = id + 1
        Call AdicionarRegistro(SHT_RECOM_BD, TBL_RECOM, _
            Array("ID", "Tipo", "Descrição", "Responsável", "Situação", "Prioridade", "Categoria", "Data"), _
            Array(id, "Treino", "Atualizar " & treinos & " treino(s) com 45+ dias", _
                  "Professor", "Pendente", "🟡", "Treinos", DataAtual()))
    End If
    If riscoAlto > 0 Then
        id = id + 1
        Call AdicionarRegistro(SHT_RECOM_BD, TBL_RECOM, _
            Array("ID", "Tipo", "Descrição", "Responsável", "Situação", "Prioridade", "Categoria", "Data"), _
            Array(id, "Retenção", "Campanha de retenção para " & riscoAlto & " aluno(s) em alto risco", _
                  "CRM", "Pendente", "🟢", "Retenção", DataAtual()))
    End If
    If reaval > 0 Then
        id = id + 1
        Call AdicionarRegistro(SHT_RECOM_BD, TBL_RECOM, _
            Array("ID", "Tipo", "Descrição", "Responsável", "Situação", "Prioridade", "Categoria", "Data"), _
            Array(id, "Avaliação", "Marcar " & reaval & " reavaliação(ões) físicas", _
                  "Professor", "Pendente", "🔵", "Avaliação", DataAtual()))
    End If
    If id = 0 Then
        Call AdicionarRegistro(SHT_RECOM_BD, TBL_RECOM, _
            Array("ID", "Tipo", "Descrição", "Responsável", "Situação", "Prioridade", "Categoria", "Data"), _
            Array(1, "OK", "Nenhuma ação crítica no momento — continue monitorando KPIs", _
                  "Gestor", "Concluída", "🟢", "Geral", DataAtual()))
    End If
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarRecomendacoes"
End Sub

'--- Chat / pergunta ---------------------------------------------

Public Sub PerguntarAthena()
    Call ResponderPergunta
End Sub

Public Sub ResponderPergunta()
    Dim q As String, resp As String, modulo As String
    Dim id As Long
    On Error GoTo TrataErro
    q = Trim$(CStr(NzStr(LerCelula(SHT_ATHENA, "D15"))))
    If Len(q) = 0 Then
        MsgOk "Digite uma pergunta em D15 (ex.: Quanto faturei este mês?)."
        Exit Sub
    End If
    resp = InterpretarPergunta(q, modulo)
    Call LimparIntervalo(SHT_ATHENA, "C18:C23")
    GravarCelula SHT_ATHENA, "C18", resp
    ' linhas extras se resposta multilinha
    Call EscreverRespostaMultilinha(resp)

    id = MaxNumerico(SHT_ATHENA_CHAT, TBL_ATHENA_CHAT, "ID") + 1
    Call AdicionarRegistro(SHT_ATHENA_CHAT, TBL_ATHENA_CHAT, _
        Array("ID", "Data", "Hora", "Pergunta", "Resposta", "Usuário", "Módulo"), _
        Array(id, DataAtual(), Format$(Now, "hh:nn"), q, Left$(resp, 250), NzStr(UsuarioLogado()), modulo))
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "ResponderPergunta"
End Sub

Private Function InterpretarPergunta(ByVal q As String, ByRef modulo As String) As String
    Dim u As String
    Dim rec As Double, recAnt As Double, varP As Double
    Dim m As Long, a As Long
    Dim lo As ListObject, lr As ListRow
    Dim i As Long, linha As String
    Dim score As Double, nome As String, motivos As String
    On Error Resume Next
    u = UCase$(q)
    modulo = "Geral"

    If InStr(1, u, "FATUR", vbTextCompare) > 0 Or InStr(1, u, "RECEITA", vbTextCompare) > 0 _
       Or InStr(1, u, "FATURAMENTO", vbTextCompare) > 0 Then
        modulo = "Financeiro"
        rec = SomaCreditosMes(Month(DataAtual()), Year(DataAtual()))
        m = Month(DateAdd("m", -1, DataAtual()))
        a = Year(DateAdd("m", -1, DataAtual()))
        recAnt = SomaCreditosMes(m, a)
        If recAnt > 0 Then
            varP = (rec - recAnt) / recAnt * 100#
            InterpretarPergunta = "Receita" & vbLf & "R$ " & Format$(rec, "#,##0.00") & vbLf & _
                IIf(varP >= 0, "▲ ", "▼ ") & Format$(Abs(varP), "0.0") & "% em relação ao mês passado."
        Else
            InterpretarPergunta = "Receita" & vbLf & "R$ " & Format$(rec, "#,##0.00") & vbLf & _
                "(sem base do mês anterior para comparação)."
        End If
        Exit Function
    End If

    If InStr(1, u, "RISCO", vbTextCompare) > 0 Or InStr(1, u, "CANCEL", vbTextCompare) > 0 _
       Or InStr(1, u, "CHURN", vbTextCompare) > 0 And InStr(1, u, "QUEM", vbTextCompare) > 0 Then
        modulo = "Retenção"
        If Not TabelaExiste(SHT_RISCO, TBL_RISCO) Then Call modBIAnalytics.AnalisarRetencao
        Set lo = ObterTabela(SHT_RISCO, TBL_RISCO)
        InterpretarPergunta = "Alunos em risco de cancelar:" & vbLf
        i = 0
        For Each lr In lo.ListRows
            score = Val(LerCampo(lr, "Score"))
            If score >= 50 Or InStr(1, NzStr(LerCampo(lr, "Classificação")), "Alto", vbTextCompare) > 0 _
               Or InStr(1, NzStr(LerCampo(lr, "Classificação")), "Médio", vbTextCompare) > 0 Then
                i = i + 1
                nome = NzStr(LerCampo(lr, "Aluno"))
                motivos = "Freq: " & NzStr(LerCampo(lr, "Frequência")) & _
                          " · Mensalidade: " & NzStr(LerCampo(lr, "Mensalidade")) & _
                          " · Sem acesso: " & NzStr(LerCampo(lr, "Dias sem acesso")) & "d"
                InterpretarPergunta = InterpretarPergunta & vbLf & nome & " — Risco " & Format$(score, "0") & "%" & vbLf & motivos
                If i >= 5 Then Exit For
            End If
        Next lr
        If i = 0 Then InterpretarPergunta = "Nenhum aluno em risco elevado no momento. Churn: " & Format$(CalcularChurn(), "0.0") & "%."
        Exit Function
    End If

    If InStr(1, u, "PRODUTO", vbTextCompare) > 0 Or InStr(1, u, "COMPRAR", vbTextCompare) > 0 _
       Or InStr(1, u, "ESTOQUE", vbTextCompare) > 0 Or InStr(1, u, "CREATINA", vbTextCompare) > 0 Then
        modulo = "Estoque"
        InterpretarPergunta = SugestaoComprasTexto()
        Exit Function
    End If

    If InStr(1, u, "PICO", vbTextCompare) > 0 Or InStr(1, u, "HORÁRIO", vbTextCompare) > 0 _
       Or InStr(1, u, "HORARIO", vbTextCompare) > 0 Or InStr(1, u, "FREQUÊNCIA", vbTextCompare) > 0 _
       Or InStr(1, u, "FREQUENCIA", vbTextCompare) > 0 Then
        modulo = "Frequência"
        InterpretarPergunta = TextoHorarioPico()
        Exit Function
    End If

    If InStr(1, u, "CHURN", vbTextCompare) > 0 Then
        modulo = "Comercial"
        InterpretarPergunta = "Churn atual: " & Format$(CalcularChurn(), "0.0") & "%" & vbLf & _
            "Ticket médio: R$ " & Format$(CalcularTicketMedio(), "#,##0.00") & vbLf & _
            "LTV estimado: R$ " & Format$(CalcularLTV(), "#,##0.00")
        Exit Function
    End If

    If InStr(1, u, "PREVIS", vbTextCompare) > 0 Or InStr(1, u, "90", vbTextCompare) > 0 _
       Or InStr(1, u, "PROJEC", vbTextCompare) > 0 Then
        modulo = "Financeiro"
        InterpretarPergunta = TextoPrevisaoReceita()
        Exit Function
    End If

    If InStr(1, u, "LUCRO", vbTextCompare) > 0 Or InStr(1, u, "CAIXA", vbTextCompare) > 0 Then
        modulo = "Financeiro"
        InterpretarPergunta = "Receita mês: R$ " & Format$(SomaCreditosMes(Month(DataAtual()), Year(DataAtual())), "#,##0.00") & vbLf & _
            "Despesas mês: R$ " & Format$(SomaDebitosMes(Month(DataAtual()), Year(DataAtual())), "#,##0.00") & vbLf & _
            "Lucro aprox.: R$ " & Format$(SomaCreditosMes(Month(DataAtual()), Year(DataAtual())) - SomaDebitosMes(Month(DataAtual()), Year(DataAtual())), "#,##0.00")
        Exit Function
    End If

    If InStr(1, u, "TREINO", vbTextCompare) > 0 Then
        modulo = "Treinos"
        InterpretarPergunta = "Treinos com 45+ dias: " & ContarTreinosDesatualizados() & vbLf & _
            "Recomenda-se atualizar fichas e comunicar no portal do aluno."
        Exit Function
    End If

    If InStr(1, u, "AGENDA", vbTextCompare) > 0 Or InStr(1, u, "AVALIA", vbTextCompare) > 0 Then
        modulo = "Agenda"
        InterpretarPergunta = "Reavaliações sugeridas: " & ContarReavaliacoesPendentes() & vbLf & _
            "Balanceie a carga entre os professores na agenda do dia."
        Exit Function
    End If

    InterpretarPergunta = "Entendi a pergunta, mas ainda não tenho um modelo específico para ela." & vbLf & _
        "Tente: receita, risco de cancelar, produtos, horário de pico, churn, previsão 90 dias." & vbLf & _
        "Dica: use Atualizar Athena para recalcular todos os motores."
End Function

'--- Insights / previsões / automações ---------------------------

Public Sub GerarInsightsAthena()
    Dim msgs() As String
    Dim n As Long, i As Long, id As Long
    Dim lo As ListObject
    On Error GoTo TrataErro
    ' Garante análises frescas
    Call AnalisarFinanceiro
    Call AnalisarCRM
    Call AnalisarEstoque
    Call AnalisarTreinos
    Call AnalisarRetencao

    ReDim msgs(1 To 10)
    n = 0
    n = n + 1: msgs(n) = "📊 Insight  Inadimplência: " & Format$(PercentualInadimplencia(), "0.0") & "%"
    n = n + 1: msgs(n) = "📊 Insight  Frequência relativa: " & Format$(PercentualFrequencia(), "0.0") & "%"
    n = n + 1: msgs(n) = "📊 Insight  " & TextoHorarioPico()
    n = n + 1: msgs(n) = "📊 Insight  Saúde do estoque: " & Format$(PercentualSaudeEstoque(), "0.0") & "%"
    n = n + 1: msgs(n) = "📊 Insight  " & TextoMarketingSazonal()

    Set lo = ObterTabela(SHT_INSIGHTS_BD, TBL_INSIGHTS)
    ' preserva últimos insights BI — acrescenta Athena com IDs novos
    id = MaxNumerico(SHT_INSIGHTS_BD, TBL_INSIGHTS, "ID")
    For i = 1 To n
        id = id + 1
        Call AdicionarRegistro(SHT_INSIGHTS_BD, TBL_INSIGHTS, _
            Array("ID", "Data", "Tipo", "Mensagem", "Prioridade", "Módulo"), _
            Array(id, DataAtual(), "Athena", msgs(i), "🤖", "AthenaAI"))
    Next i
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "GerarInsightsAthena"
End Sub

Public Sub AtualizarPrevisoesAthena()
    Dim atual As Double, d30 As Double, d60 As Double, d90 As Double
    Dim crescimento As Double
    On Error Resume Next
    Call PreverReceita
    Call PreverCaixa
    atual = SomaCreditosMes(Month(DataAtual()), Year(DataAtual()))
    If atual <= 0 Then atual = 52000
    crescimento = 0.07
    d30 = Round(atual * (1 + crescimento * 0.3), 2)
    d60 = Round(atual * (1 + crescimento * 0.6), 2)
    d90 = Round(atual * (1 + crescimento), 2)

    ' Atualiza UI Athena
    GravarCelula SHT_ATHENA, "I26", "R$ " & Format$(atual, "#,##0")
    GravarCelula SHT_ATHENA, "I27", "R$ " & Format$(d30, "#,##0")
    GravarCelula SHT_ATHENA, "I28", "R$ " & Format$(d60, "#,##0")
    GravarCelula SHT_ATHENA, "I29", "R$ " & Format$(d90, "#,##0")

    ' Espelha linhas 90d em BD_PREVISOES se existir
    If TabelaExiste(SHT_PREVISOES, TBL_PREVISOES) Then
        Call UpsertPrevisao("Receita", "90 dias", d90, "Projeção Athena")
        Call UpsertPrevisao("Receita", "60 dias", d60, "Projeção Athena")
        Call UpsertPrevisao("Receita", "30 dias", d30, "Projeção Athena")
    End If
End Sub

Public Sub GerarAutomacoes()
    Dim r As Long
    Dim lo As ListObject, lr As ListRow
    Dim aluno As String, mat As String
    On Error Resume Next
    Call LimparIntervalo(SHT_ATHENA, "C45:F49")
    r = 45
    ' WhatsApp — cobrança
    If ContarCobrancasPendentes() > 0 Then
        GravarCelula SHT_ATHENA, "C" & r, "WhatsApp"
        GravarCelula SHT_ATHENA, "D" & r, "Alunos inadimplentes"
        GravarCelula SHT_ATHENA, "E" & r, "Olá! Sua mensalidade vence em breve. Pague via PIX no portal."
        GravarCelula SHT_ATHENA, "F" & r, "Fila"
        r = r + 1
    End If
    ' E-mail — relatório
    GravarCelula SHT_ATHENA, "C" & r, "E-mail"
    GravarCelula SHT_ATHENA, "D" & r, "Gestor"
    GravarCelula SHT_ATHENA, "E" & r, "Relatório executivo ATHENA — receita, churn, estoque, CRM"
    GravarCelula SHT_ATHENA, "F" & r, "Pronto"
    r = r + 1
    ' WhatsApp — reavaliação
    If ContarReavaliacoesPendentes() > 0 Then
        GravarCelula SHT_ATHENA, "C" & r, "WhatsApp"
        GravarCelula SHT_ATHENA, "D" & r, "Alunos reavaliação"
        GravarCelula SHT_ATHENA, "E" & r, "Sua avaliação física está próxima. Confirme horário na recepção."
        GravarCelula SHT_ATHENA, "F" & r, "Fila"
    End If
End Sub

Public Sub GerarRelatorioIA()
    Dim txt As String
    On Error GoTo TrataErro
    Call AtualizarAthenaAI
    txt = "RELATÓRIO EXECUTIVO ATHENA AI" & vbCrLf & _
          "Data: " & Format$(DataAtual(), "dd/mm/yyyy") & vbCrLf & vbCrLf & _
          "Receita mês: R$ " & Format$(SomaCreditosMes(Month(DataAtual()), Year(DataAtual())), "#,##0.00") & vbCrLf & _
          "Churn: " & Format$(CalcularChurn(), "0.0") & "%" & vbCrLf & _
          "Inadimplência: " & Format$(PercentualInadimplencia(), "0.0") & "%" & vbCrLf & _
          "Frequência: " & Format$(PercentualFrequencia(), "0.0") & "%" & vbCrLf & _
          "Estoque saúde: " & Format$(PercentualSaudeEstoque(), "0.0") & "%" & vbCrLf & _
          "Cobranças pendentes: " & ContarCobrancasPendentes() & vbCrLf & _
          "Risco alto: " & ContarRiscoAlto() & vbCrLf & _
          "Treinos 45d+: " & ContarTreinosDesatualizados() & vbCrLf & vbCrLf & _
          TextoPrevisaoReceita()
    MsgOk txt
    GravarCelula SHT_ATHENA, "C18", Replace(txt, vbCrLf, " | ")
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "GerarRelatorioIA"
End Sub

'--- Telas -------------------------------------------------------

Public Sub AtualizarTelaAthena()
    Dim lo As ListObject, lr As ListRow
    Dim r As Long, i As Long
    On Error Resume Next
    GravarCelula SHT_ATHENA, "C10", ContarCobrancasPendentes()
    GravarCelula SHT_ATHENA, "E10", ContarReavaliacoesPendentes()
    GravarCelula SHT_ATHENA, "G10", ContarProdutosAbaixoMinimo()
    GravarCelula SHT_ATHENA, "I10", "R$ " & Format$(SomaCreditosMes(Month(DataAtual()), Year(DataAtual())) / 30#, "#,##0")

    Call LimparIntervalo(SHT_ATHENA, "C34:C41")
    r = 34
    If TabelaExiste(SHT_INSIGHTS_BD, TBL_INSIGHTS) Then
        Set lo = ObterTabela(SHT_INSIGHTS_BD, TBL_INSIGHTS)
        i = 0
        For Each lr In lo.ListRows
            GravarCelula SHT_ATHENA, "C" & r, NzStr(LerCampo(lr, "Mensagem"))
            r = r + 1
            i = i + 1
            If i >= 8 Or r > 41 Then Exit For
        Next lr
    End If

    GravarCelula SHT_ATHENA, "C7", SaudacaoAthena() & " Hoje: " & _
        ContarCobrancasPendentes() & " cobranças · " & _
        ContarReavaliacoesPendentes() & " avaliações · " & _
        ContarProdutosAbaixoMinimo() & " produtos em falta · receita prevista R$ " & _
        Format$(SomaCreditosMes(Month(DataAtual()), Year(DataAtual())) / 30#, "#,##0") & "."
End Sub

Public Sub AtualizarTelaRecomendacoes()
    Dim lo As ListObject, lr As ListRow
    Dim r As Long, pend As Long, alta As Long, ok As Long, mods As Object, k As Variant
    On Error Resume Next
    Set mods = CreateObject("Scripting.Dictionary")
    Call LimparIntervalo(SHT_RECOM_UI, "C14:H25")
    If Not TabelaExiste(SHT_RECOM_BD, TBL_RECOM) Then Exit Sub
    Set lo = ObterTabela(SHT_RECOM_BD, TBL_RECOM)
    r = 14
    For Each lr In lo.ListRows
        GravarCelula SHT_RECOM_UI, "C" & r, NzStr(LerCampo(lr, "Prioridade"))
        GravarCelula SHT_RECOM_UI, "D" & r, NzStr(LerCampo(lr, "Tipo"))
        GravarCelula SHT_RECOM_UI, "E" & r, NzStr(LerCampo(lr, "Descrição"))
        GravarCelula SHT_RECOM_UI, "F" & r, NzStr(LerCampo(lr, "Responsável"))
        GravarCelula SHT_RECOM_UI, "G" & r, NzStr(LerCampo(lr, "Situação"))
        GravarCelula SHT_RECOM_UI, "H" & r, NzStr(LerCampo(lr, "Categoria"))
        If InStr(1, NzStr(LerCampo(lr, "Situação")), "Pendente", vbTextCompare) > 0 Then pend = pend + 1
        If InStr(1, NzStr(LerCampo(lr, "Situação")), "Conclu", vbTextCompare) > 0 Then ok = ok + 1
        If NzStr(LerCampo(lr, "Prioridade")) = "🔴" Or NzStr(LerCampo(lr, "Prioridade")) = "🟠" Then alta = alta + 1
        k = NzStr(LerCampo(lr, "Categoria"))
        If Len(k) > 0 Then If Not mods.Exists(k) Then mods.Add k, 1
        r = r + 1
        If r > 25 Then Exit For
    Next lr
    GravarCelula SHT_RECOM_UI, "C8", pend
    GravarCelula SHT_RECOM_UI, "E8", alta
    GravarCelula SHT_RECOM_UI, "G8", ok
    GravarCelula SHT_RECOM_UI, "I8", mods.Count
End Sub

'--- Helpers -----------------------------------------------------

Private Sub RegistrarInsightAthena(ByVal tipo As String, ByVal msg As String, ByVal pri As String, ByVal modulo As String)
    Dim id As Long
    On Error Resume Next
    If Not TabelaExiste(SHT_INSIGHTS_BD, TBL_INSIGHTS) Then Exit Sub
    id = MaxNumerico(SHT_INSIGHTS_BD, TBL_INSIGHTS, "ID") + 1
    Call AdicionarRegistro(SHT_INSIGHTS_BD, TBL_INSIGHTS, _
        Array("ID", "Data", "Tipo", "Mensagem", "Prioridade", "Módulo"), _
        Array(id, DataAtual(), tipo, msg, pri, modulo))
End Sub

Private Sub UpsertPrevisao(ByVal tipo As String, ByVal horizonte As String, ByVal valor As Double, ByVal base As String)
    Dim lo As ListObject, lr As ListRow
    On Error Resume Next
    Set lo = ObterTabela(SHT_PREVISOES, TBL_PREVISOES)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Tipo")), tipo, vbTextCompare) = 0 _
           And StrComp(NzStr(LerCampo(lr, "Horizonte")), horizonte, vbTextCompare) = 0 Then
            GravarCampo lr, "Valor", valor
            GravarCampo lr, "Base", base
            GravarCampo lr, "Atualizado", DataAtual()
            Exit Sub
        End If
    Next lr
    Call AdicionarRegistro(SHT_PREVISOES, TBL_PREVISOES, _
        Array("Tipo", "Horizonte", "Valor", "Base", "Atualizado"), _
        Array(tipo, horizonte, valor, base, DataAtual()))
End Sub

Private Sub EscreverRespostaMultilinha(ByVal resp As String)
    Dim parts() As String, i As Long, r As Long
    On Error Resume Next
    parts = Split(resp, vbLf)
    r = 18
    For i = LBound(parts) To UBound(parts)
        GravarCelula SHT_ATHENA, "C" & r, parts(i)
        r = r + 1
        If r > 23 Then Exit For
    Next i
End Sub

Private Function SaudacaoAthena() As String
    Dim h As Long
    h = Hour(Now)
    If h < 12 Then
        SaudacaoAthena = "Bom dia."
    ElseIf h < 18 Then
        SaudacaoAthena = "Boa tarde."
    Else
        SaudacaoAthena = "Boa noite."
    End If
End Function

Private Function ContarCobrancasPendentes() As Long
    Dim lo As ListObject, lr As ListRow
    Dim st As String
    On Error Resume Next
    If TabelaExiste("BD_CONTAS_RECEBER", "tbContasReceber") Then
        Set lo = ObterTabela("BD_CONTAS_RECEBER", "tbContasReceber")
        For Each lr In lo.ListRows
            st = UCase$(NzStr(LerCampo(lr, "Situação")))
            If Len(st) = 0 Then st = UCase$(NzStr(LerCampo(lr, "Status")))
            If InStr(1, st, "ATRAS", vbTextCompare) > 0 Or InStr(1, st, "ABERTO", vbTextCompare) > 0 _
               Or InStr(1, st, "PEND", vbTextCompare) > 0 Or InStr(1, st, "VENCID", vbTextCompare) > 0 Then
                ContarCobrancasPendentes = ContarCobrancasPendentes + 1
            End If
        Next lr
    End If
End Function

Private Function ContarProdutosAbaixoMinimo() As Long
    Dim lo As ListObject, lr As ListRow
    Dim q As Double, minQ As Double
    On Error Resume Next
    If Not TabelaExiste("BD_PRODUTOS", "tbProdutos") Then Exit Function
    Set lo = ObterTabela("BD_PRODUTOS", "tbProdutos")
    For Each lr In lo.ListRows
        q = Val(LerCampo(lr, "Estoque"))
        If q = 0 Then q = Val(LerCampo(lr, "Qtde"))
        minQ = Val(LerCampo(lr, "Mínimo"))
        If minQ = 0 Then minQ = Val(LerCampo(lr, "Minimo"))
        If q <= minQ Then ContarProdutosAbaixoMinimo = ContarProdutosAbaixoMinimo + 1
    Next lr
End Function

Private Function ContarTreinosDesatualizados() As Long
    Dim lo As ListObject, lr As ListRow
    Dim d As Date
    On Error Resume Next
    If Not TabelaExiste("BD_TREINOS", "tbTreinos") Then Exit Function
    Set lo = ObterTabela("BD_TREINOS", "tbTreinos")
    For Each lr In lo.ListRows
        If IsDate(LerCampo(lr, "Data Início")) Then
            d = CDate(LerCampo(lr, "Data Início"))
        ElseIf IsDate(LerCampo(lr, "Data")) Then
            d = CDate(LerCampo(lr, "Data"))
        Else
            GoTo Prox
        End If
        If DateDiff("d", d, DataAtual()) >= 45 Then ContarTreinosDesatualizados = ContarTreinosDesatualizados + 1
Prox:
    Next lr
End Function

Private Function ContarReavaliacoesPendentes() As Long
    Dim lo As ListObject, lr As ListRow
    Dim dias As Long, d As Date
    On Error Resume Next
    dias = CLng(ObterParametroNumero("Treinos", "DiasReavaliacao", 60))
    If Not TabelaExiste("BD_AVALIACOES", "tbAvaliacoes") Then Exit Function
    Set lo = ObterTabela("BD_AVALIACOES", "tbAvaliacoes")
    For Each lr In lo.ListRows
        If IsDate(LerCampo(lr, "Data")) Then
            d = CDate(LerCampo(lr, "Data"))
            If DateDiff("d", d, DataAtual()) >= dias Then ContarReavaliacoesPendentes = ContarReavaliacoesPendentes + 1
        End If
    Next lr
End Function

Private Function ContarRiscoAlto() As Long
    Dim lo As ListObject, lr As ListRow
    On Error Resume Next
    If Not TabelaExiste(SHT_RISCO, TBL_RISCO) Then Exit Function
    Set lo = ObterTabela(SHT_RISCO, TBL_RISCO)
    For Each lr In lo.ListRows
        If Val(LerCampo(lr, "Score")) >= 71 Or InStr(1, NzStr(LerCampo(lr, "Classificação")), "Alto", vbTextCompare) > 0 Then
            ContarRiscoAlto = ContarRiscoAlto + 1
        End If
    Next lr
End Function

Private Function MediaVendaDiariaProdutoSafe(ByVal cod As String) As Double
    Dim lo As ListObject, lr As ListRow
    Dim q As Double
    On Error Resume Next
    If Len(Trim$(cod)) = 0 Then Exit Function
    If Not TabelaExiste("BD_VENDA_ITENS", "tbVendaItens") Then Exit Function
    Set lo = ObterTabela("BD_VENDA_ITENS", "tbVendaItens")
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Código")), cod, vbTextCompare) = 0 _
           Or StrComp(NzStr(LerCampo(lr, "Codigo")), cod, vbTextCompare) = 0 Then
            q = q + Val(LerCampo(lr, "Qtde"))
        End If
    Next lr
    MediaVendaDiariaProdutoSafe = q / 30#
End Function

Private Function SugestaoComprasTexto() As String
    Dim lo As ListObject, lr As ListRow
    Dim nome As String, q As Double, minQ As Double, sug As Long
    Dim n As Long, txt As String
    On Error Resume Next
    txt = "Sugestão de compra:" & vbLf
    If Not TabelaExiste("BD_PRODUTOS", "tbProdutos") Then
        SugestaoComprasTexto = "Sem produtos cadastrados."
        Exit Function
    End If
    Set lo = ObterTabela("BD_PRODUTOS", "tbProdutos")
    For Each lr In lo.ListRows
        nome = NzStr(LerCampo(lr, "Nome"))
        If Len(nome) = 0 Then nome = NzStr(LerCampo(lr, "Produto"))
        q = Val(LerCampo(lr, "Estoque"))
        If q = 0 Then q = Val(LerCampo(lr, "Qtde"))
        minQ = Val(LerCampo(lr, "Mínimo"))
        If minQ = 0 Then minQ = Val(LerCampo(lr, "Minimo"))
        If q <= minQ Then
            sug = CLng(Application.WorksheetFunction.Max(minQ * 2 - q, 5))
            n = n + 1
            txt = txt & vbLf & nome & vbLf & sug
            If n >= 5 Then Exit For
        End If
    Next lr
    If n = 0 Then txt = "Estoque saudável — nenhuma compra urgente."
    SugestaoComprasTexto = txt
End Function

Private Function TextoHorarioPico() As String
    Dim lo As ListObject, lr As ListRow
    Dim counts(0 To 23) As Long
    Dim h As Long, maxH As Long, maxC As Long, tot As Long, ent As String
    On Error Resume Next
    If Not TabelaExiste("BD_ACESSOS", "tbAcessos") Then
        TextoHorarioPico = "Sem dados de acesso para calcular horário de pico."
        Exit Function
    End If
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
    If tot <= 0 Then
        TextoHorarioPico = "Sem entradas suficientes nos últimos registros."
    Else
        TextoHorarioPico = "O horário entre " & Format$(maxH, "00") & "h e " & Format$(maxH + 2, "00") & _
            "h concentra " & Format$(maxC / tot * 100, "0") & "% dos acessos — próximo da capacidade de pico."
    End If
End Function

Private Function TextoPrevisaoReceita() As String
    Dim atual As Double, d30 As Double, d60 As Double, d90 As Double
    On Error Resume Next
    atual = SomaCreditosMes(Month(DataAtual()), Year(DataAtual()))
    If atual <= 0 Then atual = 52000
    d30 = Round(atual * 1.07, 2)
    d60 = Round(atual * 1.12, 2)
    d90 = Round(atual * 1.18, 2)
    TextoPrevisaoReceita = "Projeção de receita" & vbLf & _
        "Hoje/mês: R$ " & Format$(atual, "#,##0") & vbLf & _
        "30 dias: R$ " & Format$(d30, "#,##0") & vbLf & _
        "60 dias: R$ " & Format$(d60, "#,##0") & vbLf & _
        "90 dias: R$ " & Format$(d90, "#,##0")
End Function

Private Function TextoMarketingSazonal() As String
    Dim m As Long, rec As Double, recAnt As Double
    On Error Resume Next
    m = Month(DataAtual())
    rec = SomaCreditosMes(m, Year(DataAtual()))
    recAnt = SomaCreditosMes(Month(DateAdd("m", -1, DataAtual())), Year(DateAdd("m", -1, DataAtual())))
    If m = 1 Or (recAnt > 0 And rec < recAnt * 0.9) Then
        TextoMarketingSazonal = "Queda / sazonalidade detectada — sugerir campanha Plano Verão / retenção."
    Else
        TextoMarketingSazonal = "Matrículas estáveis — mantenha campanhas de indicação e Instagram."
    End If
End Function

Private Function SomaDebitosMes(ByVal m As Long, ByVal a As Long) As Double
    Dim lo As ListObject, lr As ListRow
    Dim d As Date, v As Double
    On Error Resume Next
    If Not TabelaExiste("BD_LANCAMENTOS", "tbLancamentos") Then Exit Function
    Set lo = ObterTabela("BD_LANCAMENTOS", "tbLancamentos")
    For Each lr In lo.ListRows
        If IsDate(LerCampo(lr, "Data")) Then
            d = CDate(LerCampo(lr, "Data"))
            If Month(d) = m And Year(d) = a Then
                v = Val(LerCampo(lr, "Débito"))
                If v = 0 Then v = Val(LerCampo(lr, "Debito"))
                SomaDebitosMes = SomaDebitosMes + v
            End If
        End If
    Next lr
End Function

Private Function UsuarioLogado() As String
    On Error Resume Next
    UsuarioLogado = NzStr(LerParametroTabela("UsuarioLogado", "admin"))
    If Len(UsuarioLogado) = 0 Then UsuarioLogado = "admin"
End Function
