Attribute VB_Name = "modFinanceiro"
Option Explicit

'============================================================
' Sprint 4.0 — Motor Financeiro Inteligente (livro-razão)
'============================================================

Public gIdContaReceber As Long

Private Function PodeOperarFinanceiro() As Boolean
    PodeOperarFinanceiro = TemPermissao(PerfilUsuario, "Financeiro")
End Function

Private Function PodeExcluirFinanceiro() As Boolean
    PodeExcluirFinanceiro = TemPermissao(PerfilUsuario, "Excluir")
End Function

Public Function CompetenciaTexto(ByVal d As Date) As String
    Dim meses As Variant
    meses = Array("", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", _
                  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro")
    CompetenciaTexto = meses(Month(d)) & "/" & Year(d)
End Function

Public Function DiasEmAtraso(ByVal vencimento As Date) As Long
    Dim d As Long
    d = CLng(DataAtual() - vencimento)
    If d < 0 Then d = 0
    DiasEmAtraso = d
End Function

Public Function CalcularMulta(ByVal valorOriginal As Double, ByVal diasAtraso As Long) As Double
    If diasAtraso <= DiasTolerancia() Then
        CalcularMulta = 0
    Else
        CalcularMulta = Round(valorOriginal * (MultaPercentual() / 100#), 2)
    End If
End Function

Public Function CalcularJuros(ByVal valorOriginal As Double, ByVal diasAtraso As Long) As Double
    If diasAtraso <= DiasTolerancia() Then
        CalcularJuros = 0
    Else
        ' 1% ao mês proporcional aos dias
        CalcularJuros = Round(valorOriginal * (JurosPercentual() / 100#) * (diasAtraso / 30#), 2)
    End If
End Function

Public Function CalcularValorFinal(ByVal valorOriginal As Double, ByVal desconto As Double, _
                                   ByVal multa As Double, ByVal juros As Double) As Double
    Dim v As Double
    v = valorOriginal + multa + juros - desconto
    If v < 0 Then v = 0
    CalcularValorFinal = Round(v, 2)
End Function

Public Sub RecalcularEncargosConta(ByVal lr As ListRow)
    Dim vo As Double, desc As Double, multa As Double, juros As Double
    Dim sit As String, venc As Date, dias As Long

    sit = UCase$(NzStr(LerCampo(lr, "Situação")))
    If sit = "PAGO" Or sit = "CANCELADO" Then Exit Sub

    vo = CDbl(Val(Replace(CStr(LerCampo(lr, "Valor Original")), ",", ".")))
    desc = CDbl(Val(Replace(CStr(LerCampo(lr, "Desconto")), ",", ".")))
    venc = CDate(LerCampo(lr, "Data Vencimento"))
    dias = DiasEmAtraso(venc)
    multa = CalcularMulta(vo, dias)
    juros = CalcularJuros(vo, dias)

    Call GravarCampo(lr, "Multa", multa)
    Call GravarCampo(lr, "Juros", juros)
    Call GravarCampo(lr, "Valor Final", CalcularValorFinal(vo, desc, multa, juros))

    If dias > DiasTolerancia() Then
        Call GravarCampo(lr, "Situação", "Atrasado")
    ElseIf sit <> "PAGO" And sit <> "CANCELADO" Then
        Call GravarCampo(lr, "Situação", "Pendente")
    End If
End Sub

Public Sub RecalcularTodasContasAbertas()
    Dim lo As ListObject
    Dim lr As ListRow
    On Error GoTo Falha
    Set lo = ObterTabela(SHT_RECEBER_BD, TBL_RECEBER_BD)
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Matrícula"))) = 0 Then GoTo Prox
        Call RecalcularEncargosConta(lr)
Prox:
    Next lr
Falha:
End Sub

Public Function ProximoIdContaReceber() As Long
    ProximoIdContaReceber = MaxNumerico(SHT_RECEBER_BD, TBL_RECEBER_BD, "ID") + 1
End Function

Public Function ProximoIdLancamento() As Long
    ProximoIdLancamento = MaxNumerico(SHT_LANCAMENTOS, TBL_LANCAMENTOS, "ID") + 1
End Function

Public Function ProximoDocumento(ByVal prefixo As String) As String
    Dim lo As ListObject
    Dim lr As ListRow
    Dim doc As String, n As Long, maxN As Long, p As String
    p = UCase$(Trim$(prefixo)) & "-"
    maxN = 0
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_LANCAMENTOS, TBL_LANCAMENTOS)
    For Each lr In lo.ListRows
        doc = UCase$(NzStr(LerCampo(lr, "Documento")))
        If Left$(doc, Len(p)) = p Then
            n = CLng(Val(Mid$(doc, Len(p) + 1)))
            If n > maxN Then maxN = n
        End If
    Next lr
Sai:
    ProximoDocumento = prefixo & "-" & Format$(maxN + 1, "000000")
End Function

Public Function UltimoSaldoFluxo() As Double
    Dim lo As ListObject
    Dim lr As ListRow
    Dim s As Double
    s = CDbl(Val(LerCelula(SHT_CONFIG, "V12")))
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_FLUXO_BD, TBL_FLUXO_BD)
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Data"))) > 0 Then
            s = CDbl(Val(Replace(CStr(LerCampo(lr, "Saldo")), ",", ".")))
        End If
    Next lr
Sai:
    UltimoSaldoFluxo = s
End Function

Public Sub LancarNoRazao(ByVal tipo As String, ByVal origem As String, ByVal categoria As String, _
                         ByVal documento As String, ByVal debito As Double, ByVal credito As Double)
    Dim cols As Variant, vals As Variant
    cols = Array("ID", "Data", "Tipo", "Origem", "Categoria", "Documento", "Débito", "Crédito", "Usuário")
    vals = Array(ProximoIdLancamento(), DataAtual(), tipo, origem, categoria, documento, _
                 Round(debito, 2), Round(credito, 2), _
                 IIf(Len(Trim$(UsuarioLogado)) = 0, "sistema", UsuarioLogado))
    Call AdicionarRegistro(SHT_LANCAMENTOS, TBL_LANCAMENTOS, cols, vals)
End Sub

Public Sub AtualizarFluxoCaixa(ByVal tipoMov As String, ByVal categoria As String, _
                               ByVal descricao As String, ByVal entrada As Double, ByVal saida As Double)
    Dim saldo As Double
    Dim cols As Variant, vals As Variant
    saldo = UltimoSaldoFluxo() + entrada - saida
    cols = Array("Data", "Tipo", "Categoria", "Descrição", "Entrada", "Saída", "Saldo")
    vals = Array(DataAtual(), tipoMov, categoria, descricao, Round(entrada, 2), Round(saida, 2), Round(saldo, 2))
    Call AdicionarRegistro(SHT_FLUXO_BD, TBL_FLUXO_BD, cols, vals)
End Sub

Public Sub CriarContaReceber(ByVal matricula As String, ByVal nome As String, _
                             ByVal valor As Double, ByVal vencimento As Date, _
                             Optional ByVal forma As String = "", _
                             Optional ByVal competencia As String = "", _
                             Optional ByVal observacao As String = "")
    Dim id As Long
    Dim multa As Double, juros As Double, vfinal As Double
    Dim dias As Long
    Dim cols As Variant, vals As Variant
    Dim comp As String

    On Error GoTo TrataErro
    If Len(Trim$(competencia)) = 0 Then
        comp = CompetenciaTexto(vencimento)
    Else
        comp = competencia
    End If

    dias = DiasEmAtraso(vencimento)
    multa = CalcularMulta(valor, dias)
    juros = CalcularJuros(valor, dias)
    vfinal = CalcularValorFinal(valor, 0, multa, juros)
    id = ProximoIdContaReceber()

    cols = Array("ID", "Matrícula", "Nome", "Competência", "Valor Original", "Desconto", "Multa", "Juros", _
                 "Valor Final", "Forma Pagamento", "Data Vencimento", "Data Pagamento", "Situação", "Observação")
    vals = Array(id, matricula, nome, comp, Round(valor, 2), 0, multa, juros, vfinal, forma, _
                 vencimento, "", IIf(dias > DiasTolerancia(), "Atrasado", "Pendente"), observacao)
    Call AdicionarRegistroUnidade(SHT_RECEBER_BD, TBL_RECEBER_BD, cols, vals)

    Call SincronizarContasReceberUI
    Call AtualizarDashboardFinanceiro
    RegistrarLog "Conta a receber criada", "Financeiro", matricula & " / " & comp
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "CriarContaReceber"
End Sub

Public Function BuscarContaReceberPorId(ByVal idConta As Long) As ListRow
    Set BuscarContaReceberPorId = PesquisarRegistro(SHT_RECEBER_BD, TBL_RECEBER_BD, "ID", CStr(idConta), False)
End Function

Public Sub ReceberPagamento(ByVal idConta As Long, ByVal desconto As Double, ByVal forma As String, _
                            ByVal valorRecebido As Double, ByVal dataPag As Date, ByVal observacao As String)
    Dim lr As ListRow
    Dim vo As Double, multa As Double, juros As Double, esperado As Double
    Dim diff As Double
    Dim doc As String
    Dim sit As String
    Dim matricula As String, nome As String, comp As String

    On Error GoTo TrataErro
    If Not PodeOperarFinanceiro() Then
        Call ExigeAcesso("Financeiro")
        Exit Sub
    End If

    Set lr = BuscarContaReceberPorId(idConta)
    If lr Is Nothing Then
        MsgErro "Conta a receber não encontrada."
        Exit Sub
    End If

    sit = UCase$(NzStr(LerCampo(lr, "Situação")))
    If sit = "PAGO" Then
        MsgAviso "Esta conta já está paga."
        Exit Sub
    End If
    If sit = "CANCELADO" Then
        MsgAviso "Conta cancelada — não é possível receber."
        Exit Sub
    End If

    Call RecalcularEncargosConta(lr)
    vo = CDbl(Val(Replace(CStr(LerCampo(lr, "Valor Original")), ",", ".")))
    multa = CDbl(Val(Replace(CStr(LerCampo(lr, "Multa")), ",", ".")))
    juros = CDbl(Val(Replace(CStr(LerCampo(lr, "Juros")), ",", ".")))
    esperado = CalcularValorFinal(vo, 0, multa, juros)

    If desconto < 0 Then desconto = 0
    If valorRecebido <= 0 Then
        MsgAviso "Informe o valor recebido."
        Exit Sub
    End If

    diff = Round(esperado - desconto - valorRecebido, 2)
    If Abs(diff) > 0.009 And desconto <= 0 Then
        If MsgBox("Valor esperado: R$ " & Format$(esperado, "#,##0.00") & vbCrLf & _
                  "Valor recebido: R$ " & Format$(valorRecebido, "#,##0.00") & vbCrLf & _
                  "Diferença: R$ " & Format$(esperado - valorRecebido, "#,##0.00") & vbCrLf & vbCrLf & _
                  "Deseja lançar a diferença como desconto?", _
                  vbYesNo + vbQuestion, APP_TITLE) = vbYes Then
            desconto = Round(esperado - valorRecebido, 2)
            If desconto < 0 Then desconto = 0
        Else
            Exit Sub
        End If
    End If

    Call GravarCampo(lr, "Desconto", Round(desconto, 2))
    Call GravarCampo(lr, "Valor Final", Round(valorRecebido, 2))
    Call GravarCampo(lr, "Forma Pagamento", forma)
    Call GravarCampo(lr, "Data Pagamento", dataPag)
    Call GravarCampo(lr, "Situação", "Pago")
    If Len(Trim$(observacao)) > 0 Then Call GravarCampo(lr, "Observação", observacao)

    matricula = NzStr(LerCampo(lr, "Matrícula"))
    nome = NzStr(LerCampo(lr, "Nome"))
    comp = NzStr(LerCampo(lr, "Competência"))
    doc = ProximoDocumento("REC")

    Call LancarNoRazao("Recebimento", "Mensalidade", "Receita", doc, 0, valorRecebido)
    Call AtualizarFluxoCaixa("Entrada", "Mensalidades", "Receb. " & nome & " " & comp, valorRecebido, 0)
    Call MarcarMensalidadePaga(matricula, comp, forma)

    Call SincronizarContasReceberUI
    Call AtualizarDashboardFinanceiro
    On Error Resume Next
    Call AtualizarBI
    Call AtualizarPainel
    Call AtualizarAcessoAposPagamento(matricula)
    On Error GoTo TrataErro
    RegistrarLog "Pagamento recebido", "Financeiro", doc & " / " & matricula & " / R$ " & Format$(valorRecebido, "0.00")
    MsgOk "Pagamento registrado." & vbCrLf & "Documento: " & doc & vbCrLf & _
          "Valor: R$ " & Format$(valorRecebido, "#,##0.00")
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "ReceberPagamento"
    MsgErro "Erro ao receber pagamento."
End Sub

Private Sub MarcarMensalidadePaga(ByVal matricula As String, ByVal competencia As String, ByVal forma As String)
    Dim lo As ListObject
    Dim lr As ListRow
    On Error Resume Next
    Set lo = ObterTabela(SHT_MENSALIDADES, TBL_MENSALIDADES)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Código")), matricula, vbTextCompare) = 0 Then
            If InStr(1, competencia, CStr(Year(CDate(LerCampo(lr, "Competência")))), vbTextCompare) > 0 Then
                Call GravarCampo(lr, "Status", "Pago")
                Call GravarCampo(lr, "Forma Pagamento", forma)
            End If
        End If
    Next lr
    On Error GoTo 0
End Sub

Public Sub EstornarPagamento(ByVal idConta As Long)
    Dim lr As ListRow
    Dim valor As Double, doc As String
    Dim matricula As String, nome As String

    On Error GoTo TrataErro
    If Not PodeOperarFinanceiro() Then
        Call ExigeAcesso("Financeiro")
        Exit Sub
    End If

    Set lr = BuscarContaReceberPorId(idConta)
    If lr Is Nothing Then MsgErro "Conta não encontrada.": Exit Sub
    If UCase$(NzStr(LerCampo(lr, "Situação"))) <> "PAGO" Then
        MsgAviso "Somente contas pagas podem ser estornadas."
        Exit Sub
    End If

    If MsgBox("Confirma o estorno deste pagamento?", vbYesNo + vbExclamation, APP_TITLE) <> vbYes Then Exit Sub

    valor = CDbl(Val(Replace(CStr(LerCampo(lr, "Valor Final")), ",", ".")))
    matricula = NzStr(LerCampo(lr, "Matrícula"))
    nome = NzStr(LerCampo(lr, "Nome"))
    doc = ProximoDocumento("EST")

    Call LancarNoRazao("Estorno", "Mensalidade", "Receita", doc, valor, 0)
    Call AtualizarFluxoCaixa("Saída", "Estorno", "Estorno " & nome, 0, valor)

    Call GravarCampo(lr, "Situação", "Pendente")
    Call GravarCampo(lr, "Data Pagamento", "")
    Call GravarCampo(lr, "Desconto", 0)
    Call RecalcularEncargosConta(lr)

    Call SincronizarContasReceberUI
    Call AtualizarDashboardFinanceiro
    RegistrarLog "Estorno de pagamento", "Financeiro", doc & " / " & matricula
    MsgOk "Estorno registrado: " & doc
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "EstornarPagamento"
    MsgErro "Erro ao estornar."
End Sub

Public Sub CancelarRecebimento(ByVal idConta As Long)
    Dim lr As ListRow
    On Error GoTo TrataErro
    If Not PodeOperarFinanceiro() Then
        Call ExigeAcesso("Financeiro")
        Exit Sub
    End If
    Set lr = BuscarContaReceberPorId(idConta)
    If lr Is Nothing Then MsgErro "Conta não encontrada.": Exit Sub
    If UCase$(NzStr(LerCampo(lr, "Situação"))) = "PAGO" Then
        MsgAviso "Conta paga — use Estornar antes de cancelar."
        Exit Sub
    End If
    If MsgBox("Cancelar esta conta a receber?", vbYesNo + vbQuestion, APP_TITLE) <> vbYes Then Exit Sub
    Call GravarCampo(lr, "Situação", "Cancelado")
    Call SincronizarContasReceberUI
    Call AtualizarDashboardFinanceiro
    RegistrarLog "Conta a receber cancelada", "Financeiro", "ID " & idConta
    MsgOk "Conta cancelada."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "CancelarRecebimento"
End Sub

Public Sub RegistrarReceita(ByVal categoria As String, ByVal descricao As String, ByVal valor As Double)
    Dim doc As String
    On Error GoTo TrataErro
    If Not PodeOperarFinanceiro() Then Call ExigeAcesso("Financeiro"): Exit Sub
    If valor <= 0 Then MsgAviso "Valor inválido.": Exit Sub
    doc = ProximoDocumento("REC")
    Call LancarNoRazao("Recebimento", "Avulso", categoria, doc, 0, valor)
    Call AtualizarFluxoCaixa("Entrada", categoria, descricao, valor, 0)
    Call AtualizarDashboardFinanceiro
    RegistrarLog "Receita avulsa", "Financeiro", doc
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "RegistrarReceita"
End Sub

' PDV / Estoque — permite recepção registrar venda sem perfil Financeiro
Public Sub RegistrarReceitaProduto(ByVal descricao As String, ByVal valor As Double)
    Dim doc As String
    On Error GoTo TrataErro
    If valor <= 0 Then Exit Sub
    doc = ProximoDocumento("REC")
    Call LancarNoRazao("Recebimento", "PDV", "Produtos", doc, 0, valor)
    Call AtualizarFluxoCaixa("Entrada", "Produtos", descricao, valor, 0)
    On Error Resume Next
    Call AtualizarDashboardFinanceiro
    On Error GoTo TrataErro
    RegistrarLog "Receita PDV", "PDV", doc
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "RegistrarReceitaProduto"
End Sub

Public Sub RegistrarDespesaEstoque(ByVal descricao As String, ByVal valor As Double)
    Dim doc As String
    On Error GoTo TrataErro
    If valor <= 0 Then Exit Sub
    doc = ProximoDocumento("PAG")
    Call LancarNoRazao("Pagamento", "Estoque", "Produtos (entrada)", doc, valor, 0)
    Call AtualizarFluxoCaixa("Saída", "Produtos (entrada)", descricao, 0, valor)
    On Error Resume Next
    Call AtualizarDashboardFinanceiro
    On Error GoTo TrataErro
    RegistrarLog "Despesa estoque", "Estoque", doc
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "RegistrarDespesaEstoque"
End Sub

Public Sub RegistrarDespesa(ByVal descricao As String, ByVal valor As Double, Optional ByVal categoria As String = "Outros")
    Dim doc As String
    On Error GoTo TrataErro
    If Not PodeOperarFinanceiro() Then Call ExigeAcesso("Financeiro"): Exit Sub
    If valor <= 0 Then MsgAviso "Valor inválido.": Exit Sub
    doc = ProximoDocumento("PAG")
    Call LancarNoRazao("Pagamento", "Despesa", categoria, doc, valor, 0)
    Call AtualizarFluxoCaixa("Saída", categoria, descricao, 0, valor)
    Call AtualizarDashboardFinanceiro
    RegistrarLog "Despesa registrada", "Financeiro", doc
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "RegistrarDespesa"
End Sub

Public Function CalcularTicketMedio() As Double
    Dim ativos As Long
    Dim receita As Double
    ativos = ContarAlunosAtivos()
    receita = SomaCreditosMes(Month(DataAtual()), Year(DataAtual()))
    If ativos <= 0 Then
        CalcularTicketMedio = 0
    Else
        CalcularTicketMedio = Round(receita / ativos, 2)
    End If
End Function

Public Function CalcularChurn() As Double
    Dim ativos As Long, cancelados As Long
    ativos = ContarAlunosAtivos()
    cancelados = ContarOnde(SHT_ALUNOS, TBL_ALUNOS, "Status", "Cancelado")
    If ativos <= 0 Then
        CalcularChurn = 0
    Else
        CalcularChurn = Round((cancelados / (ativos + cancelados)) * 100#, 1)
    End If
End Function

Public Function SomaCreditosDia(ByVal d As Date) As Double
    Dim lo As ListObject
    Dim lr As ListRow
    Dim tot As Double
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_LANCAMENTOS, TBL_LANCAMENTOS)
    For Each lr In lo.ListRows
        If IsDate(LerCampo(lr, "Data")) Then
            If CDate(LerCampo(lr, "Data")) = d Then
                tot = tot + CDbl(Val(Replace(CStr(LerCampo(lr, "Crédito")), ",", ".")))
            End If
        End If
    Next lr
Sai:
    SomaCreditosDia = tot
End Function

Public Function SomaCreditosMes(ByVal m As Long, ByVal a As Long) As Double
    Dim lo As ListObject
    Dim lr As ListRow
    Dim tot As Double, dt As Date
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_LANCAMENTOS, TBL_LANCAMENTOS)
    For Each lr In lo.ListRows
        If IsDate(LerCampo(lr, "Data")) Then
            dt = CDate(LerCampo(lr, "Data"))
            If Month(dt) = m And Year(dt) = a Then
                tot = tot + CDbl(Val(Replace(CStr(LerCampo(lr, "Crédito")), ",", ".")))
            End If
        End If
    Next lr
Sai:
    SomaCreditosMes = tot
End Function

Public Function SomaDebitosMes(ByVal m As Long, ByVal a As Long) As Double
    Dim lo As ListObject
    Dim lr As ListRow
    Dim tot As Double, dt As Date
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_LANCAMENTOS, TBL_LANCAMENTOS)
    For Each lr In lo.ListRows
        If IsDate(LerCampo(lr, "Data")) Then
            dt = CDate(LerCampo(lr, "Data"))
            If Month(dt) = m And Year(dt) = a Then
                tot = tot + CDbl(Val(Replace(CStr(LerCampo(lr, "Débito")), ",", ".")))
            End If
        End If
    Next lr
Sai:
    SomaDebitosMes = tot
End Function

Public Function SomaCreditosAno(ByVal a As Long) As Double
    Dim lo As ListObject
    Dim lr As ListRow
    Dim tot As Double, dt As Date
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_LANCAMENTOS, TBL_LANCAMENTOS)
    For Each lr In lo.ListRows
        If IsDate(LerCampo(lr, "Data")) Then
            dt = CDate(LerCampo(lr, "Data"))
            If Year(dt) = a Then
                tot = tot + CDbl(Val(Replace(CStr(LerCampo(lr, "Crédito")), ",", ".")))
            End If
        End If
    Next lr
Sai:
    SomaCreditosAno = tot
End Function

Public Function TotalAReceber() As Double
    Dim lo As ListObject
    Dim lr As ListRow
    Dim tot As Double, sit As String
    On Error GoTo Sai
    Call RecalcularTodasContasAbertas
    Set lo = ObterTabela(SHT_RECEBER_BD, TBL_RECEBER_BD)
    For Each lr In lo.ListRows
        sit = UCase$(NzStr(LerCampo(lr, "Situação")))
        If sit = "PENDENTE" Or sit = "ATRASADO" Then
            tot = tot + CDbl(Val(Replace(CStr(LerCampo(lr, "Valor Final")), ",", ".")))
        End If
    Next lr
Sai:
    TotalAReceber = tot
End Function

Public Function TotalEmAtraso() As Double
    Dim lo As ListObject
    Dim lr As ListRow
    Dim tot As Double
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_RECEBER_BD, TBL_RECEBER_BD)
    For Each lr In lo.ListRows
        If UCase$(NzStr(LerCampo(lr, "Situação"))) = "ATRASADO" Then
            tot = tot + CDbl(Val(Replace(CStr(LerCampo(lr, "Valor Final")), ",", ".")))
        End If
    Next lr
Sai:
    TotalEmAtraso = tot
End Function

Public Function TotalAPagar() As Double
    Dim lo As ListObject
    Dim lr As ListRow
    Dim tot As Double, sit As String
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_PAGAR_BD, TBL_PAGAR_BD)
    For Each lr In lo.ListRows
        sit = UCase$(NzStr(LerCampo(lr, "Situação")))
        If sit = "PENDENTE" Or sit = "ATRASADO" Then
            tot = tot + CDbl(Val(Replace(CStr(LerCampo(lr, "Valor")), ",", ".")))
        End If
    Next lr
Sai:
    TotalAPagar = tot
End Function

Public Function PercentualInadimplencia() As Double
    Dim lo As ListObject
    Dim lr As ListRow
    Dim abertas As Long, atrasadas As Long
    Dim sit As String
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_RECEBER_BD, TBL_RECEBER_BD)
    For Each lr In lo.ListRows
        sit = UCase$(NzStr(LerCampo(lr, "Situação")))
        If sit = "PENDENTE" Or sit = "ATRASADO" Then
            abertas = abertas + 1
            If sit = "ATRASADO" Then atrasadas = atrasadas + 1
        End If
    Next lr
    If abertas <= 0 Then
        PercentualInadimplencia = 0
    Else
        PercentualInadimplencia = Round((atrasadas / abertas) * 100#, 1)
    End If
    Exit Function
Sai:
    PercentualInadimplencia = 0
End Function

Public Sub AtualizarDashboardFinanceiro()
    Dim m As Long, a As Long
    Dim recMes As Double, despMes As Double, lucro As Double
    On Error Resume Next
    m = Month(DataAtual())
    a = Year(DataAtual())
    recMes = SomaCreditosMes(m, a)
    despMes = SomaDebitosMes(m, a)
    lucro = recMes - despMes

    GravarCelula "04_FINANCEIRO", "N3", SomaCreditosDia(DataAtual())
    GravarCelula "04_FINANCEIRO", "N6", recMes
    GravarCelula "04_FINANCEIRO", "N7", despMes
    GravarCelula "04_FINANCEIRO", "N8", lucro
    GravarCelula "04_FINANCEIRO", "N9", UltimoSaldoFluxo()
    GravarCelula "04_FINANCEIRO", "N10", PercentualInadimplencia()
    GravarCelula "04_FINANCEIRO", "N11", SomaCreditosAno(a)
    GravarCelula "04_FINANCEIRO", "N12", TotalAReceber()
    GravarCelula "04_FINANCEIRO", "N13", TotalAPagar()
    GravarCelula "04_FINANCEIRO", "N14", CalcularTicketMedio()
    GravarCelula "04_FINANCEIRO", "N15", CalcularChurn()
    GravarCelula "04_FINANCEIRO", "N16", TotalAReceber()
    GravarCelula "04_FINANCEIRO", "N17", recMes
    GravarCelula "04_FINANCEIRO", "N18", TotalEmAtraso()

    Application.Calculate
    On Error GoTo 0
End Sub

Public Sub GerarDRE()
    Dim m As Long, a As Long
    Dim rec As Double, desp As Double
    On Error GoTo TrataErro
    If Not PodeOperarFinanceiro() Then Call ExigeAcesso("Financeiro"): Exit Sub
    m = Month(DataAtual())
    a = Year(DataAtual())
    rec = SomaCreditosMes(m, a)
    desp = SomaDebitosMes(m, a)
    MsgOk "DRE SIMPLIFICADA — " & Format$(DataAtual(), "mm/yyyy") & vbCrLf & vbCrLf & _
          "Receita: R$ " & Format$(rec, "#,##0.00") & vbCrLf & _
          "Despesas: R$ " & Format$(desp, "#,##0.00") & vbCrLf & _
          "Lucro: R$ " & Format$(rec - desp, "#,##0.00")
    RegistrarLog "DRE gerada", "Financeiro", Format$(DataAtual(), "mm/yyyy")
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "GerarDRE"
End Sub

Public Sub SincronizarContasReceberUI()
    Dim loSrc As ListObject, loFin As ListObject, lo06 As ListObject
    Dim lrSrc As ListRow, lrDst As ListRow
    Dim i As Long, sit As String

    On Error GoTo Falha
    Call RecalcularTodasContasAbertas
    Set loSrc = ObterTabela(SHT_RECEBER_BD, TBL_RECEBER_BD)
    Set loFin = ObterTabela("04_FINANCEIRO", "tblFinanceiro")
    Set lo06 = ObterTabela(SHT_RECEBER, TBL_RECEBER)

    Call LimparTabelaMantendoUma(loFin)
    Call LimparTabelaMantendoUma(lo06)

    i = 0
    For Each lrSrc In loSrc.ListRows
        If Len(NzStr(LerCampo(lrSrc, "Matrícula"))) = 0 Then GoTo Prox
        sit = UCase$(NzStr(LerCampo(lrSrc, "Situação")))
        If sit = "PAGO" Or sit = "CANCELADO" Then GoTo Prox
        i = i + 1
        If i = 1 Then
            Set lrDst = loFin.ListRows(1)
        Else
            Set lrDst = loFin.ListRows.Add
        End If
        lrDst.Range(1, 1).Value = LerCampo(lrSrc, "ID")
        lrDst.Range(1, 2).Value = LerCampo(lrSrc, "Nome")
        lrDst.Range(1, 3).Value = LerCampo(lrSrc, "Competência")
        lrDst.Range(1, 4).Value = LerCampo(lrSrc, "Valor Final")
        lrDst.Range(1, 5).Value = LerCampo(lrSrc, "Situação")
        lrDst.Range(1, 6).Value = LerCampo(lrSrc, "Data Vencimento")
        lrDst.Range(1, 7).Value = LerCampo(lrSrc, "Data Pagamento")
        lrDst.Range(1, 8).Value = LerCampo(lrSrc, "Matrícula")
        lrDst.Range(1, 9).Value = LerCampo(lrSrc, "Forma Pagamento")
        lrDst.Range(1, 10).Value = LerCampo(lrSrc, "Valor Original")

        If i = 1 Then
            Set lrDst = lo06.ListRows(1)
        Else
            Set lrDst = lo06.ListRows.Add
        End If
        lrDst.Range(1, 1).Value = LerCampo(lrSrc, "ID")
        lrDst.Range(1, 2).Value = LerCampo(lrSrc, "Nome")
        lrDst.Range(1, 3).Value = LerCampo(lrSrc, "Matrícula")
        lrDst.Range(1, 4).Value = LerCampo(lrSrc, "Competência")
        lrDst.Range(1, 5).Value = LerCampo(lrSrc, "Valor Final")
        lrDst.Range(1, 6).Value = LerCampo(lrSrc, "Data Vencimento")
        lrDst.Range(1, 7).Value = DiasEmAtraso(CDate(LerCampo(lrSrc, "Data Vencimento")))
        lrDst.Range(1, 8).Value = LerCampo(lrSrc, "Situação")
        lrDst.Range(1, 9).Value = LerCampo(lrSrc, "Forma Pagamento")
        lrDst.Range(1, 10).Value = LerCampo(lrSrc, "Data Pagamento")
Prox:
    Next lrSrc
    Exit Sub
Falha:
End Sub

Private Sub LimparTabelaMantendoUma(ByVal lo As ListObject)
    Dim c As Long
    On Error Resume Next
    Do While lo.ListRows.Count > 1
        lo.ListRows(lo.ListRows.Count).Delete
    Loop
    If lo.ListRows.Count = 0 Then lo.ListRows.Add
    For c = 1 To lo.ListColumns.Count
        lo.ListRows(1).Range(1, c).Value = ""
    Next c
    On Error GoTo 0
End Sub

'------------------------------------------------------------
' UI macros (botões)
'------------------------------------------------------------
Public Sub AbrirReceber()
    Dim idConta As Long
    On Error GoTo TrataErro
    If Not PodeOperarFinanceiro() Then Call ExigeAcesso("Financeiro"): Exit Sub
    idConta = IdContaSelecionada()
    If idConta <= 0 Then
        idConta = CLng(Val(InputBox("ID da conta a receber:", "Receber Pagamento")))
    End If
    If idConta <= 0 Then Exit Sub
    Call PrepararFrmReceber(idConta)
    frmReceber.Show vbModal
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AbrirReceber"
End Sub

Public Sub PrepararFrmReceber(ByVal idConta As Long)
    gIdContaReceber = idConta
End Sub

Private Function IdContaSelecionada() As Long
    Dim ws As Worksheet
    Dim r As Long
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets("04_FINANCEIRO")
    r = ActiveCell.Row
    If ActiveSheet.Name = "04_FINANCEIRO" And r >= 8 Then
        IdContaSelecionada = CLng(Val(ws.Cells(r, 1).Value))
    ElseIf ActiveSheet.Name = "06_CONTAS_RECEBER" And r >= 6 Then
        IdContaSelecionada = CLng(Val(ActiveSheet.Cells(r, 1).Value))
    Else
        IdContaSelecionada = 0
    End If
    On Error GoTo 0
End Function

Public Sub CancelarContaSelecionada()
    Dim idConta As Long
    idConta = IdContaSelecionada()
    If idConta <= 0 Then
        idConta = CLng(Val(InputBox("ID da conta:", "Cancelar")))
    End If
    If idConta > 0 Then Call CancelarRecebimento(idConta)
End Sub

Public Sub EstornarContaSelecionada()
    Dim idConta As Long
    idConta = IdContaSelecionada()
    If idConta <= 0 Then
        idConta = CLng(Val(InputBox("ID da conta paga:", "Estornar")))
    End If
    If idConta > 0 Then Call EstornarPagamento(idConta)
End Sub

Public Sub PesquisarFinanceiro()
    Dim termo As String
    On Error Resume Next
    termo = NzStr(LerCelula("04_FINANCEIRO", "B5"))
    If Len(termo) = 0 Then termo = InputBox("Nome ou matrícula:", "Pesquisar")
    If Len(termo) = 0 Then Exit Sub
    ThisWorkbook.Sheets("04_FINANCEIRO").Range("A7:J7").AutoFilter Field:=2, Criteria1:="=*" & termo & "*"
    On Error GoTo 0
End Sub

Public Sub ExportarFinanceiroExcel()
    On Error Resume Next
    If Not PodeOperarFinanceiro() Then Call ExigeAcesso("Financeiro"): Exit Sub
    ThisWorkbook.Sheets("04_FINANCEIRO").Copy
    Application.Dialogs(xlDialogSaveAs).Show
    On Error GoTo 0
End Sub

Public Sub NovaDespesaRapida()
    Dim desc As String, cat As String, v As String
    If Not PodeOperarFinanceiro() Then Call ExigeAcesso("Financeiro"): Exit Sub
    desc = InputBox("Descrição da despesa:", "Nova Despesa")
    If Len(Trim$(desc)) = 0 Then Exit Sub
    cat = InputBox("Categoria (Aluguel, Energia, Funcionários...):", "Categoria", "Outros")
    v = InputBox("Valor (R$):", "Valor", "0")
    Call RegistrarDespesa(desc, CDbl(Val(Replace(v, ",", "."))), cat)
    MsgOk "Despesa lançada no livro-razão."
End Sub

' Compat
Public Function ReceitaMensal() As Double
    ReceitaMensal = SomaCreditosMes(Month(DataAtual()), Year(DataAtual()))
End Function

Public Function TicketMedio() As Double
    TicketMedio = CalcularTicketMedio()
End Function

Public Function Inadimplencia() As Double
    Inadimplencia = PercentualInadimplencia()
End Function

Public Sub FluxoCaixa()
    NavegarPara "05_FLUXO_CAIXA"
End Sub

Public Sub GerarRecibo()
    Call AbrirReceber
End Sub

Public Sub RegistrarPagamento(ByVal aluno As String, ByVal valor As Double)
    ' Legado — use ReceberPagamento / AbrirReceber
    RegistrarLog "Pagamento (legado) " & aluno & " R$ " & valor, "Financeiro"
End Sub

Public Sub RegistrarVendaEstoque()
    Dim prod As String, qtd As Double, preco As Double
    Dim lo As ListObject
    Dim lr As ListRow

    On Error GoTo TrataErro
    If Not ExigeAcesso("Estoque") Then Exit Sub

    prod = NzStr(LerCelula("09_ESTOQUE", "O7"))
    qtd = Val(LerCelula("09_ESTOQUE", "Q7"))
    If prod = "" Or qtd <= 0 Then
        MsgAviso "Preencha Produto e Quantidade na movimentação (linha 7)."
        Exit Sub
    End If

    Set lo = ObterTabela("09_ESTOQUE", "tblEstoque")
    For Each lr In lo.ListRows
        If NzStr(LerCampo(lr, "Produto")) = prod Then
            If Val(LerCampo(lr, "Qtd Atual")) < qtd Then
                MsgAviso "Estoque insuficiente.": Exit Sub
            End If
            Call GravarCampo(lr, "Qtd Atual", Val(LerCampo(lr, "Qtd Atual")) - qtd)
            preco = Val(LerCampo(lr, "Preço Venda"))
            Call RegistrarReceita("Produtos", "Venda " & prod & " x" & qtd, preco * qtd)
            MsgOk "Venda registrada no livro-razão."
            Exit Sub
        End If
    Next lr
    MsgAviso "Produto não encontrado."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "RegistrarVendaEstoque"
    MsgErro "Erro ao registrar venda."
End Sub
