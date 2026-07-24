Attribute VB_Name = "modAcesso"
Option Explicit

'============================================================
' Sprint 8.0 — Controle de Acesso / Frequencia
'============================================================

Public Const SHT_ACESSOS As String = "BD_ACESSOS"
Public Const TBL_ACESSOS As String = "tbAcessos"
Public Const SHT_PRESENCAS_BD As String = "BD_PRESENCAS"
Public Const TBL_PRESENCAS_BD As String = "tbPresencasBD"
Public Const SHT_ACESSO_UI As String = "26_ACESSO"
Public Const SHT_DASH_FREQ As String = "27_DASH_FREQUENCIA"

Public Sub AtualizarAcesso()
    On Error GoTo TrataErro
    Call IdentificarAlunosAusentes
    Call AtualizarListaAcessosHoje
    Call AtualizarPainelAusentes
    Call AtualizarDashboardAcesso
    Application.Calculate
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarAcesso"
End Sub

Public Sub IrAcesso(): NavegarPara SHT_ACESSO_UI: End Sub
Public Sub IrDashFrequencia(): NavegarPara SHT_DASH_FREQ: End Sub
Public Sub AbrirAcessoEAtualizar(): Call AtualizarAcesso: NavegarPara SHT_ACESSO_UI: End Sub

Private Function ParamBloquearInadimplente() As Boolean
    ParamBloquearInadimplente = (UCase$(ObterParametro("Acesso", "BloquearInadimplente", "SIM")) = "SIM")
End Function

Private Function ParamPermitirLiberacaoManual() As Boolean
    ParamPermitirLiberacaoManual = (UCase$(ObterParametro("Acesso", "PermitirLiberacaoManual", "SIM")) = "SIM")
End Function

Private Function ParamRegistrarSaida() As Boolean
    ParamRegistrarSaida = (UCase$(ObterParametro("Acesso", "RegistrarSaida", "SIM")) = "SIM")
End Function

Private Function DiasAusenciaRisco() As Long
    DiasAusenciaRisco = CLng(ObterParametroNumero("Acesso", "DiasSemAcessoRisco", 15))
End Function

Private Function UsuarioRecepcao() As String
    Dim n As String
    On Error Resume Next
    n = NzStr(LerCelula("BD_SESSAO", "B2"))
    If Len(n) = 0 Then n = "Recepção"
    UsuarioRecepcao = n
End Function

Private Function BuscarAlunoPorMatricula(ByVal mat As String) As ListRow
    Set BuscarAlunoPorMatricula = PesquisarRegistro(SHT_ALUNOS, TBL_ALUNOS, "Matrícula", mat, False)
End Function

Private Function BuscarAlunoPorCPF(ByVal cpf As String) As ListRow
    Set BuscarAlunoPorCPF = PesquisarRegistro(SHT_ALUNOS, TBL_ALUNOS, "CPF", cpf, True)
End Function

Private Function MensalidadeEmDia(ByVal matricula As String) As Boolean
    Dim lo As ListObject
    Dim lr As ListRow
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_RECEBER_BD, TBL_RECEBER_BD)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), matricula, vbTextCompare) = 0 Then
            If StrComp(NzStr(LerCampo(lr, "Situação")), "Atrasado", vbTextCompare) = 0 Then
                MensalidadeEmDia = False
                Exit Function
            End If
        End If
    Next lr
    MensalidadeEmDia = True
    Exit Function
Sai:
    MensalidadeEmDia = True
End Function

Public Function ValidarEntrada(ByVal matricula As String, ByRef msg As String, ByRef podeLiberar As Boolean) As Boolean
    Dim lr As ListRow
    Dim st As String
    Dim emDia As Boolean

    podeLiberar = False
    msg = ""
    Set lr = BuscarAlunoPorMatricula(matricula)
    If lr Is Nothing Then
        msg = "Aluno nao encontrado."
        ValidarEntrada = False
        Exit Function
    End If

    st = UCase$(NzStr(LerCampo(lr, "Status")))
    If st = "CANCELADO" Then
        msg = "Entrada bloqueada — plano cancelado."
        ValidarEntrada = False
        Exit Function
    End If
    If st = "CONGELADO" Then
        msg = "Plano congelado — entrada nao liberada."
        ValidarEntrada = False
        Exit Function
    End If
    If st <> "ATIVO" And st <> "INADIMPLENTE" Then
        msg = "Situacao do aluno nao permite acesso: " & NzStr(LerCampo(lr, "Status"))
        ValidarEntrada = False
        Exit Function
    End If

    emDia = MensalidadeEmDia(matricula)
    If Not emDia Then
        If ParamBloquearInadimplente() Then
            If ParamPermitirLiberacaoManual() Then
                msg = "ATENCAO: mensalidade vencida. Liberacao manual permitida."
                podeLiberar = True
                ValidarEntrada = False
                Exit Function
            Else
                msg = "Entrada bloqueada — mensalidade vencida."
                ValidarEntrada = False
                Exit Function
            End If
        Else
            msg = "Mensalidade vencida — liberado por configuracao."
            podeLiberar = True
            ValidarEntrada = True
            Exit Function
        End If
    End If

    msg = "LIBERAR ENTRADA"
    podeLiberar = True
    ValidarEntrada = True
End Function

Public Sub ConsultarAlunoAcesso()
    Dim mat As String, cpf As String
    Dim lr As ListRow
    Dim ok As Boolean, pode As Boolean, msg As String
    Dim emDia As Boolean

    On Error GoTo TrataErro
    mat = Trim$(NzStr(LerCelula(SHT_ACESSO_UI, "D12")))
    cpf = Trim$(NzStr(LerCelula(SHT_ACESSO_UI, "D13")))
    If Len(mat) = 0 And Len(cpf) = 0 Then
        mat = Trim$(InputBox("Matricula ou deixe em branco para CPF:", "Controle de Acesso"))
        If Len(mat) = 0 Then
            cpf = Trim$(InputBox("CPF:", "Controle de Acesso"))
        End If
    End If

    If Len(mat) > 0 Then
        Set lr = BuscarAlunoPorMatricula(mat)
    ElseIf Len(cpf) > 0 Then
        Set lr = BuscarAlunoPorCPF(cpf)
    Else
        MsgAviso "Informe matricula ou CPF."
        Exit Sub
    End If

    If lr Is Nothing Then
        MsgErro "Aluno nao encontrado."
        Call LimparPainelAlunoAcesso
        Exit Sub
    End If

    mat = NzStr(LerCampo(lr, "Matrícula"))
    GravarCelula SHT_ACESSO_UI, "D12", mat
    GravarCelula SHT_ACESSO_UI, "D13", NzStr(LerCampo(lr, "CPF"))
    GravarCelula SHT_ACESSO_UI, "D17", NzStr(LerCampo(lr, "Nome"))
    GravarCelula SHT_ACESSO_UI, "D18", NzStr(LerCampo(lr, "Plano"))
    GravarCelula SHT_ACESSO_UI, "D19", NzStr(LerCampo(lr, "Status"))
    emDia = MensalidadeEmDia(mat)
    GravarCelula SHT_ACESSO_UI, "D20", IIf(emDia, "EM DIA", "VENCIDA")
    GravarCelula SHT_ACESSO_UI, "D21", NzStr(LerCampo(lr, "Professor"))

    ok = ValidarEntrada(mat, msg, pode)
    GravarCelula SHT_ACESSO_UI, "D22", msg
    Call ConsultarHistorico(mat)
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "ConsultarAlunoAcesso"
End Sub

Private Sub LimparPainelAlunoAcesso()
    Dim i As Long
    GravarCelula SHT_ACESSO_UI, "D17", ""
    GravarCelula SHT_ACESSO_UI, "D18", ""
    GravarCelula SHT_ACESSO_UI, "D19", ""
    GravarCelula SHT_ACESSO_UI, "D20", ""
    GravarCelula SHT_ACESSO_UI, "D21", ""
    GravarCelula SHT_ACESSO_UI, "D22", ""
    For i = 0 To 7
        GravarCelula SHT_ACESSO_UI, "H" & (13 + i), ""
        GravarCelula SHT_ACESSO_UI, "I" & (13 + i), ""
        GravarCelula SHT_ACESSO_UI, "J" & (13 + i), ""
        GravarCelula SHT_ACESSO_UI, "K" & (13 + i), ""
    Next i
End Sub

Public Sub LiberarEntrada()
    Dim mat As String
    Dim ok As Boolean, pode As Boolean, msg As String
    Dim resp As VbMsgBoxResult

    On Error GoTo TrataErro
    mat = Trim$(NzStr(LerCelula(SHT_ACESSO_UI, "D12")))
    If Len(mat) = 0 Then
        Call ConsultarAlunoAcesso
        mat = Trim$(NzStr(LerCelula(SHT_ACESSO_UI, "D12")))
    End If
    If Len(mat) = 0 Then Exit Sub

    ok = ValidarEntrada(mat, msg, pode)
    If ok Then
        Call RegistrarEntrada(mat, NzStr(LerCelula(SHT_ACESSO_UI, "D14")))
        Exit Sub
    End If

    If pode And ParamPermitirLiberacaoManual() Then
        resp = MsgBox(msg & vbCrLf & vbCrLf & "Deseja liberar a entrada mesmo assim?", _
                      vbYesNo + vbExclamation, APP_TITLE)
        If resp = vbYes Then
            Call RegistrarEntrada(mat, NzStr(LerCelula(SHT_ACESSO_UI, "D14")))
            RegistrarLog "Liberacao manual inadimplente", "Acesso", mat
        End If
    Else
        MsgErro msg
        Call BloquearAluno(mat, msg)
    End If
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "LiberarEntrada"
End Sub

Public Sub RegistrarEntrada(ByVal matricula As String, Optional ByVal forma As String = "Manual")
    Dim lr As ListRow
    Dim id As Long
    Dim nome As String
    Dim cols As Variant, vals As Variant
    Dim hora As String

    On Error GoTo TrataErro
    Set lr = BuscarAlunoPorMatricula(matricula)
    If lr Is Nothing Then MsgErro "Aluno nao encontrado.": Exit Sub
    nome = NzStr(LerCampo(lr, "Nome"))
    If Len(Trim$(forma)) = 0 Then forma = "Manual"
    hora = Format$(Now, "HH:MM")
    id = MaxNumerico(SHT_ACESSOS, TBL_ACESSOS, "ID") + 1

    cols = Array("ID", "Matrícula", "Nome", "Data", "Entrada", "Saída", "Tempo Permanência", _
                 "Forma Acesso", "Responsável", "Status")
    vals = Array(id, matricula, nome, DataAtual(), hora, "", "", forma, UsuarioRecepcao(), "Liberado")
    Call AdicionarRegistro(SHT_ACESSOS, TBL_ACESSOS, cols, vals)
    Call RegistrarPresencaResumo(matricula, nome)
    Call SincronizarPresencaLegado(nome, hora)
    GravarCelula SHT_ACESSO_UI, "D22", "ENTRADA LIBERADA — " & hora
    RegistrarLog "Entrada liberada", "Acesso", matricula & " / " & hora
    Call AtualizarAcesso
    MsgOk "Entrada liberada:" & vbCrLf & nome & vbCrLf & hora
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "RegistrarEntrada"
    MsgErro "Erro ao registrar entrada."
End Sub

Private Sub RegistrarPresencaResumo(ByVal matricula As String, ByVal nome As String)
    Dim cols As Variant, vals As Variant
    On Error Resume Next
    cols = Array("Matrícula", "Nome", "Data", "Presente", "Professor", "Aula", "Unidade")
    vals = Array(matricula, nome, DataAtual(), "Sim", "", "Acesso", NomeAcademia())
    Call AdicionarRegistro(SHT_PRESENCAS_BD, TBL_PRESENCAS_BD, cols, vals)
End Sub

Private Sub SincronizarPresencaLegado(ByVal nome As String, ByVal hora As String)
    Dim cols As Variant, vals As Variant
    On Error Resume Next
    cols = Array("Aluno", "Data", "Entrada", "Saída", "Professor", "Tempo Treino (min)", "Mês", "Ano", "Check-in")
    vals = Array(nome, DataAtual(), hora, "", "", "", Month(DataAtual()), Year(DataAtual()), "OK")
    Call AdicionarRegistro("12_PRESENCA", "tblPresenca", cols, vals)
End Sub

Public Sub RegistrarSaida()
    Dim mat As String
    Dim lo As ListObject
    Dim lr As ListRow
    Dim achou As Boolean
    Dim ent As Date, sai As Date
    Dim mins As Long
    Dim tempo As String

    On Error GoTo TrataErro
    If Not ParamRegistrarSaida() Then
        MsgAviso "Registro de saida desabilitado nos parametros."
        Exit Sub
    End If
    mat = Trim$(NzStr(LerCelula(SHT_ACESSO_UI, "D12")))
    If Len(mat) = 0 Then MsgAviso "Consulte o aluno primeiro.": Exit Sub

    Set lo = ObterTabela(SHT_ACESSOS, TBL_ACESSOS)
    achou = False
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) <> 0 Then GoTo Prox
        If Not IsDate(LerCampo(lr, "Data")) Then GoTo Prox
        If CDate(LerCampo(lr, "Data")) <> DataAtual() Then GoTo Prox
        If Len(NzStr(LerCampo(lr, "Saída"))) > 0 Then GoTo Prox
        If StrComp(NzStr(LerCampo(lr, "Status")), "Liberado", vbTextCompare) <> 0 Then GoTo Prox
        Call GravarCampo(lr, "Saída", Format$(Now, "HH:MM"))
        tempo = CalcularTempoPermanencia(NzStr(LerCampo(lr, "Entrada")), Format$(Now, "HH:MM"))
        Call GravarCampo(lr, "Tempo Permanência", tempo)
        achou = True
        Exit For
Prox:
    Next lr

    If Not achou Then
        MsgAviso "Nenhuma entrada aberta hoje para este aluno."
        Exit Sub
    End If
    RegistrarLog "Saida registrada", "Acesso", mat
    Call AtualizarAcesso
    MsgOk "Saida registrada."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "RegistrarSaida"
End Sub

Public Function CalcularTempoPermanencia(ByVal entrada As String, ByVal saida As String) As String
    Dim e As Date, s As Date
    Dim mins As Long
    On Error GoTo Sai
    If Len(Trim$(entrada)) = 0 Or Len(Trim$(saida)) = 0 Then Exit Function
    e = CDate(entrada)
    s = CDate(saida)
    mins = DateDiff("n", e, s)
    If mins < 0 Then mins = mins + 24 * 60
    CalcularTempoPermanencia = Format$(mins \ 60, "00") & ":" & Format$(mins Mod 60, "00")
    Exit Function
Sai:
    CalcularTempoPermanencia = ""
End Function

Public Sub BloquearAluno(ByVal matricula As String, Optional ByVal motivo As String = "")
    Dim lr As ListRow
    Dim id As Long
    Dim nome As String
    On Error Resume Next
    Set lr = BuscarAlunoPorMatricula(matricula)
    If lr Is Nothing Then Exit Sub
    nome = NzStr(LerCampo(lr, "Nome"))
    id = MaxNumerico(SHT_ACESSOS, TBL_ACESSOS, "ID") + 1
    Call AdicionarRegistro(SHT_ACESSOS, TBL_ACESSOS, _
        Array("ID", "Matrícula", "Nome", "Data", "Entrada", "Saída", "Tempo Permanência", "Forma Acesso", "Responsável", "Status"), _
        Array(id, matricula, nome, DataAtual(), "", "", "", "Manual", UsuarioRecepcao(), "Bloqueado"))
    RegistrarLog "Acesso bloqueado", "Acesso", matricula & " / " & motivo
End Sub

Public Sub LiberarAluno()
    MsgAviso "Use Liberar Entrada apos consultar o aluno."
    Call LiberarEntrada
End Sub

Public Sub ConsultarHistorico(Optional ByVal matricula As String = "")
    Dim lo As ListObject
    Dim lr As ListRow
    Dim i As Long, n As Long
    Dim rows() As Variant
    Dim a As Long, b As Long, k As Long
    Dim tmp As Variant

    On Error Resume Next
    If Len(matricula) = 0 Then matricula = Trim$(NzStr(LerCelula(SHT_ACESSO_UI, "D12")))
    For i = 0 To 7
        GravarCelula SHT_ACESSO_UI, "H" & (13 + i), ""
        GravarCelula SHT_ACESSO_UI, "I" & (13 + i), ""
        GravarCelula SHT_ACESSO_UI, "J" & (13 + i), ""
        GravarCelula SHT_ACESSO_UI, "K" & (13 + i), ""
    Next i
    If Len(matricula) = 0 Then Exit Sub

    ReDim rows(1 To 50, 1 To 4)
    n = 0
    Set lo = ObterTabela(SHT_ACESSOS, TBL_ACESSOS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), matricula, vbTextCompare) <> 0 Then GoTo Prox
        If StrComp(NzStr(LerCampo(lr, "Status")), "Bloqueado", vbTextCompare) = 0 And Len(NzStr(LerCampo(lr, "Entrada"))) = 0 Then GoTo Prox
        n = n + 1
        rows(n, 1) = LerCampo(lr, "Data")
        rows(n, 2) = NzStr(LerCampo(lr, "Entrada"))
        rows(n, 3) = NzStr(LerCampo(lr, "Saída"))
        rows(n, 4) = NzStr(LerCampo(lr, "Status"))
Prox:
    Next lr

    For a = 1 To n - 1
        For b = a + 1 To n
            If IsDate(rows(b, 1)) And IsDate(rows(a, 1)) Then
                If CDate(rows(b, 1)) > CDate(rows(a, 1)) Then
                    For k = 1 To 4
                        tmp = rows(a, k): rows(a, k) = rows(b, k): rows(b, k) = tmp
                    Next k
                End If
            End If
        Next b
    Next a

    For i = 1 To Application.Min(8, n)
        If IsDate(rows(i, 1)) Then
            GravarCelula SHT_ACESSO_UI, "H" & (12 + i), Format$(CDate(rows(i, 1)), "DD/MM/YYYY")
        End If
        GravarCelula SHT_ACESSO_UI, "I" & (12 + i), rows(i, 2)
        GravarCelula SHT_ACESSO_UI, "J" & (12 + i), rows(i, 3)
        GravarCelula SHT_ACESSO_UI, "K" & (12 + i), rows(i, 4)
    Next i
End Sub

Public Sub AtualizarListaAcessosHoje()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim i As Long, n As Long

    On Error Resume Next
    For i = 0 To 11
        GravarCelula SHT_ACESSO_UI, "C" & (29 + i), ""
        GravarCelula SHT_ACESSO_UI, "D" & (29 + i), ""
        GravarCelula SHT_ACESSO_UI, "E" & (29 + i), ""
        GravarCelula SHT_ACESSO_UI, "F" & (29 + i), ""
        GravarCelula SHT_ACESSO_UI, "G" & (29 + i), ""
        GravarCelula SHT_ACESSO_UI, "H" & (29 + i), ""
    Next i

    n = 0
    Set lo = ObterTabela(SHT_ACESSOS, TBL_ACESSOS)
    For Each lr In lo.ListRows
        If Not IsDate(LerCampo(lr, "Data")) Then GoTo Prox
        If CDate(LerCampo(lr, "Data")) <> DataAtual() Then GoTo Prox
        If Len(NzStr(LerCampo(lr, "Entrada"))) = 0 And StrComp(NzStr(LerCampo(lr, "Status")), "Bloqueado", vbTextCompare) <> 0 Then GoTo Prox
        n = n + 1
        If n > 12 Then Exit For
        GravarCelula SHT_ACESSO_UI, "C" & (28 + n), LerCampo(lr, "ID")
        GravarCelula SHT_ACESSO_UI, "D" & (28 + n), NzStr(LerCampo(lr, "Entrada"))
        GravarCelula SHT_ACESSO_UI, "E" & (28 + n), NzStr(LerCampo(lr, "Nome"))
        GravarCelula SHT_ACESSO_UI, "F" & (28 + n), NzStr(LerCampo(lr, "Forma Acesso"))
        GravarCelula SHT_ACESSO_UI, "G" & (28 + n), NzStr(LerCampo(lr, "Status"))
        GravarCelula SHT_ACESSO_UI, "H" & (28 + n), NzStr(LerCampo(lr, "Saída"))
Prox:
    Next lr
End Sub

Public Sub IdentificarAlunosAusentes()
    Dim loA As ListObject, loX As ListObject
    Dim lr As ListRow, lrX As ListRow
    Dim mat As String, nome As String
    Dim ultima As Date, dias As Long, limite As Long
    Dim motivo As String

    On Error Resume Next
    limite = DiasAusenciaRisco()
    Set loA = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    Set loX = ObterTabela(SHT_ACESSOS, TBL_ACESSOS)

    For Each lr In loA.ListRows
        nome = NzStr(LerCampo(lr, "Nome"))
        mat = NzStr(LerCampo(lr, "Matrícula"))
        If Len(nome) = 0 Then GoTo ProxA
        If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) <> 0 Then GoTo ProxA

        ultima = DateSerial(1900, 1, 1)
        For Each lrX In loX.ListRows
            If StrComp(NzStr(LerCampo(lrX, "Matrícula")), mat, vbTextCompare) = 0 Then
                If Len(NzStr(LerCampo(lrX, "Entrada"))) > 0 And IsDate(LerCampo(lrX, "Data")) Then
                    If CDate(LerCampo(lrX, "Data")) > ultima Then ultima = CDate(LerCampo(lrX, "Data"))
                End If
            End If
        Next lrX

        If ultima <= DateSerial(1900, 1, 1) Then
            If IsDate(LerCampo(lr, "DataCadastro")) Then
                dias = DateDiff("d", CDate(LerCampo(lr, "DataCadastro")), DataAtual())
            Else
                dias = limite + 1
            End If
        Else
            dias = DateDiff("d", ultima, DataAtual())
        End If

        If dias >= limite Then
            motivo = "Sem acesso ha " & dias & " dias"
            Call AlimentarCRMAusencia(mat, nome, motivo)
        End If
ProxA:
    Next lr
End Sub

Private Sub AlimentarCRMAusencia(ByVal mat As String, ByVal nome As String, ByVal motivo As String)
    Dim lo As ListObject
    Dim lr As ListRow
    Dim tem As Boolean
    On Error Resume Next
    tem = False
    Set lo = ObterTabela("BD_RETENCAO", "tbRetencao")
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) = 0 Then
            If StrComp(NzStr(LerCampo(lr, "Status")), "Resolvido", vbTextCompare) <> 0 Then
                Call GravarCampo(lr, "Motivo", motivo)
                Call GravarCampo(lr, "Data", DataAtual())
                Call GravarCampo(lr, "Status", "Em risco")
                tem = True
                Exit For
            End If
        End If
    Next lr
    If Not tem Then
        Call AdicionarRegistro("BD_RETENCAO", "tbRetencao", _
            Array("Matrícula", "Nome", "Motivo", "Data", "Responsável", "Status"), _
            Array(mat, nome, motivo, DataAtual(), UsuarioRecepcao(), "Em risco"))
        Call CriarEvento("Marketing", "Ligar — ausencia: " & nome, mat, DataAtual(), "10:00", _
                         UsuarioRecepcao(), "Alta", "Comercial", motivo, "Acesso")
    End If
End Sub

Public Sub AtualizarPainelAusentes()
    Dim loA As ListObject, loX As ListObject
    Dim lr As ListRow, lrX As ListRow
    Dim mat As String, nome As String
    Dim ultima As Date, dias As Long, limite As Long
    Dim n As Long, i As Long

    On Error Resume Next
    For i = 0 To 7
        GravarCelula SHT_ACESSO_UI, "C" & (44 + i), ""
        GravarCelula SHT_ACESSO_UI, "D" & (44 + i), ""
        GravarCelula SHT_ACESSO_UI, "E" & (44 + i), ""
        GravarCelula SHT_ACESSO_UI, "F" & (44 + i), ""
    Next i

    limite = DiasAusenciaRisco()
    n = 0
    Set loA = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    Set loX = ObterTabela(SHT_ACESSOS, TBL_ACESSOS)
    For Each lr In loA.ListRows
        nome = NzStr(LerCampo(lr, "Nome"))
        mat = NzStr(LerCampo(lr, "Matrícula"))
        If Len(nome) = 0 Then GoTo Prox
        If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) <> 0 Then GoTo Prox
        ultima = DateSerial(1900, 1, 1)
        For Each lrX In loX.ListRows
            If StrComp(NzStr(LerCampo(lrX, "Matrícula")), mat, vbTextCompare) = 0 Then
                If Len(NzStr(LerCampo(lrX, "Entrada"))) > 0 And IsDate(LerCampo(lrX, "Data")) Then
                    If CDate(LerCampo(lrX, "Data")) > ultima Then ultima = CDate(LerCampo(lrX, "Data"))
                End If
            End If
        Next lrX
        If ultima <= DateSerial(1900, 1, 1) Then
            dias = limite + 1
        Else
            dias = DateDiff("d", ultima, DataAtual())
        End If
        If dias >= limite Then
            n = n + 1
            If n > 8 Then Exit For
            GravarCelula SHT_ACESSO_UI, "C" & (43 + n), mat
            GravarCelula SHT_ACESSO_UI, "D" & (43 + n), nome
            GravarCelula SHT_ACESSO_UI, "E" & (43 + n), dias
            GravarCelula SHT_ACESSO_UI, "F" & (43 + n), "Sem acesso"
        End If
Prox:
    Next lr
    GravarCelula SHT_ACESSO_UI, "I8", n
End Sub

Public Sub AtualizarDashboardAcesso()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim hojeN As Long, bloqueios As Long, dentro As Long
    Dim horas(0 To 23) As Long
    Dim h As Long, maxH As Long, pico As String
    Dim i As Long, j As Long
    Dim nomes() As String, qtds() As Long, nNom As Long
    Dim found As Boolean
    Dim mes As Long, ano As Long
    Dim tmpS As String, tmpL As Long
    Dim totalDias As Long, media As Double
    Dim datas As String

    On Error Resume Next
    mes = Month(DataAtual())
    ano = Year(DataAtual())
    hojeN = 0: bloqueios = 0: dentro = 0: nNom = 0: maxH = 0: totalDias = 0
    ReDim nomes(1 To 200)
    ReDim qtds(1 To 200)
    datas = "|"

    Set lo = ObterTabela(SHT_ACESSOS, TBL_ACESSOS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Status")), "Bloqueado", vbTextCompare) = 0 Then
            If IsDate(LerCampo(lr, "Data")) Then
                If CDate(LerCampo(lr, "Data")) = DataAtual() Then bloqueios = bloqueios + 1
            End If
        End If
        If Len(NzStr(LerCampo(lr, "Entrada"))) = 0 Then GoTo Prox
        If Not IsDate(LerCampo(lr, "Data")) Then GoTo Prox

        If InStr(datas, "|" & Format$(CDate(LerCampo(lr, "Data")), "yyyymmdd") & "|") = 0 Then
            datas = datas & Format$(CDate(LerCampo(lr, "Data")), "yyyymmdd") & "|"
            totalDias = totalDias + 1
        End If

        If CDate(LerCampo(lr, "Data")) = DataAtual() Then
            hojeN = hojeN + 1
            If Len(NzStr(LerCampo(lr, "Saída"))) = 0 Then dentro = dentro + 1
            h = Hour(CDate(LerCampo(lr, "Entrada")))
            If h >= 0 And h <= 23 Then horas(h) = horas(h) + 1
        End If

        If Month(CDate(LerCampo(lr, "Data"))) = mes And Year(CDate(LerCampo(lr, "Data"))) = ano Then
            found = False
            For i = 1 To nNom
                If StrComp(nomes(i), NzStr(LerCampo(lr, "Nome")), vbTextCompare) = 0 Then
                    qtds(i) = qtds(i) + 1
                    found = True
                    Exit For
                End If
            Next i
            If Not found Then
                nNom = nNom + 1
                nomes(nNom) = NzStr(LerCampo(lr, "Nome"))
                qtds(nNom) = 1
            End If
        End If
Prox:
    Next lr

    For h = 0 To 23
        If horas(h) > maxH Then
            maxH = horas(h)
            pico = Format$(h, "00") & "h"
        End If
    Next h
    If Len(pico) = 0 Then pico = "—"
    If totalDias > 0 Then media = Round(ContarEntradasTotais() / totalDias, 0) Else media = hojeN

    GravarCelula SHT_ACESSO_UI, "C8", hojeN
    GravarCelula SHT_ACESSO_UI, "E8", dentro
    GravarCelula SHT_ACESSO_UI, "G8", bloqueios

    GravarCelula SHT_DASH_FREQ, "C8", hojeN
    GravarCelula SHT_DASH_FREQ, "E8", media
    GravarCelula SHT_DASH_FREQ, "G8", pico
    GravarCelula SHT_DASH_FREQ, "I8", bloqueios
    GravarCelula SHT_DASH_FREQ, "D31", dentro
    GravarCelula SHT_DASH_FREQ, "D32", CLng(Val(LerCelula(SHT_ACESSO_UI, "I8")))
    GravarCelula SHT_DASH_FREQ, "D33", ContarAusentesDias(30)

    ' Horarios 06h-21h -> rows 13-28
    For i = 0 To 15
        h = 6 + i
        GravarCelula SHT_DASH_FREQ, "C" & (13 + i), Format$(h, "00") & "h"
        GravarCelula SHT_DASH_FREQ, "D" & (13 + i), horas(h)
        If maxH > 0 Then
            GravarCelula SHT_DASH_FREQ, "E" & (13 + i), String$(Application.Min(20, Round(horas(h) / maxH * 20)), ChrW(&H2588))
        Else
            GravarCelula SHT_DASH_FREQ, "E" & (13 + i), ""
        End If
    Next i

    ' Ranking bubble
    For i = 1 To nNom - 1
        For j = i + 1 To nNom
            If qtds(j) > qtds(i) Then
                tmpL = qtds(i): qtds(i) = qtds(j): qtds(j) = tmpL
                tmpS = nomes(i): nomes(i) = nomes(j): nomes(j) = tmpS
            End If
        Next j
    Next i
    For i = 0 To 9
        GravarCelula SHT_DASH_FREQ, "G" & (13 + i), ""
        GravarCelula SHT_DASH_FREQ, "H" & (13 + i), ""
        GravarCelula SHT_DASH_FREQ, "I" & (13 + i), ""
        GravarCelula SHT_DASH_FREQ, "J" & (13 + i), ""
    Next i
    maxH = 1
    If nNom >= 1 Then maxH = Application.Max(1, qtds(1))
    For i = 1 To Application.Min(10, nNom)
        GravarCelula SHT_DASH_FREQ, "G" & (12 + i), i
        GravarCelula SHT_DASH_FREQ, "H" & (12 + i), nomes(i)
        GravarCelula SHT_DASH_FREQ, "I" & (12 + i), qtds(i)
        GravarCelula SHT_DASH_FREQ, "J" & (12 + i), String$(Application.Min(20, Round(qtds(i) / maxH * 20)), ChrW(&H2588))
    Next i

    ' Faixas
    GravarCelula SHT_DASH_FREQ, "G32", "06h-08h"
    GravarCelula SHT_DASH_FREQ, "H32", horas(6) + horas(7)
    GravarCelula SHT_DASH_FREQ, "G33", "12h-14h"
    GravarCelula SHT_DASH_FREQ, "H33", horas(12) + horas(13)
    GravarCelula SHT_DASH_FREQ, "G34", "18h-20h"
    GravarCelula SHT_DASH_FREQ, "H34", horas(18) + horas(19)

    On Error Resume Next
    GravarCelula "BI_BASE", "E35", hojeN
    GravarCelula "BI_BASE", "E36", bloqueios
End Sub

Private Function ContarEntradasTotais() As Long
    Dim lo As ListObject
    Dim lr As ListRow
    Dim n As Long
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_ACESSOS, TBL_ACESSOS)
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Entrada"))) > 0 Then n = n + 1
    Next lr
Sai:
    ContarEntradasTotais = n
End Function

Private Function ContarAusentesDias(ByVal limite As Long) As Long
    Dim loA As ListObject, loX As ListObject
    Dim lr As ListRow, lrX As ListRow
    Dim mat As String, ultima As Date, dias As Long, n As Long
    On Error GoTo Sai
    Set loA = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    Set loX = ObterTabela(SHT_ACESSOS, TBL_ACESSOS)
    For Each lr In loA.ListRows
        If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) <> 0 Then GoTo Prox
        mat = NzStr(LerCampo(lr, "Matrícula"))
        If Len(mat) = 0 Then GoTo Prox
        ultima = DateSerial(1900, 1, 1)
        For Each lrX In loX.ListRows
            If StrComp(NzStr(LerCampo(lrX, "Matrícula")), mat, vbTextCompare) = 0 Then
                If Len(NzStr(LerCampo(lrX, "Entrada"))) > 0 And IsDate(LerCampo(lrX, "Data")) Then
                    If CDate(LerCampo(lrX, "Data")) > ultima Then ultima = CDate(LerCampo(lrX, "Data"))
                End If
            End If
        Next lrX
        If ultima <= DateSerial(1900, 1, 1) Then
            dias = limite + 1
        Else
            dias = DateDiff("d", ultima, DataAtual())
        End If
        If dias >= limite Then n = n + 1
Prox:
    Next lr
Sai:
    ContarAusentesDias = n
End Function

Public Sub AtualizarAcessoAposPagamento(ByVal matricula As String)
    On Error Resume Next
    RegistrarLog "Acesso liberavel apos pagamento", "Acesso", matricula
    Call AtualizarAcesso
End Sub
