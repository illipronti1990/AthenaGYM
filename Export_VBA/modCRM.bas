Attribute VB_Name = "modCRM"
Option Explicit

'============================================================
' Sprint 6.0 — CRM Inteligente ATHENAS GYM
'============================================================

Public Const SHT_LEADS As String = "BD_LEADS"
Public Const TBL_LEADS As String = "tbLeads"
Public Const SHT_CRM_HIST As String = "BD_CRM_HISTORICO"
Public Const TBL_CRM_HIST As String = "tbCrmHistorico"
Public Const SHT_RETENCAO As String = "BD_RETENCAO"
Public Const TBL_RETENCAO As String = "tbRetencao"
Public Const SHT_CAMPANHAS As String = "BD_CAMPANHAS"
Public Const TBL_CAMPANHAS As String = "tbCampanhas"
Public Const SHT_INDICACOES As String = "BD_INDICACOES"
Public Const TBL_INDICACOES As String = "tbIndicacoes"
Public Const SHT_CRM As String = "22_CRM"
Public Const SHT_DASH_CRM As String = "23_DASH_CRM"

Public Sub AtualizarCRM()
    On Error GoTo TrataErro
    Call IdentificarAlunosEmRisco
    Call AtualizarFunil
    Call AtualizarListaLeadsUI
    Call AtualizarAgendaComercial
    Call AtualizarPainelRiscoCRM
    Call AtualizarDashboardCRM
    Application.Calculate
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarCRM"
End Sub

Public Sub AbrirCRMEAtualizar()
    Call AtualizarCRM
    NavegarPara SHT_CRM
End Sub

Public Sub IrCRM(): NavegarPara SHT_CRM: End Sub
Public Sub IrDashCRM(): NavegarPara SHT_DASH_CRM: End Sub

Private Function ProximoIdLead() As Long
    ProximoIdLead = MaxNumerico(SHT_LEADS, TBL_LEADS, "ID") + 1
End Function

Private Function ProximoIdHistorico() As Long
    ProximoIdHistorico = MaxNumerico(SHT_CRM_HIST, TBL_CRM_HIST, "ID") + 1
End Function

Private Function ProximoIdCampanha() As Long
    ProximoIdCampanha = MaxNumerico(SHT_CAMPANHAS, TBL_CAMPANHAS, "ID") + 1
End Function

Private Function ProximoIdIndicacao() As Long
    ProximoIdIndicacao = MaxNumerico(SHT_INDICACOES, TBL_INDICACOES, "ID") + 1
End Function

Private Function BuscarLeadPorId(ByVal idLead As Long) As ListRow
    Set BuscarLeadPorId = PesquisarRegistro(SHT_LEADS, TBL_LEADS, "ID", CStr(idLead), False)
End Function

Private Function UsuarioAtualCRM() As String
    Dim n As String
    On Error Resume Next
    n = NzStr(LerCelula("BD_SESSAO", "B2"))
    If Len(n) = 0 Then n = "Sistema"
    UsuarioAtualCRM = n
End Function

Public Sub RegistrarHistoricoLead(ByVal idLead As Long, ByVal tipo As String, ByVal descricao As String)
    Dim cols As Variant, vals As Variant
    cols = Array("ID", "LeadID", "Data", "Hora", "Tipo", "Descrição", "Usuário")
    vals = Array(ProximoIdHistorico(), idLead, DataAtual(), Format$(Now, "HH:MM"), tipo, descricao, UsuarioAtualCRM())
    Call AdicionarRegistro(SHT_CRM_HIST, TBL_CRM_HIST, cols, vals)
End Sub

Public Sub NovoLead()
    Dim nome As String, tel As String, email As String, origem As String, interesse As String
    Dim resp As String, obs As String
    Dim cols As Variant, vals As Variant
    Dim idNovo As Long

    On Error GoTo TrataErro
    If Not PodeAcessar("Alunos") Then Call ExigeAcesso("Alunos"): Exit Sub

    nome = Trim$(InputBox("Nome do lead:", "Novo Lead"))
    If Len(nome) = 0 Then Exit Sub
    tel = Trim$(InputBox("Telefone / WhatsApp:", "Novo Lead"))
    email = Trim$(InputBox("E-mail (opcional):", "Novo Lead"))
    origem = Trim$(InputBox("Origem (Instagram, Google, Indicação, Site, Facebook):", "Novo Lead", "Instagram"))
    If Len(origem) = 0 Then origem = "Instagram"
    interesse = Trim$(InputBox("Interesse (Musculação, Funcional, Personal...):", "Novo Lead", "Musculação"))
    resp = Trim$(InputBox("Responsável / consultor:", "Novo Lead", UsuarioAtualCRM()))
    obs = Trim$(InputBox("Observações:", "Novo Lead", ""))

    idNovo = ProximoIdLead()
    cols = Array("ID", "Nome", "Telefone", "Email", "Origem", "Interesse", "Data Cadastro", _
                 "Responsável", "Status", "Observações", "Próxima Ação", "Data Próxima", "Matrícula", "UnidadeID")
    vals = Array(idNovo, nome, tel, email, origem, interesse, DataAtual(), _
                 resp, "Novo", obs, "Ligar", DataAtual(), "", IIf(UnidadeIDSessao() > 0, UnidadeIDSessao(), 1))
    Call AdicionarRegistroUnidade(SHT_LEADS, TBL_LEADS, cols, vals)
    Call RegistrarHistoricoLead(idNovo, "Cadastro", "Lead cadastrado — origem " & origem)
    Call CriarEvento("Marketing", "Contatar lead: " & nome, nome, DataAtual(), "09:00", resp, "Média", "Comercial", "", "CRM")
    RegistrarLog "Lead cadastrado", "CRM", CStr(idNovo) & " / " & nome
    Call AtualizarCRM
    MsgOk "Lead cadastrado: " & nome
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "NovoLead"
    MsgErro "Erro ao cadastrar lead."
End Sub

Private Function LeadIdSelecionado() As Long
    Dim r As Long, v As Variant
    On Error Resume Next
    If ActiveSheet.Name <> SHT_CRM Then
        LeadIdSelecionado = 0
        Exit Function
    End If
    r = ActiveCell.Row
    If r < 21 Or r > 35 Then
        LeadIdSelecionado = 0
        Exit Function
    End If
    v = LerCelula(SHT_CRM, "C" & r)
    LeadIdSelecionado = CLng(Val(v))
End Function

Public Sub EditarLead()
    Dim idLead As Long
    Dim lr As ListRow
    Dim st As String, obs As String, resp As String, acao As String

    On Error GoTo TrataErro
    idLead = LeadIdSelecionado()
    If idLead <= 0 Then
        MsgAviso "Selecione um lead na lista (linhas 21–35)."
        Exit Sub
    End If
    Set lr = BuscarLeadPorId(idLead)
    If lr Is Nothing Then MsgErro "Lead não encontrado.": Exit Sub

    st = Trim$(InputBox("Status (Novo, Contatado, Agendado, Convertido, Perdido):", "Editar Lead", NzStr(LerCampo(lr, "Status"))))
    If Len(st) = 0 Then Exit Sub
    resp = Trim$(InputBox("Responsável:", "Editar Lead", NzStr(LerCampo(lr, "Responsável"))))
    acao = Trim$(InputBox("Próxima ação:", "Editar Lead", NzStr(LerCampo(lr, "Próxima Ação"))))
    obs = Trim$(InputBox("Observações:", "Editar Lead", NzStr(LerCampo(lr, "Observações"))))

    Call GravarCampo(lr, "Status", st)
    Call GravarCampo(lr, "Responsável", resp)
    Call GravarCampo(lr, "Próxima Ação", acao)
    Call GravarCampo(lr, "Observações", obs)
    Call GravarCampo(lr, "Data Próxima", DataAtual())
    Call RegistrarHistoricoLead(idLead, "Atualização", "Status → " & st & " | Ação: " & acao)
    RegistrarLog "Lead atualizado", "CRM", CStr(idLead)
    Call AtualizarCRM
    MsgOk "Lead atualizado."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "EditarLead"
End Sub

Public Sub RegistrarContato()
    Dim idLead As Long
    Dim lr As ListRow
    Dim nota As String

    On Error GoTo TrataErro
    idLead = LeadIdSelecionado()
    If idLead <= 0 Then MsgAviso "Selecione um lead.": Exit Sub
    Set lr = BuscarLeadPorId(idLead)
    If lr Is Nothing Then Exit Sub

    nota = Trim$(InputBox("Resumo do contato:", "Registrar Contato", "Ligação realizada"))
    If Len(nota) = 0 Then Exit Sub

    If StrComp(NzStr(LerCampo(lr, "Status")), "Novo", vbTextCompare) = 0 Then
        Call GravarCampo(lr, "Status", "Contatado")
    End If
    Call GravarCampo(lr, "Próxima Ação", "Follow-up")
    Call GravarCampo(lr, "Data Próxima", DataAtual() + 2)
    Call RegistrarHistoricoLead(idLead, "Ligação", nota)
    Call CriarEvento("Marketing", "Follow-up: " & NzStr(LerCampo(lr, "Nome")), NzStr(LerCampo(lr, "Nome")), _
                     DataAtual() + 2, "10:00", NzStr(LerCampo(lr, "Responsável")), "Média", "Comercial", nota, "CRM")
    Call AtualizarCRM
    MsgOk "Contato registrado."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "RegistrarContato"
End Sub

Public Sub AgendarContato()
    Dim idLead As Long
    Dim lr As ListRow
    Dim hora As String, dia As String, d As Date

    On Error GoTo TrataErro
    idLead = LeadIdSelecionado()
    If idLead <= 0 Then MsgAviso "Selecione um lead.": Exit Sub
    Set lr = BuscarLeadPorId(idLead)
    If lr Is Nothing Then Exit Sub

    dia = Trim$(InputBox("Data (DD/MM/AAAA):", "Agendar Contato", Format$(DataAtual(), "DD/MM/YYYY")))
    If Not IsDate(dia) Then MsgAviso "Data inválida.": Exit Sub
    d = CDate(dia)
    hora = Trim$(InputBox("Hora (HH:MM):", "Agendar Contato", "10:00"))
    If Len(hora) = 0 Then hora = "10:00"

    Call GravarCampo(lr, "Status", "Contatado")
    Call GravarCampo(lr, "Próxima Ação", "Ligar")
    Call GravarCampo(lr, "Data Próxima", d)
    Call RegistrarHistoricoLead(idLead, "Agendamento", "Contato agendado para " & Format$(d, "DD/MM/YYYY") & " " & hora)
    Call CriarEvento("Marketing", "Ligar para " & NzStr(LerCampo(lr, "Nome")), NzStr(LerCampo(lr, "Nome")), _
                     d, hora, NzStr(LerCampo(lr, "Responsável")), "Alta", "Comercial", "", "CRM")
    Call AtualizarCRM
    MsgOk "Contato agendado."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AgendarContato"
End Sub

Public Sub RegistrarAulaExperimental()
    Dim idLead As Long
    Dim lr As ListRow
    Dim hora As String, compareceu As String

    On Error GoTo TrataErro
    idLead = LeadIdSelecionado()
    If idLead <= 0 Then MsgAviso "Selecione um lead.": Exit Sub
    Set lr = BuscarLeadPorId(idLead)
    If lr Is Nothing Then Exit Sub

    hora = Trim$(InputBox("Horário da aula (HH:MM):", "Aula Experimental", "10:30"))
    If Len(hora) = 0 Then hora = "10:30"
    compareceu = Trim$(InputBox("Compareceu? (Sim / Não / Agendar):", "Aula Experimental", "Agendar"))

    If StrComp(compareceu, "Não", vbTextCompare) = 0 Then
        Call GravarCampo(lr, "Status", "Contatado")
        Call GravarCampo(lr, "Próxima Ação", "Reagendar experimental")
        Call GravarCampo(lr, "Data Próxima", DataAtual() + 1)
        Call RegistrarHistoricoLead(idLead, "Aula Experimental", "Não compareceu — reagendar")
        Call CriarEvento("Aula Experimental", "Reagendar experimental — " & NzStr(LerCampo(lr, "Nome")), _
                         NzStr(LerCampo(lr, "Nome")), DataAtual() + 1, hora, NzStr(LerCampo(lr, "Responsável")), _
                         "Alta", "Comercial", "No-show", "CRM")
        MsgOk "No-show registrado. Reagendamento criado."
    ElseIf StrComp(compareceu, "Sim", vbTextCompare) = 0 Then
        Call GravarCampo(lr, "Status", "Agendado")
        Call GravarCampo(lr, "Próxima Ação", "Enviar proposta")
        Call GravarCampo(lr, "Data Próxima", DataAtual())
        Call RegistrarHistoricoLead(idLead, "Aula Experimental", "Compareceu à aula experimental")
        MsgOk "Comparecimento registrado. Próximo passo: proposta."
    Else
        Call GravarCampo(lr, "Status", "Agendado")
        Call GravarCampo(lr, "Próxima Ação", "Aula experimental")
        Call GravarCampo(lr, "Data Próxima", DataAtual())
        Call RegistrarHistoricoLead(idLead, "Agendamento", "Aula experimental às " & hora)
        Call CriarEvento("Aula Experimental", "Aula experimental — " & NzStr(LerCampo(lr, "Nome")), _
                         NzStr(LerCampo(lr, "Nome")), DataAtual(), hora, NzStr(LerCampo(lr, "Responsável")), _
                         "Alta", "Comercial", "", "CRM")
        MsgOk "Aula experimental agendada."
    End If
    Call AtualizarCRM
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "RegistrarAulaExperimental"
End Sub

Public Sub RegistrarProposta()
    Dim idLead As Long
    Dim lr As ListRow
    Dim plano As String

    On Error GoTo TrataErro
    idLead = LeadIdSelecionado()
    If idLead <= 0 Then MsgAviso "Selecione um lead.": Exit Sub
    Set lr = BuscarLeadPorId(idLead)
    If lr Is Nothing Then Exit Sub

    plano = Trim$(InputBox("Plano proposto:", "Proposta", NzStr(LerCampo(lr, "Interesse"))))
    If Len(plano) = 0 Then Exit Sub
    Call GravarCampo(lr, "Observações", NzStr(LerCampo(lr, "Observações")) & " | Proposta: " & plano)
    Call GravarCampo(lr, "Próxima Ação", "Fechar matrícula")
    Call GravarCampo(lr, "Data Próxima", DataAtual() + 1)
    Call RegistrarHistoricoLead(idLead, "Proposta", "Proposta enviada — " & plano)
    Call CriarEvento("Marketing", "Retorno proposta — " & NzStr(LerCampo(lr, "Nome")), NzStr(LerCampo(lr, "Nome")), _
                     DataAtual() + 1, "15:00", NzStr(LerCampo(lr, "Responsável")), "Alta", "Comercial", plano, "CRM")
    Call AtualizarCRM
    MsgOk "Proposta registrada."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "RegistrarProposta"
End Sub

Public Sub ConverterLead()
    Dim idLead As Long
    Dim lr As ListRow
    Dim nome As String, tel As String, email As String
    Dim plano As String, forma As String, cpf As String
    Dim valor As Double, diaVenc As Long
    Dim idAluno As Long, matricula As String
    Dim cols As Variant, vals As Variant
    Dim dataCad As Date

    On Error GoTo TrataErro
    If Not PodeAcessar("Alunos") Then Call ExigeAcesso("Alunos"): Exit Sub

    idLead = LeadIdSelecionado()
    If idLead <= 0 Then MsgAviso "Selecione um lead para converter.": Exit Sub
    Set lr = BuscarLeadPorId(idLead)
    If lr Is Nothing Then MsgErro "Lead não encontrado.": Exit Sub

    If StrComp(NzStr(LerCampo(lr, "Status")), "Convertido", vbTextCompare) = 0 Then
        MsgAviso "Este lead já foi convertido."
        Exit Sub
    End If

    nome = NzStr(LerCampo(lr, "Nome"))
    tel = NzStr(LerCampo(lr, "Telefone"))
    email = NzStr(LerCampo(lr, "Email"))

    cpf = Trim$(InputBox("CPF do novo aluno:", "Converter Lead → Matrícula"))
    If Len(cpf) = 0 Then Exit Sub
    If Not CPFValido(cpf) Then MsgErro "CPF inválido.": Exit Sub
    If CPFExisteNoBanco(cpf, 0) Then MsgErro "CPF já cadastrado.": Exit Sub

    plano = Trim$(InputBox("Plano:", "Converter Lead", "Mensal"))
    If Len(plano) = 0 Then plano = "Mensal"
    valor = ValorDoPlano(plano)
    If valor <= 0 Then
        valor = CDbl(Val(Replace(InputBox("Valor do plano:", "Converter Lead", "149"), ",", ".")))
    End If
    forma = Trim$(InputBox("Forma de pagamento:", "Converter Lead", "PIX"))
    If Len(forma) = 0 Then forma = "PIX"
    diaVenc = DiaVencimentoDoPlano(plano)
    If diaVenc < 1 Or diaVenc > 28 Then diaVenc = DiaVencimentoPadrao()

    dataCad = DataAtual()
    idAluno = ProximoIdAluno()
    matricula = GerarMatricula()

    cols = Array("ID", "Matrícula", "Nome", "CPF", "RG", "DataNascimento", "Sexo", _
                 "Telefone", "WhatsApp", "Email", "CEP", "Endereço", "Número", "Bairro", _
                 "Cidade", "Plano", "Professor", "ValorPlano", "FormaPagamento", "DataCadastro", "Status")
    vals = Array(idAluno, matricula, nome, cpf, "", "", "", _
                 tel, tel, email, "", "", "", "", _
                 CidadeAcademia(), plano, "", valor, forma, dataCad, "Ativo")
    Call AdicionarRegistro(SHT_ALUNOS, TBL_ALUNOS, cols, vals)
    Call CriarMensalidade(nome, matricula, valor, forma, diaVenc)
    Call CriarContaReceberAluno(matricula, nome, valor, diaVenc, forma)

    Call GravarCampo(lr, "Status", "Convertido")
    Call GravarCampo(lr, "Matrícula", matricula)
    Call GravarCampo(lr, "Próxima Ação", "")
    Call RegistrarHistoricoLead(idLead, "Matrícula", "Convertido — matrícula " & matricula)
    Call BaixarIndicacaoSeHouver(nome, tel)
    Call SincronizarListaAlunos
    On Error Resume Next
    Call AtualizarDashboardFinanceiro
    Call AtualizarBI
    Call AtualizarAgenda
    Call AtualizarPainel
    On Error GoTo TrataErro
    Call AtualizarCRM
    RegistrarLog "Lead convertido", "CRM", CStr(idLead) & " → " & matricula & " / " & nome
    MsgOk "Lead convertido em aluno!" & vbCrLf & _
          "Matrícula: " & matricula & vbCrLf & _
          "Plano: " & plano & vbCrLf & _
          "Financeiro e dashboards atualizados."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "ConverterLead"
    MsgErro "Erro ao converter lead."
End Sub

Private Sub BaixarIndicacaoSeHouver(ByVal nomeIndicado As String, ByVal tel As String)
    Dim lo As ListObject
    Dim lr As ListRow
    Dim bonus As Double
    Dim matAluno As String, nomeAluno As String

    On Error Resume Next
    bonus = ObterParametroNumero("CRM", "BonusIndicacao", 50)
    Set lo = ObterTabela(SHT_INDICACOES, TBL_INDICACOES)
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Indicado"))) = 0 Then GoTo Prox
        If StrComp(NzStr(LerCampo(lr, "Status")), "Convertido", vbTextCompare) = 0 Then GoTo Prox
        If StrComp(NzStr(LerCampo(lr, "Indicado")), nomeIndicado, vbTextCompare) = 0 _
           Or StrComp(NzStr(LerCampo(lr, "Telefone Indicado")), tel, vbTextCompare) = 0 Then
            Call GravarCampo(lr, "Status", "Convertido")
            Call GravarCampo(lr, "Bônus", bonus)
            matAluno = NzStr(LerCampo(lr, "Matrícula Aluno"))
            nomeAluno = NzStr(LerCampo(lr, "Aluno"))
            If bonus > 0 Then
                Call LancarNoRazao("Bônus Indicação", "CRM", "Despesa", "IND-" & Format$(Now, "hhnnss"), bonus, 0)
                Call AtualizarFluxoCaixa("Saída", "Indicações", "Bônus indicação — " & nomeAluno, 0, bonus)
            End If
            RegistrarLog "Bônus indicação", "CRM", nomeAluno & " / " & nomeIndicado & " / R$ " & Format$(bonus, "0.00")
        End If
Prox:
    Next lr
End Sub

Public Sub MostrarHistoricoLead()
    Dim idLead As Long
    idLead = LeadIdSelecionado()
    If idLead <= 0 Then MsgAviso "Selecione um lead.": Exit Sub
    Call PreencherHistoricoLeadUI(idLead)
End Sub

Private Sub PreencherHistoricoLeadUI(ByVal idLead As Long)
    Dim lo As ListObject
    Dim lr As ListRow
    Dim i As Long, n As Long
    Dim rows() As Variant
    Dim a As Long, b As Long, k As Long
    Dim tmp As Variant

    On Error Resume Next
    For i = 0 To 7
        GravarCelula SHT_CRM, "C" & (39 + i), ""
        GravarCelula SHT_CRM, "D" & (39 + i), ""
        GravarCelula SHT_CRM, "E" & (39 + i), ""
    Next i

    ReDim rows(1 To 50, 1 To 3)
    n = 0
    Set lo = ObterTabela(SHT_CRM_HIST, TBL_CRM_HIST)
    For Each lr In lo.ListRows
        If CLng(Val(LerCampo(lr, "LeadID"))) <> idLead Then GoTo Prox
        n = n + 1
        rows(n, 1) = LerCampo(lr, "Data")
        rows(n, 2) = NzStr(LerCampo(lr, "Tipo"))
        rows(n, 3) = NzStr(LerCampo(lr, "Descrição"))
Prox:
    Next lr

    ' Ordena por data desc
    For a = 1 To n - 1
        For b = a + 1 To n
            If IsDate(rows(b, 1)) And IsDate(rows(a, 1)) Then
                If CDate(rows(b, 1)) > CDate(rows(a, 1)) Then
                    For k = 1 To 3
                        tmp = rows(a, k): rows(a, k) = rows(b, k): rows(b, k) = tmp
                    Next k
                End If
            End If
        Next b
    Next a

    For i = 1 To Application.Min(8, n)
        If IsDate(rows(i, 1)) Then
            GravarCelula SHT_CRM, "C" & (38 + i), Format$(CDate(rows(i, 1)), "DD/MM/YYYY")
        Else
            GravarCelula SHT_CRM, "C" & (38 + i), rows(i, 1)
        End If
        GravarCelula SHT_CRM, "D" & (38 + i), rows(i, 2)
        GravarCelula SHT_CRM, "E" & (38 + i), rows(i, 3)
    Next i
End Sub

Public Sub AtualizarListaLeadsUI()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim i As Long, n As Long
    Dim rows() As Variant

    On Error Resume Next
    For i = 0 To 14
        GravarCelula SHT_CRM, "C" & (21 + i), ""
        GravarCelula SHT_CRM, "D" & (21 + i), ""
        GravarCelula SHT_CRM, "E" & (21 + i), ""
        GravarCelula SHT_CRM, "F" & (21 + i), ""
        GravarCelula SHT_CRM, "G" & (21 + i), ""
        GravarCelula SHT_CRM, "H" & (21 + i), ""
        GravarCelula SHT_CRM, "I" & (21 + i), ""
        GravarCelula SHT_CRM, "J" & (21 + i), ""
        GravarCelula SHT_CRM, "K" & (21 + i), ""
    Next i

    ReDim rows(1 To 200, 1 To 9)
    n = 0
    Set lo = ObterTabela(SHT_LEADS, TBL_LEADS)
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Nome"))) = 0 Then GoTo Prox
        n = n + 1
        rows(n, 1) = LerCampo(lr, "ID")
        rows(n, 2) = NzStr(LerCampo(lr, "Nome"))
        rows(n, 3) = NzStr(LerCampo(lr, "Telefone"))
        rows(n, 4) = NzStr(LerCampo(lr, "Origem"))
        rows(n, 5) = NzStr(LerCampo(lr, "Interesse"))
        rows(n, 6) = NzStr(LerCampo(lr, "Status"))
        rows(n, 7) = NzStr(LerCampo(lr, "Responsável"))
        rows(n, 8) = NzStr(LerCampo(lr, "Próxima Ação"))
        If IsDate(LerCampo(lr, "Data Próxima")) Then
            rows(n, 9) = Format$(CDate(LerCampo(lr, "Data Próxima")), "DD/MM/YYYY")
        Else
            rows(n, 9) = ""
        End If
Prox:
    Next lr

    For i = 1 To Application.Min(15, n)
        GravarCelula SHT_CRM, "C" & (20 + i), rows(i, 1)
        GravarCelula SHT_CRM, "D" & (20 + i), rows(i, 2)
        GravarCelula SHT_CRM, "E" & (20 + i), rows(i, 3)
        GravarCelula SHT_CRM, "F" & (20 + i), rows(i, 4)
        GravarCelula SHT_CRM, "G" & (20 + i), rows(i, 5)
        GravarCelula SHT_CRM, "H" & (20 + i), rows(i, 6)
        GravarCelula SHT_CRM, "I" & (20 + i), rows(i, 7)
        GravarCelula SHT_CRM, "J" & (20 + i), rows(i, 8)
        GravarCelula SHT_CRM, "K" & (20 + i), rows(i, 9)
    Next i
End Sub

Public Sub AtualizarFunil()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim tot As Long, cont As Long, agend As Long, conv As Long, perd As Long
    Dim ativos As Long
    Dim st As String
    Dim maxV As Long
    Dim i As Long

    On Error Resume Next
    tot = 0: cont = 0: agend = 0: conv = 0: perd = 0
    Set lo = ObterTabela(SHT_LEADS, TBL_LEADS)
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Nome"))) = 0 Then GoTo Prox
        tot = tot + 1
        st = UCase$(NzStr(LerCampo(lr, "Status")))
        Select Case st
            Case "CONTATADO": cont = cont + 1
            Case "AGENDADO": agend = agend + 1: cont = cont + 1
            Case "CONVERTIDO": conv = conv + 1: agend = agend + 1: cont = cont + 1
            Case "PERDIDO": perd = perd + 1
            Case Else
                ' Novo
        End Select
Prox:
    Next lr
    ativos = ContarAlunosAtivos()

    ' Funil cumulativo aproximado
    GravarCelula SHT_CRM, "D13", tot
    GravarCelula SHT_CRM, "D14", cont
    GravarCelula SHT_CRM, "D15", agend
    GravarCelula SHT_CRM, "D16", conv
    GravarCelula SHT_CRM, "D17", ativos

    maxV = Application.Max(1, tot)
    GravarCelula SHT_CRM, "E13", String$(Application.Min(20, Round(tot / maxV * 20)), ChrW(&H2588))
    GravarCelula SHT_CRM, "E14", String$(Application.Min(20, Round(cont / maxV * 20)), ChrW(&H2588))
    GravarCelula SHT_CRM, "E15", String$(Application.Min(20, Round(agend / maxV * 20)), ChrW(&H2588))
    GravarCelula SHT_CRM, "E16", String$(Application.Min(20, Round(conv / maxV * 20)), ChrW(&H2588))
    GravarCelula SHT_CRM, "E17", String$(Application.Min(20, Round(ativos / Application.Max(ativos, maxV) * 20)), ChrW(&H2588))

    GravarCelula SHT_DASH_CRM, "I30", tot
    GravarCelula SHT_DASH_CRM, "I31", cont
    GravarCelula SHT_DASH_CRM, "I32", agend
    GravarCelula SHT_DASH_CRM, "I33", conv
    GravarCelula SHT_DASH_CRM, "I34", ativos
End Sub

Public Sub AtualizarAgendaComercial()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim i As Long, n As Long
    Dim rows() As Variant
    Dim hoje As Date
    Dim a As Long, b As Long, k As Long
    Dim tmp As Variant

    On Error Resume Next
    hoje = DataAtual()
    For i = 0 To 7
        GravarCelula SHT_CRM, "G" & (13 + i), ""
        GravarCelula SHT_CRM, "H" & (13 + i), ""
        GravarCelula SHT_CRM, "I" & (13 + i), ""
        GravarCelula SHT_CRM, "J" & (13 + i), ""
    Next i

    ReDim rows(1 To 40, 1 To 4)
    n = 0
    Set lo = ObterTabela(SHT_LEADS, TBL_LEADS)
    For Each lr In lo.ListRows
        If Not PertenceUnidade(lr) Then GoTo Prox
        If Len(NzStr(LerCampo(lr, "Nome"))) = 0 Then GoTo Prox
        If UCase$(NzStr(LerCampo(lr, "Status"))) = "CONVERTIDO" Then GoTo Prox
        If UCase$(NzStr(LerCampo(lr, "Status"))) = "PERDIDO" Then GoTo Prox
        If Not IsDate(LerCampo(lr, "Data Próxima")) Then GoTo Prox
        If CDate(LerCampo(lr, "Data Próxima")) <> hoje Then GoTo Prox
        n = n + 1
        rows(n, 1) = "09:00"
        If InStr(1, NzStr(LerCampo(lr, "Próxima Ação")), "aula", vbTextCompare) > 0 Then rows(n, 1) = "10:30"
        If InStr(1, NzStr(LerCampo(lr, "Próxima Ação")), "proposta", vbTextCompare) > 0 Then rows(n, 1) = "15:00"
        If InStr(1, NzStr(LerCampo(lr, "Próxima Ação")), "retorno", vbTextCompare) > 0 Then rows(n, 1) = "18:00"
        rows(n, 2) = NzStr(LerCampo(lr, "Próxima Ação"))
        rows(n, 3) = NzStr(LerCampo(lr, "Nome"))
        rows(n, 4) = NzStr(LerCampo(lr, "Responsável"))
Prox:
    Next lr

    For a = 1 To n - 1
        For b = a + 1 To n
            If CStr(rows(b, 1)) < CStr(rows(a, 1)) Then
                For k = 1 To 4
                    tmp = rows(a, k): rows(a, k) = rows(b, k): rows(b, k) = tmp
                Next k
            End If
        Next b
    Next a

    For i = 1 To Application.Min(8, n)
        GravarCelula SHT_CRM, "G" & (12 + i), rows(i, 1)
        GravarCelula SHT_CRM, "H" & (12 + i), rows(i, 2)
        GravarCelula SHT_CRM, "I" & (12 + i), rows(i, 3)
        GravarCelula SHT_CRM, "J" & (12 + i), rows(i, 4)
    Next i
End Sub

Public Sub IdentificarAlunosEmRisco()
    Dim loA As ListObject, loP As ListObject, loR As ListObject
    Dim lr As ListRow, lrP As ListRow
    Dim nome As String, mat As String
    Dim ultima As Date, dias As Long
    Dim diasLimite As Long, freqMin As Long, diasPlano As Long
    Dim motivo As String
    Dim tem As Boolean
    Dim checkins As Long
    Dim hoje As Date

    On Error Resume Next
    hoje = DataAtual()
    diasLimite = CLng(ObterParametroNumero("CRM", "DiasSemPresenca", 15))
    freqMin = CLng(ObterParametroNumero("CRM", "FrequenciaMinimaMes", 4))
    diasPlano = CLng(ObterParametroNumero("CRM", "DiasPlanoVencendo", 30))

    Set loA = ObterTabela(SHT_ALUNOS, TBL_ALUNOS)
    Set loP = ObterTabela("12_PRESENCA", "tblPresenca")
    Set loR = ObterTabela(SHT_RETENCAO, TBL_RETENCAO)

    For Each lr In loA.ListRows
        If Not PertenceUnidade(lr) Then GoTo ProxA
        nome = NzStr(LerCampo(lr, "Nome"))
        mat = NzStr(LerCampo(lr, "Matrícula"))
        If Len(nome) = 0 Then GoTo ProxA
        If StrComp(NzStr(LerCampo(lr, "Status")), "Ativo", vbTextCompare) <> 0 Then GoTo ProxA

        motivo = ""
        ultima = DateSerial(1900, 1, 1)
        checkins = 0
        For Each lrP In loP.ListRows
            If StrComp(NzStr(LerCampo(lrP, "Aluno")), nome, vbTextCompare) = 0 Then
                If IsDate(LerCampo(lrP, "Data")) Then
                    If CDate(LerCampo(lrP, "Data")) > ultima Then ultima = CDate(LerCampo(lrP, "Data"))
                    If Month(CDate(LerCampo(lrP, "Data"))) = Month(hoje) And Year(CDate(LerCampo(lrP, "Data"))) = Year(hoje) Then
                        checkins = checkins + 1
                    End If
                End If
            End If
        Next lrP

        If ultima > DateSerial(1900, 1, 1) Then
            dias = DateDiff("d", ultima, hoje)
            If dias >= diasLimite Then motivo = "Mais de " & diasLimite & " dias sem presença"
        Else
            If IsDate(LerCampo(lr, "DataCadastro")) Then
                If DateDiff("d", CDate(LerCampo(lr, "DataCadastro")), hoje) >= diasLimite Then
                    motivo = "Sem presença registrada"
                End If
            End If
        End If

        If Len(motivo) = 0 And checkins < freqMin And checkins >= 0 Then
            If Day(hoje) > 10 Then motivo = "Frequência abaixo da meta"
        End If

        ' Mensalidade atrasada
        If Len(motivo) = 0 Then
            If ContaAtrasadaMatricula(mat) Then motivo = "Mensalidade atrasada"
        End If

        If Len(motivo) = 0 Then GoTo ProxA

        tem = False
        For Each lrP In loR.ListRows
            If StrComp(NzStr(LerCampo(lrP, "Matrícula")), mat, vbTextCompare) = 0 Then
                If StrComp(NzStr(LerCampo(lrP, "Status")), "Resolvido", vbTextCompare) <> 0 Then
                    Call GravarCampo(lrP, "Motivo", motivo)
                    Call GravarCampo(lrP, "Data", hoje)
                    Call GravarCampo(lrP, "Status", "Em risco")
                    tem = True
                    Exit For
                End If
            End If
        Next lrP

        If Not tem Then
            Call AdicionarRegistro(SHT_RETENCAO, TBL_RETENCAO, _
                Array("Matrícula", "Nome", "Motivo", "Data", "Responsável", "Status"), _
                Array(mat, nome, motivo, hoje, UsuarioAtualCRM(), "Em risco"))
            Call CriarEvento("Marketing", "Retenção: " & nome, mat, hoje, "11:00", UsuarioAtualCRM(), _
                             "Alta", "Comercial", motivo, "CRM")
        End If
ProxA:
    Next lr
End Sub

Private Function ContaAtrasadaMatricula(ByVal matricula As String) As Boolean
    Dim lo As ListObject
    Dim lr As ListRow
    On Error GoTo Sai
    Set lo = ObterTabela(SHT_RECEBER_BD, TBL_RECEBER_BD)
    For Each lr In lo.ListRows
        If StrComp(NzStr(LerCampo(lr, "Matrícula")), matricula, vbTextCompare) = 0 Then
            If StrComp(NzStr(LerCampo(lr, "Situação")), "Atrasado", vbTextCompare) = 0 Then
                ContaAtrasadaMatricula = True
                Exit Function
            End If
        End If
    Next lr
Sai:
    ContaAtrasadaMatricula = False
End Function

Public Sub AtualizarPainelRiscoCRM()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim i As Long, n As Long

    On Error Resume Next
    For i = 0 To 7
        GravarCelula SHT_CRM, "H" & (39 + i), ""
        GravarCelula SHT_CRM, "I" & (39 + i), ""
        GravarCelula SHT_CRM, "J" & (39 + i), ""
    Next i
    n = 0
    Set lo = ObterTabela(SHT_RETENCAO, TBL_RETENCAO)
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Nome"))) = 0 Then GoTo Prox
        If StrComp(NzStr(LerCampo(lr, "Status")), "Resolvido", vbTextCompare) = 0 Then GoTo Prox
        n = n + 1
        If n > 8 Then Exit For
        GravarCelula SHT_CRM, "H" & (38 + n), NzStr(LerCampo(lr, "Nome"))
        GravarCelula SHT_CRM, "I" & (38 + n), NzStr(LerCampo(lr, "Motivo"))
        GravarCelula SHT_CRM, "J" & (38 + n), NzStr(LerCampo(lr, "Status"))
Prox:
    Next lr
    GravarCelula SHT_CRM, "I8", n
End Sub

Public Sub GerarCampanha()
    Dim nome As String, publico As String
    Dim cols As Variant, vals As Variant

    On Error GoTo TrataErro
    nome = Trim$(InputBox("Nome da campanha:", "Nova Campanha", "Volte a Treinar"))
    If Len(nome) = 0 Then Exit Sub
    publico = Trim$(InputBox("Público-alvo:", "Nova Campanha", "Inativos / leads frios"))
    cols = Array("ID", "Nome", "Público", "Data Início", "Data Fim", "Resultado", "Status")
    vals = Array(ProximoIdCampanha(), nome, publico, DataAtual(), DataAtual() + 30, "Em andamento", "Ativa")
    Call AdicionarRegistro(SHT_CAMPANHAS, TBL_CAMPANHAS, cols, vals)
    RegistrarLog "Campanha criada", "CRM", nome
    Call AtualizarDashboardCRM
    MsgOk "Campanha criada: " & nome
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "GerarCampanha"
End Sub

Public Sub NovaIndicacao()
    Dim aluno As String, mat As String, indicado As String, tel As String
    Dim bonus As Double
    Dim cols As Variant, vals As Variant

    On Error GoTo TrataErro
    aluno = Trim$(InputBox("Aluno que indicou:", "Indicação"))
    If Len(aluno) = 0 Then Exit Sub
    mat = Trim$(InputBox("Matrícula do aluno:", "Indicação"))
    indicado = Trim$(InputBox("Nome do indicado:", "Indicação"))
    If Len(indicado) = 0 Then Exit Sub
    tel = Trim$(InputBox("Telefone do indicado:", "Indicação"))
    bonus = ObterParametroNumero("CRM", "BonusIndicacao", 50)

    cols = Array("ID", "Aluno", "Matrícula Aluno", "Indicado", "Telefone Indicado", "Status", "Bônus", "Data")
    vals = Array(ProximoIdIndicacao(), aluno, mat, indicado, tel, "Pendente", bonus, DataAtual())
    Call AdicionarRegistro(SHT_INDICACOES, TBL_INDICACOES, cols, vals)

    ' Cria lead automaticamente
    Call AdicionarRegistroUnidade(SHT_LEADS, TBL_LEADS, _
        Array("ID", "Nome", "Telefone", "Email", "Origem", "Interesse", "Data Cadastro", _
              "Responsável", "Status", "Observações", "Próxima Ação", "Data Próxima", "Matrícula", "UnidadeID"), _
        Array(ProximoIdLead(), indicado, tel, "", "Indicação", "Musculação", DataAtual(), _
              UsuarioAtualCRM(), "Novo", "Indicado por " & aluno, "Ligar", DataAtual(), "", _
              IIf(UnidadeIDSessao() > 0, UnidadeIDSessao(), 1)))
    Call RegistrarHistoricoLead(MaxNumerico(SHT_LEADS, TBL_LEADS, "ID"), "Cadastro", "Indicação de " & aluno)
    Call AtualizarCRM
    MsgOk "Indicação registrada e lead criado."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "NovaIndicacao"
End Sub

Public Sub AtualizarDashboardCRM()
    Dim lo As ListObject
    Dim lr As ListRow
    Dim mes As Long, ano As Long
    Dim leadsMes As Long, convMes As Long, agendMes As Long, perdMes As Long
    Dim dCad As Date, st As String, origem As String
    Dim origens() As String, qtds() As Long
    Dim nOrig As Long, i As Long, j As Long, found As Boolean
    Dim maxO As Long, melhor As String
    Dim cons() As String, cQtd() As Long
    Dim nCons As Long
    Dim indPend As Long, campAtivas As Long
    Dim conversao As Double
    Dim tmpS As String, tmpL As Long

    On Error Resume Next
    mes = Month(DataAtual())
    ano = Year(DataAtual())
    leadsMes = 0: convMes = 0: agendMes = 0: perdMes = 0
    nOrig = 0
    ReDim origens(1 To 30)
    ReDim qtds(1 To 30)
    nCons = 0
    ReDim cons(1 To 30)
    ReDim cQtd(1 To 30)

    Set lo = ObterTabela(SHT_LEADS, TBL_LEADS)
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Nome"))) = 0 Then GoTo Prox
        If Not IsDate(LerCampo(lr, "Data Cadastro")) Then GoTo Prox
        dCad = CDate(LerCampo(lr, "Data Cadastro"))
        If Month(dCad) <> mes Or Year(dCad) <> ano Then GoTo ProxCad

        leadsMes = leadsMes + 1
        st = UCase$(NzStr(LerCampo(lr, "Status")))
        If st = "CONVERTIDO" Then convMes = convMes + 1
        If st = "AGENDADO" Or st = "CONVERTIDO" Then agendMes = agendMes + 1
        If st = "PERDIDO" Then perdMes = perdMes + 1

        If st = "CONVERTIDO" Then
            found = False
            For i = 1 To nCons
                If StrComp(cons(i), NzStr(LerCampo(lr, "Responsável")), vbTextCompare) = 0 Then
                    cQtd(i) = cQtd(i) + 1
                    found = True
                    Exit For
                End If
            Next i
            If Not found And Len(NzStr(LerCampo(lr, "Responsável"))) > 0 Then
                nCons = nCons + 1
                cons(nCons) = NzStr(LerCampo(lr, "Responsável"))
                cQtd(nCons) = 1
            End If
        End If
ProxCad:
        origem = NzStr(LerCampo(lr, "Origem"))
        If Len(origem) = 0 Then GoTo Prox
        found = False
        For i = 1 To nOrig
            If StrComp(origens(i), origem, vbTextCompare) = 0 Then
                qtds(i) = qtds(i) + 1
                found = True
                Exit For
            End If
        Next i
        If Not found Then
            nOrig = nOrig + 1
            origens(nOrig) = origem
            qtds(nOrig) = 1
        End If
Prox:
    Next lr

    If leadsMes > 0 Then conversao = Round(convMes / leadsMes, 2) Else conversao = 0

    GravarCelula SHT_CRM, "C8", leadsMes
    GravarCelula SHT_CRM, "E8", conversao
    ThisWorkbook.Sheets(SHT_CRM).Range("E8").NumberFormat = "0%"
    GravarCelula SHT_CRM, "G8", agendMes

    GravarCelula SHT_DASH_CRM, "C8", leadsMes
    GravarCelula SHT_DASH_CRM, "E8", conversao
    ThisWorkbook.Sheets(SHT_DASH_CRM).Range("E8").NumberFormat = "0%"
    GravarCelula SHT_DASH_CRM, "G8", agendMes
    GravarCelula SHT_DASH_CRM, "I8", convMes
    GravarCelula SHT_DASH_CRM, "D12", perdMes

    maxO = 0
    melhor = "—"
    For i = 1 To nOrig
        If qtds(i) > maxO Then
            maxO = qtds(i)
            melhor = origens(i)
        End If
    Next i
    GravarCelula SHT_DASH_CRM, "D13", melhor

    ' Origens UI
    For i = 0 To 7
        GravarCelula SHT_DASH_CRM, "G" & (13 + i), ""
        GravarCelula SHT_DASH_CRM, "H" & (13 + i), ""
        GravarCelula SHT_DASH_CRM, "I" & (13 + i), ""
    Next i
    maxO = Application.Max(1, maxO)
    For i = 1 To Application.Min(8, nOrig)
        GravarCelula SHT_DASH_CRM, "G" & (12 + i), origens(i)
        GravarCelula SHT_DASH_CRM, "H" & (12 + i), qtds(i)
        GravarCelula SHT_DASH_CRM, "I" & (12 + i), String$(Application.Min(20, Round(qtds(i) / maxO * 20)), ChrW(&H2588))
    Next i

    ' Ranking bubble sort
    For i = 1 To nCons - 1
        For j = i + 1 To nCons
            If cQtd(j) > cQtd(i) Then
                tmpL = cQtd(i): cQtd(i) = cQtd(j): cQtd(j) = tmpL
                tmpS = cons(i): cons(i) = cons(j): cons(j) = tmpS
            End If
        Next j
    Next i
    For i = 0 To 5
        GravarCelula SHT_DASH_CRM, "C" & (20 + i), ""
        GravarCelula SHT_DASH_CRM, "D" & (20 + i), ""
        GravarCelula SHT_DASH_CRM, "E" & (20 + i), ""
    Next i
    maxO = 1
    If nCons >= 1 Then maxO = Application.Max(1, cQtd(1))
    For i = 1 To Application.Min(6, nCons)
        GravarCelula SHT_DASH_CRM, "C" & (19 + i), cons(i)
        GravarCelula SHT_DASH_CRM, "D" & (19 + i), cQtd(i)
        GravarCelula SHT_DASH_CRM, "E" & (19 + i), String$(Application.Min(20, Round(cQtd(i) / maxO * 20)), ChrW(&H2588))
    Next i

    indPend = ContarOnde(SHT_INDICACOES, TBL_INDICACOES, "Status", "Pendente")
    campAtivas = ContarOnde(SHT_CAMPANHAS, TBL_CAMPANHAS, "Status", "Ativa")
    GravarCelula SHT_DASH_CRM, "D14", indPend
    GravarCelula SHT_DASH_CRM, "D15", campAtivas

    ' Campanhas
    For i = 0 To 5
        GravarCelula SHT_DASH_CRM, "C" & (30 + i), ""
        GravarCelula SHT_DASH_CRM, "D" & (30 + i), ""
        GravarCelula SHT_DASH_CRM, "E" & (30 + i), ""
        GravarCelula SHT_DASH_CRM, "F" & (30 + i), ""
    Next i
    i = 0
    Set lo = ObterTabela(SHT_CAMPANHAS, TBL_CAMPANHAS)
    For Each lr In lo.ListRows
        If Len(NzStr(LerCampo(lr, "Nome"))) = 0 Then GoTo ProxC
        i = i + 1
        If i > 6 Then Exit For
        GravarCelula SHT_DASH_CRM, "C" & (29 + i), NzStr(LerCampo(lr, "Nome"))
        GravarCelula SHT_DASH_CRM, "D" & (29 + i), NzStr(LerCampo(lr, "Público"))
        GravarCelula SHT_DASH_CRM, "E" & (29 + i), NzStr(LerCampo(lr, "Resultado"))
        GravarCelula SHT_DASH_CRM, "F" & (29 + i), NzStr(LerCampo(lr, "Status"))
ProxC:
    Next lr

    On Error Resume Next
    GravarCelula "BI_BASE", "E32", leadsMes
    GravarCelula "BI_BASE", "E33", conversao
    GravarCelula "BI_BASE", "E34", convMes
End Sub
