import { Link } from 'react-router-dom';
import { DifficultyTag, MetaDot, MetaRow, TechChips, categoryLabel } from './ui.jsx';

export default function ProjectCard({ project, matchPercent, reasons }) {
  return (
    <li className="card-interactive group flex flex-col p-5">
      {matchPercent != null && (
        <div className="mb-4 flex items-baseline gap-2 border-b border-line pb-4">
          <span className="font-display text-3xl font-bold text-acid">{matchPercent}</span>
          <span className="font-mono text-xs text-ink-faint">% match</span>
        </div>
      )}

      <MetaRow>
        <DifficultyTag difficulty={project.difficulty} />
        <MetaDot />
        <span className="meta">{categoryLabel(project.category)}</span>
        {project.est_hours != null && (
          <>
            <MetaDot />
            <span className="meta">{project.est_hours}h</span>
          </>
        )}
      </MetaRow>

      <h3 className="mt-3 font-display text-lg leading-snug font-semibold text-ink">
        <Link to={`/projects/${project.id}`} className="transition-colors group-hover:text-acid">
          {project.title}
        </Link>
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-dim">{project.description}</p>

      {reasons?.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-l border-acid/30 pl-3">
          {reasons.slice(0, 3).map((reason) => (
            <li key={reason} className="text-xs leading-snug text-ink-dim">
              {reason}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <TechChips stack={project.tech_stack} limit={4} />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="meta">
          {project.step_count > 0 ? `${project.step_count} steps` : 'roadmap'}
        </span>
        <Link
          to={`/projects/${project.id}`}
          className="font-display text-sm font-semibold text-ink-dim transition-colors group-hover:text-acid"
        >
          Open →
        </Link>
      </div>
    </li>
  );
}
