// Surface container. Adds no layout of its own; other props go to the <div>.
function Card({ className = '', children, ...props }) {
  return (
    <div {...props} className={['card', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

export default Card
