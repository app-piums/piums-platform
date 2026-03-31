"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/artist/DashboardSidebar";

const MOCK_TRANSACTIONS = [
  { id: "t1", type: "credit", description: "Pago reserva — Bodas García", amount: 2500, date: "2024-05-10", status: "completado" },
  { id: "t2", type: "credit", description: "Pago reserva — Quinceañera López", amount: 1800, date: "2024-05-07", status: "completado" },
  { id: "t3", type: "debit", description: "Retiro a cuenta bancaria", amount: 3000, date: "2024-05-06", status: "completado" },
  { id: "t4", type: "credit", description: "Pago reserva — Graduación UAG", amount: 2200, date: "2024-04-28", status: "completado" },
  { id: "t5", type: "credit", description: "Pago reserva — Corporativo AGRO", amount: 3500, date: "2024-04-20", status: "pendiente" },
  { id: "t6", type: "debit", description: "Comisión plataforma", amount: 175, date: "2024-04-20", status: "completado" },
];

export default function WalletPage() {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState("");

  const balance = MOCK_TRANSACTIONS.reduce((acc, t) => {
    if (t.status !== "pendiente") {
      return t.type === "credit" ? acc + t.amount : acc - t.amount;
    }
    return acc;
  }, 0);

  const pendiente = MOCK_TRANSACTIONS.filter(
    (t) => t.type === "credit" && t.status === "pendiente"
  ).reduce((acc, t) => acc + t.amount, 0);

  const retirado = MOCK_TRANSACTIONS.filter(
    (t) => t.type === "debit" && t.status === "completado"
  ).reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pt-20 sm:p-6 lg:p-8 lg:pt-8 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Billetera</h1>
            <p className="text-sm text-gray-500 mt-1">Gestiona tus ingresos y retiros</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow">
              <p className="text-sm font-medium text-orange-100">Balance disponible</p>
              <p className="text-3xl font-bold mt-1">
                ${balance.toLocaleString("en-US")}
              </p>
              <p className="text-xs text-orange-200 mt-1">Listo para retirar</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500">Por cobrar</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                ${pendiente.toLocaleString("en-US")}
              </p>
              <p className="text-xs text-gray-400 mt-1">Pagos pendientes</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500">Total retirado</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                ${retirado.toLocaleString("en-US")}
              </p>
              <p className="text-xs text-gray-400 mt-1">Histórico</p>
            </div>
          </div>

          {/* Withdraw Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowWithdraw(!showWithdraw)}
              className="w-full sm:w-auto px-6 py-3 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors"
            >
              Solicitar retiro
            </button>
          </div>

          {/* Withdraw form */}
          {showWithdraw && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Solicitar retiro</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Monto (Q)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    max={balance}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => { setShowWithdraw(false); setAmount(""); }}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700">
                    Confirmar
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">El retiro se procesa en 1-3 días hábiles.</p>
            </div>
          )}

          {/* Transactions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Movimientos recientes</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {MOCK_TRANSACTIONS.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${
                        tx.type === "credit"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-500"
                      }`}
                    >
                      {tx.type === "credit" ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                      <p className="text-xs text-gray-400">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p
                      className={`text-sm font-semibold ${
                        tx.type === "credit" ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {tx.type === "credit" ? "+" : "-"}${tx.amount.toLocaleString("en-US")}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        tx.status === "completado"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
