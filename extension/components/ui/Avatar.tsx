import { useState } from 'react'
import { isValidImageUrl, shouldShowDiceBearAvatar, generateDiceBearAvatar, getInitials } from '../../lib/utils/avatar'
import './Avatar.css'

interface AvatarProps {
  imgSrc?: string          // URL de l'image (depuis ENS ou autre)
  name?: string            // Nom ou adresse (seed pour DiceBear)
  avatarClassName?: string
  imageClassName?: string
  size?: 'small' | 'medium' | 'large'
}

const Avatar = ({
  imgSrc,
  name,
  avatarClassName = '',
  imageClassName = '',
  size = 'medium'
}: AvatarProps) => {
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  // Si on a une URL valide et pas d'erreur, afficher l'image
  if (isValidImageUrl(imgSrc) && !imageError) {
    return (
      <div className={`avatar avatar-${size} ${avatarClassName}`}>
        <img
          src={imgSrc}
          alt={name || 'Avatar'}
          className={`avatar-image ${imageClassName}`}
          onError={handleImageError}
        />
      </div>
    )
  }

  // Si on doit afficher un avatar DiceBear
  if (shouldShowDiceBearAvatar(name)) {
    const dicebearAvatar = generateDiceBearAvatar(name!)
    return (
      <div className={`avatar avatar-${size} ${avatarClassName}`}>
        <img
          src={dicebearAvatar}
          alt={name || 'Generated Avatar'}
          className={`avatar-image ${imageClassName}`}
        />
      </div>
    )
  }

  // Fallback: afficher un gradient avec initiales
  const initials = getInitials(name)
  return (
    <div className={`avatar avatar-${size} avatar-fallback ${avatarClassName}`}>
      <span className="avatar-initials">{initials}</span>
    </div>
  )
}

export default Avatar
