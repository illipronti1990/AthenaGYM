Attribute VB_Name = "modIntegracoes"
Option Explicit

'============================================================
' Sprint 8.0 — Camada de integracoes (preparacao V2)
' Conectores futuros: QR, biometria, RFID, catraca, app, WhatsApp, PIX
'============================================================

Public Const INTEGRACAO_VERSAO As String = "1.0-stub"

Public Function IntegracaoAtiva(ByVal canal As String) As Boolean
    IntegracaoAtiva = (UCase$(ObterParametro("Integracoes", canal, "NAO")) = "SIM")
End Function

' Leitor externo envia codigo (matricula/CPF/token) → valida e libera
Public Sub ReceberLeituraExterna(ByVal codigo As String, Optional ByVal canal As String = "QR Code")
    On Error GoTo TrataErro
    If Len(Trim$(codigo)) = 0 Then Exit Sub
    GravarCelula "26_ACESSO", "D12", ""
    GravarCelula "26_ACESSO", "D13", ""
    If InStr(1, codigo, "ATH-", vbTextCompare) > 0 Then
        GravarCelula "26_ACESSO", "D12", codigo
    Else
        GravarCelula "26_ACESSO", "D13", codigo
    End If
    GravarCelula "26_ACESSO", "D14", canal
    Call ConsultarAlunoAcesso
    Call LiberarEntrada
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "ReceberLeituraExterna"
End Sub

Public Sub StubBiometria(): MsgAviso "Biometria: conector em desenvolvimento (modIntegracoes).": End Sub
Public Sub StubRFID(): MsgAviso "RFID/NFC: conector em desenvolvimento (modIntegracoes).": End Sub
Public Sub StubCatraca(): MsgAviso "Catraca: conector em desenvolvimento (modIntegracoes).": End Sub
Public Sub StubAppAluno(): MsgAviso "App Aluno: use cloud/portal-web + cloud/api (Sprint 11).": End Sub
Public Sub StubWhatsApp(): MsgAviso "WhatsApp: conector em desenvolvimento (modIntegracoes).": End Sub
Public Sub StubGatewayPagamento(): MsgAviso "Gateway PIX/Cartao: conector em desenvolvimento (modIntegracoes).": End Sub

Public Function StatusIntegracoes() As String
    StatusIntegracoes = "QR=" & ObterParametro("Integracoes", "QRCode", "NAO") & _
                        " | Bio=" & ObterParametro("Integracoes", "Biometria", "NAO") & _
                        " | RFID=" & ObterParametro("Integracoes", "RFID", "NAO") & _
                        " | App=" & ObterParametro("Integracoes", "AppAluno", "NAO")
End Function
