Attribute VB_Name = "modSessao"
Option Explicit

'============================================================
' Sprint 3.3 + Épico 1/2/3 — Sessão + tenant (Empresa + Unidade + Franquia)
'============================================================

Public UsuarioLogado As String
Public NomeUsuario As String
Public PerfilUsuario As String
Public DataLogin As Date
Public EmpresaIDMemoria As String
Public NomeEmpresaMemoria As String
Public PlanoEmpresaMemoria As String
Public UnidadeIDMemoria As String
Public NomeUnidadeMemoria As String
Public FranqueadoraIDMemoria As String
Public FranqueadoIDMemoria As String

Private Const SHT_ESPELHO As String = "BD_SESSAO"

Public Sub GravarSessao(ByVal usuario As String, ByVal nome As String, ByVal perfil As String)
    UsuarioLogado = usuario
    NomeUsuario = nome
    PerfilUsuario = perfil
    DataLogin = Now
    SincronizarEspelho
End Sub

Public Sub GravarSessaoCompleta(ByVal usuario As String, ByVal nome As String, ByVal perfil As String, _
                                ByVal empresaId As Long, ByVal nomeEmpresa As String, ByVal plano As String, _
                                Optional ByVal unidadeId As Long = 0, Optional ByVal nomeUnidade As String = "")
    UsuarioLogado = usuario
    NomeUsuario = nome
    PerfilUsuario = perfil
    DataLogin = Now
    EmpresaIDMemoria = CStr(empresaId)
    NomeEmpresaMemoria = nomeEmpresa
    PlanoEmpresaMemoria = plano
    UnidadeIDMemoria = CStr(unidadeId)
    If Len(Trim$(nomeUnidade)) = 0 Then
        If unidadeId <= 0 Then
            NomeUnidadeMemoria = "Todas as unidades"
        Else
            NomeUnidadeMemoria = "Unidade " & CStr(unidadeId)
        End If
    Else
        NomeUnidadeMemoria = nomeUnidade
    End If
    SincronizarEspelho
End Sub

Public Sub LimparSessao()
    UsuarioLogado = ""
    NomeUsuario = ""
    PerfilUsuario = ""
    DataLogin = 0
    EmpresaIDMemoria = ""
    NomeEmpresaMemoria = ""
    PlanoEmpresaMemoria = ""
    UnidadeIDMemoria = ""
    NomeUnidadeMemoria = ""
    FranqueadoraIDMemoria = ""
    FranqueadoIDMemoria = ""
    On Error Resume Next
    ThisWorkbook.Sheets(SHT_ESPELHO).Range("B1:B11").ClearContents
    ThisWorkbook.Sheets("15_CONFIG").Range("V20").ClearContents
    ThisWorkbook.Sheets("15_CONFIG").Range("V21").ClearContents
    On Error GoTo 0
End Sub

Public Function SessaoAtiva() As Boolean
    SessaoAtiva = (Len(Trim$(UsuarioLogado)) > 0 And Len(Trim$(PerfilUsuario)) > 0)
End Function

Private Sub SincronizarEspelho()
    On Error Resume Next
    ThisWorkbook.Sheets(SHT_ESPELHO).Range("B1").Value = UsuarioLogado
    ThisWorkbook.Sheets(SHT_ESPELHO).Range("B2").Value = NomeUsuario
    ThisWorkbook.Sheets(SHT_ESPELHO).Range("B3").Value = PerfilUsuario
    ThisWorkbook.Sheets(SHT_ESPELHO).Range("B4").Value = DataLogin
    ThisWorkbook.Sheets(SHT_ESPELHO).Range("B5").Value = EmpresaIDMemoria
    ThisWorkbook.Sheets(SHT_ESPELHO).Range("B6").Value = NomeEmpresaMemoria
    ThisWorkbook.Sheets(SHT_ESPELHO).Range("B7").Value = PlanoEmpresaMemoria
    ThisWorkbook.Sheets(SHT_ESPELHO).Range("B8").Value = UnidadeIDMemoria
    ThisWorkbook.Sheets(SHT_ESPELHO).Range("B9").Value = NomeUnidadeMemoria
    ThisWorkbook.Sheets(SHT_ESPELHO).Range("B10").Value = FranqueadoraIDMemoria
    ThisWorkbook.Sheets(SHT_ESPELHO).Range("B11").Value = FranqueadoIDMemoria
    ThisWorkbook.Sheets("15_CONFIG").Range("V20").Value = UsuarioLogado
    ThisWorkbook.Sheets("15_CONFIG").Range("V21").Value = PerfilUsuario
    On Error GoTo 0
End Sub
