import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import { resolveViewUrl, resolveDownloadUrl } from '@/react-app/lib/storage-url';

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: number;
    title: string;
    file_url?: string;
    status: string;
    created_at: string;
    version: number;
  } | null;
}

export default function DocumentPreview({ isOpen, onClose, document }: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen && document) {
      setLoading(true);
      setError(null);
      setZoom(100);
      setRotation(0);
    }
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const getFileType = (url?: string) => {
    if (!url) return 'unknown';
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'image';
      case 'txt':
      case 'md':
        return 'text';
      case 'doc':
      case 'docx':
        return 'word';
      case 'xls':
      case 'xlsx':
        return 'excel';
      case 'ppt':
      case 'pptx':
        return 'powerpoint';
      default:
        return 'unknown';
    }
  };

  const viewUrl = resolveViewUrl(document.file_url);
  const fileType = getFileType(viewUrl);

  const handleDownload = () => {
    if (viewUrl) {
      const dl = resolveDownloadUrl(document.file_url);
      window.open(dl || viewUrl, '_blank');
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const renderPreviewContent = () => {
    if (!viewUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium mb-2">No file available</p>
          <p className="text-sm text-center">This document doesn't have an associated file to preview.</p>
        </div>
      );
    }

    switch (fileType) {
      case 'pdf':
        // Use the file URL directly for PDF rendering
        const pdfUrl = viewUrl!;
        
        return (
          <div className="relative h-full bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setError('Failed to load PDF');
                setLoading(false);
              }}
              title={document.title}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={viewUrl}
              alt={document.title}
              className="max-w-full max-h-full object-contain"
              style={{ 
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setError('Failed to load image');
                setLoading(false);
              }}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="h-full bg-white rounded-lg border border-gray-200 overflow-auto">
            <iframe
               src={viewUrl}
              className="w-full h-full border-0 p-4"
              style={{ fontSize: `${zoom}%` }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setError('Failed to load text file');
                setLoading(false);
              }}
              title={document.title}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        );

      case 'word':
      case 'excel':
      case 'powerpoint':
        return (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <FileText className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium mb-2">Preview not available</p>
            <p className="text-sm text-center mb-4">
              Microsoft Office documents cannot be previewed directly. 
              <br />
              Please download the file to view it.
            </p>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Download File
            </button>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <FileText className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium mb-2">Preview not supported</p>
            <p className="text-sm text-center mb-4">
              This file type cannot be previewed. 
              <br />
              Please download the file to view it.
            </p>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Download File
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {document.title}
              </h2>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-gray-500">Version {document.version}</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  document.status === 'Final' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {document.status}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(document.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* Toolbar */}
            <div className="flex items-center space-x-2 ml-4">
              {(fileType === 'pdf' || fileType === 'image') && (
                <>
                  <button
                    onClick={handleZoomOut}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-500 px-2">{zoom}%</span>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleRotate}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Rotate"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300 mx-2" />
                </>
              )}
              
              <button
                onClick={handleDownload}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Download"
                disabled={!document.file_url}
              >
                <Download className="h-4 w-4" />
              </button>
              
              <button
                 onClick={() => viewUrl && window.open(viewUrl, '_blank')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Open in New Tab"
                disabled={!document.file_url}
              >
                <ExternalLink className="h-4 w-4" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4 overflow-hidden">
            {error ? (
              <div className="flex flex-col items-center justify-center h-96 text-red-500">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium mb-2">Error loading document</p>
                <p className="text-sm text-center">{error}</p>
                <button
                  onClick={handleDownload}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Try Download Instead
                </button>
              </div>
            ) : (
              <div className="h-full relative">
                {renderPreviewContent()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
