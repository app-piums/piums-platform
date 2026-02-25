'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface PaymentMethod {
  id: string;
  type: 'card';
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export default function PaymentsTab() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2026,
      isDefault: true,
    },
    {
      id: '2',
      type: 'card',
      last4: '5555',
      brand: 'Mastercard',
      expiryMonth: 6,
      expiryYear: 2025,
      isDefault: false,
    },
  ]);

  const [showAddCard, setShowAddCard] = useState(false);

  const handleSetDefault = (id: string) => {
    setPaymentMethods((methods) =>
      methods.map((method) => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
    alert('Método de pago predeterminado actualizado');
  };

  const handleRemoveCard = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este método de pago?')) {
      setPaymentMethods((methods) => methods.filter((method) => method.id !== id));
      alert('Método de pago eliminado');
    }
  };

  const getCardIcon = (brand: string) => {
    const icons: Record<string, string> = {
      Visa: '💳',
      Mastercard: '💳',
      'American Express': '💳',
      Discover: '💳',
    };
    return icons[brand] || '💳';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Métodos de Pago</h2>
          <p className="text-sm text-gray-600 mt-1">
            Administra tus tarjetas y métodos de pago
          </p>
        </div>
        <Button onClick={() => setShowAddCard(true)}>
          Agregar Tarjeta
        </Button>
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No hay métodos de pago</h3>
          <p className="mt-1 text-gray-500">Agrega una tarjeta para realizar pagos más rápido.</p>
          <Button onClick={() => setShowAddCard(true)} className="mt-4">
            Agregar Primera Tarjeta
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <Card key={method.id} hover>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{getCardIcon(method.brand)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {method.brand} •••• {method.last4}
                        </p>
                        {method.isDefault && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Predeterminada
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Vence {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!method.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        Hacer predeterminada
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveCard(method.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Card Modal (Simplified) */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowAddCard(false)}
            />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Agregar Tarjeta
                </h3>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        La integración con Stripe se implementará próximamente. Por ahora, esta función está en desarrollo.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">
                  Podrás agregar y administrar tus métodos de pago de forma segura con Stripe.
                </p>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button onClick={() => setShowAddCard(false)}>
                  Entendido
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Info */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Seguridad de tus pagos
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Tus datos de pago están encriptados y seguros con Stripe
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Nunca almacenamos tu número de tarjeta completo
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Todas las transacciones están protegidas por SSL
          </li>
        </ul>
      </div>
    </div>
  );
}
