export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div className="spinner-border" style={{ color: '#48A111' }} role="status" />
      {text && <p className="mt-3 text-muted">{text}</p>}
    </div>
  )
}
