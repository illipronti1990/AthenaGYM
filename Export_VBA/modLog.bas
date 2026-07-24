Attribute VB_Name = "modLog"
Option Explicit

'============================================================
' Sprint 3.5 — Auditoria expandida (usa modBanco)
'============================================================

Private Function NomeComputador() As String
    Dim n As String
    On Error Resume Next
    n = Environ$("COMPUTERNAME")
    If Len(Trim$(n)) = 0 Then n = Environ$("HOSTNAME")
    If Len(Trim$(n)) = 0 Then n = "—"
    NomeComputador = n
    On Error GoTo 0
End Function

Public Sub RegistrarLog(ByVal acao As String, Optional ByVal modulo As String = "", Optional ByVal registro As String = "")
    Dim cols As Variant, vals As Variant
    Dim usr As String, perfil As String, modu As String, reg As String

    On Error GoTo Falha
    usr = IIf(Len(Trim$(UsuarioLogado)) = 0, "anonimo", UsuarioLogado)
    perfil = IIf(Len(Trim$(PerfilUsuario)) = 0, "—", PerfilUsuario)
    modu = IIf(Len(Trim$(modulo)) = 0, "Sistema", modulo)
    reg = IIf(Len(Trim$(registro)) = 0, "—", registro)

    cols = Array("Data", "Hora", "Usuário", "Perfil", "Módulo", "Ação", "Registro", "Computador", "Versão")
    vals = Array(DataAtual(), HoraAtual(), usr, perfil, modu, acao, reg, NomeComputador(), VersaoSistema())
    Call AdicionarRegistro(SHT_LOG, TBL_LOG, cols, vals)
    Exit Sub
Falha:
    On Error Resume Next
    Call AdicionarRegistro(SHT_LOG, TBL_LOG, _
        Array("Data", "Hora", "Usuário", "Perfil", "Módulo", "Ação", "Registro", "Computador", "Versão"), _
        Array(Date, Time, "anonimo", "—", "Sistema", acao, "—", "—", "2.0.0"))
End Sub

Public Sub RegistrarErro(ByVal numero As Long, ByVal descricao As String, ByVal origem As String)
    RegistrarLog "ERRO #" & numero & ": " & descricao, origem
End Sub

Public Sub RegistrarLogin()
    RegistrarLog "Login realizado", "Login", UsuarioLogado
End Sub

Public Sub RegistrarLogout()
    RegistrarLog "Logout realizado", "Login", UsuarioLogado
End Sub

Public Sub RegistrarAcao(ByVal acao As String, ByVal modulo As String)
    RegistrarLog acao, modulo
End Sub
