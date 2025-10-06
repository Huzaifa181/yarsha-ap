import * as React from 'react'

import type { IconNames } from '../types'
import { exhaustiveTypeCheck } from '../utils/exhaustiveTypeCheck'
import PngIcon from '../assets/icons/PngIcon'
import { TextVariant } from '@/components/atoms'

export const Icon = ({
  iconName,
  isActive,
  normalColor,
  activeColor,
}: {
  iconName: IconNames | 'Close' | 'QuestionMark' | 'Backspace'
  isActive: boolean
  normalColor: string
  activeColor: string
}) => {
  const color = isActive ? activeColor : normalColor
  switch (iconName) {
    case 'Smile':
      return <TextVariant style={{fontSize:25}}>😀</TextVariant>
    case 'Trees':
      return <TextVariant style={{fontSize:25}}>🐶</TextVariant>
    case 'Pizza':
      return <TextVariant style={{fontSize:25}}>🍕</TextVariant>
    case 'Plane':
      return <TextVariant style={{fontSize:25}}>✈️</TextVariant>
    case 'Football':
      return <TextVariant style={{fontSize:25}}>⚽</TextVariant>
    case 'Lightbulb':
      return <TextVariant style={{fontSize:25}}>💡</TextVariant>
    case 'Flag':
      return <TextVariant style={{fontSize:25}}>🏳️</TextVariant>
    case 'Ban':
      return <TextVariant style={{fontSize:25}}>🚫</TextVariant>
    case 'Users':
      return <TextVariant style={{fontSize:25}}>👋</TextVariant>
    case 'Search':
      return <PngIcon fill={color} source={require('../assets/icons/search.png')} />
    case 'Close':
      return <PngIcon fill={color} source={require('../assets/icons/close.png')} />
    case 'Clock':
      return <TextVariant style={{fontSize:25}}>🕒</TextVariant>
    case 'QuestionMark':
      return <PngIcon fill={color} source={require('../assets/icons/questionMark.png')} />
    case 'Backspace':
      return <PngIcon fill={color} source={require('../assets/icons/backspace.png')} />
    default:
      exhaustiveTypeCheck(iconName)
      return null
  }
}
