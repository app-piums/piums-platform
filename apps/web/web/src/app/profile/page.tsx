'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Loading } from '@/components/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardTitle, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        email: user.email || '',
        telefono: '',
        direccion: '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // TODO: Call API to update profile
      // await sdk.updateProfile(formData);
      
      setTimeout(() => {
        setLoading(false);
        setEditing(false);
        alert('Perfil actualizado correctamente');
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setLoading(false);
      alert('Error al actualizar el perfil');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setLoading(true);
      
      // TODO: Call API to change password
      // await sdk.changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      setTimeout(() => {
        setLoading(false);
        setShowPasswordSection(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        alert('Contraseña actualizada correctamente');
      }, 1000);
    } catch (error) {
      console.error('Error changing password:', error);
      setLoading(false);
      alert('Error al cambiar la contraseña');
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      // TODO: Implement account deletion
      alert('Funcionalidad de eliminación de cuenta en desarrollo');
    }
  };

  if (authLoading || !user) {
    return (
      <div>
        <Navbar />
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Perfil</h1>

        {/* Avatar Section */}
        <Card className="mb-6">
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Avatar
                src={user.avatar}
                fallback={user.nombre}
                className="h-24 w-24"
              />
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-semibold text-gray-900">{user.nombre}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <Button variant="outline" size="sm">
                Cambiar Foto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardTitle>Información Personal</CardTitle>
          <CardContent>
            <form onSubmit={handleSaveProfile}>
              <div className="space-y-4">
                <Input
                  label="Nombre Completo"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
                
                <Input
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
                
                <Input
                  label="Teléfono"
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  disabled={!editing}
                  placeholder="(opcional)"
                />
                
                <Input
                  label="Dirección"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  disabled={!editing}
                  placeholder="(opcional)"
                />
              </div>

              <div className="flex gap-3 mt-6">
                {editing ? (
                  <>
                    <Button
                      type="submit"
                      loading={loading}
                      disabled={loading}
                      fullWidth
                    >
                      Guardar Cambios
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditing(false)}
                      fullWidth
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setEditing(true)}
                    fullWidth
                  >
                    Editar Información
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card className="mb-6">
          <CardTitle>Seguridad</CardTitle>
          <CardContent>
            {!showPasswordSection ? (
              <Button
                variant="outline"
                onClick={() => setShowPasswordSection(true)}
                fullWidth
              >
                Cambiar Contraseña
              </Button>
            ) : (
              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  <Input
                    label="Contraseña Actual"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                  />
                  
                  <Input
                    label="Nueva Contraseña"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    helperText="Mínimo 8 caracteres"
                  />
                  
                  <Input
                    label="Confirmar Nueva Contraseña"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                    fullWidth
                  >
                    Actualizar Contraseña
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    fullWidth
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="mb-6">
          <CardTitle>Preferencias</CardTitle>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Notificaciones por Email</p>
                  <p className="text-sm text-gray-600">Recibir actualizaciones sobre reservas</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Notificaciones Push</p>
                  <p className="text-sm text-gray-600">Recibir notificaciones en el navegador</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card>
          <CardTitle className="text-red-600">Zona de Peligro</CardTitle>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, ten certeza.
            </p>
            <Button variant="danger" onClick={handleDeleteAccount}>
              Eliminar Cuenta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
