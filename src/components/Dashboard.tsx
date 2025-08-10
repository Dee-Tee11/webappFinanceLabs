"use client";
import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PieChart,
  BarChart3,
  Settings,
  User,
  Receipt,
  Calendar,
} from "lucide-react";

import Profile from "./Profile";
import StatCard from "./dashboard/StatCard";
import Summary from "./dashboard/Summary";
import ReceiptsList from "./dashboard/ReceiptsList";
import Placeholder from "./dashboard/Placeholder";
import AddCard from "./dashboard/AddCard";
import ClientDropdown from "./ClientDropdown";
import DateSelector from "./DateSelector";

import { useReceipts } from "@/hooks/useReceipts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDateFilter } from "@/hooks/useDateFilter";

// Função para formatar números como moeda (Euro)
const formatCurrency = (value: number): string => {
  return value.toLocaleString("pt-PT", {
    style: "currency",
    currency: "EUR",
  });
};

const Dashboard = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Custom Hooks
  const { dateFilter, customDateRange, setCustomDateRange, showDateSelector, setShowDateSelector, handleDateFilterChange, getFilterText, formatDate } = useDateFilter();
  const { receipts, filteredReceipts, loadingReceipts, receiptsError, fetchReceipts } = useReceipts(activeMenuItem, dateFilter, customDateRange);
  const { totals, handleAddCard: handleAddDashboardCard } = useDashboardData();

  // Estado para controlar se o usuário é gestor
  const [userRole, setUserRole] = useState("manager"); // ou "user"
  const isManager = userRole === "manager";

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "despesas", label: "Despesas", icon: TrendingDown },
    { id: "fornecedores", label: "Fornecedores", icon: User },
    { id: "servicos", label: "Serviços/Vendas", icon: CreditCard },
  ];

  const handleAddCard = () => {
    setIsCardExpanded(true);
  };

  const handleCloseForm = () => {
    setIsCardExpanded(false);
  };

  const handleReceiptProcessed = (receipt: any) => {
    // Se for um recibo processado via OCR, atualizar lista de recibos
    if (receipt.id && typeof receipt.id === "string") {
      if (activeMenuItem === "despesas") {
        fetchReceipts();
      }
    } else {
      // Se for um card manual, adicionar aos cards
      handleAddDashboardCard(receipt);
    }
  };

  const handleViewProfile = () => {
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
  };

  // Função para renderizar o conteúdo baseado no menu ativo
  const renderContent = () => {
    if (showProfile) {
      return <Profile onClose={handleCloseProfile} />;
    }

    switch (activeMenuItem) {
      case "dashboard":
        return renderDashboard();
      case "despesas":
        return renderDespesas();
      case "fornecedores":
        return (
          <Placeholder
            icon={User}
            title="Fornecedores"
            message="Esta secção está em construção."
          />
        );
      case "servicos":
        return (
          <Placeholder
            icon={CreditCard}
            title="Serviços/Vendas"
            message="Esta secção está em construção."
          />
        );
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <>
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl mb-xl">
        <AddCard
          isExpanded={isCardExpanded}
          onAddCard={handleAddCard}
          onCloseForm={handleCloseForm}
          onReceiptProcessed={handleReceiptProcessed}
          activeMenuItem={activeMenuItem}
        />

        {/* Outros Cards */}
        {!isCardExpanded && (
          <>
            <StatCard
              title="RECEITA TOTAL"
              value={formatCurrency(totals.receita)}
              icon={DollarSign}
              iconBgColor="bg-green-50"
              iconColor="text-green-600"
              percentage="+12%"
              percentageBgColor="bg-green-50"
              percentageColor="text-green-700"
              period="vs. mês anterior"
            />
            <StatCard
              title="DESPESAS"
              value={formatCurrency(totals.despesas)}
              icon={TrendingDown}
              iconBgColor="bg-red-50"
              iconColor="text-red-600"
              percentage="-5%"
              percentageBgColor="bg-red-50"
              percentageColor="text-red-600"
              period="vs. mês anterior"
            />
            <StatCard
              title="LUCRO LÍQUIDO"
              value={formatCurrency(totals.lucroLiquido)}
              icon={TrendingUp}
              iconBgColor="bg-green-50"
              iconColor="text-green-600"
              percentage="+18%"
              percentageBgColor="bg-green-50"
              percentageColor="text-green-700"
              period="vs. mês anterior"
            />
            <StatCard
              title="TRANSAÇÕES"
              value={totals.transacoes.toString()}
              icon={CreditCard}
              iconBgColor="bg-blue-light"
              iconColor="text-primary"
              percentage="+8%"
              percentageBgColor="bg-green-50"
              percentageColor="text-green-700"
              period="este mês"
            />
            <StatCard
              title="INVESTIMENTOS"
              value={formatCurrency(totals.investimentos)}
              icon={PieChart}
              iconBgColor="bg-blue-light"
              iconColor="text-secondary"
              percentage="+3%"
              percentageBgColor="bg-green-50"
              percentageColor="text-green-700"
              period="carteira total"
            />
          </>
        )}
      </div>

      {/* Análise Mensal e Resumo Financeiro */}
      {!isCardExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
          <Summary totals={totals} formatCurrency={formatCurrency} />

          <div className="bg-white p-xl rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-base">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  ANÁLISE MENSAL
                </p>
                <p className="text-3xl font-bold text-text">89%</p>
              </div>
              <div className="w-12 h-12 bg-blue-light rounded-base flex items-center justify-center">
                <BarChart3 size={24} className="text-primary" />
              </div>
            </div>
            <div className="flex items-center space-x-sm">
              <div className="px-sm py-xs bg-green-50 text-green-700 rounded-sm text-xs font-medium">
                +2%
              </div>
              <span className="text-sm text-gray-500">eficiência</span>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderDespesas = () => (
    <div className="space-y-xl">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-xl mb-xl">
        <div className="bg-white p-xl rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                TOTAL DE RECIBOS
              </p>
              <p className="text-3xl font-bold text-text">
                {filteredReceipts.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-light rounded-base flex items-center justify-center">
              <Receipt size={24} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white p-xl rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">VALOR TOTAL</p>
              <p className="text-3xl font-bold text-text">
                {formatCurrency(
                  filteredReceipts.reduce(
                    (sum, receipt) => sum + (receipt.total_amount || 0),
                    0
                  )
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-base flex items-center justify-center">
              <DollarSign size={24} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-xl rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">ESTE MÊS</p>
              <p className="text-3xl font-bold text-text">
                {
                  receipts.filter((receipt) => {
                    if (!receipt.date_detected) return false;
                    const receiptDate = new Date(receipt.date_detected);
                    const currentDate = new Date();
                    return (
                      receiptDate.getMonth() === currentDate.getMonth() &&
                      receiptDate.getFullYear() === currentDate.getFullYear()
                    );
                  }).length
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-base flex items-center justify-center">
              <Calendar size={24} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Filtro por Data */}
      <div className="flex flex-wrap gap-sm mb-base">
        {[
          { key: "todos", label: "Todos" },
          { key: "mes", label: "Este Mês" },
          { key: "3meses", label: "Últimos 3 Meses" },
          { key: "calendario", label: "Calendário" },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => handleDateFilterChange(filter.key)}
            className={`px-base py-sm rounded-base font-medium transition-all duration-200 flex items-center space-x-sm ${
              dateFilter === filter.key
                ? "bg-primary-gradient text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {filter.key === "calendario" && <Calendar size={16} />}
            <span>
              {filter.key === "calendario" && customDateRange
                ? `${formatDate(customDateRange.start)} - ${formatDate(
                    customDateRange.end
                  )}`
                : filter.label}
            </span>
          </button>
        ))}
      </div>

      {/* Indicador do filtro ativo */}
      <div className="flex items-center space-x-sm mb-base">
        <span className="text-sm text-gray-500">Filtro ativo:</span>
        <span className="text-sm font-medium text-primary">
          {getFilterText()}
        </span>
        {dateFilter !== "todos" && (
          <button
            onClick={() => {
              handleDateFilterChange("todos");
            }}
            className="text-sm text-gray-500 hover:text-red-600 underline"
          >
            Limpar filtro
          </button>
        )}
      </div>

      {/* Botão de refresh */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-text">Lista de Recibos</h3>
        <button
          onClick={fetchReceipts}
          disabled={loadingReceipts}
          className="bg-primary-gradient text-white px-base py-sm rounded-base hover:opacity-90 transition-opacity flex items-center space-x-sm disabled:opacity-50"
        >
          <Receipt size={18} />
          <span>{loadingReceipts ? "Carregando..." : "Atualizar"}</span>
        </button>
      </div>

      {/* Lista de recibos */}
      <ReceiptsList
        receipts={filteredReceipts}
        loading={loadingReceipts}
        error={receiptsError}
        onRetry={fetchReceipts}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onAddReceipt={() => setActiveMenuItem("dashboard")}
      />

      {/* Seletor de Data Personalizada */}
      {showDateSelector && (
        <DateSelector
          selectedDate={customDateRange}
          onDateChange={setCustomDateRange}
          onClose={() => setShowDateSelector(false)}
        />
      )}
    </div>
  );

  return (
    <div className="bg-background min-h-screen font-sans text-text">
      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white h-screen p-xl flex-col shadow-md hidden lg:flex">
          <h1 className="text-2xl font-bold text-primary mb-xxl">
            Finance Labs
          </h1>

          {/* Dropdown de Clientes - Só aparece para gestores */}
          <ClientDropdown isManager={isManager} />

          <ul className="space-y-sm">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveMenuItem(item.id)}
                  className={`w-full flex items-center space-x-md p-md rounded-base text-left transition-all duration-200 ${
                    activeMenuItem === item.id
                      ? "bg-primary-gradient text-white shadow-md"
                      : "text-gray-500 hover:bg-gray-100 hover:text-text"
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-auto">
            <button
              onClick={handleViewProfile}
              className={`w-full flex items-center space-x-md p-md rounded-base text-left transition-all duration-200 text-gray-500 hover:bg-gray-100 hover:text-text mb-md`}
            >
              <User size={20} />
              <span className="font-medium">Ver Perfil</span>
            </button>
            <button
              className={`w-full flex items-center space-x-md p-md rounded-base text-left transition-all duration-200 text-gray-500 hover:bg-gray-100 hover:text-text`}
            >
              <Settings size={20} />
              <span className="font-medium">Configurações</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-xl bg-gray-50 overflow-y-auto h-screen">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
