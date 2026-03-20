'use client';

import React, { useState } from 'react';

interface PaymentMethod {
  id: string;
  type: 'card';
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

const BRAND_COLORS: Record<string, string> = {
  Visa: 'from-blue-600 to-blue-800',
  Mastercard: 'from-red-600 to-orange-600',
  'American Express': 'from-green-600 to-teal-700',
  Discover: 'from-orange-500 to-yellow-600',
};

export default function PaymentsTab() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', type: 'card', last4: '4242', brand: 'Visa', expiryMonth: 12, expiryYear: 2026, isDefault: true },
    { id: '2', type: 'card', last4: '5555', brand: 'Mastercard', expiryMonth: 6, expiryYear: 2025, isDefault: false },
  ]);
  const [showAddCard, setShowAddCard] = useState(false);

  const handleSetDefault = (id: string) => {
    setPaymentMethods((methods) => methods.map((m) => ({ ...m, isDefault: m.id === id })));
  };

  const handleRemoveCard = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este método de pago?')) {
      setPaymentMethods((methods) => methods.filter((m) => m.id !== id));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Métodos de Pago</h2>
          <p className="text-sm text-gray-600 mt-1">Administra tus tarjetas y métodos de pago</p>
        </div>
        <button
          onClick={() => setShowAddCard(true)}
          className="px-4 py-2 bg-[#FF6A00] text-white text-sm font-semibold rounded-lg hover:bg-[#e55f00] transition-colors"
        >
          + Agregar Tarjeta
        </button>
      </div>

      {/* Payment Methods */}
      {paymentMethods.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="w-14 h-14 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No hay métodos de pago</h3>
          <p className="text-sm text-gray-500 mb-4">Agrega una tarjeta para realizar pagos más rápido</p>
          <button
            onClick={() => setShowAddCard(true)}
            className="px-5 py-2 bg-[#FF6A00] text-white text-sm font-semibold rounded-lg hover:bg-[#e55f00] transition-colors"
          >
            Agregar Primera Tarjeta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-white hover:border-[#FF6A00]/30 transition-colors">
              {/* Card mini visual */}
              <div className={`w-14 h-9 rounded-lg bg-gradient-to-br ${BRAND_COLORS[method.brand] ?? 'from-gray-500 to-gray-700'} flex items-end p-1.5 shrink-0`}>
                <span className="text-white text-[9px] font-bold tracking-wider">••••{method.last4}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{method.brand} •••• {method.last4}</p>
                  {method.isDefault && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#FF6A00]/10 text-[#FF6A00]">
                      Predeterminada
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Vence {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="text-xs font-medium text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:border-[#FF6A00] hover:text-[#FF6A00] transition-colors"
                  >
                    Predeterminar
                  </button>
                )}
                <button
                  onClick={() => handleRemoveCard(method.id)}
                  className="text-xs font-medium text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Info */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Seguridad de tus pagos</h3>
        <ul className="space-y-2">
          {[
            'Tus datos de pago están encriptados y seguros con Stripe',
            'Nunca almacenamos tu número de tarjeta completo',
            'Todas las transacciones están protegidas por SSL',
          ].map((text) => (
            <li key={text} className="flex items-start gap-2 text-sm text-gray-600">
              <svg className="h-4 w-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Agregar Tarjeta</h3>
            <div className="bg-orange-50 border-l-4 border-[#FF6A00] p-4 rounded-r-lg mb-4">
              <div className="flex gap-3">
                <svg className="h-5 w-5 text-[#FF6A00] shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-orange-800">
                  La integración con Stripe se implementará próximamente. Esta función está en desarrollo.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Podrás agregar y administrar tus métodos de pago de forma segura con Stripe.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddCard(false)}
                className="px-5 py-2.5 bg-[#FF6A00] text-white text-sm font-semibold rounded-lg hover:bg-[#e55f00] transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
