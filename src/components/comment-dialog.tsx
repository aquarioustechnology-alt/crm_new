"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MessageSquare, Paperclip, X, FileText, Image, File, Download, Calendar, User, Send, Bold, Italic, List, ListOrdered, Quote, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabaseClient } from "@/lib/client-supabase";

interface CommentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  attachments: CommentAttachment[];
}

interface CommentAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

interface Attachment {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

interface FileWithContext {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
  commentContent: string;
  commentId: string;
}

export function CommentDialog({ isOpen, onClose, leadId, leadName }: CommentDialogProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'comments' | 'files'>('comments');
  const [formMessage, setFormMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Load comments when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadComments();
      setFormMessage(null);
    }
  }, [isOpen, leadId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
        if (!data?.length) {
          setFormMessage({ type: 'info', text: 'Start the conversation by leaving the first note for this lead.' });
        } else {
          setFormMessage((current) => (current?.type === 'success' ? current : null));
        }
      }
    } catch (error) {
      console.error("Error loading comments:", error);
      setFormMessage({ type: 'error', text: 'We had trouble fetching comments. Please try again in a moment.' });
    } finally {
      setIsLoading(false);
    }
  };

  const serverUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!response.ok) {
      let message = 'Failed to upload file';
      try { message = (await response.json())?.error || message; } catch {}
      throw new Error(message);
    }
    const data = await response.json();
    return {
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      fileUrl: data.fileUrl,
    };
  };

  const handleFileUpload = async (file: File) => {
    // Client-side size validation (50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setUploadError(`"${file.name}" is a bit heavy. Please upload files up to 50MB.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    const prevContent = content; // Preserve typed comment in case of errors

    // Prefer direct-to-Supabase signed upload to bypass Vercel limits
    try {
      if (supabaseClient) {
        // 1) Ask server for a signed upload URL and storage path
        const res = await fetch('/api/upload/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileType: file.type }),
        });
        if (!res.ok) {
          throw new Error((await res.json().catch(() => ({}))).error || 'Failed to get signed upload URL');
        }
        const { bucket, path, token, publicUrl } = await res.json();

        // 2) Upload directly to Supabase using signed URL
        const { data: upData, error: upErr } = await supabaseClient.storage
          .from(bucket)
          .uploadToSignedUrl(path, token, file, { contentType: file.type, upsert: false });
        if (upErr) {
          // Attempt server fallback for smaller files
          const serverResult = await serverUpload(file).catch(() => null);
          if (!serverResult) throw new Error(upErr.message);
          setAttachments(prev => [...prev, serverResult]);
        } else {
          // 3) Use the provided publicUrl (works if bucket is public)
          const url = publicUrl || `${supabaseClient.storage.from(bucket).getPublicUrl(path).data.publicUrl}`;
          setAttachments(prev => [...prev, {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileUrl: url,
          }]);
        }
      } else {
        // Fallback: send to our server (works in local dev; may hit Vercel limits for large files)
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) {
          let message = 'Failed to upload file';
          try { message = (await response.json())?.error || message; } catch {}
          throw new Error(message);
        }
        const data = await response.json();
        setAttachments(prev => [...prev, {
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
          fileUrl: data.fileUrl,
        }]);
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadError(error?.message || 'Upload failed this time. Please try again.');
      if (editorRef.current) {
        editorRef.current.innerHTML = prevContent || '';
      }
      setContent(prevContent);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(handleFileUpload);
    }
    // Reset input value so selecting the same file again triggers onChange
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (fileType.includes("pdf")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setFormMessage({ type: 'error', text: 'Please add a quick note before submitting.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          attachments,
        }),
      });

      if (response.ok) {
        setContent("");
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
        setAttachments([]);
        setFormMessage({ type: 'success', text: 'Comment added successfully. We refreshed the timeline for you.' });
        await loadComments(); // Refresh comments
      } else {
        const error = await response.json();
        setFormMessage({ type: 'error', text: error.error || 'Unable to add your comment. Please try again.' });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      setFormMessage({ type: 'error', text: 'Something went wrong while saving. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertText = (text: string) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.innerHTML += text;
      }
      editorRef.current.focus();
    }
  };

  const formatText = (command: string, value: string = '') => {
    if (editorRef.current) {
      document.execCommand(command, false, value);
      editorRef.current.focus();
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // Remove placeholder text from content
      if (html.includes('class="placeholder"')) {
        setContent('');
      } else {
        setContent(html);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    
    if (editorRef.current) {
      // Insert the pasted content at cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        // Create a temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        
        // Convert common formatting to our supported format
        const formattedText = convertToSupportedFormat(tempDiv.innerHTML);
        
        const fragment = document.createRange().createContextualFragment(formattedText);
        range.insertNode(fragment);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      handleEditorInput();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'enter':
          // Allow normal enter behavior
          break;
        default:
          // Allow other shortcuts
          break;
      }
    }
  };

  const convertToSupportedFormat = (html: string): string => {
    // Convert common HTML formatting to our supported format
    return html
      .replace(/<strong>/g, '<b>')
      .replace(/<\/strong>/g, '</b>')
      .replace(/<em>/g, '<i>')
      .replace(/<\/em>/g, '</i>')
      .replace(/<ul>/g, '<ul style="margin-left: 20px; margin-top: 5px; margin-bottom: 5px;">')
      .replace(/<ol>/g, '<ol style="margin-left: 20px; margin-top: 5px; margin-bottom: 5px;">')
      .replace(/<li>/g, '<li style="margin-bottom: 3px;">')
      .replace(/<blockquote>/g, '<div style="border-left: 3px solid #6b7280; padding-left: 10px; margin: 10px 0; color: #9ca3af; font-style: italic;">')
      .replace(/<\/blockquote>/g, '</div>')
      .replace(/<br\s*\/?>/g, '<br>')
      .replace(/<p>/g, '<div style="margin-bottom: 8px;">')
      .replace(/<\/p>/g, '</div>')
      .replace(/<h[1-6]>/g, '<div style="font-weight: bold; margin: 10px 0 5px 0;">')
      .replace(/<\/h[1-6]>/g, '</div>')
      .replace(/<code>/g, '<span style="background-color: #374151; padding: 2px 4px; border-radius: 3px; font-family: monospace;">')
      .replace(/<\/code>/g, '</span>');
  };

  // Extract all files from comments with context
  const getAllFiles = (): FileWithContext[] => {
    const files: FileWithContext[] = [];
    comments.forEach(comment => {
      comment.attachments.forEach(attachment => {
        // Clean HTML content for display
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = comment.content;
        const cleanContent = tempDiv.textContent || tempDiv.innerText || '';
        
        files.push({
          id: attachment.id,
          fileName: attachment.fileName,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
          fileUrl: attachment.fileUrl,
          uploadedAt: comment.createdAt,
          commentContent: cleanContent,
          commentId: comment.id,
        });
      });
    });
    return files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  };

  const allFiles = getAllFiles();

  async function openSignedDownload(urlOrPath: string, bucketHint?: string) {
    try {
      // If local-dev fallback stored to /uploads, open directly
      if (urlOrPath.startsWith('/uploads/')) {
        window.open(urlOrPath, '_blank');
        return;
      }
      const u = new URL(urlOrPath, window.location.origin);
      const params = new URLSearchParams();
      // Prefer passing the full URL so server can parse bucket/path
      params.set('url', u.toString());
      if (bucketHint) params.set('bucket', bucketHint);
      const res = await fetch(`/api/upload/signed-download?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        setUploadError(data?.error || 'Failed to create download link.');
      }
    } catch (e: any) {
      setUploadError(e?.message || 'Failed to create download link.');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] min-h-[600px] overflow-hidden flex flex-col bg-slate-900/95 border border-slate-700/70 rounded-2xl shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-slate-900/80" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="border-b border-slate-700/80 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-white text-xl font-semibold">
            <MessageSquare className="w-5 h-5" />
            Notes for {leadName}
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700/80 flex-shrink-0">
          <button
            onClick={() => setActiveTab('comments')}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-t-lg",
              activeTab === 'comments'
                ? "text-white border-b-2 border-purple-500 bg-slate-800"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Comments
            {comments.length > 0 && (
              <span className="bg-slate-600 text-slate-300 text-xs px-2 py-1 rounded-full">
                {comments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-t-lg",
              activeTab === 'files'
                ? "text-white border-b-2 border-purple-500 bg-slate-800"
                : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
            )}
          >
            <FolderOpen className="w-4 h-4" />
            Files
            {allFiles.length > 0 && (
              <span className="bg-slate-600 text-slate-300 text-xs px-2 py-1 rounded-full">
                {allFiles.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-6 overflow-hidden" style={{ minHeight: 0 }}>
          {activeTab === 'comments' ? (
            <>
              {/* Add Comment Section - Fixed at top */}
              <div className="border border-slate-600/70 rounded-2xl p-4 bg-slate-800 flex-shrink-0">
                <Label className="text-sm font-medium text-slate-300 mb-2 block">
                  Add New Comment
                </Label>

                {formMessage && (
                  <div
                    className={cn(
                      "mb-3 rounded-xl px-3 py-2 text-sm border",
                      formMessage.type === 'success' && 'border-green-500/30 bg-green-500/10 text-green-300',
                      formMessage.type === 'error' && 'border-red-500/30 bg-red-500/10 text-red-300',
                      formMessage.type === 'info' && 'border-slate-600/40 bg-slate-700/40 text-slate-200'
                    )}
                  >
                    {formMessage.text}
                  </div>
                )}

                {/* Rich Text Toolbar */}
                <div className="flex items-center gap-1 mb-3 p-2 bg-slate-700/80 rounded-lg">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText('bold')}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-600"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText('italic')}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-600"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-4 bg-slate-600 mx-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertText('• ')}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-600"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertText('1. ')}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-600"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertText('> ')}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-600"
                    title="Quote Block"
                  >
                    <Quote className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-4 bg-slate-600 mx-1" />
                  <span className="text-xs text-slate-500 px-2">
                    💡 Paste formatted content from Word, Google Docs, etc.
                  </span>
                </div>

                {/* Rich Text Editor */}
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (editorRef.current && editorRef.current.innerHTML === '') {
                      editorRef.current.innerHTML = '<span class="placeholder">Write your comment here... You can use formatting tools above or paste formatted content.</span>';
                    }
                  }}
                  onBlur={() => {
                    if (editorRef.current && editorRef.current.innerHTML === '<span class="placeholder">Write your comment here... You can use formatting tools above or paste formatted content.</span>') {
                      editorRef.current.innerHTML = '';
                    }
                  }}
                  className="min-h-[120px] resize-none bg-slate-700/70 border border-slate-600/60 text-white focus:border-purple-500 focus:ring-purple-500/20 p-3 rounded-xl outline-none"
                  style={{
                    minHeight: '120px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}
                />

                {/* File Attachments */}
                <div className="mt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-slate-300 border-slate-600/70 hover:bg-slate-600 hover:text-white hover:border-slate-500 disabled:opacity-60 rounded-xl"
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading…' : 'Attach Files'}
                  </Button>
                  {uploadError && (
                    <div className="mt-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                      {uploadError}
                    </div>
                  )}
                </div>

                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-slate-700/80 rounded-xl"
                      >
                        {getFileIcon(attachment.fileType)}
                        <span className="text-sm text-slate-300 flex-1 truncate">
                          {attachment.fileName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatFileSize(attachment.fileSize)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-red-400 hover:bg-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submit Button */}
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || isUploading || !content.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/25 disabled:opacity-60 rounded-xl"
                  >
                    {isSubmitting ? (
                      "Adding..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Add Comment
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Comments History - Scrollable */}
              <div className="flex-1 overflow-hidden" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <Label className="text-sm font-medium text-slate-300">
                    Comment History
                  </Label>
                  {comments.length > 2 && (
                    <span className="text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded-md">
                      Scroll to see all comments
                    </span>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800" style={{ minHeight: '150px' }}>
                  {isLoading ? (
                    <div className="text-center text-slate-400 py-8">
                      Loading comments...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center text-slate-400 py-12 border border-dashed border-slate-600/70 rounded-2xl">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                      <p className="font-medium text-slate-200">No notes yet</p>
                      <p className="text-sm text-slate-500 mt-1">Share the latest context or next steps for this lead.</p>
                    </div>
                  ) : (
                    <>
                      {comments.length > 3 && (
                        <div className="text-center text-xs text-slate-500 bg-slate-700/50 py-2 rounded-xl border border-slate-600/70">
                          💡 Scroll down to see older comments
                        </div>
                      )}
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="border border-slate-600/70 rounded-2xl p-4 bg-slate-800/80"
                        >
                          {/* Comment Header */}
                          <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-300">
                              Comment
                            </span>
                            <span className="text-xs text-slate-500">•</span>
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>

                          {/* Comment Content */}
                          <div 
                            className="text-sm text-slate-200 mb-3"
                            dangerouslySetInnerHTML={{ __html: comment.content }}
                          />

                          {/* Attachments */}
                          {comment.attachments.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-slate-400">
                                Attachments:
                              </div>
                              {comment.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center gap-2 p-2 bg-slate-700/80 rounded-xl"
                                >
                                  {getFileIcon(attachment.fileType)}
                                  <span className="text-sm text-slate-300 flex-1 truncate">
                                    {attachment.fileName}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {formatFileSize(attachment.fileSize)}
                                  </span>
                          <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openSignedDownload(attachment.fileUrl)}
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-blue-400 hover:bg-slate-600 rounded-full"
                                    title="Download"
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Files Tab Content */
            <div className="flex-1 overflow-hidden" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <Label className="text-sm font-medium text-slate-300">
                  File Repository
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {allFiles.length} file{allFiles.length !== 1 ? 's' : ''} uploaded
                  </span>
                  {allFiles.length > 0 && (
                    <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-full">
                      {allFiles.reduce((total, file) => total + file.fileSize, 0) > 1024 * 1024 
                        ? `${(allFiles.reduce((total, file) => total + file.fileSize, 0) / (1024 * 1024)).toFixed(1)} MB total`
                        : `${(allFiles.reduce((total, file) => total + file.fileSize, 0) / 1024).toFixed(1)} KB total`
                      }
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800" style={{ minHeight: '150px' }}>
                {allFiles.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p>No files uploaded yet.</p>
                    <p className="text-sm text-slate-500 mt-1">Files will appear here when uploaded with comments.</p>
                  </div>
                ) : (
                  allFiles.map((file) => (
                    <div
                      key={file.id}
                      className="border border-slate-600/70 rounded-2xl p-4 bg-slate-800/80 hover:bg-slate-750 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getFileIcon(file.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-200 truncate">
                              {file.fileName}
                            </span>
                            <span className="text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded">
                              {formatFileSize(file.fileSize)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>Uploaded {formatDate(file.uploadedAt)}</span>
                            <span>•</span>
                            <span className="truncate max-w-48" title={file.commentContent}>
                              From comment: {file.commentContent.substring(0, 50)}...
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openSignedDownload(file.fileUrl)}
                            className="text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-full"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
