import type { FeaturedList } from "~/hooks"

export interface ListCardProps {
  list: FeaturedList
  pos: number
  style: React.CSSProperties
  onSelect: () => void
  onOpenEntries: (e: React.MouseEvent) => void
}

const ListCard = ({
  list,
  pos,
  style,
  onSelect,
  onOpenEntries
}: ListCardProps) => (
  <div
    className="list-card"
    data-pos={String(pos)}
    style={style}
    onClick={pos !== 0 ? onSelect : undefined}
  >
    {/* Title row — always visible */}
    <div className="list-card-header">
      <div className="list-card-header-left">
        {list.image && (
          <img
            src={list.image}
            alt=""
            className="list-card-image"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
        )}
        <span className="list-card-title">{list.label}</span>
      </div>
    </div>

    {/* Body — always rendered, hidden via CSS when pos !== 0 */}
    <div className="list-card-content-visible">
      {/* Description */}
      {list.description && (
        <p className="list-card-description">{list.description}</p>
      )}

      {/* Tag chips */}
      {list.topSubjects.length > 0 && (
        <div className="list-chips-scroll">
          {list.topSubjects.map((subject, i) => (
            <span key={i} className="list-chip">
              {subject.image && (
                <img
                  src={subject.image}
                  alt=""
                  className="list-chip-image"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = "none"
                  }}
                />
              )}
              {subject.label}
            </span>
          ))}
        </div>
      )}

      {/* View all entries button */}
      <div className="list-open-btn">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenEntries(e)
          }}
        >
          View all entries &rarr;
        </button>
      </div>
    </div>
  </div>
)

export default ListCard
