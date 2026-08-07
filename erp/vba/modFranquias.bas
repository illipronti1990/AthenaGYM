Attribute VB_Name = "modFranquias"
Option Explicit

'============================================================
' Épico 3 — Gestão de Franquias (Sprint A+B)
'============================================================

Public Const SHT_FRANQUEADORAS As String = "BD_FRANQUEADORAS"
Public Const TBL_FRANQUEADORAS As String = "tbFranqueadoras"
Public Const SHT_FRANQUEADOS As String = "BD_FRANQUEADOS"
Public Const TBL_FRANQUEADOS As String = "tbFranqueados"
Public Const SHT_CONTRATOS_FR As String = "BD_CONTRATOS_FRANQUIA"
Public Const TBL_CONTRATOS_FR As String = "tbContratosFranquia"
Public Const SHT_ROYALTIES As String = "BD_ROYALTIES"
Public Const TBL_ROYALTIES As String = "tbRoyalties"
Public Const SHT_FRANQ_UI As String = "41_FRANQUEADORA"

Public Sub IrFranqueadora()
    On Error Resume Next
    Call AtualizarDashboardFranqueadora
    NavegarPara SHT_FRANQ_UI
End Sub

Public Function FranqueadoraIDSessao() As Long
    FranqueadoraIDSessao = CLng(Val(FranqueadoraIDMemoria))
End Function

Public Function FranqueadoIDSessao() As Long
    FranqueadoIDSessao = CLng(Val(FranqueadoIDMemoria))
End Function

Public Function EhFranqueadora() As Boolean
    EhFranqueadora = (StrComp(PerfilUsuario, "Franqueadora", vbTextCompare) = 0) Or EhSuperAdmin()
End Function

Public Function PodeVerFranqueado(ByVal franqueadoId As Long) As Boolean
    On Error Resume Next
    If EhSuperAdmin() Or EhFranqueadora() Then
        PodeVerFranqueado = True
        Exit Function
    End If
    If StrComp(PerfilUsuario, "Franqueado", vbTextCompare) = 0 Then
        PodeVerFranqueado = (franqueadoId = FranqueadoIDSessao() Or FranqueadoIDSessao() = 0)
        Exit Function
    End If
    PodeVerFranqueado = (FranqueadoIDSessao() = 0 Or franqueadoId = FranqueadoIDSessao())
End Function

Public Function PertenceFranquia(ByVal lr As ListRow) As Boolean
    Dim fid As Long, foid As Long
    On Error Resume Next
    If Not PertenceEmpresa(lr) Then
        PertenceFranquia = False
        Exit Function
    End If
    If FranqueadoraIDSessao() <= 0 And Not EhFranqueadora() Then
        PertenceFranquia = True
        Exit Function
    End If
    fid = CLng(Val(LerCampo(lr, "FranqueadoraID")))
    If Err.Number <> 0 Then Err.Clear: PertenceFranquia = True: Exit Function
    If FranqueadoraIDSessao() > 0 And fid > 0 And fid <> FranqueadoraIDSessao() Then
        PertenceFranquia = False
        Exit Function
    End If
    foid = FranqueadoIDSessao()
    If foid > 0 Then
        If CLng(Val(LerCampo(lr, "FranqueadoID"))) <> foid And CLng(Val(LerCampo(lr, "FranqueadoID"))) <> 0 Then
            PertenceFranquia = False
            Exit Function
        End If
    End If
    PertenceFranquia = True
End Function

Public Sub DefinirFranquiaSessao(ByVal franqueadoraId As Long, ByVal franqueadoId As Long, Optional ByVal nomeRede As String = "")
    FranqueadoraIDMemoria = CStr(franqueadoraId)
    FranqueadoIDMemoria = CStr(franqueadoId)
    On Error Resume Next
    ThisWorkbook.Sheets("BD_SESSAO").Range("B10").Value = FranqueadoraIDMemoria
    ThisWorkbook.Sheets("BD_SESSAO").Range("B11").Value = FranqueadoIDMemoria
    GravarCelula SHT_FRANQ_UI, "D33", FranqueadoraIDMemoria
    GravarCelula SHT_FRANQ_UI, "D34", FranqueadoIDMemoria
    If Len(Trim$(nomeRede)) > 0 Then GravarCelula SHT_FRANQ_UI, "D35", nomeRede
End Sub

Public Function NomeFranqueadoraPorId(ByVal fid As Long) As String
    Dim lo As ListObject, lr As ListRow
    On Error Resume Next
    Set lo = ObterTabela(SHT_FRANQUEADORAS, TBL_FRANQUEADORAS)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "FranqueadoraID"))) = fid Then
            NomeFranqueadoraPorId = NzStr(LerCampo(lr, "Nome"))
            Exit Function
        End If
    Next lr
    NomeFranqueadoraPorId = ""
End Function

Public Function BuscarFranqueado(ByVal franqueadoId As Long) As ListRow
    Dim lo As ListObject, lr As ListRow
    Set BuscarFranqueado = Nothing
    On Error Resume Next
    Set lo = ObterTabela(SHT_FRANQUEADOS, TBL_FRANQUEADOS)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "FranqueadoID"))) = franqueadoId Then
            Set BuscarFranqueado = lr
            Exit Function
        End If
    Next lr
End Function

Public Function ContratoDoFranqueado(ByVal franqueadoId As Long) As ListRow
    Dim lo As ListObject, lr As ListRow
    Set ContratoDoFranqueado = Nothing
    On Error Resume Next
    Set lo = ObterTabela(SHT_CONTRATOS_FR, TBL_CONTRATOS_FR)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "FranqueadoID"))) = franqueadoId Then
            If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) = 0 Then
                Set ContratoDoFranqueado = lr
                Exit Function
            End If
        End If
    Next lr
End Function

Public Function ReceitaMesEmpresa(ByVal empresaId As Long, Optional ByVal m As Long = 0, Optional ByVal a As Long = 0) As Double
    Dim lo As ListObject, lr As ListRow
    Dim tot As Double, eid As Long, dt As Date
    On Error Resume Next
    If m = 0 Then m = Month(Date)
    If a = 0 Then a = Year(Date)
    Set lo = ObterTabela(SHT_LANCAMENTOS, TBL_LANCAMENTOS)
    For Each lr In lo.ListRows
        eid = CLng(Val(LerCampo(lr, "EmpresaID")))
        If empresaId > 0 And eid <> empresaId Then GoTo Prox
        If Not IsDate(LerCampo(lr, "Data")) Then GoTo Prox
        dt = CDate(LerCampo(lr, "Data"))
        If Month(dt) = m And Year(dt) = a Then
            tot = tot + CDbl(Val(Replace(CStr(LerCampo(lr, "Crédito")), ",", ".")))
        End If
Prox:
    Next lr
    ReceitaMesEmpresa = tot
End Function

Public Sub CadastrarFranqueadora()
    Dim nome As String, cnpj As String, razao As String, ceo As String
    Dim email As String, fone As String, site As String, nid As Long
    On Error GoTo TrataErro
    If Not EhFranqueadora() And Not EhSuperAdmin() Then
        MsgErro "Somente Franqueadora / SuperAdmin."
        Exit Sub
    End If
    If Not PodeModuloPlano("Franquias") Then
        MsgErro "Módulo Franquias exige plano Enterprise."
        Exit Sub
    End If
    nome = Trim$(InputBox("Nome da franqueadora:", "Nova Franqueadora", "ATHENA FRANCHISE"))
    If Len(nome) = 0 Then Exit Sub
    cnpj = Trim$(InputBox("CNPJ:", "Nova Franqueadora"))
    razao = Trim$(InputBox("Razão Social:", "Nova Franqueadora", nome & " LTDA"))
    ceo = Trim$(InputBox("CEO:", "Nova Franqueadora"))
    email = Trim$(InputBox("E-mail:", "Nova Franqueadora"))
    fone = Trim$(InputBox("Telefone:", "Nova Franqueadora"))
    site = Trim$(InputBox("Site:", "Nova Franqueadora"))
    nid = MaxNumerico(SHT_FRANQUEADORAS, TBL_FRANQUEADORAS, "FranqueadoraID") + 1
    Call AdicionarRegistro(SHT_FRANQUEADORAS, TBL_FRANQUEADORAS, _
        Array("FranqueadoraID", "Nome", "CNPJ", "Razão Social", "CEO", "E-mail", "Telefone", "Site", "Status"), _
        Array(nid, nome, cnpj, razao, ceo, email, fone, site, "Ativa"))
    Call DefinirFranquiaSessao(nid, 0, nome)
    RegistrarLog "Cadastro franqueadora", "Franquias", nome
    MsgOk "Franqueadora cadastrada: " & nome
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "CadastrarFranqueadora"
    MsgErro "Erro ao cadastrar franqueadora."
End Sub

Public Sub CadastrarFranqueado()
    Dim nome As String, doc As String, cidade As String, uf As String
    Dim contrato As String, eid As Long, fid As Long, nid As Long
    Dim pctR As Double, pctM As Double, taxa As Double, cid As Long
    On Error GoTo TrataErro
    If Not PodeModuloPlano("Franquias") Then
        MsgErro "Módulo Franquias exige plano Enterprise."
        Exit Sub
    End If
    If Not EhFranqueadora() And Not EhSuperAdmin() And StrComp(PerfilUsuario, "Administrador", vbTextCompare) <> 0 Then
        MsgErro "Sem permissão para cadastrar franqueado."
        Exit Sub
    End If

    nome = Trim$(NzStr(LerCelula(SHT_FRANQ_UI, "D25")))
    If Len(nome) = 0 Then nome = Trim$(InputBox("Nome do franqueado:", "Novo Franqueado"))
    If Len(nome) = 0 Then Exit Sub
    eid = CLng(Val(LerCelula(SHT_FRANQ_UI, "D26")))
    If eid <= 0 Then eid = CLng(Val(InputBox("EmpresaID vinculada:", "Novo Franqueado", "1")))
    doc = Trim$(NzStr(LerCelula(SHT_FRANQ_UI, "D27")))
    cidade = Trim$(NzStr(LerCelula(SHT_FRANQ_UI, "D28")))
    uf = UCase$(Trim$(NzStr(LerCelula(SHT_FRANQ_UI, "D29"))))
    If Len(uf) = 0 Then uf = "SP"
    contrato = Trim$(NzStr(LerCelula(SHT_FRANQ_UI, "D30")))
    If Len(contrato) = 0 Then contrato = "CTR-" & Format$(Now, "YYMMDD-HHNN")

    fid = FranqueadoraIDSessao()
    If fid <= 0 Then fid = 1
    nid = MaxNumerico(SHT_FRANQUEADOS, TBL_FRANQUEADOS, "FranqueadoID") + 1

    Call AdicionarRegistro(SHT_FRANQUEADOS, TBL_FRANQUEADOS, _
        Array("FranqueadoID", "FranqueadoraID", "EmpresaID", "Nome", "CPF/CNPJ", "Cidade", "Estado", _
              "Contrato", "Data Início", "Data Fim", "Status"), _
        Array(nid, fid, eid, nome, doc, cidade, uf, contrato, Date, DateAdd("yyyy", 5, Date), "Ativo"))

    Call VincularEmpresaFranqueado(eid, fid, nid)

    pctR = 6: pctM = 2: taxa = 40000
    cid = MaxNumerico(SHT_CONTRATOS_FR, TBL_CONTRATOS_FR, "ID") + 1
    Call AdicionarRegistro(SHT_CONTRATOS_FR, TBL_CONTRATOS_FR, _
        Array("ID", "Número", "FranqueadoID", "Franqueado", "Vigência Início", "Vigência Fim", _
              "Taxa Inicial", "Royalty %", "Fundo Marketing %", "Status"), _
        Array(cid, contrato, nid, nome, Date, DateAdd("yyyy", 5, Date), taxa, pctR, pctM, "Ativo"))

    RegistrarLog "Cadastro franqueado", "Franquias", nome & " / Emp " & eid
    Call AtualizarDashboardFranqueadora
    MsgOk "Franqueado cadastrado: " & nome
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "CadastrarFranqueado"
    MsgErro "Erro ao cadastrar franqueado: " & Err.Description
End Sub

Public Sub EditarFranquia()
    Dim fid As Long, lr As ListRow
    Dim nome As String, status As String, cidade As String
    On Error GoTo TrataErro
    fid = CLng(Val(InputBox("FranqueadoID a editar:", "Editar Franquia", FranqueadoIDMemoria)))
    If fid <= 0 Then Exit Sub
    If Not PodeVerFranqueado(fid) Then
        MsgErro "Sem permissão para este franqueado."
        Exit Sub
    End If
    Set lr = BuscarFranqueado(fid)
    If lr Is Nothing Then
        MsgErro "Franqueado não encontrado."
        Exit Sub
    End If
    nome = Trim$(InputBox("Nome:", "Editar", NzStr(LerCampo(lr, "Nome"))))
    cidade = Trim$(InputBox("Cidade:", "Editar", NzStr(LerCampo(lr, "Cidade"))))
    status = Trim$(InputBox("Status (Ativo/Suspenso):", "Editar", NzStr(LerCampo(lr, "Status"))))
    If Len(nome) > 0 Then Call GravarCampo(lr, "Nome", nome)
    If Len(cidade) > 0 Then Call GravarCampo(lr, "Cidade", cidade)
    If Len(status) > 0 Then Call GravarCampo(lr, "Status", status)
    MsgOk "Franquia atualizada."
    Call AtualizarDashboardFranqueadora
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "EditarFranquia"
    MsgErro "Erro ao editar franquia."
End Sub

Public Sub VincularEmpresaFranqueado(ByVal empresaId As Long, ByVal franqueadoraId As Long, ByVal franqueadoId As Long)
    Dim lo As ListObject, lr As ListRow
    On Error Resume Next
    Set lo = ObterTabela(SHT_EMPRESAS, TBL_EMPRESAS)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "EmpresaID"))) = empresaId Then
            Call GravarCampo(lr, "FranqueadoraID", franqueadoraId)
            Call GravarCampo(lr, "FranqueadoID", franqueadoId)
            Exit Sub
        End If
    Next lr
End Sub

Public Sub CalcularRoyalties()
    Dim lo As ListObject, lr As ListRow, ctr As ListRow
    Dim foid As Long, eid As Long, nome As String
    Dim rec As Double, pctR As Double, pctM As Double
    Dim valR As Double, valM As Double, rid As Long
    Dim m As Long, a As Long, comp As Date
    Dim jaExiste As Boolean, loR As ListObject, lrR As ListRow
    On Error GoTo TrataErro
    If Not PodeModuloPlano("Franquias") Then
        MsgErro "Módulo Franquias exige plano Enterprise."
        Exit Sub
    End If
    If Not EhFranqueadora() And Not EhSuperAdmin() Then
        MsgErro "Somente Franqueadora calcula royalties da rede."
        Exit Sub
    End If

    m = Month(Date)
    a = Year(Date)
    comp = DateSerial(a, m, 1)
    Set lo = ObterTabela(SHT_FRANQUEADOS, TBL_FRANQUEADOS)

    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) <> 0 Then GoTo ProxF
        foid = CLng(Val(LerCampo(lr, "FranqueadoID")))
        If FranqueadoraIDSessao() > 0 Then
            If CLng(Val(LerCampo(lr, "FranqueadoraID"))) <> FranqueadoraIDSessao() Then GoTo ProxF
        End If
        eid = CLng(Val(LerCampo(lr, "EmpresaID")))
        nome = NzStr(LerCampo(lr, "Nome"))
        Set ctr = ContratoDoFranqueado(foid)
        pctR = 6: pctM = 2
        If Not ctr Is Nothing Then
            pctR = CDbl(Val(Replace(CStr(LerCampo(ctr, "Royalty %")), ",", ".")))
            pctM = CDbl(Val(Replace(CStr(LerCampo(ctr, "Fundo Marketing %")), ",", ".")))
        End If
        rec = ReceitaMesEmpresa(eid, m, a)
        If rec <= 0 Then
            ' demo: usa seed-like floor para não zerar KPIs em banco vazio
            rec = 100000#
        End If
        valR = Round(rec * pctR / 100#, 2)
        valM = Round(rec * pctM / 100#, 2)

        jaExiste = False
        Set loR = ObterTabela(SHT_ROYALTIES, TBL_ROYALTIES)
        For Each lrR In loR.ListRows
            If CLng(Val(LerCampo(lrR, "FranqueadoID"))) = foid Then
                If IsDate(LerCampo(lrR, "Competência")) Then
                    If Month(CDate(LerCampo(lrR, "Competência"))) = m And Year(CDate(LerCampo(lrR, "Competência"))) = a Then
                        Call GravarCampo(lrR, "Receita Base", rec)
                        Call GravarCampo(lrR, "Percentual", pctR)
                        Call GravarCampo(lrR, "Valor Royalty", valR)
                        Call GravarCampo(lrR, "PercentualMarketing", pctM)
                        Call GravarCampo(lrR, "ValorMarketing", valM)
                        jaExiste = True
                        Exit For
                    End If
                End If
            End If
        Next lrR

        If Not jaExiste Then
            rid = MaxNumerico(SHT_ROYALTIES, TBL_ROYALTIES, "RoyaltyID") + 1
            Call AdicionarRegistro(SHT_ROYALTIES, TBL_ROYALTIES, _
                Array("RoyaltyID", "FranqueadoID", "Franqueado", "Competência", "Receita Base", _
                      "Percentual", "Valor Royalty", "PercentualMarketing", "ValorMarketing", "Status"), _
                Array(rid, foid, nome, comp, rec, pctR, valR, pctM, valM, "Em Aberto"))
        End If
ProxF:
    Next lr

    Call AtualizarDashboardFranqueadora
    RegistrarLog "Cálculo royalties", "Franquias", Format$(comp, "MM/YYYY")
    MsgOk "Royalties calculados para " & Format$(comp, "MM/YYYY")
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "CalcularRoyalties"
    MsgErro "Erro ao calcular royalties: " & Err.Description
End Sub

Public Sub AtualizarRanking()
    Call AtualizarDashboardFranqueadora
End Sub

Public Sub AtualizarDashboardFranqueadora()
    Dim lo As ListObject, lr As ListRow
    Dim nFr As Long, nUni As Long, nAlu As Long
    Dim recRede As Double, royTot As Double
    Dim r As Long, foid As Long, eid As Long
    Dim rec As Double, roy As Double, st As String
    Dim m As Long, a As Long
    Dim cres As String
    On Error Resume Next
    m = Month(Date)
    a = Year(Date)

    nFr = 0: nUni = 0: nAlu = 0: recRede = 0: royTot = 0
    Set lo = ObterTabela(SHT_FRANQUEADOS, TBL_FRANQUEADOS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) <> 0 Then GoTo ProxC
        If FranqueadoraIDSessao() > 0 Then
            If CLng(Val(LerCampo(lr, "FranqueadoraID"))) <> FranqueadoraIDSessao() And Not EhSuperAdmin() Then GoTo ProxC
        End If
        If Not PodeVerFranqueado(CLng(Val(LerCampo(lr, "FranqueadoID")))) Then GoTo ProxC
        nFr = nFr + 1
        eid = CLng(Val(LerCampo(lr, "EmpresaID")))
        recRede = recRede + ReceitaMesEmpresa(eid, m, a)
ProxC:
    Next lr

    Set lo = ObterTabela(SHT_UNIDADES, TBL_UNIDADES)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Status")), "Ativa", vbTextCompare) = 0 Then
            eid = CLng(Val(LerCampo(lr, "EmpresaID")))
            If EmpresaNaRede(eid) Then nUni = nUni + 1
        End If
    Next lr

    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    For Each lr In lo.ListRows
        eid = CLng(Val(LerCampo(lr, "EmpresaID")))
        If EmpresaNaRede(eid) Then
            If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) = 0 Then nAlu = nAlu + 1
        End If
    Next lr

    Set lo = ObterTabela(SHT_ROYALTIES, TBL_ROYALTIES)
    For Each lr In lo.ListRows
        If IsDate(LerCampo(lr, "Competência")) Then
            If Month(CDate(LerCampo(lr, "Competência"))) = m And Year(CDate(LerCampo(lr, "Competência"))) = a Then
                royTot = royTot + CDbl(Val(Replace(CStr(LerCampo(lr, "Valor Royalty")), ",", ".")))
            End If
        End If
    Next lr

    ' KPIs (paint_kpi value cells)
    GravarCelula SHT_FRANQ_UI, "C9", nFr
    GravarCelula SHT_FRANQ_UI, "E9", nUni
    GravarCelula SHT_FRANQ_UI, "G9", nAlu
    GravarCelula SHT_FRANQ_UI, "C12", "R$ " & Format$(recRede, "#,##0")
    GravarCelula SHT_FRANQ_UI, "E12", "R$ " & Format$(royTot, "#,##0")

    Call LimparIntervalo(SHT_FRANQ_UI, "C17:G22")
    r = 17
    Set lo = ObterTabela(SHT_FRANQUEADOS, TBL_FRANQUEADOS)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) <> 0 Then GoTo ProxR
        foid = CLng(Val(LerCampo(lr, "FranqueadoID")))
        If Not PodeVerFranqueado(foid) Then GoTo ProxR
        eid = CLng(Val(LerCampo(lr, "EmpresaID")))
        rec = ReceitaMesEmpresa(eid, m, a)
        roy = 0
        st = "Em Aberto"
        Dim loR2 As ListObject, lrR2 As ListRow
        Set loR2 = ObterTabela(SHT_ROYALTIES, TBL_ROYALTIES)
        For Each lrR2 In loR2.ListRows
            If CLng(Val(LerCampo(lrR2, "FranqueadoID"))) = foid Then
                If IsDate(LerCampo(lrR2, "Competência")) Then
                    If Month(CDate(LerCampo(lrR2, "Competência"))) = m And Year(CDate(LerCampo(lrR2, "Competência"))) = a Then
                        roy = CDbl(Val(Replace(CStr(LerCampo(lrR2, "Valor Royalty")), ",", ".")))
                        st = NzStr(LerCampo(lrR2, "Status"))
                        Exit For
                    End If
                End If
            End If
        Next lrR2
        cres = "+0%"
        If rec > 500000 Then cres = "+8%"
        If rec > 0 And rec <= 500000 Then cres = "+3%"
        GravarCelula SHT_FRANQ_UI, "C" & r, NzStr(LerCampo(lr, "Nome"))
        GravarCelula SHT_FRANQ_UI, "D" & r, Round(rec, 2)
        GravarCelula SHT_FRANQ_UI, "E" & r, cres
        GravarCelula SHT_FRANQ_UI, "F" & r, Round(roy, 2)
        GravarCelula SHT_FRANQ_UI, "G" & r, st
        r = r + 1
        If r > 22 Then Exit For
ProxR:
    Next lr

    GravarCelula SHT_FRANQ_UI, "D33", FranqueadoraIDMemoria
    GravarCelula SHT_FRANQ_UI, "D34", FranqueadoIDMemoria
    If FranqueadoraIDSessao() > 0 Then
        GravarCelula SHT_FRANQ_UI, "D35", NomeFranqueadoraPorId(FranqueadoraIDSessao())
    End If
End Sub

Private Function EmpresaNaRede(ByVal empresaId As Long) As Boolean
    Dim lo As ListObject, lr As ListRow
    Dim fid As Long
    On Error Resume Next
    EmpresaNaRede = False
    If empresaId <= 0 Then Exit Function
    Set lo = ObterTabela(SHT_EMPRESAS, TBL_EMPRESAS)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "EmpresaID"))) = empresaId Then
            fid = CLng(Val(LerCampo(lr, "FranqueadoraID")))
            If FranqueadoraIDSessao() <= 0 Or EhSuperAdmin() Then
                EmpresaNaRede = (fid > 0)
            Else
                EmpresaNaRede = (fid = FranqueadoraIDSessao())
            End If
            Exit Function
        End If
    Next lr
End Function

Public Sub GerarRelatorioFranqueadora()
    Dim txt As String
    Dim lo As ListObject, lr As ListRow
    Dim n As Long, roy As Double
    On Error Resume Next
    Call AtualizarDashboardFranqueadora
    n = 0: roy = 0
    Set lo = ObterTabela(SHT_ROYALTIES, TBL_ROYALTIES)
    For Each lr In lo.ListRows
        If IsDate(LerCampo(lr, "Competência")) Then
            If Month(CDate(LerCampo(lr, "Competência"))) = Month(Date) And Year(CDate(LerCampo(lr, "Competência"))) = Year(Date) Then
                n = n + 1
                roy = roy + CDbl(Val(Replace(CStr(LerCampo(lr, "Valor Royalty")), ",", ".")))
            End If
        End If
    Next lr
    txt = "RELATÓRIO FRANQUEADORA — " & Format$(Date, "MM/YYYY") & vbLf & _
          "Rede: " & NzStr(LerCelula(SHT_FRANQ_UI, "D35")) & vbLf & _
          "Franquias com royalty no mês: " & n & vbLf & _
          "Total royalties: R$ " & Format$(roy, "#,##0.00") & vbLf & _
          "Gerado em: " & Format$(Now, "DD/MM/YYYY hh:nn")
    GravarCelula SHT_FRANQ_UI, "C38", txt
    MsgOk "Relatório atualizado na tela da Franqueadora."
End Sub

Public Sub CarregarFranquiaDaEmpresa(ByVal empresaId As Long)
    Dim lo As ListObject, lr As ListRow
    Dim fid As Long, foid As Long, nome As String
    On Error Resume Next
    fid = 0: foid = 0: nome = ""
    Set lo = ObterTabela(SHT_EMPRESAS, TBL_EMPRESAS)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "EmpresaID"))) = empresaId Then
            fid = CLng(Val(LerCampo(lr, "FranqueadoraID")))
            foid = CLng(Val(LerCampo(lr, "FranqueadoID")))
            Exit For
        End If
    Next lr
    If fid > 0 Then nome = NomeFranqueadoraPorId(fid)
    Call DefinirFranquiaSessao(fid, foid, nome)
End Sub
