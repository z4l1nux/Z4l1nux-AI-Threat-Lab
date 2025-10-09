import React, { useRef, useState, useCallback } from 'react';

interface DocumentUploadProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onFileUpload, isLoading = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="bg-custom-blue rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
        <span className="text-z4l1nux-primary mr-2">📁</span>
        Documentos de Contexto
      </h3>
      
      <p className="text-gray-300 text-sm mb-4">
        Envie documentos sobre o sistema para enriquecer a análise de ameaças. A IA utilizará essas informações para gerar um relatório mais preciso e contextualizado.
      </p>

      {/* Referências */}
      <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
        <h4 className="text-white font-medium mb-2 flex items-center">
          <span className="text-z4l1nux-primary mr-2">📚</span>
          Referência CAPEC-STRIDE
        </h4>
        <div className="text-sm text-gray-300">
          <p className="mb-2">Para análise de ameaças mais precisa, consulte:</p>
          <a 
            href="https://www.ostering.com/media/files/docs/capec-stride-mapping.md" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-z4l1nux-primary hover:text-orange-400 underline"
          >
            Mapeamento CAPEC-STRIDE (Ostring)
          </a>
          <span className="text-gray-500 ml-2">- Mapeamento entre categorias STRIDE e padrões de ataque CAPEC</span>
        </div>
      </div>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-z4l1nux-primary bg-z4l1nux-primary/20' 
            : 'border-gray-600 hover:border-z4l1nux-primary hover:bg-gray-700/30'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center">
          <div className="text-6xl text-gray-300 mb-4">
            📄
          </div>
          
          <p className="text-white text-lg mb-2">
            Arraste arquivos aqui ou clique para selecionar
          </p>
          
          <p className="text-gray-400 text-sm mb-4">
            Suporte: PDF, TXT, MD, DOCX (até 50MB por arquivo)
          </p>
          
          <button
            type="button"
            disabled={isLoading}
            className="bg-z4l1nux-primary hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processando...' : 'Selecionar Arquivo'}
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".pdf,.docx,.doc,.txt,.md,.xml,.json,.csv"
          className="hidden"
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default DocumentUpload;
