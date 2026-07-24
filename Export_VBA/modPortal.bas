Attribute VB_Name = "modPortal"
Option Explicit

'============================================================
' Sprint 11.0 — Portal Aluno / Professor / Ops + sync cloud
'============================================================

Public Const SHT_PORTAL_ALUNO As String = "33_PORTAL_ALUNO"
Public Const SHT_PORTAL_PROF As String = "34_PORTAL_PROF"
Public Const SHT_PORTAL_OPS As String = "35_PORTAL_OPS"
Public Const SHT_CHAT As String = "BD_CHAT"
Public Const TBL_CHAT As String = "tbChat"
Public Const SHT_METAS_ALUNO As String = "BD_METAS_ALUNO"
Public Const TBL_METAS_ALUNO As String = "tbMetasAluno"
Public Const SHT_TOKENS As String = "BD_PORTAL_TOKENS"
Public Const TBL_TOKENS As String = "tbPortalTokens"
Public Const SHT_DESAFIOS As String = "BD_DESAFIOS"
Public Const TBL_DESAFIOS As String = "tbDesafios"
Public Const SHT_PUSH As String = "BD_PUSH"
Public Const TBL_PUSH As String = "tbPush"

Public Sub IrPortalAluno(): NavegarPara SHT_PORTAL_ALUNO: End Sub
Public Sub IrPortalProfessor(): NavegarPara SHT_PORTAL_PROF: End Sub
Public Sub IrPortalOps(): NavegarPara SHT_PORTAL_OPS: End Sub

Public Sub AtualizarPortal()
    On Error GoTo TrataErro
    Call AtualizarPortalAluno
    Call AtualizarPortalProfessor
    Call AtualizarPortalOps
    Application.Calculate
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarPortal"
End Sub

Public Sub AbrirPortalAlunoEAtualizar()
    Call AtualizarPortalAluno
    NavegarPara SHT_PORTAL_ALUNO
End Sub

Private Function MatriculaPortal() As String
    Dim m As String
    m = Trim$(NzStr(LerCelula(SHT_PORTAL_ALUNO, "D8")))
    If Len(m) = 0 Then m = ObterParametro("Portal", "MatriculaDemo", "ATH-" & Year(DataAtual()) & "-000001")
    MatriculaPortal = m
End Function

Public Sub LoginPortalAluno()
    Dim mat As String, lr As ListRow
    On Error GoTo TrataErro
    mat = Trim$(InputBox("Matrícula do aluno:", "Portal Aluno", MatriculaPortal()))
    If Len(mat) = 0 Then Exit Sub
    Set lr = PesquisarRegistro(SHT_ALUNOS, TBL_ALUNOS, "Matrícula", mat, False)
    If lr Is Nothing Then MsgAviso "Aluno não encontrado.": Exit Sub
    GravarCelula SHT_PORTAL_ALUNO, "D8", mat
    GravarCelula SHT_PORTAL_ALUNO, "D9", NzStr(LerCampo(lr, "Nome"))
    Call GerarTokenPortal("aluno", "Aluno", mat)
    Call AtualizarPortalAluno
    RegistrarLog "Login portal aluno", "Portal", mat
    MsgOk "Portal carregado para " & NzStr(LerCampo(lr, "Nome"))
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "LoginPortalAluno"
End Sub

Public Sub LogoutPortal()
    On Error Resume Next
    Call LimparIntervalo(SHT_PORTAL_ALUNO, "D9:D10")
    Call LimparIntervalo(SHT_PORTAL_ALUNO, "C19:F26")
    Call LimparIntervalo(SHT_PORTAL_ALUNO, "I18:I21")
    MsgOk "Sessão do portal limpa (demo Excel)."
End Sub

Public Function GerarTokenPortal(ByVal usuario As String, ByVal perfil As String, _
                                 Optional ByVal matricula As String = "") As String
    Dim token As String, lr As ListRow
    Dim cols As Variant, vals As Variant
    On Error Resume Next
    token = "tok-" & LCase$(usuario) & "-" & Format$(Now, "yyyymmddhhnnss")
    Set lr = PesquisarRegistro(SHT_TOKENS, TBL_TOKENS, "Usuário", usuario, False)
    If lr Is Nothing Then
        cols = Array("Usuário", "Token", "Perfil", "Matrícula", "Expira", "Dispositivo")
        vals = Array(usuario, token, perfil, matricula, DataAtual() + 30, "Excel")
        Call AdicionarRegistro(SHT_TOKENS, TBL_TOKENS, cols, vals)
    Else
        Call GravarCampo(lr, "Token", token)
        Call GravarCampo(lr, "Perfil", perfil)
        Call GravarCampo(lr, "Matrícula", matricula)
        Call GravarCampo(lr, "Expira", DataAtual() + 30)
    End If
    ' Espelha em BD_USUARIOS se coluna Token existir
    Set lr = PesquisarRegistro(SHT_USUARIOS, TBL_USUARIOS, "Usuário", usuario, False)
    If Not lr Is Nothing Then
        On Error Resume Next
        Call GravarCampo(lr, "Token", token)
        Call GravarCampo(lr, "Matrícula", matricula)
        On Error GoTo 0
    End If
    GerarTokenPortal = token
End Function

Public Sub EnviarNotificacao(ByVal usuario As String, ByVal matricula As String, _
                             ByVal mensagem As String, Optional ByVal tipo As String = "Geral")
    Dim id As Long
    Dim cols As Variant, vals As Variant
    On Error Resume Next
    id = MaxNumerico(SHT_PUSH, TBL_PUSH, "ID") + 1
    cols = Array("ID", "Usuário", "Matrícula", "Mensagem", "Data", "Hora", "Lida", "Tipo")
    vals = Array(id, usuario, matricula, mensagem, DataAtual(), Format$(Now, "hh:nn"), "NÃO", tipo)
    Call AdicionarRegistro(SHT_PUSH, TBL_PUSH, cols, vals)
    On Error Resume Next
    Call AdicionarNotificacao(tipo, "📱", mensagem, SHT_PORTAL_ALUNO)
    On Error GoTo 0
End Sub

Public Sub EnviarMensagem()
    Dim deUsr As String, paraUsr As String, mat As String, msg As String
    Dim id As Long, cols As Variant, vals As Variant
    On Error GoTo TrataErro
    mat = Trim$(NzStr(LerCelula(SHT_PORTAL_PROF, "D13")))
    If Len(mat) = 0 Then mat = MatriculaPortal()
    msg = Trim$(NzStr(LerCelula(SHT_PORTAL_PROF, "D34")))
    If Len(msg) = 0 Then
        msg = Trim$(InputBox("Mensagem para o aluno:", "Chat"))
        If Len(msg) = 0 Then Exit Sub
    End If
    deUsr = "professor"
    paraUsr = "aluno"
    id = MaxNumerico(SHT_CHAT, TBL_CHAT, "ID") + 1
    cols = Array("ID", "De", "Para", "Matrícula", "Mensagem", "Data", "Hora", "Lida")
    vals = Array(id, deUsr, paraUsr, mat, msg, DataAtual(), Format$(Now, "hh:nn"), "NÃO")
    Call AdicionarRegistro(SHT_CHAT, TBL_CHAT, cols, vals)
    Call EnviarNotificacao("aluno", mat, "Nova mensagem do professor: " & Left$(msg, 60), "Chat")
    GravarCelula SHT_PORTAL_PROF, "D34", ""
    Call AtualizarChatUI(mat)
    RegistrarLog "Chat professor→aluno", "Portal", mat
    MsgOk "Mensagem enviada."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "EnviarMensagem"
End Sub

Public Sub ReceberMensagemAluno()
    Dim mat As String, msg As String, id As Long
    Dim cols As Variant, vals As Variant
    On Error GoTo TrataErro
    mat = MatriculaPortal()
    msg = Trim$(InputBox("Sua mensagem para o professor:", "Chat Aluno"))
    If Len(msg) = 0 Then Exit Sub
    id = MaxNumerico(SHT_CHAT, TBL_CHAT, "ID") + 1
    cols = Array("ID", "De", "Para", "Matrícula", "Mensagem", "Data", "Hora", "Lida")
    vals = Array(id, "aluno", "professor", mat, msg, DataAtual(), Format$(Now, "hh:nn"), "NÃO")
    Call AdicionarRegistro(SHT_CHAT, TBL_CHAT, cols, vals)
    Call AtualizarChatAlunoUI(mat)
    MsgOk "Mensagem enviada ao professor."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "ReceberMensagemAluno"
End Sub

Public Sub NotificarTreinoAtualizado(ByVal matricula As String, ByVal nomeAluno As String)
    On Error Resume Next
    If Len(Trim$(matricula)) = 0 Then Exit Sub
    Call EnviarNotificacao("aluno", matricula, _
        "Treino atualizado para " & nomeAluno & ". Abra o app para ver a ficha.", "Treino")
End Sub

Public Sub AtualizarPerfilPortal()
    Call AtualizarPortalAluno
    MsgOk "Perfil do portal atualizado."
End Sub

Public Sub AtualizarPortalAluno()
    Dim mat As String, lr As ListRow
    Dim emDia As Boolean
    On Error GoTo TrataErro
    mat = MatriculaPortal()
    Set lr = PesquisarRegistro(SHT_ALUNOS, TBL_ALUNOS, "Matrícula", mat, False)
    If lr Is Nothing Then Exit Sub
    GravarCelula SHT_PORTAL_ALUNO, "D8", mat
    GravarCelula SHT_PORTAL_ALUNO, "D9", NzStr(LerCampo(lr, "Nome"))
    GravarCelula SHT_PORTAL_ALUNO, "C13", NzStr(LerCampo(lr, "Plano"))
    GravarCelula SHT_PORTAL_ALUNO, "E13", NzStr(LerCampo(lr, "Professor"))
    emDia = Not AlunoAtrasadoPortal(mat)
    GravarCelula SHT_PORTAL_ALUNO, "G13", IIf(emDia, "Em dia", "Em aberto")
    GravarCelula SHT_PORTAL_ALUNO, "I13", Format$(DataAtual(), "DD/MM")
    Call PreencherTreinoPortal(mat)
    Call PreencherEvolucaoPortal(mat)
    Call PreencherAcessosPortal(mat)
    Call PreencherFinanceiroPortal(mat)
    Call PreencherMetasDesafiosPortal(mat)
    Call PreencherPushPortal(mat)
    Call AtualizarChatAlunoUI(mat)
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarPortalAluno"
End Sub

Private Function AlunoAtrasadoPortal(ByVal mat As String) As Boolean
    Dim lo As ListObject, lr As ListRow
    On Error Resume Next
    Set lo = ObterTabela(SHT_RECEBER_BD, TBL_RECEBER_BD)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) = 0 Then
            If StrComp(NzStr(LerCampo(lr, "Situação")), "Atrasado", vbTextCompare) = 0 Then
                AlunoAtrasadoPortal = True
                Exit Function
            End If
        End If
    Next lr
    AlunoAtrasadoPortal = False
End Function

Private Sub PreencherTreinoPortal(ByVal mat As String)
    Dim lo As ListObject, lr As ListRow, loI As ListObject, item As ListRow
    Dim treinoId As Long, r As Long
    On Error Resume Next
    Call LimparIntervalo(SHT_PORTAL_ALUNO, "C19:F26")
    If Not TabelaExiste("BD_TREINOS", "tbTreinos") Then Exit Sub
    Set lo = ObterTabela("BD_TREINOS", "tbTreinos")
    treinoId = 0
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) = 0 Then
            If UCase$(NzStr(LerCampo(lr, "Status"))) = "ATIVO" Or Len(NzStr(LerCampo(lr, "Status"))) = 0 Then
                treinoId = CLng(Val(LerCampo(lr, "ID")))
                Exit For
            End If
        End If
    Next lr
    If treinoId <= 0 Then Exit Sub
    Set loI = ObterTabela("BD_TREINO_ITENS", "tbTreinoItens")
    r = 19
    For Each item In loI.ListRows
        If r > 26 Then Exit For
        If CLng(Val(LerCampo(item, "TreinoID"))) = treinoId Then
            GravarCelula SHT_PORTAL_ALUNO, "C" & r, NzStr(LerCampo(item, "Dia"))
            GravarCelula SHT_PORTAL_ALUNO, "D" & r, NzStr(LerCampo(item, "Exercício"))
            GravarCelula SHT_PORTAL_ALUNO, "E" & r, LerCampo(item, "Séries")
            GravarCelula SHT_PORTAL_ALUNO, "F" & r, LerCampo(item, "Repetições")
            r = r + 1
        End If
    Next item
End Sub

Private Sub PreencherEvolucaoPortal(ByVal mat As String)
    Dim lo As ListObject, lr As ListRow
    Dim peso As Variant, imc As Variant, gord As Variant
    On Error Resume Next
    If TabelaExiste("BD_AVALIACOES", "tbAvaliacoes") Then
        Set lo = ObterTabela("BD_AVALIACOES", "tbAvaliacoes")
        For Each lr In lo.ListRows
            If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) = 0 Then
                peso = LerCampo(lr, "Peso")
                imc = LerCampo(lr, "IMC")
                gord = LerCampo(lr, "% Gordura")
                If IsEmpty(gord) Then gord = LerCampo(lr, "Gordura")
            End If
        Next lr
    End If
    GravarCelula SHT_PORTAL_ALUNO, "I18", peso
    GravarCelula SHT_PORTAL_ALUNO, "I19", imc
    GravarCelula SHT_PORTAL_ALUNO, "I20", gord
    GravarCelula SHT_PORTAL_ALUNO, "I21", CLng(ObterParametroNumero("Treinos", "DiasReavaliacao", 60)) & " dias"
End Sub

Private Sub PreencherAcessosPortal(ByVal mat As String)
    Dim lo As ListObject, lr As ListRow
    Dim rows() As Variant, n As Long, i As Long, r As Long
    On Error Resume Next
    Call LimparIntervalo(SHT_PORTAL_ALUNO, "C30:E35")
    If Not TabelaExiste("BD_ACESSOS", "tbAcessos") Then Exit Sub
    Set lo = ObterTabela("BD_ACESSOS", "tbAcessos")
    r = 30
    For i = lo.ListRows.Count To 1 Step -1
        If r > 35 Then Exit For
        Set lr = lo.ListRows(i)
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) <> 0 Then GoTo Prox
        If IsDate(LerCampo(lr, "Data")) Then
            GravarCelula SHT_PORTAL_ALUNO, "C" & r, Format$(CDate(LerCampo(lr, "Data")), "DD/MM")
        End If
        GravarCelula SHT_PORTAL_ALUNO, "D" & r, NzStr(LerCampo(lr, "Entrada"))
        GravarCelula SHT_PORTAL_ALUNO, "E" & r, NzStr(LerCampo(lr, "Saída"))
        r = r + 1
Prox:
    Next i
End Sub

Private Sub PreencherFinanceiroPortal(ByVal mat As String)
    Dim lo As ListObject, lr As ListRow
    Dim achou As Boolean
    On Error Resume Next
    Set lo = ObterTabela(SHT_RECEBER_BD, TBL_RECEBER_BD)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) = 0 Then
            If StrComp(NzStr(LerCampo(lr, "Situação")), "Pago", vbTextCompare) <> 0 Then
                GravarCelula SHT_PORTAL_ALUNO, "I29", NzStr(LerCampo(lr, "Competência"))
                GravarCelula SHT_PORTAL_ALUNO, "I30", "R$ " & Format$(Val(LerCampo(lr, "Valor Final")), "#,##0.00")
                If IsDate(LerCampo(lr, "Data Vencimento")) Then
                    GravarCelula SHT_PORTAL_ALUNO, "I31", Format$(CDate(LerCampo(lr, "Data Vencimento")), "DD/MM/YYYY")
                End If
                GravarCelula SHT_PORTAL_ALUNO, "I32", NzStr(LerCampo(lr, "Situação"))
                GravarCelula SHT_PORTAL_ALUNO, "I33", "PIX — use o app / portal web"
                achou = True
                Exit For
            End If
        End If
    Next lr
    If Not achou Then
        GravarCelula SHT_PORTAL_ALUNO, "I29", "—"
        GravarCelula SHT_PORTAL_ALUNO, "I30", "—"
        GravarCelula SHT_PORTAL_ALUNO, "I32", "Em dia"
        GravarCelula SHT_PORTAL_ALUNO, "I33", "—"
    End If
End Sub

Private Sub PreencherMetasDesafiosPortal(ByVal mat As String)
    Dim lo As ListObject, lr As ListRow
    Dim r As Long, prog As Double, barra As String
    On Error Resume Next
    Call LimparIntervalo(SHT_PORTAL_ALUNO, "C39:F43")
    r = 39
    Set lo = ObterTabela(SHT_METAS_ALUNO, TBL_METAS_ALUNO)
    For Each lr In lo.ListRows
        If r > 43 Then Exit For
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) <> 0 Then GoTo ProxM
        prog = Val(LerCampo(lr, "Progresso"))
        If prog = 0 And Val(LerCampo(lr, "Meta")) > 0 Then
            prog = Val(LerCampo(lr, "Atual")) / Val(LerCampo(lr, "Meta"))
        End If
        barra = String$(Application.Min(10, CLng(prog * 10)), ChrW(&H2588))
        GravarCelula SHT_PORTAL_ALUNO, "C" & r, NzStr(LerCampo(lr, "Objetivo"))
        GravarCelula SHT_PORTAL_ALUNO, "D" & r, LerCampo(lr, "Meta")
        GravarCelula SHT_PORTAL_ALUNO, "E" & r, LerCampo(lr, "Atual")
        GravarCelula SHT_PORTAL_ALUNO, "F" & r, barra & " " & Format$(prog * 100, "0") & "%"
        r = r + 1
ProxM:
    Next lr
    Set lo = ObterTabela(SHT_DESAFIOS, TBL_DESAFIOS)
    For Each lr In lo.ListRows
        If r > 43 Then Exit For
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) <> 0 Then GoTo ProxD
        prog = Val(LerCampo(lr, "Progresso"))
        barra = String$(Application.Min(10, CLng(prog * 10)), ChrW(&H2588))
        GravarCelula SHT_PORTAL_ALUNO, "C" & r, NzStr(LerCampo(lr, "Desafio"))
        GravarCelula SHT_PORTAL_ALUNO, "D" & r, LerCampo(lr, "Meta")
        GravarCelula SHT_PORTAL_ALUNO, "E" & r, LerCampo(lr, "Atual")
        GravarCelula SHT_PORTAL_ALUNO, "F" & r, barra
        r = r + 1
ProxD:
    Next lr
End Sub

Private Sub PreencherPushPortal(ByVal mat As String)
    Dim lo As ListObject, lr As ListRow
    Dim r As Long
    On Error Resume Next
    Call LimparIntervalo(SHT_PORTAL_ALUNO, "H38:K43")
    Set lo = ObterTabela(SHT_PUSH, TBL_PUSH)
    r = 38
    For Each lr In lo.ListRows
        If r > 43 Then Exit For
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) <> 0 Then GoTo Prox
        GravarCelula SHT_PORTAL_ALUNO, "H" & r, NzStr(LerCampo(lr, "Mensagem"))
        r = r + 1
Prox:
    Next lr
End Sub

Private Sub AtualizarChatAlunoUI(ByVal mat As String)
    Dim lo As ListObject, lr As ListRow
    Dim r As Long, linha As String
    On Error Resume Next
    Call LimparIntervalo(SHT_PORTAL_ALUNO, "C47:K51")
    Set lo = ObterTabela(SHT_CHAT, TBL_CHAT)
    r = 47
    For Each lr In lo.ListRows
        If r > 51 Then Exit For
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) <> 0 Then GoTo Prox
        linha = Format$(LerCampo(lr, "Hora"), "") & " [" & NzStr(LerCampo(lr, "De")) & "] " & NzStr(LerCampo(lr, "Mensagem"))
        GravarCelula SHT_PORTAL_ALUNO, "C" & r, linha
        r = r + 1
Prox:
    Next lr
End Sub

Private Sub AtualizarChatUI(ByVal mat As String)
    Dim lo As ListObject, lr As ListRow
    Dim r As Long, linha As String
    On Error Resume Next
    Call LimparIntervalo(SHT_PORTAL_PROF, "C25:K32")
    Set lo = ObterTabela(SHT_CHAT, TBL_CHAT)
    r = 25
    For Each lr In lo.ListRows
        If r > 32 Then Exit For
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), mat, vbTextCompare) <> 0 Then GoTo Prox
        linha = NzStr(LerCampo(lr, "Hora")) & " [" & NzStr(LerCampo(lr, "De")) & "] " & NzStr(LerCampo(lr, "Mensagem"))
        GravarCelula SHT_PORTAL_PROF, "C" & r, linha
        r = r + 1
Prox:
    Next lr
End Sub

Public Sub AtualizarPortalProfessor()
    Dim mat As String, lr As ListRow
    Dim nAval As Long, nTreino As Long, nAlunos As Long
    Dim lo As ListObject
    On Error Resume Next
    mat = Trim$(NzStr(LerCelula(SHT_PORTAL_PROF, "D13")))
    If Len(mat) = 0 Then mat = MatriculaPortal(): GravarCelula SHT_PORTAL_PROF, "D13", mat
    Set lr = PesquisarRegistro(SHT_ALUNOS, TBL_ALUNOS, "Matrícula", mat, False)
    If Not lr Is Nothing Then
        GravarCelula SHT_PORTAL_PROF, "D14", NzStr(LerCampo(lr, "Nome"))
        GravarCelula SHT_PORTAL_PROF, "D16", NzStr(LerCampo(lr, "Plano"))
    End If
    If TabelaExiste("BD_AVALIACOES", "tbAvaliacoes") Then
        Set lo = ObterTabela("BD_AVALIACOES", "tbAvaliacoes")
        nAval = lo.ListRows.Count
    End If
    If TabelaExiste("BD_TREINOS", "tbTreinos") Then
        Set lo = ObterTabela("BD_TREINOS", "tbTreinos")
        nTreino = lo.ListRows.Count
    End If
    nAlunos = ContarAlunosAtivos()
    GravarCelula SHT_PORTAL_PROF, "C8", Application.Min(8, nAval)
    GravarCelula SHT_PORTAL_PROF, "E8", nTreino
    GravarCelula SHT_PORTAL_PROF, "G8", nAlunos
    GravarCelula SHT_PORTAL_PROF, "I8", Application.Min(5, nAval)
    Call AtualizarChatUI(mat)
End Sub

Public Sub AtualizarPortalOps()
    Dim rec As Double, lucro As Double
    Dim nUni As Long, lo As ListObject, lr As ListRow
    On Error Resume Next
    rec = ReceitaMesUnidade(UnidadeIDSessao(), Month(DataAtual()), Year(DataAtual()))
    lucro = rec - SomaDebitosMes(Month(DataAtual()), Year(DataAtual()))
    GravarCelula SHT_PORTAL_OPS, "C9", ContarOndeUnidade(SHT_ALUNOS, TBL_ALUNOS, "Status", "Ativo")
    GravarCelula SHT_PORTAL_OPS, "E9", ContarOndeUnidade(SHT_RECEBER_BD, TBL_RECEBER_BD, "Situação", "Pago")
    nUni = 0
    Set lo = ObterTabela(SHT_UNIDADES, TBL_UNIDADES)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Status")), "Ativa", vbTextCompare) = 0 Then
            If PertenceEmpresa(lr) Or EhSuperAdmin() Then nUni = nUni + 1
        End If
    Next lr
    GravarCelula SHT_PORTAL_OPS, "G9", nUni
    GravarCelula SHT_PORTAL_OPS, "I9", ContarOndeUnidade(SHT_ALUNOS, TBL_ALUNOS, "Status", "Ativo")
    GravarCelula SHT_PORTAL_OPS, "C15", "R$ " & Format$(rec, "#,##0.00")
    GravarCelula SHT_PORTAL_OPS, "E15", "R$ " & Format$(lucro, "#,##0.00")
    GravarCelula SHT_PORTAL_OPS, "G15", Format$(CalcularChurn(), "0.0") & "%"
    GravarCelula SHT_PORTAL_OPS, "I15", "R$ " & Format$(TotalAReceber(), "#,##0.00")
    GravarCelula SHT_PORTAL_OPS, "D21", ObterParametro("Portal", "ApiUrl", "http://127.0.0.1:8002")
    GravarCelula SHT_PORTAL_OPS, "D22", Format$(Now, "DD/MM/YYYY hh:nn")
    GravarCelula SHT_PORTAL_OPS, "D23", NomeUnidadeMemoria
End Sub

' Exporta JSON + (opcional) POST /sync/push na API cloud (Supabase)
Public Sub Sincronizar()
    Dim path As String, baseDir As String, f As Integer
    Dim lo As ListObject, lr As ListRow
    Dim line As String
    Dim apiUrl As String, autoPush As String
    Dim pushResult As String
    Dim empId As String
    Dim errNum As Long, errDesc As String
    On Error GoTo TrataErro

    baseDir = Trim$(ThisWorkbook.Path)
    If Len(baseDir) = 0 Then
        baseDir = Trim$(ThisWorkbook.FullName)
        If InStrRev(baseDir, "\") > 0 Then
            baseDir = Left$(baseDir, InStrRev(baseDir, "\") - 1)
        End If
    End If
    If Len(baseDir) = 0 Then
        Err.Raise 1001, "Sincronizar", "Salve o arquivo .xlsm em disco antes de sincronizar (Path vazio)."
    End If

    path = baseDir & "\Sync"
    On Error Resume Next
    If Len(Dir(path, vbDirectory)) = 0 Then MkDir path
    Err.Clear
    On Error GoTo TrataErro
    path = path & "\portal_export.json"

    empId = EmpresaIDMemoria
    If Len(Trim$(empId)) = 0 Or empId = "0" Then empId = "1"
    Dim uniId As String
    uniId = UnidadeIDMemoria
    If Len(Trim$(uniId)) = 0 Or uniId = "0" Then uniId = "1"

    f = FreeFile
    Open path For Output As #f
    Print #f, "{"
    Print #f, "  ""versao"": """ & JsonEsc(CStr(VersaoSistema())) & ""","
    Print #f, "  ""atualizado"": """ & Format$(Now, "yyyy-mm-ddThh:nn:ss") & ""","
    Print #f, "  ""empresa_id"": " & empId & ","
    Print #f, "  ""unidade_id"": " & uniId & ","
    Print #f, "  ""alunos"": ["
    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    Dim first As Boolean
    first = True
    For Each lr In lo.ListRows
        If Len(CampoSafe(lr, "Matrícula")) = 0 Then GoTo Prox
        If Not first Then Print #f, ","
        first = False
        Dim uRow As String
        uRow = uniId
        On Error Resume Next
        If Len(CampoSafe(lr, "UnidadeID")) > 0 Then uRow = CampoSafe(lr, "UnidadeID")
        On Error GoTo TrataErro
        line = "    {""matricula"":""" & JsonEsc(CampoSafe(lr, "Matrícula")) & _
               """,""nome"":""" & JsonEsc(CampoSafe(lr, "Nome")) & _
               """,""plano"":""" & JsonEsc(CampoSafe(lr, "Plano")) & _
               """,""professor"":""" & JsonEsc(CampoSafe(lr, "Professor")) & _
               """,""status"":""" & JsonEsc(CampoSafe(lr, "Status")) & _
               """,""empresa_id"":" & empId & _
               ",""unidade_id"":" & uRow & "}"
        Print #f, line;
Prox:
    Next lr
    Print #f, ""
    Print #f, "  ],"
    apiUrl = ObterParametro("Portal", "ApiUrl", "http://127.0.0.1:8002")
    Print #f, "  ""api"": """ & JsonEsc(apiUrl) & """"
    Print #f, "}"
    Close #f
    f = 0

    GravarCelula SHT_PORTAL_OPS, "D21", apiUrl
    GravarCelula SHT_PORTAL_OPS, "D22", Format$(Now, "DD/MM/YYYY hh:nn")
    GravarCelula SHT_PORTAL_OPS, "D24", path

    autoPush = UCase$(Trim$(ObterParametro("Portal", "SyncAutoPush", "SIM")))
    If autoPush = "SIM" Or autoPush = "S" Or autoPush = "1" Then
        pushResult = SyncPushCloud(path, apiUrl, CLng(empId))
        GravarCelula SHT_PORTAL_OPS, "D23", pushResult
        RegistrarLog "Sync cloud push", "Portal", pushResult
        If Left$(UCase$(pushResult), 2) = "OK" Then
            MsgOk "Sincronização Excel → Supabase:" & vbCrLf & path & vbCrLf & pushResult
        Else
            MsgErro "Sync parcial (JSON gerado, push falhou):" & vbCrLf & pushResult & vbCrLf & path
        End If
    Else
        GravarCelula SHT_PORTAL_OPS, "D23", "JSON OK (push desligado)"
        RegistrarLog "Sync portal JSON", "Portal", path
        MsgOk "JSON gerado:" & vbCrLf & path
    End If
    Exit Sub
TrataErro:
    errNum = Err.Number
    errDesc = Err.Description
    On Error Resume Next
    If f <> 0 Then Close #f
    GravarCelula SHT_PORTAL_OPS, "D23", "ERRO " & errNum & ": " & errDesc
    RegistrarErro errNum, errDesc, "Sincronizar"
    MsgErro "Erro ao sincronizar portal." & vbCrLf & _
            "Código " & errNum & ": " & errDesc & vbCrLf & _
            "Path: " & ThisWorkbook.Path
End Sub

Private Function CampoSafe(ByVal lr As ListRow, ByVal colName As String) As String
    On Error Resume Next
    CampoSafe = NzStr(LerCampo(lr, colName))
    If Err.Number <> 0 Then
        Err.Clear
        CampoSafe = ""
    End If
End Function

Private Function SyncPushCloud(ByVal jsonPath As String, ByVal apiUrl As String, ByVal empresaId As Long) As String
    Dim usuario As String, senha As String
    Dim token As String, body As String, resp As String
    Dim http As Object
    Dim f As Integer
    Dim n As Long

    usuario = ObterParametro("Portal", "SyncUser", "admin")
    senha = ObterParametro("Portal", "SyncPass", "123456")
    If Right$(apiUrl, 1) = "/" Then apiUrl = Left$(apiUrl, Len(apiUrl) - 1)

    On Error GoTo Falha
    On Error Resume Next
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    If http Is Nothing Then Set http = CreateObject("MSXML2.XMLHTTP")
    If http Is Nothing Then Set http = CreateObject("WinHttp.WinHttpRequest.5.1")
    Err.Clear
    On Error GoTo Falha
    If http Is Nothing Then
        SyncPushCloud = "ERRO HTTP: nenhum componente XMLHTTP disponível"
        Exit Function
    End If

    http.Open "POST", apiUrl & "/auth/login", False
    http.setRequestHeader "Content-Type", "application/json"
    http.Send "{""usuario"":""" & JsonEsc(usuario) & """,""senha"":""" & JsonEsc(senha) & """}"
    If http.Status < 200 Or http.Status >= 300 Then
        SyncPushCloud = "LOGIN FALHOU HTTP " & http.Status & " — " & Left$(CStr(http.responseText), 120)
        Exit Function
    End If
    token = ExtrairJsonString(CStr(http.responseText), "token")
    If Len(token) = 0 Then
        SyncPushCloud = "LOGIN OK mas token ausente"
        Exit Function
    End If

    f = FreeFile
    Open jsonPath For Binary Access Read As #f
    body = Space$(LOF(f))
    Get #f, , body
    Close #f
    f = 0
    body = Replace(body, Chr$(0), "")

    http.Open "POST", apiUrl & "/sync/push", False
    http.setRequestHeader "Content-Type", "application/json"
    http.setRequestHeader "Authorization", "Bearer " & token
    http.Send body
    resp = CStr(http.responseText)
    If http.Status < 200 Or http.Status >= 300 Then
        SyncPushCloud = "PUSH FALHOU HTTP " & http.Status & " — " & Left$(resp, 160)
        Exit Function
    End If
    n = CLng(Val(ExtrairJsonNumero(resp, "alunos_upsert")))
    SyncPushCloud = "OK Supabase — " & n & " aluno(s)"
    Exit Function
Falha:
    On Error Resume Next
    If f <> 0 Then Close #f
    SyncPushCloud = "ERRO HTTP: " & Err.Number & " " & Err.Description
End Function

Private Function ExtrairJsonString(ByVal json As String, ByVal campo As String) As String
    Dim p As Long, p2 As Long, chave As String
    chave = """" & campo & """"
    p = InStr(1, json, chave, vbTextCompare)
    If p = 0 Then Exit Function
    p = InStr(p, json, ":", vbBinaryCompare)
    If p = 0 Then Exit Function
    p = InStr(p, json, """", vbBinaryCompare)
    If p = 0 Then Exit Function
    p2 = InStr(p + 1, json, """", vbBinaryCompare)
    If p2 = 0 Then Exit Function
    ExtrairJsonString = Mid$(json, p + 1, p2 - p - 1)
End Function

Private Function ExtrairJsonNumero(ByVal json As String, ByVal campo As String) As String
    Dim p As Long, chave As String, ch As String, i As Long, buf As String
    chave = """" & campo & """"
    p = InStr(1, json, chave, vbTextCompare)
    If p = 0 Then Exit Function
    p = InStr(p, json, ":", vbBinaryCompare)
    If p = 0 Then Exit Function
    i = p + 1
    Do While i <= Len(json)
        ch = Mid$(json, i, 1)
        If ch Like "[0-9]" Then
            buf = buf & ch
        ElseIf Len(buf) > 0 Then
            Exit Do
        End If
        i = i + 1
    Loop
    ExtrairJsonNumero = buf
End Function

Private Function JsonEsc(ByVal s As String) As String
    JsonEsc = Replace(Replace(s, "\", "\\"), """", "\""")
End Function
