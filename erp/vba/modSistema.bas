Attribute VB_Name = "modSistema"
Option Explicit

'============================================================
' Sprint 3.5 — Sistema: app mode, permissões (BD_PERMISSOES), navegação
'============================================================

Public Const CONST_PERFIL_ADMIN As String = "Administrador"
Public Const CONST_PERFIL_FIN As String = "Financeiro"
Public Const CONST_PERFIL_REC As String = "Recepção"
Public Const CONST_PERFIL_PROF As String = "Professor"

Public Sub AplicarModoApp()
    On Error Resume Next
    Application.DisplayFormulaBar = False
    ActiveWindow.DisplayWorkbookTabs = False
    ActiveWindow.DisplayHeadings = False
    ActiveWindow.DisplayGridlines = False
    On Error GoTo 0
End Sub

Public Sub MostrarSplash()
    On Error Resume Next
    frmSplash.Show vbModeless
    DoEvents
    Application.Wait Now + TimeSerial(0, 0, 2)
    Unload frmSplash
    On Error GoTo 0
End Sub

Private Function ColunaPermissao(ByVal modulo As String) As String
    Dim m As String
    m = UCase$(Trim$(modulo))
    m = Replace(m, "Ã", "A")
    m = Replace(m, "Á", "A")
    m = Replace(m, "À", "A")
    m = Replace(m, "Â", "A")
    m = Replace(m, "Ç", "C")
    m = Replace(m, "Õ", "O")
    m = Replace(m, "Ó", "O")
    Select Case m
        Case "DASHBOARD", "01_DASHBOARD": ColunaPermissao = "Dashboard"
        Case "FINANCEIRO", "04_FINANCEIRO", "FINANCE": ColunaPermissao = "Financeiro"
        Case "ESTOQUE", "09_ESTOQUE": ColunaPermissao = "Estoque"
        Case "CONFIGURACAO", "CONFIGURACOES", "CONFIG", "15_CONFIG": ColunaPermissao = "Configuração"
        Case "ALUNOS", "02_ALUNOS", "FORM_ALUNO": ColunaPermissao = "Alunos"
        Case "MENSALIDADES", "03_MENSALIDADES": ColunaPermissao = "Mensalidades"
        Case "RELATORIOS", "16_RELATORIOS": ColunaPermissao = "Relatorios"
        Case "EXCLUIR": ColunaPermissao = "Excluir"
        Case Else: ColunaPermissao = ""
    End Select
End Function

Public Function TemPermissao(ByVal perfil As String, ByVal modulo As String) As Boolean
    Dim lo As ListObject
    Dim lr As ListRow
    Dim col As String
    Dim p As String

    p = Trim$(perfil)
    If Len(p) = 0 Then TemPermissao = False: Exit Function

    col = ColunaPermissao(modulo)
    If Len(col) = 0 Then TemPermissao = False: Exit Function

    On Error GoTo Falha
    Set lo = ObterTabela(SHT_PERMISSOES, TBL_PERMISSOES)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Perfil")), p, vbTextCompare) = 0 Then
            TemPermissao = (CLng(Val(LerCampo(lr, col))) = 1)
            Exit Function
        End If
    Next lr
    TemPermissao = False
    Exit Function
Falha:
    ' Fallback seguro se tabela ausente
    TemPermissao = (p = CONST_PERFIL_ADMIN)
End Function

Public Function PodeAcessar(ByVal recurso As String) As Boolean
    Dim p As String
    Dim col As String
    p = PerfilUsuario
    If Len(Trim$(p)) = 0 Then PodeAcessar = False: Exit Function

    ' SuperAdmin plataforma
    If StrComp(p, "SuperAdmin", vbTextCompare) = 0 Then
        PodeAcessar = True
        Exit Function
    End If

    ' Gate de plano SaaS
    If Not PodeModuloPlano(recurso) Then
        PodeAcessar = False
        Exit Function
    End If

    col = ColunaPermissao(recurso)
    If Len(col) > 0 Then
        PodeAcessar = TemPermissao(p, recurso)
        Exit Function
    End If

    ' Recursos sem coluna própria (compatibilidade)
    Select Case UCase$(recurso)
        Case "PROFESSORES": PodeAcessar = (p = CONST_PERFIL_PROF Or p = CONST_PERFIL_ADMIN)
        Case "PRESENCA", "AVALIACAO": PodeAcessar = (p = CONST_PERFIL_PROF Or p = CONST_PERFIL_ADMIN)
        Case "ACESSO": PodeAcessar = (p = CONST_PERFIL_ADMIN Or p = CONST_PERFIL_REC Or TemPermissao(p, "Alunos"))
        Case "ATHENA", "BI", "PORTAL", "SYNC", "MASTER": PodeAcessar = TemPermissao(p, "Dashboard") Or p = CONST_PERFIL_ADMIN
        Case Else: PodeAcessar = TemPermissao(p, "Dashboard")
    End Select
End Function

Public Function PodeAcessarAba(ByVal sheetName As String) As Boolean
    Dim p As String
    p = PerfilUsuario
    If Len(Trim$(p)) = 0 Then PodeAcessarAba = (sheetName = "00_LOGIN"): Exit Function

    Select Case sheetName
        Case "00_LOGIN", "21_HOME", "01_DASHBOARD", "20_AGENDA", "31_BI_EXECUTIVO", "32_INSIGHTS", _
             "33_PORTAL_ALUNO", "34_PORTAL_PROF", "35_PORTAL_OPS", "36_ATHENA_AI", "37_RECOMENDACOES", _
             "38_MASTER", "39_NOVA_ACADEMIA", "40_UNIDADES", "41_FRANQUEADORA", _
             "BD_SESSAO", "LOG", "BD_ALUNOS", "BD_CONTAS_RECEBER", _
             "BD_LANCAMENTOS", "BD_FLUXO_CAIXA", "BD_CONTAS_PAGAR", "BD_EVENTOS", "BD_PRIORIDADES", "VERSAO"
            PodeAcessarAba = True
            If sheetName = "38_MASTER" Or sheetName = "39_NOVA_ACADEMIA" Then
                PodeAcessarAba = (StrComp(PerfilUsuario, "SuperAdmin", vbTextCompare) = 0)
            End If
            If sheetName = "40_UNIDADES" Then
                PodeAcessarAba = PodeModuloPlano("Multiunidade") And (PodeAcessar("Config") Or PodeAcessar("Dashboard"))
            End If
            If sheetName = "41_FRANQUEADORA" Then
                PodeAcessarAba = PodeModuloPlano("Franquias") And ( _
                    StrComp(PerfilUsuario, "Franqueadora", vbTextCompare) = 0 Or _
                    StrComp(PerfilUsuario, "Franqueado", vbTextCompare) = 0 Or _
                    StrComp(PerfilUsuario, "Administrador", vbTextCompare) = 0 Or _
                    StrComp(PerfilUsuario, "SuperAdmin", vbTextCompare) = 0)
            End If
        Case "FORM_ALUNO", "02_ALUNOS", "14_DASH_COMERCIAL", "22_CRM", "23_DASH_CRM"
            PodeAcessarAba = PodeAcessar("Alunos")
        Case "03_MENSALIDADES"
            PodeAcessarAba = PodeAcessar("Mensalidades")
        Case "04_FINANCEIRO", "05_FLUXO_CAIXA", "06_CONTAS_RECEBER", "07_CONTAS_PAGAR", "13_DASH_FINANCEIRO"
            PodeAcessarAba = PodeAcessar("Financeiro")
        Case "09_ESTOQUE", "10_EQUIPAMENTOS", "18_DASH_ESTOQUE", "19_DASH_EQUIPAMENTOS", _
             "28_PDV", "29_INVENTARIO", "30_DASH_PDV"
            PodeAcessarAba = PodeAcessar("Estoque")
        Case "08_PROFESSORES", "17_DASH_PROFESSORES"
            PodeAcessarAba = PodeAcessar("Professores")
        Case "16_RELATORIOS"
            PodeAcessarAba = PodeAcessar("Relatorios")
        Case "15_CONFIG", "BD_USUARIOS", "BD_PARAMETROS", "BD_PLANOS", "BD_FORMAS_PAGAMENTO", _
             "BD_STATUS", "BD_PERMISSOES", "BD_CORES", "BD_METAS", "BD_NOTIFICACOES", "BD_EVENTOS", _
             "BD_PRIORIDADES", "BD_LEADS", "BD_CRM_HISTORICO", "BD_RETENCAO", "BD_CAMPANHAS", _
             "BD_INDICACOES", "BD_AVALIACOES", "BD_MEDIDAS", "BD_TREINOS", "BD_EXERCICIOS", _
             "BD_TREINO_ITENS", "BD_FOTOS", "BD_ACESSOS", "BD_PRESENCAS", "BD_UNIDADES", "BD_PARAMETROS_UNIDADE", _
             "BD_PROFESSOR_UNIDADE", "BD_TRANSFERENCIAS", "BD_USUARIO_UNIDADE", _
             "BD_FRANQUEADORAS", "BD_FRANQUEADOS", "BD_CONTRATOS_FRANQUIA", "BD_ROYALTIES", _
             "BD_PRODUTOS", "BD_FORNECEDORES", "BD_COMPRAS", "BD_MOVIMENTACAO_ESTOQUE", _
             "BD_LOTES", "BD_VENDAS", "BD_VENDA_ITENS", "BD_KITS", "BD_KIT_ITENS", _
             "BD_INDICADORES", "BD_INSIGHTS", "BD_PREVISOES", "BD_RISCO_RETENCAO", _
             "BD_CHAT", "BD_METAS_ALUNO", "BD_PORTAL_TOKENS", "BD_DESAFIOS", "BD_PUSH", _
             "BD_RECOMENDACOES", "BD_ATHENA_CHAT", "BD_EMPRESAS", "BD_LICENCAS", "BD_CONFIG_EMPRESA", "BI_BASE"
            PodeAcessarAba = PodeAcessar("Config")
        Case "11_AVALIACAO", "24_AVALIACAO", "25_TREINOS"
            PodeAcessarAba = PodeAcessar("Avaliacao")
        Case "12_PRESENCA"
            PodeAcessarAba = PodeAcessar("Presenca") Or PodeAcessar("Acesso")
        Case "26_ACESSO", "27_DASH_FREQUENCIA"
            PodeAcessarAba = PodeAcessar("Acesso")
        Case Else
            PodeAcessarAba = True
    End Select
End Function

Public Function ExigeAcesso(ByVal recurso As String) As Boolean
    If PodeAcessar(recurso) Then
        ExigeAcesso = True
        Exit Function
    End If
    RegistrarLog "Acesso negado: " & recurso, "Seguranca"
    MsgErro "Acesso negado." & vbCrLf & _
            "Seu perfil (" & PerfilUsuario & ") não pode acessar: " & recurso & "."
    ExigeAcesso = False
End Function

Public Function ExigeAba(ByVal sheetName As String) As Boolean
    If PodeAcessarAba(sheetName) Then
        ExigeAba = True
        Exit Function
    End If
    RegistrarLog "Acesso negado à aba " & sheetName, "Seguranca"
    MsgErro "Acesso negado à tela: " & sheetName & "."
    ExigeAba = False
End Function

Public Sub AplicarMenus()
    Dim ws As Worksheet
    Dim shp As Shape
    Dim i As Long
    Dim sheetsApp As Variant
    On Error Resume Next
    sheetsApp = Array("01_DASHBOARD", "FORM_ALUNO", "16_RELATORIOS", "13_DASH_FINANCEIRO", "14_DASH_COMERCIAL")
    For i = LBound(sheetsApp) To UBound(sheetsApp)
        Set ws = ThisWorkbook.Sheets(CStr(sheetsApp(i)))
        If Not ws Is Nothing Then
            For Each shp In ws.Shapes
                Select Case shp.Name
                    Case "mnuFinanceiro": shp.Visible = PodeAcessar("Financeiro")
                    Case "mnuEstoque": shp.Visible = PodeAcessar("Estoque") And PodeModuloPlano("Estoque")
                    Case "mnuPDV": shp.Visible = PodeAcessar("Estoque") And PodeModuloPlano("PDV")
                    Case "mnuConfig": shp.Visible = PodeAcessar("Config")
                    Case "mnuMensalidades": shp.Visible = PodeAcessar("Mensalidades")
                    Case "mnuProfessores": shp.Visible = PodeAcessar("Professores")
                    Case "mnuAlunos": shp.Visible = PodeAcessar("Alunos")
                    Case "mnuAcesso": shp.Visible = PodeAcessar("Acesso") And PodeModuloPlano("Acesso")
                    Case "mnuDashboard": shp.Visible = PodeAcessar("Dashboard")
                    Case "mnuAthena": shp.Visible = PodeAcessar("Dashboard") And PodeModuloPlano("Athena")
                    Case "mnuMaster": shp.Visible = (StrComp(PerfilUsuario, "SuperAdmin", vbTextCompare) = 0)
                    Case "mnuFranquia": shp.Visible = PodeModuloPlano("Franquias") And ( _
                        StrComp(PerfilUsuario, "Franqueadora", vbTextCompare) = 0 Or _
                        StrComp(PerfilUsuario, "Franqueado", vbTextCompare) = 0 Or _
                        StrComp(PerfilUsuario, "Administrador", vbTextCompare) = 0 Or _
                        StrComp(PerfilUsuario, "SuperAdmin", vbTextCompare) = 0)
                    Case "mnuUnidades": shp.Visible = PodeModuloPlano("Multiunidade") And PodeAcessar("Dashboard")
                    Case "mnuPortal": shp.Visible = PodeModuloPlano("Portal")
                    Case "mnuPortalOps": shp.Visible = (PodeAcessar("Alunos") Or PodeAcessar("Dashboard")) And PodeModuloPlano("Sync")
                    Case "mnuBI": shp.Visible = PodeAcessar("Dashboard") And PodeModuloPlano("BI")
                    Case "mnuCRM": shp.Visible = PodeAcessar("Alunos") And PodeModuloPlano("CRM")
                    Case "mnuRelatorios": shp.Visible = PodeAcessar("Relatorios")
                    Case "mnuSair": shp.Visible = True
                End Select
            Next shp
        End If
    Next i
    On Error GoTo 0
End Sub

Public Sub NavegarPara(ByVal sheetName As String)
    If Not SessaoAtiva() And sheetName <> "00_LOGIN" Then
        MsgAviso "Faça login para continuar."
        AbrirLogin
        Exit Sub
    End If
    If Not ExigeAba(sheetName) Then
        On Error Resume Next
        AtivarAba "21_HOME"
        On Error GoTo 0
        Exit Sub
    End If
    AtivarAba sheetName
End Sub
