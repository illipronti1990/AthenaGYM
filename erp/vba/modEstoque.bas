Attribute VB_Name = "modEstoque"
Option Explicit

'============================================================
' Sprint 9.0 — Gestao de Estoque (movimentacoes + alertas + ABC)
'============================================================

Public Const SHT_PRODUTOS As String = "BD_PRODUTOS"
Public Const TBL_PRODUTOS As String = "tbProdutos"
Public Const SHT_FORNEC As String = "BD_FORNECEDORES"
Public Const TBL_FORNEC As String = "tbFornecedores"
Public Const SHT_COMPRAS As String = "BD_COMPRAS"
Public Const TBL_COMPRAS As String = "tbCompras"
Public Const SHT_MOV_EST As String = "BD_MOVIMENTACAO_ESTOQUE"
Public Const TBL_MOV_EST As String = "tbMovEstoque"
Public Const SHT_LOTES As String = "BD_LOTES"
Public Const TBL_LOTES As String = "tbLotes"
Public Const SHT_UNIDADES As String = "BD_UNIDADES"
Public Const TBL_UNIDADES As String = "tbUnidades"
Public Const SHT_KITS As String = "BD_KITS"
Public Const TBL_KITS As String = "tbKits"
Public Const SHT_KIT_ITENS As String = "BD_KIT_ITENS"
Public Const TBL_KIT_ITENS As String = "tbKitItens"
Public Const SHT_INVENTARIO As String = "29_INVENTARIO"
Public Const SHT_DASH_PDV As String = "30_DASH_PDV"
Public Const SHT_ESTOQUE_UI As String = "09_ESTOQUE"

Public Sub AtualizarEstoque()
    On Error GoTo TrataErro
    Call GerarAlertaEstoque
    Call SincronizarEstoqueUI
    Call AtualizarDashboardEstoquePDV
    Application.Calculate
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarEstoque"
End Sub

Public Sub IrEstoqueGestao(): NavegarPara SHT_ESTOQUE_UI: End Sub
Public Sub IrInventario(): NavegarPara SHT_INVENTARIO: End Sub
Public Sub IrDashPDV(): NavegarPara SHT_DASH_PDV: End Sub

Private Function UsuarioEstoque() As String
    Dim n As String
    On Error Resume Next
    n = NzStr(LerCelula("BD_SESSAO", "B2"))
    If Len(n) = 0 Then n = "Sistema"
    UsuarioEstoque = n
End Function

Private Function UnidadePadrao() As String
    Dim n As String
    On Error Resume Next
    n = NomeUnidadeSessao()
    If Len(n) = 0 Or StrComp(n, "Todas as unidades", vbTextCompare) = 0 Then
        n = ObterParametro("Estoque", "UnidadePadrao", "ATHENA GYM Matriz")
    End If
    UnidadePadrao = n
End Function

Private Function UnidadeIDPadrao() As Long
    Dim uid As Long
    On Error Resume Next
    uid = UnidadeIDSessao()
    If uid <= 0 Then uid = 1
    UnidadeIDPadrao = uid
End Function

Private Function DiasAlertaValidade() As Long
    DiasAlertaValidade = CLng(ObterParametroNumero("Estoque", "DiasAlertaValidade", 30))
End Function

Public Function BuscarProdutoPorCodigoUnidade(ByVal codigo As String, ByVal unidadeId As Long) As ListRow
    Dim lo As ListObject, lr As ListRow, fallback As ListRow
    Dim cod As String
    On Error Resume Next
    Set BuscarProdutoPorCodigoUnidade = Nothing
    Set fallback = Nothing
    cod = Trim$(codigo)
    Set lo = ObterTabela(SHT_PRODUTOS, TBL_PRODUTOS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Código")), cod, vbTextCompare) = 0 Or _
           StrComp(NzStr(LerCampo(lr, "Código de Barras")), cod, vbTextCompare) = 0 Then
            If unidadeId <= 0 Then
                Set BuscarProdutoPorCodigoUnidade = lr
                Exit Function
            End If
            If CLng(Val(LerCampo(lr, "UnidadeID"))) = unidadeId Then
                Set BuscarProdutoPorCodigoUnidade = lr
                Exit Function
            End If
            If fallback Is Nothing Then Set fallback = lr
        End If
    Next lr
    If unidadeId <= 0 Then Set BuscarProdutoPorCodigoUnidade = fallback
End Function

Public Function BuscarProdutoPorCodigo(ByVal codigo As String) As ListRow
    Dim sess As Long
    sess = UnidadeIDSessao()
    Set BuscarProdutoPorCodigo = BuscarProdutoPorCodigoUnidade(codigo, sess)
    If BuscarProdutoPorCodigo Is Nothing And sess > 0 Then
        Set BuscarProdutoPorCodigo = BuscarProdutoPorCodigoUnidade(codigo, 0)
    End If
End Function

Public Function ConsultarProduto(ByVal codigo As String) As ListRow
    Set ConsultarProduto = BuscarProdutoPorCodigo(codigo)
End Function

Public Sub CadastrarProduto()
    Dim cod As String, nome As String, cat As String
    Dim custo As Double, preco As Double, qtd As Double, minE As Double
    Dim cols As Variant, vals As Variant
    On Error GoTo TrataErro
    If Not PodeAcessar("Estoque") Then Call ExigeAcesso("Estoque"): Exit Sub
    cod = Trim$(InputBox("Código do produto (ex: PRD-011):", "Novo Produto"))
    If Len(cod) = 0 Then Exit Sub
    If Not BuscarProdutoPorCodigoUnidade(cod, UnidadeIDPadrao()) Is Nothing Then MsgAviso "Código já existe nesta unidade.": Exit Sub
    nome = Trim$(InputBox("Nome do produto:", "Novo Produto"))
    If Len(nome) = 0 Then Exit Sub
    cat = Trim$(InputBox("Categoria:", "Novo Produto", "Suplementos"))
    custo = Val(Replace(InputBox("Custo unitário:", "Novo Produto", "0"), ",", "."))
    preco = Val(Replace(InputBox("Preço de venda:", "Novo Produto", "0"), ",", "."))
    qtd = Val(Replace(InputBox("Estoque inicial:", "Novo Produto", "0"), ",", "."))
    minE = Val(Replace(InputBox("Estoque mínimo:", "Novo Produto", "5"), ",", "."))
    cols = Array("Código", "Código de Barras", "Produto", "Categoria", "Marca", "Unidade Medida", _
                 "Custo", "Preço Venda", "Estoque Atual", "Estoque Mínimo", "Estoque Máximo", _
                 "Localização", "Status", "Unidade", "UnidadeID", "Classe ABC")
    vals = Array(cod, "", nome, cat, "", "UN", Round(custo, 2), Round(preco, 2), qtd, minE, minE * 5, _
                 "", "Ativo", UnidadePadrao(), UnidadeIDPadrao(), "C")
    Call AdicionarRegistro(SHT_PRODUTOS, TBL_PRODUTOS, cols, vals)
    If qtd > 0 Then Call RegistrarMovimentacao(cod, nome, "Entrada", qtd, "Cadastro inicial")
    Call AtualizarEstoque
    RegistrarLog "Produto cadastrado", "Estoque", cod & " / " & nome
    MsgOk "Produto cadastrado: " & nome
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "CadastrarProduto"
    MsgErro "Erro ao cadastrar produto."
End Sub

Public Sub EditarProduto()
    Dim cod As String, lr As ListRow
    Dim preco As Double, minE As Double
    On Error GoTo TrataErro
    If Not PodeAcessar("Estoque") Then Call ExigeAcesso("Estoque"): Exit Sub
    cod = Trim$(InputBox("Código do produto:", "Editar Produto"))
    If Len(cod) = 0 Then Exit Sub
    Set lr = BuscarProdutoPorCodigo(cod)
    If lr Is Nothing Then MsgAviso "Produto não encontrado.": Exit Sub
    preco = Val(Replace(InputBox("Preço de venda:", "Editar", CStr(LerCampo(lr, "Preço Venda"))), ",", "."))
    minE = Val(Replace(InputBox("Estoque mínimo:", "Editar", CStr(LerCampo(lr, "Estoque Mínimo"))), ",", "."))
    Call GravarCampo(lr, "Preço Venda", Round(preco, 2))
    Call GravarCampo(lr, "Estoque Mínimo", minE)
    Call AtualizarEstoque
    MsgOk "Produto atualizado."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "EditarProduto"
End Sub

Public Sub RegistrarMovimentacao(ByVal codigo As String, ByVal produto As String, _
                                ByVal tipo As String, ByVal qtde As Double, _
                                Optional ByVal obs As String = "")
    Call RegistrarMovimentacaoUnidade(codigo, produto, tipo, qtde, obs, UnidadeIDPadrao())
End Sub

Public Sub RegistrarMovimentacaoUnidade(ByVal codigo As String, ByVal produto As String, _
                                        ByVal tipo As String, ByVal qtde As Double, _
                                        ByVal obs As String, ByVal unidadeId As Long)
    Dim id As Long
    Dim cols As Variant, vals As Variant
    Dim nomeU As String
    id = MaxNumerico(SHT_MOV_EST, TBL_MOV_EST, "ID") + 1
    nomeU = NomeUnidadePorId(unidadeId)
    If Len(nomeU) = 0 Then nomeU = UnidadePadrao()
    cols = Array("ID", "Data", "Produto", "Código", "Tipo", "Quantidade", "Usuário", "Obs", "Unidade", "UnidadeID")
    vals = Array(id, DataAtual(), produto, codigo, tipo, qtde, UsuarioEstoque(), obs, nomeU, unidadeId)
    Call AdicionarRegistro(SHT_MOV_EST, TBL_MOV_EST, cols, vals)
End Sub

Public Sub AtualizarSaldoProduto(ByVal codigo As String, ByVal delta As Double)
    Dim lr As ListRow
    Dim atual As Double
    Set lr = BuscarProdutoPorCodigo(codigo)
    If lr Is Nothing Then Exit Sub
    atual = Val(LerCampo(lr, "Estoque Atual")) + delta
    If atual < 0 Then atual = 0
    Call GravarCampo(lr, "Estoque Atual", atual)
End Sub

Public Sub RegistrarEntrada()
    Dim cod As String, qtde As Double, valor As Double
    Dim lr As ListRow, forn As String, idCompra As Long, compra As String
    Dim cols As Variant, vals As Variant
    On Error GoTo TrataErro
    If Not PodeAcessar("Estoque") Then Call ExigeAcesso("Estoque"): Exit Sub
    cod = Trim$(InputBox("Código do produto:", "Entrada de Estoque"))
    If Len(cod) = 0 Then Exit Sub
    Set lr = BuscarProdutoPorCodigo(cod)
    If lr Is Nothing Then MsgAviso "Produto não encontrado.": Exit Sub
    qtde = Val(Replace(InputBox("Quantidade:", "Entrada", "1"), ",", "."))
    If qtde <= 0 Then MsgAviso "Quantidade inválida.": Exit Sub
    valor = Val(Replace(InputBox("Valor total da entrada:", "Entrada", CStr(Val(LerCampo(lr, "Custo")) * qtde)), ",", "."))
    forn = Trim$(InputBox("Fornecedor:", "Entrada", "Nutri Distribuidora LTDA"))
    idCompra = MaxNumerico(SHT_COMPRAS, TBL_COMPRAS, "ID") + 1
    compra = "CMP-" & Format$(idCompra, "000")
    cols = Array("ID", "Compra", "Produto", "Código", "Quantidade", "Valor", "Fornecedor", "Data", "Unidade", "UnidadeID")
    vals = Array(idCompra, compra, NzStr(LerCampo(lr, "Produto")), cod, qtde, Round(valor, 2), forn, DataAtual(), UnidadePadrao(), UnidadeIDPadrao())
    Call AdicionarRegistro(SHT_COMPRAS, TBL_COMPRAS, cols, vals)
    Call AtualizarSaldoProduto(cod, qtde)
    Call RegistrarMovimentacao(cod, NzStr(LerCampo(lr, "Produto")), "Entrada", qtde, "Compra " & compra)
    On Error Resume Next
    Call RegistrarDespesaEstoque("Compra " & compra & " — " & NzStr(LerCampo(lr, "Produto")), valor)
    On Error GoTo TrataErro
    Call AtualizarEstoque
    Call AtualizarPainel
    RegistrarLog "Entrada estoque", "Estoque", compra & " / " & cod & " x" & qtde
    MsgOk "Entrada registrada: " & qtde & " un."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "RegistrarEntrada"
    MsgErro "Erro na entrada de estoque."
End Sub

Public Sub RegistrarSaidaEstoque()
    Dim cod As String, qtde As Double, lr As ListRow, tipo As String
    On Error GoTo TrataErro
    If Not PodeAcessar("Estoque") Then Call ExigeAcesso("Estoque"): Exit Sub
    tipo = Trim$(InputBox("Tipo (Ajuste / Perda / Devolução / Transferência):", "Saída", "Ajuste"))
    If StrComp(tipo, "Transferência", vbTextCompare) = 0 Then
        Call TransferirEstoqueEntreUnidades
        Exit Sub
    End If
    cod = Trim$(InputBox("Código do produto:", "Saída / Ajuste"))
    If Len(cod) = 0 Then Exit Sub
    Set lr = BuscarProdutoPorCodigo(cod)
    If lr Is Nothing Then MsgAviso "Produto não encontrado.": Exit Sub
    If Len(tipo) = 0 Then tipo = "Ajuste"
    qtde = Val(Replace(InputBox("Quantidade a baixar:", "Saída", "1"), ",", "."))
    If qtde <= 0 Then Exit Sub
    If Val(LerCampo(lr, "Estoque Atual")) < qtde Then MsgAviso "Estoque insuficiente.": Exit Sub
    Call AtualizarSaldoProduto(cod, -qtde)
    Call RegistrarMovimentacao(cod, NzStr(LerCampo(lr, "Produto")), tipo, qtde, "Manual")
    Call AtualizarEstoque
    MsgOk "Movimentação registrada."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "RegistrarSaidaEstoque"
End Sub

Public Sub GerarAlertaEstoque()
    Dim lo As ListObject, lr As ListRow
    Dim n As Long, dias As Long, valD As Date
    On Error Resume Next
    Set lo = ObterTabela(SHT_PRODUTOS, TBL_PRODUTOS)
    n = 0
    For Each lr In lo.ListRows
        If Not PertenceUnidade(lr) Then GoTo ProxA
        If Val(LerCampo(lr, "Estoque Atual")) <= Val(LerCampo(lr, "Estoque Mínimo")) Then n = n + 1
ProxA:
    Next lr
    dias = DiasAlertaValidade()
    Set lo = ObterTabela(SHT_LOTES, TBL_LOTES)
    For Each lr In lo.ListRows
        If IsDate(LerCampo(lr, "Validade")) Then
            valD = CDate(LerCampo(lr, "Validade"))
            If valD <= DataAtual() + dias Then
                Call GravarCampo(lr, "Status", IIf(valD < DataAtual(), "Vencido", "Vencendo"))
            Else
                Call GravarCampo(lr, "Status", "OK")
            End If
        End If
    Next lr
    On Error GoTo 0
End Sub

Public Sub SincronizarEstoqueUI()
    Dim loSrc As ListObject, loDst As ListObject
    Dim lr As ListRow, i As Long, atual As Double, minE As Double
    On Error GoTo TrataErro
    Set loSrc = ObterTabela(SHT_PRODUTOS, TBL_PRODUTOS)
    Set loDst = ObterTabela(SHT_ESTOQUE_UI, "tblEstoque")
    Do While loDst.ListRows.Count > 0
        loDst.ListRows(1).Delete
    Loop
    i = 0
    For Each lr In loSrc.ListRows
        If Len(NzStr(LerCampo(lr, "Código"))) = 0 Then GoTo Prox
        If Not PertenceUnidade(lr) Then GoTo Prox
        i = i + 1
        loDst.ListRows.Add
        atual = Val(LerCampo(lr, "Estoque Atual"))
        minE = Val(LerCampo(lr, "Estoque Mínimo"))
        loDst.ListRows(i).Range(1, 1).Value = NzStr(LerCampo(lr, "Código"))
        loDst.ListRows(i).Range(1, 2).Value = NzStr(LerCampo(lr, "Produto"))
        loDst.ListRows(i).Range(1, 3).Value = NzStr(LerCampo(lr, "Categoria"))
        loDst.ListRows(i).Range(1, 4).Value = atual
        loDst.ListRows(i).Range(1, 5).Value = minE
        loDst.ListRows(i).Range(1, 6).Value = Val(LerCampo(lr, "Custo"))
        loDst.ListRows(i).Range(1, 7).Value = Val(LerCampo(lr, "Preço Venda"))
        loDst.ListRows(i).Range(1, 8).Value = 0
        loDst.ListRows(i).Range(1, 9).Value = 0
        loDst.ListRows(i).Range(1, 10).Value = Round(atual * Val(LerCampo(lr, "Custo")), 2)
        loDst.ListRows(i).Range(1, 11).Value = Round(Val(LerCampo(lr, "Preço Venda")) - Val(LerCampo(lr, "Custo")), 2)
        loDst.ListRows(i).Range(1, 12).Value = IIf(atual <= minE, "🔴 REPOR", "🟢 OK")
Prox:
    Next lr
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "SincronizarEstoqueUI"
End Sub

Public Sub CurvaABC()
    Dim lo As ListObject, lr As ListRow
    Dim n As Long, i As Long, j As Long
    Dim cod() As String, fat() As Double, tmpC As String, tmpF As Double
    Dim total As Double, acum As Double, pct As Double, cls As String
    On Error GoTo TrataErro
    Set lo = ObterTabela(SHT_PRODUTOS, TBL_PRODUTOS)
    n = lo.ListRows.Count
    If n = 0 Then Exit Sub
    ReDim cod(1 To n)
    ReDim fat(1 To n)
    i = 0
    For Each lr In lo.ListRows
        i = i + 1
        cod(i) = NzStr(LerCampo(lr, "Código"))
        fat(i) = Val(LerCampo(lr, "Preço Venda")) * Application.Max(1, Val(LerCampo(lr, "Estoque Atual")))
        total = total + fat(i)
    Next lr
    For i = 1 To n - 1
        For j = i + 1 To n
            If fat(j) > fat(i) Then
                tmpF = fat(i): fat(i) = fat(j): fat(j) = tmpF
                tmpC = cod(i): cod(i) = cod(j): cod(j) = tmpC
            End If
        Next j
    Next i
    acum = 0
    For i = 1 To n
        acum = acum + fat(i)
        If total > 0 Then pct = acum / total Else pct = 1
        If pct <= 0.8 Then
            cls = "A"
        ElseIf pct <= 0.95 Then
            cls = "B"
        Else
            cls = "C"
        End If
        Set lr = BuscarProdutoPorCodigo(cod(i))
        If Not lr Is Nothing Then Call GravarCampo(lr, "Classe ABC", cls)
    Next i
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "CurvaABC"
End Sub

Public Sub Inventario()
    Dim lo As ListObject, lr As ListRow
    Dim r As Long, atual As Double
    On Error GoTo TrataErro
    Call LimparIntervalo(SHT_INVENTARIO, "C13:H27")
    Set lo = ObterTabela(SHT_PRODUTOS, TBL_PRODUTOS)
    r = 13
    For Each lr In lo.ListRows
        If r > 27 Then Exit For
        If Len(NzStr(LerCampo(lr, "Código"))) = 0 Then GoTo Prox
        atual = Val(LerCampo(lr, "Estoque Atual"))
        GravarCelula SHT_INVENTARIO, "C" & r, NzStr(LerCampo(lr, "Código"))
        GravarCelula SHT_INVENTARIO, "D" & r, NzStr(LerCampo(lr, "Produto"))
        GravarCelula SHT_INVENTARIO, "E" & r, atual
        GravarCelula SHT_INVENTARIO, "F" & r, atual
        GravarCelula SHT_INVENTARIO, "G" & r, 0
        GravarCelula SHT_INVENTARIO, "H" & r, ""
        r = r + 1
Prox:
    Next lr
    GravarCelula SHT_INVENTARIO, "D8", r - 13
    GravarCelula SHT_INVENTARIO, "F8", 0
    NavegarPara SHT_INVENTARIO
    MsgOk "Inventário carregado. Ajuste a coluna Físico e finalize."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "Inventario"
End Sub

Public Sub FinalizarInventario()
    Dim r As Long, cod As String, sist As Double, fis As Double, dif As Double
    Dim lr As ListRow, nAj As Long
    On Error GoTo TrataErro
    If Not PodeAcessar("Estoque") Then Call ExigeAcesso("Estoque"): Exit Sub
    nAj = 0
    For r = 13 To 27
        cod = Trim$(NzStr(LerCelula(SHT_INVENTARIO, "C" & r)))
        If Len(cod) = 0 Then GoTo Prox
        sist = Val(LerCelula(SHT_INVENTARIO, "E" & r))
        fis = Val(LerCelula(SHT_INVENTARIO, "F" & r))
        dif = fis - sist
        GravarCelula SHT_INVENTARIO, "G" & r, dif
        If dif = 0 Then GoTo Prox
        Set lr = BuscarProdutoPorCodigo(cod)
        If lr Is Nothing Then GoTo Prox
        Call GravarCampo(lr, "Estoque Atual", fis)
        If dif > 0 Then
            Call RegistrarMovimentacao(cod, NzStr(LerCampo(lr, "Produto")), "Ajuste", dif, "Inventário +")
        Else
            Call RegistrarMovimentacao(cod, NzStr(LerCampo(lr, "Produto")), "Ajuste", Abs(dif), "Inventário -")
        End If
        nAj = nAj + 1
Prox:
    Next r
    GravarCelula SHT_INVENTARIO, "H8", nAj
    Call AtualizarEstoque
    Call AtualizarPainel
    RegistrarLog "Inventário finalizado", "Estoque", "Ajustes=" & nAj
    MsgOk "Inventário finalizado. Ajustes: " & nAj
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "FinalizarInventario"
    MsgErro "Erro ao finalizar inventário."
End Sub

Public Sub AtualizarDashboardEstoquePDV()
    Dim lo As ListObject, lr As ListRow
    Dim valorEst As Double, criticos As Long, vencendo As Long
    Dim vendasHoje As Double, itensHoje As Long, lucroHoje As Double, nV As Long
    Dim custo As Double, preco As Double, margem As Double, nP As Long
    Dim hoje As Date
    On Error GoTo TrataErro
    hoje = DataAtual()
    Call CurvaABC
    Set lo = ObterTabela(SHT_PRODUTOS, TBL_PRODUTOS)
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Código"))) = 0 Then GoTo ProxP
        valorEst = valorEst + Val(LerCampo(lr, "Estoque Atual")) * Val(LerCampo(lr, "Custo"))
        If Val(LerCampo(lr, "Estoque Atual")) <= Val(LerCampo(lr, "Estoque Mínimo")) Then criticos = criticos + 1
        custo = Val(LerCampo(lr, "Custo"))
        preco = Val(LerCampo(lr, "Preço Venda"))
        If preco > 0 Then
            margem = margem + ((preco - custo) / preco)
            nP = nP + 1
        End If
ProxP:
    Next lr
    Set lo = ObterTabela(SHT_LOTES, TBL_LOTES)
    For Each lr In lo.ListRows
        If UCase$(NzStr(LerCampo(lr, "Status"))) = "VENCENDO" Or UCase$(NzStr(LerCampo(lr, "Status"))) = "VENCIDO" Then
            vencendo = vencendo + 1
        End If
    Next lr
    Set lo = ObterTabela("BD_VENDAS", "tbVendas")
    For Each lr In lo.ListRows
        If Not IsDate(LerCampo(lr, "Data")) Then GoTo ProxV
        If CDate(LerCampo(lr, "Data")) <> hoje Then GoTo ProxV
        If UCase$(NzStr(LerCampo(lr, "Status"))) <> "FINALIZADA" Then GoTo ProxV
        vendasHoje = vendasHoje + Val(LerCampo(lr, "Total"))
        lucroHoje = lucroHoje + Val(LerCampo(lr, "Lucro"))
        itensHoje = itensHoje + CLng(Val(LerCampo(lr, "Itens")))
        nV = nV + 1
ProxV:
    Next lr
    ' KPIs linha 7 (C8/E8/G8/I8) = PDV; linha 11 (C12/E12/G12/I12) = estoque
    GravarCelula SHT_DASH_PDV, "C8", "R$ " & Format$(vendasHoje, "#,##0.00")
    GravarCelula SHT_DASH_PDV, "E8", itensHoje
    If nV > 0 Then
        GravarCelula SHT_DASH_PDV, "G8", "R$ " & Format$(vendasHoje / nV, "#,##0.00")
    Else
        GravarCelula SHT_DASH_PDV, "G8", "R$ 0,00"
    End If
    GravarCelula SHT_DASH_PDV, "I8", "R$ " & Format$(lucroHoje, "#,##0.00")
    GravarCelula SHT_DASH_PDV, "C12", "R$ " & Format$(valorEst, "#,##0.00")
    GravarCelula SHT_DASH_PDV, "E12", criticos
    GravarCelula SHT_DASH_PDV, "G12", vencendo
    If nP > 0 Then
        GravarCelula SHT_DASH_PDV, "I12", Format$(Round(margem / nP * 100, 1), "0.0") & "%"
    Else
        GravarCelula SHT_DASH_PDV, "I12", "0%"
    End If
    Call PreencherRankingPDV
    Call PreencherAlertasPDV
    Call PreencherCurvaABCDash
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarDashboardEstoquePDV"
End Sub

Private Sub PreencherRankingPDV()
    Dim lo As ListObject, lr As ListRow
    Dim dictCod As Object, dictNome As Object, dictFat As Object
    Dim cod As String, nome As String, q As Double, fat As Double
    Dim keys As Variant, i As Long, j As Long, r As Long
    Dim maxQ As Double, barra As String, k As Long
    Dim tmpK As Variant, tmpQ As Double
    On Error Resume Next
    Set dictCod = CreateObject("Scripting.Dictionary")
    Set dictNome = CreateObject("Scripting.Dictionary")
    Set dictFat = CreateObject("Scripting.Dictionary")
    Set lo = ObterTabela("BD_VENDA_ITENS", "tbVendaItens")
    For Each lr In lo.ListRows
        cod = NzStr(LerCampo(lr, "Código"))
        If Len(cod) = 0 Then GoTo Prox
        nome = NzStr(LerCampo(lr, "Produto"))
        q = Val(LerCampo(lr, "Qtde"))
        fat = Val(LerCampo(lr, "Subtotal"))
        If dictCod.Exists(cod) Then
            dictCod(cod) = dictCod(cod) + q
            dictFat(cod) = dictFat(cod) + fat
        Else
            dictCod.Add cod, q
            dictNome.Add cod, nome
            dictFat.Add cod, fat
        End If
Prox:
    Next lr
    Call LimparIntervalo(SHT_DASH_PDV, "C18:F25")
    If dictCod.Count = 0 Then Exit Sub
    keys = dictCod.Keys
    ' bubble sort by qty desc
    For i = 0 To UBound(keys) - 1
        For j = i + 1 To UBound(keys)
            If dictCod(keys(j)) > dictCod(keys(i)) Then
                tmpK = keys(i): keys(i) = keys(j): keys(j) = tmpK
            End If
        Next j
    Next i
    maxQ = dictCod(keys(0))
    If maxQ <= 0 Then maxQ = 1
    r = 18
    For i = 0 To Application.Min(7, UBound(keys))
        cod = CStr(keys(i))
        barra = String$(Application.Min(14, CLng(dictCod(cod) / maxQ * 14)), ChrW(&H2588))
        GravarCelula SHT_DASH_PDV, "C" & r, dictNome(cod)
        GravarCelula SHT_DASH_PDV, "D" & r, dictCod(cod)
        GravarCelula SHT_DASH_PDV, "E" & r, dictFat(cod)
        GravarCelula SHT_DASH_PDV, "F" & r, barra
        r = r + 1
    Next i
End Sub

Private Sub PreencherCurvaABCDash()
    Dim lo As ListObject, lr As ListRow
    Dim a As Long, b As Long, c As Long
    Dim listaA As String, listaB As String, listaC As String
    On Error Resume Next
    Set lo = ObterTabela(SHT_PRODUTOS, TBL_PRODUTOS)
    For Each lr In lo.ListRows
        Select Case UCase$(NzStr(LerCampo(lr, "Classe ABC")))
            Case "A": a = a + 1: listaA = listaA & NzStr(LerCampo(lr, "Produto")) & "; "
            Case "B": b = b + 1: listaB = listaB & NzStr(LerCampo(lr, "Produto")) & "; "
            Case Else: c = c + 1: listaC = listaC & NzStr(LerCampo(lr, "Produto")) & "; "
        End Select
    Next lr
    GravarCelula SHT_DASH_PDV, "I18", a
    GravarCelula SHT_DASH_PDV, "J18", "80%"
    GravarCelula SHT_DASH_PDV, "K18", Left$(listaA, 40)
    GravarCelula SHT_DASH_PDV, "I19", b
    GravarCelula SHT_DASH_PDV, "J19", "15%"
    GravarCelula SHT_DASH_PDV, "K19", Left$(listaB, 40)
    GravarCelula SHT_DASH_PDV, "I20", c
    GravarCelula SHT_DASH_PDV, "J20", "5%"
    GravarCelula SHT_DASH_PDV, "K20", Left$(listaC, 40)
End Sub

Private Sub PreencherAlertasPDV()
    Dim lo As ListObject, lr As ListRow
    Dim r As Long
    On Error Resume Next
    Call LimparIntervalo(SHT_DASH_PDV, "C30:G37")
    r = 30
    Set lo = ObterTabela(SHT_PRODUTOS, TBL_PRODUTOS)
    For Each lr In lo.ListRows
        If r > 37 Then Exit For
        If Val(LerCampo(lr, "Estoque Atual")) <= Val(LerCampo(lr, "Estoque Mínimo")) Then
            GravarCelula SHT_DASH_PDV, "C" & r, "Estoque baixo"
            GravarCelula SHT_DASH_PDV, "D" & r, NzStr(LerCampo(lr, "Código"))
            GravarCelula SHT_DASH_PDV, "E" & r, NzStr(LerCampo(lr, "Produto"))
            GravarCelula SHT_DASH_PDV, "F" & r, "Atual " & LerCampo(lr, "Estoque Atual") & " / Mín " & LerCampo(lr, "Estoque Mínimo")
            GravarCelula SHT_DASH_PDV, "G" & r, "🔴 Repor"
            r = r + 1
        End If
    Next lr
    Set lo = ObterTabela(SHT_LOTES, TBL_LOTES)
    For Each lr In lo.ListRows
        If r > 37 Then Exit For
        If UCase$(NzStr(LerCampo(lr, "Status"))) = "VENCENDO" Or UCase$(NzStr(LerCampo(lr, "Status"))) = "VENCIDO" Then
            GravarCelula SHT_DASH_PDV, "C" & r, "Validade"
            GravarCelula SHT_DASH_PDV, "D" & r, NzStr(LerCampo(lr, "Código"))
            GravarCelula SHT_DASH_PDV, "E" & r, NzStr(LerCampo(lr, "Produto"))
            GravarCelula SHT_DASH_PDV, "F" & r, "Lote " & NzStr(LerCampo(lr, "Lote"))
            GravarCelula SHT_DASH_PDV, "G" & r, NzStr(LerCampo(lr, "Status"))
            r = r + 1
        End If
    Next lr
End Sub
