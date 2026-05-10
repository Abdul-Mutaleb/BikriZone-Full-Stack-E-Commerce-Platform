export default function StarRating({ rating, onChange, readonly = false, size = 'md' }) {
  const stars = [1, 2, 3, 4, 5]
  const fontSize = size === 'lg' ? '1.6rem' : size === 'sm' ? '0.9rem' : '1.2rem'

  return (
    <span className="star-rating" style={{ fontSize }}>
      {stars.map((s) => (
        <span
          key={s}
          style={{ cursor: readonly ? 'default' : 'pointer', color: s <= rating ? '#ffc107' : '#dee2e6' }}
          onClick={() => !readonly && onChange && onChange(s)}
        >
          ★
        </span>
      ))}
    </span>
  )
}
