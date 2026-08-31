import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserStorage } from '../context/UserStorageContext';
import { UserFile } from '../types';
import {
  FolderLock,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Trash2,
  Download,
  Eye,
  Tag,
  Calendar,
  HardDrive,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  FileCode,
  ShieldCheck,
  Plus
} from 'lucide-react';

interface UserStorageViewProps {
  currentLang: string;
}

export const UserStorageView: React.FC<UserStorageViewProps> = ({ currentLang }) => {
  const { currentUser } = useAuth();
  const { files, uploadFile, deleteFile, storageStats, isLoading } = useUserStorage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadCategory, setUploadCategory] = useState<UserFile['category']>('document');
  const [uploadTagInput, setUploadTagInput] = useState('');
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];
    // File size check: limit to 10MB for client-side / Firestore safety
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds maximum limit of 10MB.');
      return;
    }

    setIsUploading(true);
    try {
      const tags = uploadTagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await uploadFile(file, uploadCategory, uploadNotes, tags);
      setUploadSuccess(true);
      setUploadNotes('');
      setUploadTagInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (file: UserFile) => {
    if (window.confirm(`Are you sure you want to delete "${file.fileName}"? This action cannot be undone.`)) {
      try {
        await deleteFile(file.id);
      } catch (err: any) {
        alert(err?.message || 'Failed to delete file.');
      }
    }
  };

  const handleDownload = (file: UserFile) => {
    const link = document.createElement('a');
    link.href = file.downloadUrl;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getFileIcon = (fileType: string, category: string) => {
    if (category === 'image' || fileType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-emerald-500" />;
    }
    if (category === 'invoice' || category === 'receipt') {
      return <FileSpreadsheet className="w-5 h-5 text-amber-500" />;
    }
    if (fileType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    return <FileCode className="w-5 h-5 text-blue-500" />;
  };

  // Filter files
  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.notes && f.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.tags && f.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner with Security Isolation Indicator */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl border border-blue-900/50 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> End-to-End User Isolated Cloud Storage
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <FolderLock className="w-6 h-6 text-blue-400" />
              My Cloud Files & Document Vault
            </h2>
            <p className="text-xs text-blue-200/80 max-w-2xl">
              Upload invoices, tax filings, legal agreements, receipts, and store media. Secured by Firestore & Firebase Auth rules (User ID: <span className="font-mono text-white font-bold">{currentUser?.id}</span>).
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur px-4 py-3 rounded-2xl border border-white/10 shrink-0">
            <HardDrive className="w-8 h-8 text-blue-300" />
            <div>
              <div className="text-xs font-bold text-slate-200">Vault Capacity Used</div>
              <div className="text-base font-black text-white">{storageStats.formattedSize} ({files.length} items)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-blue-600" /> Upload New File to Your Vault
          </h3>
          <span className="text-[11px] text-slate-400">Supported: PDF, PNG, JPG, WEBP, DOCX, CSV (Max 10MB)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              File Category
            </label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="document">📄 Business Document / Contract</option>
              <option value="invoice">🧾 Sales Invoice / Tax Receipt</option>
              <option value="image">🖼️ Product / Branding Image</option>
              <option value="receipt">💳 Purchase / Expense Receipt</option>
              <option value="backup">💾 Database Backup Archive</option>
              <option value="other">📦 Other Asset</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Notes / Description (Optional)
            </label>
            <input
              type="text"
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
              placeholder="e.g. Approved Q1 supplier agreement"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Search Tags (Comma separated)
            </label>
            <input
              type="text"
              value={uploadTagInput}
              onChange={(e) => setUploadTagInput(e.target.value)}
              placeholder="tax, 2025, wholesale, signed"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Drag-and-drop / Select Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-blue-200 dark:border-blue-900/60 hover:border-blue-500 dark:hover:border-blue-400 bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              Click to browse or drag & drop files here
            </p>
            <p className="text-[11px] text-slate-500">
              Files are automatically linked to your authenticated profile ID: <span className="font-mono">{currentUser?.id}</span>
            </p>
          </div>
        </div>

        {isUploading && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-xl text-xs font-bold flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Uploading & syncing document with Firebase storage...
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> File successfully uploaded and encrypted in your vault!
          </div>
        )}
      </div>

      {/* Files List and Filter Section */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search file name, notes, tags, or upload date..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories ({files.length})</option>
              <option value="document">📄 Documents</option>
              <option value="invoice">🧾 Invoices</option>
              <option value="image">🖼️ Images</option>
              <option value="receipt">💳 Receipts</option>
              <option value="backup">💾 Backups</option>
              <option value="other">📦 Other</option>
            </select>
          </div>
        </div>

        {/* Files Table */}
        {filteredFiles.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FolderLock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No files found</p>
            <p className="text-xs">Upload your first document above or adjust your search filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="pb-3">File / Asset Name</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Size</th>
                  <th className="pb-3">Upload Date & Metadata</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          {getFileIcon(file.fileType, file.category)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-bold text-slate-900 dark:text-white max-w-xs">{file.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{file.fileName}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {file.category}
                      </span>
                    </td>

                    <td className="py-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {formatFileSize(file.fileSize)}
                    </td>

                    <td className="py-3">
                      <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(file.createdAt).toLocaleDateString()} {new Date(file.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {file.notes && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                          {file.notes}
                        </div>
                      )}
                      {file.tags && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {file.tags.map((t, idx) => (
                            <span key={idx} className="text-[9px] px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-md">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-3 text-right space-x-1">
                      <button
                        onClick={() => setPreviewFile(file)}
                        title="Preview File"
                        className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownload(file)}
                        title="Download File"
                        className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(file)}
                        title="Delete File"
                        className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {getFileIcon(previewFile.fileType, previewFile.category)}
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {previewFile.fileName}
                </h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-4">
              {previewFile.category === 'image' || previewFile.fileType.startsWith('image/') ? (
                <img
                  src={previewFile.downloadUrl}
                  alt={previewFile.fileName}
                  className="max-h-[50vh] rounded-xl object-contain shadow-md"
                />
              ) : (
                <div className="text-center py-10 space-y-3">
                  <FileText className="w-16 h-16 mx-auto text-blue-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Binary / PDF Document File
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-md">
                    File Size: {formatFileSize(previewFile.fileSize)} • Type: {previewFile.fileType}
                  </p>
                  <button
                    onClick={() => handleDownload(previewFile)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Download Original File
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Owner ID: <b className="font-mono text-slate-700 dark:text-slate-200">{previewFile.userId}</b></span>
                <span>Uploaded: <b>{new Date(previewFile.createdAt).toLocaleString()}</b></span>
              </div>
              {previewFile.notes && (
                <div className="text-slate-600 dark:text-slate-300 pt-1">
                  <b>Notes:</b> {previewFile.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
