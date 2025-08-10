"use client";

import React, { useState } from "react";
import {
  Building2,
  User,
  ChevronDown,
  Plus,
  X,
} from "lucide-react";

// Componente do Dropdown de Clientes (Subcontas)
const ClientDropdown = ({ isManager = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState("Selecionar Cliente");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    type: "particular",
    nif: "",
  });

  // Simulação de clientes disponíveis
  const [clients, setClients] = useState([
    { id: 1, name: "João Silva Lda", type: "empresa", nif: "123456789" },
    { id: 2, name: "Maria Santos", type: "particular", nif: "987654321" },
    { id: 3, name: "Tech Solutions SA", type: "empresa", nif: "555666777" },
    { id: 4, name: "Ana Costa", type: "particular", nif: "111222333" },
  ]);

  const handleClientSelect = (clientName: string) => {
    setSelectedClient(clientName);
    setIsOpen(false);
  };

  const handleAddClient = () => {
    setShowAddForm(true);
    setIsOpen(false);
  };

  const handleSaveClient = () => {
    if (newClient.name && newClient.nif) {
      const newClientData = {
        id: clients.length + 1,
        name: newClient.name,
        type: newClient.type,
        nif: newClient.nif,
      };
      setClients([...clients, newClientData]);
      setSelectedClient(newClient.name);
      setNewClient({ name: "", type: "particular", nif: "" });
      setShowAddForm(false);
    }
  };

  const handleCancelAdd = () => {
    setNewClient({ name: "", type: "particular", nif: "" });
    setShowAddForm(false);
  };

  // Se não for gestor, não mostra o dropdown
  if (!isManager) {
    return null;
  }

  return (
    <div className="relative mb-xxl">
      {/* Formulário para adicionar novo cliente */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-xl w-96 max-w-md">
            <h3 className="text-xl font-bold text-text mb-base">
              Adicionar Nova Subconta
            </h3>

            <div className="space-y-base">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-sm">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                  className="w-full px-md py-sm border border-gray-300 rounded-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ex: João Silva Lda"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-sm">
                  Tipo
                </label>
                <select
                  value={newClient.type}
                  onChange={(e) =>
                    setNewClient({ ...newClient, type: e.target.value })
                  }
                  className="w-full px-md py-sm border border-gray-300 rounded-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="particular">Particular</option>
                  <option value="empresa">Empresa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-sm">
                  NIF
                </label>
                <input
                  type="text"
                  value={newClient.nif}
                  onChange={(e) =>
                    setNewClient({ ...newClient, nif: e.target.value })
                  }
                  className="w-full px-md py-sm border border-gray-300 rounded-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="123456789"
                />
              </div>
            </div>

            <div className="flex space-x-sm mt-xl">
              <button
                onClick={handleCancelAdd}
                className="flex-1 px-base py-sm border border-gray-300 text-gray-700 rounded-base hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveClient}
                className="flex-1 px-base py-sm bg-primary-gradient text-white rounded-base hover:opacity-90 transition-opacity"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-200 rounded-xl px-base py-md flex items-center justify-between hover:bg-gray-50 transition-colors shadow-sm"
      >
        <span className="text-gray-500 font-medium">{selectedClient}</span>
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => handleClientSelect(client.name)}
              className={`w-full px-base py-md text-left hover:bg-gray-50 transition-colors flex items-center space-x-sm ${
                selectedClient === client.name
                  ? "bg-blue-light border-r-4 border-primary"
                  : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-base flex items-center justify-center ${
                  selectedClient === client.name
                    ? "bg-blue-light"
                    : "bg-gray-100"
                }`}
              >
                {client.type === "empresa" ? (
                  <Building2
                    size={18}
                    className={
                      selectedClient === client.name
                        ? "text-primary"
                        : "text-gray-500"
                    }
                  />
                ) : (
                  <User
                    size={18}
                    className={
                      selectedClient === client.name
                        ? "text-primary"
                        : "text-gray-500"
                    }
                  />
                )}
              </div>
              <div className="flex-1">
                <span
                  className={`font-medium block ${
                    selectedClient === client.name
                      ? "text-primary"
                      : "text-gray-700"
                  }`}
                >
                  {client.name}
                </span>
                <span className="text-xs text-gray-500">NIF: {client.nif}</span>
              </div>
            </button>
          ))}

          {/* Botão para adicionar novo cliente */}
          <div className="border-t border-gray-200 p-2">
            <button
              onClick={handleAddClient}
              className="w-full px-base py-sm text-left hover:bg-gray-50 transition-colors flex items-center space-x-sm text-primary"
            >
              <div className="w-8 h-8 rounded-base flex items-center justify-center bg-blue-light">
                <Plus size={18} className="text-primary" />
              </div>
              <span className="font-medium">Adicionar Nova Subconta</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDropdown;
