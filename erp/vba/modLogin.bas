Attribute VB_Name = "modLogin"
Option Explicit

'============================================================
' Sprint 3.3 — Autenticação (dados via modBanco)
'============================================================

Public Sub AbrirLogin()
    On Error GoTo TrataErro
    AplicarModoApp
    frmLogin.Show vbModal
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AbrirLogin"
    MsgErro "Não foi possível abrir o formulário de login." & vbCrLf & Err.Description
End Sub

Public Sub EntrarSistema()
    AbrirLogin
End Sub

Public Function ValidarLogin(ByVal usuario As String, ByVal senha As String) As Boolean
    Dim lo As ListObject
    Dim lr As ListRow
    Dim u As String, s As String, status As String
    Dim eid As Long
    Dim nomeEmp As String, plano As String, perfil As String

    On Error GoTo TrataErro
    ValidarLogin = False
    usuario = Trim$(usuario)
    senha = CStr(senha)
    If Len(usuario) = 0 Or Len(senha) = 0 Then Exit Function

    Set lo = ObterTabela(SHT_USUARIOS, TBL_USUARIOS)
    For Each lr In lo.ListRows
        u = LCase$(NzStr(LerCampo(lr, "Usuário")))
        s = NzStr(LerCampo(lr, "Senha"))
        status = NzStr(LerCampo(lr, "Status"))
        If u = LCase$(usuario) And s = senha Then
            If StrComp(status, "Ativo", vbTextCompare) <> 0 Then
                ValidarLogin = False
                Exit Function
            End If
            eid = 1
            On Error Resume Next
            eid = CLng(Val(LerCampo(lr, "EmpresaID")))
            On Error GoTo TrataErro
            perfil = NzStr(LerCampo(lr, "Perfil"))
            nomeEmp = "ATHENA GYM"
            plano = "Enterprise"
            Dim uid As Long, nomeUni As String
            uid = 0
            nomeUni = "Todas as unidades"
            On Error Resume Next
            uid = CLng(Val(LerCampo(lr, "UnidadeID")))
            On Error GoTo TrataErro
            If StrComp(perfil, "SuperAdmin", vbTextCompare) = 0 Or eid = 0 Then
                nomeEmp = "ATHENA PLATFORM"
                plano = "Enterprise"
                eid = 0
                uid = 0
                nomeUni = "Todas as unidades"
            Else
                If Not ValidarLicenca(eid) Then
                    MsgErro "Licença da academia inválida ou expirada. Contate o suporte ATHENA."
                    ValidarLogin = False
                    Exit Function
                End If
                Call CarregarEmpresa(eid)
                nomeEmp = NomeEmpresaMemoria
                plano = PlanoEmpresaMemoria
                If uid > 0 Then
                    On Error Resume Next
                    nomeUni = NomeUnidadePorId(uid)
                    On Error GoTo TrataErro
                    If Len(nomeUni) = 0 Then nomeUni = "Unidade " & CStr(uid)
                ElseIf StrComp(perfil, "Administrador", vbTextCompare) = 0 Then
                    uid = 0
                    nomeUni = "Todas as unidades"
                Else
                    uid = 1
                    On Error Resume Next
                    nomeUni = NomeUnidadePorId(1)
                    If Len(nomeUni) = 0 Then nomeUni = "ATHENA GYM Matriz"
                    On Error GoTo TrataErro
                End If
            End If
            Call GravarSessaoCompleta(NzStr(LerCampo(lr, "Usuário")), NzStr(LerCampo(lr, "Nome")), perfil, eid, nomeEmp, plano, uid, nomeUni)
            On Error Resume Next
            If StrComp(perfil, "Franqueadora", vbTextCompare) = 0 Then
                Call DefinirFranquiaSessao(1, 0, "ATHENA FRANCHISE")
            ElseIf StrComp(perfil, "SuperAdmin", vbTextCompare) = 0 Then
                Call DefinirFranquiaSessao(0, 0, "")
            Else
                Call CarregarFranquiaDaEmpresa(eid)
            End If
            On Error GoTo TrataErro
            ValidarLogin = True
            Exit Function
        End If
    Next lr
    Exit Function

TrataErro:
    RegistrarErro Err.Number, Err.Description, "ValidarLogin"
    ValidarLogin = False
End Function

Public Sub ConcluirLogin()
    On Error GoTo TrataErro
    AplicarModoApp
    AplicarMenus
    On Error Resume Next
    Call RecalcularTodasContasAbertas
    Call SincronizarContasReceberUI
    Call AtualizarBI
    Call AtualizarAgenda
    Call AtualizarPainel
    Call AtualizarCRM
    Call AtualizarModuloEsportivo
    Call AtualizarAcesso
    Call AtualizarEstoque
    Call AtualizarPortal
    On Error GoTo TrataErro
    If StrComp(PerfilUsuario, "SuperAdmin", vbTextCompare) = 0 Then
        Call AtualizarMaster
        AtivarAba "38_MASTER"
    ElseIf StrComp(PerfilUsuario, "Franqueadora", vbTextCompare) = 0 Then
        Call AtualizarDashboardFranqueadora
        AtivarAba "41_FRANQUEADORA"
    ElseIf UCase$(ObterParametro("Athena", "AbrirAthenaLogin", "NAO")) = "SIM" Then
        AtivarAba "36_ATHENA_AI"
    ElseIf UCase$(ObterParametro("BI", "AbrirExecutivoLogin", "NAO")) = "SIM" Then
        AtivarAba "31_BI_EXECUTIVO"
    Else
        AtivarAba "21_HOME"
    End If
    On Error GoTo 0
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "ConcluirLogin"
End Sub

Public Sub SairSistema()
    On Error GoTo TrataErro
    If SessaoAtiva() Then RegistrarLogout
    LimparSessao
    AtivarAba "00_LOGIN"
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "SairSistema"
End Sub

Public Sub IrHome(): NavegarPara "21_HOME": End Sub
Public Sub IrDashboard(): NavegarPara "01_DASHBOARD": End Sub
Public Sub IrFormAluno(): AbrirFrmAluno: End Sub
Public Sub IrAlunos(): NavegarPara "02_ALUNOS": End Sub
Public Sub IrMensalidades(): NavegarPara "03_MENSALIDADES": End Sub
Public Sub IrFinanceiro(): NavegarPara "04_FINANCEIRO": End Sub
Public Sub IrDashFinanceiro(): NavegarPara "13_DASH_FINANCEIRO": End Sub
Public Sub IrEstoque()
    On Error Resume Next
    Call AtualizarEstoque
    On Error GoTo 0
    NavegarPara "09_ESTOQUE"
End Sub
Public Sub IrProfessores(): NavegarPara "08_PROFESSORES": End Sub
Public Sub IrRelatorios(): NavegarPara "16_RELATORIOS": End Sub
Public Sub IrConfig(): NavegarPara "15_CONFIG": End Sub
Public Sub IrFluxo(): NavegarPara "05_FLUXO_CAIXA": End Sub
Public Sub IrEquipamentos(): NavegarPara "10_EQUIPAMENTOS": End Sub
