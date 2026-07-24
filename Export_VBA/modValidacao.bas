Attribute VB_Name = "modValidacao"
Option Explicit

'============================================================
' Sprint 3.3 — Validações (sem acesso a planilha)
'============================================================

Public Function CampoObrigatorio(ByVal valor As Variant, ByVal nomeCampo As String, ByRef msg As String) As Boolean
    If Len(NzStr(valor)) = 0 Then
        msg = "Campo obrigatório não informado: " & nomeCampo & "."
        CampoObrigatorio = False
    Else
        msg = ""
        CampoObrigatorio = True
    End If
End Function

Public Function CPFValido(ByVal cpf As String) As Boolean
    Dim n As String, i As Long, soma As Long, d1 As Long, d2 As Long
    n = SomenteNumeros(cpf)
    If Len(n) <> 11 Then CPFValido = False: Exit Function
    If n = String$(11, Left$(n, 1)) Then CPFValido = False: Exit Function
    soma = 0
    For i = 1 To 9
        soma = soma + CLng(Mid$(n, i, 1)) * (11 - i)
    Next i
    d1 = 11 - (soma Mod 11)
    If d1 >= 10 Then d1 = 0
    If d1 <> CLng(Mid$(n, 10, 1)) Then CPFValido = False: Exit Function
    soma = 0
    For i = 1 To 10
        soma = soma + CLng(Mid$(n, i, 1)) * (12 - i)
    Next i
    d2 = 11 - (soma Mod 11)
    If d2 >= 10 Then d2 = 0
    CPFValido = (d2 = CLng(Mid$(n, 11, 1)))
End Function

Public Function ValidarCPF(ByVal cpf As String) As Boolean
    ValidarCPF = CPFValido(cpf)
End Function

Public Function TelefoneValido(ByVal tel As String) As Boolean
    Dim n As String
    n = SomenteNumeros(tel)
    TelefoneValido = (Len(n) = 10 Or Len(n) = 11)
End Function

Public Function ValidarTelefone(ByVal tel As String) As Boolean
    ValidarTelefone = TelefoneValido(tel)
End Function

Public Function EmailValido(ByVal email As String) As Boolean
    Dim e As String
    e = LCase$(NzStr(email))
    If Len(e) = 0 Then
        EmailValido = True  ' opcional
        Exit Function
    End If
    EmailValido = (InStr(1, e, "@") > 1 And InStrRev(e, ".") > InStr(1, e, "@") + 1)
End Function

Public Function DataValida(ByVal v As Variant) As Boolean
    If IsDate(v) Then
        DataValida = True
        Exit Function
    End If
    If Len(SomenteNumeros(NzStr(v))) = 8 Then
        DataValida = True
    Else
        DataValida = (Len(NzStr(v)) = 0)  ' vazio ok se opcional
    End If
End Function

Public Function NumeroPositivo(ByVal v As Variant) As Boolean
    If Not IsNumeric(v) Then
        NumeroPositivo = False
    Else
        NumeroPositivo = (CDbl(v) > 0)
    End If
End Function
