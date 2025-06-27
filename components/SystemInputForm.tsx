import React, { useState } from 'react';
import { SystemInfo } from '../types';

interface SystemInputFormProps {
  initialInfo?: { fullDescription?: string, systemVersion?: string };
  onSubmit: (data: { fullDescription: string, systemVersion?: string }) => void;
  isLoading: boolean;
}

const SystemInputForm: React.FC<SystemInputFormProps> = ({ initialInfo, onSubmit, isLoading }) => {
  const [fullDescription, setFullDescription] = useState(initialInfo?.fullDescription || "");
  const [systemVersion, setSystemVersion] = useState(initialInfo?.systemVersion || "");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFullDescription(e.target.value);
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemVersion(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ fullDescription, systemVersion });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-gray-800 shadow-xl rounded-lg">
      <h2 className="text-xl font-semibold text-yellow-400 border-b border-yellow-400 pb-1">Informações do Sistema</h2>
      <div>
        <label htmlFor="systemVersion" className="block text-sm font-medium text-gray-300 mb-1">
          Versão do Sistema
        </label>
        <input
          id="systemVersion"
          name="systemVersion"
          type="text"
          value={systemVersion}
          onChange={handleVersionChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 placeholder-gray-400 mb-2"
          placeholder="Ex: 1.0.0"
          disabled={isLoading}
          aria-label="Versão do Sistema"
        />
      </div>
      <div>
        <label htmlFor="fullDescription" className="block text-sm font-medium text-gray-300 mb-1">
          Descrição Completa do Sistema
        </label>
        <textarea
          id="fullDescription"
          name="fullDescription"
          value={fullDescription}
          onChange={handleChange}
          rows={12}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-100 placeholder-gray-400"
          placeholder="Descreva aqui todos os detalhes do sistema, componentes, tecnologias, dados sensíveis, integrações, etc."
          disabled={isLoading}
          aria-label="Descrição Completa do Sistema"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 focus:ring-offset-black disabled:bg-yellow-200 disabled:cursor-not-allowed transition duration-150 ease-in-out"
      >
        {isLoading ? 'Analisando Sistema...' : 'Gerar Modelo de Ameaças'}
      </button>
    </form>
  );
};

export default SystemInputForm;
