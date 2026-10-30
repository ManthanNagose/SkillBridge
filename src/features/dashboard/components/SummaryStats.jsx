import { useServiceData } from '../../../hooks/useServiceData.js'
import { getDashboardSummary } from '../services/dashboardService.js'
import SectionError from '../../../components/common/SectionError.jsx'

// FR-DASH-02. "Tasks completed this week" isn't shown: the service can't
// provide it until the schema records when a task was completed (PRD B-01).
const STATS = [
  { key: 'activeProjectCount', label: 'Active projects' },
  { key: 'myOpenTaskCount', label: 'My open tasks' },
  { key: 'myOverdueTaskCount', label: 'My overdue tasks', alert: true },
]

function SummaryStats() {
  const { status, data, error, retry } = useServiceData(getDashboardSummary)

  return (
    <section className="dashboard-section" aria-labelledby="dashboard-summary-title" aria-busy={status === 'loading'}>
      <h2 id="dashboard-summary-title" className="visually-hidden">
        Summary
      </h2>
      {status === 'error' ? (
        <SectionError error={error} what="your summary" onRetry={retry} />
      ) : (
        <dl className="dashboard-stats">
          {STATS.map(({ key, label, alert }) => (
            <div
              key={key}
              className="card dashboard-stat"
              data-alert={alert && status === 'success' && data[key] > 0}
            >
              <dt>{label}</dt>
              <dd>
                {/* Skeleton while loading, never a misleading 0 (PRD section 07). */}
                {status === 'success' ? (
                  data[key]
                ) : (
                  <span className="skeleton dashboard-stat-skeleton">
                    <span className="visually-hidden">Loading</span>
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

export default SummaryStats
