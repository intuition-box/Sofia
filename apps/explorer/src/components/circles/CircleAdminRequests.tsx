/**
 * CircleAdminRequests — pending join requests for a group, with approve/reject.
 * Self-contained: renders nothing unless the viewer is an OWNER/ADMIN/MODERATOR
 * of the group (group-api `is-admin`). Approving creates the member's backend
 * Membership; they then mint the on-chain triple from the join gate.
 */
import {
  useGroupApplications,
  useIsGroupAdmin,
  useReviewApplication,
} from '@/hooks/useGroupAdmin'
import '@/components/styles/group-join.css'

function shortWallet(w: string): string {
  return `${w.slice(0, 6)}…${w.slice(-4)}`
}

export default function CircleAdminRequests({
  groupTermId,
}: {
  groupTermId: string | null
}) {
  const { isAdmin } = useIsGroupAdmin(groupTermId)
  const { applications, loading } = useGroupApplications(groupTermId, isAdmin)
  const { approve, reject, pending } = useReviewApplication(groupTermId)

  if (!isAdmin) return null

  return (
    <section className="gj-admin" aria-label="Join requests">
      <div className="gj-admin-head">
        <h3 className="gj-admin-title">Join requests</h3>
        {applications.length > 0 && (
          <span className="gj-admin-count">{applications.length}</span>
        )}
      </div>

      {loading ? (
        <p className="gj-admin-empty">Loading…</p>
      ) : applications.length === 0 ? (
        <p className="gj-admin-empty">No pending requests.</p>
      ) : (
        <ul className="gj-admin-list">
          {applications.map((a) => (
            <li key={a.id} className="gj-admin-row">
              <span className="gj-admin-wallet" title={a.wallet}>
                {shortWallet(a.wallet)}
              </span>
              <span className="gj-admin-when">
                {new Date(a.createdAt).toLocaleDateString()}
              </span>
              <div className="gj-admin-actions">
                <button
                  type="button"
                  className="gj-btn gj-btn-approve"
                  disabled={pending}
                  onClick={() => approve(a.id)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="gj-btn gj-btn-reject"
                  disabled={pending}
                  onClick={() => reject(a.id)}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
