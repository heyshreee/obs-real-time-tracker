import { Link } from 'react-router-dom';
import { ExternalLink, Calendar, BarChart2 } from 'lucide-react';

export default function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${encodeURIComponent(project.name)}`}
      className="group block p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
          {project.name}
        </h3>
        <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-slate-400 font-mono bg-slate-900/50 px-3 py-1.5 rounded-md border border-slate-800">
          {project.tracking_id}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(project.created_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <BarChart2 className="h-3 w-3" />
            View Stats
          </div>
        </div>
      </div>
    </Link>
  );
}
