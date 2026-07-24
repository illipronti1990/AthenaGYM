Attribute VB_Name = "modConfiguracao"
Option Explicit

'============================================================
' Sprint 3.5 — Motor de configuração (BD_PARAMETROS + mestras)
'============================================================

Public Function ObterParametro(ByVal grupo As String, ByVal parametro As String, Optional ByVal padrao As String = "") As String
    Dim lo As ListObject
    Dim lr As ListRow
    Dim g As String, p As String

    On Error GoTo Falha
    g = Trim$(grupo)
    p = Trim$(parametro)
    Set lo = ObterTabela(SHT_PARAMETROS, TBL_PARAMETROS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Grupo")), g, vbTextCompare) = 0 Then
            If StrComp(NzStr(LerCampo(lr, "Parâmetro")), p, vbTextCompare) = 0 Then
                ObterParametro = NzStr(LerCampo(lr, "Valor"))
                Exit Function
            End If
        End If
    Next lr
    ObterParametro = padrao
    Exit Function
Falha:
    ObterParametro = padrao
End Function

Public Function ObterParametroNumero(ByVal grupo As String, ByVal parametro As String, Optional ByVal padrao As Double = 0) As Double
    Dim v As String
    v = ObterParametro(grupo, parametro, "")
    If Len(v) = 0 Then
        ObterParametroNumero = padrao
    Else
        ObterParametroNumero = CDbl(Val(Replace(v, ",", ".")))
    End If
End Function

' Compatibilidade — chave única (busca só por Parâmetro)
Public Function LerParametro(ByVal chave As String, Optional ByVal padrao As String = "") As String
    Dim v As String
    v = LerParametroTabela(chave, "")
    If Len(v) = 0 Then
        LerParametro = padrao
    Else
        LerParametro = v
    End If
End Function

Public Function PrefixoMatricula() As String
    Dim p As String
    p = UCase$(NzStr(ObterParametro("Sistema", "PrefixoMatricula", "ATH")))
    If Len(p) = 0 Then p = "ATH"
    PrefixoMatricula = p
End Function

Public Function AnoCorrenteParametro() As Long
    Dim a As Long
    a = CLng(ObterParametroNumero("Sistema", "AnoAtual", 0))
    If a < 2000 Then a = Year(DataAtual())
    AnoCorrenteParametro = a
End Function

Public Function VersaoSistema() As String
    Dim v As String
    v = NzStr(ObterParametro("Sistema", "Versao", "2.0.0"))
    If Len(v) = 0 Then v = "2.0.0"
    VersaoSistema = v
End Function

Public Function NomeAcademia() As String
    Dim n As String
    n = NzStr(ObterParametro("Academia", "Nome", "ATHENAS GYM"))
    If Len(n) = 0 Then n = "ATHENAS GYM"
    NomeAcademia = n
End Function

Public Function CidadeAcademia() As String
    Dim c As String
    c = NzStr(ObterParametro("Academia", "Cidade", "São Paulo"))
    If Len(c) = 0 Then c = "São Paulo"
    CidadeAcademia = c
End Function

Public Function DiaVencimentoPadrao() As Long
    Dim v As Long
    v = CLng(ObterParametroNumero("Financeiro", "DiaVencimentoPadrao", 0))
    If v < 1 Or v > 28 Then v = CLng(Val(LerCelula(SHT_CONFIG, "V9")))
    If v < 1 Or v > 28 Then v = 10
    DiaVencimentoPadrao = v
End Function

Public Function DiasTolerancia() As Long
    Dim v As Long
    v = CLng(ObterParametroNumero("Financeiro", "DiasTolerancia", 5))
    If v < 0 Then v = 0
    DiasTolerancia = v
End Function

Public Function MultaPercentual() As Double
    MultaPercentual = ObterParametroNumero("Financeiro", "Multa", 2)
End Function

Public Function JurosPercentual() As Double
    JurosPercentual = ObterParametroNumero("Financeiro", "Juros", 1)
End Function

Public Function MoedaSimbolo() As String
    Dim m As String
    m = NzStr(ObterParametro("Academia", "Moeda", "R$"))
    If Len(m) = 0 Then m = "R$"
    MoedaSimbolo = m
End Function

Public Function MetaReceitaMes() As Double
    Dim v As Double
    v = ObterParametroNumero("Financeiro", "MetaReceitaMes", 0)
    If v <= 0 Then v = CDbl(Val(LerCelula(SHT_CONFIG, "V14")))
    MetaReceitaMes = v
End Function

Public Function BloquearEmailDuplicado() As Boolean
    Dim v As String
    v = UCase$(ObterParametro("Financeiro", "BloquearEmailDuplicado", ""))
    If Len(v) = 0 Then v = UCase$(NzStr(LerCelula(SHT_CONFIG, "V15")))
    BloquearEmailDuplicado = (v = "SIM")
End Function

Public Function BloquearTelefoneDuplicado() As Boolean
    Dim v As String
    v = UCase$(ObterParametro("Financeiro", "BloquearTelefoneDuplicado", ""))
    If Len(v) = 0 Then v = UCase$(NzStr(LerCelula(SHT_CONFIG, "V16")))
    BloquearTelefoneDuplicado = (v = "SIM")
End Function

Public Function ValorDoPlano(ByVal plano As String) As Double
    Dim lo As ListObject
    Dim lr As ListRow
    On Error GoTo Falha
    Set lo = ObterTabela(SHT_PLANOS, TBL_PLANOS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Plano")), Trim$(plano), vbTextCompare) = 0 Then
            If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) = 0 Or Len(NzStr(LerCampo(lr, "Status"))) = 0 Then
                ValorDoPlano = CDbl(Val(Replace(CStr(LerCampo(lr, "Valor")), ",", ".")))
                Exit Function
            End If
        End If
    Next lr
Falha:
    ValorDoPlano = ValorPlanoConfig(plano)
End Function

Public Function TaxaMatriculaPlano(ByVal plano As String) As Double
    Dim lo As ListObject
    Dim lr As ListRow
    On Error GoTo Falha
    Set lo = ObterTabela(SHT_PLANOS, TBL_PLANOS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Plano")), Trim$(plano), vbTextCompare) = 0 Then
            TaxaMatriculaPlano = CDbl(Val(Replace(CStr(LerCampo(lr, "Matrícula")), ",", ".")))
            Exit Function
        End If
    Next lr
Falha:
    TaxaMatriculaPlano = 0
End Function

Public Function DiaVencimentoDoPlano(ByVal plano As String) As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim v As Long
    On Error GoTo Falha
    Set lo = ObterTabela(SHT_PLANOS, TBL_PLANOS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Plano")), Trim$(plano), vbTextCompare) = 0 Then
            v = CLng(Val(LerCampo(lr, "Vencimento")))
            If v >= 1 And v <= 28 Then
                DiaVencimentoDoPlano = v
                Exit Function
            End If
        End If
    Next lr
Falha:
    DiaVencimentoDoPlano = DiaVencimentoPadrao()
End Function

Public Function TaxaFormaPagamento(ByVal forma As String) As Double
    Dim lo As ListObject
    Dim lr As ListRow
    On Error GoTo Falha
    Set lo = ObterTabela(SHT_FORMAS, TBL_FORMAS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Forma")), Trim$(forma), vbTextCompare) = 0 Then
            TaxaFormaPagamento = CDbl(Val(Replace(CStr(LerCampo(lr, "Taxa")), ",", ".")))
            Exit Function
        End If
    Next lr
Falha:
    TaxaFormaPagamento = 0
End Function

Public Function CompensacaoFormaPagamento(ByVal forma As String) As Long
    Dim lo As ListObject
    Dim lr As ListRow
    On Error GoTo Falha
    Set lo = ObterTabela(SHT_FORMAS, TBL_FORMAS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Forma")), Trim$(forma), vbTextCompare) = 0 Then
            CompensacaoFormaPagamento = CLng(Val(LerCampo(lr, "CompensaEmDias")))
            Exit Function
        End If
    Next lr
Falha:
    CompensacaoFormaPagamento = 0
End Function

Public Function ValorLiquidoRecebido(ByVal valorBruto As Double, ByVal forma As String) As Double
    Dim taxa As Double
    taxa = TaxaFormaPagamento(forma)
    ValorLiquidoRecebido = valorBruto * (1 - (taxa / 100#))
End Function

Public Function CorSistema(ByVal item As String, Optional ByVal padrao As String = "#A3001E") As String
    Dim lo As ListObject
    Dim lr As ListRow
    On Error GoTo Falha
    Set lo = ObterTabela(SHT_CORES, TBL_CORES)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Item")), Trim$(item), vbTextCompare) = 0 Then
            CorSistema = NzStr(LerCampo(lr, "Cor"))
            Exit Function
        End If
    Next lr
Falha:
    CorSistema = padrao
End Function

Public Sub CarregarComboPlanos(ByVal cmb As Object)
    Dim lo As ListObject
    Dim lr As ListRow
    On Error Resume Next
    cmb.Clear
    Set lo = ObterTabela(SHT_PLANOS, TBL_PLANOS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) = 0 Then
            cmb.AddItem NzStr(LerCampo(lr, "Plano"))
        End If
    Next lr
    On Error GoTo 0
End Sub

Public Sub CarregarComboFormas(ByVal cmb As Object)
    Dim lo As ListObject
    Dim lr As ListRow
    On Error Resume Next
    cmb.Clear
    Set lo = ObterTabela(SHT_FORMAS, TBL_FORMAS)
    For Each lr In lo.ListRows
        cmb.AddItem NzStr(LerCampo(lr, "Forma"))
    Next lr
    On Error GoTo 0
End Sub

Public Sub CarregarComboStatus(ByVal cmb As Object, ByVal tipo As String)
    Dim lo As ListObject
    Dim lr As ListRow
    On Error Resume Next
    cmb.Clear
    Set lo = ObterTabela(SHT_STATUS, TBL_STATUS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Tipo")), Trim$(tipo), vbTextCompare) = 0 Then
            cmb.AddItem NzStr(LerCampo(lr, "Status"))
        End If
    Next lr
    On Error GoTo 0
End Sub

Public Sub SincronizarParametrosUI()
    On Error Resume Next
    GravarCelula SHT_CONFIG, "V9", DiaVencimentoPadrao()
    GravarCelula SHT_CONFIG, "V14", MetaReceitaMes()
    GravarCelula SHT_CONFIG, "V15", IIf(BloquearEmailDuplicado(), "SIM", "NÃO")
    GravarCelula SHT_CONFIG, "V16", IIf(BloquearTelefoneDuplicado(), "SIM", "NÃO")
    On Error GoTo 0
End Sub
