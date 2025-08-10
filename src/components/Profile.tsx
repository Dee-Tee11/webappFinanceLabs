import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import {
  Edit3,
  Save,
  X,
  Key,
  Mail,
  User,
  CreditCard,
  Shield,
  LogOut,
} from "lucide-react";

type ProfileProps = {
  onClose: () => void;
};

const Profile = ({ onClose }: ProfileProps) => {
  const router = useRouter();
  const supabase = createClient();
  const [profileData, setProfileData] = useState({
    name: "Pedro",
    email: "pedronevespnf@gmail.com",
    nif: "123456789",
    role: "Gestor",
    memberSince: "Janeiro 2024",
    profileImage: null,
  });
  const [editData, setEditData] = useState({ ...profileData });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    setProfileData({ ...editData });
    setIsEditing(false);
    setIsLoading(false);
  };

  const handleCancel = () => {
    setEditData({ ...profileData });
    setIsEditing(false);
  };

  const handleResetPassword = () => {
    alert("Foi enviado um email para redefinir a sua senha.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-xl p-10">
        {/* Botão X no canto superior direito */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={22} />
        </button>

        {/* Foto e header */}
        <div className="flex items-center gap-6 mb-10">
          <div className="relative w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow">
            {editData.profileImage ? (
              <Image
                src={editData.profileImage}
                alt="Profile"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <User size={40} className="text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {profileData.name}
            </h1>
            <p className="text-sm text-gray-500">{profileData.email}</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-3 mb-10">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-full hover:bg-gray-50"
              >
                <Edit3 size={16} />
                Editar Perfil
              </button>
              <button
                onClick={handleResetPassword}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90"
              >
                <Key size={16} />
                Alterar Senha
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-full hover:bg-red-50"
              >
                <LogOut size={16} />
                Terminar Sessão
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-full hover:bg-gray-50"
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90 disabled:opacity-50"
              >
                <Save size={16} />
                {isLoading ? "Salvando..." : "Salvar"}
              </button>
            </>
          )}
        </div>

        {/* Formulário */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute top-3.5 left-3 text-gray-400"
              />
              <input
                type="text"
                value={isEditing ? editData.name : profileData.name}
                onChange={(e) =>
                  setEditData({ ...editData, name: e.target.value })
                }
                disabled={!isEditing}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 text-gray-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute top-3.5 left-3 text-gray-400"
              />
              <input
                type="email"
                value={profileData.email}
                disabled
                className="w-full pl-10 pr-4 py-3 bg-gray-100 text-gray-500 rounded-xl border-none"
              />
            </div>
          </div>

          {/* NIF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NIF
            </label>
            <div className="relative">
              <CreditCard
                size={16}
                className="absolute top-3.5 left-3 text-gray-400"
              />
              <input
                type="text"
                value={isEditing ? editData.nif : profileData.nif}
                onChange={(e) =>
                  setEditData({ ...editData, nif: e.target.value })
                }
                disabled={!isEditing}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 text-gray-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Membro desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Membro desde
            </label>
            <input
              type="text"
              value={profileData.memberSince}
              disabled
              className="w-full px-4 py-3 bg-gray-100 text-gray-500 rounded-xl border-none"
            />
          </div>

          {/* Role */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Função
            </label>
            <div className="relative">
              <Shield
                size={16}
                className="absolute top-3.5 left-3 text-gray-400"
              />
              <input
                type="text"
                value={profileData.role}
                disabled
                className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold rounded-xl border-none"
              />
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-xs text-gray-400 mt-10">
          Em breve poderás configurar preferências adicionais da tua conta.
        </p>
      </div>
    </div>
  );
};

export default Profile;
