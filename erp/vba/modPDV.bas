Attribute VB_Name = "modPDV"
Option Explicit

'============================================================
' Sprint 9.0 — PDV Inteligente (carrinho + venda + financeiro)
'============================================================

Public Const SHT_PDV As String = "28_PDV"
Public Const SHT_VENDAS As String = "BD_VENDAS"
Public Const TBL_VENDAS As String = "tbVendas"
Public Const SHT_VENDA_ITENS As String = "BD_VENDA_ITENS"
Public Const TBL_VENDA_ITENS As String = "tbVendaItens"

Private Const CARRINHO_INI As Long = 26
Private Const CARRINHO_FIM As Long = 37

Public Sub IrPDV(): NavegarPara SHT_PDV: End Sub
Public Sub AbrirPDVEAtualizar(): Call NovaVenda: Call AtualizarEstoque: NavegarPara SHT_PDV: End Sub

Private Function UsuarioPDV() As String
    Dim n As String
    On Error Resume Next
    n = NzStr(LerCelula("BD_SESSAO", "B2"))
    If Len(n) = 0 Then n = "Recepção"
    UsuarioPDV = n
End Function

Public Sub NovaVenda()
    On Error GoTo TrataErro
    Call LimparIntervalo(SHT_PDV, "D12:D19")
    Call LimparIntervalo(SHT_PDV, "C26:H37")
    GravarCelula SHT_PDV, "D12", "Balcão"
    GravarCelula SHT_PDV, "D13", ""
    GravarCelula SHT_PDV, "D14", ""
    GravarCelula SHT_PDV, "D15", ""
    GravarCelula SHT_PDV, "D16", ""
    GravarCelula SHT_PDV, "D17", 1
    GravarCelula SHT_PDV, "D18", "PIX"
    GravarCelula SHT_PDV, "D19", ""
    GravarCelula SHT_PDV, "H12", 0
    GravarCelula SHT_PDV, "H16", 0
    Call AtualizarKPIsPDV
    Call AtualizarListaVendasPDV
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "NovaVenda"
End Sub

Public Sub BuscarProdutoPDV()
    Dim cod As String, lr As ListRow
    On Error GoTo TrataErro
    cod = Trim$(NzStr(LerCelula(SHT_PDV, "D14")))
    If Len(cod) = 0 Then
        cod = Trim$(InputBox("Código ou código de barras:", "PDV"))
        If Len(cod) = 0 Then Exit Sub
        GravarCelula SHT_PDV, "D14", cod
    End If
    Set lr = BuscarProdutoPorCodigo(cod)
    If lr Is Nothing Then MsgAviso "Produto não encontrado.": Exit Sub
    GravarCelula SHT_PDV, "D14", NzStr(LerCampo(lr, "Código"))
    GravarCelula SHT_PDV, "D15", NzStr(LerCampo(lr, "Produto"))
    GravarCelula SHT_PDV, "D16", Val(LerCampo(lr, "Preço Venda"))
    If Val(LerCelula(SHT_PDV, "D17")) <= 0 Then GravarCelula SHT_PDV, "D17", 1
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "BuscarProdutoPDV"
End Sub

Private Function ProximaLinhaCarrinho() As Long
    Dim r As Long
    For r = CARRINHO_INI To CARRINHO_FIM
        If Len(Trim$(NzStr(LerCelula(SHT_PDV, "C" & r)))) = 0 Then
            ProximaLinhaCarrinho = r
            Exit Function
        End If
    Next r
    ProximaLinhaCarrinho = 0
End Function

Private Sub RecalcularTotalCarrinho()
    Dim r As Long, tot As Double, n As Long, subT As Double
    For r = CARRINHO_INI To CARRINHO_FIM
        If Len(Trim$(NzStr(LerCelula(SHT_PDV, "C" & r)))) = 0 Then GoTo Prox
        subT = Val(LerCelula(SHT_PDV, "G" & r))
        tot = tot + subT
        n = n + 1
Prox:
    Next r
    GravarCelula SHT_PDV, "H12", Round(tot, 2)
    GravarCelula SHT_PDV, "H16", n
End Sub

Public Sub AdicionarProduto()
    Dim cod As String, nome As String, preco As Double, qtde As Double
    Dim lr As ListRow, r As Long, i As Long, qExist As Double
    On Error GoTo TrataErro
    If Not PodeAcessar("Estoque") Then
        If Not PodeAcessar("Alunos") Then Call ExigeAcesso("Estoque"): Exit Sub
    End If
    Call BuscarProdutoPDV
    cod = Trim$(NzStr(LerCelula(SHT_PDV, "D14")))
    nome = Trim$(NzStr(LerCelula(SHT_PDV, "D15")))
    preco = Val(LerCelula(SHT_PDV, "D16"))
    qtde = Val(LerCelula(SHT_PDV, "D17"))
    If Len(cod) = 0 Or qtde <= 0 Then MsgAviso "Informe produto e quantidade.": Exit Sub
    Set lr = BuscarProdutoPorCodigo(cod)
    If lr Is Nothing Then MsgAviso "Produto não encontrado.": Exit Sub
    If Val(LerCampo(lr, "Estoque Atual")) < qtde Then
        MsgAviso "Estoque insuficiente. Disponível: " & LerCampo(lr, "Estoque Atual")
        Exit Sub
    End If
    ' Soma se já estiver no carrinho
    For i = CARRINHO_INI To CARRINHO_FIM
        If StrComp(NzStr(LerCelula(SHT_PDV, "C" & i)), cod, vbTextCompare) = 0 Then
            qExist = Val(LerCelula(SHT_PDV, "E" & i)) + qtde
            If Val(LerCampo(lr, "Estoque Atual")) < qExist Then
                MsgAviso "Estoque insuficiente para essa quantidade."
                Exit Sub
            End If
            GravarCelula SHT_PDV, "E" & i, qExist
            GravarCelula SHT_PDV, "G" & i, Round(qExist * preco, 2)
            Call RecalcularTotalCarrinho
            Exit Sub
        End If
    Next i
    r = ProximaLinhaCarrinho()
    If r = 0 Then MsgAviso "Carrinho cheio (máx. 12 itens).": Exit Sub
    GravarCelula SHT_PDV, "C" & r, cod
    GravarCelula SHT_PDV, "D" & r, nome
    GravarCelula SHT_PDV, "E" & r, qtde
    GravarCelula SHT_PDV, "F" & r, Round(preco, 2)
    GravarCelula SHT_PDV, "G" & r, Round(preco * qtde, 2)
    Call RecalcularTotalCarrinho
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AdicionarProduto"
End Sub

Public Sub RemoverProduto()
    Dim r As Long, cod As String
    On Error GoTo TrataErro
    cod = Trim$(InputBox("Código do item a remover do carrinho:", "PDV"))
    If Len(cod) = 0 Then Exit Sub
    For r = CARRINHO_INI To CARRINHO_FIM
        If StrComp(NzStr(LerCelula(SHT_PDV, "C" & r)), cod, vbTextCompare) = 0 Then
            Call LimparIntervalo(SHT_PDV, "C" & r & ":H" & r)
            Call CompactarCarrinho
            Call RecalcularTotalCarrinho
            Exit Sub
        End If
    Next r
    MsgAviso "Item não está no carrinho."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "RemoverProduto"
End Sub

Private Sub CompactarCarrinho()
    Dim src As Long, dst As Long
    Dim c As String, p As String, q As Variant, pr As Variant, s As Variant
    dst = CARRINHO_INI
    For src = CARRINHO_INI To CARRINHO_FIM
        c = Trim$(NzStr(LerCelula(SHT_PDV, "C" & src)))
        If Len(c) = 0 Then GoTo Prox
        If src <> dst Then
            p = NzStr(LerCelula(SHT_PDV, "D" & src))
            q = LerCelula(SHT_PDV, "E" & src)
            pr = LerCelula(SHT_PDV, "F" & src)
            s = LerCelula(SHT_PDV, "G" & src)
            Call LimparIntervalo(SHT_PDV, "C" & src & ":H" & src)
            GravarCelula SHT_PDV, "C" & dst, c
            GravarCelula SHT_PDV, "D" & dst, p
            GravarCelula SHT_PDV, "E" & dst, q
            GravarCelula SHT_PDV, "F" & dst, pr
            GravarCelula SHT_PDV, "G" & dst, s
        End If
        dst = dst + 1
Prox:
    Next src
    If dst <= CARRINHO_FIM Then Call LimparIntervalo(SHT_PDV, "C" & dst & ":H" & CARRINHO_FIM)
End Sub

Public Sub AdicionarKit()
    Dim kit As String, lo As ListObject, lr As ListRow
    Dim codP As String, qtde As Double, lrP As ListRow
    On Error GoTo TrataErro
    kit = Trim$(NzStr(LerCelula(SHT_PDV, "D19")))
    If Len(kit) = 0 Then
        kit = Trim$(InputBox("Código do kit (ex: KIT-001):", "Kit Hipertrofia", "KIT-001"))
        If Len(kit) = 0 Then Exit Sub
        GravarCelula SHT_PDV, "D19", kit
    End If
    Set lo = ObterTabela(SHT_KIT_ITENS, TBL_KIT_ITENS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Kit Código")), kit, vbTextCompare) <> 0 Then GoTo Prox
        codP = NzStr(LerCampo(lr, "Produto Código"))
        qtde = Val(LerCampo(lr, "Qtde"))
        Set lrP = BuscarProdutoPorCodigo(codP)
        If lrP Is Nothing Then GoTo Prox
        GravarCelula SHT_PDV, "D14", codP
        GravarCelula SHT_PDV, "D15", NzStr(LerCampo(lrP, "Produto"))
        GravarCelula SHT_PDV, "D16", Val(LerCampo(lrP, "Preço Venda"))
        GravarCelula SHT_PDV, "D17", qtde
        Call AdicionarProduto
Prox:
    Next lr
    MsgOk "Kit adicionado ao carrinho."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AdicionarKit"
End Sub

Public Sub FinalizarVenda()
    Dim r As Long, nItens As Long, total As Double, custoTot As Double
    Dim cod As String, nome As String, qtde As Double, preco As Double, subT As Double
    Dim lrP As ListRow, idVenda As Long, idItem As Long
    Dim cliente As String, mat As String, forma As String
    Dim naMens As String, resp As VbMsgBoxResult
    Dim cols As Variant, vals As Variant
    Dim custoUnit As Double
    On Error GoTo TrataErro
    If Not PodeAcessar("Estoque") Then
        If Not PodeAcessar("Alunos") Then Call ExigeAcesso("Estoque"): Exit Sub
    End If
    Call RecalcularTotalCarrinho
    total = Val(LerCelula(SHT_PDV, "H12"))
    nItens = CLng(Val(LerCelula(SHT_PDV, "H16")))
    If nItens <= 0 Or total <= 0 Then MsgAviso "Carrinho vazio.": Exit Sub

    cliente = Trim$(NzStr(LerCelula(SHT_PDV, "D12")))
    If Len(cliente) = 0 Then cliente = "Balcão"
    mat = Trim$(NzStr(LerCelula(SHT_PDV, "D13")))
    forma = Trim$(NzStr(LerCelula(SHT_PDV, "D18")))
    If Len(forma) = 0 Then forma = "PIX"

    naMens = "NÃO"
    If Len(mat) > 0 Or (Len(cliente) > 0 And StrComp(cliente, "Balcão", vbTextCompare) <> 0) Then
        If Len(mat) = 0 Then
            ' tenta achar matrícula pelo nome
            Dim lrA As ListRow
            Set lrA = BuscarLinhaAlunoPorNome(cliente)
            If Not lrA Is Nothing Then
                mat = NzStr(LerCampo(lrA, "Matrícula"))
                cliente = NzStr(LerCampo(lrA, "Nome"))
            End If
        End If
        If Len(mat) > 0 Then
            resp = MsgBox("Adicionar esta compra na próxima mensalidade do aluno?", _
                          vbYesNo + vbQuestion, "Venda para Aluno")
            If resp = vbYes Then naMens = "SIM"
        End If
    End If

    ' Valida estoque de todos os itens
    For r = CARRINHO_INI To CARRINHO_FIM
        cod = Trim$(NzStr(LerCelula(SHT_PDV, "C" & r)))
        If Len(cod) = 0 Then GoTo ValProx
        qtde = Val(LerCelula(SHT_PDV, "E" & r))
        Set lrP = BuscarProdutoPorCodigo(cod)
        If lrP Is Nothing Then MsgErro "Produto inválido: " & cod: Exit Sub
        If Val(LerCampo(lrP, "Estoque Atual")) < qtde Then
            MsgErro "Estoque insuficiente: " & NzStr(LerCampo(lrP, "Produto"))
            Exit Sub
        End If
ValProx:
    Next r

    idVenda = MaxNumerico(SHT_VENDAS, TBL_VENDAS, "ID") + 1
    idItem = MaxNumerico(SHT_VENDA_ITENS, TBL_VENDA_ITENS, "ID")
    custoTot = 0

    For r = CARRINHO_INI To CARRINHO_FIM
        cod = Trim$(NzStr(LerCelula(SHT_PDV, "C" & r)))
        If Len(cod) = 0 Then GoTo ItemProx
        nome = NzStr(LerCelula(SHT_PDV, "D" & r))
        qtde = Val(LerCelula(SHT_PDV, "E" & r))
        preco = Val(LerCelula(SHT_PDV, "F" & r))
        subT = Val(LerCelula(SHT_PDV, "G" & r))
        Set lrP = BuscarProdutoPorCodigo(cod)
        custoUnit = Val(LerCampo(lrP, "Custo"))
        custoTot = custoTot + (custoUnit * qtde)
        idItem = idItem + 1
        cols = Array("ID", "Venda ID", "Código", "Produto", "Qtde", "Preço", "Subtotal", "Custo")
        vals = Array(idItem, idVenda, cod, nome, qtde, Round(preco, 2), Round(subT, 2), Round(custoUnit * qtde, 2))
        Call AdicionarRegistro(SHT_VENDA_ITENS, TBL_VENDA_ITENS, cols, vals)
        Call AtualizarSaldoProduto(cod, -qtde)
        Call RegistrarMovimentacao(cod, nome, "Venda", qtde, "PDV #" & idVenda)
ItemProx:
    Next r

    cols = Array("ID", "Data", "Cliente", "Matrícula", "Itens", "Total", "Custo", "Lucro", _
                 "Forma", "Status", "Usuário", "Na Mensalidade", "Unidade", "UnidadeID")
    vals = Array(idVenda, DataAtual(), cliente, mat, nItens, Round(total, 2), Round(custoTot, 2), _
                 Round(total - custoTot, 2), forma, "Finalizada", UsuarioPDV(), naMens, _
                 NomeUnidadeSessao(), IIf(UnidadeIDSessao() > 0, UnidadeIDSessao(), 1))
    Call AdicionarRegistroUnidade(SHT_VENDAS, TBL_VENDAS, cols, vals)

    If naMens = "SIM" And Len(mat) > 0 Then
        Call LancarVendaNaMensalidade(mat, cliente, total, idVenda)
    Else
        Call AtualizarFinanceiroPDV(total, idVenda, forma)
    End If

    Call AtualizarDashboardPDV
    Call AtualizarEstoque
    On Error Resume Next
    Call AtualizarPainel
    Call AtualizarBI
    On Error GoTo TrataErro

    RegistrarLog "Venda PDV", "PDV", "#" & idVenda & " / R$ " & Format$(total, "0.00") & " / " & forma
    Call EmitirComprovante(idVenda, cliente, total, forma)
    Call NovaVenda
    MsgOk "Venda #" & idVenda & " finalizada." & vbCrLf & _
          "Total: R$ " & Format$(total, "#,##0.00") & vbCrLf & "Forma: " & forma
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "FinalizarVenda"
    MsgErro "Erro ao finalizar venda."
End Sub

Public Sub CancelarVenda()
    If MsgBox("Limpar carrinho atual?", vbYesNo + vbQuestion, "Cancelar Venda") = vbYes Then
        Call NovaVenda
    End If
End Sub

Public Sub AtualizarFinanceiroPDV(ByVal total As Double, ByVal idVenda As Long, ByVal forma As String)
    On Error Resume Next
    Call RegistrarReceitaProduto("Venda PDV #" & idVenda & " (" & forma & ")", total)
    On Error GoTo 0
End Sub

Private Sub LancarVendaNaMensalidade(ByVal matricula As String, ByVal nome As String, _
                                    ByVal total As Double, ByVal idVenda As Long)
    Dim venc As Date
    On Error GoTo TrataErro
    venc = DateSerial(Year(DataAtual()), Month(DataAtual()) + 1, _
                      CLng(ObterParametroNumero("Financeiro", "DiaVencimentoPadrao", 10)))
    Call CriarContaReceber(matricula, nome, total, venc, "", "", _
                           "Produtos PDV #" & idVenda)
    RegistrarLog "Venda na mensalidade", "PDV", matricula & " / #" & idVenda
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "LancarVendaNaMensalidade"
    ' Fallback: receita avulsa
    Call AtualizarFinanceiroPDV(total, idVenda, "Mensalidade")
End Sub

Public Sub EmitirComprovante(ByVal idVenda As Long, ByVal cliente As String, _
                            ByVal total As Double, ByVal forma As String)
    On Error Resume Next
    MsgOk "=== COMPROVANTE PDV ===" & vbCrLf & _
          "Venda #" & idVenda & vbCrLf & _
          "Cliente: " & cliente & vbCrLf & _
          "Total: R$ " & Format$(total, "#,##0.00") & vbCrLf & _
          "Pagamento: " & forma & vbCrLf & _
          "Data: " & Format$(DataAtual(), "DD/MM/YYYY") & vbCrLf & _
          "ATHENAS GYM"
End Sub

Public Sub AtualizarDashboardPDV()
    Call AtualizarKPIsPDV
    Call AtualizarListaVendasPDV
    Call AtualizarDashboardEstoquePDV
End Sub

Public Sub AtualizarKPIsPDV()
    Dim lo As ListObject, lr As ListRow
    Dim hoje As Date, vendas As Double, itens As Long, lucro As Double, n As Long
    On Error Resume Next
    hoje = DataAtual()
    Set lo = ObterTabela(SHT_VENDAS, TBL_VENDAS)
    For Each lr In lo.ListRows
        If Not IsDate(LerCampo(lr, "Data")) Then GoTo Prox
        If CDate(LerCampo(lr, "Data")) <> hoje Then GoTo Prox
        If UCase$(NzStr(LerCampo(lr, "Status"))) <> "FINALIZADA" Then GoTo Prox
        vendas = vendas + Val(LerCampo(lr, "Total"))
        lucro = lucro + Val(LerCampo(lr, "Lucro"))
        itens = itens + CLng(Val(LerCampo(lr, "Itens")))
        n = n + 1
Prox:
    Next lr
    GravarCelula SHT_PDV, "C8", "R$ " & Format$(vendas, "#,##0.00")
    GravarCelula SHT_PDV, "E8", itens
    If n > 0 Then
        GravarCelula SHT_PDV, "G8", "R$ " & Format$(vendas / n, "#,##0.00")
    Else
        GravarCelula SHT_PDV, "G8", "R$ 0,00"
    End If
    GravarCelula SHT_PDV, "I8", "R$ " & Format$(lucro, "#,##0.00")
End Sub

Public Sub AtualizarListaVendasPDV()
    Dim lo As ListObject, lr As ListRow
    Dim rows() As Variant, n As Long, i As Long, r As Long
    Dim id As Long, maxShow As Long
    On Error Resume Next
    Call LimparIntervalo(SHT_PDV, "C42:H47")
    Set lo = ObterTabela(SHT_VENDAS, TBL_VENDAS)
    n = lo.ListRows.Count
    If n = 0 Then Exit Sub
    maxShow = 6
    r = 42
    For i = n To 1 Step -1
        If r > 47 Then Exit For
        Set lr = lo.ListRows(i)
        GravarCelula SHT_PDV, "C" & r, LerCampo(lr, "ID")
        If IsDate(LerCampo(lr, "Data")) Then
            GravarCelula SHT_PDV, "D" & r, Format$(CDate(LerCampo(lr, "Data")), "DD/MM")
        End If
        GravarCelula SHT_PDV, "E" & r, NzStr(LerCampo(lr, "Cliente"))
        GravarCelula SHT_PDV, "F" & r, Val(LerCampo(lr, "Total"))
        GravarCelula SHT_PDV, "G" & r, NzStr(LerCampo(lr, "Forma"))
        GravarCelula SHT_PDV, "H" & r, NzStr(LerCampo(lr, "Status"))
        r = r + 1
    Next i
End Sub

' Atalhos de forma de pagamento
Public Sub PDV_PIX(): GravarCelula SHT_PDV, "D18", "PIX": End Sub
Public Sub PDV_Cartao(): GravarCelula SHT_PDV, "D18", "Cartão": End Sub
Public Sub PDV_Dinheiro(): GravarCelula SHT_PDV, "D18", "Dinheiro": End Sub
