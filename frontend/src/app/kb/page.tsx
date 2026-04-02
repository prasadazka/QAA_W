"use client";

import { useEffect, useState, useRef } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api, KBStats, KBDocument, KBCategory, KBSearchResult } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

const CHANNELS = [
  { value: "whatsapp_registration", label: "WhatsApp — Registration" },
  { value: "whatsapp_student_affairs", label: "WhatsApp — Student Affairs" },
  { value: "website_widget", label: "Website Widget" },
];

export default function KBPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [channel, setChannel] = useState("whatsapp_registration");
  const [stats, setStats] = useState<KBStats | null>(null);
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [categories, setCategories] = useState<KBCategory[]>([]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  // Search test
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<KBSearchResult | null>(null);

  // Delete
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
  }, [user, router]);

  const loadAll = async () => {
    try {
      const [s, d, c] = await Promise.all([
        api.get<KBStats>(`/api/kb/stats?channel=${channel}`),
        api.get<KBDocument[]>(`/api/kb/documents?channel=${channel}`),
        api.get<KBCategory[]>(`/api/kb/categories?channel=${channel}`),
      ]);
      setStats(s);
      setDocuments(d);
      setCategories(c);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAll();
    setSearchResult(null);
    setUploadResult(null);
  }, [channel]);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await api.upload<{
        status: string;
        file: string;
        type: string;
        entries_created: number;
        embeddings_generated: number;
        chunks?: number;
      }>("/api/kb/upload", file, { channel });
      setUploadResult(
        `Uploaded "${res.file}" — ${res.entries_created} entries created, ${res.embeddings_generated} embeddings generated` +
        (res.chunks ? ` (${res.chunks} chunks)` : "")
      );
      if (fileRef.current) fileRef.current.value = "";
      loadAll();
    } catch (err) {
      setUploadResult("Upload failed: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docName: string) => {
    if (!confirm(`Delete all KB entries from "${docName}"? This cannot be undone.`)) return;
    setDeleting(docName);
    try {
      await api.delete(`/api/kb/documents/${encodeURIComponent(docName)}?channel=${channel}`);
      loadAll();
    } catch (err) {
      alert("Delete failed: " + (err as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const res = await api.get<KBSearchResult>(
        `/api/kb/search?q=${encodeURIComponent(searchQuery)}&channel=${channel}`
      );
      setSearchResult(res);
    } catch (err) {
      alert("Search failed: " + (err as Error).message);
    } finally {
      setSearching(false);
    }
  };

  if (!stats) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-qaa-navy-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-qaa-navy-900">Knowledge Base</h2>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          {CHANNELS.map((ch) => (
            <option key={ch.value} value={ch.value}>{ch.label}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total Entries" value={stats.total_entries} />
        <StatCard label="With Embeddings" value={stats.with_embeddings} color="text-green-600" />
        <StatCard label="No Embeddings" value={stats.without_embeddings} color="text-amber-600" />
        <StatCard label="Total Hits" value={stats.total_hits} color="text-qaa-navy-500" />
        <StatCard label="Documents" value={stats.total_documents} color="text-qaa-navy-500" />
        <StatCard label="Categories" value={stats.total_categories} color="text-qaa-gold-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-qaa-navy-900 mb-4">Upload Document</h3>
            <p className="text-xs text-gray-400 mb-4">
              Supported: CSV/Excel (with question_en, question_ar, answer_en, answer_ar columns), PDF, TXT, Markdown, DOCX
            </p>
            <div className="flex gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls,.pdf,.txt,.md,.docx,.doc"
                className="flex-1 text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-qaa-navy-50 file:text-qaa-navy-700 hover:file:bg-qaa-navy-100"
              />
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="px-5 py-2 bg-qaa-navy-900 text-white text-sm font-medium rounded-lg hover:bg-qaa-navy-800 transition disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
            {uploadResult && (
              <div className={`mt-3 text-sm p-3 rounded-lg ${
                uploadResult.startsWith("Upload failed")
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-700"
              }`}>
                {uploadResult}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-qaa-navy-900">Uploaded Documents</h3>
            </div>
            {documents.length === 0 ? (
              <p className="p-6 text-center text-gray-400 text-sm">No documents uploaded yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {documents.map((doc) => (
                  <div key={doc.document} className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-qaa-navy-50 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-qaa-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-qaa-navy-900 truncate">{doc.document}</p>
                      <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                        <span>{doc.entries} entries</span>
                        <span>{doc.embedded} embedded</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.document)}
                      disabled={deleting === doc.document}
                      className="text-xs text-red-500 hover:text-red-700 transition disabled:opacity-50"
                    >
                      {deleting === doc.document ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Search Test */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-qaa-navy-900 mb-4">Test KB Search</h3>
            <form onSubmit={handleSearch} className="flex gap-3 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask a question to test..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-qaa-navy-500 bg-gray-50"
              />
              <button
                type="submit"
                disabled={searching}
                className="px-5 py-2 bg-qaa-gold-500 text-white text-sm font-medium rounded-lg hover:bg-qaa-gold-400 transition disabled:opacity-50"
              >
                {searching ? "..." : "Search"}
              </button>
            </form>
            {searchResult && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">
                  Threshold: {searchResult.threshold} | Embedding dims: {searchResult.query_embedding_dims}
                </p>
                {searchResult.results.length === 0 ? (
                  <p className="text-sm text-gray-400 py-3">No results found</p>
                ) : (
                  searchResult.results.map((r, i) => (
                    <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-gray-50">
                      <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                        r.similarity >= 0.7 ? "bg-green-100 text-green-700"
                          : r.similarity >= 0.5 ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        {(r.similarity * 100).toFixed(1)}%
                      </span>
                      <p className="text-sm text-gray-700">{r.question_en}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-qaa-navy-900">Categories</h3>
            </div>
            {categories.length === 0 ? (
              <p className="p-6 text-center text-gray-400 text-sm">No categories yet — upload a document to auto-create</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {categories.map((cat) => (
                  <div key={cat.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-qaa-navy-900">{cat.name_en}</p>
                      {cat.name_ar !== cat.name_en && (
                        <p className="text-xs text-gray-400" dir="rtl">{cat.name_ar}</p>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      cat.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                    }`}>
                      {cat.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}

function StatCard({
  label,
  value,
  color = "text-qaa-navy-900",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    </div>
  );
}
