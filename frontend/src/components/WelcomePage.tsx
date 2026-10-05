import { SparkIcon, PixelCrab, BoxIcon, MicIcon, FolderIcon, PlusIcon } from './icons'
import { SelectProjectFolder } from '../../wailsjs/go/main/App'

interface Props {
  onNewChat: (gitRoot?: string) => void
  onSelectRepo?: (gitRoot: string | null) => void
}

export function WelcomePage({ onNewChat, onSelectRepo }: Props) {
  // Generate a random-looking heatmap matrix for placeholder
  const heatmapData = Array.from({ length: 7 }, () => 
    Array.from({ length: 24 }, () => Math.random())
  )

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bg-main relative font-sans text-text-main h-full">
      <div className="flex-1 overflow-y-auto px-10 pt-16 pb-32">
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <SparkIcon size={24} className="text-accent-primary" />
            <h1 className="text-2xl font-semibold tracking-tight text-text-main">
              What's up next, Musc?
            </h1>
          </div>

          {/* Dashboard Card */}
          <div className="bg-[#FAF9F5] dark:bg-[#1E1E1E] border border-border-subtle rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
            {/* Card Header Tabs */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 text-sm font-medium text-text-muted">
                <span className="text-text-main font-semibold bg-bg-hover px-2 py-0.5 rounded-md">Overview</span>
                <span className="hover:text-text-main cursor-pointer">Models</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <button className="px-2 py-0.5 rounded-md bg-bg-hover text-text-main font-medium">All</button>
                <button className="px-2 py-0.5 rounded-md hover:text-text-main">30d</button>
                <button className="px-2 py-0.5 rounded-md hover:text-text-main">7d</button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <StatBox label="Sessions" value="79" />
              <StatBox label="Messages" value="17,047" />
              <StatBox label="Total tokens" value="9.1M" />
              <StatBox label="Active days" value="56" />
              <StatBox label="Current streak" value="10d" />
              <StatBox label="Longest streak" value="25d" />
              <StatBox label="Peak hour" value="9 AM" />
              <StatBox label="Favorite model" value="Sonnet 4.6" />
            </div>

            {/* Heatmap */}
            <div className="flex flex-col gap-1 mb-4">
              {heatmapData.map((row, i) => (
                <div key={i} className="flex gap-1">
                  {row.map((val, j) => {
                    // Just some dummy logic to make the right side more active
                    let activity = 0
                    if (j > 15) {
                      activity = val > 0.7 ? 3 : val > 0.4 ? 2 : val > 0.2 ? 1 : 0
                    }
                    
                    const colors = [
                      'var(--bg-hover)', // level 0
                      'color-mix(in srgb, var(--accent-color) 40%, transparent)', // level 1
                      'color-mix(in srgb, var(--accent-color) 70%, transparent)', // level 2
                      'var(--accent-color)' // level 3
                    ]
                    
                    return (
                      <div 
                        key={j} 
                        className="w-3 h-3 rounded-[2px]" 
                        style={{ backgroundColor: colors[activity] }} 
                      />
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Fun Fact Footer */}
            <p className="text-xs text-text-faint font-medium">
              You've used ~88× more tokens than Harry Potter and the Philosopher's Stone.
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-main via-bg-main to-transparent">
        <div className="max-w-3xl mx-auto relative">
          
          <div className="absolute -top-10 right-0">
            <PixelCrab className="text-accent-primary" size={32} />
          </div>

          {/* Context Buttons */}
          <div className="flex items-center gap-2 mb-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-sidebar border border-border-subtle rounded-md text-xs font-medium text-text-muted hover:text-text-main transition-colors shadow-sm">
              <BoxIcon size={12} />
              Local
            </button>
            <button 
              onClick={async () => {
                try {
                  const dir = await SelectProjectFolder()
                  if (dir && onSelectRepo) onSelectRepo(dir)
                } catch (err) {
                  console.error('Failed to select folder:', err)
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-sidebar border border-border-subtle rounded-md text-xs font-medium text-text-muted hover:text-text-main transition-colors shadow-sm"
            >
              <FolderIcon size={12} />
              Select folder...
            </button>
          </div>

          {/* Main Input */}
          <div className="bg-bg-sidebar border border-border-subtle rounded-xl shadow-md overflow-hidden flex flex-col focus-within:border-accent-primary transition-colors">
            <div className="flex items-end px-4 py-3 min-h-[60px]">
              <textarea 
                placeholder="Describe a task or ask a question"
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-text-main placeholder:text-text-faint"
                rows={1}
              />
              <button 
                className="w-7 h-7 flex items-center justify-center rounded-md bg-bg-hover text-text-muted hover:text-text-main hover:bg-bg-active transition-colors shrink-0 mb-1"
                onClick={() => onNewChat()}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M14.5 4v6h-11v-6h11zm-8 4l-4-4 4-4v2h7v4h-7v2z" transform="matrix(-1 0 0 1 16 0)" />
                </svg>
              </button>
            </div>
            
            {/* Input Footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-border-subtle bg-bg-raised/50">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1.5 text-xs font-medium text-text-main">
                  Accept edits <PlusIcon size={10} className="text-text-faint" />
                </button>
                <button className="text-text-faint hover:text-text-main transition-colors">
                  <MicIcon size={12} />
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-text-main font-medium">Sonnet 4.6</span>
                <span className="text-text-faint flex items-center gap-1">
                  High <div className="w-1.5 h-1.5 rounded-full border border-text-faint" />
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-bg-raised/60 border border-border-subtle rounded-lg p-2.5 flex flex-col justify-between">
      <span className="text-[11px] font-medium text-text-muted mb-1">{label}</span>
      <span className="text-sm font-semibold text-text-main tracking-tight">{value}</span>
    </div>
  )
}
