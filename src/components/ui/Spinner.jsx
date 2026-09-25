export default function Spinner({ size = 'md' }) {
  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className="flex justify-center items-center py-8">
      <div className={`${s[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
    </div>
  )
}
