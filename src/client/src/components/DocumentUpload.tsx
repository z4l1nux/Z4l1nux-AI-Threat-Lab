import React, { useState, useRef } from 'react';

interface DocumentUploadProps {
  onDocumentsUploaded: (uploadedFiles: File[]) => void;
  isLoading?: boolean;
}

interface UploadResult {
  success: boolean;
  message?: string;
  logs?: string[];
  summary?: {
    filesUploaded: number;
    filesProcessed: number;
    filesRejected: number;
  };
  error?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onDocumentsUploaded, 
  isLoading = false 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Por favor, selecione pelo menos um arquivo.');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('documents', file);
      });

      const response = await fetch('/api/upload-documents', {
        method: 'POST',
        body: formData,
      });

      const result: UploadResult = await response.json();
      setUploadResult(result);

      if (result.success) {
        onDocumentsUploaded(selectedFiles);
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadResult({
        success: false,
        error: 'Erro ao fazer upload dos documentos'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="document-upload-section">
      <h3>📄 Upload de Documentos para Contexto</h3>
      <p>Faça upload de documentos (PDF, TXT, MD, DOCX) para enriquecer o contexto da análise de ameaças.</p>
      
      <div className="upload-area">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.docx,.doc"
          onChange={handleFileSelect}
          disabled={isUploading || isLoading}
          className="file-input"
        />
        
        {selectedFiles.length > 0 && (
          <div className="selected-files">
            <h4>Arquivos Selecionados ({selectedFiles.length}):</h4>
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={index} className="file-item">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button 
                    type="button" 
                    onClick={() => removeFile(index)}
                    className="remove-file-btn"
                    disabled={isUploading || isLoading}
                  >
                    ❌
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="upload-actions">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || isLoading}
              className="upload-btn"
            >
              {isUploading ? '📤 Enviando...' : '📤 Enviar Documentos'}
            </button>
            <button
              type="button"
              onClick={clearFiles}
              disabled={isUploading || isLoading}
              className="clear-btn"
            >
              🗑️ Limpar
            </button>
          </div>
        )}
      </div>

      {uploadResult && (
        <div className={`upload-result ${uploadResult.success ? 'success' : 'error'}`}>
          <h4>{uploadResult.success ? '✅ Upload Concluído' : '❌ Erro no Upload'}</h4>
          <p>{uploadResult.message || uploadResult.error}</p>
          
          {uploadResult.summary && (
            <div className="upload-summary">
              <p><strong>Resumo:</strong></p>
              <ul>
                <li>Arquivos enviados: {uploadResult.summary.filesUploaded}</li>
                <li>Arquivos processados: {uploadResult.summary.filesProcessed}</li>
                <li>Arquivos rejeitados: {uploadResult.summary.filesRejected}</li>
              </ul>
            </div>
          )}

          {uploadResult.logs && uploadResult.logs.length > 0 && (
            <div className="upload-logs">
              <h5>Logs do Processamento:</h5>
              <ul>
                {uploadResult.logs.map((log, index) => (
                  <li key={index} className="log-item">{log}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
