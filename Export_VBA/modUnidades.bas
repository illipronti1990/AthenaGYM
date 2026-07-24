Attribute VB_Name = "modUnidades"
Option Explicit

'============================================================
' Épico 2 — Multiunidade (filiais)
'============================================================

Public Const SHT_UNIDADES_UI As String = "40_UNIDADES"
Public Const SHT_PARAM_UNIDADE As String = "BD_PARAMETROS_UNIDADE"
Public Const TBL_PARAM_UNIDADE As String = "tbParametrosUnidade"
Public Const SHT_PROF_UNIDADE As String = "BD_PROFESSOR_UNIDADE"
Public Const TBL_PROF_UNIDADE As String = "tbProfessorUnidade"
Public Const SHT_TRANSF As String = "BD_TRANSFERENCIAS"
Public Const TBL_TRANSF As String = "tbTransferencias"
Public Const SHT_USR_UNIDADE As String = "BD_USUARIO_UNIDADE"
Public Const TBL_USR_UNIDADE As String = "tbUsuarioUnidade"

Public Sub IrUnidades(): NavegarPara SHT_UNIDADES_UI: End Sub

Public Function UnidadeIDSessao() As Long
    UnidadeIDSessao = CLng(Val(UnidadeIDMemoria))
End Function

Public Function NomeUnidadeSessao() As String
    NomeUnidadeSessao = NzStr(NomeUnidadeMemoria)
End Function

Public Function ObterCodigoUnidade(Optional ByVal unidadeId As Long = -1) As String
    Dim lo As ListObject, lr As ListRow
    Dim uid As Long
    On Error Resume Next
    uid = unidadeId
    If uid < 0 Then uid = UnidadeIDSessao()
    If uid <= 0 Then uid = 1
    Set lo = ObterTabela(SHT_UNIDADES, TBL_UNIDADES)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "ID"))) = uid Then
            ObterCodigoUnidade = UCase$(NzStr(LerCampo(lr, "Código")))
            If Len(ObterCodigoUnidade) = 0 Then ObterCodigoUnidade = "MX"
            Exit Function
        End If
    Next lr
    ObterCodigoUnidade = "MX"
End Function

Public Function NomeUnidadePorId(ByVal unidadeId As Long) As String
    Dim lo As ListObject, lr As ListRow
    On Error Resume Next
    Set lo = ObterTabela(SHT_UNIDADES, TBL_UNIDADES)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "ID"))) = unidadeId Then
            NomeUnidadePorId = NzStr(LerCampo(lr, "Nome"))
            Exit Function
        End If
    Next lr
    NomeUnidadePorId = ""
End Function

Public Function BuscarUnidade(ByVal unidadeId As Long) As ListRow
    Dim lo As ListObject, lr As ListRow
    Set BuscarUnidade = Nothing
    On Error Resume Next
    Set lo = ObterTabela(SHT_UNIDADES, TBL_UNIDADES)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "ID"))) = unidadeId Then
            Set BuscarUnidade = lr
            Exit Function
        End If
    Next lr
End Function

Public Sub DefinirUnidadeSessao(ByVal unidadeId As Long, Optional ByVal nome As String = "")
    Dim n As String
    n = nome
    If Len(Trim$(n)) = 0 And unidadeId > 0 Then n = NomeUnidadePorId(unidadeId)
    If unidadeId <= 0 Then
        UnidadeIDMemoria = "0"
        NomeUnidadeMemoria = "Todas as unidades"
    Else
        UnidadeIDMemoria = CStr(unidadeId)
        NomeUnidadeMemoria = n
    End If
    On Error Resume Next
    ThisWorkbook.Sheets("BD_SESSAO").Range("B8").Value = UnidadeIDMemoria
    ThisWorkbook.Sheets("BD_SESSAO").Range("B9").Value = NomeUnidadeMemoria
    GravarCelula SHT_UNIDADES_UI, "D18", UnidadeIDMemoria
    GravarCelula SHT_UNIDADES_UI, "D19", NomeUnidadeMemoria
    On Error GoTo 0
End Sub

Public Sub TrocarUnidade()
    Dim lo As ListObject, lr As ListRow
    Dim lista As String, escolha As String
    Dim uid As Long, eid As Long
    On Error GoTo TrataErro
    If Not SessaoAtiva() Then
        MsgErro "Faça login antes de trocar a unidade."
        Exit Sub
    End If
    If Not PodeModuloPlano("Multiunidade") And Not EhSuperAdmin() Then
        MsgErro "Multiunidade disponível no plano Enterprise."
        Exit Sub
    End If
    eid = EmpresaIDSessao()
    If eid = 0 And Not EhSuperAdmin() Then eid = 1

    lista = ""
    If PodeVerUnidade(0) Then lista = "0|Todas as unidades"
    Set lo = ObterTabela(SHT_UNIDADES, TBL_UNIDADES)
    For Each lr In lo.ListRows
        If Not PertenceEmpresa(lr) And Not EhSuperAdmin() Then GoTo Prox
        If StrComp(NzStr(LerCampo(lr, "Status")), "Ativa", vbTextCompare) <> 0 Then GoTo Prox
        If eid > 0 And CLng(Val(LerCampo(lr, "EmpresaID"))) <> eid And Not EhSuperAdmin() Then GoTo Prox
        If Not PodeVerUnidade(CLng(Val(LerCampo(lr, "ID")))) Then GoTo Prox
        If Len(lista) > 0 Then lista = lista & vbCrLf
        lista = lista & CStr(LerCampo(lr, "ID")) & "|" & NzStr(LerCampo(lr, "Nome")) & " (" & NzStr(LerCampo(lr, "Código")) & ")"
Prox:
    Next lr

    escolha = InputBox("Digite o UnidadeID:" & vbCrLf & vbCrLf & lista, "Trocar Unidade", UnidadeIDMemoria)
    If Len(Trim$(escolha)) = 0 Then Exit Sub
    uid = CLng(Val(escolha))
    If uid > 0 And BuscarUnidade(uid) Is Nothing Then
        MsgErro "UnidadeID inválido."
        Exit Sub
    End If
    If Not PodeVerUnidade(uid) Then
        MsgErro "Sem permissão para esta unidade."
        Exit Sub
    End If
    Call DefinirUnidadeSessao(uid)
    On Error Resume Next
    Call AtualizarDashboardUnidades
    Call AtualizarEstoque
    Call AtualizarAgenda
    Call AtualizarCRM
    On Error GoTo TrataErro
    MsgOk "Unidade ativa: " & NomeUnidadeMemoria
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "TrocarUnidade"
    MsgErro "Erro ao trocar unidade."
End Sub

Public Sub CadastrarUnidade()
    Dim nome As String, codigo As String, cidade As String
    Dim resp As String, fone As String, status As String
    Dim eid As Long, nid As Long
    On Error GoTo TrataErro
    If Not SessaoAtiva() Then
        MsgErro "Faça login."
        Exit Sub
    End If
    If Not PodeModuloPlano("Multiunidade") And Not EhSuperAdmin() Then
        MsgErro "Multiunidade disponível no plano Enterprise."
        Exit Sub
    End If
    If StrComp(PerfilUsuario, "Administrador", vbTextCompare) <> 0 And Not EhSuperAdmin() Then
        MsgErro "Somente Administrador cadastra unidades."
        Exit Sub
    End If

    nome = Trim$(NzStr(LerCelula(SHT_UNIDADES_UI, "D9")))
    codigo = UCase$(Trim$(NzStr(LerCelula(SHT_UNIDADES_UI, "D10"))))
    cidade = Trim$(NzStr(LerCelula(SHT_UNIDADES_UI, "D11")))
    resp = Trim$(NzStr(LerCelula(SHT_UNIDADES_UI, "D12")))
    fone = Trim$(NzStr(LerCelula(SHT_UNIDADES_UI, "D13")))
    status = Trim$(NzStr(LerCelula(SHT_UNIDADES_UI, "D14")))
    If Len(status) = 0 Then status = "Ativa"
    If Len(nome) = 0 Or Len(codigo) = 0 Then
        MsgErro "Informe Nome e Código."
        Exit Sub
    End If

    eid = EmpresaIDSessao()
    If eid <= 0 Then eid = 1
    nid = MaxNumerico(SHT_UNIDADES, TBL_UNIDADES, "ID") + 1

    Call AdicionarRegistro(SHT_UNIDADES, TBL_UNIDADES, _
        Array("ID", "EmpresaID", "Nome", "Código", "CNPJ", "Telefone", "WhatsApp", "Email", "CEP", "Endereço", "Cidade", "Estado", "Responsável", "Status", "DataCadastro"), _
        Array(nid, eid, nome, codigo, "", fone, fone, "", "", "", cidade, "SP", resp, status, Date))

    Call DefinirUnidadeSessao(nid, nome)
    RegistrarLog "Cadastro unidade", "Unidades", nome & " / " & codigo
    MsgOk "Unidade cadastrada: " & nome & " (" & codigo & ")"
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "CadastrarUnidade"
    MsgErro "Erro ao cadastrar unidade: " & Err.Description
End Sub

Public Sub EditarUnidade()
    Dim uid As Long, lr As ListRow
    On Error GoTo TrataErro
    uid = CLng(Val(LerCelula(SHT_UNIDADES_UI, "D18")))
    If uid <= 0 Then
        MsgErro "Selecione uma unidade (TrocarUnidade) para editar."
        Exit Sub
    End If
    Set lr = BuscarUnidade(uid)
    If lr Is Nothing Then
        MsgErro "Unidade não encontrada."
        Exit Sub
    End If
    Call EditarRegistro(lr, _
        Array("Nome", "Código", "Cidade", "Responsável", "Telefone", "Status"), _
        Array(NzStr(LerCelula(SHT_UNIDADES_UI, "D9")), UCase$(NzStr(LerCelula(SHT_UNIDADES_UI, "D10"))), _
              NzStr(LerCelula(SHT_UNIDADES_UI, "D11")), NzStr(LerCelula(SHT_UNIDADES_UI, "D12")), _
              NzStr(LerCelula(SHT_UNIDADES_UI, "D13")), NzStr(LerCelula(SHT_UNIDADES_UI, "D14"))))
    Call DefinirUnidadeSessao(uid, NzStr(LerCelula(SHT_UNIDADES_UI, "D9")))
    MsgOk "Unidade atualizada."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "EditarUnidade"
    MsgErro "Erro ao editar unidade."
End Sub

Public Sub AtualizarTelaUnidades()
    On Error Resume Next
    GravarCelula SHT_UNIDADES_UI, "D18", UnidadeIDMemoria
    GravarCelula SHT_UNIDADES_UI, "D19", NomeUnidadeMemoria
    If UnidadeIDSessao() > 0 Then
        Dim lr As ListRow
        Set lr = BuscarUnidade(UnidadeIDSessao())
        If Not lr Is Nothing Then
            GravarCelula SHT_UNIDADES_UI, "D9", NzStr(LerCampo(lr, "Nome"))
            GravarCelula SHT_UNIDADES_UI, "D10", NzStr(LerCampo(lr, "Código"))
            GravarCelula SHT_UNIDADES_UI, "D11", NzStr(LerCampo(lr, "Cidade"))
            GravarCelula SHT_UNIDADES_UI, "D12", NzStr(LerCampo(lr, "Responsável"))
            GravarCelula SHT_UNIDADES_UI, "D13", NzStr(LerCampo(lr, "Telefone"))
            GravarCelula SHT_UNIDADES_UI, "D14", NzStr(LerCampo(lr, "Status"))
        End If
    End If
End Sub

Public Function ObterParametroUnidade(ByVal chave As String, Optional ByVal padrao As String = "", Optional ByVal unidadeId As Long = -1) As String
    Dim lo As ListObject, lr As ListRow
    Dim uid As Long
    On Error Resume Next
    uid = unidadeId
    If uid < 0 Then uid = UnidadeIDSessao()
    If uid <= 0 Then uid = 1
    Set lo = ObterTabela(SHT_PARAM_UNIDADE, TBL_PARAM_UNIDADE)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "UnidadeID"))) = uid Then
            If StrComp(NzStr(LerCampo(lr, "Chave")), chave, vbTextCompare) = 0 Then
                ObterParametroUnidade = NzStr(LerCampo(lr, "Valor"))
                Exit Function
            End If
        End If
    Next lr
    ObterParametroUnidade = padrao
End Function

Public Sub CriarUnidadeMatrizBootstrap(ByVal empresaId As Long, ByVal fantasia As String, ByVal cidade As String)
    Dim nid As Long
    On Error Resume Next
    If Not TabelaExiste(SHT_UNIDADES, TBL_UNIDADES) Then Exit Sub
    nid = MaxNumerico(SHT_UNIDADES, TBL_UNIDADES, "ID") + 1
    Call AdicionarRegistro(SHT_UNIDADES, TBL_UNIDADES, _
        Array("ID", "EmpresaID", "Nome", "Código", "CNPJ", "Telefone", "WhatsApp", "Email", "CEP", "Endereço", "Cidade", "Estado", "Responsável", "Status", "DataCadastro"), _
        Array(nid, empresaId, fantasia & " Matriz", "MX", "", "", "", "", "", "", cidade, "SP", "", "Ativa", Date))
End Sub

'------------------------------------------------------------
' Sprint C/D — permissões, professores, transferências, KPIs
'------------------------------------------------------------
Public Function PodeVerUnidade(ByVal unidadeId As Long) As Boolean
    Dim lo As ListObject, lr As ListRow
    Dim home As Long, usr As String
    On Error Resume Next
    If EhSuperAdmin() Then PodeVerUnidade = True: Exit Function
    If StrComp(PerfilUsuario, "Administrador", vbTextCompare) = 0 Then
        PodeVerUnidade = True
        Exit Function
    End If
    home = CLng(Val(UnidadeIDMemoria))
    If unidadeId = 0 Then
        PodeVerUnidade = (home = 0)
        Exit Function
    End If
    If home = 0 Then PodeVerUnidade = True: Exit Function
    If home = unidadeId Then PodeVerUnidade = True: Exit Function

    usr = LCase$(NzStr(UsuarioLogado))
    If Len(usr) = 0 Then usr = LCase$(NzStr(LerCelula("BD_SESSAO", "B2")))
    If Not TabelaExiste(SHT_USR_UNIDADE, TBL_USR_UNIDADE) Then
        PodeVerUnidade = False
        Exit Function
    End If
    Set lo = ObterTabela(SHT_USR_UNIDADE, TBL_USR_UNIDADE)
    For Each lr In lo.ListRows
        If StrComp(LCase$(NzStr(LerCampo(lr, "Usuário"))), usr, vbTextCompare) = 0 Then
            If CLng(Val(LerCampo(lr, "UnidadeID"))) = unidadeId Then
                If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) = 0 Then
                    PodeVerUnidade = True
                    Exit Function
                End If
            End If
        End If
    Next lr
    PodeVerUnidade = False
End Function

Public Function ProfessorAtuaNaUnidade(ByVal professorId As String, ByVal unidadeId As Long) As Boolean
    Dim lo As ListObject, lr As ListRow
    On Error Resume Next
    ProfessorAtuaNaUnidade = False
    If unidadeId <= 0 Then ProfessorAtuaNaUnidade = True: Exit Function
    If Not TabelaExiste(SHT_PROF_UNIDADE, TBL_PROF_UNIDADE) Then
        ProfessorAtuaNaUnidade = True
        Exit Function
    End If
    Set lo = ObterTabela(SHT_PROF_UNIDADE, TBL_PROF_UNIDADE)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "ProfessorID")), professorId, vbTextCompare) = 0 Or _
           StrComp(NzStr(LerCampo(lr, "Professor")), professorId, vbTextCompare) = 0 Then
            If CLng(Val(LerCampo(lr, "UnidadeID"))) = unidadeId Then
                If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) = 0 Then
                    ProfessorAtuaNaUnidade = True
                    Exit Function
                End If
            End If
        End If
    Next lr
End Function

Public Sub VincularProfessorUnidade()
    Dim pid As String, nome As String, uid As Long, nid As Long
    Dim lo As ListObject, lr As ListRow
    On Error GoTo TrataErro
    If Not PodeAcessar("Professores") Then Call ExigeAcesso("Professores"): Exit Sub
    pid = Trim$(InputBox("ID do professor (ex: P001):", "Vincular Professor × Unidade"))
    If Len(pid) = 0 Then Exit Sub
    nome = Trim$(InputBox("Nome do professor:", "Vincular", pid))
    uid = CLng(Val(InputBox("UnidadeID destino:", "Vincular", CStr(UnidadeIDSessao()))))
    If uid <= 0 Or BuscarUnidade(uid) Is Nothing Then
        MsgErro "UnidadeID inválido."
        Exit Sub
    End If
    If TabelaExiste(SHT_PROF_UNIDADE, TBL_PROF_UNIDADE) Then
        Set lo = ObterTabela(SHT_PROF_UNIDADE, TBL_PROF_UNIDADE)
        For Each lr In lo.ListRows
            If StrComp(NzStr(LerCampo(lr, "ProfessorID")), pid, vbTextCompare) = 0 And _
               CLng(Val(LerCampo(lr, "UnidadeID"))) = uid Then
                Call GravarCampo(lr, "Status", "Ativo")
                Call GravarCampo(lr, "Professor", nome)
                MsgOk "Vínculo já existia — reativado."
                Exit Sub
            End If
        Next lr
    End If
    nid = MaxNumerico(SHT_PROF_UNIDADE, TBL_PROF_UNIDADE, "ID") + 1
    Call AdicionarRegistro(SHT_PROF_UNIDADE, TBL_PROF_UNIDADE, _
        Array("ID", "ProfessorID", "Professor", "UnidadeID", "Unidade", "Status"), _
        Array(nid, pid, nome, uid, NomeUnidadePorId(uid), "Ativo"))
    RegistrarLog "Professor×Unidade", "Unidades", pid & " → " & uid
    MsgOk "Professor vinculado à unidade " & NomeUnidadePorId(uid)
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "VincularProfessorUnidade"
    MsgErro "Erro ao vincular professor."
End Sub

Public Function ContarAlunosUnidade(ByVal unidadeId As Long, Optional ByVal statusFiltro As String = "Ativo") As Long
    Dim lo As ListObject, lr As ListRow
    Dim n As Long, uid As Long
    On Error Resume Next
    Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    For Each lr In lo.ListRows
        If Not PertenceEmpresa(lr) Then GoTo Prox
        uid = CLng(Val(LerCampo(lr, "UnidadeID")))
        If unidadeId > 0 And uid <> unidadeId And uid <> 0 Then GoTo Prox
        If Len(statusFiltro) > 0 Then
            If StrComp(NzStr(LerCampo(lr, "Status")), statusFiltro, vbTextCompare) <> 0 Then GoTo Prox
        End If
        n = n + 1
Prox:
    Next lr
    ContarAlunosUnidade = n
End Function

Public Function ContarProdutosUnidade(ByVal unidadeId As Long) As Long
    Dim lo As ListObject, lr As ListRow
    Dim n As Long, uid As Long
    On Error Resume Next
    Set lo = ObterTabela(SHT_PRODUTOS, TBL_PRODUTOS)
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Código"))) = 0 Then GoTo Prox
        uid = CLng(Val(LerCampo(lr, "UnidadeID")))
        If unidadeId > 0 And uid <> unidadeId And uid <> 0 Then GoTo Prox
        n = n + 1
Prox:
    Next lr
    ContarProdutosUnidade = n
End Function

Public Function ReceitaMesUnidade(ByVal unidadeId As Long, Optional ByVal m As Long = 0, Optional ByVal a As Long = 0) As Double
    Dim lo As ListObject, lr As ListRow
    Dim tot As Double, uid As Long, dt As Date
    On Error Resume Next
    If m = 0 Then m = Month(Date)
    If a = 0 Then a = Year(Date)
    Set lo = ObterTabela(SHT_LANCAMENTOS, TBL_LANCAMENTOS)
    For Each lr In lo.ListRows
        If Not PertenceEmpresa(lr) Then GoTo Prox
        uid = CLng(Val(LerCampo(lr, "UnidadeID")))
        If unidadeId > 0 And uid <> unidadeId And uid <> 0 Then GoTo Prox
        If Not IsDate(LerCampo(lr, "Data")) Then GoTo Prox
        dt = CDate(LerCampo(lr, "Data"))
        If Month(dt) = m And Year(dt) = a Then
            tot = tot + CDbl(Val(Replace(CStr(LerCampo(lr, "Crédito")), ",", ".")))
        End If
Prox:
    Next lr
    ReceitaMesUnidade = tot
End Function

Public Sub AtualizarDashboardUnidades()
    Dim lo As ListObject, lr As ListRow
    Dim r As Long, uid As Long, nAtivas As Long
    Dim sess As Long
    On Error Resume Next
    sess = UnidadeIDSessao()
    If sess > 0 Then
        GravarCelula SHT_UNIDADES_UI, "C23", ContarAlunosUnidade(sess, "Ativo")
        GravarCelula SHT_UNIDADES_UI, "E23", "R$ " & Format$(ReceitaMesUnidade(sess), "#,##0.00")
        GravarCelula SHT_UNIDADES_UI, "G23", ContarProdutosUnidade(sess)
    Else
        GravarCelula SHT_UNIDADES_UI, "C23", ContarAlunosUnidade(0, "Ativo")
        GravarCelula SHT_UNIDADES_UI, "E23", "R$ " & Format$(ReceitaMesUnidade(0), "#,##0.00")
        GravarCelula SHT_UNIDADES_UI, "G23", ContarProdutosUnidade(0)
    End If

    Call LimparIntervalo(SHT_UNIDADES_UI, "C31:G35")
    r = 31
    nAtivas = 0
    Set lo = ObterTabela(SHT_UNIDADES, TBL_UNIDADES)
    For Each lr In lo.ListRows
        If Not PertenceEmpresa(lr) And Not EhSuperAdmin() Then GoTo ProxD
        If StrComp(NzStr(LerCampo(lr, "Status")), "Ativa", vbTextCompare) <> 0 Then GoTo ProxD
        uid = CLng(Val(LerCampo(lr, "ID")))
        If Not PodeVerUnidade(uid) And Not PodeVerUnidade(0) Then GoTo ProxD
        nAtivas = nAtivas + 1
        GravarCelula SHT_UNIDADES_UI, "C" & r, uid
        GravarCelula SHT_UNIDADES_UI, "D" & r, NzStr(LerCampo(lr, "Nome"))
        GravarCelula SHT_UNIDADES_UI, "E" & r, ContarAlunosUnidade(uid, "Ativo")
        GravarCelula SHT_UNIDADES_UI, "F" & r, Round(ReceitaMesUnidade(uid), 2)
        GravarCelula SHT_UNIDADES_UI, "G" & r, ContarProdutosUnidade(uid)
        r = r + 1
        If r > 35 Then Exit For
ProxD:
    Next lr
    GravarCelula SHT_UNIDADES_UI, "C26", nAtivas
    Call AtualizarTelaUnidades
End Sub

Public Sub TransferirEstoque()
    Call TransferirEstoqueEntreUnidades
End Sub

Public Sub TransferirEstoqueEntreUnidades()
    Dim cod As String, qtde As Double, destId As Long, origId As Long
    Dim lrOrig As ListRow, lrDest As ListRow
    Dim nid As Long, nomeProd As String
    Dim cols As Variant, vals As Variant
    On Error GoTo TrataErro
    If Not PodeAcessar("Estoque") Then Call ExigeAcesso("Estoque"): Exit Sub
    If Not PodeModuloPlano("Multiunidade") And Not EhSuperAdmin() Then
        MsgErro "Transferência entre unidades exige plano Enterprise."
        Exit Sub
    End If

    origId = UnidadeIDSessao()
    If origId <= 0 Then
        origId = CLng(Val(InputBox("UnidadeID de origem:", "Transferência", "1")))
    End If
    If origId <= 0 Or BuscarUnidade(origId) Is Nothing Then
        MsgErro "Origem inválida."
        Exit Sub
    End If
    If Not PodeVerUnidade(origId) Then
        MsgErro "Sem permissão na unidade de origem."
        Exit Sub
    End If

    destId = CLng(Val(InputBox("UnidadeID de destino:", "Transferência", "2")))
    If destId <= 0 Or destId = origId Or BuscarUnidade(destId) Is Nothing Then
        MsgErro "Destino inválido."
        Exit Sub
    End If
    If Not PodeVerUnidade(destId) And StrComp(PerfilUsuario, "Administrador", vbTextCompare) <> 0 Then
        MsgErro "Sem permissão na unidade de destino."
        Exit Sub
    End If

    cod = Trim$(InputBox("Código do produto:", "Transferência"))
    If Len(cod) = 0 Then Exit Sub
    Set lrOrig = BuscarProdutoPorCodigoUnidade(cod, origId)
    If lrOrig Is Nothing Then
        MsgAviso "Produto não encontrado na unidade de origem."
        Exit Sub
    End If
    qtde = Val(Replace(InputBox("Quantidade:", "Transferência", "1"), ",", "."))
    If qtde <= 0 Then MsgAviso "Quantidade inválida.": Exit Sub
    If Val(LerCampo(lrOrig, "Estoque Atual")) < qtde Then
        MsgAviso "Estoque insuficiente na origem."
        Exit Sub
    End If

    nomeProd = NzStr(LerCampo(lrOrig, "Produto"))
    Call GravarCampo(lrOrig, "Estoque Atual", Val(LerCampo(lrOrig, "Estoque Atual")) - qtde)

    Set lrDest = BuscarProdutoPorCodigoUnidade(cod, destId)
    If lrDest Is Nothing Then
        cols = Array("Código", "Código de Barras", "Produto", "Categoria", "Marca", "Unidade Medida", _
                     "Custo", "Preço Venda", "Estoque Atual", "Estoque Mínimo", "Estoque Máximo", _
                     "Localização", "Status", "Unidade", "UnidadeID", "Classe ABC")
        vals = Array(cod, NzStr(LerCampo(lrOrig, "Código de Barras")), nomeProd, NzStr(LerCampo(lrOrig, "Categoria")), _
                     NzStr(LerCampo(lrOrig, "Marca")), NzStr(LerCampo(lrOrig, "Unidade Medida")), _
                     Val(LerCampo(lrOrig, "Custo")), Val(LerCampo(lrOrig, "Preço Venda")), qtde, _
                     Val(LerCampo(lrOrig, "Estoque Mínimo")), Val(LerCampo(lrOrig, "Estoque Máximo")), _
                     NzStr(LerCampo(lrOrig, "Localização")), "Ativo", NomeUnidadePorId(destId), destId, _
                     NzStr(LerCampo(lrOrig, "Classe ABC")))
        Call AdicionarRegistro(SHT_PRODUTOS, TBL_PRODUTOS, cols, vals)
    Else
        Call GravarCampo(lrDest, "Estoque Atual", Val(LerCampo(lrDest, "Estoque Atual")) + qtde)
    End If

    Call RegistrarMovimentacaoUnidade(cod, nomeProd, "Transferência Saída", qtde, _
                                      "Para " & NomeUnidadePorId(destId), origId)
    Call RegistrarMovimentacaoUnidade(cod, nomeProd, "Transferência Entrada", qtde, _
                                      "De " & NomeUnidadePorId(origId), destId)

    nid = MaxNumerico(SHT_TRANSF, TBL_TRANSF, "ID") + 1
    Call AdicionarRegistro(SHT_TRANSF, TBL_TRANSF, _
        Array("ID", "Data", "Código", "Produto", "Qtde", "OrigemID", "Origem", "DestinoID", "Destino", "Usuário", "Status", "Obs"), _
        Array(nid, DataAtual(), cod, nomeProd, qtde, origId, NomeUnidadePorId(origId), destId, NomeUnidadePorId(destId), _
              UsuarioEstoquePublico(), "Concluída", "Transferência entre unidades"))

    Call AtualizarEstoque
    Call AtualizarDashboardUnidades
    RegistrarLog "Transferência estoque", "Estoque", cod & " x" & qtde & " " & origId & "→" & destId
    MsgOk "Transferência #" & nid & " concluída." & vbCrLf & _
          qtde & " un. de " & NomeUnidadePorId(origId) & " → " & NomeUnidadePorId(destId)
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "TransferirEstoqueEntreUnidades"
    MsgErro "Erro na transferência: " & Err.Description
End Sub

Public Function UsuarioEstoquePublico() As String
    Dim n As String
    On Error Resume Next
    n = NzStr(LerCelula("BD_SESSAO", "B2"))
    If Len(n) = 0 Then n = "Sistema"
    UsuarioEstoquePublico = n
End Function
