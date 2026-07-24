Attribute VB_Name = "modBanco"
Option Explicit

'============================================================
' Sprint 3.3 — ÚNICO módulo com acesso direto a planilhas/ListObjects
'============================================================

Public Const SHT_ALUNOS As String = "BD_ALUNOS"
Public Const TBL_ALUNOS As String = "tbAlunos"
Public Const SHT_LISTA_ALUNOS As String = "02_ALUNOS"
Public Const TBL_LISTA_ALUNOS As String = "tblAlunos"
Public Const SHT_MENSALIDADES As String = "03_MENSALIDADES"
Public Const TBL_MENSALIDADES As String = "tblMensalidades"
Public Const SHT_RECEBER As String = "06_CONTAS_RECEBER"
Public Const TBL_RECEBER As String = "tblContasReceber"
Public Const SHT_RECEBER_BD As String = "BD_CONTAS_RECEBER"
Public Const TBL_RECEBER_BD As String = "tbContasReceberBD"
Public Const SHT_PAGAR_BD As String = "BD_CONTAS_PAGAR"
Public Const TBL_PAGAR_BD As String = "tbContasPagarBD"
Public Const SHT_LANCAMENTOS As String = "BD_LANCAMENTOS"
Public Const TBL_LANCAMENTOS As String = "tbLancamentos"
Public Const SHT_FLUXO_BD As String = "BD_FLUXO_CAIXA"
Public Const TBL_FLUXO_BD As String = "tbFluxoCaixaBD"
Public Const SHT_PARAMETROS As String = "BD_PARAMETROS"
Public Const TBL_PARAMETROS As String = "tbParametros"
Public Const SHT_PLANOS As String = "BD_PLANOS"
Public Const TBL_PLANOS As String = "tbPlanos"
Public Const SHT_FORMAS As String = "BD_FORMAS_PAGAMENTO"
Public Const TBL_FORMAS As String = "tbFormasPagamento"
Public Const SHT_STATUS As String = "BD_STATUS"
Public Const TBL_STATUS As String = "tbStatus"
Public Const SHT_PERMISSOES As String = "BD_PERMISSOES"
Public Const TBL_PERMISSOES As String = "tbPermissoes"
Public Const SHT_CORES As String = "BD_CORES"
Public Const TBL_CORES As String = "tbCores"
Public Const SHT_VERSAO As String = "VERSAO"
Public Const TBL_VERSAO As String = "tbVersao"
Public Const SHT_USUARIOS As String = "BD_USUARIOS"
Public Const TBL_USUARIOS As String = "tbUsuarios"
Public Const SHT_LOG As String = "LOG"
Public Const TBL_LOG As String = "tbLog"
Public Const SHT_CONFIG As String = "15_CONFIG"
Public Const SHT_FORM_ALUNO As String = "FORM_ALUNO"

Public Function TabelaExiste(ByVal sheetName As String, ByVal tableName As String) As Boolean
    Dim lo As ListObject
    On Error Resume Next
    Set lo = ThisWorkbook.Worksheets(sheetName).ListObjects(tableName)
    TabelaExiste = Not lo Is Nothing
    On Error GoTo 0
End Function

Public Function ObterTabela(ByVal sheetName As String, ByVal tableName As String) As ListObject
    Set ObterTabela = ThisWorkbook.Worksheets(sheetName).ListObjects(tableName)
End Function

Public Function Tabela(ByVal sheetName As String, ByVal tableName As String) As ListObject
    Set Tabela = ObterTabela(sheetName, tableName)
End Function

Public Function ColIndex(ByVal lo As ListObject, ByVal colName As String) As Long
    ColIndex = lo.ListColumns(colName).Index
End Function

Public Function LerCampo(ByVal lr As ListRow, ByVal colName As String) As Variant
    LerCampo = lr.Range(1, ColIndex(lr.Parent, colName)).Value
End Function

Public Sub GravarCampo(ByVal lr As ListRow, ByVal colName As String, ByVal valor As Variant)
    lr.Range(1, ColIndex(lr.Parent, colName)).Value = valor
End Sub

Public Function LerCelula(ByVal sheetName As String, ByVal addr As String) As Variant
    LerCelula = ThisWorkbook.Worksheets(sheetName).Range(addr).Value
End Function

Public Sub GravarCelula(ByVal sheetName As String, ByVal addr As String, ByVal valor As Variant)
    ThisWorkbook.Worksheets(sheetName).Range(addr).Value = valor
End Sub

Public Sub LimparIntervalo(ByVal sheetName As String, ByVal addr As String)
    ThisWorkbook.Worksheets(sheetName).Range(addr).ClearContents
End Sub

Public Sub FormatoCelula(ByVal sheetName As String, ByVal addr As String, ByVal formato As String)
    ThisWorkbook.Worksheets(sheetName).Range(addr).NumberFormat = formato
End Sub

Public Sub SelecionarCelula(ByVal sheetName As String, ByVal addr As String)
    ThisWorkbook.Worksheets(sheetName).Activate
    ThisWorkbook.Worksheets(sheetName).Range(addr).Select
End Sub

Public Sub AtivarAba(ByVal sheetName As String)
    ThisWorkbook.Worksheets(sheetName).Activate
End Sub

Public Function RangeDaCelula(ByVal sheetName As String, ByVal addr As String) As Range
    Set RangeDaCelula = ThisWorkbook.Worksheets(sheetName).Range(addr)
End Function

Public Sub CalcularPlanilha()
    Application.Calculate
End Sub

Public Sub CalcularPlanilhaCompleto()
    Application.CalculateFull
End Sub

'------------------------------------------------------------
' CRUD genérico em ListObject
'------------------------------------------------------------
Public Function AdicionarRegistro(ByVal sheetName As String, ByVal tableName As String, _
                                  ByVal nomesCols As Variant, ByVal valores As Variant) As ListRow
    Dim lo As ListObject
    Dim lr As ListRow
    Dim i As Long
    Dim colNomeChk As String

    Set lo = ObterTabela(sheetName, tableName)
    colNomeChk = CStr(nomesCols(LBound(nomesCols)))

    If lo.ListRows.Count >= 1 Then
        If Len(NzStr(lo.ListRows(lo.ListRows.Count).Range(1, ColIndex(lo, colNomeChk)).Value)) = 0 Then
            Set lr = lo.ListRows(lo.ListRows.Count)
        Else
            Set lr = lo.ListRows.Add
        End If
    Else
        Set lr = lo.ListRows.Add
    End If

    For i = LBound(nomesCols) To UBound(nomesCols)
        lr.Range(1, ColIndex(lo, CStr(nomesCols(i)))).Value = valores(i)
    Next i

    Set AdicionarRegistro = lr
End Function

'------------------------------------------------------------
' Épico 1 — Multi-Tenant helpers
'------------------------------------------------------------
Public Function TabelaTemEmpresaID(ByVal sheetName As String, ByVal tableName As String) As Boolean
    Dim lo As ListObject
    On Error Resume Next
    Set lo = ObterTabela(sheetName, tableName)
    TabelaTemEmpresaID = False
    If lo Is Nothing Then Exit Function
    Dim i As Long
    For i = 1 To lo.ListColumns.Count
        If StrComp(lo.ListColumns(i).Name, "EmpresaID", vbTextCompare) = 0 Then
            TabelaTemEmpresaID = True
            Exit Function
        End If
    Next i
End Function

Public Function PertenceEmpresa(ByVal lr As ListRow) As Boolean
    Dim eid As Long, sess As Long
    On Error Resume Next
    If StrComp(PerfilUsuario, "SuperAdmin", vbTextCompare) = 0 And EmpresaIDSessao() = 0 Then
        PertenceEmpresa = True
        Exit Function
    End If
    sess = EmpresaIDSessao()
    If sess = 0 Then sess = 1
    eid = CLng(Val(LerCampo(lr, "EmpresaID")))
    If Err.Number <> 0 Then
        Err.Clear
        PertenceEmpresa = True ' tabela sem EmpresaID = não filtra
        Exit Function
    End If
    PertenceEmpresa = (eid = sess)
End Function

Public Function AdicionarRegistroEmpresa(ByVal sheetName As String, ByVal tableName As String, _
                                         ByVal nomesCols As Variant, ByVal valores As Variant) As ListRow
    Dim nomes() As Variant, vals() As Variant
    Dim i As Long, n As Long, hasE As Boolean
    Dim eid As Long
    On Error Resume Next
    eid = EmpresaIDSessao()
    If eid = 0 And StrComp(PerfilUsuario, "SuperAdmin", vbTextCompare) <> 0 Then eid = 1
    If eid = 0 Then eid = 1

    hasE = False
    For i = LBound(nomesCols) To UBound(nomesCols)
        If StrComp(CStr(nomesCols(i)), "EmpresaID", vbTextCompare) = 0 Then hasE = True
    Next i

    If TabelaTemEmpresaID(sheetName, tableName) And Not hasE Then
        n = UBound(nomesCols) - LBound(nomesCols) + 1
        ReDim nomes(0 To n)
        ReDim vals(0 To n)
        nomes(0) = "EmpresaID"
        vals(0) = eid
        For i = LBound(nomesCols) To UBound(nomesCols)
            nomes(i - LBound(nomesCols) + 1) = nomesCols(i)
            vals(i - LBound(nomesCols) + 1) = valores(i)
        Next i
        Set AdicionarRegistroEmpresa = AdicionarRegistro(sheetName, tableName, nomes, vals)
    Else
        Set AdicionarRegistroEmpresa = AdicionarRegistro(sheetName, tableName, nomesCols, valores)
    End If
End Function

'------------------------------------------------------------
' Épico 2 — Multiunidade helpers
'------------------------------------------------------------
Public Function TabelaTemUnidadeID(ByVal sheetName As String, ByVal tableName As String) As Boolean
    Dim lo As ListObject
    Dim i As Long
    On Error Resume Next
    Set lo = ObterTabela(sheetName, tableName)
    TabelaTemUnidadeID = False
    If lo Is Nothing Then Exit Function
    For i = 1 To lo.ListColumns.Count
        If StrComp(lo.ListColumns(i).Name, "UnidadeID", vbTextCompare) = 0 Then
            TabelaTemUnidadeID = True
            Exit Function
        End If
    Next i
End Function

Public Function PertenceUnidade(ByVal lr As ListRow) As Boolean
    Dim uid As Long, sess As Long
    On Error Resume Next
    If Not PertenceEmpresa(lr) Then
        PertenceUnidade = False
        Exit Function
    End If
    sess = UnidadeIDSessao()
    If sess <= 0 Then
        PertenceUnidade = True ' consolidado / todas
        Exit Function
    End If
    If StrComp(PerfilUsuario, "Administrador", vbTextCompare) = 0 And sess <= 0 Then
        PertenceUnidade = True
        Exit Function
    End If
    uid = CLng(Val(LerCampo(lr, "UnidadeID")))
    If Err.Number <> 0 Then
        Err.Clear
        PertenceUnidade = True
        Exit Function
    End If
    PertenceUnidade = (uid = sess Or uid = 0)
End Function

Public Function AdicionarRegistroUnidade(ByVal sheetName As String, ByVal tableName As String, _
                                         ByVal nomesCols As Variant, ByVal valores As Variant) As ListRow
    Dim nomes() As Variant, vals() As Variant
    Dim i As Long, n As Long, hasU As Boolean, hasE As Boolean
    Dim uid As Long, eid As Long
    On Error Resume Next
    eid = EmpresaIDSessao()
    If eid <= 0 Then eid = 1
    uid = UnidadeIDSessao()
    If uid <= 0 Then uid = 1

    hasU = False
    hasE = False
    For i = LBound(nomesCols) To UBound(nomesCols)
        If StrComp(CStr(nomesCols(i)), "UnidadeID", vbTextCompare) = 0 Then hasU = True
        If StrComp(CStr(nomesCols(i)), "EmpresaID", vbTextCompare) = 0 Then hasE = True
    Next i

    If (TabelaTemUnidadeID(sheetName, tableName) And Not hasU) Or (TabelaTemEmpresaID(sheetName, tableName) And Not hasE) Then
        n = UBound(nomesCols) - LBound(nomesCols) + 1
        ReDim nomes(0 To n + 1)
        ReDim vals(0 To n + 1)
        Dim idx As Long
        idx = 0
        If TabelaTemEmpresaID(sheetName, tableName) And Not hasE Then
            nomes(idx) = "EmpresaID": vals(idx) = eid: idx = idx + 1
        End If
        If TabelaTemUnidadeID(sheetName, tableName) And Not hasU Then
            nomes(idx) = "UnidadeID": vals(idx) = uid: idx = idx + 1
        End If
        For i = LBound(nomesCols) To UBound(nomesCols)
            nomes(idx) = nomesCols(i)
            vals(idx) = valores(i)
            idx = idx + 1
        Next i
        ReDim Preserve nomes(0 To idx - 1)
        ReDim Preserve vals(0 To idx - 1)
        Set AdicionarRegistroUnidade = AdicionarRegistro(sheetName, tableName, nomes, vals)
    Else
        Set AdicionarRegistroUnidade = AdicionarRegistroEmpresa(sheetName, tableName, nomesCols, valores)
    End If
End Function

' Sequencial ATH-CODIGO-000001 (Épico 2) — por prefixo completo
Public Function ProximoSeqMatriculaCodigo(ByVal prefCompleto As String) As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim mat As String, pref As String
    Dim maxSeq As Long, seq As Long
    Dim partes() As String

    pref = UCase$(NzStr(prefCompleto)) & "-"
    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    maxSeq = 0
    For Each lr In lo.ListRows
        mat = UCase$(NzStr(LerCampo(lr, "Matrícula")))
        If Left$(mat, Len(pref)) = pref Then
            partes = Split(mat, "-")
            If UBound(partes) >= 2 Then
                seq = CLng(Val(partes(UBound(partes))))
                If seq > maxSeq Then maxSeq = seq
            End If
        End If
    Next lr
    ProximoSeqMatriculaCodigo = maxSeq + 1
End Function

Public Sub EditarRegistro(ByVal lr As ListRow, ByVal nomesCols As Variant, ByVal valores As Variant)
    Dim lo As ListObject
    Dim i As Long
    Set lo = lr.Parent
    For i = LBound(nomesCols) To UBound(nomesCols)
        lr.Range(1, ColIndex(lo, CStr(nomesCols(i)))).Value = valores(i)
    Next i
End Sub

Public Sub ExcluirRegistro(ByVal lr As ListRow)
    If Not lr Is Nothing Then lr.Delete
End Sub

Public Function PesquisarRegistro(ByVal sheetName As String, ByVal tableName As String, _
                                  ByVal colName As String, ByVal valor As String, _
                                  Optional ByVal parcial As Boolean = False) As ListRow
    Dim lo As ListObject
    Dim lr As ListRow
    Dim col As Long
    Dim atual As String

    Set lo = ObterTabela(sheetName, tableName)
    col = ColIndex(lo, colName)
    valor = Trim$(valor)

    For Each lr In lo.ListRows
        atual = NzStr(lr.Range(1, col).Value)
        If parcial Then
            If InStr(1, atual, valor, vbTextCompare) > 0 Then
                Set PesquisarRegistro = lr
                Exit Function
            End If
        Else
            If StrComp(atual, valor, vbTextCompare) = 0 Then
                Set PesquisarRegistro = lr
                Exit Function
            End If
        End If
    Next lr
    Set PesquisarRegistro = Nothing
End Function

Public Function MaxNumerico(ByVal sheetName As String, ByVal tableName As String, ByVal colName As String) As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim col As Long
    Dim maxV As Long, v As Long

    Set lo = ObterTabela(sheetName, tableName)
    col = ColIndex(lo, colName)
    maxV = 0
    For Each lr In lo.ListRows
        If Len(NzStr(lr.Range(1, col).Value)) > 0 Then
            v = CLng(Val(lr.Range(1, col).Value))
            If v > maxV Then maxV = v
        End If
    Next lr
    MaxNumerico = maxV
End Function

Public Function ContarOnde(ByVal sheetName As String, ByVal tableName As String, _
                           ByVal colName As String, ByVal valor As String) As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim col As Long
    Dim n As Long
    Set lo = ObterTabela(sheetName, tableName)
    col = ColIndex(lo, colName)
    n = 0
    For Each lr In lo.ListRows
        If StrComp(NzStr(lr.Range(1, col).Value), valor, vbTextCompare) = 0 Then n = n + 1
    Next lr
    ContarOnde = n
End Function

Public Function ContarOndeUnidade(ByVal sheetName As String, ByVal tableName As String, _
                                  ByVal colName As String, ByVal valor As String) As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim n As Long
    On Error Resume Next
    Set lo = ObterTabela(sheetName, tableName)
    For Each lr In lo.ListRows
        If Not PertenceUnidade(lr) Then GoTo Prox
        If StrComp(NzStr(LerCampo(lr, colName)), valor, vbTextCompare) = 0 Then n = n + 1
Prox:
    Next lr
    ContarOndeUnidade = n
End Function

Public Function UltimaLinha(ByVal sheetName As String, Optional ByVal col As Long = 1) As Long
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(sheetName)
    UltimaLinha = ws.Cells(ws.Rows.Count, col).End(xlUp).Row
End Function

Public Sub AtualizarTabela(ByVal sheetName As String, ByVal tableName As String)
    Dim lo As ListObject
    On Error Resume Next
    Set lo = ObterTabela(sheetName, tableName)
    If Not lo Is Nothing Then lo.Resize lo.Range.CurrentRegion
    On Error GoTo 0
End Sub

'------------------------------------------------------------
' Domínio alunos / financeiro (wrappers)
'------------------------------------------------------------
Public Function ProximoIdAluno() As Long
    ProximoIdAluno = MaxNumerico(SHT_ALUNOS, TBL_ALUNOS, "ID") + 1
End Function

' Sequencial da matrícula no ano (PREFIXO-AAAA-000001)
Public Function ProximoSeqMatriculaAno(ByVal prefixo As String, ByVal ano As Long) As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim mat As String, pref As String
    Dim maxSeq As Long, seq As Long
    Dim partes() As String

    pref = UCase$(NzStr(prefixo)) & "-" & CStr(ano) & "-"
    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    maxSeq = 0
    For Each lr In lo.ListRows
        mat = UCase$(NzStr(LerCampo(lr, "Matrícula")))
        If Left$(mat, Len(pref)) = pref Then
            partes = Split(mat, "-")
            If UBound(partes) >= 2 Then
                seq = CLng(Val(partes(UBound(partes))))
                If seq > maxSeq Then maxSeq = seq
            End If
        End If
    Next lr
    ProximoSeqMatriculaAno = maxSeq + 1
End Function

Public Function LerParametroTabela(ByVal chave As String, Optional ByVal padrao As String = "") As String
    Dim lo As ListObject
    Dim lr As ListRow
    Dim atual As String

    On Error GoTo Falha
    Set lo = ObterTabela(SHT_PARAMETROS, TBL_PARAMETROS)
    For Each lr In lo.ListRows
        atual = NzStr(LerCampo(lr, "Parâmetro"))
        If StrComp(atual, chave, vbTextCompare) = 0 Then
            LerParametroTabela = NzStr(LerCampo(lr, "Valor"))
            Exit Function
        End If
    Next lr
    LerParametroTabela = padrao
    Exit Function
Falha:
    LerParametroTabela = padrao
End Function

Public Function EmailExisteNoBanco(ByVal email As String, Optional ByVal ignorarId As Long = 0) As Boolean
    Dim lo As ListObject
    Dim lr As ListRow
    Dim e As String
    e = LCase$(NzStr(email))
    If Len(e) = 0 Then EmailExisteNoBanco = False: Exit Function
    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    For Each lr In lo.ListRows
        If ignorarId > 0 Then
            If CLng(Val(LerCampo(lr, "ID"))) = ignorarId Then GoTo ProxE
        End If
        If LCase$(NzStr(LerCampo(lr, "Email"))) = e Then
            EmailExisteNoBanco = True
            Exit Function
        End If
ProxE:
    Next lr
    EmailExisteNoBanco = False
End Function

Public Function TelefoneExisteNoBanco(ByVal telefone As String, Optional ByVal ignorarId As Long = 0) As Boolean
    Dim lo As ListObject
    Dim lr As ListRow
    Dim dig As String
    dig = SomenteNumeros(telefone)
    If Len(dig) = 0 Then TelefoneExisteNoBanco = False: Exit Function
    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    For Each lr In lo.ListRows
        If ignorarId > 0 Then
            If CLng(Val(LerCampo(lr, "ID"))) = ignorarId Then GoTo ProxT
        End If
        If SomenteNumeros(NzStr(LerCampo(lr, "Telefone"))) = dig Then
            TelefoneExisteNoBanco = True
            Exit Function
        End If
ProxT:
    Next lr
    TelefoneExisteNoBanco = False
End Function

Public Function ContarAlunosAtivos() As Long
    ContarAlunosAtivos = ContarOnde(SHT_ALUNOS, TBL_ALUNOS, "Status", "Ativo")
End Function

Public Function CPFExisteNoBanco(ByVal cpfDigitos As String, Optional ByVal ignorarId As Long = 0) As Boolean
    Dim lo As ListObject
    Dim lr As ListRow
    Dim dig As String

    cpfDigitos = SomenteNumeros(cpfDigitos)
    If Len(cpfDigitos) = 0 Then CPFExisteNoBanco = False: Exit Function

    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    For Each lr In lo.ListRows
        If ignorarId > 0 Then
            If CLng(Val(LerCampo(lr, "ID"))) = ignorarId Then GoTo Prox
        End If
        dig = SomenteNumeros(NzStr(LerCampo(lr, "CPF")))
        If Len(dig) > 0 And dig = cpfDigitos Then
            CPFExisteNoBanco = True
            Exit Function
        End If
Prox:
    Next lr
    CPFExisteNoBanco = False
End Function

Public Function BuscarLinhaAlunoPorId(ByVal idAluno As Long) As ListRow
    Set BuscarLinhaAlunoPorId = PesquisarRegistro(SHT_ALUNOS, TBL_ALUNOS, "ID", CStr(idAluno), False)
End Function

Public Function BuscarLinhaAlunoPorNome(ByVal trecho As String) As ListRow
    Set BuscarLinhaAlunoPorNome = PesquisarRegistro(SHT_ALUNOS, TBL_ALUNOS, "Nome", trecho, True)
End Function

Public Function AdicionarRegistroAluno(ByVal nomesCols As Variant, ByVal valores As Variant) As ListRow
    Dim lr As ListRow
    Set lr = AdicionarRegistroUnidade(SHT_ALUNOS, TBL_ALUNOS, nomesCols, valores)
    Call AplicarFormatoTextoLinhaAluno(lr)
    Set AdicionarRegistroAluno = lr
End Function

Public Sub EditarRegistroAluno(ByVal lr As ListRow, ByVal nomesCols As Variant, ByVal valores As Variant)
    Call EditarRegistro(lr, nomesCols, valores)
    Call AplicarFormatoTextoLinhaAluno(lr)
End Sub

Private Sub AplicarFormatoTextoLinhaAluno(ByVal lr As ListRow)
    Dim nomes As Variant
    Dim i As Long
    On Error Resume Next
    nomes = Array("CPF", "RG", "Telefone", "WhatsApp", "CEP", "Número", "Matrícula")
    For i = LBound(nomes) To UBound(nomes)
        lr.Range(1, ColIndex(lr.Parent, CStr(nomes(i)))).NumberFormat = "@"
    Next i
    On Error GoTo 0
End Sub

' Compat aliases
Public Function InserirAluno(ByVal nomesCols As Variant, ByVal valores As Variant) As ListRow
    Set InserirAluno = AdicionarRegistroAluno(nomesCols, valores)
End Function

Public Sub AtualizarAluno(ByVal lr As ListRow, ByVal nomesCols As Variant, ByVal valores As Variant)
    Call EditarRegistroAluno(lr, nomesCols, valores)
End Sub

Public Sub ExcluirAlunoLinha(ByVal lr As ListRow)
    Call ExcluirRegistro(lr)
End Sub

Public Sub InserirMensalidade(ByVal aluno As String, ByVal matricula As String, _
                              ByVal competencia As Date, ByVal valor As Double, _
                              ByVal vencimento As Date, ByVal forma As String)
    Dim cols As Variant, vals As Variant
    cols = Array("Aluno", "Código", "Competência", "Valor", "Vencimento", "Status", "Forma Pagamento")
    vals = Array(aluno, matricula, competencia, valor, vencimento, "Pendente", forma)
    Call AdicionarRegistro(SHT_MENSALIDADES, TBL_MENSALIDADES, cols, vals)
End Sub

' InserirContaReceber legado removido — use modFinanceiro.CriarContaReceber

Public Sub SincronizarListaAlunos()
    Dim loSrc As ListObject, loDst As ListObject
    Dim lrSrc As ListRow, lrDst As ListRow
    Dim i As Long, c As Long, nCols As Long

    On Error GoTo Falha
    Set loSrc = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    Set loDst = ObterTabela(SHT_LISTA_ALUNOS, TBL_LISTA_ALUNOS)
    nCols = loSrc.ListColumns.Count

    Do While loDst.ListRows.Count > 1
        loDst.ListRows(loDst.ListRows.Count).Delete
    Loop
    For c = 1 To loDst.ListColumns.Count
        loDst.ListRows(1).Range(1, c).Value = ""
    Next c

    i = 0
    For Each lrSrc In loSrc.ListRows
        If Len(NzStr(LerCampo(lrSrc, "Nome"))) = 0 Then GoTo ProxSrc
        i = i + 1
        If i = 1 Then
            Set lrDst = loDst.ListRows(1)
        Else
            Set lrDst = loDst.ListRows.Add
        End If
        For c = 1 To nCols
            If c <= loDst.ListColumns.Count Then
                lrDst.Range(1, c).Value = lrSrc.Range(1, c).Value
            End If
        Next c
ProxSrc:
    Next lrSrc
    Exit Sub
Falha:
End Sub

Public Function ValorPlanoConfig(ByVal plano As String) As Double
    On Error Resume Next
    ValorPlanoConfig = CDbl(Application.VLookup(plano, ThisWorkbook.Sheets(SHT_CONFIG).Range("A8:B20"), 2, False))
    If Err.Number <> 0 Then ValorPlanoConfig = 0
    On Error GoTo 0
End Function
