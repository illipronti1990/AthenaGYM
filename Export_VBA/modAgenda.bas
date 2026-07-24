Attribute VB_Name = "modAgenda"
Option Explicit

'============================================================
' Sprint 5.1 — Agenda Inteligente / Motor de Eventos
'============================================================

Public Const SHT_EVENTOS As String = "BD_EVENTOS"
Public Const TBL_EVENTOS As String = "tbEventos"
Public Const SHT_AGENDA As String = "20_AGENDA"

Public Sub AtualizarAgenda()
    On Error GoTo TrataErro
    Call GerarEventosAutomaticos
    Call AtualizarAgendaUI
    Call AtualizarDashboardAgenda
    Call AlertasAgenda
    On Error Resume Next
    Call AtualizarPainel
    On Error GoTo TrataErro
    Application.Calculate
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarAgenda"
End Sub

Public Function ProximoIdEvento() As Long
    ProximoIdEvento = MaxNumerico(SHT_EVENTOS, TBL_EVENTOS, "ID") + 1
End Function

Public Function EventoJaExiste(ByVal tipo As String, ByVal referencia As String, ByVal dataEvt As Date) As Boolean
    Dim lo As ListObject
    Dim lr As ListRow
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_EVENTOS, TBL_EVENTOS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Tipo")), tipo, vbTextCompare) = 0 Then
            If StrComp(NzStr(LerCampo(lr, "Referência")), referencia, vbTextCompare) = 0 Then
                If IsDate(LerCampo(lr, "Data")) Then
                    If CDate(LerCampo(lr, "Data")) = dataEvt Then
                        If UCase$(NzStr(LerCampo(lr, "Status"))) <> "CANCELADO" Then
                            EventoJaExiste = True
                            Exit Function
                        End If
                    End If
                End If
            End If
        End If
    Next lr
Sai:
    EventoJaExiste = False
End Function

Public Sub CriarEvento(ByVal tipo As String, ByVal titulo As String, ByVal referencia As String, _
                       ByVal dataEvt As Date, ByVal hora As String, ByVal responsavel As String, _
                       ByVal prioridade As String, ByVal modulo As String, _
                       Optional ByVal observacao As String = "", Optional ByVal origem As String = "Auto")
    Dim cols As Variant, vals As Variant
    On Error GoTo TrataErro
    If EventoJaExiste(tipo, referencia, dataEvt) Then Exit Sub

    cols = Array("ID", "Tipo", "Título", "Referência", "Data", "Hora", "Responsável", _
                 "Status", "Prioridade", "Módulo", "Observação", "Origem", "UnidadeID")
    vals = Array(ProximoIdEvento(), tipo, titulo, referencia, dataEvt, hora, responsavel, _
                 "Pendente", prioridade, modulo, observacao, origem, IIf(UnidadeIDSessao() > 0, UnidadeIDSessao(), 1))
    Call AdicionarRegistroUnidade(SHT_EVENTOS, TBL_EVENTOS, cols, vals)
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "CriarEvento"
End Sub

Public Sub ConcluirEvento(ByVal idEvento As Long)
    Dim lr As ListRow
    Set lr = PesquisarRegistro(SHT_EVENTOS, TBL_EVENTOS, "ID", CStr(idEvento), False)
    If lr Is Nothing Then MsgErro "Evento não encontrado.": Exit Sub
    Call GravarCampo(lr, "Status", "Concluído")
    RegistrarLog "Evento concluído", "Agenda", "ID " & idEvento
    Call AtualizarAgendaUI
End Sub

Public Sub ExcluirEvento(ByVal idEvento As Long)
    Dim lr As ListRow
    Set lr = PesquisarRegistro(SHT_EVENTOS, TBL_EVENTOS, "ID", CStr(idEvento), False)
    If lr Is Nothing Then MsgErro "Evento não encontrado.": Exit Sub
    Call GravarCampo(lr, "Status", "Cancelado")
    RegistrarLog "Evento cancelado", "Agenda", "ID " & idEvento
    Call AtualizarAgendaUI
End Sub

Public Sub ConcluirEventoSelecionado()
    Dim idEvt As Long
    idEvt = CLng(Val(InputBox("ID do evento a concluir:", "Concluir Evento")))
    If idEvt > 0 Then Call ConcluirEvento(idEvt)
End Sub

'------------------------------------------------------------
' Motor automático
'------------------------------------------------------------
Public Sub GerarEventosAutomaticos()
    On Error Resume Next
    Call GerarEventosMensalidade
    Call GerarEventosAvaliacao
    Call GerarEventosManutencao
    Call GerarEventosEstoque
    Call GerarEventosAniversario
    Call GerarEventosRenovacao
    Call GerarEventosProfessor
    On Error GoTo 0
End Sub

Private Sub GerarEventosMensalidade()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim venc As Date, dias As Long
    Dim nome As String, mat As String, sit As String
    Dim hoje As Date

    hoje = DataAtual()
    Set lo = ObterTabela(SHT_RECEBER_BD, TBL_RECEBER_BD)
    For Each lr In lo.ListRows
        sit = UCase$(NzStr(LerCampo(lr, "Situação")))
        If sit = "PAGO" Or sit = "CANCELADO" Then GoTo ProxM
        If Not IsDate(LerCampo(lr, "Data Vencimento")) Then GoTo ProxM
        venc = CDate(LerCampo(lr, "Data Vencimento"))
        dias = CLng(venc - hoje)
        nome = NzStr(LerCampo(lr, "Nome"))
        mat = NzStr(LerCampo(lr, "Matrícula"))
        If Len(nome) = 0 Then GoTo ProxM

        If dias < 0 Then
            Call CriarEvento("Mensalidade", "Mensalidade atrasada — " & nome, mat, venc, "08:00", _
                             "Financeiro", "Alta", "Financeiro", "Dias atraso: " & Abs(dias), "Auto")
        ElseIf dias = 0 Then
            Call CriarEvento("Mensalidade", "Mensalidade vence hoje — " & nome, mat, hoje, "08:00", _
                             "Recepção", "Alta", "Financeiro", "", "Auto")
        ElseIf dias <= 5 Then
            Call CriarEvento("Mensalidade", "Mensalidade vence em " & dias & " dias — " & nome, mat, venc, "08:00", _
                             "Financeiro", "Média", "Financeiro", "", "Auto")
        End If
ProxM:
    Next lr
End Sub

Private Sub GerarEventosAvaliacao()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim dt As Date, aluno As String, prof As String
    Dim hoje As Date

    hoje = DataAtual()
    On Error GoTo Sai
    Set lo = ObterTabela("11_AVALIACAO", "tblAvaliacao")
    For Each lr In lo.ListRows
        If Not IsDate(LerCampo(lr, "Data")) Then GoTo ProxA
        dt = CDate(LerCampo(lr, "Data"))
        If dt < hoje Or dt > hoje + 7 Then GoTo ProxA
        aluno = NzStr(LerCampo(lr, "Aluno"))
        prof = NzStr(LerCampo(lr, "Professor"))
        If Len(aluno) = 0 Then GoTo ProxA
        Call CriarEvento("Avaliação Física", "Avaliação física — " & aluno, aluno, dt, "10:00", _
                         IIf(Len(prof) = 0, "Professor", prof), _
                         IIf(dt = hoje, "Média", "Baixa"), "Operacional", "", "Auto")
ProxA:
    Next lr
Sai:
End Sub

Private Sub GerarEventosManutencao()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim dt As Date, eq As String, dias As Long
    Dim hoje As Date

    hoje = DataAtual()
    On Error GoTo Sai
    Set lo = ObterTabela("10_EQUIPAMENTOS", "tblEquipamentos")
    For Each lr In lo.ListRows
        eq = NzStr(LerCampo(lr, "Equipamento"))
        If Len(eq) = 0 Then GoTo ProxE
        If IsDate(LerCampo(lr, "Próx. Manutenção")) Then
            dt = CDate(LerCampo(lr, "Próx. Manutenção"))
            dias = CLng(dt - hoje)
            If dias <= 14 Then
                Call CriarEvento("Manutenção", "Revisão — " & eq, eq, dt, "16:00", "Manutenção", _
                                 IIf(dias <= 0, "Alta", "Média"), "Equipamentos", "", "Auto")
            End If
        End If
ProxE:
    Next lr
Sai:
End Sub

Private Sub GerarEventosEstoque()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim prod As String, qtd As Double, minimo As Double
    Dim hoje As Date

    hoje = DataAtual()
    On Error GoTo Sai
    Set lo = ObterTabela("09_ESTOQUE", "tblEstoque")
    For Each lr In lo.ListRows
        prod = NzStr(LerCampo(lr, "Produto"))
        If Len(prod) = 0 Then GoTo ProxS
        qtd = CDbl(Val(LerCampo(lr, "Qtd Atual")))
        minimo = CDbl(Val(LerCampo(lr, "Estoque Mínimo")))
        If qtd <= minimo Then
            Call CriarEvento("Estoque", "Estoque mínimo — " & prod, prod, hoje, "09:00", "Estoque", _
                             IIf(qtd <= 0, "Alta", "Média"), "Estoque", "Qtd=" & qtd & " / Mín=" & minimo, "Auto")
        End If
ProxS:
    Next lr
Sai:
End Sub

Private Sub GerarEventosAniversario()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim nasc As Date, nome As String, idade As Long
    Dim hoje As Date

    hoje = DataAtual()
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    For Each lr In lo.ListRows
        nome = NzStr(LerCampo(lr, "Nome"))
        If Len(nome) = 0 Then GoTo ProxN
        If Not IsDate(LerCampo(lr, "DataNascimento")) Then GoTo ProxN
        nasc = CDate(LerCampo(lr, "DataNascimento"))
        If Month(nasc) = Month(hoje) And Day(nasc) = Day(hoje) Then
            idade = Year(hoje) - Year(nasc)
            If Month(hoje) < Month(nasc) Or (Month(hoje) = Month(nasc) And Day(hoje) < Day(nasc)) Then
                idade = idade - 1
            End If
            Call CriarEvento("Aniversário", "Aniversário — " & nome & " (" & idade & " anos)", nome, hoje, "00:00", _
                             "Marketing", "Baixa", "Comercial", "", "Auto")
        End If
ProxN:
    Next lr
Sai:
End Sub

Private Sub GerarEventosRenovacao()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim cad As Date, nome As String, mat As String, plano As String
    Dim fid As Long, vencPlano As Date, dias As Long
    Dim hoje As Date
    Dim loP As ListObject
    Dim lrP As ListRow

    hoje = DataAtual()
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    Set loP = ObterTabela(SHT_PLANOS, TBL_PLANOS)
    For Each lr In lo.ListRows
        If UCase$(NzStr(LerCampo(lr, "Status"))) <> "ATIVO" Then GoTo ProxR
        nome = NzStr(LerCampo(lr, "Nome"))
        mat = NzStr(LerCampo(lr, "Matrícula"))
        plano = NzStr(LerCampo(lr, "Plano"))
        If Not IsDate(LerCampo(lr, "DataCadastro")) Then GoTo ProxR
        cad = CDate(LerCampo(lr, "DataCadastro"))
        fid = 0
        For Each lrP In loP.ListRows
            If StrComp(NzStr(LerCampo(lrP, "Plano")), plano, vbTextCompare) = 0 Then
                fid = CLng(Val(LerCampo(lrP, "Fidelidade")))
                Exit For
            End If
        Next lrP
        If fid <= 0 Then fid = 12
        vencPlano = DateAdd("m", fid, cad)
        dias = CLng(vencPlano - hoje)
        If dias >= 0 And dias <= 30 Then
            Call CriarEvento("Renovação", "Renovação em " & dias & " dias — " & nome, mat, vencPlano, "09:00", _
                             "Recepção", IIf(dias <= 7, "Alta", "Média"), "Comercial", plano, "Auto")
        End If
ProxR:
    Next lr
Sai:
End Sub

Private Sub GerarEventosProfessor()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim nome As String, st As String
    Dim hoje As Date

    hoje = DataAtual()
    On Error GoTo Sai
    Set lo = ObterTabela("08_PROFESSORES", "tblProfessores")
    For Each lr In lo.ListRows
        nome = NzStr(LerCampo(lr, "Nome"))
        st = UCase$(NzStr(LerCampo(lr, "Status")))
        If Len(nome) = 0 Then GoTo ProxP
        If InStr(st, "FÉRIAS") > 0 Or InStr(st, "FERIAS") > 0 Then
            Call CriarEvento("Professor", "Professor em férias — " & nome, nome, hoje, "08:00", _
                             "Administrador", "Média", "Operacional", "", "Auto")
        End If
ProxP:
    Next lr
Sai:
End Sub

'------------------------------------------------------------
' Consultas
'------------------------------------------------------------
Public Function ContarEventosHoje() As Long
    ContarEventosHoje = ContarEventosNaData(DataAtual(), "")
End Function

Public Function ContarEventosNaData(ByVal dataEvt As Date, ByVal tipoFiltro As String) As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim n As Long, sit As String
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_EVENTOS, TBL_EVENTOS)
    For Each lr In lo.ListRows
        If Not PertenceUnidade(lr) Then GoTo Prox
        sit = UCase$(NzStr(LerCampo(lr, "Status")))
        If sit = "CANCELADO" Or sit = "CONCLUÍDO" Or sit = "CONCLUIDO" Then GoTo Prox
        If Not IsDate(LerCampo(lr, "Data")) Then GoTo Prox
        If CDate(LerCampo(lr, "Data")) <> dataEvt Then GoTo Prox
        If Len(tipoFiltro) > 0 Then
            If StrComp(NzStr(LerCampo(lr, "Tipo")), tipoFiltro, vbTextCompare) <> 0 Then GoTo Prox
        End If
        n = n + 1
Prox:
    Next lr
Sai:
    ContarEventosNaData = n
End Function

Public Function ContarEventosPrioridadeHoje(ByVal prioridade As String) As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim n As Long, hoje As Date
    hoje = DataAtual()
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_EVENTOS, TBL_EVENTOS)
    For Each lr In lo.ListRows
        If UCase$(NzStr(LerCampo(lr, "Status"))) <> "PENDENTE" Then GoTo Prox
        If Not IsDate(LerCampo(lr, "Data")) Then GoTo Prox
        If CDate(LerCampo(lr, "Data")) <> hoje Then GoTo Prox
        If StrComp(NzStr(LerCampo(lr, "Prioridade")), prioridade, vbTextCompare) = 0 Then n = n + 1
Prox:
    Next lr
Sai:
    ContarEventosPrioridadeHoje = n
End Function

Private Function IconePrioridade(ByVal pri As String) As String
    Select Case UCase$(Trim$(pri))
        Case "ALTA": IconePrioridade = "🔴"
        Case "MÉDIA", "MEDIA": IconePrioridade = "🟡"
        Case Else: IconePrioridade = "🟢"
    End Select
End Function

'------------------------------------------------------------
' UI
'------------------------------------------------------------
Public Sub AtualizarAgendaUI()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim hoje As Date
    Dim rows() As Variant
    Dim n As Long, i As Long, j As Long, k As Long
    Dim tmp As Variant
    Dim r As Long
    Dim contTipos(1 To 7) As Long
    Dim tiposFixos As Variant
    Dim dSeg As Date, d As Long, cnt As Long
    Dim wd As Long

    On Error Resume Next
    hoje = DataAtual()
    Set lo = ObterTabela(SHT_EVENTOS, TBL_EVENTOS)

    ' Coleta eventos de hoje pendentes
    ReDim rows(1 To 200, 1 To 6)
    n = 0
    For Each lr In lo.ListRows
        If Not PertenceUnidade(lr) Then GoTo ProxU
        If UCase$(NzStr(LerCampo(lr, "Status"))) <> "PENDENTE" Then GoTo ProxU
        If Not IsDate(LerCampo(lr, "Data")) Then GoTo ProxU
        If CDate(LerCampo(lr, "Data")) <> hoje Then GoTo ProxU
        n = n + 1
        rows(n, 1) = IconePrioridade(NzStr(LerCampo(lr, "Prioridade")))
        rows(n, 2) = NzStr(LerCampo(lr, "Hora"))
        rows(n, 3) = NzStr(LerCampo(lr, "Tipo"))
        rows(n, 4) = NzStr(LerCampo(lr, "Título"))
        rows(n, 5) = NzStr(LerCampo(lr, "Referência"))
        rows(n, 6) = NzStr(LerCampo(lr, "Responsável"))
ProxU:
    Next lr

    ' Ordena por hora
    For i = 1 To n - 1
        For j = i + 1 To n
            If CStr(rows(j, 2)) < CStr(rows(i, 2)) Then
                For k = 1 To 6
                    tmp = rows(i, k)
                    rows(i, k) = rows(j, k)
                    rows(j, k) = tmp
                Next k
            End If
        Next j
    Next i

    ' Limpa e preenche painel hoje
    For i = 0 To 11
        r = 13 + i
        GravarCelula SHT_AGENDA, "C" & r, ""
        GravarCelula SHT_AGENDA, "D" & r, ""
        GravarCelula SHT_AGENDA, "E" & r, ""
        GravarCelula SHT_AGENDA, "F" & r, ""
        GravarCelula SHT_AGENDA, "G" & r, ""
        GravarCelula SHT_AGENDA, "H" & r, ""
    Next i
    For i = 1 To Application.Min(12, n)
        r = 12 + i
        GravarCelula SHT_AGENDA, "C" & r, rows(i, 1)
        GravarCelula SHT_AGENDA, "D" & r, rows(i, 2)
        GravarCelula SHT_AGENDA, "E" & r, rows(i, 3)
        GravarCelula SHT_AGENDA, "F" & r, rows(i, 4)
        GravarCelula SHT_AGENDA, "G" & r, rows(i, 5)
        GravarCelula SHT_AGENDA, "H" & r, rows(i, 6)
    Next i

    ' Contagem por tipo (hoje)
    tiposFixos = Array("Mensalidade", "Avaliação Física", "Aula Experimental", "Renovação", "Manutenção", "Aniversário", "Estoque")
    For i = 1 To 7
        contTipos(i) = ContarEventosNaData(hoje, CStr(tiposFixos(i - 1)))
        GravarCelula SHT_AGENDA, "D" & (40 + i), contTipos(i)
    Next i

    ' Semana (segunda a domingo da semana corrente)
    wd = Weekday(hoje, vbMonday) ' 1=seg ... 7=dom
    dSeg = hoje - (wd - 1)
    For d = 0 To 6
        cnt = ContarEventosNaData(dSeg + d, "")
        GravarCelula SHT_AGENDA, Chr$(67 + d) & "28", cnt  ' C=67
    Next d

    ' Aniversariantes hoje
    Call PreencherAniversariantesUI

    ' KPIs BI
    GravarCelula SHT_BI, "E28", ContarEventosHoje()
    GravarCelula SHT_BI, "E29", ContarEventosPrioridadeHoje("Alta")
    GravarCelula SHT_BI, "E30", ContarEventosNaData(hoje, "Mensalidade")
    GravarCelula SHT_BI, "E31", ContarEventosNaData(hoje, "Avaliação Física")

    On Error GoTo 0
End Sub

Private Sub PreencherAniversariantesUI()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim hoje As Date, nasc As Date, nome As String, idade As Long
    Dim i As Long

    On Error Resume Next
    hoje = DataAtual()
    For i = 0 To 5
        GravarCelula SHT_AGENDA, "I" & (32 + i), ""
        GravarCelula SHT_AGENDA, "J" & (32 + i), ""
    Next i
    i = 0
    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    For Each lr In lo.ListRows
        If i > 5 Then Exit For
        nome = NzStr(LerCampo(lr, "Nome"))
        If Len(nome) = 0 Then GoTo Prox
        If Not IsDate(LerCampo(lr, "DataNascimento")) Then GoTo Prox
        nasc = CDate(LerCampo(lr, "DataNascimento"))
        If Month(nasc) = Month(hoje) And Day(nasc) = Day(hoje) Then
            idade = Year(hoje) - Year(nasc)
            GravarCelula SHT_AGENDA, "I" & (32 + i), nome
            GravarCelula SHT_AGENDA, "J" & (32 + i), idade & " anos"
            i = i + 1
        End If
Prox:
    Next lr
    On Error GoTo 0
End Sub

Public Sub AtualizarDashboardAgenda()
    Dim i As Long
    Dim hoje As Date
    Dim lo As ListObject
    Dim lr As ListRow
    Dim n As Long

    On Error Resume Next
    hoje = DataAtual()
    ' Painel no executivo: linhas 41-45 já usadas por alertas BI.
    ' Usa bloco H41:L45 para agenda resumida
    GravarCelula "01_DASHBOARD", "H39", "📅 EVENTOS HOJE"
    n = 0
    Set lo = ObterTabela(SHT_EVENTOS, TBL_EVENTOS)
    For Each lr In lo.ListRows
        If n >= 5 Then Exit For
        If UCase$(NzStr(LerCampo(lr, "Status"))) <> "PENDENTE" Then GoTo ProxD
        If Not IsDate(LerCampo(lr, "Data")) Then GoTo ProxD
        If CDate(LerCampo(lr, "Data")) <> hoje Then GoTo ProxD
        GravarCelula "01_DASHBOARD", "H" & (41 + n), IconePrioridade(NzStr(LerCampo(lr, "Prioridade")))
        GravarCelula "01_DASHBOARD", "I" & (41 + n), NzStr(LerCampo(lr, "Hora"))
        GravarCelula "01_DASHBOARD", "J" & (41 + n), NzStr(LerCampo(lr, "Título"))
        n = n + 1
ProxD:
    Next lr
    For i = n To 4
        GravarCelula "01_DASHBOARD", "H" & (41 + i), ""
        GravarCelula "01_DASHBOARD", "I" & (41 + i), ""
        GravarCelula "01_DASHBOARD", "J" & (41 + i), ""
    Next i
    On Error GoTo 0
End Sub

Public Sub AlertasAgenda()
    Dim hoje As Long, alta As Long, aval As Long, est As Long, manut As Long, aniv As Long
    Dim i As Long, msg As String

    On Error Resume Next
    hoje = ContarEventosHoje()
    alta = ContarEventosPrioridadeHoje("Alta")
    aval = ContarEventosNaData(DataAtual(), "Avaliação Física")
    est = ContarEventosNaData(DataAtual(), "Estoque")
    manut = ContarEventosNaData(DataAtual(), "Manutenção")
    aniv = ContarEventosNaData(DataAtual(), "Aniversário")

    For i = 0 To 5
        GravarCelula SHT_AGENDA, "C" & (32 + i), ""
        GravarCelula SHT_AGENDA, "D" & (32 + i), ""
        GravarCelula SHT_AGENDA, "E" & (32 + i), ""
    Next i

    i = 32
    If alta > 0 Then
        GravarCelula SHT_AGENDA, "C" & i, "🔴"
        GravarCelula SHT_AGENDA, "D" & i, alta & " prioridade(s) alta(s) hoje"
        GravarCelula SHT_AGENDA, "E" & i, SHT_AGENDA
        i = i + 1
    End If
    If ContarEventosNaData(DataAtual(), "Mensalidade") > 0 Then
        GravarCelula SHT_AGENDA, "C" & i, "🔴"
        GravarCelula SHT_AGENDA, "D" & i, ContarEventosNaData(DataAtual(), "Mensalidade") & " mensalidade(s) no radar"
        GravarCelula SHT_AGENDA, "E" & i, "04_FINANCEIRO"
        i = i + 1
    End If
    If aval > 0 Then
        GravarCelula SHT_AGENDA, "C" & i, "🟡"
        GravarCelula SHT_AGENDA, "D" & i, aval & " avaliação(ões) hoje"
        GravarCelula SHT_AGENDA, "E" & i, "11_AVALIACAO"
        i = i + 1
    End If
    If est > 0 Then
        GravarCelula SHT_AGENDA, "C" & i, "🟡"
        GravarCelula SHT_AGENDA, "D" & i, est & " produto(s) em falta/mínimo"
        GravarCelula SHT_AGENDA, "E" & i, "09_ESTOQUE"
        i = i + 1
    End If
    If manut > 0 Then
        GravarCelula SHT_AGENDA, "C" & i, "🔴"
        GravarCelula SHT_AGENDA, "D" & i, manut & " manutenção(ões)"
        GravarCelula SHT_AGENDA, "E" & i, "10_EQUIPAMENTOS"
        i = i + 1
    End If
    If aniv > 0 Then
        GravarCelula SHT_AGENDA, "C" & i, "🟢"
        GravarCelula SHT_AGENDA, "D" & i, aniv & " aniversariante(s) hoje"
        GravarCelula SHT_AGENDA, "E" & i, SHT_AGENDA
        i = i + 1
    End If
    On Error GoTo 0
End Sub

Public Sub NotificacoesAgenda()
    Dim nome As String
    Dim txt As String
    Dim hoje As Date

    On Error Resume Next
    Call AtualizarAgenda
    hoje = DataAtual()
    nome = NzStr(NomeUsuario)
    If Len(nome) = 0 Then nome = "gestor"

    txt = "Bom dia, " & nome & "." & vbCrLf & vbCrLf & _
          "Hoje existem:" & vbCrLf & _
          "✔ " & ContarEventosNaData(hoje, "Mensalidade") & " pagamento(s) / mensalidade(s)" & vbCrLf & _
          "✔ " & ContarEventosNaData(hoje, "Avaliação Física") & " avaliação(ões) física(s)" & vbCrLf & _
          "✔ " & ContarEventosNaData(hoje, "Aula Experimental") & " aula(s) experimental(is)" & vbCrLf & _
          "✔ " & ContarEventosNaData(hoje, "Manutenção") & " manutenção(ões)" & vbCrLf & _
          "✔ " & ContarEventosNaData(hoje, "Aniversário") & " aniversariante(s)" & vbCrLf & vbCrLf & _
          "Total de eventos hoje: " & ContarEventosHoje()

    MsgBox txt, vbInformation, "ATHENAS GYM — Agenda do Dia"
    On Error GoTo 0
End Sub

Public Sub IrAgenda()
    NavegarPara SHT_AGENDA
End Sub

Public Sub AbrirAgendaEAtualizar()
    Call AtualizarAgenda
    Call IrAgenda
End Sub

Public Sub NovoEventoManual()
    Dim tipo As String, titulo As String, ref As String, hora As String, resp As String
    If Not SessaoAtiva() Then MsgAviso "Faça login.": Exit Sub
    tipo = InputBox("Tipo (Mensalidade, Avaliação Física, Manutenção...):", "Novo Evento", "Avaliação Física")
    If Len(Trim$(tipo)) = 0 Then Exit Sub
    titulo = InputBox("Título do evento:", "Novo Evento")
    If Len(Trim$(titulo)) = 0 Then Exit Sub
    ref = InputBox("Referência (aluno/equipamento):", "Novo Evento")
    hora = InputBox("Hora (HH:MM):", "Novo Evento", "10:00")
    resp = InputBox("Responsável:", "Novo Evento", NomeUsuario)
    Call CriarEvento(tipo, titulo, ref, DataAtual(), hora, resp, "Média", "Operacional", "", "Manual")
    Call AtualizarAgendaUI
    MsgOk "Evento criado."
End Sub
