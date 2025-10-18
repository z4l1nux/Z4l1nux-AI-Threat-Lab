import React, { useState } from 'react';
import { SystemInfo } from '../types';

interface SystemInputFormProps {
  initialInfo?: { fullDescription?: string };
  onSubmit: (data: { fullDescription: string }) => void;
  isLoading: boolean;
}

const SystemInputForm: React.FC<SystemInputFormProps> = ({ initialInfo, onSubmit, isLoading }) => {
  const [fullDescription, setFullDescription] = useState(initialInfo?.fullDescription || "");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFullDescription(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ fullDescription });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-custom-blue shadow-xl rounded-lg">
      <h2 className="text-xl font-semibold text-z4l1nux-primary border-b border-z4l1nux-primary pb-1">Informações do Sistema</h2>
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
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-z4l1nux-primary focus:border-z4l1nux-primary text-gray-100 placeholder-gray-400"
          placeholder="Descreva aqui todos os detalhes do sistema, componentes, tecnologias, dados sensíveis, integrações, etc."
          disabled={isLoading}
          aria-label="Descrição Completa do Sistema"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-z4l1nux-primary hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-z4l1nux-primary focus:ring-offset-custom-black disabled:bg-orange-400 disabled:cursor-not-allowed transition duration-150 ease-in-out"
      >
        {isLoading ? 'Analisando Sistema...' : 'Gerar Modelo de Ameaças'}
      </button>
    </form>
  );
};

export default SystemInputForm;
