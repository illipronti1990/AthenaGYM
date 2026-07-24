Attribute VB_Name = "modUtil"
Option Explicit

'============================================================
' Sprint 3.3 — Utilitários reutilizáveis (sem acesso a planilha)
'============================================================

Public Const APP_TITLE As String = "ATHENAS GYM"

Public Sub MsgErro(ByVal texto As String)
    MsgBox texto, vbExclamation, APP_TITLE
End Sub

Public Sub MsgAviso(ByVal texto As String)
    MsgBox texto, vbExclamation, APP_TITLE
End Sub

Public Sub MsgOk(ByVal texto As String)
    MsgBox texto, vbInformation, APP_TITLE
End Sub

Public Function NzStr(ByVal v As Variant) As String
    If IsError(v) Then
        NzStr = ""
    ElseIf IsNull(v) Then
        NzStr = ""
    Else
        NzStr = Trim$(CStr(v))
    End If
End Function

Public Function SheetExists(ByVal sheetName As String) As Boolean
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(sheetName)
    SheetExists = Not ws Is Nothing
    On Error GoTo 0
End Function

Public Function SomenteNumeros(ByVal texto As String) As String
    Dim i As Long, ch As String, out As String
    out = ""
    For i = 1 To Len(texto)
        ch = Mid$(texto, i, 1)
        If ch >= "0" And ch <= "9" Then out = out & ch
    Next i
    SomenteNumeros = out
End Function

' Alias legado
Public Function SoDigitos(ByVal texto As String) As String
    SoDigitos = SomenteNumeros(texto)
End Function

Public Function FormatarCPF(ByVal cpf As String) As String
    Dim n As String
    n = SomenteNumeros(cpf)
    If Len(n) <> 11 Then
        FormatarCPF = cpf
    Else
        FormatarCPF = Left$(n, 3) & "." & Mid$(n, 4, 3) & "." & Mid$(n, 7, 3) & "-" & Right$(n, 2)
    End If
End Function

Public Function FormatCPF(ByVal cpf As String) As String
    FormatCPF = FormatarCPF(cpf)
End Function

Public Function FormatarTelefone(ByVal tel As String) As String
    Dim n As String
    n = SomenteNumeros(tel)
    If Len(n) = 11 Then
        FormatarTelefone = "(" & Left$(n, 2) & ") " & Mid$(n, 3, 5) & "-" & Right$(n, 4)
    ElseIf Len(n) = 10 Then
        FormatarTelefone = "(" & Left$(n, 2) & ") " & Mid$(n, 3, 4) & "-" & Right$(n, 4)
    Else
        FormatarTelefone = tel
    End If
End Function

Public Function FormatTelefone(ByVal tel As String) As String
    FormatTelefone = FormatarTelefone(tel)
End Function

Public Function FormatarCEP(ByVal cep As String) As String
    Dim n As String
    n = SomenteNumeros(cep)
    If Len(n) >= 7 And Len(n) < 8 Then n = Right$("00000000" & n, 8)
    If Len(n) = 8 Then
        FormatarCEP = Left$(n, 5) & "-" & Right$(n, 3)
    Else
        FormatarCEP = cep
    End If
End Function

Public Function FormatCEP(ByVal cep As String) As String
    FormatCEP = FormatarCEP(cep)
End Function

Public Function FormatarRG(ByVal rg As String) As String
    Dim n As String
    n = SomenteNumeros(rg)
    If Len(n) = 9 Then
        FormatarRG = Left$(n, 2) & "." & Mid$(n, 3, 3) & "." & Mid$(n, 6, 3) & "-" & Right$(n, 1)
    ElseIf Len(n) = 8 Then
        FormatarRG = Left$(n, 2) & "." & Mid$(n, 3, 3) & "." & Mid$(n, 6, 3)
    ElseIf Len(n) > 0 Then
        FormatarRG = n
    Else
        FormatarRG = rg
    End If
End Function

Public Function FormatRG(ByVal rg As String) As String
    FormatRG = FormatarRG(rg)
End Function

Public Function FormatarDataBR(ByVal v As Variant) As String
    Dim n As String
    If IsDate(v) Then
        FormatarDataBR = Format$(CDate(v), "dd/mm/yyyy")
        Exit Function
    End If
    n = SomenteNumeros(NzStr(v))
    If Len(n) = 8 Then
        FormatarDataBR = Left$(n, 2) & "/" & Mid$(n, 3, 2) & "/" & Right$(n, 4)
    Else
        FormatarDataBR = NzStr(v)
    End If
End Function

Public Function FormatDataBR(ByVal v As Variant) As String
    FormatDataBR = FormatarDataBR(v)
End Function

Public Function FormatarMoeda(ByVal valor As Double) As String
    FormatarMoeda = Format$(valor, """R$"" #,##0.00")
End Function

Public Function DataAtual() As Date
    DataAtual = Date
End Function

Public Function HoraAtual() As Date
    HoraAtual = Time
End Function

Public Function UUID() As String
    Randomize
    UUID = Format$(Now, "yyyymmddhhnnss") & Format$(Int(Rnd() * 1000000), "000000")
End Function

Public Function GerarCodigo(ByVal prefixo As String, ByVal numero As Long, Optional ByVal digitos As Long = 6) As String
    GerarCodigo = prefixo & Format$(numero, String$(digitos, "0"))
End Function

Public Sub GravarTexto(ByVal rng As Range, ByVal valor As String)
    rng.NumberFormat = "@"
    rng.Value = CStr(valor)
    On Error Resume Next
    If rng.Hyperlinks.Count > 0 Then rng.Hyperlinks.Delete
    On Error GoTo 0
End Sub
