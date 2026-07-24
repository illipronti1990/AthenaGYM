Attribute VB_Name = "modAluno"
Option Explicit

'============================================================
' Sprint 3.4 — Cadastro Inteligente Completo (SRP)
' View: frmAluno / FORM_ALUNO → modAluno → modBanco
'============================================================

Private Type TAlunoForm
    editId As Long
    nome As String
    cpf As String
    plano As String
    professor As String
    valor As Double
    forma As String
    rg As String
    sexo As String
    nascimento As String
    telefone As String
    email As String
    cep As String
    endereco As String
    numero As String
    bairro As String
    cidade As String
    diaVenc As Long
End Type

Private Function PodeEditarAluno() As Boolean
    Dim p As String
    p = PerfilUsuario
    PodeEditarAluno = (p = CONST_PERFIL_ADMIN Or p = CONST_PERFIL_REC)
End Function

'------------------------------------------------------------
' Matrícula ATH-CODIGO-000001 (Épico 2) — legado ATH-AAAA-###### permanece
'------------------------------------------------------------
Public Function GerarMatricula() As String
    Dim prefixo As String
    Dim codigo As String
    Dim seq As Long
    prefixo = PrefixoMatricula()
    If Len(Trim$(prefixo)) = 0 Then prefixo = "ATH"
    On Error Resume Next
    codigo = ObterCodigoUnidade()
    On Error GoTo 0
    If Len(Trim$(codigo)) = 0 Then codigo = "MX"
    seq = ProximoSeqMatriculaCodigo(prefixo & "-" & codigo)
    GerarMatricula = UCase$(prefixo) & "-" & UCase$(codigo) & "-" & Format$(seq, "000000")
End Function

Public Function CPFExiste(ByVal cpf As String) As Boolean
    CPFExiste = CPFExisteNoBanco(cpf, 0)
End Function

'------------------------------------------------------------
' Validação (mensagem: Campo obrigatório: + nome do campo)
'------------------------------------------------------------
Private Function ValidarAluno(ByRef dados As TAlunoForm, ByRef msg As String) As Boolean
    If Len(Trim$(dados.nome)) = 0 Then
        msg = "Campo obrigatório:" & vbCrLf & "Nome"
        ValidarAluno = False: Exit Function
    End If
    If Len(Trim$(dados.cpf)) = 0 Then
        msg = "Campo obrigatório:" & vbCrLf & "CPF"
        ValidarAluno = False: Exit Function
    End If
    If Not CPFValido(dados.cpf) Then
        msg = "CPF inválido." & vbCrLf & "Verifique dígitos, formato e sequência repetida."
        ValidarAluno = False: Exit Function
    End If
    If Len(Trim$(dados.plano)) = 0 Then
        msg = "Campo obrigatório:" & vbCrLf & "Plano"
        ValidarAluno = False: Exit Function
    End If
    If Len(Trim$(dados.telefone)) = 0 Then
        msg = "Campo obrigatório:" & vbCrLf & "Telefone"
        ValidarAluno = False: Exit Function
    End If
    If Not TelefoneValido(dados.telefone) Then
        msg = "Telefone inválido." & vbCrLf & "Use DDD + número (10 ou 11 dígitos)."
        ValidarAluno = False: Exit Function
    End If
    If Len(Trim$(dados.forma)) = 0 Then
        msg = "Campo obrigatório:" & vbCrLf & "Forma Pagamento"
        ValidarAluno = False: Exit Function
    End If
    If Not NumeroPositivo(dados.valor) Then
        msg = "Campo obrigatório:" & vbCrLf & "Valor"
        ValidarAluno = False: Exit Function
    End If
    If dados.diaVenc < 1 Or dados.diaVenc > 28 Then
        msg = "Campo obrigatório:" & vbCrLf & "Data Vencimento" & vbCrLf & "(dia 1 a 28)"
        ValidarAluno = False: Exit Function
    End If
    If Len(NzStr(dados.email)) > 0 And Not EmailValido(dados.email) Then
        msg = "E-mail inválido."
        ValidarAluno = False: Exit Function
    End If
    msg = ""
    ValidarAluno = True
End Function

Private Function ValidarDuplicidade(ByRef dados As TAlunoForm, ByRef msg As String) As Boolean
    If CPFExisteNoBanco(dados.cpf, dados.editId) Then
        msg = "CPF já cadastrado."
        ValidarDuplicidade = False: Exit Function
    End If
    If BloquearEmailDuplicado() Then
        If EmailExisteNoBanco(dados.email, dados.editId) Then
            msg = "E-mail já cadastrado."
            ValidarDuplicidade = False: Exit Function
        End If
    End If
    If BloquearTelefoneDuplicado() Then
        If TelefoneExisteNoBanco(dados.telefone, dados.editId) Then
            msg = "Telefone já cadastrado."
            ValidarDuplicidade = False: Exit Function
        End If
    End If
    msg = ""
    ValidarDuplicidade = True
End Function

' Compat
Public Function ValidarCamposAluno(ByVal nome As String, ByVal cpf As String, _
                                   ByVal plano As String, ByVal telefone As String, _
                                   ByVal forma As String, ByRef msg As String) As Boolean
    Dim d As TAlunoForm
    d.nome = nome: d.cpf = cpf: d.plano = plano: d.telefone = telefone: d.forma = forma
    d.valor = 1: d.diaVenc = 10
    ValidarCamposAluno = ValidarAluno(d, msg)
End Function

'------------------------------------------------------------
' Leitura da View (UserForm ou planilha)
'------------------------------------------------------------
Private Function LerDadosForm(Optional ByVal frm As Object = Nothing) As TAlunoForm
    Dim d As TAlunoForm
    If frm Is Nothing Then
        d = LerDadosPlanilha()
    Else
        d = LerDadosUserForm(frm)
    End If
    LerDadosForm = d
End Function

Private Function LerDadosPlanilha() As TAlunoForm
    Dim d As TAlunoForm
    Call FormatarCamposAlunoNaPlanilha
    d.editId = CLng(Val(LerCelula(SHT_FORM_ALUNO, "G7")))
    d.nome = NzStr(LerCelula(SHT_FORM_ALUNO, "D8"))
    d.cpf = FormatarCPF(NzStr(LerCelula(SHT_FORM_ALUNO, "D9")))
    d.plano = NzStr(LerCelula(SHT_FORM_ALUNO, "D10"))
    d.professor = NzStr(LerCelula(SHT_FORM_ALUNO, "D11"))
    If IsNumeric(LerCelula(SHT_FORM_ALUNO, "D12")) Then
        d.valor = CDbl(LerCelula(SHT_FORM_ALUNO, "D12"))
    Else
        d.valor = ValorDoPlano(d.plano)
    End If
    d.forma = NzStr(LerCelula(SHT_FORM_ALUNO, "D13"))
    d.rg = NzStr(LerCelula(SHT_FORM_ALUNO, "D14"))
    d.sexo = NzStr(LerCelula(SHT_FORM_ALUNO, "D15"))
    d.nascimento = NzStr(LerCelula(SHT_FORM_ALUNO, "D16"))
    d.telefone = FormatarTelefone(NzStr(LerCelula(SHT_FORM_ALUNO, "D17")))
    d.email = LCase$(NzStr(LerCelula(SHT_FORM_ALUNO, "D18")))
    d.cep = FormatarCEP(NzStr(LerCelula(SHT_FORM_ALUNO, "D19")))
    d.endereco = NzStr(LerCelula(SHT_FORM_ALUNO, "D20"))
    d.numero = NzStr(LerCelula(SHT_FORM_ALUNO, "D21"))
    d.bairro = NzStr(LerCelula(SHT_FORM_ALUNO, "D22"))
    d.cidade = NzStr(LerCelula(SHT_FORM_ALUNO, "D23"))
    d.diaVenc = CLng(Val(LerCelula(SHT_FORM_ALUNO, "D24")))
    If d.diaVenc < 1 Then d.diaVenc = DiaVencimentoPadrao()
    LerDadosPlanilha = d
End Function

Private Function LerDadosUserForm(ByVal frm As Object) As TAlunoForm
    Dim d As TAlunoForm
    On Error Resume Next
    d.editId = CLng(Val(frm.Tag))
    d.nome = NzStr(frm.txtNome.Value)
    d.cpf = FormatarCPF(NzStr(frm.txtCPF.Value))
    frm.txtCPF.Value = d.cpf
    d.plano = NzStr(frm.cmbPlano.Value)
    d.professor = NzStr(frm.txtProfessor.Value)
    If IsNumeric(frm.txtValor.Value) Then
        d.valor = CDbl(frm.txtValor.Value)
    Else
        d.valor = ValorDoPlano(d.plano)
    End If
    d.forma = NzStr(frm.cmbForma.Value)
    d.rg = NzStr(frm.txtRG.Value)
    d.sexo = NzStr(frm.cmbSexo.Value)
    d.nascimento = NzStr(frm.txtNascimento.Value)
    d.telefone = FormatarTelefone(NzStr(frm.txtTelefone.Value))
    frm.txtTelefone.Value = d.telefone
    d.email = LCase$(NzStr(frm.txtEmail.Value))
    d.cep = FormatarCEP(NzStr(frm.txtCEP.Value))
    frm.txtCEP.Value = d.cep
    d.endereco = NzStr(frm.txtEndereco.Value)
    d.numero = NzStr(frm.txtNumero.Value)
    d.bairro = NzStr(frm.txtBairro.Value)
    d.cidade = NzStr(frm.txtCidade.Value)
    d.diaVenc = CLng(Val(frm.txtDiaVenc.Value))
    If d.diaVenc < 1 Then d.diaVenc = DiaVencimentoPadrao()
    On Error GoTo 0
    LerDadosUserForm = d
End Function

Private Sub MostrarMsgView(ByVal frm As Object, ByVal titulo As String, ByVal detalhe As String)
    On Error Resume Next
    If frm Is Nothing Then
        MostrarStatusForm titulo, detalhe
    Else
        frm.lblStatus.Caption = titulo & IIf(Len(detalhe) > 0, vbCrLf & detalhe, "")
    End If
    On Error GoTo 0
End Sub

'------------------------------------------------------------
' Persistência
'------------------------------------------------------------
Private Function GravarAluno(ByRef dados As TAlunoForm, ByVal matricula As String, _
                             ByVal idAluno As Long, ByVal dataCad As Variant, _
                             ByVal novo As Boolean) As ListRow
    Dim cols As Variant, vals As Variant
    Dim lr As ListRow

    cols = Array("ID", "Matrícula", "Nome", "CPF", "RG", "DataNascimento", "Sexo", _
                 "Telefone", "WhatsApp", "Email", "CEP", "Endereço", "Número", "Bairro", _
                 "Cidade", "Plano", "Professor", "ValorPlano", "FormaPagamento", "DataCadastro", "Status")
    vals = Array(idAluno, matricula, dados.nome, dados.cpf, dados.rg, dados.nascimento, dados.sexo, _
                 dados.telefone, dados.telefone, dados.email, dados.cep, dados.endereco, dados.numero, _
                 dados.bairro, dados.cidade, dados.plano, dados.professor, dados.valor, dados.forma, _
                 dataCad, "Ativo")

    If novo Then
        Set lr = AdicionarRegistroAluno(cols, vals)
    Else
        Set lr = BuscarLinhaAlunoPorId(idAluno)
        Call EditarRegistroAluno(lr, cols, vals)
    End If
    Set GravarAluno = lr
End Function

Public Sub CriarMensalidade(ByVal nome As String, ByVal matricula As String, _
                            ByVal valor As Double, ByVal forma As String, ByVal diaVenc As Long)
    Dim venc As Date, comp As Date
    If diaVenc < 1 Or diaVenc > 28 Then diaVenc = DiaVencimentoPadrao()
    comp = DateSerial(Year(DataAtual()), Month(DataAtual()), 1)
    venc = DateSerial(Year(DataAtual()), Month(DataAtual()), diaVenc)
    Call InserirMensalidade(nome, matricula, comp, valor, venc, forma)
End Sub

Public Sub CriarContaReceberAluno(ByVal matricula As String, ByVal nome As String, _
                                  ByVal valor As Double, ByVal diaVenc As Long, _
                                  ByVal forma As String)
    Dim venc As Date
    If diaVenc < 1 Or diaVenc > 28 Then diaVenc = DiaVencimentoPadrao()
    venc = DateSerial(Year(DataAtual()), Month(DataAtual()), diaVenc)
    Call CriarContaReceber(matricula, nome, valor, venc, forma, CompetenciaTexto(venc), "")
End Sub

Public Sub AtualizarDashboard()
    Call AtualizarKPIs
End Sub

Public Sub RegistrarCadastro(ByVal matricula As String, ByVal nome As String, ByVal novo As Boolean)
    If novo Then
        RegistrarLog "Aluno cadastrado", "Alunos", matricula & " / " & nome
    Else
        RegistrarLog "Aluno atualizado", "Alunos", matricula & " / " & nome
    End If
End Sub

Private Sub MensagemSucesso(ByVal nome As String, ByVal matricula As String, ByVal novo As Boolean)
    Dim tit As String
    If novo Then
        tit = "✔ Cadastro realizado com sucesso"
    Else
        tit = "✔ Aluno atualizado com sucesso"
    End If
    MsgBox tit & vbCrLf & vbCrLf & _
           "Aluno:" & vbCrLf & nome & vbCrLf & vbCrLf & _
           "Matrícula:" & vbCrLf & matricula, vbInformation, APP_TITLE
End Sub

'------------------------------------------------------------
' Orquestrador — chamado por frmAluno / planilha
'------------------------------------------------------------
Public Sub SalvarAluno(Optional ByVal frm As Object = Nothing)
    Dim dados As TAlunoForm
    Dim msg As String
    Dim novo As Boolean
    Dim idAluno As Long, matricula As String
    Dim dataCad As Variant
    Dim lr As ListRow

    On Error GoTo TrataErro

    If Not ExigeAcesso("Alunos") Then Exit Sub
    If Not PodeEditarAluno() Then MsgAviso "Seu perfil só pode consultar alunos.": Exit Sub

    dados = LerDadosForm(frm)
    novo = (dados.editId <= 0)

    If Not ValidarAluno(dados, msg) Then
        MostrarMsgView frm, "⚠ " & Replace(msg, vbCrLf, " "), ""
        MsgAviso msg
        Exit Sub
    End If

    If Not ValidarDuplicidade(dados, msg) Then
        MostrarMsgView frm, "⚠ " & msg, ""
        MsgAviso msg
        Exit Sub
    End If

    If novo Then
        idAluno = ProximoIdAluno()
        matricula = GerarMatricula()
        dataCad = DataAtual()
    Else
        Set lr = BuscarLinhaAlunoPorId(dados.editId)
        If lr Is Nothing Then
            MsgErro "Aluno em edição não encontrado."
            Exit Sub
        End If
        idAluno = dados.editId
        matricula = NzStr(LerCampo(lr, "Matrícula"))
        dataCad = LerCampo(lr, "DataCadastro")
    End If

    Set lr = GravarAluno(dados, matricula, idAluno, dataCad, novo)

    If novo Then
        Call CriarMensalidade(dados.nome, matricula, dados.valor, dados.forma, dados.diaVenc)
        Call CriarContaReceberAluno(matricula, dados.nome, dados.valor, dados.diaVenc, dados.forma)
    End If

    Call SincronizarListaAlunos
    Call AtualizarDashboardFinanceiro
    Call AtualizarDashboard
    Call RegistrarCadastro(matricula, dados.nome, novo)

    If frm Is Nothing Then
        GravarCelula SHT_FORM_ALUNO, "H8", idAluno
        GravarCelula SHT_FORM_ALUNO, "H9", matricula
        GravarCelula SHT_FORM_ALUNO, "G7", 0
        MostrarStatusForm "✔ Cadastro realizado com sucesso", "Matrícula: " & matricula
    Else
        frm.Tag = "0"
        frm.lblMatricula.Caption = matricula
        MostrarMsgView frm, "✔ Cadastro realizado com sucesso", "Matrícula: " & matricula
    End If

    Call MensagemSucesso(dados.nome, matricula, novo)
    Exit Sub

TrataErro:
    RegistrarErro Err.Number, Err.Description, "SalvarAluno"
    MsgErro "Ocorreu um erro ao salvar o aluno."
End Sub

Public Sub SalvarAlunoFormulario()
    SalvarAluno
End Sub

'------------------------------------------------------------
' UI planilha / UserForm
'------------------------------------------------------------
Public Sub AbrirFrmAluno()
    On Error GoTo TrataErro
    If Not ExigeAcesso("Alunos") Then Exit Sub
    If Not PodeEditarAluno() Then MsgAviso "Seu perfil só pode consultar alunos.": Exit Sub
    frmAluno.Show vbModal
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AbrirFrmAluno"
    MsgErro "Não foi possível abrir o formulário de aluno."
End Sub

Public Sub NovoAluno()
    On Error GoTo TrataErro
    If Not ExigeAcesso("Alunos") Then Exit Sub
    If Not PodeEditarAluno() Then MsgAviso "Seu perfil só pode consultar alunos.": Exit Sub
    AbrirFrmAluno
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "NovoAluno"
End Sub

Public Sub LimparFormAluno()
    On Error GoTo TrataErro
    Call PrepararCamposTextoForm
    LimparIntervalo SHT_FORM_ALUNO, "D8:D24"
    GravarCelula SHT_FORM_ALUNO, "D13", "PIX"
    GravarCelula SHT_FORM_ALUNO, "D23", "São Paulo"
    GravarCelula SHT_FORM_ALUNO, "D24", DiaVencimentoPadrao()
    GravarCelula SHT_FORM_ALUNO, "G7", 0
    GravarCelula SHT_FORM_ALUNO, "H8", "(ID auto)"
    GravarCelula SHT_FORM_ALUNO, "H9", "(matrícula auto)"
    Call PrepararCamposTextoForm
    MostrarStatusForm "", ""
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "LimparFormAluno"
End Sub

Public Sub MostrarStatusForm(ByVal titulo As String, ByVal detalhe As String)
    On Error Resume Next
    GravarCelula SHT_FORM_ALUNO, "G11", titulo
    GravarCelula SHT_FORM_ALUNO, "G12", detalhe
    On Error GoTo 0
End Sub

Public Sub PrepararCamposTextoForm()
    On Error Resume Next
    FormatoCelula SHT_FORM_ALUNO, "D9", "@"
    FormatoCelula SHT_FORM_ALUNO, "D14", "@"
    FormatoCelula SHT_FORM_ALUNO, "D16", "@"
    FormatoCelula SHT_FORM_ALUNO, "D17", "@"
    FormatoCelula SHT_FORM_ALUNO, "D18", "@"
    FormatoCelula SHT_FORM_ALUNO, "D19", "@"
    FormatoCelula SHT_FORM_ALUNO, "D21", "@"
    On Error GoTo 0
End Sub

Public Sub FormatarCamposAlunoNaPlanilha()
    Dim v As String
    Call PrepararCamposTextoForm
    v = NzStr(LerCelula(SHT_FORM_ALUNO, "D9"))
    If Len(SomenteNumeros(v)) = 11 Then Call GravarTexto(RangeDaCelula(SHT_FORM_ALUNO, "D9"), FormatarCPF(v))
    v = NzStr(LerCelula(SHT_FORM_ALUNO, "D14"))
    If Len(SomenteNumeros(v)) >= 8 Then Call GravarTexto(RangeDaCelula(SHT_FORM_ALUNO, "D14"), FormatarRG(v))
    v = NzStr(LerCelula(SHT_FORM_ALUNO, "D16"))
    If Len(SomenteNumeros(v)) = 8 Or IsDate(LerCelula(SHT_FORM_ALUNO, "D16")) Then
        Call GravarTexto(RangeDaCelula(SHT_FORM_ALUNO, "D16"), FormatarDataBR(LerCelula(SHT_FORM_ALUNO, "D16")))
    End If
    v = NzStr(LerCelula(SHT_FORM_ALUNO, "D17"))
    If Len(SomenteNumeros(v)) >= 10 Then Call GravarTexto(RangeDaCelula(SHT_FORM_ALUNO, "D17"), FormatarTelefone(v))
    v = NzStr(LerCelula(SHT_FORM_ALUNO, "D19"))
    If Len(SomenteNumeros(v)) >= 7 Then Call GravarTexto(RangeDaCelula(SHT_FORM_ALUNO, "D19"), FormatarCEP(v))
    v = NzStr(LerCelula(SHT_FORM_ALUNO, "D21"))
    If Len(v) > 0 Then Call GravarTexto(RangeDaCelula(SHT_FORM_ALUNO, "D21"), v)
End Sub

Public Sub OnFormAlunoChange(ByVal Target As Range)
    Dim addr As String
    Dim dig As String
    If Target Is Nothing Then Exit Sub
    If Target.Cells.CountLarge > 5 Then Exit Sub
    addr = Target.Address(False, False)
    Application.EnableEvents = False
    On Error GoTo Sai
    Select Case UCase$(addr)
        Case "D9"
            dig = SomenteNumeros(NzStr(Target.Value))
            If Len(dig) = 11 Then Call GravarTexto(Target, FormatarCPF(CStr(Target.Value))) Else Target.NumberFormat = "@"
        Case "D14"
            dig = SomenteNumeros(NzStr(Target.Value))
            If Len(dig) >= 8 Then Call GravarTexto(Target, FormatarRG(CStr(Target.Value))) Else Call GravarTexto(Target, NzStr(Target.Value))
        Case "D16"
            dig = SomenteNumeros(NzStr(Target.Value))
            If Len(dig) = 8 Or IsDate(Target.Value) Then Call GravarTexto(Target, FormatarDataBR(Target.Value)) Else Target.NumberFormat = "@"
        Case "D17"
            dig = SomenteNumeros(NzStr(Target.Value))
            If Len(dig) >= 10 Then Call GravarTexto(Target, FormatarTelefone(CStr(Target.Value))) Else Target.NumberFormat = "@"
        Case "D18"
            Call GravarTexto(Target, LCase$(NzStr(Target.Value)))
        Case "D19"
            dig = SomenteNumeros(NzStr(Target.Value))
            If Len(dig) >= 7 Then Call GravarTexto(Target, FormatarCEP(CStr(Target.Value))) Else Call GravarTexto(Target, NzStr(Target.Value))
        Case "D21"
            Call GravarTexto(Target, NzStr(Target.Value))
    End Select
Sai:
    Application.EnableEvents = True
End Sub

Public Sub EditarAluno()
    Dim nome As String
    Dim lr As ListRow

    On Error GoTo TrataErro
    If Not ExigeAcesso("Alunos") Then Exit Sub
    If Not PodeEditarAluno() Then MsgAviso "Seu perfil só pode consultar alunos.": Exit Sub

    nome = InputBox("Digite o nome (ou parte) do aluno para editar:", "Editar Aluno")
    If Trim$(nome) = "" Then Exit Sub

    Set lr = BuscarLinhaAlunoPorNome(nome)
    If lr Is Nothing Then MsgAviso "Aluno não encontrado.": Exit Sub

    frmAluno.Tag = CStr(LerCampo(lr, "ID"))
    On Error Resume Next
    frmAluno.txtNome.Value = NzStr(LerCampo(lr, "Nome"))
    frmAluno.txtCPF.Value = NzStr(LerCampo(lr, "CPF"))
    frmAluno.cmbPlano.Value = NzStr(LerCampo(lr, "Plano"))
    frmAluno.txtProfessor.Value = NzStr(LerCampo(lr, "Professor"))
    frmAluno.txtValor.Value = LerCampo(lr, "ValorPlano")
    frmAluno.cmbForma.Value = NzStr(LerCampo(lr, "FormaPagamento"))
    frmAluno.txtRG.Value = NzStr(LerCampo(lr, "RG"))
    frmAluno.cmbSexo.Value = NzStr(LerCampo(lr, "Sexo"))
    frmAluno.txtNascimento.Value = FormatarDataBR(LerCampo(lr, "DataNascimento"))
    frmAluno.txtTelefone.Value = NzStr(LerCampo(lr, "Telefone"))
    frmAluno.txtEmail.Value = NzStr(LerCampo(lr, "Email"))
    frmAluno.txtCEP.Value = NzStr(LerCampo(lr, "CEP"))
    frmAluno.txtEndereco.Value = NzStr(LerCampo(lr, "Endereço"))
    frmAluno.txtNumero.Value = NzStr(LerCampo(lr, "Número"))
    frmAluno.txtBairro.Value = NzStr(LerCampo(lr, "Bairro"))
    frmAluno.txtCidade.Value = NzStr(LerCampo(lr, "Cidade"))
    frmAluno.txtDiaVenc.Value = DiaVencimentoPadrao()
    frmAluno.lblMatricula.Caption = NzStr(LerCampo(lr, "Matrícula"))
    On Error GoTo TrataErro
    frmAluno.Show vbModal
    Exit Sub

TrataErro:
    RegistrarErro Err.Number, Err.Description, "EditarAluno"
    MsgErro "Erro ao carregar aluno."
End Sub

Public Sub EditarAlunoFormulario()
    EditarAluno
End Sub

Public Sub ExcluirAluno()
    Dim editId As Long
    Dim lr As ListRow
    Dim nome As String, matricula As String

    On Error GoTo TrataErro
    If Not ExigeAcesso("Excluir") Then Exit Sub

    editId = CLng(Val(LerCelula(SHT_FORM_ALUNO, "G7")))
    If editId <= 0 Then
        Call EditarAluno
        Exit Sub
    End If

    Set lr = BuscarLinhaAlunoPorId(editId)
    If lr Is Nothing Then MsgAviso "Aluno não encontrado.": Exit Sub

    nome = NzStr(LerCampo(lr, "Nome"))
    matricula = NzStr(LerCampo(lr, "Matrícula"))
    If MsgBox("Excluir aluno " & nome & " (" & matricula & ")?", vbYesNo + vbExclamation, APP_TITLE) <> vbYes Then Exit Sub

    Call ExcluirRegistro(lr)
    Call SincronizarListaAlunos
    Call AtualizarDashboard
    RegistrarLog "Aluno excluído", "Alunos", matricula & " / " & nome
    LimparFormAluno
    MostrarStatusForm "✔ Aluno excluído.", matricula
    Exit Sub

TrataErro:
    RegistrarErro Err.Number, Err.Description, "ExcluirAluno"
    MsgErro "Erro ao excluir aluno."
End Sub

Public Sub ExcluirAlunoFormulario()
    ExcluirAluno
End Sub

Public Sub CancelarAluno()
    Dim editId As Long
    Dim lr As ListRow
    On Error GoTo TrataErro
    editId = CLng(Val(LerCelula(SHT_FORM_ALUNO, "G7")))
    If editId <= 0 Then MsgAviso "Carregue um aluno com Editar.": Exit Sub
    Set lr = BuscarLinhaAlunoPorId(editId)
    If lr Is Nothing Then Exit Sub
    Call GravarCampo(lr, "Status", "Cancelado")
    Call SincronizarListaAlunos
    Call AtualizarDashboard
    RegistrarLog "Aluno cancelado", "Alunos", NzStr(LerCampo(lr, "Matrícula"))
    MostrarStatusForm "✔ Status: Cancelado.", NzStr(LerCampo(lr, "Matrícula"))
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "CancelarAluno"
End Sub

Public Sub AtualizarStatus(ByVal idAluno As Long, ByVal novoStatus As String)
    Dim lr As ListRow
    On Error GoTo TrataErro
    Set lr = BuscarLinhaAlunoPorId(idAluno)
    If lr Is Nothing Then Exit Sub
    Call GravarCampo(lr, "Status", novoStatus)
    Call SincronizarListaAlunos
    Call AtualizarDashboard
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarStatus"
End Sub

Public Function BuscarAluno(ByVal trechoNome As String) As ListRow
    Set BuscarAluno = BuscarLinhaAlunoPorNome(trechoNome)
End Function

' Alias antigo
Public Sub AtualizarDashboardAluno()
    AtualizarDashboard
End Sub
