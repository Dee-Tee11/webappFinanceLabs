"use client";
import React, { useState, useEffect } from "react";
import { X, Save, Upload, FileText } from "lucide-react";
import { extractReceiptData, saveReceipt } from "@/services/receiptService";
import { TablesInsert } from "@/utils/supabase/types";

interface ReceiptFormProps {
  onClose: () => void;
  onReceiptProcessed: (receipt: any) => void;
  activeMenuItem: string;
}

interface FormData {
  title: string;
  type: "fatura" | "despesa";
  value: string;
  description: string;
  valor_iva: string;
}

const ReceiptForm: React.FC<ReceiptFormProps> = ({
  onClose,
  onReceiptProcessed,
  activeMenuItem,
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    type: "despesa",
    value: "",
    description: "",
    valor_iva: "",
  });

  const resetFormState = () => {
    setUploadedFile(null);
    setIsProcessing(false);
    setFormData({
      title: "",
      type: "fatura",
      value: "",
      description: "",
      valor_iva: "",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (
      file &&
      (file.type === "application/pdf" || file.type.startsWith("image/"))
    ) {
      setUploadedFile(file);
      setIsProcessing(true);
      try {
        const extractedData = await extractReceiptData(file);

        const ivaValue = extractedData.valor_iva
          ? String(extractedData.valor_iva)
          : "";
        const isFatura = ivaValue > "0" || extractedData.categoria === "fatura";

        setFormData({
          title: extractedData.merchant_name || "",
          type: isFatura ? "fatura" : "despesa",
          value: extractedData.total_amount
            ? extractedData.total_amount.toString()
            : "",
          description: extractedData.extracted_text || "",
          valor_iva: ivaValue,
        });
      } catch (error) {
        console.error("Erro ao extrair dados do ficheiro:", error);
        alert(
          `Erro ao extrair dados do ficheiro: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`
        );
        resetFormState();
      } finally {
        setIsProcessing(false);
      }
    } else {
      alert("Por favor, selecione um arquivo PDF ou uma imagem (JPG, PNG).");
    }
  };

  const handleSaveCard = async () => {
    setIsProcessing(true);
    try {
      const receiptToSave: Partial<TablesInsert<"receipts">> = {
        merchant_name: formData.title,
        total_amount: parseFloat(formData.value.replace(",", ".")) || 0,
        categoria: formData.type,
        extracted_text: formData.description,
      };

      if (formData.type === "fatura") {
        receiptToSave.valor_iva =
          parseFloat(formData.valor_iva.replace(",", ".")) || 0;
      }

      const savedReceipt = await saveReceipt(receiptToSave);
      onReceiptProcessed(savedReceipt);
      alert("Recibo salvo com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao salvar o recibo:", error);
      alert(
        `Erro ao salvar o recibo: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClose = () => {
    resetFormState();
    onClose();
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-xl">
        <h3 className="text-3xl font-bold text-text">Criar Novo Card</h3>
        <button
          onClick={handleClose}
          className="p-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mt-xl flex flex-col lg:flex-row gap-xxl">
        {/* Coluna da Esquerda: Upload de PDF */}
        <div className="w-full lg:w-1/2">
          <p className="text-base font-medium text-gray-700 mb-sm">
            Importar Automaticamente
          </p>
          <div className="h-full p-base bg-gray-50 rounded-base border-2 border-dashed border-gray-300 flex flex-col justify-center text-center">
            <div className="w-12 h-12 bg-primary-gradient rounded-base flex items-center justify-center text-white mx-auto mb-md">
              <Upload size={20} />
            </div>
            <div className="mb-base">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="inline-block bg-primary-gradient text-white px-base py-sm rounded-base hover:opacity-90 transition-opacity">
                  <span>Importar PDF/Imagem</span>
                </div>
              </label>
            </div>
            <p className="text-sm text-gray-500">
              Os dados serão preenchidos automaticamente
            </p>

            {uploadedFile && (
              <div className="mt-base p-md bg-white rounded-base border text-left">
                <div className="flex items-center space-x-sm">
                  <FileText size={16} className="text-red-600" />
                  <span className="text-sm font-medium text-text truncate">
                    {uploadedFile.name}
                  </span>
                  {isProcessing && (
                    <div className="ml-auto">
                      <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {isProcessing && (
                  <p className="text-xs text-gray-500 mt-xs">
                    A processar e extrair informações...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Coluna da Direita: Campos Manuais */}
        <div className="w-full lg:w-1/2 flex flex-col space-y-base">
          <p className="text-base font-medium text-gray-700 mb-0 -mt-base">
            Ou Preencher Manualmente
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-sm">
              Título do Card
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-md py-sm border border-gray-300 rounded-base focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ex: Vendas do Mês"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-sm">
              Tipo
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-md py-sm border border-gray-300 rounded-base focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="fatura">Fatura</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-sm">
              Valor
            </label>
            <input
              type="text"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              className="w-full px-md py-sm border border-gray-300 rounded-base focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="€0,00"
            />
          </div>

          {formData.type === "fatura" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-sm">
                Valor IVA
              </label>
              <input
                type="text"
                name="valor_iva"
                value={formData.valor_iva}
                onChange={handleInputChange}
                className="w-full px-md py-sm border border-gray-300 rounded-base focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="€0,00"
              />
            </div>
          )}

          <div className="flex-grow flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-sm">
              Descrição
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full flex-grow px-md py-sm border border-gray-300 rounded-base focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Adicione detalhes sobre a transação..."
            />
          </div>

          <div className="flex space-x-md pt-sm">
            <button
              onClick={handleSaveCard}
              disabled={isProcessing}
              className="flex-1 bg-primary-gradient text-white py-sm px-base rounded-base hover:opacity-90 transition-opacity flex items-center justify-center space-x-sm disabled:opacity-50"
            >
              <Save size={18} />
              <span>Salvar Card</span>
            </button>
            <button
              onClick={handleClose}
              className="px-base py-sm border border-gray-300 text-gray-700 rounded-base hover:bg-gray-100 transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptForm;
