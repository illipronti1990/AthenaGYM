Attribute VB_Name = "modDashboard"
Option Explicit

'============================================================
' Sprint 5.0 — Dashboards + bridge para modBI
'============================================================

Public Sub AtualizarKPIs()
    On Error GoTo TrataErro
    Call AtualizarBI
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarKPIs"
End Sub

Public Sub AtualizarGraficos()
    AtualizarKPIs
End Sub

Public Sub AtualizarReceita()
    AtualizarKPIs
End Sub

Public Sub AtualizarAlunos()
    AtualizarKPIs
End Sub

Public Sub AtualizarFluxo()
    AtualizarKPIs
End Sub

Public Sub AtualizarDashboardAluno()
    AtualizarKPIs
End Sub

Public Sub AtualizarDashboards()
    On Error GoTo TrataErro
    If Not SessaoAtiva() Then MsgAviso "Faça login.": Exit Sub
    Call AtualizarBI
    Call AtualizarAgenda
    Call AtualizarPainel
    Call AtualizarCRM
    Call AtualizarModuloEsportivo
    Call AtualizarAcesso
    Call AtualizarEstoque
    Call AtualizarPortal
    RegistrarAcao "Dashboards + Agenda + Painel + CRM + Treinos + Acesso + Estoque/PDV + Portal atualizados", "BI"
    MsgOk "Sistema atualizado (inclui Portal / sync cloud)."
    Exit Sub
TrataErro:
    RegistrarErro Err.Number, Err.Description, "AtualizarDashboards"
    MsgErro "Erro ao atualizar dashboards."
End Sub

Public Sub IrDashComercial(): NavegarPara "14_DASH_COMERCIAL": End Sub
Public Sub IrDashProfessores(): NavegarPara "17_DASH_PROFESSORES": End Sub
Public Sub IrDashEstoqueBI(): NavegarPara "18_DASH_ESTOQUE": End Sub
Public Sub IrDashEquipamentos(): NavegarPara "19_DASH_EQUIPAMENTOS": End Sub
