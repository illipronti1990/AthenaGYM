Attribute VB_Name = "modTreinos"
Option Explicit

Public Const SHT_TREINOS As String = "BD_TREINOS"
Public Const TBL_TREINOS As String = "tbTreinos"
Public Const SHT_EXERCICIOS As String = "BD_EXERCICIOS"
Public Const TBL_EXERCICIOS As String = "tbExercicios"
Public Const SHT_TREINO_ITENS As String = "BD_TREINO_ITENS"
Public Const TBL_TREINO_ITENS As String = "tbTreinoItens"
Public Const SHT_TREINO_UI As String = "25_TREINOS"

Public Sub AtualizarTreinos()
    On Error GoTo TrataErro
    AtualizarListaTreinosUI
    AtualizarDashboardTreinos
    If CLng(Val(NzStr(LerCelula(SHT_TREINO_UI, "C" & ActiveCell.Row)))) > 0 Then AtualizarFichaUI CLng(Val(NzStr(LerCelula(SHT_TREINO_UI, "C" & ActiveCell.Row))))
    Application.Calculate
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarTreinos"
End Sub

Private Function TreinoSelecionado() As Long
    If ActiveSheet.Name = SHT_TREINO_UI And ActiveCell.Row >= 13 And ActiveCell.Row <= 22 Then TreinoSelecionado = CLng(Val(NzStr(LerCelula(SHT_TREINO_UI, "C" & ActiveCell.Row))))
End Function

Private Sub DesativarTreinosAtivos(ByVal matricula As String)
    Dim lo As ListObject, lr As ListRow
    On Error GoTo Fim
    Set lo = ObterTabela(SHT_TREINOS, TBL_TREINOS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), matricula, vbTextCompare) = 0 Then
            If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) = 0 Then
                GravarCampo lr, "Status", "Inativo": GravarCampo lr, "Data Fim", DataAtual()
            End If
        End If
    Next lr
Fim:
End Sub

Public Sub CriarTreino()
    Dim mat As String, nome As String, prof As String, tipo As String, objetivo As String, divisao As String
    Dim id As Long, cols As Variant, vals As Variant, resposta As String
    On Error GoTo TrataErro
    mat = Trim$(InputBox("Matrícula:", "Novo Treino")): If Len(mat) = 0 Then Exit Sub
    nome = Trim$(InputBox("Nome do aluno:", "Novo Treino")): If Len(nome) = 0 Then Exit Sub
    prof = Trim$(InputBox("Professor:", "Novo Treino"))
    tipo = Trim$(InputBox("Tipo (Musculação, Funcional...):", "Novo Treino", "Musculação"))
    objetivo = Trim$(InputBox("Objetivo:", "Novo Treino"))
    divisao = Trim$(InputBox("Divisão (Full Body/AB/ABC/ABCD/ABCDE/Personalizado):", "Novo Treino", "AB"))
    If Len(divisao) = 0 Then divisao = "Personalizado"
    resposta = Trim$(InputBox("Desativar treino ativo anterior? (Sim/Não):", "Novo Treino", "Sim"))
    If UCase$(resposta) <> "NÃO" And UCase$(resposta) <> "NAO" Then DesativarTreinosAtivos mat
    id = MaxNumerico(SHT_TREINOS, TBL_TREINOS, "ID") + 1
    cols = Array("ID", "Matrícula", "Nome", "Professor", "Tipo", "Objetivo", "Divisão", "Data Início", "Data Fim", "Versão", "Status")
    vals = Array(id, mat, nome, prof, tipo, objetivo, divisao, DataAtual(), "", 1, "Ativo")
    AdicionarRegistro SHT_TREINOS, TBL_TREINOS, cols, vals
    RegistrarLog "Treino criado", "Treinos", CStr(id) & " / " & nome
    AtualizarTreinos
    MsgOk "Treino criado com sucesso."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "CriarTreino": MsgErro "Erro ao criar treino."
End Sub

Public Sub EditarTreino()
    Dim id As Long, lr As ListRow, objetivo As String, status As String
    On Error GoTo TrataErro
    id = TreinoSelecionado(): If id <= 0 Then MsgAviso "Selecione um treino.": Exit Sub
    Set lr = PesquisarRegistro(SHT_TREINOS, TBL_TREINOS, "ID", CStr(id), False)
    If lr Is Nothing Then MsgErro "Treino não encontrado.": Exit Sub
    objetivo = Trim$(InputBox("Objetivo:", "Editar Treino", NzStr(LerCampo(lr, "Objetivo"))))
    status = Trim$(InputBox("Status (Ativo/Inativo):", "Editar Treino", NzStr(LerCampo(lr, "Status"))))
    If Len(objetivo) = 0 Or Len(status) = 0 Then Exit Sub
    GravarCampo lr, "Objetivo", objetivo: GravarCampo lr, "Status", status
    AtualizarTreinos: MsgOk "Treino atualizado."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "EditarTreino"
End Sub

Public Sub CopiarTreino()
    Dim id As Long, novoId As Long, versao As Long, lr As ListRow, item As ListRow, lo As ListObject
    Dim cols As Variant, vals As Variant, mat As String, nome As String, prof As String
    Dim i As Long, nItens As Long
    On Error GoTo TrataErro
    id = TreinoSelecionado(): If id <= 0 Then MsgAviso "Selecione um treino.": Exit Sub
    Set lr = PesquisarRegistro(SHT_TREINOS, TBL_TREINOS, "ID", CStr(id), False)
    If lr Is Nothing Then Exit Sub
    mat = NzStr(LerCampo(lr, "Matrícula")): DesativarTreinosAtivos mat
    novoId = MaxNumerico(SHT_TREINOS, TBL_TREINOS, "ID") + 1: versao = CLng(Val(LerCampo(lr, "Versão"))) + 1
    cols = Array("ID", "Matrícula", "Nome", "Professor", "Tipo", "Objetivo", "Divisão", "Data Início", "Data Fim", "Versão", "Status")
    vals = Array(novoId, mat, LerCampo(lr, "Nome"), LerCampo(lr, "Professor"), LerCampo(lr, "Tipo"), LerCampo(lr, "Objetivo"), LerCampo(lr, "Divisão"), DataAtual(), "", versao, "Ativo")
    AdicionarRegistro SHT_TREINOS, TBL_TREINOS, cols, vals
    Set lo = ObterTabela(SHT_TREINO_ITENS, TBL_TREINO_ITENS)
    nItens = lo.ListRows.Count
    For i = 1 To nItens
        Set item = lo.ListRows(i)
        If CLng(Val(LerCampo(item, "TreinoID"))) = id Then
            AdicionarRegistro SHT_TREINO_ITENS, TBL_TREINO_ITENS, Array("ID", "TreinoID", "Dia", "Grupo", "ExercicioCodigo", "Exercício", "Séries", "Repetições", "Ordem", "Observação"), _
                Array(MaxNumerico(SHT_TREINO_ITENS, TBL_TREINO_ITENS, "ID") + 1, novoId, LerCampo(item, "Dia"), LerCampo(item, "Grupo"), LerCampo(item, "ExercicioCodigo"), LerCampo(item, "Exercício"), LerCampo(item, "Séries"), LerCampo(item, "Repetições"), LerCampo(item, "Ordem"), LerCampo(item, "Observação"))
        End If
    Next item
    AtualizarTreinos: MsgOk "Treino copiado para a versão " & versao & "."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "CopiarTreino": MsgErro "Erro ao copiar treino."
End Sub

Public Sub FinalizarTreino()
    Dim id As Long, lr As ListRow, mat As String, nome As String
    On Error GoTo TrataErro
    id = TreinoSelecionado(): If id <= 0 Then MsgAviso "Selecione um treino.": Exit Sub
    Set lr = PesquisarRegistro(SHT_TREINOS, TBL_TREINOS, "ID", CStr(id), False)
    If Not lr Is Nothing Then
        mat = NzStr(LerCampo(lr, "Matrícula"))
        nome = NzStr(LerCampo(lr, "Nome"))
        GravarCampo lr, "Status", "Inativo": GravarCampo lr, "Data Fim", DataAtual()
        On Error Resume Next
        Call NotificarTreinoAtualizado(mat, nome)
        On Error GoTo TrataErro
    End If
    AtualizarTreinos: MsgOk "Treino finalizado."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "FinalizarTreino"
End Sub

Public Sub BuscarTreino()
    Dim texto As String, lo As ListObject, lr As ListRow
    texto = Trim$(InputBox("Nome ou matrícula:", "Buscar Treino")): If Len(texto) = 0 Then Exit Sub
    Set lo = ObterTabela(SHT_TREINOS, TBL_TREINOS)
    For Each lr In lo.ListRows
        If InStr(1, NzStr(LerCampo(lr, "Nome")), texto, vbTextCompare) > 0 Or InStr(1, NzStr(LerCampo(lr, "Matrícula")), texto, vbTextCompare) > 0 Then
            GravarCelula SHT_TREINO_UI, "C13", LerCampo(lr, "ID"): Exit For
        End If
    Next lr
    AtualizarTreinos
End Sub

Public Sub CarregarTreinoSelecionado()
    Dim id As Long
    id = TreinoSelecionado(): If id <= 0 Then MsgAviso "Selecione um treino na lista.": Exit Sub
    AtualizarFichaUI id
End Sub

Public Sub AtualizarListaTreinosUI()
    Dim lo As ListObject, lr As ListRow, i As Long, r As Long
    On Error GoTo Fim
    For r = 13 To 22: ThisWorkbook.Sheets(SHT_TREINO_UI).Range("C" & r & ":I" & r).ClearContents: Next r
    Set lo = ObterTabela(SHT_TREINOS, TBL_TREINOS): i = 0
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Nome"))) > 0 Then
            i = i + 1: If i > 10 Then Exit For
            GravarCelula SHT_TREINO_UI, "C" & (12 + i), LerCampo(lr, "ID")
            GravarCelula SHT_TREINO_UI, "D" & (12 + i), LerCampo(lr, "Nome")
            GravarCelula SHT_TREINO_UI, "E" & (12 + i), LerCampo(lr, "Tipo")
            GravarCelula SHT_TREINO_UI, "F" & (12 + i), LerCampo(lr, "Divisão")
            GravarCelula SHT_TREINO_UI, "G" & (12 + i), LerCampo(lr, "Versão")
            GravarCelula SHT_TREINO_UI, "H" & (12 + i), LerCampo(lr, "Status")
            GravarCelula SHT_TREINO_UI, "I" & (12 + i), LerCampo(lr, "Data Início")
        End If
    Next lr
Fim:
End Sub

Public Sub AtualizarFichaUI(ByVal treinoId As Long)
    Dim lo As ListObject, lr As ListRow, i As Long, r As Long
    On Error GoTo Fim
    For r = 26 To 40: ThisWorkbook.Sheets(SHT_TREINO_UI).Range("C" & r & ":H" & r).ClearContents: Next r
    Set lo = ObterTabela(SHT_TREINO_ITENS, TBL_TREINO_ITENS): i = 0
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "TreinoID"))) = treinoId Then
            i = i + 1: If i > 15 Then Exit For
            GravarCelula SHT_TREINO_UI, "C" & (25 + i), LerCampo(lr, "Dia")
            GravarCelula SHT_TREINO_UI, "D" & (25 + i), LerCampo(lr, "Grupo")
            GravarCelula SHT_TREINO_UI, "E" & (25 + i), LerCampo(lr, "Exercício")
            GravarCelula SHT_TREINO_UI, "F" & (25 + i), LerCampo(lr, "Séries")
            GravarCelula SHT_TREINO_UI, "G" & (25 + i), LerCampo(lr, "Repetições")
            GravarCelula SHT_TREINO_UI, "H" & (25 + i), LerCampo(lr, "Observação")
        End If
    Next lr
Fim:
End Sub

Public Sub AdicionarExercicioNaFicha()
    Dim treinoId As Long, codigo As String, dia As String, series As String, reps As String
    Dim ex As ListRow, id As Long, ordem As Long
    On Error GoTo TrataErro
    treinoId = TreinoSelecionado(): If treinoId <= 0 Then MsgAviso "Selecione um treino.": Exit Sub
    codigo = Trim$(InputBox("Código do exercício (ex.: EX001):", "Adicionar Exercício")): If Len(codigo) = 0 Then Exit Sub
    Set ex = PesquisarRegistro(SHT_EXERCICIOS, TBL_EXERCICIOS, "Código", codigo, False)
    If ex Is Nothing Then MsgAviso "Exercício não encontrado.": Exit Sub
    dia = Trim$(InputBox("Dia (A/B/C):", "Adicionar Exercício", "A"))
    series = Trim$(InputBox("Séries:", "Adicionar Exercício", "3"))
    reps = Trim$(InputBox("Repetições:", "Adicionar Exercício", "12"))
    ordem = ContarOnde(SHT_TREINO_ITENS, TBL_TREINO_ITENS, "TreinoID", CStr(treinoId)) + 1
    id = MaxNumerico(SHT_TREINO_ITENS, TBL_TREINO_ITENS, "ID") + 1
    AdicionarRegistro SHT_TREINO_ITENS, TBL_TREINO_ITENS, Array("ID", "TreinoID", "Dia", "Grupo", "ExercicioCodigo", "Exercício", "Séries", "Repetições", "Ordem", "Observação"), _
        Array(id, treinoId, dia, LerCampo(ex, "Grupo Muscular"), codigo, LerCampo(ex, "Exercício"), series, reps, ordem, "")
    AtualizarFichaUI treinoId: MsgOk "Exercício adicionado à ficha."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AdicionarExercicioNaFicha"
End Sub

Public Sub GerarPDFTreino()
    Dim path As String
    On Error GoTo Falha
    path = ThisWorkbook.Path & "\PDF_Treino_" & Format$(DataAtual(), "yyyymmdd") & ".pdf"
    ThisWorkbook.Sheets(SHT_TREINO_UI).ExportAsFixedFormat Type:=0, Filename:=path, Quality:=0, IncludeDocProperties:=True, IgnorePrintAreas:=False, OpenAfterPublish:=True
    MsgOk "PDF gerado:" & vbCrLf & path
    Exit Sub
Falha:
    RegistrarErro Err.Number, Err.Description, "GerarPDFTreino": MsgErro "Não foi possível gerar o PDF."
End Sub

Public Sub AtualizarDashboardTreinos()
    Dim lo As ListObject, lr As ListRow, ativos As Long, biblioteca As Long, maxV As Long, alunos As Long
    Dim nomes As String, v As Long
    On Error GoTo Fim
    Set lo = ObterTabela(SHT_TREINOS, TBL_TREINOS)
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Nome"))) > 0 Then
            If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) = 0 Then
                ativos = ativos + 1
                If InStr(1, "|" & nomes & "|", "|" & NzStr(LerCampo(lr, "Matrícula")) & "|", vbTextCompare) = 0 Then nomes = nomes & "|" & NzStr(LerCampo(lr, "Matrícula"))
            End If
            biblioteca = biblioteca + 1: v = CLng(Val(LerCampo(lr, "Versão"))): If v > maxV Then maxV = v
        End If
    Next lr
    If Len(nomes) > 0 Then alunos = Len(nomes) - Len(Replace(nomes, "|", ""))
    GravarCelula SHT_TREINO_UI, "C8", ativos: GravarCelula SHT_TREINO_UI, "E8", biblioteca: GravarCelula SHT_TREINO_UI, "G8", maxV: GravarCelula SHT_TREINO_UI, "I8", alunos
Fim:
End Sub

Public Sub IrTreinos(): NavegarPara SHT_TREINO_UI: End Sub
Public Sub AbrirTreinosEAtualizar(): AtualizarTreinos: NavegarPara SHT_TREINO_UI: End Sub
