Attribute VB_Name = "modAvaliacao"
Option Explicit

Public Const SHT_AVALIACOES As String = "BD_AVALIACOES"
Public Const TBL_AVALIACOES As String = "tbAvaliacoes"
Public Const SHT_MEDIDAS As String = "BD_MEDIDAS"
Public Const TBL_MEDIDAS As String = "tbMedidas"
Public Const SHT_FOTOS As String = "BD_FOTOS"
Public Const TBL_FOTOS As String = "tbFotos"
Public Const SHT_AVAL_UI As String = "24_AVALIACAO"

Public Function CalcularIMC(ByVal peso As Double, ByVal altura As Double) As Double
    If peso > 0 And altura > 0 Then CalcularIMC = Round(peso / (altura * altura), 2)
End Function

Public Function CalcularMassaGorda(ByVal peso As Double, ByVal massaMagra As Double) As Double
    If peso > 0 And massaMagra >= 0 Then CalcularMassaGorda = Round(peso - massaMagra, 2)
End Function

Public Function CalcularPercentualGordura(Optional ByVal peso As Double = 0, _
                                          Optional ByVal massaGorda As Double = 0, _
                                          Optional ByVal valorArmazenado As Variant) As Double
    If Not IsMissing(valorArmazenado) And IsNumeric(valorArmazenado) Then
        CalcularPercentualGordura = CDbl(valorArmazenado)
    ElseIf peso > 0 Then
        CalcularPercentualGordura = Round(massaGorda / peso * 100, 2)
    End If
End Function

Public Sub AtualizarAvaliacoes()
    On Error GoTo TrataErro
    AtualizarListaAvaliacoesUI
    AtualizarDashboardAvaliacao
    GerarGraficoEvolucao
    Application.Calculate
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarAvaliacoes"
End Sub

Public Sub NovaAvaliacao()
    Dim mat As String, nome As String, prof As String, objetivo As String, obs As String
    Dim sPeso As String, sAltura As String, sGordura As String, sMagra As String
    Dim peso As Double, altura As Double, gordura As Double, magra As Double
    Dim imc As Double, gorda As Double, id As Long, cols As Variant, vals As Variant
    Dim lr As ListRow, matricula As String, dataAval As Date
    On Error GoTo TrataErro
    If Not PodeAcessar("Avaliacao") Then ExigeAcesso "Avaliacao": Exit Sub
    mat = Trim$(InputBox("Matrícula:", "Nova Avaliação"))
    If Len(mat) = 0 Then Exit Sub
    nome = Trim$(InputBox("Nome do aluno:", "Nova Avaliação"))
    If Len(nome) = 0 Then Exit Sub
    prof = Trim$(InputBox("Professor:", "Nova Avaliação"))
    sPeso = Trim$(InputBox("Peso (kg):", "Nova Avaliação"))
    sAltura = Trim$(InputBox("Altura (m):", "Nova Avaliação"))
    If Not IsNumeric(sPeso) Or Not IsNumeric(sAltura) Then MsgAviso "Peso e altura inválidos.": Exit Sub
    peso = CDbl(sPeso): altura = CDbl(sAltura)
    sGordura = Trim$(InputBox("% de gordura (opcional):", "Nova Avaliação"))
    sMagra = Trim$(InputBox("Massa magra (kg):", "Nova Avaliação"))
    If IsNumeric(sGordura) Then gordura = CDbl(sGordura)
    If IsNumeric(sMagra) Then magra = CDbl(sMagra)
    If magra <= 0 Then magra = peso - (peso * gordura / 100)
    If magra < 0 Then magra = 0
    gorda = CalcularMassaGorda(peso, magra)
    objetivo = Trim$(InputBox("Objetivo:", "Nova Avaliação"))
    obs = Trim$(InputBox("Observações:", "Nova Avaliação"))
    dataAval = DataAtual(): matricula = mat: id = MaxNumerico(SHT_AVALIACOES, TBL_AVALIACOES, "ID") + 1
    cols = Array("ID", "Matrícula", "Nome", "Data", "Professor", "Peso", "Altura", "IMC", _
                 "Gordura Corporal", "Massa Magra", "Massa Gorda", "Objetivo", "Observações")
    vals = Array(id, mat, nome, dataAval, prof, peso, altura, CalcularIMC(peso, altura), _
                 gordura, magra, gorda, objetivo, obs)
    Set lr = AdicionarRegistro(SHT_AVALIACOES, TBL_AVALIACOES, cols, vals)
    AdicionarRegistro SHT_MEDIDAS, TBL_MEDIDAS, Array("ID", "AvaliacaoID", "Peitoral", "Cintura", _
        "Abdômen", "Quadril", "Bíceps Direito", "Bíceps Esquerdo", "Antebraço", "Coxa", "Panturrilha", "Ombros"), _
        Array(MaxNumerico(SHT_MEDIDAS, TBL_MEDIDAS, "ID") + 1, id, "", "", "", "", "", "", "", "", "", "")
    SincronizarAvaliacaoLegado
    AgendarReavaliacao nome, mat, prof, dataAval
    On Error Resume Next
    AtualizarBI
    On Error GoTo TrataErro
    RegistrarLog "Avaliação cadastrada", "Avaliação", CStr(id) & " / " & nome
    AtualizarAvaliacoes
    MsgOk "Avaliação cadastrada com sucesso."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "NovaAvaliacao"
    MsgErro "Erro ao cadastrar avaliação."
End Sub

Public Sub SalvarAvaliacao(): NovaAvaliacao: End Sub

Public Sub CarregarAvaliacaoSelecionada()
    Dim id As Long
    id = CLng(Val(NzStr(LerCelula(SHT_AVAL_UI, "C" & ActiveCell.Row))))
    If id <= 0 Then MsgAviso "Selecione uma avaliação na lista.": Exit Sub
    MostrarAvaliacaoSelecionada id
End Sub

Public Sub MostrarAvaliacaoSelecionada(Optional ByVal id As Long = 0)
    Dim lr As ListRow, i As Long, campos As Variant, addrs As Variant
    If id <= 0 Then id = CLng(Val(NzStr(LerCelula(SHT_AVAL_UI, "C" & ActiveCell.Row))))
    Set lr = PesquisarRegistro(SHT_AVALIACOES, TBL_AVALIACOES, "ID", CStr(id), False)
    If lr Is Nothing Then MsgAviso "Avaliação não encontrada.": Exit Sub
    campos = Array("Matrícula", "Nome", "Professor", "Data", "Peso", "Altura", "IMC", "Gordura Corporal", "Massa Magra", "Massa Gorda", "Objetivo", "Observações")
    addrs = Array("D12", "D13", "D14", "D15", "D16", "D17", "D18", "D19", "D20", "D21", "D22", "D23")
    For i = LBound(campos) To UBound(campos): GravarCelula SHT_AVAL_UI, addrs(i), LerCampo(lr, campos(i)): Next i
    AtualizarAvaliacoes
End Sub

Public Sub AtualizarListaAvaliacoesUI()
    Dim lo As ListObject, lr As ListRow, i As Long, r As Long
    On Error GoTo Fim
    For r = 27 To 36: ThisWorkbook.Sheets(SHT_AVAL_UI).Range("C" & r & ":J" & r).ClearContents: Next r
    Set lo = ObterTabela(SHT_AVALIACOES, TBL_AVALIACOES): i = 0
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Nome"))) > 0 Then
            i = i + 1: If i > 10 Then Exit For
            GravarCelula SHT_AVAL_UI, "C" & (26 + i), LerCampo(lr, "ID")
            GravarCelula SHT_AVAL_UI, "D" & (26 + i), LerCampo(lr, "Data")
            GravarCelula SHT_AVAL_UI, "E" & (26 + i), LerCampo(lr, "Nome")
            GravarCelula SHT_AVAL_UI, "F" & (26 + i), LerCampo(lr, "Peso")
            GravarCelula SHT_AVAL_UI, "G" & (26 + i), LerCampo(lr, "IMC")
            GravarCelula SHT_AVAL_UI, "H" & (26 + i), LerCampo(lr, "Gordura Corporal")
            GravarCelula SHT_AVAL_UI, "I" & (26 + i), LerCampo(lr, "Professor")
            GravarCelula SHT_AVAL_UI, "J" & (26 + i), LerCampo(lr, "Objetivo")
        End If
    Next lr
Fim:
End Sub

Public Sub GerarGraficoEvolucao()
    Dim lo As ListObject, lr As ListRow, nome As String, i As Long, maxPeso As Double
    On Error GoTo Fim
    nome = NzStr(LerCelula(SHT_AVAL_UI, "D13")): If Len(nome) = 0 Then Exit Sub
    For i = 40 To 47: GravarCelula SHT_AVAL_UI, "C" & i, "": GravarCelula SHT_AVAL_UI, "D" & i, "": GravarCelula SHT_AVAL_UI, "E" & i, "": Next i
    Set lo = ObterTabela(SHT_AVALIACOES, TBL_AVALIACOES): i = 0
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Nome")), nome, vbTextCompare) = 0 Then
            i = i + 1: If i > 8 Then Exit For
            GravarCelula SHT_AVAL_UI, "C" & (39 + i), LerCampo(lr, "Data")
            GravarCelula SHT_AVAL_UI, "D" & (39 + i), LerCampo(lr, "Peso")
            If CDbl(Val(LerCampo(lr, "Peso"))) > maxPeso Then maxPeso = CDbl(Val(LerCampo(lr, "Peso")))
        End If
    Next lr
    For i = 1 To 8
        If maxPeso > 0 Then GravarCelula SHT_AVAL_UI, "E" & (39 + i), String$(Application.Min(20, Round(Val(LerCelula(SHT_AVAL_UI, "D" & (39 + i))) / maxPeso * 20)), ChrW(&H2588))
    Next i
Fim:
End Sub

Public Sub CompararAvaliacoes()
    Dim a As Long, b As Long, la As ListRow, lb As ListRow, ma As ListRow, mb As ListRow
    Dim i As Long, c As Variant, labels As Variant, medidas As Variant
    a = CLng(Val(NzStr(LerCelula(SHT_AVAL_UI, "H39")))): b = CLng(Val(NzStr(LerCelula(SHT_AVAL_UI, "J39"))))
    Set la = PesquisarRegistro(SHT_AVALIACOES, TBL_AVALIACOES, "ID", CStr(a), False)
    Set lb = PesquisarRegistro(SHT_AVALIACOES, TBL_AVALIACOES, "ID", CStr(b), False)
    If la Is Nothing Or lb Is Nothing Then MsgAviso "Informe dois IDs de avaliação válidos.": Exit Sub
    labels = Array("Peso", "IMC", "Gordura Corporal", "Massa Magra")
    For i = 0 To 3: GravarCelula SHT_AVAL_UI, "G" & (41 + i), labels(i): GravarCelula SHT_AVAL_UI, "H" & (41 + i), LerCampo(la, labels(i)): GravarCelula SHT_AVAL_UI, "I" & (41 + i), LerCampo(lb, labels(i)): GravarCelula SHT_AVAL_UI, "J" & (41 + i), Val(LerCampo(lb, labels(i))) - Val(LerCampo(la, labels(i))): Next i
    Set ma = PesquisarRegistro(SHT_MEDIDAS, TBL_MEDIDAS, "AvaliacaoID", CStr(a), False)
    Set mb = PesquisarRegistro(SHT_MEDIDAS, TBL_MEDIDAS, "AvaliacaoID", CStr(b), False)
    If Not ma Is Nothing And Not mb Is Nothing Then
        medidas = Array("Peitoral", "Coxa")
        For i = 0 To 1
            GravarCelula SHT_AVAL_UI, "G" & (45 + i), medidas(i)
            GravarCelula SHT_AVAL_UI, "H" & (45 + i), LerCampo(ma, medidas(i))
            GravarCelula SHT_AVAL_UI, "I" & (45 + i), LerCampo(mb, medidas(i))
            GravarCelula SHT_AVAL_UI, "J" & (45 + i), Val(LerCampo(mb, medidas(i))) - Val(LerCampo(ma, medidas(i)))
        Next i
    End If
End Sub

Public Sub AgendarReavaliacao(ByVal nome As String, ByVal mat As String, ByVal prof As String, ByVal dataAval As Date)
    Dim dias As Long, dataProxima As Date
    dias = CLng(ObterParametroNumero("Treinos", "DiasReavaliacao", 60)): dataProxima = DateAdd("d", dias, dataAval)
    CriarEvento "Avaliação Física", "Reavaliação: " & nome, mat, dataProxima, "09:00", prof, "Média", "Avaliação", "", "Avaliação"
End Sub

Public Sub GerarPDFAvaliacao()
    Dim path As String
    On Error GoTo Falha
    path = ThisWorkbook.Path & "\PDF_Avaliacao_" & Format$(DataAtual(), "yyyymmdd") & ".pdf"
    ThisWorkbook.Sheets(SHT_AVAL_UI).ExportAsFixedFormat Type:=0, Filename:=path, Quality:=0, IncludeDocProperties:=True, IgnorePrintAreas:=False, OpenAfterPublish:=True
    MsgOk "PDF gerado:" & vbCrLf & path
    Exit Sub
Falha:
    RegistrarErro Err.Number, Err.Description, "GerarPDFAvaliacao": MsgErro "Não foi possível gerar o PDF."
End Sub

Public Sub SincronizarAvaliacaoLegado()
    Dim lo As ListObject, loDst As ListObject, lr As ListRow, dst As ListRow
    Dim lrDst As ListRow, id As Long, achou As Boolean
    On Error GoTo Fim
    Set lo = ObterTabela(SHT_AVALIACOES, TBL_AVALIACOES)
    Set loDst = ObterTabela("11_AVALIACAO", "tblAvaliacao")
    For Each lr In lo.ListRows
        id = CLng(Val(LerCampo(lr, "ID")))
        achou = False
        For Each lrDst In loDst.ListRows
            If StrComp(NzStr(LerCampo(lrDst, "Aluno")), NzStr(LerCampo(lr, "Nome")), vbTextCompare) = 0 Then
                If IsDate(LerCampo(lrDst, "Data")) And IsDate(LerCampo(lr, "Data")) Then
                    If CDate(LerCampo(lrDst, "Data")) = CDate(LerCampo(lr, "Data")) Then achou = True: Exit For
                End If
            End If
        Next lrDst
        If Not achou Then
            AdicionarRegistro "11_AVALIACAO", "tblAvaliacao", Array("Aluno", "Data", "Peso (kg)", "Altura (m)", "IMC", "% Gordura", "Massa Magra", "Professor", "Observações", "Classificação IMC"), _
                Array(LerCampo(lr, "Nome"), LerCampo(lr, "Data"), LerCampo(lr, "Peso"), LerCampo(lr, "Altura"), LerCampo(lr, "IMC"), LerCampo(lr, "Gordura Corporal"), LerCampo(lr, "Massa Magra"), LerCampo(lr, "Professor"), LerCampo(lr, "Observações"), "")
        End If
    Next lr
Fim:
End Sub

Public Sub IrAvaliacao(): NavegarPara SHT_AVAL_UI: End Sub
Public Sub AbrirAvaliacaoEAtualizar(): AtualizarAvaliacoes: NavegarPara SHT_AVAL_UI: End Sub

Public Sub AtualizarDashboardAvaliacao()
    Dim total As Long, mes As Long, pend As Long, lo As ListObject, lr As ListRow, d As Date
    On Error GoTo Fim
    Set lo = ObterTabela(SHT_AVALIACOES, TBL_AVALIACOES)
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Nome"))) > 0 Then
            total = total + 1: If IsDate(LerCampo(lr, "Data")) Then d = CDate(LerCampo(lr, "Data")): If Month(d) = Month(DataAtual()) And Year(d) = Year(DataAtual()) Then mes = mes + 1
        End If
    Next lr
    On Error Resume Next
    pend = ContarReavaliacoesPendentes()
    GravarCelula SHT_AVAL_UI, "C8", mes
    GravarCelula SHT_AVAL_UI, "E8", pend
    GravarCelula SHT_AVAL_UI, "G8", total
    GravarCelula SHT_AVAL_UI, "I8", ContarAvaliacoesMesBD()
Fim:
End Sub

Private Function ContarReavaliacoesPendentes() As Long
    Dim lo As ListObject, lr As ListRow, d As Date, st As String
    On Error GoTo Fim
    Set lo = ObterTabela("BD_EVENTOS", "tbEventos")
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Tipo")), "Avaliação Física", vbTextCompare) = 0 Then
            st = UCase$(NzStr(LerCampo(lr, "Status")))
            If st <> "CONCLUÍDO" And st <> "CONCLUIDO" And st <> "CANCELADO" Then
                If IsDate(LerCampo(lr, "Data")) Then
                    d = CDate(LerCampo(lr, "Data"))
                    If d <= DataAtual() Then ContarReavaliacoesPendentes = ContarReavaliacoesPendentes + 1
                End If
            End If
        End If
    Next lr
Fim:
End Function

Public Function ContarAvaliacoesMesBD() As Long
    Dim lo As ListObject, lr As ListRow, d As Date
    On Error GoTo Fim
    Set lo = ObterTabela(SHT_AVALIACOES, TBL_AVALIACOES)
    For Each lr In lo.ListRows
        If IsDate(LerCampo(lr, "Data")) Then d = CDate(LerCampo(lr, "Data")): If Month(d) = Month(DataAtual()) And Year(d) = Year(DataAtual()) Then ContarAvaliacoesMesBD = ContarAvaliacoesMesBD + 1
    Next lr
Fim:
End Function

Public Sub AtualizarModuloEsportivo()
    AtualizarAvaliacoes
    AtualizarTreinos
End Sub
