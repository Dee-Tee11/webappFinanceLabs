import React from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";

const SignUpConfirmationPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <MailCheck className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">
          Confirme o seu email
        </h2>
        <p className="mt-2 text-gray-600">
          Enviámos um link de confirmação para o seu endereço de email. Por
          favor, verifique a sua caixa de entrada (e a pasta de spam) para
          completar o seu registo.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Voltar à página inicial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpConfirmationPage;
