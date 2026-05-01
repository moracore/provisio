import { useState, useMemo, useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

export function BuyWidget() {
  const [index, setIndex] = useState(0)

  const allItems = useLiveQuery(() => db.items.toArray()) ?? []

  const items = useMemo(
    () =>
      allItems
        .filter((i) => !i.bought && i.imageBlob)
        .sort((a, b) => a.dateAdded - b.dateAdded),
    [allItems],
  )

  if (items.length === 0) return null

  const current = items[index % items.length]
  const imgUrl = useObjectUrl(current.imageBlob)

  return (
    <div className="buy-widget" onClick={() => setIndex((i) => (i + 1) % items.length)}>
      {imgUrl && <img src={imgUrl} alt={current.name} />}
      <div className="buy-widget-info">
        <span className="buy-widget-name">{current.name}</span>
        {current.price > 0 && (
          <span className="buy-widget-price">
            £{current.price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
      </div>
    </div>
  )
}

function useObjectUrl(blob: Blob | null) {
  const urlRef = useRef<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    if (blob) {
      const u = URL.createObjectURL(blob)
      urlRef.current = u
      setUrl(u)
    } else {
      urlRef.current = null
      setUrl(null)
    }
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [blob])

  return url
}
