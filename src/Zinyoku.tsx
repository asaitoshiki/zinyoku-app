import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const TITLES = [
  { days: 0,    name: '本能の奴隷' },
  { days: 1,    name: '目覚めの朝' },
  { days: 3,    name: '意志の芽生え' },
  { days: 5,    name: '欲望との交渉人' },
  { days: 7,    name: '一週間の侍' },
  { days: 10,   name: '脳内革命者' },
  { days: 14,   name: '二週間の求道者' },
  { days: 21,   name: '三週間の哲学者' },
  { days: 30,   name: '月の修行僧' },
  { days: 45,   name: '欲を超えた者' },
  { days: 60,   name: '二ヶ月の賢者' },
  { days: 75,   name: '精神の錬金術師' },
  { days: 90,   name: '三ヶ月の仙人' },
  { days: 120,  name: '四季を越えた武人' },
  { days: 150,  name: '半年の覚醒者' },
  { days: 180,  name: '半年の伝説' },
  { days: 270,  name: '九ヶ月の神話' },
  { days: 365,  name: '一年の聖人' },
  { days: 500,  name: '時を超えた存在' },
  { days: 1000, name: '宇宙と同化した者' },
]

function getTitle(days: number) {
  let current = TITLES[0]
  for (const t of TITLES) { if (days >= t.days) current = t; else break }
  const nextIdx = TITLES.indexOf(current) + 1
  return { current, next: TITLES[nextIdx] || null }
}

type Rec = { startDate: string; endDate: string; days: number }
type ThemeKey = 'cyber' | 'dark' | 'light' | 'blue' | 'purple' | 'green' | 'space' | 'jungle' | 'vintage'
type Theme = { name: string; bg: string; bg2: string; card: string; text: string; sub: string; accent: string; accent2: string; border: string }

const THEMES: { [K in ThemeKey]: Theme } = {
  cyber:   { name: 'サイバー',   bg: '#050510', bg2: '#0a0a1f', card: '#0d0d28', text: '#e0f0ff', sub: '#5080a0', accent: '#00f0ff', accent2: '#ff00aa', border: '#00f0ff44' },
  dark:    { name: 'ダーク',     bg: '#111111', bg2: '#1a1a1a', card: '#1c1c1c', text: '#ffffff', sub: '#888888', accent: '#4a9eff', accent2: '#4aff80', border: '#ffffff22' },
  light:   { name: 'ライト',     bg: '#f0f4f8', bg2: '#ffffff', card: '#ffffff', text: '#111827', sub: '#6b7280', accent: '#2979ff', accent2: '#00c853', border: '#e5e7eb' },
  blue:    { name: 'ブルー',     bg: '#020b18', bg2: '#041428', card: '#0a2040', text: '#c8e6ff', sub: '#6fa8d0', accent: '#00b4ff', accent2: '#00ffcc', border: '#00b4ff33' },
  purple:  { name: 'パープル',   bg: '#0e0718', bg2: '#180d2e', card: '#1e1040', text: '#e8d5ff', sub: '#9b72cf', accent: '#c084fc', accent2: '#f472b6', border: '#c084fc33' },
  green:   { name: 'グリーン',   bg: '#071a0e', bg2: '#0d2b16', card: '#123320', text: '#d4f5d4', sub: '#6daf6d', accent: '#4ade80', accent2: '#a3e635', border: '#4ade8033' },
  space:   { name: '宇宙',       bg: '#04040f', bg2: '#0a0a1e', card: '#0f0f2e', text: '#e0e0ff', sub: '#7070bb', accent: '#818cf8', accent2: '#f472b6', border: '#818cf833' },
  jungle:  { name: 'ジャングル', bg: '#0a1208', bg2: '#121e0e', card: '#1a2a14', text: '#e0f0d0', sub: '#7a9a60', accent: '#86efac', accent2: '#fde047', border: '#86efac33' },
  vintage: { name: '古着',       bg: '#1a1510', bg2: '#231e17', card: '#2e2620', text: '#f0e6d0', sub: '#a09070', accent: '#d4a76a', accent2: '#c084a0', border: '#d4a76a33' },
}

const DEFAULT_MESSAGES = [
  'だめだよ、我慢して！',
  'ここで負けたら後悔するよ？',
  'あなたならできる、信じてる！',
  'もう少しだけ耐えて！',
  '記録を守って！',
]

// ===================================================
// ランキング用プロフィール設定モーダル
// 初めてRANKタブを開いたときだけ表示される
// モーダル = 画面全体を覆うポップアップのこと
// ===================================================
function RankProfileModal({
  s,
  userId,
  onSave,
}: {
  s: Theme
  userId: string
  onSave: (rankName: string, rankImage: string) => void
}) {
  const [rankName, setRankName] = useState('')
  const [rankImage, setRankImage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setRankImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!rankName.trim()) { setError('名前を入力してください'); return }
    setSaving(true)
    setError('')

    // Supabaseに保存（upsert = あれば更新、なければ挿入）
    const { error: saveError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: rankName.trim(),
        rank_name: rankName.trim(),
        rank_image: rankImage,
      })

    if (saveError) {
      // エラーコード23505 = UNIQUE制約違反（重複している）
      if (saveError.code === '23505') {
        setError('その名前は既に使われています。別の名前を選んでください。')
      } else {
        setError('保存に失敗しました。もう一度お試しください。')
      }
      setSaving(false)
      return
    }

    onSave(rankName.trim(), rankImage)
  }

  return (
    // 画面全体を覆う半透明の黒背景（オーバーレイ）
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: s.card, border: `1px solid ${s.accent}`,
        borderRadius: 20, padding: 24, width: '100%', maxWidth: 360,
        fontFamily: "'Courier New', monospace",
      }}>
        {/* タイトル */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>👑</div>
          <div style={{ fontSize: 13, color: s.accent, letterSpacing: 3, marginBottom: 4 }}>
            RANKING PROFILE
          </div>
          <div style={{ fontSize: 11, color: s.sub, lineHeight: 1.6 }}>
            ランキングに表示される<br />名前とアイコンを設定してください
          </div>
        </div>

        {/* アイコン設定（タップして画像を選ぶ） */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 80, height: 80, borderRadius: '50%',
              border: `2px dashed ${s.accent}88`,
              margin: '0 auto 8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', overflow: 'hidden',
              background: s.bg2,
            }}
          >
            {rankImage
              ? <img src={rankImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 32 }}>👤</span>
            }
          </div>
          <div style={{ fontSize: 10, color: s.sub }}>
            タップして画像を設定（任意）
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
        </div>

        {/* 名前入力 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: s.sub, letterSpacing: 2, marginBottom: 6 }}>
            ランキング表示名 *
          </div>
          <input
            value={rankName}
            onChange={e => setRankName(e.target.value)}
            placeholder="例: taro_fighter"
            maxLength={20}
            style={{
              width: '100%', padding: 10,
              background: s.bg2, border: `1px solid ${s.border}`,
              borderRadius: 8, color: s.text,
              fontFamily: 'inherit', fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: 10, color: s.sub, marginTop: 4 }}>
            ※ 他のユーザーに公開されます（最大20文字）
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div style={{
            fontSize: 11, color: '#ff6688', marginBottom: 12,
            padding: '8px 12px', background: '#ff004411', borderRadius: 8,
          }}>
            {error}
          </div>
        )}

        {/* 参加ボタン */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: 12,
            background: 'transparent', border: `1px solid ${s.accent}`,
            borderRadius: 8, color: s.accent,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', fontSize: 12, letterSpacing: 2,
          }}
        >
          {saving ? '[ SAVING... ]' : '[ ランキングに参加する ]'}
        </button>

        {/* スキップボタン */}
        <button
          onClick={() => onSave('', '')}
          style={{
            width: '100%', marginTop: 10, padding: 8,
            background: 'none', border: 'none',
            color: s.sub, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 11,
          }}
        >
          今はしない（ランキングに参加しない）
        </button>
      </div>
    </div>
  )
}

// ===================================================
// チュートリアルモーダル
// 初回起動時に表示。SYSタブからも開ける。
// ===================================================
const TUTORIAL_PAGES = [
  {
    icon: '◈',
    title: 'ABSTINENCE.SYS へようこそ',
    body: '禁欲の継続日数をリアルタイムで記録するアプリです。\nあなたの意志を数字で可視化し、成長を実感しましょう。',
  },
  {
    icon: '⬡',
    title: 'HOME — メイン画面',
    body: '現在の継続日数・時間・分・秒をリアルタイムで表示します。\n\n【 ↺ RESET 】\n失敗したときに押してください。記録に残り、DATAタブで確認できます。\n\n【 ◎ TARGET 】\n目標日数を設定できます。\n\n【 ↗ SHARE 】\n達成日数をシェアできます。',
  },
  {
    icon: '▤',
    title: 'DATA — 統計',
    body: '【 AVG DURATION 】\n過去の記録の平均継続日数です。リセットするたびに更新されます。\n\n【 TOP 5 】\n過去の記録の中で日数が長かった上位5件です。\n\n【 ALL RECORDS 】\nリセットするたびに追加される全記録の一覧です。',
  },
  {
    icon: '▦',
    title: 'LOG — カレンダー',
    body: '日ごとの状況をカレンダーで確認できます。\n\n■ 成功した日（アクセントカラー）\n■ 失敗した日（赤）\n■ 今日（別カラー）',
  },
  {
    icon: '◈',
    title: 'TITLE — 称号システム',
    body: '継続日数に応じて称号が解放されます。\n全20段階あり、長く続けるほど上位の称号を獲得できます。\n\n例：\n0日 → 本能の奴隷\n7日 → 一週間の侍\n30日 → 月の修行僧\n365日 → 一年の聖人',
  },
  {
    icon: '👑',
    title: 'RANK — グローバルランキング',
    body: 'ログインユーザーが参加できる世界ランキングです。\n「最長連続記録」で順位が決まります。\n\nアカウント登録してRANKタブを開くと、プロフィール設定画面が表示されます。',
  },
  {
    icon: '⚙',
    title: 'SYS — 設定',
    body: 'アプリのテーマを9種類から選択できます。\n\nサイバー / ダーク / ライト / ブルー / パープル / グリーン / 宇宙 / ジャングル / 古着\n\nこのチュートリアルはSYSタブからいつでも見直せます。',
  },
]

function TutorialModal({ s, onClose }: { s: Theme; onClose: () => void }) {
  const [page, setPage] = useState(0)
  const total = TUTORIAL_PAGES.length
  const p = TUTORIAL_PAGES[page]
  const isLast = page === total - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: s.card, border: `1px solid ${s.accent}`,
        borderRadius: 20, padding: 28, width: '100%', maxWidth: 360,
        fontFamily: "'Courier New', monospace",
      }}>
        {/* ページインジケーター（何ページ目かを点で表示） */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {TUTORIAL_PAGES.map((_, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: i === page ? s.accent : s.border,
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* アイコン */}
        <div style={{ textAlign: 'center', fontSize: 32, marginBottom: 12, color: s.accent, filter: `drop-shadow(0 0 8px ${s.accent})` }}>
          {p.icon}
        </div>

        {/* タイトル */}
        <div style={{ textAlign: 'center', fontSize: 13, color: s.accent, letterSpacing: 2, marginBottom: 16 }}>
          {p.title}
        </div>

        {/* 本文（\n で改行） */}
        <div style={{ fontSize: 12, color: s.sub, lineHeight: 1.8, whiteSpace: 'pre-line', minHeight: 120 }}>
          {p.body}
        </div>

        {/* ボタン */}
        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          {page > 0 && (
            <button onClick={() => setPage(p => p - 1)} style={{
              flex: 1, padding: 12, background: 'transparent',
              border: `1px solid ${s.border}`, borderRadius: 8,
              color: s.sub, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, letterSpacing: 1,
            }}>
              ← BACK
            </button>
          )}
          <button onClick={isLast ? onClose : () => setPage(p => p + 1)} style={{
            flex: 2, padding: 12, background: 'transparent',
            border: `1px solid ${s.accent}`, borderRadius: 8,
            color: s.accent, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, letterSpacing: 2,
          }}>
            {isLast ? '[ はじめる ]' : 'NEXT →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ===================================================
// ランキングタブ
// ===================================================
function RankingTab({
  s,
  userId,
  rankName,
  onEditProfile,
}: {
  s: Theme
  userId: string | null
  rankName: string
  rankImage: string
  onEditProfile: () => void
}) {
  const [ranking, setRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('ranking')
        .select('*')
        .order('best_streak', { ascending: false })
        .limit(100)

      if (data) {
        setRanking(data)
        if (rankName) {
          const myIdx = data.findIndex((r: any) => r.rank_name === rankName)
          if (myIdx !== -1) setMyRank(myIdx + 1)
        }
      }
      setLoading(false)
    }
    load()
  }, [rankName])

  const glowStyle = { textShadow: `0 0 10px ${s.accent}` }
  const cardStyle: React.CSSProperties = {
    background: s.card, border: `1px solid ${s.border}`,
    borderRadius: 16, padding: 16, marginBottom: 12,
  }

  const medal = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  if (loading) return (
    <div style={{ textAlign: 'center', color: s.sub, padding: 40, fontSize: 12, letterSpacing: 2 }}>
      LOADING...
    </div>
  )

  return (
    <div>
      {/* ヘッダーカード */}
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <div style={{ fontSize: 9, color: s.sub, letterSpacing: 4, marginBottom: 8 }}>
          GLOBAL RANKING
        </div>
        <div style={{ fontSize: 11, color: s.sub }}>
          基準：最長連続記録 // {ranking.length} USERS
        </div>

        {/* 自分の順位 */}
        {myRank && (
          <div style={{ marginTop: 12, fontSize: 13, color: s.accent, ...glowStyle }}>
            あなたの順位：{myRank}位
          </div>
        )}

        {/* プロフィール編集ボタン */}
        {userId && (
          <button
            onClick={onEditProfile}
            style={{
              marginTop: 12, padding: '6px 16px',
              background: 'transparent', border: `1px solid ${s.accent}88`,
              borderRadius: 20, color: s.sub,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, letterSpacing: 1,
            }}
          >
            {rankName ? '✏ プロフィールを変更' : '👑 ランキングに参加する'}
          </button>
        )}

        {!userId && (
          <div style={{ marginTop: 12, fontSize: 11, color: s.sub }}>
            ※ ランキングに参加するにはログインが必要です
          </div>
        )}
      </div>

      {/* ランキングリスト */}
      {ranking.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: s.sub, fontSize: 12 }}>
          // NO DATA YET
        </div>
      ) : (
        <div style={cardStyle}>
          {ranking.map((r, i) => {
            const rank = i + 1
            const isMe = rankName !== '' && r.rank_name === rankName
            return (
              <div key={r.user_number} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 8px',
                borderBottom: `1px solid ${s.border}`,
                background: isMe ? s.accent + '11' : 'transparent',
                borderRadius: isMe ? 8 : 0,
              }}>

                {/* 順位番号 or メダル */}
                <div style={{ width: 28, textAlign: 'center', fontSize: 14, flexShrink: 0 }}>
                  {medal(rank) || <span style={{ color: s.sub, fontSize: 11 }}>{rank}</span>}
                </div>

                {/* ランキング用アイコン */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  border: `1px solid ${s.border}`, overflow: 'hidden',
                  background: s.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {r.rank_image
                    ? <img src={r.rank_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 18 }}>👤</span>
                  }
                </div>

                {/* 名前と登録番号 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    color: isMe ? s.accent : s.text,
                    fontWeight: isMe ? 700 : 400,
                    ...(isMe ? glowStyle : {}),
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {r.rank_name}
                    {isMe && <span style={{ fontSize: 10, marginLeft: 6, color: s.accent }}>← YOU</span>}
                  </div>
                  <div style={{ fontSize: 9, color: s.sub, marginTop: 2 }}>
                    No.{r.user_number}
                  </div>
                </div>

                {/* 最長記録と現在のストリーク */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, color: s.accent, ...glowStyle }}>
                    {r.best_streak}
                    <span style={{ fontSize: 10, color: s.sub }}> DAYS</span>
                  </div>
                  <div style={{ fontSize: 9, color: s.sub, marginTop: 2 }}>
                    現在: {r.current_streak}日
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ===================================================
// メインコンポーネント
// ===================================================
export default function Zinyoku({ userId, onLoginRequest }: { userId: string | null; onLoginRequest?: () => void }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => (localStorage.getItem('sz_theme') as ThemeKey) || 'cyber')
  const [startDate, setStartDate] = useState(() => localStorage.getItem('sz_start') || new Date().toISOString())
  const [goal, setGoal] = useState(() => Number(localStorage.getItem('sz_goal') || 10))
  const [records, setRecords] = useState<Rec[]>(() => JSON.parse(localStorage.getItem('sz_records') || '[]'))
  const [tab, setTab] = useState<'home' | 'calendar' | 'data' | 'title' | 'settings' | 'ranking'>('home')
  const [now, setNow] = useState(Date.now())
  const [showGoal, setShowGoal] = useState(false)
  const [goalInput, setGoalInput] = useState(String(goal))
  const [calMonth, setCalMonth] = useState(new Date())
  const [charName, setCharName] = useState(() => localStorage.getItem('sz_charname') || '')
  const [userName, setUserName] = useState(() => localStorage.getItem('sz_username') || '')
  const [charImage, setCharImage] = useState(() => localStorage.getItem('sz_charimage') || '')
  const [messages, setMessages] = useState<string[]>(() => JSON.parse(localStorage.getItem('sz_messages') || JSON.stringify(DEFAULT_MESSAGES)))
  const [msgIdx, setMsgIdx] = useState(0)
  const [newMsg, setNewMsg] = useState('')
  const [editingChar, setEditingChar] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // チュートリアル：初回起動時のみ表示（sz_tutorial_done がなければ初回とみなす）
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('sz_tutorial_done'))

  const closeTutorial = () => {
    localStorage.setItem('sz_tutorial_done', '1')
    setShowTutorial(false)
  }

  // ランキング用プロフィール（サポートキャラとは別）
  const [rankName, setRankName] = useState(() => localStorage.getItem('sz_rankname') || '')
  const [rankImage, setRankImage] = useState(() => localStorage.getItem('sz_rankimage') || '')
  // showRankModal = プロフィール設定モーダルを表示するかどうか
  const [showRankModal, setShowRankModal] = useState(false)

  const s = THEMES[themeKey]

  // RANKタブを開いたとき、未設定かつログイン済みなら初回モーダルを表示
  // sz_rank_setup（localStorage）が 'done' でなければ初回とみなす
  useEffect(() => {
    if (tab === 'ranking' && userId) {
      const alreadySetup = localStorage.getItem('sz_rank_setup')
      if (!alreadySetup) {
        setShowRankModal(true)
      }
    }
  }, [tab, userId])

  // タイマー
  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now())
      setMsgIdx(i => (i + 1) % messages.length)
    }, 5000)
    return () => clearInterval(t)
  }, [messages.length])

  useEffect(() => { localStorage.setItem('sz_theme', themeKey) }, [themeKey])
  useEffect(() => { localStorage.setItem('sz_start', startDate) }, [startDate])
  useEffect(() => { localStorage.setItem('sz_goal', String(goal)) }, [goal])
  useEffect(() => { localStorage.setItem('sz_records', JSON.stringify(records)) }, [records])
  useEffect(() => { localStorage.setItem('sz_charname', charName) }, [charName])
  useEffect(() => { localStorage.setItem('sz_username', userName) }, [userName])
  useEffect(() => { localStorage.setItem('sz_charimage', charImage) }, [charImage])
  useEffect(() => { localStorage.setItem('sz_messages', JSON.stringify(messages)) }, [messages])
  useEffect(() => { localStorage.setItem('sz_rankname', rankName) }, [rankName])
  useEffect(() => { localStorage.setItem('sz_rankimage', rankImage) }, [rankImage])

  // Supabaseからデータ読み込み
  useEffect(() => {
    if (!userId) { setLoaded(true); return }
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) {
        if (data.start_date) setStartDate(data.start_date)
        if (data.goal_days) { setGoal(data.goal_days); setGoalInput(String(data.goal_days)) }
        if (data.char_name) setCharName(data.char_name)
        if (data.username) setUserName(data.username)
        if (data.char_image) setCharImage(data.char_image)
        if (data.messages?.length) setMessages(data.messages)
        // ランキング用プロフィールをDBから読み込む
        if (data.rank_name) {
          setRankName(data.rank_name)
          localStorage.setItem('sz_rankname', data.rank_name)
          localStorage.setItem('sz_rank_setup', 'done') // 設定済みフラグをセット
        }
        if (data.rank_image) {
          setRankImage(data.rank_image)
          localStorage.setItem('sz_rankimage', data.rank_image)
        }
      }
      const { data: recs } = await supabase
        .from('records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (recs) setRecords(recs.map(r => ({
        startDate: r.start_date,
        endDate: r.end_date,
        days: r.days,
      })))
      setLoaded(true)
    }
    load()
  }, [userId])

  // Supabaseにプロフィール保存
  useEffect(() => {
    if (!loaded || !userId) return
    supabase.from('profiles').upsert({
      id: userId,
      start_date: startDate,
      goal_days: goal,
      char_name: charName,
      username: userName,
      char_image: charImage,
      messages,
    }).then(() => {})
  }, [startDate, goal, charName, userName, charImage, messages, loaded, userId])

  // モーダルで「参加する」を押したときの処理
  const handleRankSave = (name: string, image: string) => {
    setRankName(name)
    setRankImage(image)
    localStorage.setItem('sz_rank_setup', 'done') // 次回からモーダルを出さない
    setShowRankModal(false)
  }

  const elapsed = now - new Date(startDate).getTime()
  const days = Math.floor(elapsed / 86400000)
  const hours = Math.floor((elapsed % 86400000) / 3600000)
  const mins = Math.floor((elapsed % 3600000) / 60000)
  const secs = Math.floor((elapsed % 60000) / 1000)
  const { current: currentTitle, next: nextTitle } = getTitle(days)
  const progress = Math.min((days / goal) * 100, 100)
  const today = new Date()

  const reset = async () => {
    if (!confirm('リセットしますか？記録に残ります。')) return
    const newRec = { startDate, endDate: new Date().toISOString(), days }
    setRecords(p => [...p, newRec])
    if (userId) {
      await supabase.from('records').insert({
        user_id: userId,
        start_date: startDate,
        end_date: newRec.endDate,
        days,
      })
    }
    setStartDate(new Date().toISOString())
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCharImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const failDates = new Set(records.map(r => r.endDate.slice(0, 10)))
  const successDates = new Set<string>()
  records.forEach(r => {
    for (let d = new Date(r.startDate); d <= new Date(r.endDate); d.setDate(d.getDate() + 1)) {
      const k = d.toISOString().slice(0, 10)
      if (!failDates.has(k)) successDates.add(k)
    }
  })
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1))
    successDates.add(d.toISOString().slice(0, 10))

  const glowStyle = { textShadow: `0 0 20px ${s.accent}, 0 0 40px ${s.accent}88` }
  const cardStyle: React.CSSProperties = { background: s.card, border: `1px solid ${s.border}`, borderRadius: 16, padding: 16, marginBottom: 12 }
  const currentMsg = messages.length > 0
    ? messages[msgIdx % messages.length].replace('{name}', userName)
    : ''

  const CyberButton = ({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) => (
    <button onClick={onClick} style={{
      background: 'transparent', border: `1px solid ${s.accent}88`, borderRadius: 8,
      padding: '14px 8px', cursor: 'pointer', color: s.text, fontSize: 11,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      position: 'relative', overflow: 'hidden',
    }}>
      <span style={{ fontSize: 24, filter: `drop-shadow(0 0 6px ${s.accent})` }}>{icon}</span>
      <span style={{ color: s.sub, letterSpacing: 1 }}>{label}</span>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)` }} />
    </button>
  )

  if (!loaded) return (
    <div style={{ background: s.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.accent, fontFamily: 'monospace' }}>
      LOADING...
    </div>
  )

  return (
    <div style={{ background: s.bg, minHeight: '100vh', color: s.text, fontFamily: "'Courier New', monospace", paddingBottom: 80 }}>

      {/* チュートリアルモーダル（初回のみ表示。SYSタブからも開ける） */}
      {showTutorial && <TutorialModal s={s} onClose={closeTutorial} />}

      {/* ランキングプロフィール設定モーダル（初回のみ表示） */}
      {showRankModal && userId && (
        <RankProfileModal
          s={s}
          userId={userId}
          onSave={handleRankSave}
        />
      )}

      {/* ヘッダー */}
      <div style={{ borderBottom: `1px solid ${s.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: s.accent, letterSpacing: 3 }}>ABSTINENCE.SYS</div>
        {userId
          ? <button onClick={logout} style={{ background: 'none', border: 'none', color: s.sub, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>LOGOUT</button>
          : <button onClick={onLoginRequest} style={{ background: 'none', border: `1px solid ${s.accent}88`, borderRadius: 6, padding: '4px 10px', color: s.accent, cursor: 'pointer', fontSize: 10, fontFamily: 'inherit', letterSpacing: 1 }}>[ LOGIN ]</button>
        }
      </div>

      {/* ゲストバナー */}
      {!userId && (
        <div style={{ background: s.accent + '11', borderBottom: `1px solid ${s.accent}33`, padding: '8px 16px', fontSize: 11, color: s.accent, textAlign: 'center', cursor: 'pointer' }} onClick={onLoginRequest}>
          ログインすると別端末でもデータを引き継げます →
        </div>
      )}

      <div style={{ padding: '1.5rem 1rem' }}>

        {/* ホーム */}
        {tab === 'home' && (
          <div>
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div onClick={() => setEditingChar(true)} style={{
                width: 64, height: 64, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                border: `2px solid ${s.accent}88`, cursor: 'pointer', background: s.bg2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {charImage
                  ? <img src={charImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 28 }}>👤</span>
                }
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: `8px solid ${s.accent}44` }} />
                <div style={{ background: s.bg2, border: `1px solid ${s.accent}44`, borderRadius: 10, padding: '10px 12px', fontSize: 13, lineHeight: 1.6 }}>
                  {charName && <div style={{ fontSize: 10, color: s.accent, letterSpacing: 2, marginBottom: 4 }}>{charName}</div>}
                  <div style={{ color: s.text }}>
                    {userName && <span style={{ color: s.accent2 }}>{userName}、</span>}
                    {currentMsg || 'メッセージを設定してください'}
                  </div>
                </div>
              </div>
            </div>

            {editingChar && (
              <div style={{ ...cardStyle, border: `1px solid ${s.accent}` }}>
                <div style={{ fontSize: 10, color: s.accent, letterSpacing: 3, marginBottom: 12 }}>// CHAR CONFIG</div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: s.sub, marginBottom: 4 }}>あなたの名前</div>
                    <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="例: たろう"
                      style={{ width: '100%', padding: 8, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 6, color: s.text, fontFamily: 'inherit', fontSize: 13 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: s.sub, marginBottom: 4 }}>キャラ名</div>
                    <input value={charName} onChange={e => setCharName(e.target.value)} placeholder="例: ミク"
                      style={{ width: '100%', padding: 8, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 6, color: s.text, fontFamily: 'inherit', fontSize: 13 }} />
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
                <button onClick={() => fileRef.current?.click()} style={{
                  width: '100%', padding: 8, background: 'transparent', border: `1px solid ${s.border}`,
                  borderRadius: 6, color: s.sub, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, marginBottom: 10
                }}>
                  {charImage ? '画像を変更' : '画像をアップロード'}
                </button>
                <div style={{ fontSize: 10, color: s.sub, letterSpacing: 2, marginBottom: 4 }}>// MESSAGES</div>
                <div style={{ fontSize: 10, color: s.sub, marginBottom: 8 }}>{'{name}'} と書くとあなたの名前に変わります</div>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1, padding: '6px 10px', background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 6, fontSize: 12, color: s.text }}>{m}</div>
                    <button onClick={() => setMessages(msgs => msgs.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', color: '#ff4466', cursor: 'pointer', fontSize: 16 }}>×</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="新しいメッセージ..."
                    style={{ flex: 1, padding: 8, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 6, color: s.text, fontFamily: 'inherit', fontSize: 12 }} />
                  <button onClick={() => { if (newMsg.trim()) { setMessages(m => [...m, newMsg.trim()]); setNewMsg('') } }}
                    style={{ padding: '8px 14px', background: 'transparent', border: `1px solid ${s.accent}`, borderRadius: 6, color: s.accent, cursor: 'pointer', fontFamily: 'inherit' }}>+</button>
                </div>
                <button onClick={() => setEditingChar(false)} style={{
                  marginTop: 12, width: '100%', padding: 10, background: 'transparent',
                  border: `1px solid ${s.accent}`, borderRadius: 6, color: s.accent, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 2
                }}>[ SAVE ]</button>
              </div>
            )}

            <div style={{ ...cardStyle, textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: 11, color: s.sub, letterSpacing: 4, marginBottom: 12 }}>DAYS // ELAPSED</div>
              <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1, color: s.accent, ...glowStyle }}>{String(days).padStart(2, '0')}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 12, fontSize: 13 }}>
                <span style={{ color: s.accent }}>{String(hours).padStart(2,'0')}</span>
                <span style={{ color: s.sub }}>:</span>
                <span style={{ color: s.accent }}>{String(mins).padStart(2,'0')}</span>
                <span style={{ color: s.sub }}>:</span>
                <span style={{ color: s.accent }}>{String(secs).padStart(2,'0')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 4 }}>
                {['HH','MM','SS'].map(l => <span key={l} style={{ fontSize: 9, color: s.sub, letterSpacing: 2 }}>{l}</span>)}
              </div>
            </div>

            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: s.sub, letterSpacing: 3, marginBottom: 4 }}>CURRENT TITLE</div>
              <div style={{ fontSize: 22, color: s.accent2, fontWeight: 700 }}>{currentTitle.name}</div>
              {nextTitle && <div style={{ fontSize: 11, color: s.sub, marginTop: 4 }}>→ 「{nextTitle.name}」まであと {nextTitle.days - days} 日</div>}
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: s.sub, marginBottom: 8 }}>
                <span>TARGET // {goal} DAYS</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div style={{ background: s.bg2, borderRadius: 2, height: 6, overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(90deg, ${s.accent}, ${s.accent2})`, width: `${progress}%`, height: '100%', borderRadius: 2, transition: 'width 1s', boxShadow: `0 0 8px ${s.accent}` }} />
              </div>
              <div style={{ fontSize: 11, color: s.sub, marginTop: 8, textAlign: 'center' }}>
                {days >= goal ? '[ MISSION COMPLETE ]' : `[ ${goal - days} DAYS REMAINING ]`}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <CyberButton icon="↺" label="RESET" onClick={reset} />
              <CyberButton icon="◎" label="TARGET" onClick={() => setShowGoal(v => !v)} />
              <CyberButton icon="↗" label="SHARE" onClick={() => navigator.share?.({ text: `禁欲${days}日達成！` })} />
            </div>

            {showGoal && (
              <div style={{ ...cardStyle, marginTop: 12 }}>
                <div style={{ fontSize: 11, color: s.sub, letterSpacing: 2, marginBottom: 8 }}>SET TARGET DAYS</div>
                <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                  style={{ width: '100%', padding: 10, background: s.bg2, border: `1px solid ${s.border}`, borderRadius: 6, color: s.accent, fontSize: 18, textAlign: 'center', fontFamily: 'inherit' }} />
                <button onClick={() => { setGoal(Number(goalInput)); setShowGoal(false) }}
                  style={{ marginTop: 8, width: '100%', padding: 10, background: 'transparent', border: `1px solid ${s.accent}`, borderRadius: 6, color: s.accent, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 2 }}>
                  [ CONFIRM ]
                </button>
              </div>
            )}
          </div>
        )}

        {/* カレンダー */}
        {tab === 'calendar' && (() => {
          const year = calMonth.getFullYear(), month = calMonth.getMonth()
          const first = new Date(year, month, 1).getDay()
          const dim = new Date(year, month + 1, 0).getDate()
          const cells: (number | null)[] = []
          for (let i = 0; i < first; i++) cells.push(null)
          for (let i = 1; i <= dim; i++) cells.push(i)
          const todayStr = today.toISOString().slice(0, 10)
          return (
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <button onClick={() => setCalMonth(new Date(year, month - 1))} style={{ background: 'none', border: 'none', color: s.accent, fontSize: 20, cursor: 'pointer' }}>‹</button>
                <span style={{ fontSize: 13, letterSpacing: 3, color: s.accent }}>{year}.{String(month+1).padStart(2,'0')}</span>
                <button onClick={() => setCalMonth(new Date(year, month + 1))} style={{ background: 'none', border: 'none', color: s.accent, fontSize: 20, cursor: 'pointer' }}>›</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
                {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
                  <div key={d} style={{ color: s.sub, fontSize: 9, padding: '4px 0', letterSpacing: 1 }}>{d}</div>
                ))}
                {cells.map((day, i) => {
                  if (!day) return <div key={`e${i}`} />
                  const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  const isToday = ds === todayStr
                  const isFail = failDates.has(ds)
                  const isSuccess = successDates.has(ds)
                  return (
                    <div key={day} style={{
                      height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 4, fontSize: 12,
                      background: isToday ? s.accent2 + '44' : isFail ? '#ff004422' : isSuccess ? s.accent + '22' : 'transparent',
                      border: isToday ? `1px solid ${s.accent2}` : isFail ? '1px solid #ff0044' : isSuccess ? `1px solid ${s.accent}88` : '1px solid transparent',
                      color: isToday ? s.accent2 : isFail ? '#ff6688' : isSuccess ? s.accent : s.sub,
                    }}>{day}</div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 10, color: s.sub }}>
                <span><span style={{ color: s.accent }}>■</span> 成功</span>
                <span><span style={{ color: '#ff6688' }}>■</span> 失敗</span>
                <span><span style={{ color: s.accent2 }}>■</span> 今日</span>
              </div>
            </div>
          )
        })()}

        {/* データ */}
        {tab === 'data' && (
          <div>
            <div style={cardStyle}>
              <div style={{ fontSize: 9, color: s.sub, letterSpacing: 3 }}>AVG DURATION</div>
              <div style={{ fontSize: 32, color: s.accent, marginTop: 4, ...glowStyle }}>
                {records.length ? (records.reduce((a,r) => a+r.days, 0)/records.length).toFixed(1) : '—'}
                <span style={{ fontSize: 14, color: s.sub }}> DAYS</span>
              </div>
            </div>
            {records.length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontSize: 9, color: s.sub, letterSpacing: 3, marginBottom: 10 }}>TOP 5</div>
                {[...records].sort((a,b) => b.days-a.days).slice(0,5).map((r,i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${s.border}` }}>
                    <span style={{ color: s.accent }}>{String(r.days).padStart(3,'0')} DAYS</span>
                    <span style={{ color: s.sub, fontSize: 11 }}>{r.endDate.slice(0,10)}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={cardStyle}>
              <div style={{ fontSize: 9, color: s.sub, letterSpacing: 3, marginBottom: 10 }}>ALL RECORDS</div>
              {records.length === 0 && <div style={{ color: s.sub, fontSize: 12 }}>// NO DATA</div>}
              {[...records].reverse().map((r,i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${s.border}` }}>
                  <span>{String(r.days).padStart(3,'0')} DAYS</span>
                  <span style={{ color: s.sub, fontSize: 11 }}>{r.endDate.slice(0,10)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 称号一覧 */}
        {tab === 'title' && (
          <div>
            <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: 9, color: s.sub, letterSpacing: 4, marginBottom: 12 }}>CURRENT RANK</div>
              <div style={{ fontSize: 36, color: s.accent2, fontWeight: 700, textShadow: `0 0 20px ${s.accent2}` }}>{currentTitle.name}</div>
              {nextTitle && <div style={{ fontSize: 11, color: s.sub, marginTop: 8 }}>NEXT: 「{nextTitle.name}」 — {nextTitle.days - days} DAYS</div>}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 9, color: s.sub, letterSpacing: 3, marginBottom: 10 }}>UNLOCKED</div>
              {TITLES.filter(t => days >= t.days).map(t => (
                <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${s.border}` }}>
                  <span style={{ color: s.accent }}>[ {t.name} ]</span>
                  <span style={{ color: s.sub, fontSize: 11 }}>{t.days} DAYS</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ランキング */}
        {tab === 'ranking' && (
          <RankingTab
            s={s}
            userId={userId}
            rankName={rankName}
            rankImage={rankImage}
            onEditProfile={() => setShowRankModal(true)}
          />
        )}

        {/* 設定 */}
        {tab === 'settings' && (
          <div>
            {/* チュートリアルボタン */}
            <button onClick={() => setShowTutorial(true)} style={{
              width: '100%', marginBottom: 20, padding: '14px 0',
              background: 'transparent', border: `1px solid ${s.accent}88`,
              borderRadius: 10, color: s.accent, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 11, letterSpacing: 2,
            }}>
              ◈ チュートリアルを見る
            </button>

            <div style={{ fontSize: 9, color: s.sub, letterSpacing: 4, marginBottom: 16 }}>// SELECT THEME</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {(Object.entries(THEMES) as [ThemeKey, Theme][]).map(([key, t]) => (
                <button key={key} onClick={() => setThemeKey(key)} style={{
                  background: t.bg, border: `1px solid ${themeKey === key ? t.accent : t.border}`,
                  borderRadius: 10, padding: 14, cursor: 'pointer', textAlign: 'left',
                  boxShadow: themeKey === key ? `0 0 12px ${t.accent}66` : 'none',
                }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {[t.accent, t.accent2, t.sub, t.bg2].map((c, i) => (
                      <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
                    ))}
                  </div>
                  <div style={{ color: t.text, fontSize: 12, fontFamily: "'Courier New', monospace" }}>{t.name}</div>
                  {themeKey === key && <div style={{ color: t.accent, fontSize: 9, marginTop: 4, letterSpacing: 2 }}>ACTIVE</div>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ボトムナビ */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: s.bg, borderTop: `1px solid ${s.border}`, display: 'flex' }}>
        {([
          { key: 'home',     label: 'HOME',  icon: '⬡' },
          { key: 'data',     label: 'DATA',  icon: '▤' },
          { key: 'calendar', label: 'LOG',   icon: '▦' },
          { key: 'title',    label: 'TITLE', icon: '◈' },
          { key: 'ranking',  label: 'RANK',  icon: '👑' },
          { key: 'settings', label: 'SYS',   icon: '⚙' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '10px 0', background: 'none', border: 'none',
            color: tab === t.key ? s.accent : s.sub, cursor: 'pointer', fontSize: 9,
            letterSpacing: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            borderTop: tab === t.key ? `2px solid ${s.accent}` : '2px solid transparent',
          }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
