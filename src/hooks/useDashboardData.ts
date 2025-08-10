import { useState, useMemo } from "react";

interface CardData {
  id: number;
  title: string;
  type: "receita" | "despesa" | "investimento";
  value: number;
  description: string;
}

export const useDashboardData = () => {
  const [cards, setCards] = useState<CardData[]>([
    {
      id: 1,
      title: "Vendas de Software",
      type: "receita",
      value: 12345,
      description: "Receita do produto principal.",
    },
    {
      id: 2,
      title: "Despesas de Marketing",
      type: "despesa",
      value: 4100,
      description: "Campanha de anúncios online.",
    },
    {
      id: 3,
      title: "Salários",
      type: "despesa",
      value: 4134,
      description: "Pagamento da equipa.",
    },
    {
      id: 4,
      title: "Investimento em Ações",
      type: "investimento",
      value: 25000,
      description: "Aplicação em fundos de tecnologia.",
    },
  ]);

  const totals = useMemo(() => {
    const receita = cards
      .filter((card) => card.type === "receita")
      .reduce((sum, card) => sum + card.value, 0);

    const despesas = cards
      .filter((card) => card.type === "despesa")
      .reduce((sum, card) => sum + card.value, 0);

    const investimentos = cards
      .filter((card) => card.type === "investimento")
      .reduce((sum, card) => sum + card.value, 0);

    const transacoes = cards.filter(
      (c) => c.type === "receita" || c.type === "despesa"
    ).length;

    const lucroLiquido = receita - despesas;

    return { receita, despesas, investimentos, transacoes, lucroLiquido };
  }, [cards]);

  const handleAddCard = (newCard: CardData) => {
    setCards((prevCards) => [...prevCards, newCard]);
  };

  return { cards, totals, handleAddCard };
};
