Attribute VB_Name = "modEmpresa"
Option Explicit

'============================================================
' Épico 1 — Multi-Tenant (empresas, licenças, planos, bootstrap)
'============================================================

Public Const SHT_EMPRESAS As String = "BD_EMPRESAS"
Public Const TBL_EMPRESAS As String = "tbEmpresas"
Public Const SHT_LICENCAS As String = "BD_LICENCAS"
Public Const TBL_LICENCAS As String = "tbLicencas"
Public Const SHT_CONFIG_EMP As String = "BD_CONFIG_EMPRESA"
Public Const TBL_CONFIG_EMP As String = "tbConfigEmpresa"
Public Const SHT_MASTER As String = "38_MASTER"
Public Const SHT_NOVA_ACADEMIA As String = "39_NOVA_ACADEMIA"

Public Sub IrMaster(): NavegarPara SHT_MASTER: End Sub
Public Sub IrNovaAcademia(): NavegarPara SHT_NOVA_ACADEMIA: End Sub

Public Function EmpresaIDSessao() As Long
    EmpresaIDSessao = CLng(Val(EmpresaIDMemoria))
End Function

Public Function EhSuperAdmin() As Boolean
    EhSuperAdmin = (StrComp(PerfilUsuario, "SuperAdmin", vbTextCompare) = 0) Or (EmpresaIDSessao() = 0 And StrComp(PerfilUsuario, "SuperAdmin", vbTextCompare) = 0)
    If StrComp(PerfilUsuario, "SuperAdmin", vbTextCompare) = 0 Then EhSuperAdmin = True
End Function

Public Function PodeModuloPlano(ByVal modulo As String) As Boolean
    Dim plano As String
    Dim m As String
    On Error Resume Next
    If EhSuperAdmin() Then PodeModuloPlano = True: Exit Function
    plano = UCase$(Trim$(PlanoEmpresaMemoria))
    If Len(plano) = 0 Then plano = "ENTERPRISE"
    m = UCase$(Trim$(modulo))

    ' Basic: cadastros, financeiro, agenda
    Select Case m
        Case "HOME", "ALUNOS", "MENSALIDADES", "FINANCEIRO", "AGENDA", "CONFIGURACOES", "CONFIG", "RELATORIOS"
            PodeModuloPlano = True
            Exit Function
    End Select

    ' Pro+: CRM, dashboards, PDV/estoque, acesso
    If plano = "BASIC" Then
        PodeModuloPlano = False
        Exit Function
    End If
    Select Case m
        Case "CRM", "DASHBOARD", "ESTOQUE", "PDV", "ACESSO", "AVALIACAO", "TREINOS", "PROFESSORES"
            PodeModuloPlano = True
            Exit Function
    End Select

    ' Enterprise: Athena, Portal, API/Sync, Master (só super)
    If plano = "PRO" Then
        PodeModuloPlano = False
        Exit Function
    End If
    Select Case m
        Case "ATHENA", "PORTAL", "SYNC", "BI", "MASTER", "MULTIUNIDADE", "UNIDADES", "FRANQUIAS", "FRANQUEADORA"
            PodeModuloPlano = True
        Case Else
            PodeModuloPlano = True
    End Select
End Function

Public Function ValidarLicenca(ByVal empresaId As Long) As Boolean
    Dim lo As ListObject, lr As ListRow
    Dim exp As Date, st As String
    On Error GoTo Falha
    ValidarLicenca = True
    If empresaId = 0 Then Exit Function ' plataforma
    If Not TabelaExiste(SHT_LICENCAS, TBL_LICENCAS) Then Exit Function
    Set lo = ObterTabela(SHT_LICENCAS, TBL_LICENCAS)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "EmpresaID"))) = empresaId Then
            st = NzStr(LerCampo(lr, "Status"))
            If StrComp(st, "Ativa", vbTextCompare) <> 0 Then
                ValidarLicenca = False
                Exit Function
            End If
            If IsDate(LerCampo(lr, "Expiração")) Then
                exp = CDate(LerCampo(lr, "Expiração"))
                If exp < Date Then
                    ValidarLicenca = False
                    Exit Function
                End If
            End If
            ValidarLicenca = True
            Exit Function
        End If
    Next lr
    ValidarLicenca = True ' sem licença cadastrada = permite demo
    Exit Function
Falha:
    ValidarLicenca = True
End Function

Public Function DiasRestantesLicenca(ByVal empresaId As Long) As Long
    Dim lo As ListObject, lr As ListRow
    Dim exp As Date
    On Error Resume Next
    DiasRestantesLicenca = 0
    Set lo = ObterTabela(SHT_LICENCAS, TBL_LICENCAS)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "EmpresaID"))) = empresaId Then
            If IsDate(LerCampo(lr, "Expiração")) Then
                exp = CDate(LerCampo(lr, "Expiração"))
                DiasRestantesLicenca = DateDiff("d", Date, exp)
            End If
            Exit Function
        End If
    Next lr
End Function

Public Function CarregarEmpresa(ByVal empresaId As Long) As Boolean
    Dim lo As ListObject, lr As ListRow
    On Error GoTo Falha
    CarregarEmpresa = False
    Set lo = ObterTabela(SHT_EMPRESAS, TBL_EMPRESAS)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "EmpresaID"))) = empresaId Then
            EmpresaIDMemoria = CStr(empresaId)
            NomeEmpresaMemoria = NzStr(LerCampo(lr, "Nome Fantasia"))
            If Len(NomeEmpresaMemoria) = 0 Then NomeEmpresaMemoria = NzStr(LerCampo(lr, "Razão Social"))
            PlanoEmpresaMemoria = NzStr(LerCampo(lr, "Plano"))
            On Error Resume Next
            Call CarregarFranquiaDaEmpresa(empresaId)
            On Error GoTo Falha
            Call SincronizarEspelhoEmpresa
            CarregarEmpresa = True
            Exit Function
        End If
    Next lr
    Exit Function
Falha:
    CarregarEmpresa = False
End Function

Public Sub CarregarConfiguracoes()
    ' Config por empresa disponível via ObterConfigEmpresa
End Sub

Public Function ObterConfigEmpresa(ByVal chave As String, Optional ByVal padrao As String = "") As String
    Dim lo As ListObject, lr As ListRow
    Dim eid As Long
    On Error Resume Next
    eid = EmpresaIDSessao()
    ObterConfigEmpresa = padrao
    If Not TabelaExiste(SHT_CONFIG_EMP, TBL_CONFIG_EMP) Then Exit Function
    Set lo = ObterTabela(SHT_CONFIG_EMP, TBL_CONFIG_EMP)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "EmpresaID"))) = eid Then
            If StrComp(NzStr(LerCampo(lr, "Chave")), chave, vbTextCompare) = 0 Then
                ObterConfigEmpresa = NzStr(LerCampo(lr, "Valor"))
                Exit Function
            End If
        End If
    Next lr
End Function

Public Sub CadastrarEmpresa()
    Call CriarAcademiaCompleta
End Sub

Public Sub EditarEmpresa()
    MsgAviso "Edite os campos em BD_EMPRESAS (versão Master) ou use TrocarEmpresa + Config."
End Sub

Public Sub ExcluirEmpresa()
    MsgAviso "Suspensão de academia: altere Status para Suspenso em BD_EMPRESAS (não exclui dados)."
End Sub

Public Sub TrocarEmpresa()
    Dim s As String
    Dim eid As Long
    On Error GoTo TrataErro
    If Not EhSuperAdmin() Then
        MsgErro "Somente SuperAdmin pode trocar de empresa."
        Exit Sub
    End If
    s = InputBox("Informe o EmpresaID para assumir (ex.: 1 = ATHENA GYM):", "Trocar Empresa", "1")
    If Len(Trim$(s)) = 0 Then Exit Sub
    eid = CLng(Val(s))
    If Not CarregarEmpresa(eid) Then
        MsgErro "Empresa não encontrada."
        Exit Sub
    End If
    If Not ValidarLicenca(eid) Then
        MsgAviso "Licença inválida/expirada para esta empresa."
    End If
    Call SincronizarEspelhoEmpresa
    MsgOk "Empresa ativa: " & NomeEmpresaMemoria & " (Plano " & PlanoEmpresaMemoria & ")"
    Call AtualizarMaster
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "TrocarEmpresa"
End Sub

Public Sub AtualizarPlano()
    Dim s As String, plano As String
    Dim lo As ListObject, lr As ListRow
    Dim eid As Long
    On Error GoTo TrataErro
    If Not EhSuperAdmin() Then MsgErro "Somente SuperAdmin.": Exit Sub
    eid = EmpresaIDSessao()
    If eid = 0 Then eid = 1
    s = InputBox("Novo plano (Basic / Pro / Enterprise):", "Atualizar Plano", PlanoEmpresaMemoria)
    If Len(Trim$(s)) = 0 Then Exit Sub
    plano = Trim$(s)
    Set lo = ObterTabela(SHT_EMPRESAS, TBL_EMPRESAS)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "EmpresaID"))) = eid Then
            GravarCampo lr, "Plano", plano
            PlanoEmpresaMemoria = plano
            Call SincronizarEspelhoEmpresa
            MsgOk "Plano atualizado para " & plano
            Exit Sub
        End If
    Next lr
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarPlano"
End Sub

Public Sub CriarAcademiaCompleta()
    Dim razao As String, fantasia As String, cnpj As String
    Dim email As String, fone As String, cidade As String, uf As String, plano As String
    Dim adminLogin As String, adminSenha As String, adminNome As String
    Dim eid As Long, lid As Long, uid As Long, cid As Long
    Dim chave As String
    On Error GoTo TrataErro

    If Not EhSuperAdmin() Then
        MsgErro "Somente SuperAdmin pode criar academias."
        Exit Sub
    End If

    razao = Trim$(CStr(NzStr(LerCelula(SHT_NOVA_ACADEMIA, "D8"))))
    fantasia = Trim$(CStr(NzStr(LerCelula(SHT_NOVA_ACADEMIA, "D9"))))
    cnpj = Trim$(CStr(NzStr(LerCelula(SHT_NOVA_ACADEMIA, "D10"))))
    email = Trim$(CStr(NzStr(LerCelula(SHT_NOVA_ACADEMIA, "D11"))))
    fone = Trim$(CStr(NzStr(LerCelula(SHT_NOVA_ACADEMIA, "D12"))))
    cidade = Trim$(CStr(NzStr(LerCelula(SHT_NOVA_ACADEMIA, "D13"))))
    uf = Trim$(CStr(NzStr(LerCelula(SHT_NOVA_ACADEMIA, "D14"))))
    plano = Trim$(CStr(NzStr(LerCelula(SHT_NOVA_ACADEMIA, "D15"))))
    adminLogin = Trim$(CStr(NzStr(LerCelula(SHT_NOVA_ACADEMIA, "D16"))))
    adminSenha = Trim$(CStr(NzStr(LerCelula(SHT_NOVA_ACADEMIA, "D17"))))
    adminNome = Trim$(CStr(NzStr(LerCelula(SHT_NOVA_ACADEMIA, "D18"))))

    If Len(razao) = 0 Or Len(fantasia) = 0 Or Len(cnpj) = 0 Then
        MsgErro "Preencha Razão Social, Nome Fantasia e CNPJ."
        Exit Sub
    End If
    If Len(plano) = 0 Then plano = "Pro"
    If Len(adminLogin) = 0 Then adminLogin = "admin"
    If Len(adminSenha) = 0 Then adminSenha = "123456"
    If Len(adminNome) = 0 Then adminNome = "Administrador"
    If Len(cidade) = 0 Then cidade = "São Paulo"
    If Len(uf) = 0 Then uf = "SP"

    eid = MaxNumerico(SHT_EMPRESAS, TBL_EMPRESAS, "EmpresaID") + 1
    If eid < 2 Then eid = 2

    Call AdicionarRegistro(SHT_EMPRESAS, TBL_EMPRESAS, _
        Array("EmpresaID", "Razão Social", "Nome Fantasia", "CNPJ", "Inscrição Estadual", _
              "Telefone", "WhatsApp", "Email", "Site", "CEP", "Endereço", "Número", "Complemento", _
              "Bairro", "Cidade", "Estado", "País", "Logo", "Cor Primária", "Cor Secundária", _
              "Plano", "Status", "Data Cadastro", "Data Expiração"), _
        Array(eid, razao, fantasia, cnpj, "", fone, fone, email, "", "", "", "", "", _
              "", cidade, uf, "Brasil", "", "#A3001B", "#D4AF37", plano, "Ativo", Date, DateAdd("yyyy", 1, Date)))

    lid = MaxNumerico(SHT_LICENCAS, TBL_LICENCAS, "ID") + 1
    chave = "ATH-" & UCase$(Left$(plano, 3)) & "-" & eid & "-" & Format$(Date, "yyyymmdd")
    Call AdicionarRegistro(SHT_LICENCAS, TBL_LICENCAS, _
        Array("ID", "EmpresaID", "Chave", "Plano", "Ativação", "Expiração", "Status"), _
        Array(lid, eid, chave, plano, Date, DateAdd("yyyy", 1, Date), "Ativa"))

    uid = MaxNumerico(SHT_USUARIOS, TBL_USUARIOS, "ID") + 1
    Call AdicionarRegistro(SHT_USUARIOS, TBL_USUARIOS, _
        Array("ID", "EmpresaID", "UnidadeID", "Nome", "Usuário", "Senha", "Perfil", "Status", "Token", "Matrícula"), _
        Array(uid, eid, 0, adminNome, adminLogin, adminSenha, "Administrador", "Ativo", "", ""))

    cid = MaxNumerico(SHT_CONFIG_EMP, TBL_CONFIG_EMP, "ID")
    Call AdicionarRegistro(SHT_CONFIG_EMP, TBL_CONFIG_EMP, Array("ID", "EmpresaID", "Chave", "Valor"), Array(cid + 1, eid, "Moeda", "BRL"))
    Call AdicionarRegistro(SHT_CONFIG_EMP, TBL_CONFIG_EMP, Array("ID", "EmpresaID", "Chave", "Valor"), Array(cid + 2, eid, "TimeZone", "America/Sao_Paulo"))
    Call AdicionarRegistro(SHT_CONFIG_EMP, TBL_CONFIG_EMP, Array("ID", "EmpresaID", "Chave", "Valor"), Array(cid + 3, eid, "BloquearInadimplente", "SIM"))
    Call AdicionarRegistro(SHT_CONFIG_EMP, TBL_CONFIG_EMP, Array("ID", "EmpresaID", "Chave", "Valor"), Array(cid + 4, eid, "DiasTolerancia", "5"))
    Call AdicionarRegistro(SHT_CONFIG_EMP, TBL_CONFIG_EMP, Array("ID", "EmpresaID", "Chave", "Valor"), Array(cid + 5, eid, "PrefixoMatricula", "ATH"))

    ' Unidade matriz da nova academia (Épico 2)
    On Error Resume Next
    Call CriarUnidadeMatrizBootstrap(eid, fantasia, cidade)
    On Error GoTo TrataErro

    GravarCelula SHT_NOVA_ACADEMIA, "C23", "OK — EmpresaID " & eid & " criada. Login admin: " & adminLogin & " / licença " & chave
    MsgOk "Academia criada!" & vbCrLf & "EmpresaID: " & eid & vbCrLf & "Login: " & adminLogin & vbCrLf & "Plano: " & plano
    Call AtualizarMaster
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "CriarAcademiaCompleta"
    GravarCelula SHT_NOVA_ACADEMIA, "C23", "ERRO: " & Err.Description
End Sub

Public Sub AtualizarMaster()
    Dim lo As ListObject, lr As ListRow
    Dim nEmp As Long, nAlu As Long, fat As Double, r As Long, eid As Long
    Dim dias As Long
    On Error Resume Next
    If Not EhSuperAdmin() And StrComp(PerfilUsuario, "SuperAdmin", vbTextCompare) <> 0 Then Exit Sub

    nEmp = 0
    Set lo = ObterTabela(SHT_EMPRESAS, TBL_EMPRESAS)
    Call LimparIntervalo(SHT_MASTER, "C16:H25")
    r = 16
    For Each lr In lo.ListRows
        eid = CLng(Val(LerCampo(lr, "EmpresaID")))
        If eid > 0 Then
            nEmp = nEmp + 1
            GravarCelula SHT_MASTER, "C" & r, eid
            GravarCelula SHT_MASTER, "D" & r, NzStr(LerCampo(lr, "Nome Fantasia"))
            GravarCelula SHT_MASTER, "E" & r, NzStr(LerCampo(lr, "CNPJ"))
            GravarCelula SHT_MASTER, "F" & r, NzStr(LerCampo(lr, "Plano"))
            GravarCelula SHT_MASTER, "G" & r, NzStr(LerCampo(lr, "Status"))
            GravarCelula SHT_MASTER, "H" & r, LerCampo(lr, "Data Expiração")
            r = r + 1
            If r > 25 Then Exit For
        End If
    Next lr

    nAlu = 0
    If TabelaExiste(SHT_ALUNOS, TBL_ALUNOS) Then
        Set lo = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
        For Each lr In lo.ListRows
            nAlu = nAlu + 1
        Next lr
    End If
    fat = ReceitaMesUnidade(0, Month(Date), Year(Date))

    GravarCelula SHT_MASTER, "C9", nEmp
    GravarCelula SHT_MASTER, "E9", nAlu
    GravarCelula SHT_MASTER, "G9", "R$ " & Format$(fat, "#,##0")
    Dim nUni As Long, lrU As ListRow, loU As ListObject
    nUni = 0
    On Error Resume Next
    Set loU = ObterTabela(SHT_UNIDADES, TBL_UNIDADES)
    For Each lrU In loU.ListRows
        If StrComp(NzStr(LerCampo(lrU, "Status")), "Ativa", vbTextCompare) = 0 Then nUni = nUni + 1
    Next lrU
    GravarCelula SHT_MASTER, "I9", nUni
    On Error GoTo 0

    Call LimparIntervalo(SHT_MASTER, "C30:G35")
    r = 30
    If TabelaExiste(SHT_LICENCAS, TBL_LICENCAS) Then
        Set lo = ObterTabela(SHT_LICENCAS, TBL_LICENCAS)
        For Each lr In lo.ListRows
            eid = CLng(Val(LerCampo(lr, "EmpresaID")))
            dias = DiasRestantesLicenca(eid)
            GravarCelula SHT_MASTER, "C" & r, eid
            GravarCelula SHT_MASTER, "D" & r, NzStr(LerCampo(lr, "Chave"))
            GravarCelula SHT_MASTER, "E" & r, NzStr(LerCampo(lr, "Plano"))
            GravarCelula SHT_MASTER, "F" & r, dias
            GravarCelula SHT_MASTER, "G" & r, NzStr(LerCampo(lr, "Status"))
            r = r + 1
            If r > 35 Then Exit For
        Next lr
    End If
End Sub

Public Sub AbrirMasterEAtualizar()
    Call AtualizarMaster
    NavegarPara SHT_MASTER
End Sub

Private Sub SincronizarEspelhoEmpresa()
    On Error Resume Next
    ThisWorkbook.Sheets("BD_SESSAO").Range("B5").Value = EmpresaIDMemoria
    ThisWorkbook.Sheets("BD_SESSAO").Range("B6").Value = NomeEmpresaMemoria
    ThisWorkbook.Sheets("BD_SESSAO").Range("B7").Value = PlanoEmpresaMemoria
End Sub
