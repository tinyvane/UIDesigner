'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  status: string;
  canvasWidth: number;
  canvasHeight: number;
  updatedAt: string;
  createdAt: string;
  _count?: { components: number };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status, router]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      });
      if (res.ok) {
        const project = await res.json();
        router.push(`/editor?projectId=${project.id}`);
      }
    } finally {
      setCreating(false);
      setShowNewDialog(false);
    }
  };

  const deleteProject = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const openProject = (id: string) => {
    router.push(`/editor?projectId=${id}`);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Dashboard Designer</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">My Projects</h2>
            <p className="text-sm text-gray-400 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/templates')}
              className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors"
            >
              Browse Templates
            </button>
            <button
              onClick={() => { setShowNewDialog(true); setNewName(''); setNewDesc(''); }}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              + New Project
            </button>
          </div>
        </div>

        {/* New Project Dialog */}
        {showNewDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewDialog(false)}>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-4">New Project</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Project name"
                  autoFocus
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && createProject()}
                />
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowNewDialog(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
                  Cancel
                </button>
                <button
                  onClick={createProject}
                  disabled={creating || !newName.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-500 text-lg mb-2">No projects yet</div>
            <p className="text-gray-600 text-sm mb-6">Create a new project or start from a template</p>
            <button
              onClick={() => { setShowNewDialog(true); setNewName(''); setNewDesc(''); }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-colors cursor-pointer"
                onClick={() => openProject(project.id)}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  {project.thumbnail ? (
                    <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-600 text-sm">
                      {project.canvasWidth} x {project.canvasHeight}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-white truncate">{project.name}</h3>
                      {project.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{project.description}</p>
                      )}
                    </div>
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        project.status === 'published'
                          ? 'bg-green-900/30 text-green-400'
                          : project.status === 'archived'
                            ? 'bg-gray-700/30 text-gray-500'
                            : 'bg-blue-900/30 text-blue-400'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProject(project.id, project.name); }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
