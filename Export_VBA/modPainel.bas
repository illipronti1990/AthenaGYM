Attribute VB_Name = "modPainel"
Option Explicit

'============================================================
' Sprint 5.1.1 — Operation Center / Painel de Ações do Dia
'============================================================

Public Const SHT_HOME As String = "21_HOME"
Public Const SHT_PRIORIDADES As String = "BD_PRIORIDADES"
Public Const TBL_PRIORIDADES As String = "tbPrioridades"

Public Sub AtualizarPainel()
    On Error GoTo TrataErro
    Call GerarAcoesDia
    Call AtualizarNotificacoesPainel
    Call AtualizarKPIsPainel
    Call AtualizarCardsProximos
    Application.Calculate
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarPainel"
End Sub

Private Function PesoTipo(ByVal tipo As String) As Long
    Dim lo As ListObject
    Dim lr As ListRow
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_PRIORIDADES, TBL_PRIORIDADES)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Tipo")), tipo, vbTextCompare) = 0 Then
            PesoTipo = CLng(Val(LerCampo(lr, "Peso")))
            Exit Function
        End If
    Next lr
Sai:
    PesoTipo = 10
End Function

Private Function IconeTipo(ByVal tipo As String) As String
    Dim lo As ListObject
    Dim lr As ListRow
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_PRIORIDADES, TBL_PRIORIDADES)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Tipo")), tipo, vbTextCompare) = 0 Then
            IconeTipo = NzStr(LerCampo(lr, "Ícone"))
            Exit Function
        End If
    Next lr
Sai:
    IconeTipo = "🔵"
End Function

Private Function DestinoTipo(ByVal tipo As String) As String
    Dim lo As ListObject
    Dim lr As ListRow
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_PRIORIDADES, TBL_PRIORIDADES)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Tipo")), tipo, vbTextCompare) = 0 Then
            DestinoTipo = NzStr(LerCampo(lr, "Destino"))
            Exit Function
        End If
    Next lr
Sai:
    DestinoTipo = "01_DASHBOARD"
End Function

Private Function FiltroTipo(ByVal tipo As String) As String
    Dim lo As ListObject
    Dim lr As ListRow
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_PRIORIDADES, TBL_PRIORIDADES)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Tipo")), tipo, vbTextCompare) = 0 Then
            FiltroTipo = NzStr(LerCampo(lr, "Filtro"))
            Exit Function
        End If
    Next lr
Sai:
    FiltroTipo = ""
End Function

Public Sub GerarAcoesDia()
    Dim acoes() As Variant
    Dim n As Long, i As Long, j As Long, k As Long
    Dim tmp As Variant
    Dim qAtraso As Long, qPend As Long, qEst As Long, qMan As Long
    Dim qRen As Long, qAval As Long, qExp As Long, qAniv As Long
    Dim hoje As Date
    Dim lo As ListObject
    Dim lr As ListRow
    Dim r As Long
    Dim partes() As String

    On Error Resume Next
    hoje = DataAtual()
    ReDim acoes(1 To 20, 1 To 6) ' icone, texto, destinoLabel, peso, qtd, destino|filtro

    ' Contagens
    qAtraso = 0
    qPend = 0
    Set lo = ObterTabela(SHT_RECEBER_BD, TBL_RECEBER_BD)
    For Each lr In lo.ListRows
        Select Case UCase$(NzStr(LerCampo(lr, "Situação")))
            Case "ATRASADO": qAtraso = qAtraso + 1
            Case "PENDENTE"
                If IsDate(LerCampo(lr, "Data Vencimento")) Then
                    If CDate(LerCampo(lr, "Data Vencimento")) = hoje Then qPend = qPend + 1
                End If
        End Select
    Next lr

    qEst = ContarEstoqueCritico()
    qMan = ContarManutencaoVencida()
    qRen = ContarRenovacoesProximas()
    qAval = ContarEventosNaData(hoje, "Avaliação Física")
    qExp = ContarEventosNaData(hoje, "Aula Experimental")
    qAniv = ContarEventosNaData(hoje, "Aniversário")

    n = 0
    If qAtraso > 0 Then
        n = n + 1
        Call PreencherAcao(acoes, n, "Mensalidade vencida", _
            "Cobrar " & qAtraso & " mensalidade(s) vencida(s)", qAtraso)
    End If
    If qMan > 0 Then
        n = n + 1
        Call PreencherAcao(acoes, n, "Equipamento parado", _
            "Fazer manutenção em " & qMan & " equipamento(s)", qMan)
    End If
    If qEst > 0 Then
        n = n + 1
        Call PreencherAcao(acoes, n, "Estoque crítico", _
            "Comprar / repor " & qEst & " produto(s) no mínimo", qEst)
    End If
    If qRen > 0 Then
        n = n + 1
        Call PreencherAcao(acoes, n, "Plano vencendo", _
            "Renovar " & qRen & " plano(s) (até 30 dias)", qRen)
    End If
    If qPend > 0 Then
        n = n + 1
        Call PreencherAcao(acoes, n, "Pagamento previsto", _
            "Receber " & qPend & " pagamento(s) previsto(s) hoje", qPend)
    End If
    If qAval > 0 Then
        n = n + 1
        Call PreencherAcao(acoes, n, "Avaliação física", _
            "Confirmar " & qAval & " avaliação(ões) física(s)", qAval)
    End If
    If qExp > 0 Then
        n = n + 1
        Call PreencherAcao(acoes, n, "Aula experimental", _
            "Confirmar " & qExp & " aula(s) experimental(is)", qExp)
    End If
    If qAniv > 0 Then
        n = n + 1
        Call PreencherAcao(acoes, n, "Aniversário", _
            "Celebrar " & qAniv & " aniversariante(s)", qAniv)
    End If

    ' Ordena por peso desc
    For i = 1 To n - 1
        For j = i + 1 To n
            If CLng(acoes(j, 4)) > CLng(acoes(i, 4)) Then
                For k = 1 To 6
                    tmp = acoes(i, k)
                    acoes(i, k) = acoes(j, k)
                    acoes(j, k) = tmp
                Next k
            End If
        Next j
    Next i

    ' Limpa slots
    For i = 0 To 9
        r = 10 + i
        GravarCelula SHT_HOME, "C" & r, ""
        GravarCelula SHT_HOME, "D" & r, ""
        GravarCelula SHT_HOME, "E" & r, ""
        GravarCelula SHT_HOME, "F" & r, ""
        GravarCelula SHT_HOME, "G" & r, ""
        GravarCelula SHT_HOME, "L" & r, ""
        GravarCelula SHT_HOME, "M" & r, ""
    Next i

    For i = 1 To Application.Min(10, n)
        r = 9 + i
        GravarCelula SHT_HOME, "C" & r, acoes(i, 1)
        GravarCelula SHT_HOME, "D" & r, acoes(i, 2)
        GravarCelula SHT_HOME, "E" & r, acoes(i, 3)
        GravarCelula SHT_HOME, "F" & r, acoes(i, 4)
        GravarCelula SHT_HOME, "G" & r, acoes(i, 5)
        partes = Split(CStr(acoes(i, 6)), "|")
        GravarCelula SHT_HOME, "L" & r, partes(0)
        If UBound(partes) >= 1 Then
            GravarCelula SHT_HOME, "M" & r, partes(1)
        Else
            GravarCelula SHT_HOME, "M" & r, ""
        End If
    Next i
    On Error GoTo 0
End Sub

Private Sub PreencherAcao(ByRef acoes As Variant, ByVal n As Long, ByVal tipo As String, _
                          ByVal texto As String, ByVal qtd As Long)
    Dim dest As String, fil As String
    dest = DestinoTipo(tipo)
    fil = FiltroTipo(tipo)
    acoes(n, 1) = IconeTipo(tipo)
    acoes(n, 2) = texto
    acoes(n, 3) = "Abrir " & Replace(Replace(dest, "_", " "), "0", "")
    ' label amigável
    Select Case dest
        Case "04_FINANCEIRO": acoes(n, 3) = "Abrir Financeiro"
        Case "09_ESTOQUE": acoes(n, 3) = "Abrir Estoque"
        Case "10_EQUIPAMENTOS": acoes(n, 3) = "Abrir Equipamentos"
        Case "20_AGENDA": acoes(n, 3) = "Abrir Agenda"
        Case "02_ALUNOS": acoes(n, 3) = "Abrir Alunos"
        Case Else: acoes(n, 3) = "Abrir"
    End Select
    acoes(n, 4) = PesoTipo(tipo)
    acoes(n, 5) = qtd
    acoes(n, 6) = dest & "|" & fil
End Sub

Private Function ContarEstoqueCritico() As Long
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
    ContarEstoqueCritico = n
End Function

Private Function ContarManutencaoVencida() As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim n As Long, hoje As Date
    hoje = DataAtual()
    On Error GoTo Sai
    Set lo = ObterTabela("10_EQUIPAMENTOS", "tblEquipamentos")
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Equipamento"))) = 0 Then GoTo Prox
        If IsDate(LerCampo(lr, "Próx. Manutenção")) Then
            If CDate(LerCampo(lr, "Próx. Manutenção")) <= hoje Then n = n + 1
        End If
Prox:
    Next lr
Sai:
    ContarManutencaoVencida = n
End Function

Private Function ContarRenovacoesProximas() As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim n As Long
    On Error GoTo Sai
    ' Usa eventos de renovação já gerados pela agenda (próximos 30 dias / hoje)
    Set lo = ObterTabela(SHT_EVENTOS, TBL_EVENTOS)
    For Each lr In lo.ListRows
        If UCase$(NzStr(LerCampo(lr, "Status"))) <> "PENDENTE" Then GoTo Prox
        If StrComp(NzStr(LerCampo(lr, "Tipo")), "Renovação", vbTextCompare) = 0 Then
            If IsDate(LerCampo(lr, "Data")) Then
                If CDate(LerCampo(lr, "Data")) <= DataAtual() + 30 Then n = n + 1
            End If
        End If
Prox:
    Next lr
Sai:
    ContarRenovacoesProximas = n
End Function

Public Sub AtualizarNotificacoesPainel()
    Dim fin As Long, est As Long, eq As Long, ag As Long, al As Long
    On Error Resume Next
    fin = ContarOnde(SHT_RECEBER_BD, TBL_RECEBER_BD, "Situação", "Atrasado")
    fin = fin + ContarEventosNaData(DataAtual(), "Mensalidade")
    est = ContarEstoqueCritico()
    eq = ContarManutencaoVencida()
    ag = ContarEventosHoje()
    al = ContarRenovacoesProximas()

    GravarCelula SHT_HOME, "I10", fin
    GravarCelula SHT_HOME, "I11", est
    GravarCelula SHT_HOME, "I12", eq
    GravarCelula SHT_HOME, "I13", ag
    GravarCelula SHT_HOME, "I14", al
    GravarCelula SHT_HOME, "D6", fin + est + eq + ag + al
    On Error GoTo 0
End Sub

Public Sub AtualizarKPIsPainel()
    Dim p As String
    On Error Resume Next
    p = PerfilUsuario

    ' defaults
    GravarCelula SHT_HOME, "H18", ""
    GravarCelula SHT_HOME, "J18", ""
    GravarCelula SHT_HOME, "H21", ""
    GravarCelula SHT_HOME, "J21", ""
    GravarCelula SHT_HOME, "H19", 0
    GravarCelula SHT_HOME, "J19", 0
    GravarCelula SHT_HOME, "H22", 0
    GravarCelula SHT_HOME, "J22", 0

    Select Case p
        Case CONST_PERFIL_ADMIN
            GravarCelula SHT_HOME, "H18", "Faturamento Hoje"
            GravarCelula SHT_HOME, "J18", "% Meta"
            GravarCelula SHT_HOME, "H21", "Lucro Mês"
            GravarCelula SHT_HOME, "J21", "Caixa"
            GravarCelula SHT_HOME, "H19", SomaCreditosDia(DataAtual())
            If MetaNumerica("Receita") > 0 Then
                GravarCelula SHT_HOME, "J19", Round(SomaCreditosMes(Month(DataAtual()), Year(DataAtual())) / MetaNumerica("Receita"), 2)
            End If
            ThisWorkbook.Sheets(SHT_HOME).Range("J19").NumberFormat = "0%"
            GravarCelula SHT_HOME, "H22", SomaCreditosMes(Month(DataAtual()), Year(DataAtual())) - SomaDebitosMes(Month(DataAtual()), Year(DataAtual()))
            GravarCelula SHT_HOME, "J22", UltimoSaldoFluxo()
            ThisWorkbook.Sheets(SHT_HOME).Range("H19").NumberFormat = "R$ #,##0.00"
            ThisWorkbook.Sheets(SHT_HOME).Range("H22").NumberFormat = "R$ #,##0.00"
            ThisWorkbook.Sheets(SHT_HOME).Range("J22").NumberFormat = "R$ #,##0.00"

        Case CONST_PERFIL_REC
            GravarCelula SHT_HOME, "H18", "Novos (mês)"
            GravarCelula SHT_HOME, "J18", "Renovações"
            GravarCelula SHT_HOME, "H21", "Cobranças hoje"
            GravarCelula SHT_HOME, "J21", "Aniversários"
            GravarCelula SHT_HOME, "H19", LerCelula(SHT_BI, "E6")
            GravarCelula SHT_HOME, "J19", ContarRenovacoesProximas()
            GravarCelula SHT_HOME, "H22", ContarEventosNaData(DataAtual(), "Mensalidade")
            GravarCelula SHT_HOME, "J22", ContarEventosNaData(DataAtual(), "Aniversário")
            ThisWorkbook.Sheets(SHT_HOME).Range("H19:J22").NumberFormat = "0"

        Case CONST_PERFIL_FIN
            GravarCelula SHT_HOME, "H18", "Receber hoje"
            GravarCelula SHT_HOME, "J18", "Atrasados"
            GravarCelula SHT_HOME, "H21", "Despesas mês"
            GravarCelula SHT_HOME, "J21", "Saldo"
            GravarCelula SHT_HOME, "H19", SomaCreditosDia(DataAtual())
            GravarCelula SHT_HOME, "J19", TotalEmAtraso()
            GravarCelula SHT_HOME, "H22", SomaDebitosMes(Month(DataAtual()), Year(DataAtual()))
            GravarCelula SHT_HOME, "J22", UltimoSaldoFluxo()
            ThisWorkbook.Sheets(SHT_HOME).Range("H19").NumberFormat = "R$ #,##0.00"
            ThisWorkbook.Sheets(SHT_HOME).Range("J19").NumberFormat = "R$ #,##0.00"
            ThisWorkbook.Sheets(SHT_HOME).Range("H22").NumberFormat = "R$ #,##0.00"
            ThisWorkbook.Sheets(SHT_HOME).Range("J22").NumberFormat = "R$ #,##0.00"

        Case CONST_PERFIL_PROF
            GravarCelula SHT_HOME, "H18", "Avaliações hoje"
            GravarCelula SHT_HOME, "J18", "Alunos ativos"
            GravarCelula SHT_HOME, "H21", "Eventos hoje"
            GravarCelula SHT_HOME, "J21", "Aulas exp."
            GravarCelula SHT_HOME, "H19", ContarEventosNaData(DataAtual(), "Avaliação Física")
            GravarCelula SHT_HOME, "J19", ContarAlunosAtivos()
            GravarCelula SHT_HOME, "H22", ContarEventosHoje()
            GravarCelula SHT_HOME, "J22", ContarEventosNaData(DataAtual(), "Aula Experimental")
            ThisWorkbook.Sheets(SHT_HOME).Range("H19:J22").NumberFormat = "0"
    End Select
    On Error GoTo 0
End Sub

Public Sub AtualizarCardsProximos()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim hoje As Date
    Dim i As Long
    Dim rows() As Variant
    Dim n As Long, a As Long, b As Long, k As Long
    Dim tmp As Variant

    On Error Resume Next
    hoje = DataAtual()
    ReDim rows(1 To 50, 1 To 3)
    n = 0
    Set lo = ObterTabela(SHT_EVENTOS, TBL_EVENTOS)
    For Each lr In lo.ListRows
        If UCase$(NzStr(LerCampo(lr, "Status"))) <> "PENDENTE" Then GoTo Prox
        If Not IsDate(LerCampo(lr, "Data")) Then GoTo Prox
        If CDate(LerCampo(lr, "Data")) <> hoje Then GoTo Prox
        n = n + 1
        rows(n, 1) = NzStr(LerCampo(lr, "Hora"))
        rows(n, 2) = NzStr(LerCampo(lr, "Título"))
        rows(n, 3) = NzStr(LerCampo(lr, "Referência"))
Prox:
    Next lr

    For a = 1 To n - 1
        For b = a + 1 To n
            If CStr(rows(b, 1)) < CStr(rows(a, 1)) Then
                For k = 1 To 3
                    tmp = rows(a, k): rows(a, k) = rows(b, k): rows(b, k) = tmp
                Next k
            End If
        Next b
    Next a

    For i = 0 To 5
        GravarCelula SHT_HOME, "C" & (23 + i), ""
        GravarCelula SHT_HOME, "D" & (23 + i), ""
        GravarCelula SHT_HOME, "E" & (23 + i), ""
    Next i
    For i = 1 To Application.Min(6, n)
        GravarCelula SHT_HOME, "C" & (22 + i), rows(i, 1)
        GravarCelula SHT_HOME, "D" & (22 + i), rows(i, 2)
        GravarCelula SHT_HOME, "E" & (22 + i), rows(i, 3)
    Next i
    On Error GoTo 0
End Sub

Public Sub AbrirAcaoSelecionada()
    Dim r As Long
    Dim dest As String, fil As String
    On Error Resume Next
    If ActiveSheet.Name <> SHT_HOME Then
        MsgAviso "Selecione uma ação na HOME."
        Exit Sub
    End If
    r = ActiveCell.Row
    If r < 10 Or r > 19 Then
        MsgAviso "Clique na linha da ação (10 a 19) e depois em ABRIR AÇÃO."
        Exit Sub
    End If
    dest = NzStr(LerCelula(SHT_HOME, "L" & r))
    fil = NzStr(LerCelula(SHT_HOME, "M" & r))
    If Len(dest) = 0 Then
        MsgAviso "Nenhuma ação nesta linha."
        Exit Sub
    End If
    Call AbrirModulo(dest, fil)
    On Error GoTo 0
End Sub

Public Sub AbrirModulo(ByVal sheetName As String, Optional ByVal filtro As String = "")
    On Error GoTo TrataErro
    If Not ExigeAba(sheetName) Then Exit Sub
    AtivarAba sheetName
    Call AplicarFiltroModulo(sheetName, filtro)
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AbrirModulo"
End Sub

Private Sub AplicarFiltroModulo(ByVal sheetName As String, ByVal filtro As String)
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(sheetName)
    If ws Is Nothing Then Exit Sub
    If Len(Trim$(filtro)) = 0 Then Exit Sub

    Select Case sheetName
        Case "04_FINANCEIRO"
            ' Situação = coluna E (5)
            If ws.AutoFilterMode Then ws.AutoFilterMode = False
            ws.Range("A9:J9").AutoFilter
            If StrComp(filtro, "Atrasado", vbTextCompare) = 0 Then
                ws.Range("A9:J9").AutoFilter Field:=5, Criteria1:="Atrasado"
            ElseIf StrComp(filtro, "Pendente", vbTextCompare) = 0 Then
                ws.Range("A9:J9").AutoFilter Field:=5, Criteria1:="Pendente"
            End If
        Case "06_CONTAS_RECEBER"
            If ws.AutoFilterMode Then ws.AutoFilterMode = False
            ws.Range("A5:J5").AutoFilter
            ws.Range("A5:J5").AutoFilter Field:=8, Criteria1:="Atrasado"
        Case "09_ESTOQUE"
            If ws.AutoFilterMode Then ws.AutoFilterMode = False
            ws.Range("A5:L5").AutoFilter
            ws.Range("A5:L5").AutoFilter Field:=12, Criteria1:="=*REPOR*"
        Case "10_EQUIPAMENTOS"
            If ws.AutoFilterMode Then ws.AutoFilterMode = False
            ws.Range("A5:I5").AutoFilter
            ' Dias p/ Manutenção <= 0 (coluna H = 8) — filter aproximado
            ws.Range("A5:I5").AutoFilter Field:=8, Criteria1:="<=0"
        Case "02_ALUNOS"
            If ws.AutoFilterMode Then ws.AutoFilterMode = False
            ws.Range("A5:U5").AutoFilter
            ws.Range("A5:U5").AutoFilter Field:=21, Criteria1:="Ativo"
        Case "20_AGENDA"
            ' sem filtro extra
    End Select
    On Error GoTo 0
End Sub

Public Sub AbrirHomeEAtualizar()
    Call AtualizarPainel
    NavegarPara SHT_HOME
End Sub

Public Function ContarPendencias() As Long
    ContarPendencias = CLng(Val(LerCelula(SHT_HOME, "D6")))
End Function
